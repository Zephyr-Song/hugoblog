# 🎵 歌单配置指南

## 📝 如何添加你的歌曲

编辑 `static/js/music-init.js`，在 `myPlaylist` 数组中添加歌曲：

```javascript
const myPlaylist = [
  {
    title: '歌曲名',
    artist: '艺术家名',
    url: 'https://music.163.com/song/media/outer/url?id=SONG_ID.mp3',
    cover: '封面图片URL'
  },
  {
    title: '另一首歌',
    artist: '另一个艺术家',
    url: 'https://music.163.com/song/media/outer/url?id=ANOTHER_ID.mp3',
    cover: '另一个封面URL'
  }
];
```

---

## 🔍 如何获取网易云音乐的歌曲 ID

### 方法 1：从 URL 获取
1. 打开网易云音乐网页版：https://music.163.com
2. 搜索你想要的歌曲
3. 点击歌曲名称进入详情页
4. 查看 URL，格式为：`https://music.163.com/#/song?id=SONG_ID`
5. 复制 `SONG_ID` 这个数字

### 方法 2：使用搜索 API
访问：`https://music.163.com/api/search/get?s=歌曲名&type=1&limit=10`

---

## 🎨 如何获取封面图片 URL

### 方法 1：从网易云获取
1. 在网易云音乐网页版找到歌曲
2. 右键点击专辑封面
3. 选择"复制图片链接"
4. 粘贴到 `cover` 字段

### 方法 2：使用网易云 API
```
https://p1.music.126.net/ALBUM_ID/COVER_ID.jpg
```

### 方法 3：使用其他图片 URL
可以使用任何公开的图片 URL

---

## 📋 常见歌曲 ID 参考

| 歌曲 | 艺术家 | ID |
|------|--------|-----|
| 晴天 | 周杰伦 | 167876 |
| 稻香 | 周杰伦 | 25641950 |
| 夜曲 | 周杰伦 | 25641948 |
| 说好不哭 | 五月天 | 1300375346 |
| 光年之外 | 邓紫棋 | 574566224 |

---

## ✅ 完整示例

```javascript
const myPlaylist = [
  {
    title: '晴天',
    artist: '周杰伦',
    url: 'https://music.163.com/song/media/outer/url?id=167876.mp3',
    cover: 'https://p1.music.126.net/34nXKzsKR7_WBIcE_gVjZQ==/109951163785860651.jpg'
  },
  {
    title: '稻香',
    artist: '周杰伦',
    url: 'https://music.163.com/song/media/outer/url?id=25641950.mp3',
    cover: 'https://p1.music.126.net/34nXKzsKR7_WBIcE_gVjZQ==/109951163785860651.jpg'
  },
  {
    title: '夜曲',
    artist: '周杰伦',
    url: 'https://music.163.com/song/media/outer/url?id=25641948.mp3',
    cover: 'https://p1.music.126.net/34nXKzsKR7_WBIcE_gVjZQ==/109951163785860651.jpg'
  }
];
```

---

## 🚀 保存并发布

1. 编辑完 `static/js/music-init.js` 后保存
2. 运行 `publish.bat` 发布到 GitHub
3. 等待 1-2 分钟，刷新博客查看效果

---

## 🆘 常见问题

**Q: 音乐无法播放？**
- 检查 URL 是否正确
- 确保网络连接正常
- 查看浏览器控制台是否有错误

**Q: 封面图片不显示？**
- 检查图片 URL 是否正确
- 确保图片 URL 可以直接访问
- 尝试使用其他图片 URL

**Q: 如何删除某首歌？**
- 在 `myPlaylist` 数组中删除对应的对象即可

---

## 📞 需要帮助？

告诉我你想要的歌曲名称和艺术家，我可以帮你找到正确的 ID 和 URL。
