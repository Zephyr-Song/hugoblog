// ==================== 鼠标跟随粒子流 ====================

class MouseFlowParticles {
  constructor() {
    this.canvas = document.createElement('canvas');
    this.canvas.id = 'mouse-flow-canvas';
    this.canvas.style.position = 'fixed';
    this.canvas.style.top = '0';
    this.canvas.style.left = '0';
    this.canvas.style.width = '100%';
    this.canvas.style.height = '100%';
    this.canvas.style.pointerEvents = 'none';
    this.canvas.style.zIndex = '-1';
    document.body.appendChild(this.canvas);
    
    this.context = this.canvas.getContext('2d');
    this.particles = [];
    this.mouseX = 0;
    this.mouseY = 0;
    this.lastMouseX = 0;
    this.lastMouseY = 0;
    this.mouseVelocityX = 0;
    this.mouseVelocityY = 0;
    this.particleCount = 50;
    
    this.resizeCanvas();
    this.initParticles();
    this.bindEvents();
    this.startAnimation();
  }

  resizeCanvas() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  initParticles() {
    for (let i = 0; i < this.particleCount; i++) {
      this.particles.push({
        x: Math.random() * this.canvas.width,
        y: Math.random() * this.canvas.height,
        size: Math.random() * 3 + 2,
        speed: Math.random() * 0.8 + 0.5,
        color: this.getRandomColor(),
        angle: Math.random() * Math.PI * 2,
        opacity: Math.random() * 0.5 + 0.3,
        trailLength: Math.floor(Math.random() * 10 + 5),
        trail: []
      });
    }
  }

  getRandomColor() {
    const colors = [
      '#FF6B6B', // 漫画红
      '#4ECDC4', // 漫画青
      '#FFD166', // 漫画黄
      '#06D6A0', // 漫画绿
      '#1B9AAA', // 漫画蓝
      '#FF9F1C', // 漫画橙
      '#A8DADC', // 漫画浅蓝
      '#FDCB92', // 漫画浅橙
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  }

  bindEvents() {
    window.addEventListener('resize', () => this.resizeCanvas());
    document.addEventListener('mousemove', (e) => {
      this.mouseX = e.clientX;
      this.mouseY = e.clientY;
      this.mouseVelocityX = this.mouseX - this.lastMouseX;
      this.mouseVelocityY = this.mouseY - this.lastMouseY;
      this.lastMouseX = this.mouseX;
      this.lastMouseY = this.mouseY;
    });
  }

  startAnimation() {
    const animate = () => {
      this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
      
      this.particles.forEach(p => {
        // 计算粒子与鼠标的距离
        const dx = this.mouseX - p.x;
        const dy = this.mouseY - p.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // 鼠标影响粒子运动
        if (distance < 150) {
          const force = (150 - distance) / 150 * 0.5;
          p.angle += Math.atan2(dy, dx) * force;
        }
        
        // 正常运动
        p.x += Math.cos(p.angle) * p.speed;
        p.y += Math.sin(p.angle) * p.speed;
        
        // 边界处理
        if (p.x < 0) p.x = this.canvas.width;
        if (p.x > this.canvas.width) p.x = 0;
        if (p.y < 0) p.y = this.canvas.height;
        if (p.y > this.canvas.height) p.y = 0;
        
        // 记录轨迹
        p.trail.push({x: p.x, y: p.y});
        if (p.trail.length > p.trailLength) {
          p.trail.shift();
        }
        
        // 绘制粒子轨迹（漫画线条风格）
        this.context.beginPath();
        for (let i = 0; i < p.trail.length - 1; i++) {
          const from = p.trail[i];
          const to = p.trail[i+1];
          
          // 手绘风格的线条（轻微抖动）
          const jitterX = Math.random() * 1 - 0.5;
          const jitterY = Math.random() * 1 - 0.5;
          
          this.context.moveTo(from.x + jitterX, from.y + jitterY);
          this.context.lineTo(to.x + jitterX, to.y + jitterY);
        }
        this.context.strokeStyle = p.color;
        this.context.lineWidth = 1;
        this.context.stroke();
        
        // 绘制粒子本体（漫画气泡风格）
        this.context.beginPath();
        this.context.fillStyle = p.color;
        this.context.globalAlpha = p.opacity;
        
        // 漫画气泡形状（带点不规则）
        const bubbleDistortion = Math.random() * 0.1;
        for (let i = 0; i < 10; i++) {
          const angle = i * (Math.PI * 2) / 10;
          const radius = p.size * (1 + bubbleDistortion);
          const x = p.x + Math.cos(angle) * radius;
          const y = p.y + Math.sin(angle) * radius;
          if (i === 0) {
            this.context.moveTo(x, y);
          } else {
            this.context.lineTo(x, y);
          }
        }
        this.context.closePath();
        this.context.fill();
        
        // 气泡内的小圆（漫画风格细节）
        this.context.beginPath();
        this.context.fillStyle = '#FFFFFF';
        this.context.globalAlpha = p.opacity * 0.7;
        this.context.arc(p.x, p.y, p.size * 0.4, 0, Math.PI * 2);
        this.context.fill();
      });
      
      requestAnimationFrame(animate);
    };
    animate();
  }
}

// ==================== 漫画气泡跟随鼠标 ====================

class ComicBubbles {
  constructor() {
    this.bubbles = [];
    this.mouseX = 0;
    this.mouseY = 0;
    this.bubbleContainer = document.createElement('div');
    this.bubbleContainer.id = 'comic-bubbles-container';
    this.bubbleContainer.style.position = 'fixed';
    this.bubbleContainer.style.top = '0';
    this.bubbleContainer.style.left = '0';
    this.bubbleContainer.style.width = '100%';
    this.bubbleContainer.style.height = '100%';
    this.bubbleContainer.style.pointerEvents = 'none';
    this.bubbleContainer.style.zIndex = '-1';
    document.body.appendChild(this.bubbleContainer);
    
    this.phrases = [
      '🚀', '✨', '🎨', '💡', '📚', '🎮', '🎵', '⚡', '🌟', '🌈'
    ];
    
    this.initBubbles();
    this.bindEvents();
    this.startAnimation();
  }

