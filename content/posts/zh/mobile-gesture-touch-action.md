---
title: "移动端手势被浏览器抢走：touch-action、preventDefault 和那个神奇的 pointercancel"
date: 2026-10-04
description: "同一个拖拽组件，桌面端跟手到像素级，手机上完全不动。真机上调了一整天，发现真凶是 touchmove 里少了一个 preventDefault。"
categories: ["技术"]
tags: ["移动端", "Touch Events", "Pointer Events", "CSS", "踩坑实录"]
showToc: true
---

上一篇文章写了 `setPointerCapture` 导致的"按得动拖不动"。修完之后我用 CDP 在桌面端跑了一遍完整验证，全绿：

```
按下 20%  → 20%    拖到 50% → 51%    拖到 90% → 91%
```

然后我兴冲冲拿手机打开网站试了一下。

**完全不动。**

手指按在音量条上，没有任何反应。桌面模拟器（`Emulation.setDeviceMetricsOverride` 390×844）里是通的，真实触摸事件（`Input.dispatchTouchEvent`）也是通的，只有真机上不动。

## 桌面和手机的差别在哪

先说结论：**`touchmove` 里我只写了 `stopPropagation()`，没写 `preventDefault()`。**

```js
// 修复前的 touch 处理
document.addEventListener('touchmove', function (e) {
  if (!dragging) return;
  e.stopPropagation();   // 拦住了冒泡，但没拦住默认行为
  moveDrag(e);
}, true);
```

移动端浏览器有一条桌面没有的规则：**touch 事件在没有 `preventDefault()` 时，默认行为是"滚动页面"**。更麻烦的是，浏览器会在手势开始时就判断方向：

```
手指按下
   ↓
开始移动
   ↓
方向是纵向（哪怕只有一点点）？
   ↓ 是                    ↓ 否
接手手势去滚页面         保持 pointer 事件流
立刻 fire pointercancel
```

`pointercancel` 是浏览器主动宣告"这个指针序列我不管了"。我的 `dragging` 状态还停在 true，但后续所有 `pointermove` 都不会再来了——**拖动在第一帧就被掐死了**。

音量条是横向的，按道理横向拖不该触发滚页。但有两个常见的踩中路径：

- 手指按得不够准，有一点自然的斜向移动
- 用户手势是先竖直起手再转向（很常见，比如从下往上划然后拐弯）

只要在浏览器判定"这是纵向滚动"的那一刻触发 `pointercancel`，后面用户再怎么横向拖都没用了。

## 修复

```js
document.addEventListener('touchmove', function (e) {
  if (!dragging) return;
  // 必须 preventDefault：告诉浏览器"这个手势我接管了，别滚页面"
  e.preventDefault();
  e.stopPropagation();
  moveDrag(e);
}, { passive: false, capture: true });
```

`{ passive: false }` 写在 addEventListener 的第三个参数里。这个选项的含义是：**明确告诉浏览器这个 touch 监听器可能会调 preventDefault**。

浏览器据此可以做优化：如果监听器标了 `passive: true`，它会假设你不会阻止默认行为，于是把滚动相关的响应式滚动性能优化打开，同时**忽略你在回调里调的 preventDefault**。

对于 `document` 和 `window` 这两个高频滚动链上的目标，Chrome 更是默认就把 touch 监听器设成了 `passive: true`。所以如果我只是写 `document.addEventListener('touchmove', e => e.preventDefault())` 而忘了写 `{ passive: false }`，**在 Chrome 上这个 preventDefault 会被静默丢弃**，而且没有任何警告。

这是移动端最隐蔽的一类 bug：代码看起来是对的，行为是错的。

## touch-action 也要配

CSS 侧还有一个配套属性：

```css
.aplayer-volume-wrap {
  touch-action: none;
}
```

`touch-action` 是 CSS 层面的手势声明，等于在 CSS 层就把"这个元素上的触摸不触发浏览器默认手势"说清楚，浏览器可以据此提前决策，连等手指移动了再判断都不用。

