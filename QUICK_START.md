# 🚀 快速启动指南

## ✅ 已完成的配置

所有文件已创建，配置已更新。现在只需要启动 Hugo 服务器。

## 🎯 立即测试

### 步骤 1：启动 Hugo 服务器

```bash
cd D:\hugo\myblog
hugo server
```

### 步骤 2：打开浏览器

访问：`http://localhost:1313`

### 步骤 3：检查效果

打开浏览器开发者工具（按 `F12`），查看 Console 标签：

应该看到：
```
✅ 音乐播放器已初始化，歌单已加载
```

### 步骤 4：查看动态效果

- 👀 **看右下角** — 应该有 🎵 音乐播放器按钮
- 👀 **看背景** — 应该有浮动的粒子动画
- 👀 **移动鼠标** — 卡片应该会发光
- 👀 **悬停卡片** — 应该有提升和缩放效果

---

## 🎵 如果音乐无法播放

### 检查 1：网络连接
确保能访问网易云音乐 URL：
```
https://music.163.com/song/media/outer/url?id=167876.mp3
```

### 检查 2：浏览器控制台
按 `F12` 查看是否有错误信息

### 检查 3：CORS 问题
如果看到 CORS 错误，可能需要使用代理或其他音乐源

---

## 🎨 如果看不到动画

### 检查 1：配置
确保 `hugo.toml` 中有：
```toml
[params.animations]
  enabled = true

[params.musicPlayer]
  enabled = true
```

### 检查 2：浏览器控制台
按 `F12` 查看是否有 JavaScript 错误

### 检查 3：清除缓存
按 `Ctrl+Shift+Delete` 清除浏览器缓存，然后刷新页面

---

## 📝 自定义歌单

编辑 `static/js/music-init.js`，修改 `myPlaylist` 数组：

```javascript
const myPlaylist = [
  {
    title: '你的歌曲',
    artist: '艺术家',
    url: 'https://music.163.com/song/media/outer/url?id=SONG_ID.mp3',
    cover: 'https://cover-url.jpg'
  }
];
```

---

## 🌐 部署到生产环境

### 步骤 1：构建
```bash
hugo
```

### 步骤 2：上传
将 `public/` 目录上传到你的服务器

### 步骤 3：验证
访问 https://zephyrsong.qzz.io 检查效果

---

## 📚 详细文档

查看这些文件获取完整信息：
- `MUSIC_AND_ANIMATIONS_GUIDE.md` — 完整使用指南
- `ENHANCEMENTS_SUMMARY.md` — 项目总结
- `content/posts/test-animations.md` — 测试页面

---

## 🆘 遇到问题？

1. **查看浏览器控制台** — 按 `F12`，查看 Console 标签
2. **查看 Hugo 输出** — 终端中是否有错误信息
3. **检查文件** — 确保所有文件都存在
4. **清除缓存** — 按 `Ctrl+Shift+Delete` 清除浏览器缓存
5. **重启服务器** — 停止 Hugo 服务器，重新启动

---

## ✨ 完成！

现在运行：
```bash
hugo server
```

然后访问 `http://localhost:1313` 享受你的新博客！🎉
