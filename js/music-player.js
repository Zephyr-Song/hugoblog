// ==================== 音乐播放器 v3.0 - Spotify 嵌入方案 ====================

class MusicPlayer {
  constructor(config = {}) {
    this.config = config;
    this.init();
  }

  init() {
    this.createPlayer();
    this.attachEventListeners();
  }

  createPlayer() {
    const playerHTML = `
      <div class="music-player hidden" id="music-player">
        <div class="player-header">
          <span class="player-title">🎵 Music</span>
          <button class="player-close" id="player-close" title="关闭">✕</button>
        </div>
        <div class="spotify-container" id="spotify-container">
          <!-- Spotify iframe 将由 music-init.js 注入 -->
        </div>
      </div>
      <button class="music-toggle" id="music-toggle" title="打开音乐播放器">🎵</button>
    `;
    document.body.insertAdjacentHTML('beforeend', playerHTML);
  }

  setPlaylist(spotifyEmbedUrl) {
    const container = document.getElementById('spotify-container');
    container.innerHTML = `
      <iframe
        src="${spotifyEmbedUrl}"
        width="100%"
        height="352"
        frameborder="0"
        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
        loading="lazy"
        style="border-radius:12px;">
      </iframe>
    `;
  }

  attachEventListeners() {
    document.getElementById('player-close').addEventListener('click', () => this.closePlayer());
    document.getElementById('music-toggle').addEventListener('click', () => this.togglePlayer());
  }

  togglePlayer() {
    const player = document.getElementById('music-player');
    player.classList.toggle('hidden');
    document.getElementById('music-toggle').classList.toggle('playing', !player.classList.contains('hidden'));
  }

  closePlayer() {
    document.getElementById('music-player').classList.add('hidden');
    document.getElementById('music-toggle').classList.remove('playing');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.musicPlayer = new MusicPlayer();
});
