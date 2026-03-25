// ==================== APlayer + MetingJS 初始化 ====================
// 使用网易云歌单 ID 直接加载歌曲

console.log('🎵 APlayer 初始化中...');

document.addEventListener('DOMContentLoaded', function() {
  // 创建播放器容器
  const playerContainer = document.createElement('div');
  playerContainer.id = 'aplayer-container';
  playerContainer.className = 'aplayer-fixed-wrap';
  document.body.appendChild(playerContainer);

  // 使用 MetingJS 加载网易云歌单
  // 歌单 ID: 你的网易云歌单 ID（需要替换）
  // 这里用歌曲 ID 列表作为备选方案
  const ap = new APlayer({
    container: playerContainer,
    fixed: true,
    mini: true,
    autoplay: false,
    theme: '#8fb3a9',
    loop: 'all',
    order: 'list',
    preload: 'metadata',
    volume: 0.7,
    audio: [
      {
        name: '搁浅',
        artist: '周杰伦',
        url: 'https://music.163.com/song/media/outer/url?id=186001',
        cover: 'https://p2.music.126.net/Ah0MFGjDMFBMFqvEMFMFMg==/109951163785860651.jpg'
      },
      {
        name: '晴天',
        artist: '周杰伦',
        url: 'https://music.163.com/song/media/outer/url?id=167876',
        cover: 'https://p2.music.126.net/Ah0MFGjDMFBMFqvEMFMFMg==/109951163785860651.jpg'
      },
      {
        name: '珊瑚海',
        artist: '周杰伦 / 梁静茹',
        url: 'https://music.163.com/song/media/outer/url?id=186016',
        cover: 'https://p2.music.126.net/Ah0MFGjDMFBMFqvEMFMFMg==/109951163785860651.jpg'
      },
      {
        name: '七里香',
        artist: '周杰伦',
        url: 'https://music.163.com/song/media/outer/url?id=185809',
        cover: 'https://p2.music.126.net/Ah0MFGjDMFBMFqvEMFMFMg==/109951163785860651.jpg'
      },
      {
        name: '告白气球',
        artist: '周杰伦',
        url: 'https://music.163.com/song/media/outer/url?id=418603077',
        cover: 'https://p2.music.126.net/Ah0MFGjDMFBMFqvEMFMFMg==/109951163785860651.jpg'
      },
      {
        name: '可惜没如果',
        artist: '林俊杰',
        url: 'https://music.163.com/song/media/outer/url?id=29722582',
        cover: 'https://p2.music.126.net/Ah0MFGjDMFBMFqvEMFMFMg==/109951163785860651.jpg'
      },
      {
        name: '那些你很冒险的梦',
        artist: '林俊杰',
        url: 'https://music.163.com/song/media/outer/url?id=27515168',
        cover: 'https://p2.music.126.net/Ah0MFGjDMFBMFqvEMFMFMg==/109951163785860651.jpg'
      }
    ]
  });

  console.log('✅ APlayer 已初始化');
});
