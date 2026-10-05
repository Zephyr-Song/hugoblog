/*!
 * zen-art.js — 给 PaperMod 原生页面叠加程序化 SVG 插画
 *
 * 设计原则：完全不动 PaperMod 的 CSS/布局，只做「加法」——
 *   1. 为每篇文章卡片插入一张确定性生成的 SVG 封面
 *   2. 在 hero 区插入装饰图案
 *   3. 章节之间插入图案分隔线
 * 原样式、原配色、原布局全部保留。
 */
(function () {
  'use strict';

  /* ============ 确定性伪随机 ============ */
  function hashCode(str) {
    var h = 2166136261 >>> 0;
    for (var i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619) >>> 0;
    }
    return h >>> 0;
  }

  function rngFrom(seedStr) {
    var s = hashCode(seedStr) || 1;
    return function () {
      /* xorshift32 */
      s ^= s << 13; s >>>= 0;
      s ^= s >> 17;
      s ^= s << 5;  s >>>= 0;
      return s / 4294967296;
    };
  }

  /* ============ 粉彩配色（低饱和，参考 wisdomechoes 风格） ============ */
  var PALETTES = [
    { bg: '#F4F1FA', soft: '#E6DFF3', ink: '#9080C0', hot: '#7C63B8' },
    { bg: '#EFF4F9', soft: '#DCE7F2', ink: '#7590AE', hot: '#55749A' },
    { bg: '#F6F2FA', soft: '#E9DEF2', ink: '#A585BE', hot: '#8A67A8' },
    { bg: '#EFF5F3', soft: '#DCEAE4', ink: '#75A192', hot: '#548576' },
    { bg: '#F5F2F7', soft: '#E6DEEC', ink: '#9A85AE', hot: '#7E6795' },
    { bg: '#F2F4F7', soft: '#DFE4EC', ink: '#8296AC', hot: '#63788F' }
  ];

  /* ============ 6 种图形母题 ============ */
  var MOTIFS = ['area', 'bars', 'rings', 'peaks', 'spectrum', 'warp'];

  function el(tag, attrs) {
    var e = document.createElementNS('http://www.w3.org/2000/svg', tag);
    for (var k in attrs) {
      if (Object.prototype.hasOwnProperty.call(attrs, k)) e.setAttribute(k, attrs[k]);
    }
    return e;
  }

  /**
   * 生成一张插画
   * @param {string} seed  文章标题 → 确定性种子
   * @param {number} uid   唯一 id 后缀（避免同页 defs 冲突）
   */
  function buildArt(seed, uid) {
    var rnd = rngFrom(seed);
    var P = PALETTES[Math.floor(rnd() * PALETTES.length)];
    var motif = MOTIFS[Math.floor(rnd() * MOTIFS.length)];
    var W = 800, H = 450;
    var CX = W / 2, CY = H / 2;

    var svg = el('svg', {
      viewBox: '0 0 ' + W + ' ' + H,
      preserveAspectRatio: 'xMidYMid slice',
      xmlns: 'http://www.w3.org/2000/svg',
      'aria-hidden': 'true', focusable: 'false'
    });
    svg.setAttribute('class', 'zen-art');

    var defs = el('defs');
    var grad = el('linearGradient', { id: 'zg' + uid, x1: '0', y1: '0', x2: '1', y2: '1' });
    grad.appendChild(el('stop', { offset: '0%', 'stop-color': P.bg }));
    grad.appendChild(el('stop', { offset: '100%', 'stop-color': P.soft }));
    defs.appendChild(grad);

    var pat = el('pattern', { id: 'zp' + uid, width: '25', height: '25', patternUnits: 'userSpaceOnUse' });
    pat.appendChild(el('path', { d: 'M25 0H0V25', fill: 'none', stroke: P.soft, 'stroke-width': '1.4', opacity: '0.9' }));
    defs.appendChild(pat);
    svg.appendChild(defs);

    svg.appendChild(el('rect', { width: W, height: H, fill: 'url(#zg' + uid + ')' }));
    svg.appendChild(el('rect', { width: W, height: H, fill: 'url(#zp' + uid + ')' }));

    var g = el('g');
    svg.appendChild(g);

    if (motif === 'area') {
      var y0 = H / 3 + rnd() * 40;
      var y1 = H / 2 + rnd() * 60;
      var y2 = H / 2 + rnd() * 70;
      var y3 = H / 3 + rnd() * 50;
      var d = 'M0,' + y0 +
              ' C' + (W / 3) + ',' + (y0 - 70) + ' ' + (W / 3) + ',' + (y1 - 90) + ' ' + CX + ',' + y1 +
              ' C' + (W * 2 / 3) + ',' + (y2 + 80) + ' ' + (W * 4 / 3) + ',' + y2 + ' ' + W + ',' + y3;
      g.appendChild(el('path', { d: d + ' L' + W + ',' + H + ' L0,' + H + ' Z', fill: P.ink, opacity: '0.2' }));
      g.appendChild(el('path', { d: d, fill: 'none', stroke: P.hot, 'stroke-width': '3.5', 'stroke-linecap': 'round' }));
      g.appendChild(el('path', { d: d, fill: 'none', stroke: P.hot, 'stroke-width': '2', 'stroke-dasharray': '6 8', opacity: '0.75' }));
      g.appendChild(el('circle', { cx: CX, cy: y1, r: '8', fill: P.hot }));
      g.appendChild(el('circle', { cx: CX, cy: y1, r: '16', fill: 'none', stroke: P.hot, 'stroke-width': '1.5', opacity: '0.5' }));

    } else if (motif === 'bars') {
      for (var i = 0; i < 9; i++) {
        var bh = 24 + rnd() * 160;
        g.appendChild(el('rect', {
          x: 34 + i * 62, y: H - 44 - bh, width: 26, height: bh, rx: 5,
          fill: P.ink, opacity: '0.32'
        }));
      }
      var pts = [];
      for (var j = 0; j < 10; j++) {
        pts.push((40 + j * 68) + ',' + (H - 96 - rnd() * 200));
      }
      g.appendChild(el('polyline', {
        points: pts.join(' '), fill: 'none', stroke: P.hot, 'stroke-width': '3.5',
        'stroke-linecap': 'round', 'stroke-linejoin': 'round'
      }));
      for (var k = 0; k < pts.length; k += 3) {
        var xy = pts[k].split(',');
        g.appendChild(el('circle', { cx: xy[0], cy: xy[1], r: 6, fill: P.hot }));
      }

    } else if (motif === 'rings') {
      var base = 118 + rnd() * 46;
      for (var m = 0; m < 5; m++) {
        var rr = base - m * 32;
        if (rr <= 8) continue;
        g.appendChild(el('circle', {
          cx: CX, cy: CY, r: rr, fill: 'none', stroke: P.ink,
          'stroke-width': m === 0 ? '3.5' : '1.6',
          opacity: m === 0 ? '0.9' : '0.5'
        }));
      }
      g.appendChild(el('circle', { cx: CX - 44, cy: CY - 28, r: 30, fill: P.hot, opacity: '0.92' }));
      g.appendChild(el('circle', { cx: CX - 54, cy: CY - 38, r: 9, fill: '#fff', opacity: '0.35' }));
      g.appendChild(el('line', {
        x1: CX, y1: CY, x2: W, y2: CY - 128,
        stroke: P.hot, 'stroke-width': '2.5', 'stroke-dasharray': '5 6'
      }));

    } else if (motif === 'peaks') {
      var baseY = H / 2 + 60;
      for (var n = 2; n >= 0; n--) {
        var off = n * 52;
        var o = baseY + off;
        var d2 = 'M0,' + o +
          ' L' + (W / 8) + ',' + (o - (52 + n * 20)) +
          ' L' + (W / 4) + ',' + (o + 26) +
          ' L' + CX + ',' + (o - (88 + n * 14)) +
          ' L' + (W * 3 / 4) + ',' + (o + 42) +
          ' L' + (W * 7 / 8) + ',' + (o - (58 + n * 12)) +
          ' L' + W + ',' + (o + 22) +
          ' L' + W + ',' + o + ' Z';
        g.appendChild(el('path', {
          d: d2, fill: n === 0 ? P.hot : P.ink,
          opacity: n === 0 ? '0.88' : (0.9 - n * 0.26)
        }));
      }
      g.appendChild(el('circle', { cx: W * 0.75, cy: 76, r: 26, fill: P.hot, opacity: '0.45' }));

    } else if (motif === 'spectrum') {
      for (var s = 0; s < 32; s++) {
        var amp = 20 + rnd() * 132;
        g.appendChild(el('rect', {
          x: 24 + s * 21, y: CY - amp / 2, width: 9, height: amp, rx: 4.5,
          fill: P.ink, opacity: amp > 104 ? '0.88' : '0.42'
        }));
      }
      g.appendChild(el('path', {
        d: 'M0,' + CY + ' Q' + (W / 4) + ',' + (CY - 44) + ' ' + CX + ',' + CY +
           ' T' + (W * 3 / 4) + ',' + (CY - 44),
        fill: 'none', stroke: P.hot, 'stroke-width': '2.5', 'stroke-dasharray': '4 8'
      }));

    } else { /* warp */
      for (var q = 0; q < 9; q++) {
        var ry = 40 + q * 42;
        var amp = 122 - q * 9;
        g.appendChild(el('path', {
          d: 'M0,' + ry + ' Q' + (W / 4) + ',' + (ry - amp) + ' ' + CX + ',' + ry +
             ' T' + (W * 3 / 4) + ',' + (ry + amp),
          fill: 'none', stroke: P.ink, 'stroke-width': '1.8', opacity: 0.95 - q * 0.07
        }));
      }
      for (var t = 0; t < 7; t++) {
        var rx = 60 + t * 108;
        g.appendChild(el('path', {
          d: 'M' + rx + ',0 Q' + rx + ',' + (H / 3) + ' ' + (rx + 30) + ',' + CY +
             ' T' + (rx - 20) + ',' + H,
          fill: 'none', stroke: P.hot, 'stroke-width': '1.5', opacity: '0.42'
        }));
      }
    }

    /* 角标大字已按需求移除，只保留边框 + 左下角圆点 */
    svg.appendChild(el('rect', {
      x: 1.5, y: 1.5, width: W - 3, height: H - 3,
      fill: 'none', stroke: P.hot, 'stroke-width': 3, opacity: '0.45'
    }));
    svg.appendChild(el('circle', { cx: 30, cy: H - 30, r: 6, fill: P.hot }));

    return svg;
  }

  /* ============ 给首页 / 列表页的文章卡片加封面 ============ */
  function decorateCards() {
    var isList = document.body.classList.contains('list');
    if (!isList) return;

    var cards = document.querySelectorAll(
      '.post-entry:not(.first-entry), .first-entry.home-info + .post-entry'
    );
    if (!cards.length) {
      cards = document.querySelectorAll('.post-entry');
    }

    Array.prototype.forEach.call(cards, function (card, i) {
      if (card.querySelector('.zen-art-wrap')) return;      /* 已装饰 */
      if (card.querySelector('.entry-cover img')) return;   /* 有真实封面则跳过 */

      var hEl = card.querySelector('.entry-header h1, .entry-header h2, h2, h1');
      var title = (hEl ? hEl.textContent : ('post-' + i)).trim();
      var link = card.querySelector('.entry-link') || card.querySelector('a');

      /* --- 左侧插画 --- */
      var media = document.createElement('div');
      media.className = 'zen-art-wrap';
      media.setAttribute('aria-hidden', 'true');
      media.appendChild(buildArt(title || ('post-' + i), 'c' + i));

      /* --- 序号角标（模仿参考站 01/02/03） --- */
      var num = document.createElement('span');
      num.className = 'zen-art-num';
      num.setAttribute('aria-hidden', 'true');
      num.textContent = (i + 1 < 10 ? '0' : '') + (i + 1);

      var left = document.createElement('div');
      left.className = 'zen-art-left';
      left.appendChild(media);
      left.appendChild(num);

      /* --- 组装：左图 + 右文 ---
       * 把除 .entry-link 之外的所有原内容搬进右栏，
       * PaperMod 原有的标题/摘要/元信息样式全部保留。 */
      var right = document.createElement('div');
      right.className = 'zen-art-right';

      var moved = [];
      Array.prototype.forEach.call(card.childNodes, function (node) {
        if (node === left) return;
        if (node.nodeType === 1 && node.classList.contains('entry-link')) return;
        moved.push(node);
      });
      moved.forEach(function (n) { right.appendChild(n); });

      card.appendChild(left);
      card.appendChild(right);
      card.classList.add('zen-art-row');

      /* 让整块可点击，但不覆盖原标题链接的语义 */
      if (link && link.classList.contains('entry-link')) {
        left.setAttribute('aria-hidden', 'true');
      }
    });
  }

  /* ============ Hero 区装饰图案 ============ */
  function decorateHero() {
    var entry = document.querySelector('.home-info');
    if (!entry) return;
    /* 已装饰过则跳过 */
    if (entry.querySelector('.zen-hero-decor')) return;

    var h1 = entry.querySelector('.entry-header h1');
    var decor = document.createElement('div');
    decor.className = 'zen-hero-decor';
    decor.setAttribute('aria-hidden', 'true');

    var svg = el('svg', {
      viewBox: '0 0 520 150', preserveAspectRatio: 'xMidYMid meet',
      xmlns: 'http://www.w3.org/2000/svg'
    });
    var defs = el('defs');
    var lg = el('linearGradient', { id: 'zhg', x1: '0', y1: '0', x2: '1', y2: '0' });
    lg.appendChild(el('stop', { offset: '0%', 'stop-color': '#FF7EB6', 'stop-opacity': '0' }));
    lg.appendChild(el('stop', { offset: '28%', 'stop-color': '#C77DFF', 'stop-opacity': '0.8' }));
    lg.appendChild(el('stop', { offset: '70%', 'stop-color': '#7ED8F0', 'stop-opacity': '0.8' }));
    lg.appendChild(el('stop', { offset: '100%', 'stop-color': '#7ED8F0', 'stop-opacity': '0' }));
    defs.appendChild(lg);
    svg.appendChild(defs);

    /* 等距网格（淡） */
    for (var i = 0; i <= 13; i++) {
      svg.appendChild(el('line', {
        x1: i * 40, y1: 0, x2: i * 40 - 60, y2: 150,
        stroke: '#C77DFF', 'stroke-width': '1', opacity: '0.13'
      }));
    }
    for (var j = 0; j <= 4; j++) {
      svg.appendChild(el('line', {
        x1: 0, y1: j * 37, x2: 520, y2: j * 37,
        stroke: '#7ED8F0', 'stroke-width': '1', opacity: '0.11'
      }));
    }

    /* 主曲线 + 面积填充 */
    var d = 'M0,105 C70,55 120,135 190,85 C260,35 320,120 400,72 C450,42 490,80 520,60';
    svg.appendChild(el('path', {
      d: d + ' L520,150 L0,150 Z', fill: '#C77DFF', opacity: '0.07'
    }));
    svg.appendChild(el('path', {
      d: d, fill: 'none', stroke: 'url(#zhg)', 'stroke-width': '2.6', 'stroke-linecap': 'round'
    }));

    /* 节点圆环 */
    [[190, 85], [400, 72]].forEach(function (p) {
      svg.appendChild(el('circle', { cx: p[0], cy: p[1], r: 5, fill: '#C77DFF' }));
      svg.appendChild(el('circle', {
        cx: p[0], cy: p[1], r: 11, fill: 'none',
        stroke: '#C77DFF', 'stroke-width': '1.3', opacity: '0.4'
      }));
    });

    decor.appendChild(svg);

    /* 插到标题之后、正文之前 */
    if (h1 && h1.parentNode) {
      h1.parentNode.parentNode.insertBefore(decor, h1.parentNode.nextSibling);
    } else {
      entry.insertBefore(decor, entry.firstChild);
    }
  }

  /* ============ 章节分隔图案 ============ */
  function decorateDividers() {
    if (!document.body.classList.contains('list')) return;
    if (document.querySelector('.zen-divider')) return;

    var articles = document.querySelectorAll('.post-entry');
    var n = 0;

    /* 在每篇之后插入一条，最后一篇后面不插 */
    Array.prototype.forEach.call(articles, function (card, i) {
      if (i === articles.length - 1) return;
      var d = document.createElement('div');
      d.className = 'zen-divider';
      d.setAttribute('aria-hidden', 'true');
      d.innerHTML =
        '<svg viewBox="0 0 400 20" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">' +
        '<defs><linearGradient id="zdiv' + n + '" x1="0" y1="0" x2="1" y2="0">' +
        '<stop offset="0%" stop-color="#FF7EB6" stop-opacity="0"/>' +
        '<stop offset="26%" stop-color="#FF7EB6" stop-opacity="0.9"/>' +
        '<stop offset="50%" stop-color="#C77DFF" stop-opacity="1"/>' +
        '<stop offset="74%" stop-color="#7ED8F0" stop-opacity="0.9"/>' +
        '<stop offset="100%" stop-color="#7ED8F0" stop-opacity="0"/>' +
        '</linearGradient></defs>' +
        '<path d="M0,10 C60,3 110,17 170,10 C230,3 280,17 340,10 C370,7 390,9 400,10" ' +
        'fill="none" stroke="url(#zdiv' + n + ')" stroke-width="2" stroke-linecap="round"/>' +
        '<circle cx="170" cy="10" r="3.4" fill="#C77DFF"/>' +
        '<circle cx="198" cy="10" r="2" fill="#7ED8F0"/>' +
        '<circle cx="142" cy="10" r="2" fill="#FF7EB6"/>' +
        '</svg>';
      card.parentNode.insertBefore(d, card.nextSibling);
      n++;
    });
  }

  /* ============ 文章详情页顶部横幅 ============ */
  function decorateSingle() {
    if (document.body.classList.contains('list')) return;
    var single = document.querySelector('.post-single');
    if (!single || single.querySelector('.zen-single-banner')) return;

    var hEl = single.querySelector('.post-title');
    var title = (hEl ? hEl.textContent : 'post').trim();

    var fig = document.createElement('figure');
    fig.className = 'zen-single-banner';
    fig.setAttribute('aria-hidden', 'true');
    fig.appendChild(buildArt(title, 'single'));
    single.insertBefore(fig, single.firstChild);
  }

  /* ============ 启动 ============ */
  function init() {
    decorateHero();
    decorateCards();
    decorateDividers();
    decorateSingle();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
