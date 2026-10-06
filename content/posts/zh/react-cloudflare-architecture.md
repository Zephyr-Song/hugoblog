---
title: "React + Cloudflare Pages：把一个人做的 AI 项目部署成本压到零"
date: 2026-10-01
description: "三个人月的产品跑在静态托管 + Serverless Functions 上，月账单不到一杯咖啡。聊聊我这套 React 19 + Cloudflare 的架构取舍，以及在预算和体验之间怎么权衡。"
categories: ["技术"]
tags: ["React", "Cloudflare Pages", "Serverless", "D1", "前端架构"]
showToc: true
---

我做了一个 AI 导购项目（帮用户在商场里找东西），一个人从需求到上线大概花了两三个月。做完之后复盘，技术上最值得记的不是某个 API怎么调，而是**整个架构是被预算逼出来的**。

先说结论：**静态托管 + Serverless Functions，月成本几乎为零，用户打开首屏 < 1 秒。**

## 架构长这样

```
React 19 + Vite + TailwindCSS 4     前端（静态）
        ↓
Cloudflare Pages                    托管 + CDN
        ↓
Pages Functions（薄适配层）          /api/* 端点
        ↓
        ├─→ D1 (SQLite)             会话与缓存
        └─→ LLM API                 AI Agent 调用
```

关键是 `Pages Functions` 那一层，我称之为**薄适配层**。

## 什么是薄适配层

前端通过 `/api/*` 调后端，Functions 里做三件事：参数校验、调用真正的服务、返回结果。

```js
// functions/api/chat.js
export async function onRequestPost({ request, env }) {
  const { message, sessionId } = await request.json();

  // 1. 校验
  if (!message || typeof message !== 'string') {
    return Response.json({ error: 'invalid message' }, { status: 400 });
  }

  // 2. 调真正的服务（LLM / D1）
  const history = await loadHistory(env.DB, sessionId);
  const reply = await callAgent(env, message, history);

  // 3. 返回
  await saveMessage(env.DB, sessionId, 'user', message);
  await saveMessage(env.DB, sessionId, 'assistant', reply);

  return Response.json({ reply });
}
```

**没有一层"业务框架"。** 没有 ORM 基类、没有 service 层、没有依赖注入容器。

这不是因为我觉得架构不该有层次，而是因为这个项目的业务逻辑就这么多：

```
输入 → 校验 → 调 LLM → 存会话 → 返回
```

一个函数全部说完。为了让这段逻辑符合某种分层 aesthetic 而套三层文件，是纯粹的自我消耗。

**"薄"的意思是：Functions 只负责编排，业务能力在别的地方。** 如果哪天 D1 不够用了，可以把数据层换成 Supabase，Functions 几乎不用改——因为它本来就没做多少事。

## 值得说的几个取舍

### 1. 为什么不用 Serverless Containers

技术上更自由的方案，但运行成本和冷启动都高一档。对一个 demo 量级 / 小流量产品来说，Functions 足够，而且部署是 Git push 就完事。

**我的判断依据是：这个东西活多久？** 如果是要活三年、承载真实业务的系统，值得多投工程；如果是三个月内要出结果的探索，薄一点好。

### 2. 为什么不用 Supabase

不否认它很好。但这个项目的数据访问模式极窄（会话存取），我用 D1 的 SQLite 绑了两张表就够了。

选择工具时的一个隐性成本：**每次引入一个新服务，你都要学它的错误处理、迁移流程和调试方式。** 这部分成本往往比省下来的开发时间还多。

### 3. Tailwind 4 + CSS 变量的分层

关于配色，我踩过一个坑。最初的写法是这样：

```jsx
<div className="text-brand-500 bg-surface-100" />
```

看起来很干净，直到我要给播放器加个新的强调色。这时候我需要：

1. 在 `tailwind.config.js` 里加色值
2. 找到所有硬编码了这个色值的 CSS
3. 替换

改完发现暗色模式没跟上。

后来的做法是**色值定义在 CSS 变量上，Tailwind 只引用变量**：

```css
:root {
  --brand: #7FBF8F;
  --surface: #FAF8F3;
}
[data-theme="dark"] {
  --brand: #8FD3A0;
  --surface: #1A1A1A;
}
```

```js
// tailwind.config.js
theme: { extend: { colors: { brand: 'var(--brand)' } } }
```

换配色变成改两个变量，暗色模式自动跟随。这个改动本身就是后面那几篇播放器调色文章的基础——改配色从"改四处代码"变成"改一个数"。

## 一个反面教训：把 AI 放在前端

最开始我把 AI 逻辑直接写在了组件里——用户输入 → 直接调 API → 渲染结果。

后果是每次想改 prompt 都要重新构建部署一次，而且任何人都能在开发者工具里看到我的 prompt 和调用参数。

**AI 相关的所有东西都应该放在服务端**，前端只负责收发。这不是安全洁癖，是纯粹的工程成本考虑：prompt 迭代频率比 UI 高两个数量级，把它绑到部署流程上是自找麻烦。

## 成本对比

不是精确数字，但量级上的对比：

| 方案 | 起步月成本 | 冷启动 | 运维负担 |
|---|---|---|---|
| Functions + D1 | 0（免费额度内） | 几 ms | 几乎为零 |
| 单实例 VPS + Docker | 30～50 元 | 0 | 要自己管数据库、证书、备份 |
| Serverless Containers | 按量，可能免费额度内 | 几百 ms～几秒 | 中等 |

对一个还在验证需求的阶段，**"运维负担为零"比"性能最优"值钱得多**。因为我不用花一个晚上去查为什么数据库连接池断了。

## 小结

这几个月最大的收获不是某个技术点，是**克制**。

- 没有业务逻辑就别造分层
- 没有必要就不引入新服务
- 没有真实流量就不为"将来要扩展"写代码

Serverless 架构本身就鼓励这种克制——你写得少，部署的负担就小；写得少，成本就低；写得少，bug 的地方就少。

这套东西我还在用，也确实省了很多事。但我想说，**架构的形态是被约束推出来的，不是选出来的**。预算、流量、一个人的时间，这三个变量定下来之后，"该用什么"这个问题经常只有一个答案。

如果你也在做个人项目，我的建议是：**先把最丑但能跑的那版发出去**，然后用真实用户和数据告诉你哪里需要改。我的 APlayer 那个拖不动的音量条，就是真实用户点出来的——比我在本地测一百次都准。