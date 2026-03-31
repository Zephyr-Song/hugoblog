// ==================== 音乐播放器 v4.0 - 网易云歌单嵌入 ====================

class MusicPlayer {
  constructor(config = {}) {
    this.config = config;
    this.playlistId = '';
    this.playlistName = { zh: '我的歌单', en: 'My Playlist' };
    this.lang = localStorage.getItem('music-player-lang') || 'zh';
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
          <div class="player-title-wrap">
            <span class="player-icon">🎵</span>
            <span class="player-title" id="player-title">我的歌单</span>
          </div>
          <div class="player-header-btns">
            <button class="header-btn lang-btn" id="lang-btn" title="切换中/英">中/En</button>
            <a class="header-btn open-btn" id="open-netease" href="#" target="_blank" title="在网易云打开">↗</a>
            <button class="header-btn close-btn" id="player-close" title="关闭">✕</button>
          </div>
        </div>
        <div class="netease-container" id="netease-container">
          <!-- iframe 由 setPlaylist 注入 -->
        </div>
      </div>
      <button class="music-toggle" id="music-toggle" title="打开音乐播放器">🎵</button>
    `;
    document.body.insertAdjacentHTML('beforeend', playerHTML);
  }

  setPlaylist(id, nameZh, nameEn) {
    this.playlistId = id;
    if (nameZh) this.playlistName.zh = nameZh;
    if (nameEn) this.playlistName.en = nameEn;

    // 注入网易云歌单 iframe（height=430 显示完整歌单列表）
    const container = document.getElementById('netease-container');
    container.innerHTML = `
      <iframe
        src="https://music.163.com/outchain/player?type=0&id=${id}&auto=0&height=430"
        width="100%"
        height="430"
        frameborder="0"
        allowtransparency="true"
        style="display:block;">
      </iframe>
    `;

    // 设置"在网易云打开"链接
    document.getElementById('open-netease').href =
      `https://music.163.com/#/playlist?id=${id}`;

    this.updateTitle();
  }

  updateTitle() {
    const title = document.getElementById('player-title');
    if (title) title.textContent = this.playlistName[this.lang] || this.playlistName.zh;
  }

  toggleLang() {
    this.lang = this.lang === 'zh' ? 'en' : 'zh';
    localStorage.setItem('music-player-lang', this.lang);
    this.updateTitle();
    const btn = document.getElementById('lang-btn');
    if (btn) btn.textContent = this.lang === 'zh' ? '中/En' : 'En/中';
  }

  attachEventListeners() {
    document.getElementById('player-close').addEventListener('click', () => this.closePlayer());
    document.getElementById('music-toggle').addEventListener('click', () => this.togglePlayer());
    document.getElementById('lang-btn').addEventListener('click', () => this.toggleLang());
  }

  togglePlayer() {
    const player = document.getElementById('music-player');
    player.classList.toggle('hidden');
    const isOpen = !player.classList.contains('hidden');
    document.getElementById('music-toggle').classList.toggle('playing', isOpen);
  }

  closePlayer() {
    document.getElementById('music-player').classList.add('hidden');
    document.getElementById('music-toggle').classList.remove('playing');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.musicPlayer = new MusicPlayer();
});
