/**
 * Inspiration 动态背景交互脚本
 * 点击按钮触发动态背景效果
 */

(function() {
  'use strict';

  // 创建背景元素
  function createInspirationElements() {
    if (document.getElementById('inspiration-bg')) return;

    // 背景层
    const bg = document.createElement('div');
    bg.id = 'inspiration-bg';
    bg.className = 'inspiration-bg';
    document.body.appendChild(bg);

    // 粒子层
    const particles = document.createElement('div');
    particles.id = 'inspiration-particles';
    particles.className = 'inspiration-particles';
    
    // 添加 20 个粒子
    for (let i = 0; i < 20; i++) {
      const p = document.createElement('div');
      p.className = 'particle';
      particles.appendChild(p);
    }
    document.body.appendChild(particles);
  }

  // 切换灵感模式
  function toggleInspiration() {
    const bg = document.getElementById('inspiration-bg');
    const particles = document.getElementById('inspiration-particles');
    const btn = document.querySelector('.inspiration-btn');
    const body = document.body;
    
    if (!bg || !particles) {
      createInspirationElements();
      toggleInspiration();
      return;
    }

    const isActive = bg.classList.contains('active');
    
    if (isActive) {
      // 关闭
      bg.classList.remove('active');
      particles.classList.remove('active');
      body.classList.remove('inspiration-active');
      if (btn) btn.classList.remove('active');
    } else {
      // 开启
      bg.classList.add('active');
      particles.classList.add('active');
      body.classList.add('inspiration-active');
      if (btn) btn.classList.add('active');
      
      // 5秒后自动关闭
      setTimeout(() => {
        bg.classList.remove('active');
        particles.classList.remove('active');
        body.classList.remove('inspiration-active');
        if (btn) btn.classList.remove('active');
      }, 5000);
    }
  }

  // 初始化
  function init() {
    createInspirationElements();
    
    // 绑定现有按钮
    const btn = document.querySelector('.inspiration-btn');
    if (btn) {
      btn.addEventListener('click', toggleInspiration);
    }
  }

  // DOM 加载完成后初始化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // 导出到全局
  window.toggleInspiration = toggleInspiration;
})();