/**
 * Music Loader - 简单稳定版
 */
(function () {
  function initMeting() {
    var el = document.createElement('meting-js');
    el.setAttribute('server', 'netease');
    el.setAttribute('type', 'playlist');
    el.setAttribute('id', '2809513713');
    el.setAttribute('fixed', 'true');
    el.setAttribute('mini', 'true');
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