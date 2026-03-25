// ==================== 粒子动画系统 ====================

class ParticleSystem {
  constructor(containerId = 'particles-container', particleCount = 30) {
    this.container = document.getElementById(containerId);
    if (!this.container) {
      this.createContainer();
    }
    this.particleCount = particleCount;
    this.particles = [];
    this.init();
  }

  createContainer() {
    const container = document.createElement('div');
    container.id = 'particles-container';
    container.className = 'particles-container';
    document.body.insertBefore(container, document.body.firstChild);
    this.container = container;
  }

  init() {
    for (let i = 0; i < this.particleCount; i++) {
      this.createParticle();
    }
  }

  createParticle() {
    const particle = document.createElement('div');
    particle.className = 'particle';
    
    const size = Math.random() * 4 + 2;
    const x = Math.random() * window.innerWidth;
    const y = Math.random() * window.innerHeight;
    const duration = Math.random() * 4 + 4;
    const delay = Math.random() * 2;
    
    particle.style.width = size + 'px';
    particle.style.height = size + 'px';
    particle.style.left = x + 'px';
    particle.style.top = y + 'px';
    particle.style.animationDuration = duration + 's';
    particle.style.animationDelay = delay + 's';
    
    this.container.appendChild(particle);
    this.particles.push({
      element: particle,
      x: x,
      y: y,
      vx: (Math.random() - 0.5) * 0.5,
      vy: (Math.random() - 0.5) * 0.5
    });
  }

  animate() {
    this.particles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      
      // 边界反弹
      if (p.x < 0 || p.x > window.innerWidth) p.vx *= -1;
      if (p.y < 0 || p.y > window.innerHeight) p.vy *= -1;
      
      p.element.style.left = p.x + 'px';
      p.element.style.top = p.y + 'px';
    });
    
    requestAnimationFrame(() => this.animate());
  }

  start() {
    this.animate();
  }
}

// 初始化粒子系统
document.addEventListener('DOMContentLoaded', () => {
  const particleSystem = new ParticleSystem('particles-container', 25);
  particleSystem.start();
});

// ==================== 元素动画触发器 ====================

class AnimationTrigger {
  constructor() {
    this.observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    };
    this.observer = new IntersectionObserver(
      (entries) => this.handleIntersection(entries),
      this.observerOptions
    );
    this.init();
  }

  init() {
    // 为所有需要动画的元素添加观察器
    document.querySelectorAll('.post-entry, .archive-month, .about-content').forEach(el => {
      this.observer.observe(el);
    });
  }

  handleIntersection(entries) {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('animate-slide-up');
        this.observer.unobserve(entry.target);
      }
    });
  }
}

// 初始化动画触发器
document.addEventListener('DOMContentLoaded', () => {
  new AnimationTrigger();
});

// ==================== 鼠标跟踪效果 ====================

class MouseTracker {
  constructor() {
    this.mouseX = 0;
    this.mouseY = 0;
    this.init();
  }

  init() {
    document.addEventListener('mousemove', (e) => {
      this.mouseX = e.clientX;
      this.mouseY = e.clientY;
      this.updateGlowEffect();
    });
  }

  updateGlowEffect() {
    const cards = document.querySelectorAll('.post-entry, .card-hover');
    cards.forEach(card => {
      const rect = card.getBoundingClientRect();
      const cardX = rect.left + rect.width / 2;
      const cardY = rect.top + rect.height / 2;
      
      const distance = Math.sqrt(
        Math.pow(this.mouseX - cardX, 2) + 
        Math.pow(this.mouseY - cardY, 2)
      );
      
      if (distance < 200) {
        const intensity = (1 - distance / 200) * 0.3;
        card.style.boxShadow = `0 0 ${20 * intensity}px rgba(143, 179, 169, ${intensity})`;
      } else {
        card.style.boxShadow = '';
      }
    });
  }
}

// 初始化鼠标跟踪
document.addEventListener('DOMContentLoaded', () => {
  new MouseTracker();
});
