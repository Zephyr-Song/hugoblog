# 🎵 Spotify 歌曲导入指南

## 从 Spotify 链接提取歌曲信息

### 你提供的链接
```
https://open.spotify.com/track/64Odl9Q1nrMjUlCfmBZKCp?si=OOeKZQ1wTzClHo0jDMgfjQ
```

### 提取信息
从 Spotify 链接中，我们可以看到：
- **Track ID**: `64Odl9Q1nrMjUlCfmBZKCp`

---

## 如何转换为网易云音乐

### 方法 1：使用在线转换工具
访问这些网站，粘贴 Spotify 链接：
- https://www.spotlistr.com/
- https://www.chosic.com/spotify-playlist-to-apple-music/

### 方法 2：手动搜索
1. 从 Spotify 链接获取歌曲名和艺术家
2. 在网易云音乐搜索相同的歌曲
3. 获取网易云的歌曲 ID

### 方法 3：使用 API
```bash
# 获取 Spotify 歌曲信息
curl "https://api.spotify.com/v1/tracks/64Odl9Q1nrMjUlCfmBZKCp" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

## 快速方案

**告诉我以下信息，我可以帮你找到网易云对应的歌曲：**

1. 歌曲名
2. 艺术家名
3. 专辑名（可选）

或者直接告诉我你的 Spotify 歌单链接，我可以帮你批量转换。

---

## 示例

如果你的 Spotify 歌曲是：
- **歌曲**: "Shape of You"
- **艺术家**: "Ed Sheeran"

我会帮你找到网易云对应的版本，然后添加到你的博客歌单中。

---

## 📝 添加到歌单

一旦我们找到网易云的歌曲 ID，就可以添加到 `static/js/music-init.js`：

```javascript
const myPlaylist = [
  {
    title: '歌曲名',
    artist: '艺术家',
    url: 'https://music.163.com/song/media/outer/url?id=NETEASE_ID.mp3',
    cover: '封面URL'
  }
];
```

---

## 🔗 相关链接

- Spotify: https://open.spotify.com
- 网易云音乐: https://music.163.com
- Spotlistr: https://www.spotlistr.com/
