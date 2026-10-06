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

  /* ============ 图形母题（6 种） ============ */
  var MOTIFS = ['area', 'bars', 'rings', 'peaks', 'spectrum', 'warp'];

  /* ============ 配色（9 组，低饱和自然色系） ============
   *
   * 为什么是 9 组而不是原来的 6 组：
   *   插画 = 母题(6) × 配色(N) 的组合。原来 N=6 时组合周期
   *   LCM(6,6)=6，也就是第 7 篇文章的图案会和第 1 篇完全一样 ——
   *   这就是「每篇图片看起来都一样」的真正原因。
   *   N=9 时周期 LCM(6,9)=18，前 18 篇文章两两不同。
   *
   * 色系：按站点「文艺清新」基调，以浅绿/青灰/雾蓝等自然色为主，
   *       不使用紫色与棕色（与播放器配色调整保持一致）。 */
  var PALETTES = [
    { bg: '#F1F6F1', soft: '#DCE9DD', ink: '#7FBF8F', hot: '#5F9E70' }, /* 浅绿 */
    { bg: '#EFF5F3', soft: '#DCEAE4', ink: '#8FB3A9', hot: '#6E948A' }, /* 青灰 */
    { bg: '#EFF3F7', soft: '#DCE5EE', ink: '#8FA6BE', hot: '#6D87A3' }, /* 雾蓝 */
    { bg: '#F2F6EC', soft: '#E1EBD7', ink: '#A3C2A0', hot: '#82A67E' }, /* 抹茶 */
    { bg: '#EDF5F6', soft: '#D8E9EC', ink: '#8AB4C4', hot: '#6699AB' }, /* 湖蓝 */
    { bg: '#F1F5F0', soft: '#DEE9DC', ink: '#A9BCA6', hot: '#87A083' }, /* 鼠尾草 */
    { bg: '#F0F4F4', soft: '#DEE7E7', ink: '#9BB0B5', hot: '#78949B' }, /* 灰青 */
    { bg: '#F5F6F1', soft: '#E7EADF', ink: '#AEB8A4', hot: '#8C9880' }, /* 暖灰绿 */
    { bg: '#EEF4F2', soft: '#DBE8E4', ink: '#86ADA4', hot: '#639088' }  /* 竹青 */
  ];

  /* ============ 母题与配色的分配策略 ============
   *
   * 序号 index 取「全局文章序号」（由 extend_footer.html 输出的
   * window.__ZEN_ART_INDEX 提供，按日期倒序编号），而不是页内 DOM 序号。
   * 这样同一篇文章在首页与详情页拿到同一个 index → 图案一致；
   * 不同文章 index 不同 → 图案不同。
   *
   * 母题步长 1、配色步长 5，与 6 和 9 都互质：
   *   motif   = index % 6
   *   palette = (index*5 + 2) % 9
   * 组合周期 LCM(6, 9) = 18，前 18 篇两两不重复。
   *
   * 序号只决定「用哪个母题 / 哪套配色」；
   * 母题内部的细节（曲线形状、柱数、环心偏移等）仍由标题哈希决定，
   * 因此即使母题相同，图形也不会一样。
   */
  function pickMotif(index) {
    return ((index % MOTIFS.length) + MOTIFS.length) % MOTIFS.length;
  }

  function pickPalette(index) {
    var n = PALETTES.length;
    return ((index * 5 + 2) % n + n) % n;
  }

  /* 从注入的标题表里取全局序号；取不到返回 -1（调用方兜底）
     说明：这里用数组 indexOf 而不是对象查表 —— 对象字面量的 key 在
     模板里会遭遇 JS 转义问题（详见 extend_footer.html 的注释）。 */
  function globalIndexOf(title) {
    var titles = window.__ZEN_ART_TITLES;
    if (titles && titles.length) {
      var i = titles.indexOf(title);
      if (i >= 0) return i;
    }
    return -1;
  }

  function el(tag, attrs) {
    var e = document.createElementNS('http://www.w3.org/2000/svg', tag);
    for (var k in attrs) {
      if (Object.prototype.hasOwnProperty.call(attrs, k)) e.setAttribute(k, attrs[k]);
    }
    return e;
  }

  /**
   * 生成一张插画
   * @param {string} seed  文章标题 → 只用于决定母题内部的细节参数
   * @param {number} uid   唯一 id 后缀（避免同页 defs 冲突）
   * @param {number} index 文章序号 → 决定母题与配色（保证相邻不重复）
   */
  function buildArt(seed, uid, index) {
    var rnd = rngFrom(seed);
    /* 母题与配色按序号轮转，不走随机 —— 避免撞车 */
    var idx = (typeof index === 'number' && index >= 0) ? index : 0;
    var P = PALETTES[pickPalette(idx)];
    var motif = MOTIFS[pickMotif(idx)];
    var W = 800, H = 450;
    var CX = W / 2, CY = H / 2;
    /* 背景网格的密度也随 seed 变化（原先写死 25×25，所有图底纹一模一样） */
    var gridSize = 20 + Math.floor(rnd() * 15);   /* 20~34 */

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

    var pat = el('pattern', {
      id: 'zp' + uid,
      width: String(gridSize), height: String(gridSize),
      patternUnits: 'userSpaceOnUse'
    });
    pat.appendChild(el('path', {
      d: 'M' + gridSize + ' 0H0V' + gridSize,
      fill: 'none', stroke: P.soft, 'stroke-width': '1.4', opacity: '0.9'
    }));
    defs.appendChild(pat);
    svg.appendChild(defs);

    svg.appendChild(el('rect', { width: W, height: H, fill: 'url(#zg' + uid + ')' }));
    svg.appendChild(el('rect', { width: W, height: H, fill: 'url(#zp' + uid + ')' }));

    var g = el('g');
    svg.appendChild(g);

    if (motif === 'area') {
      /* 三种变体：单峰 / 双峰 / 阶梯，避免同母题看起来一样 */
      var areaVar = Math.floor(rnd() * 3);
      var y0 = H / 3 + rnd() * 40;
      var y1 = H / 2 + rnd() * 60;
      var y2 = H / 2 + rnd() * 70;
      var y3 = H / 3 + rnd() * 50;

      if (areaVar === 2) {
        /* ---- 变体：阶梯状（模拟数据台阶） ---- */
        var steps = 5;
        var sd = 'M0,' + (H / 5 + rnd() * (H * 0.42));
        var sy = parseFloat(sd.slice(4));
        var tops = [];
        for (var si = 1; si <= steps; si++) {
          var nx = W / steps * si;
          tops.push([nx, sy]);
          if (si < steps) {
            var ny = H / 5 + rnd() * (H * 0.42);
            sd += ' L' + nx + ',' + ny;
            sy = ny;
          }
        }
        sd += ' L' + W + ',' + sy;
        g.appendChild(el('path', {
          d: sd + ' L' + W + ',' + H + ' L0,' + H + ' Z', fill: P.ink, opacity: '0.2'
        }));
        g.appendChild(el('path', {
          d: sd, fill: 'none', stroke: P.hot, 'stroke-width': '3.5',
          'stroke-linecap': 'round', 'stroke-linejoin': 'round'
        }));
        tops.forEach(function (p) {
          g.appendChild(el('circle', { cx: p[0], cy: p[1], r: 5, fill: P.hot }));
        });
      } else {
        /* ---- 变体：平滑曲线（单峰 / 双峰） ---- */
        var d;
        if (areaVar === 0) {
          /* 单峰 */
          d = 'M0,' + y0 +
              ' C' + (W / 3) + ',' + (y0 - 70) + ' ' + (W / 3) + ',' + (y1 - 90) + ' ' + CX + ',' + y1 +
              ' C' + (W * 2 / 3) + ',' + (y2 + 80) + ' ' + (W * 4 / 3) + ',' + y2 + ' ' + W + ',' + y3;
        } else {
          /* 双峰：中间多一个转折 */
          var ym = H / 2 - 40 + rnd() * 50;
          d = 'M0,' + y0 +
              ' C' + (W / 6) + ',' + (y1 - 60) + ' ' + (W / 5) + ',' + (ym - 50) + ' ' + (W / 3) + ',' + ym +
              ' C' + (W * 5 / 12) + ',' + (ym + 40) + ' ' + (W * 5 / 12) + ',' + (y2 - 30) + ' ' + CX + ',' + y1 +
              ' C' + (W * 7 / 12) + ',' + (y3 - 40) + ' ' + (W * 7 / 12) + ',' + (y2 + 60) + ' ' + (W * 5 / 6) + ',' + y2 +
              ' C' + (W * 11 / 12) + ',' + (y2 + 10) + ' ' + (W * 11 / 12) + ',' + y3 + ' ' + W + ',' + y3;
        }
        g.appendChild(el('path', { d: d + ' L' + W + ',' + H + ' L0,' + H + ' Z', fill: P.ink, opacity: '0.2' }));
        g.appendChild(el('path', { d: d, fill: 'none', stroke: P.hot, 'stroke-width': '3.5', 'stroke-linecap': 'round' }));
        g.appendChild(el('path', { d: d, fill: 'none', stroke: P.hot, 'stroke-width': '2', 'stroke-dasharray': '6 8', opacity: '0.75' }));
        g.appendChild(el('circle', { cx: CX, cy: y1, r: '8', fill: P.hot }));
        g.appendChild(el('circle', { cx: CX, cy: y1, r: '16', fill: 'none', stroke: P.hot, 'stroke-width': '1.5', opacity: '0.5' }));
      }

    } else if (motif === 'bars') {
      /* 两种变体：升序柱+折线 / 交错双色柱 */
      var barsVar = Math.floor(rnd() * 2);
      var nBars = barsVar === 0 ? 9 : 11;
      var gap = W / (nBars + 2);
      for (var i = 0; i < nBars; i++) {
        /* 变体 0：递增；变体 1：随机但相邻不雷同 */
        var bh = barsVar === 0
          ? 26 + (i / (nBars - 1)) * 168 + rnd() * 22
          : 26 + rnd() * 170;
        g.appendChild(el('rect', {
          x: gap * (i + 1), y: H - 44 - bh,
          width: barsVar === 0 ? 26 : gap * 0.52,
          height: bh, rx: 5,
          fill: barsVar === 0 ? P.ink : (i % 2 ? P.ink : P.hot),
          opacity: barsVar === 0 ? '0.32' : (i % 2 ? '0.28' : '0.5')
        }));
      }
      /* 折线：变体 0 上升趋势，变体 1 波动 */
      var pts = [];
      var lineN = 10;
      for (var j = 0; j < lineN; j++) {
        var px = gap * (j + 1.4);
        var py = barsVar === 0
          ? H - 96 - (j / (lineN - 1)) * 150 - rnd() * 30
          : H - 96 - rnd() * 190;
        pts.push(px + ',' + py);
      }
      g.appendChild(el('polyline', {
        points: pts.join(' '), fill: 'none', stroke: P.hot, 'stroke-width': '3.5',
        'stroke-linecap': 'round', 'stroke-linejoin': 'round'
      }));
      for (var k = 0; k < pts.length; k += 3) {
        var xy = pts[k].split(',');
        g.appendChild(el('circle', { cx: xy[0], cy: xy[1], r: 6, fill: P.hot }));
      }
      /* 基线 */
      g.appendChild(el('line', {
        x1: 0, y1: H - 44, x2: W, y2: H - 44,
        stroke: P.ink, 'stroke-width': '1.2', opacity: '0.35'
      }));

    } else if (motif === 'rings') {
      /* 两种变体：同心环靶心 / 偏心轨道环 */
      var ringVar = Math.floor(rnd() * 2);
      var base = 118 + rnd() * 46;
      var rcx = CX, rcy = CY;
      if (ringVar === 1) {
        /* 偏心：环心偏离画面中心，构图更有张力 */
        rcx = CX + (rnd() - 0.5) * 150;
        rcy = CY + (rnd() - 0.5) * 90;
      }
      for (var m = 0; m < 5; m++) {
        var rr = base - m * 32;
        if (rr <= 8) continue;
        /* 变体 1 增加旋转射线，避免纯同心圆过于呆板 */
        var dash = ringVar === 1 ? (m % 2 ? '3 9' : 'none') : 'none';
        g.appendChild(el('circle', {
          cx: rcx, cy: rcy, r: rr, fill: 'none', stroke: P.ink,
          'stroke-width': m === 0 ? '3.5' : '1.6',
          'stroke-dasharray': dash,
          opacity: m === 0 ? '0.9' : '0.5',
          transform: ringVar === 1 && m % 2 ? 'rotate(' + (rnd() * 40 - 20) + ' ' + rcx + ' ' + rcy + ')' : ''
        }));
      }
      /* 主球 */
      var bx = rcx - 44, by = rcy - 28;
      g.appendChild(el('circle', { cx: bx, cy: by, r: 30, fill: P.hot, opacity: '0.92' }));
      g.appendChild(el('circle', { cx: bx - 10, cy: by - 10, r: 9, fill: '#fff', opacity: '0.35' }));
      /* 卫星 */
      g.appendChild(el('circle', {
        cx: rcx + base * 0.72, cy: rcy - base * 0.5, r: 9, fill: P.ink, opacity: '0.7'
      }));
      g.appendChild(el('line', {
        x1: rcx, y1: rcy, x2: W, y2: rcy - 128,
        stroke: P.hot, 'stroke-width': '2.5', 'stroke-dasharray': '5 6'
      }));

    } else if (motif === 'peaks') {
      /* 山峰：层数、峰数、峰高、日月位置全部随 seed 变化。
         （早期版本这里是写死的常量路径，导致同为 peaks 的两篇文章
          轮廓完全一样、只有配色不同，看起来就是「同一张图」。） */
      var pLayers = 2 + Math.floor(rnd() * 2);        /* 山层 2~3 */
      var pPeaks = 3 + Math.floor(rnd() * 3);         /* 主峰 3~5 */
      var pBase = H / 2 + 34 + rnd() * 54;
      for (var n = pLayers - 1; n >= 0; n--) {
        var off = n * (42 + rnd() * 22);
        var o = pBase + off;
        var seg = W / pPeaks;
        var d2 = 'M0,' + o;
        for (var pk = 0; pk < pPeaks; pk++) {
          var x1 = seg * pk + seg * 0.5;
          var x2 = seg * (pk + 1);
          var ph = 38 + rnd() * (74 + n * 18);
          d2 += ' L' + x1.toFixed(1) + ',' + (o - ph).toFixed(1) +
                ' L' + x2.toFixed(1) + ',' + (o + 12 + rnd() * 28).toFixed(1);
        }
        d2 += ' L' + W + ',' + o + ' Z';
        g.appendChild(el('path', {
          d: d2, fill: n === 0 ? P.hot : P.ink,
          opacity: n === 0 ? '0.88' : (0.9 - n * 0.26)
        }));
      }
      g.appendChild(el('circle', {
        cx: (W * (0.58 + rnd() * 0.32)).toFixed(1),
        cy: (54 + rnd() * 56).toFixed(1),
        r: (20 + rnd() * 14).toFixed(1),
        fill: P.hot, opacity: '0.45'
      }));

    } else if (motif === 'spectrum') {
      /* 频谱条：条数、间距、振幅都随 seed 变化 */
      var spN = 22 + Math.floor(rnd() * 16);          /* 22~37 条 */
      var spGap = W / spN;
      var spW = Math.max(5, spGap * 0.42);
      for (var s = 0; s < spN; s++) {
        var amp = 18 + rnd() * 140;
        g.appendChild(el('rect', {
          x: (spGap * s + spGap * 0.3).toFixed(1), y: (CY - amp / 2).toFixed(1),
          width: spW.toFixed(1), height: amp.toFixed(1), rx: (spW / 2).toFixed(1),
          fill: P.ink, opacity: amp > 104 ? '0.88' : '0.42'
        }));
      }
      var spQ = CY + (rnd() - 0.5) * 40;
      g.appendChild(el('path', {
        d: 'M0,' + spQ + ' Q' + (W / 4) + ',' + (spQ - 30 - rnd() * 30) + ' ' + CX + ',' + spQ +
           ' T' + (W * 3 / 4) + ',' + (spQ - 30 - rnd() * 30),
        fill: 'none', stroke: P.hot, 'stroke-width': '2.5', 'stroke-dasharray': '4 8'
      }));

    } else { /* warp：横波与纵波的行数/列数/振幅随 seed 变化，
                避免同母题共用一张写死的网格 */
      var wRows = 7 + Math.floor(rnd() * 5);          /* 横波 7~11 */
      var wCols = 5 + Math.floor(rnd() * 5);          /* 纵波 5~9 */
      for (var q = 0; q < wRows; q++) {
        var ry = (H / (wRows + 1)) * (q + 1);
        var amp = (96 + rnd() * 56) - q * 6;
        g.appendChild(el('path', {
          d: 'M0,' + ry.toFixed(1) + ' Q' + (W / 4) + ',' + (ry - amp).toFixed(1) + ' ' + CX + ',' + ry.toFixed(1) +
             ' T' + (W * 3 / 4) + ',' + (ry + amp).toFixed(1),
          fill: 'none', stroke: P.ink, 'stroke-width': '1.8',
          opacity: (0.95 - q * 0.06).toFixed(2)
        }));
      }
      for (var t = 0; t < wCols; t++) {
        var rx = (W / (wCols + 1)) * (t + 1);
        var amp2 = 22 + rnd() * 34;
        g.appendChild(el('path', {
          d: 'M' + rx.toFixed(1) + ',0 Q' + rx.toFixed(1) + ',' + (H / 3) + ' ' + (rx + amp2).toFixed(1) + ',' + CY +
             ' T' + (rx - amp2 * 0.6).toFixed(1) + ',' + H,
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

      /* 用全局序号决定图案：同一篇文章在任何页面都是同一张图。
         取不到索引时退回页内序号（例如索引表被 CSP 拦截等极端情况）。 */
      var gIdx = globalIndexOf(title);
      if (gIdx < 0) gIdx = i;

      /* --- 左侧插画 --- */
      var media = document.createElement('div');
      media.className = 'zen-art-wrap';
      media.setAttribute('aria-hidden', 'true');
      media.appendChild(buildArt(title || ('post-' + i), 'c' + i, gIdx));

      /* --- 序号角标（模仿参考站 01/02/03）：用全局序号，跨页也连续 --- */
      var num = document.createElement('span');
      num.className = 'zen-art-num';
      num.setAttribute('aria-hidden', 'true');
      var shown = gIdx + 1;
      num.textContent = (shown < 10 ? '0' : '') + shown;

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
    lg.appendChild(el('stop', { offset: '0%', 'stop-color': '#A9D4B4', 'stop-opacity': '0' }));
    lg.appendChild(el('stop', { offset: '28%', 'stop-color': '#7FBF8F', 'stop-opacity': '0.8' }));
    lg.appendChild(el('stop', { offset: '70%', 'stop-color': '#8FB3A9', 'stop-opacity': '0.8' }));
    lg.appendChild(el('stop', { offset: '100%', 'stop-color': '#8FB3A9', 'stop-opacity': '0' }));
    defs.appendChild(lg);
    svg.appendChild(defs);

    /* 等距网格（淡） */
    for (var i = 0; i <= 13; i++) {
      svg.appendChild(el('line', {
        x1: i * 40, y1: 0, x2: i * 40 - 60, y2: 150,
        stroke: '#7FBF8F', 'stroke-width': '1', opacity: '0.13'
      }));
    }
    for (var j = 0; j <= 4; j++) {
      svg.appendChild(el('line', {
        x1: 0, y1: j * 37, x2: 520, y2: j * 37,
        stroke: '#8FB3A9', 'stroke-width': '1', opacity: '0.11'
      }));
    }

    /* 主曲线 + 面积填充 */
    var d = 'M0,105 C70,55 120,135 190,85 C260,35 320,120 400,72 C450,42 490,80 520,60';
    svg.appendChild(el('path', {
      d: d + ' L520,150 L0,150 Z', fill: '#7FBF8F', opacity: '0.07'
    }));
    svg.appendChild(el('path', {
      d: d, fill: 'none', stroke: 'url(#zhg)', 'stroke-width': '2.6', 'stroke-linecap': 'round'
    }));

    /* 节点圆环 */
    [[190, 85], [400, 72]].forEach(function (p) {
      svg.appendChild(el('circle', { cx: p[0], cy: p[1], r: 5, fill: '#7FBF8F' }));
      svg.appendChild(el('circle', {
        cx: p[0], cy: p[1], r: 11, fill: 'none',
        stroke: '#7FBF8F', 'stroke-width': '1.3', opacity: '0.4'
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
        '<stop offset="0%" stop-color="#A9D4B4" stop-opacity="0"/>' +
        '<stop offset="26%" stop-color="#A9D4B4" stop-opacity="0.9"/>' +
        '<stop offset="50%" stop-color="#7FBF8F" stop-opacity="1"/>' +
        '<stop offset="74%" stop-color="#8FB3A9" stop-opacity="0.9"/>' +
        '<stop offset="100%" stop-color="#8FB3A9" stop-opacity="0"/>' +
        '</linearGradient></defs>' +
        '<path d="M0,10 C60,3 110,17 170,10 C230,3 280,17 340,10 C370,7 390,9 400,10" ' +
        'fill="none" stroke="url(#zdiv' + n + ')" stroke-width="2" stroke-linecap="round"/>' +
        '<circle cx="170" cy="10" r="3.4" fill="#7FBF8F"/>' +
        '<circle cx="198" cy="10" r="2" fill="#8FB3A9"/>' +
        '<circle cx="142" cy="10" r="2" fill="#A9D4B4"/>' +
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

    /* 与列表页用同一张索引表 → 同一篇文章两处图案完全一致。
       拿不到索引时退回标题哈希，至少保证「同标题同图」是稳定的。 */
    var gIdx = globalIndexOf(title);
    if (gIdx < 0) gIdx = hashCode(title) % MOTIFS.length;

    var fig = document.createElement('figure');
    fig.className = 'zen-single-banner';
    fig.setAttribute('aria-hidden', 'true');
    fig.appendChild(buildArt(title, 'single', gIdx));
    single.insertBefore(fig, single.firstChild);
  }

  /* ============ 首页：只展示前 N 篇，其余折叠 ============
   *
   * 首页一次渲染全部文章（list.html 里关掉了首页分页），
   * 这里把第 N+1 篇及其后的所有兄弟节点（含分隔线）收进一个容器，
   * 加一个「展开全部」按钮。默认隐藏，点击展开 / 收起。
   *
   * 用渐进增强的思路：HTML 里渲染全部文章（无 JS 也能看全），
   * JS 就绪后才折叠。这样即使脚本加载失败，内容也不会丢。
   */
  function collapseHomeList() {
    if (!document.body.classList.contains('list')) return;
    /* 仅博客首页（首页含 home-info 区块），分类/标签页不折叠 */
    if (!document.querySelector('.home-info')) return;

    var main = document.querySelector('main');
    if (!main || main.querySelector('.zen-more-posts')) return;

    var limit = window.__ZEN_ART_HOME_LIMIT || 3;
    var entries = main.querySelectorAll('.post-entry');
    if (entries.length <= limit) return;   /* 不超过 limit 篇就全显示 */

    /* 收起点 = 第 limit 篇之后的所有节点（分隔线也在内） */
    var last = entries[limit - 1];
    var toMove = [];
    var node = last.nextElementSibling;
    while (node) {
      var cls = String(node.className || '');
      /* 分页导航不参与折叠 */
      if (cls.indexOf('page-footer') >= 0 || cls.indexOf('pagination') >= 0) break;
      toMove.push(node);
      node = node.nextElementSibling;
    }
    if (!toMove.length) return;

    var box = document.createElement('div');
    box.className = 'zen-more-posts';
    box.id = 'zen-more-posts';
    box.hidden = true;
    toMove.forEach(function (n) { box.appendChild(n); });
    last.parentNode.insertBefore(box, last.nextSibling);

    /* 按钮放在折叠区之后：初始时紧跟在第 3 篇下方，
       展开后落在全部内容末尾，位置和语义都顺。 */
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'zen-more-btn';
    btn.setAttribute('aria-controls', 'zen-more-posts');
    btn.setAttribute('aria-expanded', 'false');
    btn.innerHTML =
      '<span class="zen-more-label">展开全部 ' + entries.length + ' 篇</span>' +
      '<svg class="zen-more-chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
      'stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      '<polyline points="6 9 12 15 18 9"/></svg>';

    btn.addEventListener('click', function () {
      var willOpen = box.hidden;
      box.hidden = !willOpen;
      btn.setAttribute('aria-expanded', willOpen ? 'true' : 'false');
      btn.classList.toggle('is-open', willOpen);
      btn.querySelector('.zen-more-label').textContent = willOpen
        ? '收起'
        : ('展开全部 ' + entries.length + ' 篇');
      if (!willOpen) {
        /* 收起后页面变短，把视口带回第 3 篇位置，避免悬空 */
        var top = last.getBoundingClientRect().top + window.pageYOffset - 24;
        window.scrollTo({ top: top, behavior: 'smooth' });
      }
    });

    box.parentNode.insertBefore(btn, box.nextSibling);
  }

  /* ============ 启动 ============ */
  function init() {
    decorateHero();
    decorateCards();
    decorateDividers();
    collapseHomeList();   /* 必须在分隔线插入之后，才能一起收进折叠区 */
    decorateSingle();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
