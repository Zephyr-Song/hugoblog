/**
 * Music Loader - 歌单播放（跳过前7首）
 */
(function () {
  // 手机端不加载播放器
  var isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth < 1024;

  if (isMobile) {
    return;
  }

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
      var apEl = document.querySelector('.aplayer');
      if (apEl && apEl.__aplayer && apEl.__aplayer.list && apEl.__aplayer.list.audios) {
        var ap = apEl.__aplayer;
        for (var i = 0; i < 7 && ap.list.audios.length > 1; i++) {
          ap.list.remove(0);
        }
        ap.list.show();
        return true;
      }
      return false;
    }

    var count = 0;
    var timer = setInterval(function () {
      count++;
      if (removeFirstSeven() || count > 60) {
        clearInterval(timer);
      }
    }, 500);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initMeting);
  } else {
    initMeting();
  }
})();