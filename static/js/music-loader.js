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

  /**
   * 音量条：自定义横向音量条（.zen-vol）的拖动接管
   *
   * APlayer 原生音量条是竖向的（track + fill 两个竖条，正是用户说的
   * "右侧两个竖的，一长一短"），且拖动公式完全基于竖直方向。
   * 这里彻底不用原生音量条，改为注入一个自定义横向 .zen-vol 轨道，
   * 直接按 clientX 相对轨道左边缘的比例设音量，点击即跳、拖动即跟手。
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

  var volInitTries = 0;

  function initVolumeBar() {
    var ap = getAp();
    var wrap = document.querySelector('.aplayer.aplayer-fixed .aplayer-volume-wrap');
    if (!ap || !wrap) {
      // APlayer 由 Meting 异步初始化，拿不到实例就再试（最多 30 次 ≈ 6 秒）
      if (volInitTries++ > 30) return;
      return setTimeout(initVolumeBar, 200);
    }

    // 彻底隐藏 APlayer 原生竖向音量条（track + fill），改用自定义横向条
    var nativeBar = wrap.querySelector('.aplayer-volume-bar-wrap');
    if (nativeBar) nativeBar.style.display = 'none';

    // 注入自定义横向音量条（轨道 + 填充），作为音量图标的 flex 兄弟节点
    var bar = wrap.querySelector('.zen-vol');
    if (!bar) {
      bar = document.createElement('div');
      bar.className = 'zen-vol';
      var fill = document.createElement('div');
      fill.className = 'zen-vol-fill';
      bar.appendChild(fill);
      wrap.appendChild(bar);
    }
    var fill = bar.querySelector('.zen-vol-fill');

    function setFill(v) {
      if (v == null || isNaN(v)) v = 1;
      if (v < 0) v = 0; if (v > 1) v = 1;
      fill.style.width = (v * 100) + '%';
    }
    setFill(ap.audio ? ap.audio.volume : 1);

    var dragging = false;
    function clientX(e) {
      return e.touches && e.touches.length ? e.touches[0].clientX : e.clientX;
    }
    function setByX(x) {
      var r = bar.getBoundingClientRect();
      if (!r.width) return;
      var p = (x - r.left) / r.width;
      if (p < 0) p = 0;
      if (p > 1) p = 1;
      ap.volume(Math.round(p * 100) / 100); // APlayer 会同步 audio.volume
      setFill(p);
    }
    function beginDrag(e) {
      dragging = true;
      bar.classList.add('is-dragging');
      try { bar.setPointerCapture(e.pointerId); } catch (err) {}
      setByX(clientX(e));
    }
    function moveDrag(e) { if (!dragging) return; e.stopPropagation(); setByX(clientX(e)); }
    function endDrag() { if (!dragging) return; dragging = false; bar.classList.remove('is-dragging'); }

    // 主力：pointer 事件（鼠标 / 触摸 / 触控笔统一）
    bar.addEventListener('pointerdown', function (e) {
      if (e.pointerType === 'mouse' && typeof e.button === 'number' && e.button !== 0) return;
      e.preventDefault(); e.stopPropagation(); beginDrag(e);
    }, true);
    bar.addEventListener('pointermove', moveDrag, true);
    bar.addEventListener('pointerup', endDrag, true);
    bar.addEventListener('pointercancel', endDrag, true);
    // 双保险：setPointerCapture 失败时 document 上仍有一套
    bar.addEventListener('mousedown', function (e) { e.preventDefault(); e.stopPropagation(); beginDrag(e); }, true);
    document.addEventListener('pointermove', moveDrag, true);
    document.addEventListener('pointerup', endDrag, true);
    document.addEventListener('pointercancel', endDrag, true);
    // 触屏兜底（老浏览器无 pointer events）
    bar.addEventListener('touchstart', function (e) { if (e.cancelable) e.preventDefault(); e.stopPropagation(); beginDrag(e); }, true);
    document.addEventListener('touchmove', function (e) {
      if (!dragging) return;
      if (e.cancelable) e.preventDefault();
      e.stopPropagation();
      moveDrag(e);
    }, { passive: false, capture: true });
    document.addEventListener('touchend', function () { if (dragging) endDrag(); }, true);
    document.addEventListener('touchcancel', function () { if (dragging) endDrag(); }, true);

    // iOS / 部分移动端把 audio.volume 写成只读：检测一次，无效则提示用系统音量键
    var probeDone = false;
    function checkVolumeSupport() {
      if (probeDone || !ap.audio) return;
      probeDone = true;
      var cur = ap.audio.volume;
      var want = cur > 0.5 ? 0.25 : 0.8;
      var stuck = false;
      try {
        ap.audio.volume = want;
        stuck = Math.abs(ap.audio.volume - want) > 0.01;
        ap.audio.volume = cur;
      } catch (err) { stuck = true; }
      if (stuck && !wrap.querySelector('.vol-native-hint')) {
        var hint = document.createElement('div');
        hint.className = 'vol-native-hint';
        hint.textContent = '此设备不支持网页调音量，请用系统音量键';
        wrap.appendChild(hint);
      }
    }
    bar.addEventListener('pointerdown', checkVolumeSupport, true);
    bar.addEventListener('touchstart', checkVolumeSupport, true);

    // 备用：滚轮 ±5%
    bar.addEventListener('wheel', function (e) {
      e.preventDefault(); e.stopPropagation();
      var cur = ap.audio ? ap.audio.volume : 0;
      if (typeof cur !== 'number') cur = 0;
      var next = cur + (e.deltaY < 0 ? 0.05 : -0.05);
      if (next < 0) next = 0; if (next > 1) next = 1;
      ap.volume(Math.round(next * 100) / 100);
    }, { passive: false, capture: true });

    // 与 APlayer 同步：静音开关 / 程序改音量时，原生 .aplayer-volume 的 inline height
    // 会变化，把比例镜像到自定义条（无缝跟随喇叭图标的静音动作）
    var nativeFill = document.querySelector('.aplayer.aplayer-fixed .aplayer-volume');
    if (nativeFill && typeof MutationObserver !== 'undefined') {
      new MutationObserver(function () {
        var h = parseFloat(nativeFill.style.height);
        if (!isNaN(h)) setFill(h / 100);
      }).observe(nativeFill, { attributes: true, attributeFilter: ['style'] });
    }
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
      setTimeout(initVolumeBar, 500);
    });
  } else {
    initMeting();
    setTimeout(initVolumeBar, 500);
  }
})();