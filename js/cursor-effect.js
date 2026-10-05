/**
 * 指尖粒子特效 - 淡雅风格
 * 随鼠标/触摸产生轻柔的散射粒子，与博客绿色系风格相配
 */
(function () {
  'use strict';

  // 粒子颜色取博客主题色系（茶绿、米白、浅金）
  const COLORS = [
    'rgba(143,179,169,',  // #8fb3a9 主题绿
    'rgba(162,193,184,',  // 浅绿
    'rgba(200,218,213,',  // 更浅绿
    'rgba(196,181,155,',  // 浅金棕
    'rgba(218,208,195,',  // 米色
  ];

  // 配置
  const CONFIG = {
    maxParticles: 60,   // 最大粒子数
    spawnRate: 2,       // 每次移动生成粒子数
    radius: { min: 2, max: 5 },   // 粒子半径
    life: { min: 40, max: 80 },   // 粒子寿命（帧数）
    speed: { min: 0.3, max: 1.2 }, // 粒子初速度
    drag: 0.96,          // 速度衰减
    gravity: 0.015,      // 微重力（向下漂）
  };

  const canvas = document.createElement('canvas');
  canvas.id = 'cursor-canvas';
  canvas.style.cssText = [
    'position:fixed',
    'top:0',
    'left:0',
    'width:100%',
    'height:100%',
    'pointer-events:none',
    'z-index:9999',
    'opacity:0.75',
  ].join(';');
  document.body.appendChild(canvas);

  const ctx = canvas.getContext('2d');
  let W = canvas.width = window.innerWidth;
  let H = canvas.height = window.innerHeight;

  window.addEventListener('resize', () => {
    W = canvas.width = window.innerWidth;
    H = canvas.height = window.innerHeight;
  });

  // 粒子池
  const particles = [];

  function randomBetween(min, max) {
    return min + Math.random() * (max - min);
  }

  function spawnParticles(x, y, count) {
    for (let i = 0; i < count; i++) {
      if (particles.length >= CONFIG.maxParticles) break;
      const angle = Math.random() * Math.PI * 2;
      const speed = randomBetween(CONFIG.speed.min, CONFIG.speed.max);
      const color = COLORS[Math.floor(Math.random() * COLORS.length)];
      particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 0.4, // 初始微微向上
        r: randomBetween(CONFIG.radius.min, CONFIG.radius.max),
        life: Math.floor(randomBetween(CONFIG.life.min, CONFIG.life.max)),
        maxLife: 0,
        color,
      });
      particles[particles.length - 1].maxLife = particles[particles.length - 1].life;
    }
  }

  // 鼠标移动
  let lastX = -999, lastY = -999;
  document.addEventListener('mousemove', (e) => {
    const dx = e.clientX - lastX;
    const dy = e.clientY - lastY;
    if (Math.abs(dx) + Math.abs(dy) > 6) { // 只在移动足够距离时产生
      spawnParticles(e.clientX, e.clientY, CONFIG.spawnRate);
      lastX = e.clientX;
      lastY = e.clientY;
    }
  });

  // 触摸支持
  document.addEventListener('touchmove', (e) => {
    const t = e.touches[0];
    spawnParticles(t.clientX, t.clientY, CONFIG.spawnRate + 1);
  }, { passive: true });

  document.addEventListener('touchstart', (e) => {
    const t = e.touches[0];
    spawnParticles(t.clientX, t.clientY, 4);
  }, { passive: true });

  // 动画循环
  function animate() {
    ctx.clearRect(0, 0, W, H);

    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.life--;
      if (p.life <= 0) {
        particles.splice(i, 1);
        continue;
      }

      // 物理
      p.vy += CONFIG.gravity;
      p.vx *= CONFIG.drag;
      p.vy *= CONFIG.drag;
      p.x += p.vx;
      p.y += p.vy;

      // 透明度随寿命淡出
      const alpha = (p.life / p.maxLife) * 0.7;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r * (p.life / p.maxLife), 0, Math.PI * 2);
      ctx.fillStyle = p.color + alpha + ')';
      ctx.fill();
    }

    requestAnimationFrame(animate);
  }

  animate();
})();
