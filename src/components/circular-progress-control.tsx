'use client';

import React, { useRef, useState, useCallback } from 'react';

type CircularProgressControlProps = {
  progress: number; // 0-100
  onSeek: (progressFraction: number) => void; // 0-1
  size?: number;
  strokeWidth?: number;
};

export function CircularProgressControl({
  progress,
  onSeek,
  size = 40,
  strokeWidth = 3,
}: CircularProgressControlProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [isSeeking, setIsSeeking] = useState(false);

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progress / 100) * circumference;

  const getAngle = (e: React.MouseEvent | React.TouchEvent) => {
    if (!svgRef.current) return 0;
    
    const rect = svgRef.current.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    const x = clientX - (rect.left + rect.width / 2);
    const y = clientY - (rect.top + rect.height / 2);

    let angle = Math.atan2(y, x) * (180 / Math.PI) + 90;
    if (angle < 0) angle += 360;
    return angle;
  };

  const handleInteraction = (e: React.MouseEvent | React.TouchEvent) => {
    const angle = getAngle(e);
    const progressFraction = angle / 360;
    onSeek(progressFraction);
  };
  
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsSeeking(true);
    handleInteraction(e);
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (isSeeking) {
        e.preventDefault();
        handleInteraction(e as unknown as React.MouseEvent);
    }
  }, [isSeeking]);

  const handleMouseUp = useCallback((e: MouseEvent) => {
    e.preventDefault();
    setIsSeeking(false);
  }, []);

  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    setIsSeeking(true);
    handleInteraction(e);
  };

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (isSeeking) {
        e.preventDefault();
        handleInteraction(e as unknown as React.TouchEvent);
    }
  }, [isSeeking]);

  const handleTouchEnd = useCallback((e: TouchEvent) => {
    e.preventDefault();
    setIsSeeking(false);
  }, []);

  useEffect(() => {
    if (isSeeking) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('touchmove', handleTouchMove);
      window.addEventListener('touchend', handleTouchEnd);
    } else {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isSeeking, handleMouseMove, handleMouseUp, handleTouchMove, handleTouchEnd]);


  return (
    <div
      className="absolute inset-0 cursor-pointer"
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
    >
      <svg
        ref={svgRef}
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="transform -rotate-90"
      >
        <circle
          className="text-muted"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        <circle
          className="text-primary"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
      </svg>
    </div>
  );
}
