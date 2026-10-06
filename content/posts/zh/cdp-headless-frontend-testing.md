---
title: "用无头 Chrome 验收前端：我把 CDP 当成了测试框架"
date: 2026-10-03
description: "改完前端不靠肉眼判断，而是发真实鼠标/触摸输入、读回真实数值。分享一套可复用的 CDP 验收脚本，以及它抓出过的四类 bug。"
categories: ["技术"]
tags: ["CDP", "Puppeteer", "自动化测试", "前端调试", "工具链"]
showToc: true
---

以前改完前端，我靠的是：刷新页面 → 鼠标点一下 → 眼睛看 → 觉得对了就提交。

这个流程的问题在于，它验证的是"页面看起来对"，不是"交互真的对"。

我有过好几次这样的经历：CSS 一看没问题，代码逻辑读一遍也没问题，肉眼点起来正常——但用户反馈说点不动。而我"验证"的时候用的是合成事件，走的是一条浏览器真实用户永远不会走的代码路径。

后来我改用 Chrome DevTools Protocol 发真实输入来做验收。抓到的问题比我一整年肉眼检查出来的都多。

## 为什么不能只用合成事件

先说一个我踩过的坑，因为它是最容易被误判的。

我写过一个音量条的拖动验证脚本，用 `element.dispatchEvent(new MouseEvent(...))` 合成事件，测出来 1:1 跟手，一切正常。但真实用户反馈："点得动，拖不动。"

问题在于 `dispatchEvent` 合成事件：

- 不经过浏览器的**输入管线**（hit testing、pointer capture 重定向、手势识别、事件合并）
- 直接把事件塞到 DOM 上，绕过了所有"浏览器会改写事件目标"的逻辑
- 不遵守 `passive` / `preventDefault` 的完整语义

**结论：合成事件只能验证你的函数被调用了，不能验证用户的操作会走到你的函数。**

CDP 的 `Input.dispatchMouseEvent` / `dispatchTouchEvent` 走的是真实输入路径，会经过完整的命中测试和指针状态机。合成和真实事件的差异，正是这类 bug 藏身的地方。

## 一套最小可用的 CDP 骨架

不用 Puppeteer（我不想为了一个脚本引入几百 KB 依赖），直接用 Node 内置的 `WebSocket` + `child_process` 拼一个 60 行的骨架：

```js
const http = require('http');
const { spawn } = require('child_process');

const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const PORT = 7350;
const URL = process.env.TARGET || 'http://127.0.0.1:1314/';

const chrome = spawn(CHROME, [
  '--headless=new',
  '--disable-gpu',
  '--hide-scrollbars',
  '--no-first-run',
  '--remote-debugging-port=' + PORT,
  '--user-data-dir=C:/Users/song/AppData/Local/Temp/cdp-test' + PORT,
  '--window-size=1500,1000',
  URL,
], { stdio: 'ignore' });

const get = p => new Promise((res, rej) => {
  http.get({ host: '127.0.0.1', port: PORT, path: p }, r => {
    let d = '';
    r.on('data', c => d += c);
    r.on('end', () => res(JSON.parse(d)));
  }).on('error', rej);
});

const sleep = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  // 等 DevTools 端点就绪
  let targets;
  for (let i = 0; i < 50; i++) {
    try { targets = await get('/json'); break; }
    catch (e) { await sleep(300); }
  }

  const page = targets.find(t => t.type === 'page');
  const ws = new WebSocket(page.webSocketDebuggerUrl);

  let id = 0;
  const pending = {};
  const send = (method, params = {}) => new Promise(res => {
    const i = ++id;
    pending[i] = res;
    ws.send(JSON.stringify({ id: i, method, params }));
  });

  ws.addEventListener('message', ev => {
    const o = JSON.parse(ev.data);
    if (o.id && pending[o.id]) { pending[o.id](o.result || {}); delete pending[o.id]; }
  });

  await new Promise(r => ws.addEventListener('open', r));
  await sleep(4000);   // 等页面里的异步初始化完成

  // --- 你的测试逻辑写在这里 ---

  ws.close(); chrome.kill(); process.exit(0);
})();
```

