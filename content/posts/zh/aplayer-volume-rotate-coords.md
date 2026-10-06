---
title: "APlayer 音量条改造记：rotate 之后，所有坐标都反了"
date: 2026-10-02
description: "把竖直的音量条转成横向，视觉调整只花了十分钟，拖不动却又debug了两小时。一个旋转引发的坐标系事故，以及那些旋转会骗你的CSS 属性。"
categories: ["技术"]
tags: ["CSS", "Transform", "JavaScript", "APlayer", "踩坑实录"]
showToc: true
---

我博客的音乐播放器用的是 APlayer，一个老牌但很好用的 JS 音乐播放器。默认音量条是竖直的，我想要横的，贴在喇叭图标右边。

视觉部分改起来很顺利——加个 `rotate(90deg)` 就横过来了，加宽加长也很顺利。

然后用户说："音量条拖不动。"

## 反直觉的部分：rotate 只改变视觉，不改变布局

先说清楚最基础但最容易搞混的一点。`transform` 属于**渲染层**的变换，它改的是"怎么画"，不改"怎么排"。

而 APlayer 的拖动计算用的是**布局值**。我把它的源码翻出来看，原生音量拖动公式是：

```js
volume = 1 - (clientY - barTop) / bar.clientHeight
```

拆开看三个部分：

| 变量 | 属于 | 受 rotate 影响吗 |
|---|---|---|
| `clientY` | 鼠标坐标（屏幕空间） | 不受，但**轴向变了** |
| `barTop` | 元素位置（布局） | 受（元素包围盒变了） |
| `clientHeight` | **布局高度**，transform 不影响 | 不受 |

问题就在这里：

- 分母 `clientHeight` 是**布局**的竖直高度，永远不等于你看到的视觉厚度
- 分子 `clientY` 是鼠标的**竖直**坐标
- 但我看到的是一条**横向**的条

鼠标左右移动，`clientY` 几乎不变。所以左右拖的时候音量纹丝不动；上下挪一点点，音量会有一点微小变化——因为分子变了，虽然分母本身也不对。

这是"纯 CSS 修不了"的死结：公式的语义和视觉的轴向不匹配。

## 第二个坑：旋转后，width 才是"粗细"

改尺寸的时候我也翻车了一次。

第一次我想把条加粗，去改 `height`——因为旋转前 height 就是厚度。改完发现没变化。

原因在布局 vs 渲染的分离。旋转 90° 之后：

```
DOM 的 width   ──旋转──▶  视觉的厚度   （加粗改这个）
DOM 的 height  ──旋转──▶  视觉的长度   （加长改这个）
```

但 `getBoundingClientRect()` 返回的也是**旋转后的视觉尺寸**，而 `clientWidth` / `offsetWidth` 返回的是**布局尺寸**。两者对旋转后的元素是相反的。

我当时是量了 `getBoundingClientRect()` 发现"改了没反应"，才意识到该改的是另一个方向。这大概是 rotate 最容易骗人的地方——你量的是视觉值，你改的是布局值。

还有个连带问题：原生样式里轨道写死了 `height: 35px`。我把容器加长到 72px 之后，轨道还是 35px，两头会空出一截。得改成 `height: 100%`。

还有一点，APlayer 里 `.aplayer-volume` 这个类名**同时用在容器和填充元素上**：

```
.aplayer-volume-bar        ← 容器
  .aplayer-volume-bar-wrap  ← 旋转定位
    .aplayer-volume-bar     ← 轨道
      .aplayer-volume      ← 填充（进度）
```

最后一层的 class 名字和它的父级完全一样。所以加粗的时候两层 `width` 都要改，否则紫色填充比灰色轨道细——这个 bug 很隐蔽，因为细的那条正好是"已设置音量"的部分。

## 决定：不跟公式较劲，直接接管

看清公式之后，结论很清楚：这不是调 CSS 能修的，得自己算。

APlayer 的音量是公开 API，直接调它，UI 和 `audio.volume` 都会同步：

```js
ap.volume(0.6);   // APlayer 内部会 set audio.volume 并更新填充条
```

所以我的实现是：**用 `getBoundingClientRect()` 拿到旋转后的视觉矩形，按 `clientX` 算比例**。

```js
function setByX(x) {
  // 旋转后：rect.width = 视觉长度，rect.height = 视觉厚度
  var r = barWrap.getBoundingClientRect();
  if (!r.width) return;
  var p = (x - r.left) / r.width;   // ← 视觉坐标，直接用
  if (p < 0) p = 0;
  if (p > 1) p = 1;
  ap.volume(p);
}
```

只用 `getBoundingClientRect()`，完全不碰 `clientWidth` / `offsetWidth`——**因为我要的是"用户看到的那条线在哪"**，那就该问视觉层，不该去推算布局层。

效果立竿见影：

```
目标 5%   → 音量 5%
目标 95%  → 音量 95%
目标 50%  → 音量 51%
```

后来又补了两个交互（这两个都不是 bug，是体验问题）：

```js
// 滚轮：拖太精细的时候比拖动省力
wrap.addEventListener('wheel', function (e) {
  e.preventDefault();
  var d = e.deltaY > 0 ? -0.05 : 0.05;
  ap.volume(clamp(ap.volume + d, 0, 1));
}, { passive: false });
```

```css
/* 悬停时轨道加高，让"这条能拖"看得出来 */
.aplayer-volume-wrap:hover .aplayer-volume-bar .aplayer-volume { height: 14px; }
```

## 附带修好的：一个静默失效的功能

改这块代码时我发现，之前写的「跨页续播」（记住播放位置，切换页面后接着播）**从上线起就没生效过**。

原因是取播放器实例的方式不对：

```js
var ap = document.querySelector('meting-js').ap;    // ❌ undefined
```

这个 Meting 版本把 APlayer 实例挂在 `el.aplayer`，不是 `el.ap`。所以 `ap` 是 `undefined`，然后 `if (ap)` 为假，函数安静地 return 了——**不报错，不警告，功能就是不工作**。

改成兼容两种命名：

```js
function getAp() {
  var el = document.querySelector('meting-js');
  return el && (el.aplayer || el.ap);
}
```

顺手把这个模式全量替换了一遍。修完之后你去切换页面试试，音乐应该会接着上次的位置播。

## 小结

`transform` 制造了一个双层世界：**布局世界和视觉世界**。旋转一个元素之后，这两个世界在尺寸和方向上都是相反的。

几条可以带走的经验：

1. **`transform` 不改变布局值**。`clientWidth` / `clientHeight` / `offsetWidth` 都是旋转**前**的语义。你看到的和这些值可能相反。
2. **用户交互要用 `getBoundingClientRect()`**。它返回视觉坐标，和用户看到的一致。凡是"根据鼠标位置算相对比例"，就该用视觉值。
3. **CSS 无法修公式的轴向问题**。如果第三方库的交互公式和视觉不匹配，再怎么调 CSS 都没用，只能自己接管。
4. **库改版会静默破坏你的代码**。`el.ap` → `el.aplayer` 这种变化不会被任何工具告警，只会在功能层面慢慢表现出来。所以取实例这类地方值得写一层兼容 + 一次断言。

顺便说一句，这个 bug 真正教会我的东西是：**读第三方库的压缩源码是值得的**。那 5 分钟翻 APlayer 的公式，直接决定了后面所有方案的走向——一开始我以为是自己 CSS 写错了。