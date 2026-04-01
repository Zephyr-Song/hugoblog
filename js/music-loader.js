/**
 * Music Loader - 替代 HTML <meting-js> 标签
 * 用 JavaScript 动态创建 meting-js 元素，避免 Hugo --minify 破坏属性值
 * 同时自动绑定 ended/error 事件实现自动下一首
 */
(function () {
  function initMeting() {
    var el = document.createElement('meting-js');
    el.setAttribute('server', 'netease');
    el.setAttribute('type', 'playlist');
    el.setAttribute('id', '2809513713');
    el.setAttribute('fixed', 'true');
    el.setAttribute('mini', 'true');
    el.setAttribute('list-folded', 'false');
    el.setAttribute('list-max-height', '180px');
    el.setAttribute('autoplay', 'false');
    el.setAttribute('loop', 'all');
    el.setAttribute('order', 'random');
    el.setAttribute('volume', '0.7');
    el.setAttribute('mutex', 'true');
    el.setAttribute('preload', 'auto');
    el.setAttribute('theme', '#8fb3a9');
    document.body.appendChild(el);

    /* 等 Meting 异步拉取歌单、创建 APlayer 实例 */
    waitForAPlayer();
  }

  function waitForAPlayer() {
    var count = 0;
    var timer = setInterval(function () {
      count++;
      var dom = document.querySelector('.aplayer');
      if (dom && dom.__aplayer) {
        clearInterval(timer);
        var ap = dom.__aplayer;

        /* 强制开启循环（双重保险） */
        ap.loop = 'all';

        /* 播完自动下一首 */
        ap.on('ended', function () {
          ap.skipForward();
        });
        /* 加载出错也自动跳过 */
        ap.on('error', function () {
          setTimeout(function () { ap.skipForward(); }, 500);
        });

        console.log('[music-loader] APlayer ready, loop=' + ap.loop);
        return;
      }
      if (count > 120) {
        clearInterval(timer);
        console.warn('[music-loader] APlayer instance not found after 60 s');
      }
    }, 500);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initMeting);
  } else {
    initMeting();
  }
})();
