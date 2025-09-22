import React, { useEffect, useRef, forwardRef } from "react";

const Arrow = forwardRef(({ path, speed }, ref) => {
  const arrowRef = ref || useRef(null);

  useEffect(() => {
    if (!path || path.length < 2) return;
    let index = 0;

    const animate = () => {
      if (index >= path.length - 1) return;

      const from = path[index];
      const to = path[index + 1];

      const dx = to.x - from.x;
      const dy = to.y - from.y;
      const angle = Math.atan2(dy, dx) * (180 / Math.PI);

      const startTime = performance.now();

      const step = (currentTime) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / speed, 1);
        const currentX = from.x + dx * progress;
        const currentY = from.y + dy * progress;

        if (arrowRef.current) {
          arrowRef.current.setAttribute(
            "transform",
            `translate(${currentX}, ${currentY}) rotate(${angle})`
          );
        }

        if (progress < 1) requestAnimationFrame(step);
        else {
          index++;
          requestAnimationFrame(animate);
        }
      };

      requestAnimationFrame(step);
    };

    animate();
  }, [path, speed, arrowRef]);

  return (
    <polygon
      ref={arrowRef}
      points="0,-8 12,0 0,8 -4,0"
      className="fill-black stroke-black stroke-[1]"
    />
  );
});

export default Arrow;
