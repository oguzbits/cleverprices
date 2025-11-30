"use client";

import createGlobe from "cobe";
import { useEffect, useRef, useState } from "react";
import { useSpring } from "react-spring";

export function Globe({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pointerInteracting = useRef<number | null>(null);
  const pointerInteractionMovement = useRef(0);
  const isInView = useRef(false);
  const [shouldInitialize, setShouldInitialize] = useState(false);
  const [{ r }, api] = useSpring(() => ({
    r: 0,
    config: {
      mass: 1,
      tension: 280,
      friction: 40,
      precision: 0.001,
    },
  }));

  useEffect(() => {
    // Intersection Observer to detect when globe is in viewport
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          isInView.current = entry.isIntersecting;
          // Only initialize globe when it becomes visible for the first time
          if (entry.isIntersecting && !shouldInitialize) {
            setShouldInitialize(true);
          }
        });
      },
      { threshold: 0.1, rootMargin: "50px" } // Start loading slightly before visible
    );
    
    if (canvasRef.current) {
      observer.observe(canvasRef.current);
    }
    
    return () => {
      observer.disconnect();
    };
  }, [shouldInitialize]);

  useEffect(() => {
    // Don't initialize until the globe is in view
    if (!shouldInitialize || !canvasRef.current) return;

    let phi = 0;
    let width = 0;
    let frameCount = 0;
    const onResize = () => canvasRef.current && (width = canvasRef.current.offsetWidth);
    window.addEventListener("resize", onResize);
    onResize();
    
    const globe = createGlobe(canvasRef.current, {
      devicePixelRatio: 2,
      width: width * 2,
      height: width * 2,
      phi: 0,
      theta: 0.3,
      dark: 1,
      diffuse: 3,
      mapSamples: 16000,
      mapBrightness: 1.2,
      baseColor: [1, 1, 1],
      markerColor: [16 / 255, 185 / 255, 129 / 255],
      glowColor: [1.2, 1.2, 1.2],
      markers: [
        // US
        { location: [37.0902, -95.7129], size: 0.05 },
        // UK
        { location: [55.3781, -3.4360], size: 0.05 },
        // Canada
        { location: [56.1304, -106.3468], size: 0.05 },
        // Germany
        { location: [51.1657, 10.4515], size: 0.05 },
        // Spain
        { location: [40.4637, -3.7492], size: 0.05 },
        // Italy
        { location: [41.8719, 12.5674], size: 0.05 },
        // France
        { location: [46.2276, 2.2137], size: 0.05 },
        // Australia
        { location: [-25.2744, 133.7751], size: 0.05 },
        // Sweden
        { location: [60.1282, 18.6435], size: 0.05 },
        // Ireland
        { location: [53.1424, -7.6921], size: 0.05 },
        // India
        { location: [20.5937, 78.9629], size: 0.05 },
      ],
      onRender: (state) => {
        // Skip rendering entirely when not in view
        if (!isInView.current) return;
        
        // Reduce frame rate to ~30fps for better performance
        frameCount++;
        if (frameCount % 2 !== 0) return; // Skip every other frame
        
        // This prevents rotation while dragging
        if (!pointerInteracting.current) {
          // Called on every animation frame.
          // `state` will be an empty object, return updated params.
          phi += 0.003;
        }
        state.phi = phi + r.get();
        state.width = width * 2;
        state.height = width * 2;
      },
    });
    
    setTimeout(() => {
      if (canvasRef.current) {
        canvasRef.current.style.opacity = "1";
      }
    }, 100);
    
    return () => {
      globe.destroy();
      window.removeEventListener("resize", onResize);
    };
  }, [shouldInitialize, r]);

  return (
    <div
      style={{
        aspectRatio: 1,
        margin: "auto",
        position: "relative",
      }}
      className={className}
    >
      <div id="globe-instructions" className="sr-only">
        Use arrow keys to rotate the globe. Left and right arrows rotate horizontally.
      </div>
      <canvas
        ref={canvasRef}
        aria-label="Interactive 3D Globe showing supported countries"
        aria-describedby="globe-instructions"
        role="img"
        tabIndex={0}
        onPointerDown={(e) => {
          pointerInteracting.current =
            e.clientX - pointerInteractionMovement.current;
          canvasRef.current!.style.cursor = "grabbing";
        }}
        onPointerUp={() => {
          pointerInteracting.current = null;
          canvasRef.current!.style.cursor = "grab";
        }}
        onPointerOut={() => {
          pointerInteracting.current = null;
          canvasRef.current!.style.cursor = "grab";
        }}
        onMouseMove={(e) => {
          if (pointerInteracting.current !== null) {
            const delta = e.clientX - pointerInteracting.current;
            pointerInteractionMovement.current = delta;
            api.start({
              r: delta / 200,
            });
          }
        }}
        onTouchMove={(e) => {
          if (pointerInteracting.current !== null && e.touches[0]) {
            const delta = e.touches[0].clientX - pointerInteracting.current;
            pointerInteractionMovement.current = delta;
            api.start({
              r: delta / 100,
            });
          }
        }}
        onKeyDown={(e) => {
          if (e.key === "ArrowLeft") {
            e.preventDefault();
            api.start({
              r: r.get() - 0.2,
            });
          } else if (e.key === "ArrowRight") {
            e.preventDefault();
            api.start({
              r: r.get() + 0.2,
            });
          }
        }}
        style={{
          width: "100%",
          height: "100%",
          cursor: "grab",
          contain: "layout paint size",
          opacity: 0,
          transition: "opacity 1s ease",
        }}
      />
    </div>
  );
}
