// ==================== 音乐播放器初始化 v2.1 ====================
// 使用网易云音乐官方 iframe 嵌入方案
// 侧边栏播放器展示歌曲信息 + 封面，点击跳转网易云播放

console.log('🎵 music-init.js 已加载');

function initMusicPlayer() {
  if (!window.musicPlayer) {
    setTimeout(initMusicPlayer, 1000);
    return;
  }

  // ==================== 歌单 ====================
  // 使用网易云音乐官方歌曲 ID
  // iframe 嵌入地址: https://music.163.com/outchain/player?type=2&id=歌曲ID&auto=0&height=66
  const myPlaylist = [
    {
      title: '搁浅',
      artist: '周杰伦',
      neteaseId: '186001',
      cover: 'https://p2.music.126.net/Ah0MFGjDMFBMFqvEMFMFMg==/109951163785860651.jpg',
      url: ''
    },
    {
      title: '晴天',
      artist: '周杰伦',
      neteaseId: '167876',
      cover: 'https://p2.music.126.net/Ah0MFGjDMFBMFqvEMFMFMg==/109951163785860651.jpg',
      url: ''
    },
    {
      title: '珊瑚海',
      artist: '周杰伦 / 梁静茹',
      neteaseId: '186016',
      cover: 'https://p2.music.126.net/Ah0MFGjDMFBMFqvEMFMFMg==/109951163785860651.jpg',
      url: ''
    },
    {
      title: '七里香',
      artist: '周杰伦',
      neteaseId: '185809',
      cover: 'https://p2.music.126.net/Ah0MFGjDMFBMFqvEMFMFMg==/109951163785860651.jpg',
      url: ''
    },
    {
      title: '告白气球',
      artist: '周杰伦',
      neteaseId: '418603077',
      cover: 'https://p2.music.126.net/Ah0MFGjDMFBMFqvEMFMFMg==/109951163785860651.jpg',
      url: ''
    },
    {
      title: '可惜没如果',
      artist: '林俊杰',
      neteaseId: '29722582',
      cover: 'https://p2.music.126.net/Ah0MFGjDMFBMFqvEMFMFMg==/109951163785860651.jpg',
      url: ''
    },
    {
      title: '那些你很冒险的梦',
      artist: '林俊杰',
      neteaseId: '27515168',
      cover: 'https://p2.music.126.net/Ah0MFGjDMFBMFqvEMFMFMg==/109951163785860651.jpg',
      url: ''
    }
  ];

  try {
    window.musicPlayer.addTracks(myPlaylist);
    console.log('✅ 歌单加载完成，共', myPlaylist.length, '首');
  } catch (error) {
    console.error('初始化失败:', error);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initMusicPlayer);
} else {
  initMusicPlayer();
}
