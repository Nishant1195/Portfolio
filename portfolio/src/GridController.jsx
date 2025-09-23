import React, { useState, useRef, useEffect } from "react";
import GridSVG from "./GridSVG";
import Marker from "./Marker";
import Arrow from "./Arrow";

const spacing = 81; // Grid spacing in pixels

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

  // --- Snap helper ---
  const snapToGrid = (value) => Math.round(value / spacing) * spacing;

  const removeDuplicates = (path) => {
  return path.filter((point, i, arr) => {
    if (i === 0) return true;
    return !(point.x === arr[i - 1].x && point.y === arr[i - 1].y);
  });
};


  // --- Compute Manhattan path ---
  // --- Compute Manhattan path with real start/end points ---
// --- Compute path between source and destination (raw line points supported) ---
// --- Compute path between source and destination (raw line points supported) ---
const computeGridPath = (source, destination, spacing) => {
  if (!source || !destination) return [];

  const path = [];

  // Start point
  path.push({ x: source.x, y: source.y });

  // Case 1: Same row or same column → straight line
  if (source.y === destination.y || source.x === destination.x) {
    path.push({ x: destination.x, y: destination.y });
    return path;
  }

  // Case 2: Different row & column → make an "L" shape
  // Decide routing: horizontal first or vertical first
  if (source.lineType === "horizontal") {
    // Horizontal line point: go horizontally first, then vertically
    path.push({ x: destination.x, y: source.y });
  } else {
    // Vertical line point: go vertically first, then horizontally
    path.push({ x: source.x, y: destination.y });
  }

  // End point
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
      const isHorizontal = from.y === to.y;

      let progress = 0;
      const step = 5; // px per frame
      const distance = isHorizontal
        ? Math.abs(to.x - from.x)
        : Math.abs(to.y - from.y);

      const angle = isHorizontal
        ? (to.x > from.x ? 0 : 180)
        : (to.y > from.y ? 90 : -90);

      const animate = () => {
        if (!isAnimating.current) return;

        progress += step;
        const ratio = Math.min(progress / distance, 1);

        const currentX = from.x + (to.x - from.x) * ratio;
        const currentY = from.y + (to.y - from.y) * ratio;

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

  // --- Handle grid clicks ---
// --- Handle grid clicks ---
// --- Handle grid clicks ---
const handleLineClick = (x, y, lineType, lineIndex) => {
  if (isAnimating.current) return;

  const gridWidth = Math.floor(dimensions.width / spacing) * spacing;
  const gridHeight = Math.floor(dimensions.height / spacing) * spacing;

  let actualX, actualY;

  if (lineType === "horizontal") {
    // Raw mouse X, fixed Y at this row
    actualX = Math.max(0, Math.min(x, gridWidth));
    actualY = lineIndex * spacing;
  } else {
    // Raw mouse Y, fixed X at this column
    actualX = lineIndex * spacing;
    actualY = Math.max(0, Math.min(y, gridHeight));
  }

  const clickedPoint = { x: actualX, y: actualY, lineType, lineIndex };

  if (!sourcePoint) {
    // First click → set source
    setSourcePoint(clickedPoint);
    setDestinationPoint(null);
    setSolidLines([]);
    setArrowPosition(null);
  } else if (
    sourcePoint.x === clickedPoint.x &&
    sourcePoint.y === clickedPoint.y
  ) {
    // Clicked same as source → reset
    resetAnimation();
  } else if (!destinationPoint) {
    // Second click → set destination
    setDestinationPoint(clickedPoint);
  } else if (
    destinationPoint.x === clickedPoint.x &&
    destinationPoint.y === clickedPoint.y
  ) {
    // Clicked same as destination → reset
    resetAnimation();
  } else {
    // Change destination
    setDestinationPoint(clickedPoint);
  }
};




  // --- Watch for new source/destination ---
  useEffect(() => {
    if (!sourcePoint || !destinationPoint) return;

    const path = computeGridPath(sourcePoint, destinationPoint);
    setSolidLines([]);
    setArrowPosition({ x: path[0].x, y: path[0].y, angle: 0 });
    animateArrow(path);

    return () => {
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
    <GridSVG
      width={dimensions.width}
      height={dimensions.height}
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
          className="stroke-black stroke-[2] pointer-events-none"
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
  );
};

export default GridController;
