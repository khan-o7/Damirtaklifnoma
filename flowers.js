/**
 * Premium Falling Flowers & Particles Animation - HIGH PERFORMANCE OPTIMIZED
 * Features: 3D Depth (Simulated without expensive filters), Floating Particles, Smooth Performance
 */

(function() {
  const canvas = document.getElementById('flowers-canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  
  let width, height;
  let petals = [];
  let particles = [];
  
  // Check for reduced motion preference
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  
  // Adjust count based on screen size for performance
  const isMobile = window.innerWidth < 768;
  
  // Strict performance limits as requested
  const numPetals = prefersReducedMotion ? 5 : (isMobile ? 12 : 30); 
  const numParticles = prefersReducedMotion ? 2 : (isMobile ? 6 : 12);

  function resize() {
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;
  }

  window.addEventListener('resize', resize, { passive: true });
  resize();

  // ==========================================
  // PETAL CLASS
  // ==========================================
  class Petal {
    constructor() {
      this.reset(true);
    }

    reset(initial = false) {
      this.x = Math.random() * width;
      this.y = initial ? Math.random() * height : -Math.random() * 100 - 20;
      
      // Z-depth simulation: 0 (back) to 1 (front)
      this.z = Math.random();
      
      // Size depends on Z (front is larger)
      this.size = (this.z * 5) + 5; // 5 to 10
      
      // Speed depends on Z (front falls faster)
      this.speedY = (this.z * 1.2) + 0.5; 
      this.speedX = (Math.random() - 0.5) * 0.8; 
      
      this.rotation = Math.random() * 360;
      this.rotationSpeed = (Math.random() - 0.5) * 1.5;
      
      // Opacity depends on Z (front is more opaque)
      // We simulate blur by just making background elements smaller and very transparent
      this.opacity = (this.z * 0.35) + 0.25; 
      
                  const colors = [
        'rgba(255, 255, 255', // oq (white)
        'rgba(201, 140, 127', // dusty rose
        'rgba(173, 133, 73',  // antique gold
        'rgba(227, 203, 150'  // pale gold
      ];
      this.colorBase = colors[Math.floor(Math.random() * colors.length)];
      
      this.oscillationPhase = Math.random() * Math.PI * 2;
      this.oscillationSpeed = Math.random() * 0.015 + 0.01;
      this.oscillationAmplitude = Math.random() * 1.0 + 0.5;
    }

    update() {
      if (prefersReducedMotion) {
        this.y += this.speedY * 0.3; // Much slower
      } else {
        this.y += this.speedY;
        this.oscillationPhase += this.oscillationSpeed;
        this.x += this.speedX + Math.sin(this.oscillationPhase) * this.oscillationAmplitude;
        this.rotation += this.rotationSpeed;
      }

      // Recycle object instead of creating new ones (Memory optimization)
      if (this.y > height + 20) {
        this.reset();
      }
    }

    draw() {
      // GPU optimization: Avoid ctx.save()/ctx.restore() overhead where possible, 
      // but needed for rotation. We removed ctx.filter = blur() as it destroys FPS.
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate((this.rotation * Math.PI) / 180);
      
      ctx.globalAlpha = this.opacity;
      ctx.fillStyle = this.colorBase + ', ' + this.opacity + ')';
      
      ctx.beginPath();
      ctx.moveTo(0, -this.size/2);
      ctx.bezierCurveTo(this.size/2, -this.size/2, this.size/2, this.size/2, 0, this.size);
      ctx.bezierCurveTo(-this.size/2, this.size/2, -this.size/2, -this.size/2, 0, -this.size/2);
      ctx.fill();
      
      ctx.restore();
    }
  }

  // ==========================================
  // PARTICLE CLASS (Floating glowing dust)
  // ==========================================
  class Particle {
    constructor() {
      this.reset(true);
    }

    reset(initial = false) {
      this.x = Math.random() * width;
      this.y = initial ? Math.random() * height : height + 20;
      this.size = Math.random() * 1.5 + 0.5;
      this.speedY = -(Math.random() * 0.4 + 0.1);
      this.speedX = (Math.random() - 0.5) * 0.3;
      
      this.baseOpacity = Math.random() * 0.4 + 0.2;
      this.pulsePhase = Math.random() * Math.PI * 2;
      this.pulseSpeed = Math.random() * 0.03 + 0.01;
    }

    update() {
      if (!prefersReducedMotion) {
        this.y += this.speedY;
        this.x += this.speedX + Math.sin(this.pulsePhase) * 0.15;
        this.pulsePhase += this.pulseSpeed;
      }

      if (this.y < -20) {
        this.reset();
      }
    }

    draw() {
      const currentOpacity = this.baseOpacity + Math.sin(this.pulsePhase) * 0.2;
      
      ctx.globalAlpha = Math.max(0, Math.min(1, currentOpacity));
      ctx.fillStyle = '#E6C766';
      
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fill();
      
      // Removed ctx.shadowBlur for particles to save GPU. 
      // A simple opaque circle is enough for particles.
    }
  }

  // Initialize arrays
  for (let i = 0; i < numPetals; i++) petals.push(new Petal());
  for (let i = 0; i < numParticles; i++) particles.push(new Particle());

  let animationFrameId;

  // Main animation loop
  function animate() {
    ctx.clearRect(0, 0, width, height);
    
    for (let i = 0; i < petals.length; i++) {
      petals[i].update();
      petals[i].draw();
    }
    
    for (let i = 0; i < particles.length; i++) {
      particles[i].update();
      particles[i].draw();
    }
    
    animationFrameId = requestAnimationFrame(animate);
  }

  animate();

  // Cleanup on page unload to prevent memory leaks
  window.addEventListener('beforeunload', () => {
    cancelAnimationFrame(animationFrameId);
    window.removeEventListener('resize', resize);
  });
})();
