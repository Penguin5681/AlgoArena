"use client";

import React, { useState, useRef, MouseEvent } from 'react';
import styles from './ZoomableImage.module.css';

interface ZoomableImageProps {
  src: string;
  alt: string;
}

export default function ZoomableImage({ src, alt }: ZoomableImageProps) {
  const [isZoomed, setIsZoomed] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (isZoomed && containerRef.current && imageRef.current) {
      const containerRect = containerRef.current.getBoundingClientRect();
      const x = ((e.clientX - containerRect.left) / containerRect.width) * 100;
      const y = ((e.clientY - containerRect.top) / containerRect.height) * 100;
      imageRef.current.style.transformOrigin = `${x}% ${y}%`;
    }
  };

  const toggleZoom = () => {
    setIsZoomed(!isZoomed);
  };

  return (
    <div
      ref={containerRef}
      className={`${styles.zoomContainer} ${isZoomed ? styles.zoomed : ''}`}
      onMouseMove={handleMouseMove}
      onClick={toggleZoom}
      onMouseLeave={() => setIsZoomed(false)} // Exit zoom when mouse leaves container
    >
      <img
        ref={imageRef}
        src={src}
        alt={alt}
        className={styles.image}
      />
      <div className={styles.prompt}>
        {isZoomed ? 'Click to Zoom Out' : 'Click to Zoom In'}
      </div>
    </div>
  );
}