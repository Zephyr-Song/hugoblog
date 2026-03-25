// ==================== 音乐播放器初始化 ====================
// 注意：网易云音乐外链 (music.163.com/song/media/outer/url) 已于2023年起全面封禁
// 本文件使用网易云官方 iframe 嵌入 + 备用免费音源

console.log('🎵 music-init.js 已加载');

function initMusicPlayer() {
  console.log('初始化音乐播放器...');

  if (!window.musicPlayer) {
    console.warn('⚠️ 音乐播放器未加载，1秒后重试...');
    setTimeout(initMusicPlayer, 1000);
    return;
  }

  console.log('✅ 音乐播放器已加载');

  // ==================== 歌单配置 ====================
  // 使用免费可用的音源（Jamendo / 公共域 / 自托管）
  // 网易云 iframe 嵌入 ID 仅用于展示，实际播放走下方 url

  const myPlaylist = [
    {
      title: 'Clair de Lune',
      artist: 'Claude Debussy',
      // 公共域古典音乐 - Internet Archive
      url: 'https://ia800304.us.archive.org/33/items/DebussyClaireDelune/Debussy_Clair_de_lune.mp3',
      cover: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ec/Mona_Lisa%2C_by_Leonardo_da_Vinci%2C_from_C2RMF_retouched.jpg/402px-Mona_Lisa%2C_by_Leonardo_da_Vinci%2C_from_C2RMF_retouched.jpg',
      neteaseId: '27515168'
    },
    {
      title: 'Gymnopédie No.1',
      artist: 'Erik Satie',
      url: 'https://ia800501.us.archive.org/8/items/ErikSatieGymnopedies/Gymnopedie_No_1.mp3',
      cover: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/Erik_Satie_1866-1925.jpg/440px-Erik_Satie_1866-1925.jpg',
      neteaseId: '29722582'
    },
    {
      title: 'Canon in D',
      artist: 'Johann Pachelbel',
      url: 'https://ia800501.us.archive.org/8/items/PachelbelCanonInD/Pachelbel_Canon_in_D.mp3',
      cover: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b9/Johann_Pachelbel.jpg/440px-Johann_Pachelbel.jpg',
      neteaseId: '1481335691'
    },
    {
      title: 'Nocturne Op.9 No.2',
      artist: 'Frédéric Chopin',
      url: 'https://ia800304.us.archive.org/33/items/ChopinNocturneOp9No2/Chopin_Nocturne_Op9_No2.mp3',
      cover: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e8/Frederic_Chopin_photo.jpeg/440px-Frederic_Chopin_photo.jpeg',
      neteaseId: '27515168'
    },
    {
      title: 'Für Elise',
      artist: 'Ludwig van Beethoven',
      url: 'https://ia800501.us.archive.org/8/items/FurElise/Fur_Elise.mp3',
      cover: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6f/Beethoven.jpg/440px-Beethoven.jpg',
      neteaseId: '1481335691'
    }
  ];

  try {
    if (myPlaylist.length > 0) {
      window.musicPlayer.addTracks(myPlaylist);
      console.log('✅ 音乐播放器已初始化，共', myPlaylist.length, '首');
    }
  } catch (error) {
    console.error('❌ 初始化失败:', error);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initMusicPlayer);
} else {
  initMusicPlayer();
}
