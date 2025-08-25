'use client';

import { useEffect, useRef } from 'react';

interface MiniChartProps {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
  trend?: 'up' | 'down' | 'stable';
  className?: string;
}

export function MiniChart({ 
  data, 
  width = 100, 
  height = 40, 
  color = 'currentColor',
  trend,
  className
}: MiniChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current || !data || data.length === 0) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Set canvas size
    canvas.width = width;
    canvas.height = height;

    // Calculate min and max values
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;

    // Set line style
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Draw the line chart
    ctx.beginPath();
    
    data.forEach((value, index) => {
      const x = (index / (data.length - 1)) * width;
      const y = height - ((value - min) / range) * height;
      
      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    
    ctx.stroke();

    // Add gradient fill if trend is specified
    if (trend) {
      const gradient = ctx.createLinearGradient(0, 0, 0, height);
      
      if (trend === 'up') {
        gradient.addColorStop(0, 'rgba(34, 197, 94, 0.2)');
        gradient.addColorStop(1, 'rgba(34, 197, 94, 0.0)');
      } else if (trend === 'down') {
        gradient.addColorStop(0, 'rgba(239, 68, 68, 0.2)');
        gradient.addColorStop(1, 'rgba(239, 68, 68, 0.0)');
      } else {
        gradient.addColorStop(0, 'rgba(107, 114, 128, 0.2)');
        gradient.addColorStop(1, 'rgba(107, 114, 128, 0.0)');
      }
      
      ctx.fillStyle = gradient;
      ctx.lineTo(width, height);
      ctx.lineTo(0, height);
      ctx.closePath();
      ctx.fill();
    }

  }, [data, width, height, color, trend]);

  if (!data || data.length === 0) {
    return (
      <div 
        className="flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded"
        style={{ width, height }}
      >
        <span className="text-gray-400 text-xs">No data</span>
      </div>
    );
  }

  return (
    <canvas
      ref={canvasRef}
      className={`rounded ${className || ''}`}
      style={{ width, height }}
    />
  );
}