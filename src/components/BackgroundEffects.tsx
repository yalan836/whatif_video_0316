import React, { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
  color: string;
}

interface TrailParticle extends Particle {
  life: number;
  maxLife: number;
}

export const BackgroundEffects: React.FC<{ isTyping?: boolean }> = ({ isTyping }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particles = useRef<Particle[]>([]);
  const trailParticles = useRef<TrailParticle[]>([]);
  const clickFlicker = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', resize);
    resize();

    // Initialize cosmic dust
    const particleCount = 500; // Increased for more "stardust" feel
    for (let i = 0; i < particleCount; i++) {
      particles.current.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.04, // Slower
        vy: (Math.random() - 0.5) * 0.04,
        size: Math.random() * 2.5 + 0.1, // More varying sizes
        opacity: Math.random() * 0.4 + 0.05,
        color: '#d4b595'
      });
    }

    const handleMouseMove = (e: MouseEvent) => {
      // Add trail particles
      if (Math.random() > 0.4) { // More frequent trails
        trailParticles.current.push({
          x: e.clientX,
          y: e.clientY,
          vx: (Math.random() - 0.5) * 0.8,
          vy: (Math.random() - 0.5) * 0.8,
          size: Math.random() * 2.5 + 0.5, // Larger trail particles
          opacity: 0.5,
          color: '#f5e6d3',
          life: 1.2,
          maxLife: 1.2
        });
      }
    };

    const handleClick = () => {
      clickFlicker.current = 1.0;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mousedown', handleClick);

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (clickFlicker.current > 0) {
        clickFlicker.current -= 0.05;
      }

      const flicker = (isTyping ? (Math.random() > 0.7 ? 1.5 : 0.5) : 1) + (clickFlicker.current * 2);

      // Draw cosmic dust
      particles.current.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;

        const twinkle = 0.8 + Math.sin(Date.now() * 0.001 + p.x) * 0.2;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(212, 181, 149, ${p.opacity * flicker * twinkle})`;
        ctx.fill();
      });

      // Draw trail particles
      trailParticles.current = trailParticles.current.filter(p => p.life > 0);
      trailParticles.current.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 0.02;
        const alpha = (p.life / p.maxLife) * p.opacity * flicker;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(245, 230, 211, ${alpha})`;
        ctx.fill();
      });

      requestAnimationFrame(animate);
    };

    const animId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mousedown', handleClick);
    };
  }, [isTyping]);

  return (
    <canvas 
      ref={canvasRef} 
      className="fixed inset-0 pointer-events-none z-0"
      style={{ mixBlendMode: 'screen' }}
    />
  );
};

