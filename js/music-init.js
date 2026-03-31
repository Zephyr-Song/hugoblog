// ==================== 音乐播放器初始化 v3.0 - Spotify 方案 ====================
// Spotify 官方 lofi beats 歌单（公开歌单，全球可访问）

console.log('🎵 music-init.js 已加载（Spotify 方案）');

function initMusicPlayer() {
  if (!window.musicPlayer) {
    setTimeout(initMusicPlayer, 500);
    return;
  }

  // Spotify 官方 lofi beats 歌单
  // 歌单地址: https://open.spotify.com/playlist/0vvXsWCC9xrXsKd4eZs6CI
  const spotifyEmbedUrl = 'https://open.spotify.com/embed/playlist/0vvXsWCC9xrXsKd4eZs6CI?utm_source=generator&theme=0';

  window.musicPlayer.setPlaylist(spotifyEmbedUrl);
  console.log('✅ Spotify 歌单已加载');
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initMusicPlayer);
} else {
  initMusicPlayer();
}
