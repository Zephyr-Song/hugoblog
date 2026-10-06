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
    el.setAttribute('theme', '#7FBF8F');
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

  /* 音量拖动已交回 APlayer 原生处理（不再做横向化接管），见底部 initMeting 调用处 */
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

    function beginDrag(e) {
      if (!dragging) {
        dragging = true;
        wrap.classList.add('is-dragging');
      }
      // setPointerCapture 之后，后续 pointermove/pointerup 一律重定向到 wrap，
      // 拖到条外面（甚至窗口外）松手也能正常结束。
      try { wrap.setPointerCapture(e.pointerId); } catch (err) {}
      setByX(clientX(e));
    }
    function moveDrag(e) {
      if (!dragging) return;
      e.stopPropagation();
      setByX(clientX(e));
    }
    function endDrag() {
      if (!dragging) return;
      dragging = false;
      wrap.classList.remove('is-dragging');
    }

    // 1) 主力：pointer 事件，鼠标 / 触摸 / 触控笔统一处理。
    //    move/up 必须挂在 wrap 上 —— capture 生效后事件只发给 wrap，
    //    挂 document 的兼容 mousemove 在部分浏览器根本收不到（表现为"按得动拖不动"）。
    wrap.addEventListener('pointerdown', function (e) {
      if (e.pointerType === 'mouse' && typeof e.button === 'number' && e.button !== 0) return;
      e.preventDefault();
      e.stopPropagation();
      beginDrag(e);
    }, true);
    wrap.addEventListener('pointermove', moveDrag, true);
    wrap.addEventListener('pointerup', endDrag, true);
    wrap.addEventListener('pointercancel', endDrag, true);

    // 1b) 双保险：万一 setPointerCapture 失败，document 上仍有一套
    wrap.addEventListener('mousedown', function (e) {
      e.preventDefault();
      e.stopPropagation();
      beginDrag(e);
    }, true);
    document.addEventListener('pointermove', moveDrag, true);
    document.addEventListener('pointerup', endDrag, true);
    document.addEventListener('pointercancel', endDrag, true);

    // 2) 兜底 APlayer 自己的逻辑：它的 dragStart 监听 mousedown、
    //    dragMove/dragEnd 监听 document 上的 mousemove/mouseup，
    //    不拦住就会抢着按自己的（竖直方向）公式写一遍音量，把我们覆盖掉。
    wrap.addEventListener('mousedown', function (e) {
      e.preventDefault();
      e.stopPropagation();
      beginDrag(e);
    }, true);
    // 3) 触屏兜底（老浏览器没有 pointer events）
    wrap.addEventListener('touchstart', function (e) {
      if (e.cancelable) e.preventDefault();
      e.stopPropagation();
      beginDrag(e);
    }, true);
    document.addEventListener('touchmove', function (e) {
      if (!dragging) return;
      // 必须 preventDefault：不拦的话浏览器把手势接管去滚页面，
      // 并立即 fire pointercancel，拖动当场中断（真机表现为"手机上拖不动"）。
      if (e.cancelable) e.preventDefault();
      e.stopPropagation();
      moveDrag(e);
    }, { passive: false, capture: true });
    document.addEventListener('touchend', function () {
      if (!dragging) return;
      endDrag();
    }, true);
    document.addEventListener('touchcancel', function () {
      if (!dragging) return;
      endDrag();
    }, true);

    // 4) iOS / 部分移动端浏览器把 audio.volume 写成只读，程序设了也不生效：
    //    滑条会跟着动、声音却不变，用户只会觉得"调节不了"。
    //    这里检测一次，确认无效就标出来并提示用系统音量键（滑条照旧可用作显示）。
    var probeDone = false;
    function checkVolumeSupport() {
      if (probeDone || !ap.audio) return false;
      probeDone = true;
      var cur = ap.audio.volume;
      var want = cur > 0.5 ? 0.25 : 0.8;
      var stuck = false;
      try {
        ap.audio.volume = want;
        // 写进去读回来还是旧值 = 没生效（iOS 等只读设备）
        stuck = Math.abs(ap.audio.volume - want) > 0.01;
        ap.audio.volume = cur;
      } catch (err) {
        stuck = true;
      }
      if (stuck) {
        wrap.classList.add('vol-native-only');
        if (!wrap.querySelector('.vol-native-hint')) {
          var hint = document.createElement('div');
          hint.className = 'vol-native-hint';
          hint.textContent = '此设备不支持网页调音量，请用系统音量键';
          wrap.appendChild(hint);
        }
      }
      return stuck;
    }
    wrap.addEventListener('pointerdown', function () { checkVolumeSupport(); }, true);
    wrap.addEventListener('touchstart', checkVolumeSupport, true);

    // 5) 备用交互：鼠标滚轮在音量条上滚一下就 ±5%，比拖更省力
    wrap.addEventListener('wheel', function (e) {
      e.preventDefault();
      e.stopPropagation();
      var cur = ap.audio ? ap.audio.volume : 0;
      if (typeof cur !== 'number') cur = 0;
      var next = cur + (e.deltaY < 0 ? 0.05 : -0.05);
      if (next < 0) next = 0;
      if (next > 1) next = 1;
      ap.volume(Math.round(next * 100) / 100);
    }, { passive: false, capture: true });
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
  } else {
    initMeting();
  }
})();