// ==================== 音乐播放器 v2.0 ====================

class MusicPlayer {
  constructor(config = {}) {
    this.config = {
      autoplay: config.autoplay || false,
      loop: config.loop || 'all',
      order: config.order || 'list',
      volume: config.volume || 0.7,
      ...config
    };
    this.currentTrack = 0;
    this.isPlaying = false;
    this.playlist = [];
    this.isShuffle = false;
    this.shuffleHistory = [];
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
            <button class="player-close" id="player-close" title="关闭">✕</button>
          </div>
        </div>

        <div class="player-display">
          <div class="album-art" id="album-art">
            <div class="album-placeholder">♪</div>
            <div class="album-spin-ring"></div>
          </div>
          <div class="track-info">
            <div class="track-title marquee" id="track-title">选择一首歌</div>
            <div class="track-artist" id="track-artist">—</div>
          </div>
        </div>

        <div class="player-progress">
          <div class="progress-bar" id="progress-bar">
            <div class="progress-fill" id="progress-fill"></div>
            <div class="progress-thumb" id="progress-thumb"></div>
          </div>
          <div class="time-display">
            <span id="current-time">0:00</span>
            <span id="duration">0:00</span>
          </div>
        </div>

        <div class="player-controls">
          <button class="control-btn" id="prev-btn" title="上一首">⏮</button>
          <button class="control-btn play-btn" id="play-btn" title="播放/暂停">▶</button>
          <button class="control-btn" id="next-btn" title="下一首">⏭</button>
        </div>

        <div class="volume-row">
          <span class="vol-icon" id="vol-icon">🔊</span>
          <input type="range" class="volume-slider" id="volume-slider" min="0" max="1" step="0.05" value="0.7">
        </div>

        <div class="player-playlist">
          <div class="playlist-header">
            <span>歌单 <span class="playlist-count" id="playlist-count">0</span></span>
            <button class="playlist-toggle" id="playlist-toggle" title="展开/收起">▼</button>
          </div>
          <div class="playlist-items" id="playlist-items"></div>
        </div>

        <audio id="audio-player" preload="metadata"></audio>
      </div>

      <button class="music-toggle" id="music-toggle" title="打开音乐播放器">
        <span class="music-toggle-icon">🎵</span>
        <span class="music-toggle-wave"></span>
      </button>
    `;
    document.body.insertAdjacentHTML('beforeend', playerHTML);
  }

  attachEventListeners() {
    const audio = document.getElementById('audio-player');

    document.getElementById('play-btn').addEventListener('click', () => this.togglePlay());
    document.getElementById('prev-btn').addEventListener('click', () => this.prevTrack());
    document.getElementById('next-btn').addEventListener('click', () => this.nextTrack());
    document.getElementById('player-close').addEventListener('click', () => this.closePlayer());
    document.getElementById('music-toggle').addEventListener('click', () => this.togglePlayer());
    document.getElementById('playlist-toggle').addEventListener('click', () => this.togglePlaylist());
    document.getElementById('shuffle-btn').addEventListener('click', () => this.toggleShuffle());

    // Volume
    const volSlider = document.getElementById('volume-slider');
    volSlider.addEventListener('input', (e) => {
      audio.volume = parseFloat(e.target.value);
      this.updateVolIcon(parseFloat(e.target.value));
    });
    audio.volume = this.config.volume;
    volSlider.value = this.config.volume;

    // Progress bar click + drag
    const progressBar = document.getElementById('progress-bar');
    progressBar.addEventListener('click', (e) => {
      if (!audio.duration) return;
      const rect = progressBar.getBoundingClientRect();
      const ratio = (e.clientX - rect.left) / rect.width;
      audio.currentTime = ratio * audio.duration;
    });

    // Audio events
    audio.addEventListener('timeupdate', () => this.updateProgress());
    audio.addEventListener('ended', () => this.nextTrack());
    audio.addEventListener('loadedmetadata', () => {
      document.getElementById('duration').textContent = this.formatTime(audio.duration);
    });
    audio.addEventListener('error', (e) => {
      console.warn('音频加载失败，尝试下一首:', e);
      this.handleAudioError();
    });
    audio.addEventListener('play', () => {
      document.getElementById('play-btn').textContent = '⏸';
      document.getElementById('album-art').classList.add('spinning');
      document.getElementById('music-toggle').classList.add('playing');
    });
    audio.addEventListener('pause', () => {
      document.getElementById('play-btn').textContent = '▶';
      document.getElementById('album-art').classList.remove('spinning');
      document.getElementById('music-toggle').classList.remove('playing');
    });
  }

  addTrack(track) {
    this.playlist.push({
      title: track.title || '未知歌曲',
      artist: track.artist || '未知艺术家',
      url: track.url || '',
      cover: track.cover || '',
      neteaseId: track.neteaseId || ''
    });
    this.updatePlaylistDisplay();
  }

  addTracks(tracks) {
    tracks.forEach(t => this.addTrack(t));
    if (this.playlist.length > 0) this.loadTrack(0);
  }

  togglePlay() {
    const audio = document.getElementById('audio-player');
    if (this.playlist.length === 0) return;

    if (this.isPlaying) {
      audio.pause();
      this.isPlaying = false;
    } else {
      if (!audio.src || audio.src === window.location.href) {
        this.loadTrack(0);
      }
      audio.play().catch(err => {
        console.warn('播放失败:', err);
        this.handleAudioError();
      });
      this.isPlaying = true;
    }
  }

  loadTrack(index) {
    if (index < 0 || index >= this.playlist.length) return;
    this.currentTrack = index;
    const track = this.playlist[index];
    const audio = document.getElementById('audio-player');

    audio.src = track.url;
    document.getElementById('track-title').textContent = track.title;
    document.getElementById('track-artist').textContent = track.artist;
    document.getElementById('progress-fill').style.width = '0%';
    document.getElementById('current-time').textContent = '0:00';
    document.getElementById('duration').textContent = '0:00';

    // Album art
    const albumArt = document.getElementById('album-art');
    if (track.cover) {
      albumArt.style.backgroundImage = `url(${track.cover})`;
      albumArt.querySelector('.album-placeholder').style.display = 'none';
    } else {
      albumArt.style.backgroundImage = '';
      albumArt.querySelector('.album-placeholder').style.display = 'flex';
    }

    // Highlight active
    document.querySelectorAll('.playlist-item').forEach((item, i) => {
      item.classList.toggle('active', i === index);
    });

    // Scroll active item into view
    const activeItem = document.querySelector('.playlist-item.active');
    if (activeItem) activeItem.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }

  nextTrack() {
    let nextIndex;
    if (this.isShuffle) {
      nextIndex = Math.floor(Math.random() * this.playlist.length);
    } else {
      nextIndex = (this.currentTrack + 1) % this.playlist.length;
    }
    this.loadTrack(nextIndex);
    if (this.isPlaying) {
      document.getElementById('audio-player').play().catch(() => this.handleAudioError());
    }
  }

  prevTrack() {
    const audio = document.getElementById('audio-player');
    // If more than 3s in, restart current track
    if (audio.currentTime > 3) {
      audio.currentTime = 0;
      return;
    }
    const prevIndex = (this.currentTrack - 1 + this.playlist.length) % this.playlist.length;
    this.loadTrack(prevIndex);
    if (this.isPlaying) {
      audio.play().catch(() => this.handleAudioError());
    }
  }

  handleAudioError() {
    console.warn('音频加载失败，3秒后跳到下一首...');
    document.getElementById('track-title').textContent += ' (加载失败)';
    setTimeout(() => this.nextTrack(), 3000);
  }

  updateProgress() {
    const audio = document.getElementById('audio-player');
    if (!audio.duration) return;
    const progress = (audio.currentTime / audio.duration) * 100;
    document.getElementById('progress-fill').style.width = progress + '%';
    document.getElementById('current-time').textContent = this.formatTime(audio.currentTime);
  }

  formatTime(seconds) {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  updateVolIcon(vol) {
    const icon = document.getElementById('vol-icon');
    if (vol === 0) icon.textContent = '🔇';
    else if (vol < 0.4) icon.textContent = '🔈';
    else if (vol < 0.7) icon.textContent = '🔉';
    else icon.textContent = '🔊';
  }

  toggleShuffle() {
    this.isShuffle = !this.isShuffle;
    const btn = document.getElementById('shuffle-btn');
    btn.classList.toggle('active', this.isShuffle);
    btn.title = this.isShuffle ? '顺序播放' : '随机播放';
  }

  updatePlaylistDisplay() {
    const playlistItems = document.getElementById('playlist-items');
    playlistItems.innerHTML = this.playlist.map((track, index) => `
      <div class="playlist-item ${index === this.currentTrack ? 'active' : ''}" data-index="${index}">
        <span class="item-number">${index === this.currentTrack && this.isPlaying ? '▶' : index + 1}</span>
        <div class="item-info">
          <div class="item-title">${track.title}</div>
          <div class="item-artist">${track.artist}</div>
        </div>
      </div>
    `).join('');

    document.getElementById('playlist-count').textContent = this.playlist.length;

    playlistItems.querySelectorAll('.playlist-item').forEach(item => {
      item.addEventListener('click', () => {
        const index = parseInt(item.dataset.index);
        this.loadTrack(index);
        const audio = document.getElementById('audio-player');
        audio.play().catch(() => this.handleAudioError());
        this.isPlaying = true;
        this.updatePlaylistDisplay();
      });
    });
  }

  togglePlayer() {
    const player = document.getElementById('music-player');
    const toggle = document.getElementById('music-toggle');
    const isHidden = player.classList.contains('hidden');
    player.classList.toggle('hidden', !isHidden);
    toggle.classList.toggle('open', isHidden);
  }

  closePlayer() {
    document.getElementById('music-player').classList.add('hidden');
    document.getElementById('music-toggle').classList.remove('open');
  }

  togglePlaylist() {
    const items = document.getElementById('playlist-items');
    const btn = document.getElementById('playlist-toggle');
    items.classList.toggle('collapsed');
    btn.textContent = items.classList.contains('collapsed') ? '▶' : '▼';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.musicPlayer = new MusicPlayer({ volume: 0.7 });
});
