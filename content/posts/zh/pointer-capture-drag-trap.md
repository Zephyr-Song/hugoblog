---
title: "setPointerCapture 把我坑了三小时：拖拽手势为何'按得动拖不动'"
date: 2026-10-05
description: "一个旋转过的音量条，点了能跳、松手后怎么拖都不动。根因不在计算公式，而在我自己写的那行 setPointerCapture。"
categories: ["技术"]
tags: ["JavaScript", "Pointer Events", "前端调试", "踩坑实录"]
showToc: true
---

我给自己的博客播放器加了个音量条。视觉调完了，长度和粗细都合适，接下来要验证拖动。

结果发现一个很奇怪的现象：

- **点一下，音量会跳** —— 位置算得完全正确
- **按住拖，纹丝不动** —— 鼠标怎么移动都不改音量

点击生效说明坐标换算是对的，拖动失效说明后续事件没被处理。这两件事同时成立，只有一个解释：**按下之后，后续事件根本没进到我的处理器**。

查了两个小时，最后发现是我自己写的那一行 `setPointerCapture` 干的。

## 复盘：setPointerCapture 改变了事件流

原始代码长这样：

```js
wrap.addEventListener('pointerdown', function (e) {
  e.preventDefault();
  e.stopPropagation();
  beginDrag(e);   // 里面调了 wrap.setPointerCapture(e.pointerId)
}, true);

// 兼容老浏览器的兜底
document.addEventListener('mousemove', function (e) {
  if (!dragging) return;
  e.stopPropagation();
  moveDrag(e);
}, true);
```

`setPointerCapture(e.pointerId)` 的作用是：**告诉浏览器，把这个指针后续的所有事件都强制派发给我指定的元素**，哪怕鼠标已经拖到了这个元素外面、哪怕已经移出了浏览器窗口。

听起来是拖拽场景的标准做法，没错。问题在于它的副作用范围比我想的大得多。

一旦 capture 生效，`pointermove` / `pointerup` / `pointercancel` 就**全部重定向到 `wrap`**。而我的代码里只监听了 `pointerdown` 一个 pointer 事件，剩下的全靠 document 上的兼容 `mousemove`。

**pointermove 一个都没接。**

事件确实触发了（浏览器把它们发给了 `wrap`），只是没有任何监听器在 `wrap` 上。表现就是：按下那一瞬间音量跳一下，之后手怎么动都没人处理。

## 怎么证明的

光看代码容易脑补，得拿证据。我在页面里挂了一圈监听器，把真实鼠标事件都记下来：

```js
['pointerdown', 'pointermove', 'pointerup', 'mousedown', 'mousemove'].forEach(t => {
  document.addEventListener(t, e => {
    window.__ev.push(`${t}@${e.target.className}`);
  }, true);
});
```

然后用 Chrome DevTools Protocol 发真实鼠标输入（不是 `element.dispatchEvent()` 那种合成事件），模拟"在音量条 20% 处按下、拖到 90%、松开"。

结果：

```
["pointerdown@div.aplayer-volume"]
```

**只有这一个事件。** `mousemove` 压根没投递进页面。

这一步很关键，因为我之前用合成事件测过——合成事件全部通过，1:1 跟手，看起来完全正常。**合成事件会绕过浏览器的输入管线，包括 pointer capture 的重定向逻辑**，所以它测不出这类问题。以后验证手势相关的代码，必须走真实输入路径。

## 修复

思路很直接：既然 capture 之后事件都到 `wrap`，那就在 `wrap` 上把它们接住。

```js
// 首选路径：capture 之后事件全部落在 wrap 上
wrap.addEventListener('pointermove', function (e) {
  if (!dragging) return;
  e.preventDefault();
  e.stopPropagation();
  moveDrag(e);
}, true);
wrap.addEventListener('pointerup', endDrag, true);
wrap.addEventListener('pointercancel', endDrag, true);

// 双保险：万一某些浏览器/场景下 capture 没生效
document.addEventListener('pointermove', function (e) {
  if (!dragging) return;
  moveDrag(e);
}, true);
document.addEventListener('pointerup', endDrag, true);
```

顺手补了几处：

```js
// 1. beginDrag 改成幂等，避免 pointerdown 和兼容 mousedown 走两遍
function beginDrag(e) {
  if (dragging) return;
  dragging = true;
  try { wrap.setPointerCapture(e.pointerId); } catch (err) {}
  wrap.classList.add('is-dragging');
  setByX(clientX(e));
}

// 2. 过滤非主键
if (e.button !== 0) return;

// 3. pointercancel 必须处理：它代表拖动被外力打断（浏览器抢走、窗口失焦、
//    触屏被系统识别成滚页），不清理状态的话 is-dragging 会永远挂着
```

## 修完的验证

逐点采样，每一步都读回真实的 `audio.volume`：

```
起始               70%
按下 20%       →  音量 20   填充 20%
拖到 50%       →  音量 51   填充 51%
拖到 90%       →  音量 91   填充 91%
拖出条外       →  音量 100  （钳位正确，没溢出）
松手            →  is-dragging 移除，继续移动不再改音量
```

钳位和松手复位这两项容易漏，但都很重要：拖出条外不钳位的话音量会算出大于 1 的值；`pointercancel` 不清理的话下一次按下会因为 `dragging` 还是 true 而行为异常。

## 一个额外发现

排查过程中顺手发现另一个 bug：我为了放大热区（音量条只有 10px 粗，命中框太难点）加了个伪元素：

```css
.aplayer-volume-wrap::before {
  top: -20px; bottom: -20px;   /* 把 25px 高的命中区扩到 65px */
  z-index: 3;
}
```

结果这个 `z-index: 3` **盖住了左边的喇叭图标，静音按钮已经点不动了**。用户大概率还没发现——毕竟音量条旁边的喇叭图标看起来还是那样。

```css
.aplayer-icon-volume-down {
  position: relative;
  z-index: 5;   /* 抬到热区之上 */
}
```

这属于典型的"改 A 坏了 B"。修的时候要意识到：**扩大命中区不是免费的**，它一定会改变这块区域的层叠关系。

## 小结

三个可以带走的点：

1. **`setPointerCapture` 之后，后续指针事件全部重定向到 capture 元素**。如果你在 capture 目标上只监听了 `pointerdown`，那拖动一定是死的。
2. **合成事件测不出输入管线的问题**。`dispatchEvent` 会绕过 capture 重定向、手势识别、事件合并。验证手势必须用 CDP 的 `Input.dispatchMouseEvent` / `dispatchTouchEvent`。
3. **给事件埋日志比读代码可靠**。同一个 bug，读代码时我以为 document 上的 `mousemove` 一定能收到；埋了监听器才发现事件路径完全不同。这次踩的坑写下来，下次能省两小时。

Pointer Events 这套东西文档写得不算好，`setPointerCapture` 的语义描述只有一句话，但它隐含的事件流改写是相当大的一颗坑。