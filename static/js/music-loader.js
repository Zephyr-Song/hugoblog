/**
 * Music Loader - 歌单播放
 */
(function () {

  function initMeting() {
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

    // 歌单加载后移除前7首
    function removeFirstSeven() {
      var metingEl = document.querySelector('meting-js');
      if (metingEl && metingEl.ap && metingEl.ap.list) {
        var ap = metingEl.ap;
        console.log('[music] 歌单加载完成，共', ap.list.audios.length, '首');
        // 从后往前删，避免索引问题
        for (var i = 6; i >= 0; i--) {
          if (ap.list.audios.length > 1) {
            ap.list.remove(i);
          }
        }
        console.log('[music] 删除前7首后剩余', ap.list.audios.length, '首');
        return true;
      }
      return false;
    }

    var count = 0;
    var timer = setInterval(function () {
      count++;
      if (removeFirstSeven() || count > 100) {
        clearInterval(timer);
        if (count > 100) console.warn('[music] 超时未找到播放器');
      }
    }, 300);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initMeting);
  } else {
    initMeting();
  }
})();