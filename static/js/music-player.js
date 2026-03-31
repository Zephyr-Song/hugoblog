// ==================== 音乐播放器 v3.1 - 网易云歌单整体嵌入 ====================

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
        <div class="netease-container" id="netease-container">
          <!-- 网易云歌单 iframe 将由 music-init.js 注入 -->
        </div>
      </div>
      <button class="music-toggle" id="music-toggle" title="打开音乐播放器">🎵</button>
    `;
    document.body.insertAdjacentHTML('beforeend', playerHTML);
  }

  setPlaylist(neteasePlaylistId) {
    const container = document.getElementById('netease-container');
    container.innerHTML = `
      <iframe
        src="https://music.163.com/outchain/player?type=0&id=${neteasePlaylistId}&auto=0&height=430"
        width="100%"
        height="430"
        frameborder="0"
        allowtransparency="true"
        style="display:block;">
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
