// ==================== 音乐播放器初始化 v3.1 - 网易云歌单方案 ====================

console.log('🎵 music-init.js 已加载（网易云歌单方案）');

function initMusicPlayer() {
  if (!window.musicPlayer) {
    setTimeout(initMusicPlayer, 500);
    return;
  }

  // 你的网易云歌单
  // 歌单地址: https://music.163.com/#/playlist?id=2809513713
  const neteasePlaylistId = '2809513713';

  window.musicPlayer.setPlaylist(neteasePlaylistId);
  console.log('✅ 网易云歌单已加载，ID:', neteasePlaylistId);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initMusicPlayer);
} else {
  initMusicPlayer();
}
