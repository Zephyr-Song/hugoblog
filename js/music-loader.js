/**
 * Music Loader - 歌单播放
 * 进入网站随机播放，点击播放键后切页不暂停
 */
(function () {

  function initMeting() {
    var existingMeting = document.querySelector('meting-js');
    if (existingMeting) {
      console.log('[music] 播放器已存在');
      return;
    }

    var el = document.createElement('meting-js');
    el.setAttribute('server', 'netease');
    el.setAttribute('type', 'playlist');
    el.setAttribute('id', '2829816518');
    el.setAttribute('fixed', 'true');
    el.setAttribute('mini', 'true');
    el.setAttribute('autoplay', 'false');
    el.setAttribute('order', 'random');
    el.setAttribute('theme', '#8fb3a9');
    document.body.appendChild(el);

    // 切页后尝试继续播放
    function tryResume() {
      var metingEl = document.querySelector('meting-js');
      if (!metingEl || !metingEl.ap) return false;
      var ap = metingEl.ap;

      var savedPlaying = sessionStorage.getItem('music_was_playing');
      if (savedPlaying === '1') {
        ap.play().catch(function() {});
      }
      sessionStorage.removeItem('music_was_playing');
      return true;
    }

    function removeFirstSeven() {
      var metingEl = document.querySelector('meting-js');
      if (metingEl && metingEl.ap && metingEl.ap.list) {
        var ap = metingEl.ap;
        for (var i = 6; i >= 0; i--) {
          if (ap.list.audios.length > 1) {
            ap.list.remove(i);
          }
        }
        return true;
      }
      return false;
    }

    var count = 0;
    var timer = setInterval(function () {
      count++;
      if (removeFirstSeven() || count > 120) {
        clearInterval(timer);
        tryResume();
      }
    }, 200);
  }

  // 切页前记录是否在播放
  window.addEventListener('beforeunload', function () {
    var metingEl = document.querySelector('meting-js');
    if (metingEl && metingEl.ap && !metingEl.ap.audio.paused) {
      sessionStorage.setItem('music_was_playing', '1');
    }
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initMeting);
  } else {
    initMeting();
  }
})();