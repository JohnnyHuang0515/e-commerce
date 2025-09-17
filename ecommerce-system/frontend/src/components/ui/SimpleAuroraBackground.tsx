import { useEffect, useRef } from 'react';

interface SimpleAuroraBackgroundProps {
  colorStops?: string[];
  className?: string;
  subtle?: boolean;
}

export default function SimpleAuroraBackground({ 
  colorStops = ['#f0f2f5', '#ffffff', '#f0f2f5'],
  className = '',
  subtle = true
}: SimpleAuroraBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    let time = 0;
    const animate = () => {
      time += 0.01;
      
      // 清除畫布
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // 創建漸變
      const gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
      gradient.addColorStop(0, colorStops[0]);
      gradient.addColorStop(0.5, colorStops[1]);
      gradient.addColorStop(1, colorStops[2]);
      
      if (subtle) {
        // 簡潔的漸變背景
        ctx.fillStyle = gradient;
        ctx.globalAlpha = 0.1;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // 微妙的動態效果
        ctx.globalAlpha = 0.05;
        ctx.beginPath();
        ctx.moveTo(0, canvas.height * 0.8);
        
        for (let x = 0; x <= canvas.width; x += 4) {
          const y = canvas.height * 0.8 + Math.sin(x * 0.005 + time * 0.5) * 20;
          ctx.lineTo(x, y);
        }
        
        ctx.lineTo(canvas.width, canvas.height);
        ctx.closePath();
        ctx.fill();
      } else {
        // 原有的動態波浪效果
        ctx.fillStyle = gradient;
        ctx.globalAlpha = 0.3;
        
        ctx.beginPath();
        ctx.moveTo(0, canvas.height);
        
        for (let x = 0; x <= canvas.width; x += 2) {
          const y = canvas.height * 0.7 + Math.sin(x * 0.01 + time) * 50 + 
                    Math.sin(x * 0.02 + time * 1.5) * 30;
          ctx.lineTo(x, y);
        }
        
        ctx.lineTo(canvas.width, canvas.height);
        ctx.closePath();
        ctx.fill();
      }
      
      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [colorStops]);

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 w-full h-full ${className}`}
      style={{ zIndex: -1 }}
    />
  );
}
