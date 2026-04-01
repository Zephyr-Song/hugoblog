/**
 * Music Loader - 动态加载 Meting 播放器
 * 避免 Hugo --minify 破坏 HTML 属性值
 */
(function () {
  var bound = false;

  function initMeting() {
    var el = document.createElement('meting-js');
    el.setAttribute('server', 'netease');
    el.setAttribute('type', 'playlist');
    el.setAttribute('id', '2809513713');
    el.setAttribute('fixed', 'true');
    el.setAttribute('mini', 'false');
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
  }

  function bindOnce(ap) {
    if (bound) return;
    bound = true;

    ap.on('ended', function () {
      /* 正常播放结束才跳下一首 */
      ap.skipForward();
    });

    /* 错误处理：最多连续跳过3首，防止无限循环 */
    var errorCount = 0;
    var maxErrors = 3;
    ap.on('error', function () {
      errorCount++;
      if (errorCount <= maxErrors) {
        setTimeout(function () { ap.skipForward(); }, 800);
      } else {
        console.warn('[music-loader] Too many errors, stopped auto-skip');
      }
    });

    /* 播放成功后重置错误计数 */
    ap.on('play', function () {
      errorCount = 0;
    });

    console.log('[music-loader] Events bound, loop=' + ap.loop);
  }

  function waitForAPlayer() {
    var count = 0;
    var timer = setInterval(function () {
      count++;
      var dom = document.querySelector('.aplayer');
      if (dom && dom.__aplayer) {
        clearInterval(timer);
        bindOnce(dom.__aplayer);
      }
      if (count > 100) {
        clearInterval(timer);
        console.warn('[music-loader] Timeout');
      }
    }, 300);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      initMeting();
      waitForAPlayer();
    });
  } else {
    initMeting();
    waitForAPlayer();
  }
})();