`user-data-dir` 一定要每次用不同路径，否则 Chrome 会复用上一个 profile 的缓存，你测的还是旧版本。这种错误我犯过一次，白排查了半小时。

## 三个最有用的 CDP 命令

### `Runtime.evaluate` —— 读回真实状态

```js
const val = await send('Runtime.evaluate', {
  returnByValue: true,
  expression: `document.querySelector('.aplayer-volume').style.height`
});
console.log(val.result.value);
```

关键是 `returnByValue: true`，不然拿到的是远程对象句柄，还得额外发一次 `getProperties`。

### `Input.dispatchMouseEvent` —— 真实鼠标

```js
await send('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', clickCount: 1 });
await send('Input.dispatchMouseEvent', { type: 'mouseMoved',  x, y });
await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'left', clickCount: 1 });
```

**坐标必须取整。** 传小数时 Chrome 会静默丢弃整个事件，报错都没有，表现就是"脚本说没反应"。这个坑很隐蔽，因为 `element.click()` 明明是好的，你会怀疑是别的问题。

移动端：

```js
await send('Input.dispatchTouchEvent', {
  type: 'touchStart',
  touchPoints: [{ x, y }],
});
```

`touchStart` → `touchMove` → `touchEnd` 的序列，配合 `Emulation.setDeviceMetricsOverride` 就能模拟真实手机视口。

### `Page.captureScreenshot` + `clip` —— 局部特写

整页截图看不清细节，用 `clip` 框住目标元素：

```js
const buf = await send('Page.captureScreenshot', {
  format: 'png',
  clip: { x: bx - 20, y: by - 20, width: bw + 40, height: bh + 40, scale: 2 },
});
fs.writeFileSync(out, Buffer.from(buf.data, 'base64'));
```

`scale: 2` 是 Retina 级别的清晰度，10px 粗的进度条在 1x 下几乎看不出圆角和锯齿。

## 它抓出过的四类 bug

写脚本的成本是有的，回报也具体。以下四类问题，都是肉眼+合成事件完全看不到的：

**1. Pointer capture 重定向**
真实拖动时事件流和代码里想的不一样。合成事件测不出来，因为 capture 重定向发生在输入管线里。详见[那篇专门的文章](/posts/pointer-capture-drag-trap/)。

**2. 命中测试失败**
我以为音量条在那里，实际那个坐标上盖着别的东西。用 `document.elementFromPoint(x, y)` 直接问浏览器"这个点上到底是什么"，比推理 CSS 层级快得多。

**3. 只读属性静默失败**
`audio.volume = 0.5` 写进去没反应，页面不报错。这类问题只能靠"写进去 → 读出来 → 对比"发现。

**4. 检测逻辑自身的判断写反**
我写的兼容检测是 `Math.abs(after - want) < 0.01 → 判定为不支持`。结果写入成功（差值为 0）反而被判成不支持，桌面端疯狂误报。

这个尤其值得记一笔——我以为我在测页面，其实我在测我的测试。**验证脚本本身也是需要被验证的代码**，也会写反条件。

## 什么时候值得开这套流程

不是所有改动都值得。我的判断标准：

| 改动类型 | 要不要 CDP 验收 |
|---|---|
| 调颜色、间距、字号 | 不用，肉眼 + 截图够了 |
| 静态布局在不同视口下的表现 | 用截图，不用发事件 |
| 拖拽、滑动、点击等手势交互 | **必须**，且必须真实输入 |
| 影响播放/计时等状态逻辑 | 用，必须读回真实数值 |
| 移动端专属行为 | 用真触摸事件 + 刁钻方向测试 |

核心判断是：**这个改动的正确性，有多少能被眼睛看出来？** 手势和状态的正确性，眼睛看不出来多少。

## 一点体会

写这套东西的隐性成本不小——骨架、加等待、查文档、踩坐标小数坑。所以我不会无脑上。

但它改变了一件事：**我不再用"我试过了"作为验收依据。**

以前说"应该没问题"，实际意思是"我点了一下看起来没问题"。现在说"没问题"，背后是一份可以重跑的脚本，每个数值都有出处。

做工程久了，越来越觉得"可复现的验证"和"代码"同等重要。能写下来的验证，才叫验证；靠记忆和感觉的验证，下周就不作数了。