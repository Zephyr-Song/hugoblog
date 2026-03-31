// ==================== 音乐播放器初始化 v4.0 ====================

console.log('🎵 music-init.js 已加载（v4.0）');

function initMusicPlayer() {
  if (!window.musicPlayer) {
    setTimeout(initMusicPlayer, 500);
    return;
  }

  // 你的网易云歌单
  // 歌单地址: https://music.163.com/#/playlist?id=2809513713
  window.musicPlayer.setPlaylist(
    '2809513713',         // 歌单 ID
    '我的音乐',            // 中文名
    'My Music'            // 英文名
  );

  console.log('✅ 歌单已加载');
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initMusicPlayer);
} else {
  initMusicPlayer();
}