  initBubbles() {
    for (let i = 0; i < 8; i++) {
      const bubble = document.createElement('div');
      bubble.className = 'comic-bubble';
      bubble.textContent = this.phrases[i];
      
      const size = Math.random() * 40 + 30;
      const x = Math.random() * window.innerWidth;
      const y = Math.random() * window.innerHeight;
      
      bubble.style.width = size + 'px';
      bubble.style.height = size + 'px';
      bubble.style.left = x + 'px';
      bubble.style.top = y + 'px';
      bubble.style.fontSize = size * 0.4 + 'px';
      bubble.style.opacity = Math.random() * 0.5 + 0.5;
      
      this.bubbleContainer.appendChild(bubble);
      this.bubbles.push({
        element: bubble,
        x: x,
        y: y,
        targetX: x,
        targetY: y,
        speed: Math.random() * 0.5 + 0.3,
        rotation: Math.random() * 360,
        rotationSpeed: Math.random() * 2 - 1
      });
    }
  }

  bindEvents() {
    document.addEventListener('mousemove', (e) => {
      this.mouseX = e.clientX;
      this.mouseY = e.clientY;
    });
  }

  startAnimation() {
    const animate = () => {
      this.bubbles.forEach(bubble => {
        const dx = this.mouseX - bubble.x;
        const dy = this.mouseY - bubble.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // 鼠标吸引气泡
        if (distance < 300) {
          const force = (300 - distance) / 300 * 2;
          bubble.targetX = bubble.x + dx * force * 0.05;
          bubble.targetY = bubble.y + dy * force * 0.05;
        } else {
          // 气泡自然漂浮
          bubble.targetX += Math.random() * 2 - 1;
          bubble.targetY += Math.random() * 2 - 1;
        }
        
        // 边界限制
        bubble.targetX = Math.max(0, Math.min(window.innerWidth, bubble.targetX));
        bubble.targetY = Math.max(0, Math.min(window.innerHeight, bubble.targetY));
        
        // 平滑移动
        bubble.x += (bubble.targetX - bubble.x) * bubble.speed * 0.05;
        bubble.y += (bubble.targetY - bubble.y) * bubble.speed * 0.05;
        
        bubble.rotation += bubble.rotationSpeed;
        
        bubble.element.style.left = bubble.x + 'px';
        bubble.element.style.top = bubble.y + 'px';
        bubble.element.style.transform = `rotate(${bubble.rotation}deg)`;
        
        // 鼠标靠近时透明度变化
        if (distance < 100) {
          bubble.element.style.opacity = Math.min(0.9, 0.5 + (100 - distance) / 100 * 0.4);
        } else {
          bubble.element.style.opacity = 0.5;
        }
      });
      
      requestAnimationFrame(animate);
    };
    animate();
  }
}

// 初始化所有效果
document.addEventListener('DOMContentLoaded', () => {
  new MouseFlowParticles();
  new ComicBubbles();
});