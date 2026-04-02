/**
 * Music Loader - 动态加载 Meting 播放器
 */
(function () {
  // 手机端不加载播放器
  if (window.innerWidth < 768) {
    return;
  }

  function initMeting() {
    var el = document.createElement('meting-js');
    el.setAttribute('server', 'netease');
    el.setAttribute('type', 'playlist');
    el.setAttribute('id', '2809513713');
    el.setAttribute('fixed', 'true');
    el.setAttribute('mini', 'false');
    el.setAttribute('list-folded', 'false');
    el.setAttribute('autoplay', 'false');
    el.setAttribute('theme', '#8fb3a9');
    document.body.appendChild(el);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initMeting);
  } else {
    initMeting();
  }
})();