/**
 * 音乐播放器自动跳下一首（修复版）
 * 直接获取 Meting 创建的 APlayer 实例，绑定 ended/error 事件
 */
(function () {
  function bindEvents(ap) {
    ap.on('ended', function () {
      ap.skipForward();
    });
    ap.on('error', function () {
      setTimeout(function () { ap.skipForward(); }, 500);
    });
    console.log('[auto-next] Bound ended/error events to APlayer');
  }

  function tryBind() {
    /* Meting 把实例挂在 .aplayer DOM 元素的 __aplayer 属性上 */
    var el = document.querySelector('.aplayer');
    if (el && el.__aplayer) {
      bindEvents(el.__aplayer);
      return true;
    }

    /* 备用：Meting 2.x 内部也通过 .ap 存储实例 */
    var metingEl = document.querySelector('meting-js');
    if (metingEl && metingEl.ap) {
      bindEvents(metingEl.ap);
      return true;
    }
    return false;
  }

  if (!tryBind()) {
    var count = 0;
    var timer = setInterval(function () {
      count++;
      if (tryBind() || count > 120) {
        clearInterval(timer);
        if (count > 120) console.warn('[auto-next] APlayer instance not found after 60s');
      }
    }, 500);
  }
})();
