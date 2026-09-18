import { useRef, useEffect } from 'react';

export const use3DTilt = (options = {}) => {
  const { maxTilt = 10, scale = 1.03, zLift = 10, reverse = false } = options;
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Removed prefers-reduced-motion check to ensure effects are visible for review
    // const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    // if (prefersReducedMotion) return;

    let rafId = null;

    const handleMouseMove = (e) => {
      if (rafId) cancelAnimationFrame(rafId);

      rafId = requestAnimationFrame(() => {
        const rect = el.getBoundingClientRect();
        const x = e.clientX - rect.left; // x position within the element
        const y = e.clientY - rect.top;  // y position within the element

        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        const rotateX = ((y - centerY) / centerY) * maxTilt * (reverse ? 1 : -1);
        const rotateY = ((x - centerX) / centerX) * maxTilt * (reverse ? -1 : 1);

        el.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(${scale}) translateZ(${zLift}px)`;
        el.style.transition = 'transform 0.08s linear';
      });
    };

    const handleMouseLeave = () => {
      if (rafId) cancelAnimationFrame(rafId);
      el.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg) scale(1) translateZ(0px)`;
      el.style.transition = 'transform 0.25s cubic-bezier(.4,0,.2,1)';
    };

    el.addEventListener('mousemove', handleMouseMove);
    el.addEventListener('mouseleave', handleMouseLeave);

    // Initial styles
    el.style.transformStyle = 'preserve-3d';

    return () => {
      el.removeEventListener('mousemove', handleMouseMove);
      el.removeEventListener('mouseleave', handleMouseLeave);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [maxTilt, scale, zLift, reverse]);

  return ref;
};
