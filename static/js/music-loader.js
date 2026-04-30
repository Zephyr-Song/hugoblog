/**
 * Music Loader - 歌单播放
 * 进入网站随机播放，点击播放键后切页继续播放
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
    el.setAttribute('preload', 'auto');
    document.body.appendChild(el);

    function tryResume() {
      var metingEl = document.querySelector('meting-js');
      if (!metingEl || !metingEl.ap) return false;
      var ap = metingEl.ap;

      var savedPlaying = sessionStorage.getItem('music_was_playing');
      var savedTime    = sessionStorage.getItem('music_time');
      var savedIndex   = sessionStorage.getItem('music_index');

      if (savedIndex !== null) {
        var idx = parseInt(savedIndex, 10);
        if (idx >= 0 && idx < ap.list.audios.length) {
          ap.list.switch(idx);
        }
      }

      if (savedTime !== null) {
        var t = parseFloat(savedTime);
        // 等待 audio 进入可播放状态再设置时间
        var setTime = function() {
          ap.audio.currentTime = t;
          ap.audio.removeEventListener('canplay', setTime);
        };
        ap.audio.addEventListener('canplay', setTime);
      }

      if (savedPlaying === '1') {
        ap.play().catch(function() {});
      }

      sessionStorage.removeItem('music_was_playing');
      sessionStorage.removeItem('music_time');
      sessionStorage.removeItem('music_index');
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

  // 切页前记录播放状态
  window.addEventListener('pagehide', function () {
    var metingEl = document.querySelector('meting-js');
    if (metingEl && metingEl.ap && !metingEl.ap.audio.paused) {
      sessionStorage.setItem('music_was_playing', '1');
      sessionStorage.setItem('music_time', metingEl.ap.audio.currentTime);
      sessionStorage.setItem('music_index', metingEl.ap.list.index);
    }
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initMeting);
  } else {
    initMeting();
  }
})();