export const RotatingSphereMesh: React.FC<{ isTyping?: boolean }> = ({ isTyping }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const clickFlicker = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    const points: { x: number; y: number; z: number }[] = [];
    const pointCount = 150; // Increased from 100
    const radius = 250;

    // Generate points on a sphere
    for (let i = 0; i < pointCount; i++) {
      const phi = Math.acos(-1 + (2 * i) / pointCount);
      const theta = Math.sqrt(pointCount * Math.PI) * phi;
      points.push({
        x: radius * Math.cos(theta) * Math.sin(phi),
        y: radius * Math.sin(theta) * Math.sin(phi),
        z: radius * Math.cos(phi)
      });
    }

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', resize);
    resize();

    const handleClick = () => {
      clickFlicker.current = 1.0;
    };
    window.addEventListener('mousedown', handleClick);

    const draw = (time: number) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      if (clickFlicker.current > 0) {
        clickFlicker.current -= 0.05;
      }

      const pulseFreq = isTyping ? 0.008 : 0.002;
      const pulseAmp = isTyping ? 0.4 : 0.15;
      const pulse = 0.6 + Math.sin(time * pulseFreq) * pulseAmp;
      const flicker = (isTyping ? (Math.random() > 0.8 ? 1.4 : 0.7) : pulse) + (clickFlicker.current * 2);

      const cx = canvas.width / 2;
      const cy = canvas.height / 2;
      const angleX = time * 0.0002;
      const angleY = time * 0.0003;

      const projectedPoints = points.map(p => {
        // Rotate around X
        let y1 = p.y * Math.cos(angleX) - p.z * Math.sin(angleX);
        let z1 = p.y * Math.sin(angleX) + p.z * Math.cos(angleX);
        // Rotate around Y
        let x2 = p.x * Math.cos(angleY) + z1 * Math.sin(angleY);
        let z2 = -p.x * Math.sin(angleY) + z1 * Math.cos(angleY);
        
        const scale = 800 / (800 + z2);
        return {
          x: cx + x2 * scale,
          y: cy + y1 * scale,
          z: z2,
          scale
        };
      });

      // Draw sphere core (inner particles)
      projectedPoints.forEach(p => {
        if (p.z < 0) { // Only draw front half for core
          ctx.beginPath();
          ctx.arc(p.x, p.y, 1 * p.scale, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(212, 181, 149, ${0.4 * flicker * p.scale})`;
          ctx.fill();
        }
      });

      // Draw outer cage (connections)
      ctx.lineWidth = 0.5;
      for (let i = 0; i < projectedPoints.length; i++) {
        for (let j = i + 1; j < projectedPoints.length; j++) {
          const p1 = projectedPoints[i];
          const p2 = projectedPoints[j];
          const dist = Math.hypot(p1.x - p2.x, p1.y - p2.y);
          
          if (dist < 100 * p1.scale) {
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `rgba(212, 181, 149, ${0.1 * flicker * p1.scale})`;
            ctx.stroke();
          }
        }
      }

      animationFrameId = requestAnimationFrame(draw);
    };

    animationFrameId = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousedown', handleClick);
    };
  }, [isTyping]);

  return (
    <canvas 
      ref={canvasRef} 
      className="fixed inset-0 pointer-events-none z-0 opacity-40"
    />
  );
};

export const Constellations: React.FC<{ isConducting?: boolean; isTyping?: boolean }> = ({ isConducting, isTyping }) => {
  const flickerClass = isTyping ? "animate-flicker" : "";
  
  return (
    <div className={`fixed inset-0 pointer-events-none z-0 transition-all duration-1000 ${isConducting ? 'opacity-50 scale-105' : 'opacity-20 scale-100'} ${flickerClass}`}>
      <svg width="100%" height="100%" className="absolute inset-0">
        <defs>
          <radialGradient id="starGradient">
            <stop offset="0%" stopColor="#f5e6d3" stopOpacity="1" />
            <stop offset="100%" stopColor="#d4b595" stopOpacity="0" />
          </radialGradient>
        </defs>
        
        <g className="animate-pulse-breath">
          <line x1="10%" y1="20%" x2="25%" y2="15%" stroke="#d4b595" strokeWidth="0.5" strokeDasharray={isConducting ? "0" : "2,4"} className="transition-all duration-500" />
          <line x1="25%" y1="15%" x2="30%" y2="35%" stroke="#d4b595" strokeWidth="0.5" strokeDasharray={isConducting ? "0" : "2,4"} className="transition-all duration-500" />
          <line x1="80%" y1="70%" x2="90%" y2="85%" stroke="#d4b595" strokeWidth="0.5" strokeDasharray={isConducting ? "0" : "2,4"} className="transition-all duration-500" />
          <line x1="90%" y1="85%" x2="75%" y2="90%" stroke="#d4b595" strokeWidth="0.5" strokeDasharray={isConducting ? "0" : "2,4"} className="transition-all duration-500" />
          <line x1="15%" y1="60%" x2="25%" y2="75%" stroke="#d4b595" strokeWidth="0.5" strokeDasharray={isConducting ? "0" : "2,4"} className="transition-all duration-500" />
          <line x1="25%" y1="75%" x2="40%" y2="70%" stroke="#d4b595" strokeWidth="0.5" strokeDasharray={isConducting ? "0" : "2,4"} className="transition-all duration-500" />
          
          <circle cx="10%" cy="20%" r="1.5" fill="url(#starGradient)" className={isConducting ? 'animate-ping' : ''} />
          <circle cx="25%" cy="15%" r="1.5" fill="url(#starGradient)" className={isConducting ? 'animate-ping' : ''} />
          <circle cx="30%" cy="35%" r="1.5" fill="url(#starGradient)" className={isConducting ? 'animate-ping' : ''} />
          <circle cx="80%" cy="70%" r="1.5" fill="url(#starGradient)" className={isConducting ? 'animate-ping' : ''} />
          <circle cx="90%" cy="85%" r="1.5" fill="url(#starGradient)" className={isConducting ? 'animate-ping' : ''} />
          <circle cx="75%" cy="90%" r="1.5" fill="url(#starGradient)" className={isConducting ? 'animate-ping' : ''} />
          <circle cx="15%" cy="60%" r="1.5" fill="url(#starGradient)" className={isConducting ? 'animate-ping' : ''} />
          <circle cx="40%" cy="70%" r="1.5" fill="url(#starGradient)" className={isConducting ? 'animate-ping' : ''} />
        </g>
      </svg>
    </div>
  );
};


export const RotatingCompass: React.FC<{ opacity?: number }> = ({ opacity = 0.6 }) => {
  return null; // Component removed as per request
};
