/**
 * Music Loader - 歌单播放
 */
(function () {

  // window.meting_api 由 extend_footer.html 设置，此处不再覆盖

  function initMeting() {
    // 已有播放器则不再创建，避免切换页面时重新切歌
    var existingMeting = document.querySelector('meting-js');
    if (existingMeting) {
      console.log('[music] 播放器已存在，跳过重复创建');
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