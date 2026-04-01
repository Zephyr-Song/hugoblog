/**
 * Music Loader - 动态加载 Meting 播放器
 * 避免 Hugo --minify 破坏 HTML 属性值
 * 强制显示控制按钮
 */
(function () {
  var bound = false;

  // SVG 图标定义
  var ICONS = {
    play: '<svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>',
    pause: '<svg viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>',
    back: '<svg viewBox="0 0 24 24"><path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/></svg>',
    forward: '<svg viewBox="0 0 24 24"><path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/></svg>',
    volume: '<svg viewBox="0 0 24 24"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg>',
    menu: '<svg viewBox="0 0 24 24"><path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"/></svg>'
  };

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

  function ensureIcons(ap) {
    if (bound) return;
    bound = true;

    // 等待 DOM 更新
    setTimeout(function() {
      // 确保控制按钮显示
      var controller = document.querySelector('.aplayer-fixed .aplayer-controller');
      if (!controller) return;

      // 检查并添加缺失的图标
      var buttons = [
        { class: 'aplayer-icon-back', icon: ICONS.back, pos: 'right:75px' },
        { class: 'aplayer-icon-play', icon: ICONS.play, pos: 'right:50px' },
        { class: 'aplayer-icon-forward', icon: ICONS.forward, pos: 'right:25px' },
        { class: 'aplayer-icon-volume', icon: ICONS.volume, pos: '' },
        { class: 'aplayer-icon-menu', icon: ICONS.menu, pos: 'right:0' }
      ];

      buttons.forEach(function(btn) {
        var existing = controller.querySelector('.' + btn.class);
        if (!existing) {
          var span = document.createElement('span');
          span.className = 'aplayer-icon aplayer-icon-' + btn.class.split('-')[2];
          span.innerHTML = btn.icon;
          if (btn.pos) {
            span.style.cssText = 'position:absolute;bottom:27px;' + btn.pos + ';width:20px;height:20px;cursor:pointer;display:inline-block;visibility:visible;opacity:1;';
          }
          controller.appendChild(span);
        }
      });

      // 绑定事件
      ap.on('ended', function () {
        ap.skipForward();
      });

      var errorCount = 0;
      var maxErrors = 3;
      ap.on('error', function () {
        errorCount++;
        if (errorCount <= maxErrors) {
          setTimeout(function () { ap.skipForward(); }, 800);
        }
      });

      ap.on('play', function () {
        errorCount = 0;
      });

      console.log('[music-loader] Icons fixed');
    }, 1000);
  }

  function waitForAPlayer() {
    var count = 0;
    var timer = setInterval(function () {
      count++;
      var dom = document.querySelector('.aplayer');
      if (dom && dom.__aplayer) {
        clearInterval(timer);
        ensureIcons(dom.__aplayer);
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