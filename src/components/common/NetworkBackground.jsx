import React, { useEffect, useRef } from 'react';

const NetworkBackground = () => {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    let width = window.innerWidth;
    let height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;

    const getComputedAccent = () => {
      // Get --accent-a from computed styles, default to a blue if not parsed yet
      const computed = getComputedStyle(document.documentElement).getPropertyValue('--accent-a').trim();
      return computed || '#3E63FF';
    };

    // Parse hex to rgb for opacity handling
    const hexToRgb = (hex) => {
      // Basic parser assuming 6 digit hex
      const c = hex.replace('#', '');
      if (c.length !== 6) return '62, 99, 255';
      const r = parseInt(c.substring(0, 2), 16);
      const g = parseInt(c.substring(2, 4), 16);
      const b = parseInt(c.substring(4, 6), 16);
      return `${r}, ${g}, ${b}`;
    };

    let baseColorRgb = hexToRgb(getComputedAccent());

    // Scale nodes based on width
    const nodeCount = Math.floor(width / 35);
    const nodes = [];

    for (let i = 0; i < nodeCount; i++) {
      nodes.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
      });
    }

    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      
      // We might need to refresh baseColorRgb if theme changes, but keeping it simple for now
      baseColorRgb = hexToRgb(getComputedAccent());

      // Update positions
      if (!prefersReducedMotion) {
        for (let i = 0; i < nodeCount; i++) {
          nodes[i].x += nodes[i].vx;
          nodes[i].y += nodes[i].vy;

          if (nodes[i].x < 0 || nodes[i].x > width) nodes[i].vx *= -1;
          if (nodes[i].y < 0 || nodes[i].y > height) nodes[i].vy *= -1;
        }
      }

      // Draw lines
      for (let i = 0; i < nodeCount; i++) {
        for (let j = i + 1; j < nodeCount; j++) {
          const dx = nodes[i].x - nodes[j].x;
          const dy = nodes[i].y - nodes[j].y;
          const distSq = dx * dx + dy * dy;

          if (distSq < 22500) { // 150 * 150
            const opacity = 1 - Math.sqrt(distSq) / 150;
            ctx.beginPath();
            ctx.moveTo(nodes[i].x, nodes[i].y);
            ctx.lineTo(nodes[j].x, nodes[j].y);
            ctx.strokeStyle = `rgba(${baseColorRgb}, ${opacity * 0.15})`;
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        }
      }

      // Draw nodes
      for (let i = 0; i < nodeCount; i++) {
        ctx.beginPath();
        ctx.arc(nodes[i].x, nodes[i].y, 1.5, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${baseColorRgb}, 0.5)`;
        ctx.fill();
      }

      if (!prefersReducedMotion) {
        animationRef.current = requestAnimationFrame(draw);
      }
    };

    draw();

    const handleResize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
      if (prefersReducedMotion) draw(); // redraw static frame on resize
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, []);

  return (
    <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden bg-theme-bg">
      <canvas 
        ref={canvasRef} 
        className="absolute inset-0 w-full h-full opacity-50"
      />
      
      {/* Floating Gradient Orbs */}
      <div 
        className="absolute w-[600px] h-[600px] rounded-full opacity-15 blur-[70px] motion-safe:animate-[float_14s_ease-in-out_infinite] -top-[10%] -left-[10%]"
        style={{ backgroundColor: 'var(--accent-a)' }}
      ></div>
      <div 
        className="absolute w-[500px] h-[500px] rounded-full opacity-15 blur-[70px] motion-safe:animate-[float_18s_ease-in-out_infinite_reverse] top-[40%] right-[5%]"
        style={{ backgroundColor: 'var(--accent-b)' }}
      ></div>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes float {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
      `}} />
    </div>
  );
};

export default NetworkBackground;