`touch-action: none` 表示完全接管手势（不滚动、不缩放）。如果只想禁止纵向滚动、保留横向，可以用 `touch-action: pan-x`。

**这里有个坑：`touch-action` 不是继承属性。**

我给 `.aplayer-volume-wrap` 加了 `touch-action: none`，本以为连带把热区伪元素也管住了。但伪元素是独立盒子，`touch-action` 不会从父元素传给它。手指只要落在 `::before` 扩出来的那 40px 热区里（视觉上看不见的区域），`touch-action` 就是默认的 `auto`，浏览器照样可以抢走手势。

所以伪元素必须自己再声明一次：

```css
.aplayer-volume-wrap::before {
  /* ... 热区样式 */
  touch-action: none;   /* 必须单独声明 */
}
```

## 还有一个 Safari 的硬限制

修完这些之后，我在想 iOS 上的情况，然后发现一个绕不过去的坎：

**iOS Safari 上 `audio.volume` 是只读的。** 写进去不生效。

```js
audio.volume = 0.5;
console.log(audio.volume);   // 还是原值
```

这不是 bug，是 WebKit 的设计。移动端系统的音频输出音量由硬件和系统统一管理，出于某些历史原因，网页侧没有权限去改。

表现就很误导人：**滑条跟着手指动、填充色也变，但声音一点不变**。用户百分之百会认为"调节不了音量"。

代码层面没法绕。我能做的只有两件事：

**1. 检测。** 写入一次再读回来，对不上就说明这台设备不支持：

```js
function volumeIsWritable() {
  var a = ap.audio;
  var cur = a.volume;
  var want = cur > 0.5 ? 0.25 : 0.8;
  try {
    a.volume = want;
    var stuck = Math.abs(a.volume - want) > 0.01;  // 写入没生效
    a.volume = cur;   // 还原
    return !stuck;
  } catch (err) {
    return false;      // 直接抛异常也是只读的信号
  }
}
```

**2. 给明确提示**，别让用户瞎试：

```js
if (!volumeIsWritable()) {
  wrap.classList.add('vol-native-only');
  showHint('此设备不支持网页调音量，请用系统音量键');
}
```

这里我踩了自己的坑：第一版判断写成了 `Math.abs(a.volume - want) < 0.01`，也就是"差值很小就算 stuck"。结果**写入成功（差值为 0）反而被判定成不支持**，桌面上疯狂误报。正确的是反过来：差值大于阈值才算没生效。

移动端千奇百怪的设备环境下，这种"兼容性检测"本身也要按真机验一遍，不能只靠模拟器。

## 验证

真实触摸事件，390×844 移动视口：

```
触摸按下 20%      → 音量 20   填充 20%
拖到 60%          → 音量 60   填充 60%
拖到 90%          → 音量 91   填充 91%
向下拖 30px       → 音量 51   ← 最容易触发滚页的方向，照样跟手
继续右下拖到 80%  → 音量 81
松手              → is-dragging 正确移除
```

第二条"向下拖"是我特意加的测试项——垂直方向是最容易触发手势劫持的，不测这个等于没测。

## 小结

移动端手势的四条纪律：

1. **`touchmove` 里必须 `preventDefault()`**，并且 addEventListener 要显式写 `{ passive: false }`，否则 Chrome 会静默忽略你的 preventDefault。
2. **`touch-action: none` 要写在实际接收手势的那个元素上**。它不继承，热区伪元素得单独写一遍。
3. **`pointercancel` 必须处理**。它是浏览器宣告"我不管了"的信号，不清理状态会让后续交互进入错误态。
4. **iOS 上 `audio.volume` 只读，这是系统限制不是 bug**。做能力检测 + 给明确提示，别让用户以为功能坏了。

顺便说一句，这套"移动端 Web 组件手感问题"在 PC 上调试是发现不了的。真正靠谱的做法是：桌面用 CDP 发真实输入验证事件流，移动端至少用 `dispatchTouchEvent` 加上几个刻意刁钻的方向测试。真机是唯一可信的裁判。