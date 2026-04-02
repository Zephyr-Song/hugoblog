// ==================== 音乐播放器 v2.1 - 网易云 iframe 方案 ====================

class MusicPlayer {
  constructor(config = {}) {
    this.config = { volume: 0.7, ...config };
    this.currentTrack = 0;
    this.isPlaying = false;
    this.playlist = [];
    this.isShuffle = false;
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
          <div class="player-header-controls">
            <button class="header-btn" id="shuffle-btn" title="随机播放">⇄</button>
            <button class="player-close" id="player-close">✕</button>
          </div>
        </div>

        <div class="player-display">
          <div class="album-art" id="album-art">
            <div class="album-placeholder">♪</div>
          </div>
          <div class="track-info">
            <div class="track-title" id="track-title">选择一首歌</div>
            <div class="track-artist" id="track-artist">—</div>
          </div>
        </div>

        <!-- 网易云 iframe 播放器 -->
        <div class="netease-player" id="netease-player">
          <iframe id="netease-iframe"
            src=""
            frameborder="0"
            allowtransparency="true"
            style="width:100%;height:86px;display:none;">
          </iframe>
          <div class="netease-hint hidden" id="netease-hint">
            <span>🎵 点击歌单中的歌曲开始播放</span>
          </div>
        </div>

        <div class="player-playlist">
          <div class="playlist-header">
            <span>歌单 <span class="playlist-count" id="playlist-count">0</span></span>
            <button class="playlist-toggle" id="playlist-toggle">▼</button>
          </div>
          <div class="playlist-items" id="playlist-items"></div>
        </div>
      </div>

      <button class="music-toggle" id="music-toggle" title="打开音乐播放器">🎵</button>
    `;
    document.body.insertAdjacentHTML('beforeend', playerHTML);
  }

  attachEventListeners() {
    document.getElementById('player-close').addEventListener('click', () => this.closePlayer());
    document.getElementById('music-toggle').addEventListener('click', () => this.togglePlayer());
    document.getElementById('playlist-toggle').addEventListener('click', () => this.togglePlaylist());
    document.getElementById('shuffle-btn').addEventListener('click', () => this.toggleShuffle());
  }

  addTrack(track) {
    this.playlist.push({
      title: track.title || '未知歌曲',
      artist: track.artist || '未知艺术家',
      neteaseId: track.neteaseId || '',
      cover: track.cover || '',
      url: track.url || ''
    });
    this.updatePlaylistDisplay();
  }

  addTracks(tracks) {
    tracks.forEach(t => this.addTrack(t));
    // 显示第一首歌的信息
    if (this.playlist.length > 0) this.showTrackInfo(0);
  }

  showTrackInfo(index) {
    if (index < 0 || index >= this.playlist.length) return;
    this.currentTrack = index;
    const track = this.playlist[index];

    document.getElementById('track-title').textContent = track.title;
    document.getElementById('track-artist').textContent = track.artist;

    const albumArt = document.getElementById('album-art');
    if (track.cover) {
      albumArt.style.backgroundImage = `url(${track.cover})`;
      albumArt.querySelector('.album-placeholder').style.display = 'none';
    } else {
      albumArt.style.backgroundImage = '';
      albumArt.querySelector('.album-placeholder').style.display = 'flex';
    }

    document.querySelectorAll('.playlist-item').forEach((item, i) => {
      item.classList.toggle('active', i === index);
    });

    const activeItem = document.querySelector('.playlist-item.active');
    if (activeItem) activeItem.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }

  playTrack(index) {
    if (index < 0 || index >= this.playlist.length) return;
    this.showTrackInfo(index);
    const track = this.playlist[index];
    this.isPlaying = true;

    // 用网易云 iframe 播放
    const iframe = document.getElementById('netease-iframe');
    const hint = document.getElementById('netease-hint');

    if (track.neteaseId) {
      // auto=1 自动播放
      iframe.src = `https://music.163.com/outchain/player?type=2&id=${track.neteaseId}&auto=1&height=66`;
      iframe.style.display = 'block';
      hint.classList.add('hidden');
      document.getElementById('album-art').classList.add('spinning');
      document.getElementById('music-toggle').classList.add('playing');
    } else {
      iframe.style.display = 'none';
      hint.classList.remove('hidden');
    }

    this.updatePlaylistDisplay();
  }

  toggleShuffle() {
    this.isShuffle = !this.isShuffle;
    const btn = document.getElementById('shuffle-btn');
    btn.classList.toggle('active', this.isShuffle);
  }

  updatePlaylistDisplay() {
    const playlistItems = document.getElementById('playlist-items');
    playlistItems.innerHTML = this.playlist.map((track, index) => `
      <div class="playlist-item ${index === this.currentTrack && this.isPlaying ? 'active' : ''}" data-index="${index}">
        <span class="item-number">${index === this.currentTrack && this.isPlaying ? '▶' : index + 1}</span>
        <div class="item-info">
          <div class="item-title">${track.title}</div>
          <div class="item-artist">${track.artist}</div>
        </div>
        <a class="item-link" href="https://music.163.com/#/song?id=${track.neteaseId}" target="_blank" title="在网易云打开">↗</a>
      </div>
    `).join('');

    document.getElementById('playlist-count').textContent = this.playlist.length;

    playlistItems.querySelectorAll('.playlist-item').forEach(item => {
      item.addEventListener('click', (e) => {
        if (e.target.classList.contains('item-link')) return;
        const index = parseInt(item.dataset.index);
        if (this.isShuffle) {
          this.playTrack(Math.floor(Math.random() * this.playlist.length));
        } else {
          this.playTrack(index);
        }
      });
    });
  }

  togglePlayer() {
    const player = document.getElementById('music-player');
    player.classList.toggle('hidden');
  }

  closePlayer() {
    document.getElementById('music-player').classList.add('hidden');
  }

  togglePlaylist() {
    const items = document.getElementById('playlist-items');
    const btn = document.getElementById('playlist-toggle');
    items.classList.toggle('collapsed');
    btn.textContent = items.classList.contains('collapsed') ? '▶' : '▼';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.musicPlayer = new MusicPlayer();
});
