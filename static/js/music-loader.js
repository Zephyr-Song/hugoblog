/**
 * Music Loader - 歌单播放
 * 进入网站随机播放，点击播放键后切页继续播放
 */
(function () {

  function initMeting() {
    var existingMeting = document.querySelector('meting-js');
    if (existingMeting) {
      console.log('[music] 播放器已存在');
      return;
    }

    var el = document.createElement('meting-js');
    el.setAttribute('server', 'netease');
    el.setAttribute('type', 'playlist');
    el.setAttribute('id', '2829816518');
    el.setAttribute('fixed', 'true');
    el.setAttribute('mini', 'true');
    el.setAttribute('autoplay', 'false');
    el.setAttribute('order', 'random');
    el.setAttribute('theme', '#C08552');
    el.setAttribute('preload', 'auto');
    document.body.appendChild(el);

    function tryResume() {
      var ap = getAp();
      if (!ap) return false;

      var savedPlaying = sessionStorage.getItem('music_was_playing');
      var savedTime    = sessionStorage.getItem('music_time');
      var savedIndex   = sessionStorage.getItem('music_index');

      if (savedIndex !== null) {
        var idx = parseInt(savedIndex, 10);
        if (idx >= 0 && idx < ap.list.audios.length) {
          ap.list.switch(idx);
        }
      }

      if (savedTime !== null) {
        var t = parseFloat(savedTime);
        // 等待 audio 进入可播放状态再设置时间
        var setTime = function() {
          ap.audio.currentTime = t;
          ap.audio.removeEventListener('canplay', setTime);
        };
        ap.audio.addEventListener('canplay', setTime);
      }

      if (savedPlaying === '1') {
        ap.play().catch(function() {});
      }

      sessionStorage.removeItem('music_was_playing');
      sessionStorage.removeItem('music_time');
      sessionStorage.removeItem('music_index');
      return true;
    }

    function removeFirstSeven() {
      var ap = getAp();
      if (ap && ap.list) {
        for (var i = 6; i >= 0; i--) {
          if (ap.list.audios.length > 1) {
            ap.list.remove(i);
          }
        }
        return true;
      }
      return false;
    }

    var count = 0;
    var timer = setInterval(function () {
      count++;
      if (removeFirstSeven() || count > 120) {
        clearInterval(timer);
        tryResume();
      }
    }, 200);
  }

  /**
   * 音量条：接管拖动（音量条横向化之后必须做）
   *
   * APlayer 原生的音量拖动公式是：
   *   1 - (clientY - barTop) / bar.clientHeight
   * 完全基于**竖直方向**。音量条被 rotate(90deg) 转成横向后，这个公式的
   * 分子（鼠标的 Y）和分母（元素的 clientHeight）不再对应同一根轴，
   * 结果就是鼠标左右移动几乎不改音量（表现为"总是滑不动"）。
   *
   * 这里用自己的拖动替代：直接按 clientX 相对轨道左边缘的比例设音量，
   * 点击即跳、拖动即跟手（灵敏度 1:1）。
   *
   * 用 capture 阶段 + stopPropagation 顶掉 APlayer 自己的监听：
   * dragStart 挂在 .aplayer-volume-wrap，dragMove/dragEnd 挂在 document。
   */
  /**
   * 取 APlayer 实例。
   * 注意：Meting 不同版本挂载的字段名不一样 —— 新版挂在 el.aplayer，
   * 老版挂在 el.ap，两者都要兼容（原来的续播逻辑只认 .ap，实际一直是失效的）。
   */
  function getAp() {
    var el = document.querySelector('meting-js');
    if (!el) return null;
    return el.aplayer || el.ap || null;
  }

  var volDragTries = 0;

  function initVolumeDrag() {
    var ap = getAp();
    var wrap = document.querySelector('.aplayer .aplayer-volume-wrap');
    var barWrap = wrap && wrap.querySelector('.aplayer-volume-bar-wrap');

    // APlayer 由 Meting 异步初始化，拿不到实例就再试（最多 30 次 ≈ 6 秒）
    if (!ap || !barWrap) {
      if (volDragTries++ > 30) return;
      return setTimeout(initVolumeDrag, 200);
    }
    var dragging = false;

    function clientX(e) {
      return e.touches && e.touches.length ? e.touches[0].clientX : e.clientX;
    }

    function setByX(x) {
      // 旋转后：rect.width = 视觉长度，rect.height = 视觉厚度
      var r = barWrap.getBoundingClientRect();
      if (!r.width) return;
      var p = (x - r.left) / r.width;
      if (p < 0) p = 0;
      if (p > 1) p = 1;
      ap.volume(Math.round(p * 100) / 100); // APlayer 会同步 UI 与 audio.volume
    }

    function onDown(e) {
      dragging = true;
      if (e.cancelable) e.preventDefault();
      e.stopPropagation();
      setByX(clientX(e));
    }
    function onMove(e) {
      if (!dragging) return;
      if (e.cancelable) e.preventDefault();
      e.stopPropagation();
      setByX(clientX(e));
    }
    function onUp(e) {
      if (!dragging) return;
      dragging = false;
      e.stopPropagation();
    }

    wrap.addEventListener('mousedown', onDown, true);
    document.addEventListener('mousemove', onMove, true);
    document.addEventListener('mouseup', onUp, true);
    wrap.addEventListener('touchstart', onDown, true);
    document.addEventListener('touchmove', onMove, true);
    document.addEventListener('touchend', onUp, true);
  }

  // 切页前记录播放状态
  window.addEventListener('pagehide', function () {
    var ap = getAp();
    if (ap && ap.audio && !ap.audio.paused) {
      sessionStorage.setItem('music_was_playing', '1');
      sessionStorage.setItem('music_time', ap.audio.currentTime);
      sessionStorage.setItem('music_index', ap.list.index);
    }
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initMeting);
    document.addEventListener('DOMContentLoaded', function () {
      setTimeout(initVolumeDrag, 500);
    });
  } else {
    initMeting();
    setTimeout(initVolumeDrag, 500);
  }
})();