/**
 * 音乐播放器自动跳下一首
 * 通过 monkey-patch APlayer 构造函数，在初始化时自动绑定 ended/error 事件
 */
(function () {
  // 保存原始 APlayer 构造函数
  var OrigAPlayer = window.APlayer;

  // 如果 APlayer 已加载，直接 patch；否则等加载完再 patch
  function patch() {
    if (typeof window.APlayer !== 'function') return false;

    var Orig = window.APlayer;
    window.APlayer = function () {
      var instance = new Orig.apply(this, arguments);

      // 自动跳下一首
      instance.on('ended', function () {
        instance.skipForward();
      });
      instance.on('error', function () {
        setTimeout(function () { instance.skipForward(); }, 500);
      });

      return instance;
    };

    // 继承原型
    window.APlayer.prototype = Orig.prototype;
    window.APlayer.constructor = Orig;

    console.log('[auto-next] APlayer patched OK');
    return true;
  }

  if (!patch()) {
    // APlayer 还没加载，轮询等待
    var count = 0;
    var timer = setInterval(function () {
      count++;
      if (patch() || count > 60) clearInterval(timer);
    }, 500);
  }
})();
