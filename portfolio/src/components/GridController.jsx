// src/components/GridController.jsx
import React, { useEffect, useRef, useState } from "react";

const Marker = ({ x, y }) => (
  <circle cx={x} cy={y} r={4} className="fill-black stroke-black stroke-[1]" />
);
const Arrow = ({ x, y, angle }) => (
  <polygon
    points="0,-8 12,0 0,8 -4,0"
    className="fill-black stroke-black stroke-[1]"
    transform={`translate(${x}, ${y}) rotate(${angle})`}
  />
);

export default function GridController({
  sourceRef,
  spacing = 80,
  stagger = 500,
  loop = false,
  stepPx = 6,
  showAnchors = false,
  debug = false,
  persistTrails = true,
  numTargets = 5, // fallback for default targets
  targets = null, // custom targets prop
  onAnchorsComputed,
}) {
  const svgRef = useRef(null);
  const [dims, setDims] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  const [completedPaths, setCompletedPaths] = useState([]);
  const [partialLines, setPartialLines] = useState([]);
  const [arrowPos, setArrowPos] = useState(null);
  const [anchors, setAnchors] = useState([]);

  const running = useRef(false);
  const runOnceRef = useRef(false);

  // Resize handling
  useEffect(() => {
    const onResize = () =>
      setDims({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const snap = (v) => Math.round(v / spacing) * spacing;

  const measureSource = () => {
    if (!svgRef.current || !sourceRef?.current) return null;
    const svgRect = svgRef.current.getBoundingClientRect();
    const r = sourceRef.current.getBoundingClientRect();
    const cx = (r.left + r.right) / 2 - svgRect.left;
    const cy = (r.top + r.bottom) / 2 - svgRect.top;
    return {
      x: snap(Math.max(0, Math.min(cx, svgRect.width))),
      y: snap(Math.max(0, Math.min(cy, svgRect.height))),
    };
  };

  const generateDefaultTargets = (source) => {
    // Fallback default targets if none provided
    return [
      { x: source.x + spacing * 4, y: source.y },
      { x: source.x - spacing * 4, y: source.y },
      { x: source.x, y: source.y + spacing * 3 },
      { x: source.x + spacing * 3, y: source.y + spacing * 2 },
      { x: source.x - spacing * 2, y: source.y - spacing * 2 },
    ].slice(0, numTargets);
  };

  const processTargets = (source, customTargets) => {
    if (customTargets && Array.isArray(customTargets)) {
      // Use custom targets with absolute positioning (don't snap to grid for better precision)
      return customTargets.map(target => ({
        x: Math.max(0, Math.min(target.x, dims.width)),
        y: Math.max(0, Math.min(target.y, dims.height)),
        // Preserve any additional properties like labels, ids, etc.
        ...target
      }));
    }
    // Fall back to default targets
    return generateDefaultTargets(source);
  };

  const computeGridPath = (s, d, pathIndex = 0, totalPaths = 1) => {
    // Use middle grid lines for cleaner routing
    const pathStrategies = [
      // Path 0 - Projects (upper left): Use upper middle horizontal line
      () => [
        { x: s.x, y: s.y },
        { x: s.x, y: s.y - spacing },
        { x: d.x, y: s.y - spacing },
        { x: d.x, y: d.y }
      ],
      // Path 1 - Skills (upper right): Use middle vertical line on right
      () => [
        { x: s.x, y: s.y },
        { x: s.x + spacing, y: s.y },
        { x: s.x + spacing, y: d.y },
        { x: d.x, y: d.y }
      ],
      // Path 2 - Contact (lower left): Use lower middle horizontal line
      () => [
        { x: s.x, y: s.y },
        { x: s.x, y: s.y + spacing },
        { x: d.x, y: s.y + spacing },
        { x: d.x, y: d.y }
      ],
      // Path 3 - Resume (lower right): Use different middle vertical line on right
      () => [
        { x: s.x, y: s.y },
        { x: s.x + spacing * 2, y: s.y },
        { x: s.x + spacing * 2, y: d.y },
        { x: d.x, y: d.y }
      ],
      // Path 4 - About (top center): Use middle vertical line going up
      () => [
        { x: s.x, y: s.y },
        { x: s.x, y: d.y }
      ]
    ];

    // Use the path strategy that corresponds to the button index
    const strategy = pathStrategies[pathIndex] || pathStrategies[0];
    const path = strategy();
    
    // Snap all points to grid and ensure they're within bounds
    return path.map(point => ({
      x: snap(Math.max(spacing, Math.min(point.x, dims.width - spacing))),
      y: snap(Math.max(spacing, Math.min(point.y, dims.height - spacing)))
    }));
  };

  const animatePath = (path) =>
    new Promise((resolve) => {
      if (!path || path.length < 2) return resolve(null);
      let seg = 0;

      const animateSeg = () => {
        if (seg >= path.length - 1) {
          // Calculate final arrow angle pointing toward the destination
          const lastFrom = path[path.length - 2];
          const lastTo = path[path.length - 1];
          const dx = lastTo.x - lastFrom.x;
          const dy = lastTo.y - lastFrom.y;
          
          // Ensure we have a valid direction vector
          let finalAngle;
          if (Math.abs(dx) > 0.1 || Math.abs(dy) > 0.1) {
            finalAngle = Math.atan2(dy, dx) * (180 / Math.PI);
          } else {
            // If the last segment is too short, look at the overall direction
            const overallDx = path[path.length - 1].x - path[0].x;
            const overallDy = path[path.length - 1].y - path[0].y;
            finalAngle = Math.atan2(overallDy, overallDx) * (180 / Math.PI);
          }
          
          resolve({
            fullPath: path,
            finalAngle: finalAngle,
          });
          return;
        }

        const from = path[seg];
        const to = path[seg + 1];
        const dx = to.x - from.x;
        const dy = to.y - from.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        // Skip zero-length segments
        if (dist < 0.1) {
          seg++;
          requestAnimationFrame(animateSeg);
          return;
        }
        
        const angle = Math.atan2(dy, dx) * (180 / Math.PI);

        let progress = 0;
        const step = () => {
          progress += stepPx;
          const ratio = Math.min(progress / dist, 1);
          const cx = from.x + dx * ratio;
          const cy = from.y + dy * ratio;

          setArrowPos({ x: cx, y: cy, angle });
          setPartialLines((prev) => {
            const copy = [...prev];
            copy[seg] = { x1: from.x, y1: from.y, x2: cx, y2: cy };
            return copy;
          });

          if (ratio < 1) {
            requestAnimationFrame(step);
          } else {
            setPartialLines((prev) => {
              const copy = [...prev];
              copy[seg] = { x1: from.x, y1: from.y, x2: to.x, y2: to.y };
              return copy;
            });
            seg++;
            requestAnimationFrame(animateSeg);
          }
        };

        requestAnimationFrame(step);
      };

      animateSeg();
    });

  const runSequence = async () => {
    if (running.current || (!loop && runOnceRef.current)) return;
    running.current = true;

    const source = measureSource();
    if (!source) {
      running.current = false;
      return;
    }

    // Process targets (custom or default)
    const processedTargets = processTargets(source, targets);

    setAnchors([{ ...source, label: "source" }, ...processedTargets]);

    // Send usable anchors to parent
    onAnchorsComputed?.({ source, targets: processedTargets });

    // Create unique paths for each target
    const paths = processedTargets.map((target, index) => 
      computeGridPath(source, target, index, processedTargets.length)
    );
    
    if (!persistTrails) setCompletedPaths([]);

    do {
      for (let i = 0; i < paths.length; i++) {
        const path = paths[i];
        setPartialLines([]);
        setArrowPos({ x: path[0].x, y: path[0].y, angle: 0 });
        await new Promise((r) => setTimeout(r, stagger));
        const result = await animatePath(path);
        if (result && persistTrails) {
          setCompletedPaths((prev) => [
            ...prev,
            { path: result.fullPath, finalAngle: result.finalAngle, pathIndex: i },
          ]);
        }
        setArrowPos(null);
        setPartialLines([]);
        await new Promise((r) => setTimeout(r, 120));
      }
      if (!loop) break;
    } while (loop);

    runOnceRef.current = true;
    running.current = false;
  };

  useEffect(() => {
    runSequence();
  }, [dims, targets]); // Add targets to dependency array

  const renderFullPath = (path, key) =>
    path.map((p, i) => {
      const next = path[i + 1];
      if (!next) return null;
      return (
        <line
          key={`${key}-seg-${i}`}
          x1={p.x}
          y1={p.y}
          x2={next.x}
          y2={next.y}
          stroke="black"
          strokeWidth={2}
          strokeLinecap="round"
        />
      );
    });

  return (
    <svg
      ref={svgRef}
      width={dims.width}
      height={dims.height}
      className="absolute top-0 left-0 w-full h-full pointer-events-none"
    >
      {/* Grid background */}
      {Array.from({ length: Math.ceil(dims.width / spacing) + 1 }, (_, i) => (
        <line
          key={`v-${i}`}
          x1={i * spacing}
          y1={0}
          x2={i * spacing}
          y2={dims.height}
          stroke="black"
          strokeWidth={1}
          strokeDasharray="2,3"
        />
      ))}
      {Array.from({ length: Math.ceil(dims.height / spacing) + 1 }, (_, i) => (
        <line
          key={`h-${i}`}
          x1={0}
          y1={i * spacing}
          x2={dims.width}
          y2={i * spacing}
          stroke="black"
          strokeWidth={1}
          strokeDasharray="2,3"
        />
      ))}

      {/* Completed paths + arrows */}
      {completedPaths.map((cp, i) => (
        <g key={`cp-${i}`}>
          {renderFullPath(cp.path, `cp-${i}`)}
          <Arrow
            x={cp.path[cp.path.length - 1].x}
            y={cp.path[cp.path.length - 1].y}
            angle={cp.finalAngle}
          />
        </g>
      ))}

      {/* Partial path */}
      {partialLines.map((ln, i) =>
        ln ? (
          <line
            key={`pl-${i}`}
            x1={ln.x1}
            y1={ln.y1}
            x2={ln.x2}
            y2={ln.y2}
            stroke="black"
            strokeWidth={2}
          />
        ) : null
      )}
      {arrowPos && <Arrow x={arrowPos.x} y={arrowPos.y} angle={arrowPos.angle} />}

      {/* Debug markers */}
      {showAnchors &&
        anchors.map((a, i) => <Marker key={`a-${i}`} x={a.x} y={a.y} />)}
    </svg>
  );
}