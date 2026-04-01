/**
 * 音乐播放器自动跳下一首
 * 解决 APlayer loop 属性不生效 + 网易云试听30秒问题
 */
(function () {
  function setupAutoNext() {
    var audio = document.querySelector('.aplayer audio');
    if (!audio) return false;

    function goNext() {
      var btn = document.querySelector('.aplayer .aplayer-icon-next');
      if (btn) {
        btn.click();
      } else {
        // 备用方案：用 APlayer API
        var apEl = document.querySelector('.aplayer');
        if (apEl._aplayer) {
          apEl._aplayer.skipForward();
        }
      }
    }

    audio.addEventListener('ended', goNext);
    audio.addEventListener('error', function () {
      setTimeout(goNext, 500);
    });

    return true;
  }

  function poll() {
    var count = 0;
    var timer = setInterval(function () {
      count++;
      if (setupAutoNext() || count > 120) clearInterval(timer);
    }, 500);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', poll);
  } else {
    poll();
  }
})();
