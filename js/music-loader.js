/**
 * Music Loader - 歌单播放
 * 切换页面保持播放状态，不自动切歌
 */
(function () {
  // 页面即将卸载时，记录当前播放状态
  window.addEventListener('beforeunload', function () {
    var metingEl = document.querySelector('meting-js');
    if (metingEl && metingEl.ap) {
      var ap = metingEl.ap;
      sessionStorage.setItem('music_playing', ap.audio.paused ? '0' : '1');
      sessionStorage.setItem('music_index', ap.list.index);
      sessionStorage.setItem('music_time', ap.audio.currentTime);
    }
  });

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
    el.setAttribute('order', 'list');
    el.setAttribute('theme', '#8fb3a9');
    document.body.appendChild(el);

    function restoreState() {
      var metingEl = document.querySelector('meting-js');
      if (!metingEl || !metingEl.ap) return false;

      var ap = metingEl.ap;
      var wasPlaying = sessionStorage.getItem('music_playing');
      var savedIndex = sessionStorage.getItem('music_index');
      var savedTime = sessionStorage.getItem('music_time');

      // 切到之前的歌曲
      if (savedIndex !== null && ap.list.audios.length > 0) {
        var idx = parseInt(savedIndex, 10);
        if (idx >= 0 && idx < ap.list.audios.length) {
          ap.list.switch(idx);
          // 同步歌曲信息显示
          ap.audio.currentTime = parseFloat(savedTime) || 0;
        }
      }

      // 如果之前在播放，切页后继续播放
      if (wasPlaying === '1') {
        ap.play().catch(function() {});
      }
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
      if (removeFirstSeven()) {
        // 删除后恢复播放状态
        restoreState();
      }
      if (count > 120) {
        clearInterval(timer);
        restoreState();
      }
    }, 200);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initMeting);
  } else {
    initMeting();
  }
})();