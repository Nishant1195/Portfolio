import React, { useState, useRef, useEffect } from "react";

const spacing = 81; // Grid spacing in pixels

// GridSVG Component
const GridSVG = ({ spacing = 50, onLineClick, children }) => {
  const [dimensions, setDimensions] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  useEffect(() => {
    const handleResize = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const { width, height } = dimensions;
  const cols = Math.ceil(width / spacing);
  const rows = Math.ceil(height / spacing);

  const handleClick = (e, lineType, index) => {
    e.preventDefault();
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    console.log(`Click on ${lineType} line ${index} at (${x}, ${y})`); // Debug log
    onLineClick?.(x, y, lineType, index);
  };

  const verticalLines = Array.from({ length: cols + 1 }, (_, i) => (
    <line
      key={`v-${i}`}
      x1={i * spacing}
      y1={0}
      x2={i * spacing}
      y2={height}
      className="stroke-black stroke-[1] [stroke-dasharray:2,3] cursor-pointer hover:stroke-2"
      onClick={(e) => handleClick(e, "vertical", i)}
    />
  ));

  const horizontalLines = Array.from({ length: rows + 1 }, (_, i) => (
    <line
      key={`h-${i}`}
      x1={0}
      y1={i * spacing}
      x2={width}
      y2={i * spacing}
      className="stroke-black stroke-[1] [stroke-dasharray:2,3] cursor-pointer hover:stroke-2"
      onClick={(e) => handleClick(e, "horizontal", i)}
    />
  ));

  return (
    <svg
      width={width}
      height={height}
      className="absolute top-0 left-0 w-full h-full bg-white cursor-crosshair"
    >
      {verticalLines}
      {horizontalLines}
      {children}
    </svg>
  );
};

// Marker Component
const Marker = ({ x, y, type }) => (
  <circle
    cx={x}
    cy={y}
    r={4}
    className="fill-black stroke-black stroke-[1]"
  />
);

// Arrow Component
const Arrow = ({ x, y, angle }) => (
  <polygon
    points="0,-8 12,0 0,8 -4,0"
    className="fill-black stroke-black stroke-[1]"
    transform={`translate(${x}, ${y}) rotate(${angle})`}
  />
);

const GridController = () => {
  const [dimensions, setDimensions] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  const [sourcePoint, setSourcePoint] = useState(null);
  const [destinationPoint, setDestinationPoint] = useState(null);
  const [solidLines, setSolidLines] = useState([]);
  const [arrowPosition, setArrowPosition] = useState(null);

  const isAnimating = useRef(false);
  const animationRef = useRef(null);

  // --- Window resize handling ---
  useEffect(() => {
    const handleResize = () => {
      const width = Math.floor(window.innerWidth / spacing) * spacing;
      const height = Math.floor(window.innerHeight / spacing) * spacing;
      setDimensions({ width, height });
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // --- Cleanup animation on unmount ---
  useEffect(() => {
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, []);

  // --- Helper function to check if two points are close enough to be considered the same ---
  const pointsAreEqual = (point1, point2, tolerance = 5) => {
    if (!point1 || !point2) return false;
    return Math.abs(point1.x - point2.x) < tolerance && Math.abs(point1.y - point2.y) < tolerance;
  };

  // --- Compute path between source and destination ---
  const computeGridPath = (source, destination) => {
    if (!source || !destination) return [];

    const path = [];
    path.push({ x: source.x, y: source.y });

    // Case 1: Same line - direct path
    if ((source.lineType === destination.lineType && source.lineIndex === destination.lineIndex) ||
        (source.y === destination.y || source.x === destination.x)) {
      path.push({ x: destination.x, y: destination.y });
      return path;
    }

    // Case 2: Different lines - create L-shaped path
    if (source.lineType === "horizontal" && destination.lineType === "vertical") {
      // Move horizontally to vertical line, then vertically to destination
      path.push({ x: destination.x, y: source.y });
    } else if (source.lineType === "vertical" && destination.lineType === "horizontal") {
      // Move vertically to horizontal line, then horizontally to destination
      path.push({ x: source.x, y: destination.y });
    } else if (source.lineType === destination.lineType) {
      // Both on same type of line - use intermediate perpendicular line
      if (source.lineType === "horizontal") {
        const bridgeX = Math.round(((source.x + destination.x) / 2) / spacing) * spacing;
        path.push({ x: bridgeX, y: source.y });
        path.push({ x: bridgeX, y: destination.y });
      } else {
        const bridgeY = Math.round(((source.y + destination.y) / 2) / spacing) * spacing;
        path.push({ x: source.x, y: bridgeY });
        path.push({ x: destination.x, y: bridgeY });
      }
    }

    path.push({ x: destination.x, y: destination.y });
    return path;
  };

  // --- Animate arrow step by step ---
  const animateArrow = (path) => {
    if (path.length < 2) return;

    let currentSegment = 0;

    const animateSegment = () => {
      if (currentSegment >= path.length - 1) {
        isAnimating.current = false;
        return;
      }

      const from = path[currentSegment];
      const to = path[currentSegment + 1];
      const dx = to.x - from.x;
      const dy = to.y - from.y;
      const angle = Math.atan2(dy, dx) * 180 / Math.PI;

      let progress = 0;
      const step = 5; // px per frame
      const distance = Math.sqrt(dx * dx + dy * dy);

      const animate = () => {
        if (!isAnimating.current) return;

        progress += step;
        const ratio = Math.min(progress / distance, 1);

        const currentX = from.x + dx * ratio;
        const currentY = from.y + dy * ratio;

        setArrowPosition({ x: currentX, y: currentY, angle });

        setSolidLines((prev) => {
          const newLines = [...prev];
          newLines[currentSegment] = {
            x1: from.x,
            y1: from.y,
            x2: currentX,
            y2: currentY,
          };
          return newLines;
        });

        if (ratio < 1) {
          animationRef.current = requestAnimationFrame(animate);
        } else {
          currentSegment++;
          animationRef.current = requestAnimationFrame(animateSegment);
        }
      };

      animationRef.current = requestAnimationFrame(animate);
    };

    isAnimating.current = true;
    setSolidLines([]);
    animateSegment();
  };

  // --- ENHANCED Handle grid clicks with state machine logic ---
  const handleLineClick = (x, y, lineType, lineIndex) => {
    if (isAnimating.current) return; // Don't allow clicks during animation

    let actualX, actualY;

    if (lineType === "horizontal") {
      // For horizontal lines: keep exact X position from click, snap Y to the line
      actualX = Math.max(0, Math.min(x, dimensions.width));
      actualY = lineIndex * spacing;
    } else if (lineType === "vertical") {
      // For vertical lines: snap X to the line, keep exact Y position from click
      actualX = lineIndex * spacing;
      actualY = Math.max(0, Math.min(y, dimensions.height));
    }

    const clickedPoint = { x: actualX, y: actualY, lineType, lineIndex };
    console.log('Clicked point:', clickedPoint, 'Source:', sourcePoint, 'Destination:', destinationPoint); // Debug log

    // STATE MACHINE LOGIC for point setting:
    if (sourcePoint === null) {
      // STATE 1: No source point set yet
      console.log('Setting source point');
      setSourcePoint(clickedPoint);
      setDestinationPoint(null);
      setSolidLines([]);
      setArrowPosition(null);
      
    } else if (pointsAreEqual(sourcePoint, clickedPoint)) {
      // STATE 2: Clicked near existing source point - clear it
      console.log('Clearing source point');
      resetAnimation();
      
    } else if (destinationPoint === null) {
      // STATE 3: Source exists, no destination - set destination
      console.log('Setting destination point');
      setDestinationPoint(clickedPoint);
      
    } else if (pointsAreEqual(destinationPoint, clickedPoint)) {
      // STATE 4: Clicked near existing destination - clear it
      console.log('Clearing destination point');
      setDestinationPoint(null);
      setSolidLines([]);
      setArrowPosition(null);
      
    } else {
      // STATE 5: Both points exist, clicked elsewhere - change destination
      console.log('Changing destination point');
      setDestinationPoint(clickedPoint);
      setSolidLines([]);
      setArrowPosition(null);
    }
  };

  // --- Watch for new source/destination and start animation ---
  useEffect(() => {
    if (!sourcePoint || !destinationPoint) return;

    // Add small delay before starting animation (like in original)
    const timer = setTimeout(() => {
      const path = computeGridPath(sourcePoint, destinationPoint);
      if (path.length > 1) {
        setArrowPosition({ x: path[0].x, y: path[0].y, angle: 0 });
        animateArrow(path);
      }
    }, 300);

    return () => {
      clearTimeout(timer);
      isAnimating.current = false;
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [sourcePoint, destinationPoint]);

  // --- Reset everything ---
  const resetAnimation = () => {
    isAnimating.current = false;
    if (animationRef.current) cancelAnimationFrame(animationRef.current);
    setSourcePoint(null);
    setDestinationPoint(null);
    setSolidLines([]);
    setArrowPosition(null);
  };

  // --- Render ---
  return (
    <div className="w-full h-screen overflow-hidden">
      <GridSVG
        spacing={spacing}
        onLineClick={handleLineClick}
      >
        {/* Solid path */}
        {solidLines.map((line, i) => (
          <line
            key={`line-${i}`}
            x1={line.x1}
            y1={line.y1}
            x2={line.x2}
            y2={line.y2}
            className="stroke-black stroke-[2] pointer-events-none stroke-round"
          />
        ))}

        {/* Source marker */}
        {sourcePoint && (
          <Marker x={sourcePoint.x} y={sourcePoint.y} type="source" />
        )}

        {/* Destination marker */}
        {destinationPoint && (
          <Marker x={destinationPoint.x} y={destinationPoint.y} type="destination" />
        )}

        {/* Animated arrow */}
        {arrowPosition && (
          <Arrow
            x={arrowPosition.x}
            y={arrowPosition.y}
            angle={arrowPosition.angle}
          />
        )}
      </GridSVG>

    </div>
  );
};

export default GridController;