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
  const pathRef = useRef([]);
  const animationRef = useRef(null);
  const speed = 200; // ms per segment

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      // Calculate dimensions that fit complete grid cells
      const width = Math.floor(window.innerWidth / spacing) * spacing;
      const height = Math.floor(window.innerHeight / spacing) * spacing;
      setDimensions({ width, height });
    };
    handleResize(); // Initial call
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Cleanup animation on unmount
  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  // Helper function to snap value to grid
  const snapToGrid = (value) => Math.round(value / spacing) * spacing;

  // Handle clicks on grid lines
  const handleLineClick = (x, y, lineType, lineIndex) => {
    if (isAnimating.current) return;

    // Use exact click coordinates for the respective line
    let actualX, actualY;
    
    // Calculate grid dimensions in terms of spacing
    const gridWidth = Math.floor(dimensions.width / spacing) * spacing;
    const gridHeight = Math.floor(dimensions.height / spacing) * spacing;

    if (lineType === "horizontal") {
      // For horizontal line, keep exact X within grid bounds, use line's Y
      actualX = Math.max(0, Math.min(x, gridWidth));
      actualY = Math.min(lineIndex * spacing, gridHeight);
    } else {
      // For vertical line, use line's X within grid bounds, keep exact Y
      actualX = Math.min(lineIndex * spacing, gridWidth);
      actualY = Math.max(0, Math.min(y, gridHeight));
    }

    const clickedPoint = { 
      x: actualX, 
      y: actualY, 
      lineType,
      lineIndex 
    };

    // State management for source and destination
    if (!sourcePoint) {
      setSourcePoint(clickedPoint);
      setDestinationPoint(null);
      setSolidLines([]);
      setArrowPosition(null);
    } else if (sourcePoint.x === clickedPoint.x && sourcePoint.y === clickedPoint.y) {
      // Clicking on source again - reset everything
      setSourcePoint(null);
      setDestinationPoint(null);
      setSolidLines([]);
      setArrowPosition(null);
    } else if (!destinationPoint) {
      setDestinationPoint(clickedPoint);
    } else if (destinationPoint.x === clickedPoint.x && destinationPoint.y === clickedPoint.y) {
      // Clicking on destination again - remove it
      setDestinationPoint(null);
      setSolidLines([]);
      setArrowPosition(null);
    } else {
      // Set new destination
      setDestinationPoint(clickedPoint);
    }
  };

  // Start path animation when source & destination are set
  useEffect(() => {
    if (!sourcePoint || !destinationPoint) return;
    
    // Calculate the grid-aligned path
    const path = computeGridPath(sourcePoint, destinationPoint);
    pathRef.current = path;
    
    // Reset and start animation
    setSolidLines([]);
    setArrowPosition({ x: path[0].x, y: path[0].y, angle: 0 });
    isAnimating.current = true;
    
    animateArrow(path);
    
    // Cleanup function
    return () => {
      isAnimating.current = false;
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [sourcePoint, destinationPoint]);

  // Grid-aligned path computation
  const computeGridPath = (start, end) => {
    const path = [];
    
    // Start point
    path.push({ x: start.x, y: start.y });
    
    // If points are on different types of lines
    if (start.lineType !== end.lineType) {
      // Find intersection point
      const intersection = {
        x: start.lineType === 'vertical' ? start.x : end.x,
        y: start.lineType === 'horizontal' ? start.y : end.y
      };
      path.push(intersection);
    }
    // If points are on parallel lines
    else {
      if (start.lineType === 'horizontal') {
        // Both on horizontal lines - use vertical line as bridge
        const midX = (start.x + end.x) / 2;
        path.push({ x: midX, y: start.y });
        path.push({ x: midX, y: end.y });
      } else {
        // Both on vertical lines - use horizontal line as bridge
        const midY = (start.y + end.y) / 2;
        path.push({ x: start.x, y: midY });
        path.push({ x: end.x, y: midY });
      }
    }
    
    // End point
    path.push({ x: end.x, y: end.y });
    
    return path;
  };

  // Animate arrow along grid path using requestAnimationFrame
  const animateArrow = (path) => {
    if (path.length < 2) {
      isAnimating.current = false;
      return;
    }

    let currentSegment = 0;
    const segments = [];
    
    // Pre-calculate all segments
    for (let i = 0; i < path.length - 1; i++) {
      segments.push({
        from: path[i],
        to: path[i + 1],
        distance: Math.sqrt(
          Math.pow(path[i + 1].x - path[i].x, 2) + 
          Math.pow(path[i + 1].y - path[i].y, 2)
        )
      });
    }

    const animateSegment = () => {
      if (currentSegment >= segments.length) {
        isAnimating.current = false;
        return;
      }

      const segment = segments[currentSegment];
      const startTime = performance.now();
      
      // Calculate segment duration based on distance
      const segmentDuration = (segment.distance / spacing) * speed;

      const animate = (currentTime) => {
        if (!isAnimating.current) return;
        
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / segmentDuration, 1);

        // Calculate current position
        const currentX = segment.from.x + (segment.to.x - segment.from.x) * progress;
        const currentY = segment.from.y + (segment.to.y - segment.from.y) * progress;

        // Calculate angle for arrow rotation
        const dx = segment.to.x - segment.from.x;
        const dy = segment.to.y - segment.from.y;
        const angle = (Math.atan2(dy, dx) * 180) / Math.PI;

        // Update arrow position
        setArrowPosition({ x: currentX, y: currentY, angle });

        // Update solid lines
        setSolidLines(prev => {
          const newLines = [];
          
          // Add all completed segments
          for (let i = 0; i < currentSegment; i++) {
            newLines.push({
              x1: segments[i].from.x,
              y1: segments[i].from.y,
              x2: segments[i].to.x,
              y2: segments[i].to.y
            });
          }
          
          // Add current segment in progress
          if (currentSegment < segments.length) {
            newLines.push({
              x1: segment.from.x,
              y1: segment.from.y,
              x2: currentX,
              y2: currentY
            });
          }
          
          return newLines;
        });

        if (progress < 1) {
          animationRef.current = requestAnimationFrame(animate);
        } else {
          // Move to next segment
          currentSegment++;
          if (currentSegment < segments.length) {
            setTimeout(() => {
              if (isAnimating.current) {
                animateSegment();
              }
            }, 50); // Small delay between segments
          } else {
            isAnimating.current = false;
          }
        }
      };

      animationRef.current = requestAnimationFrame(animate);
    };

    // Start the animation
    animateSegment();
  };

  // Reset function for clearing everything
  const resetAnimation = () => {
    isAnimating.current = false;
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    setSourcePoint(null);
    setDestinationPoint(null);
    setSolidLines([]);
    setArrowPosition(null);
  };

  return (
    <GridSVG
      width={dimensions.width}
      height={dimensions.height}
      spacing={spacing}
      onLineClick={handleLineClick}
    >
      {/* Solid black lines showing the path */}
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
        <Marker 
          x={sourcePoint.x} 
          y={sourcePoint.y} 
          type="source" 
        />
      )}
      
      {/* Destination marker */}
      {destinationPoint && (
        <Marker 
          x={destinationPoint.x} 
          y={destinationPoint.y} 
          type="destination" 
        />
      )}

      {/* Animated arrow */}
      {arrowPosition && (
        <Arrow 
          x={arrowPosition.x} 
          y={arrowPosition.y} 
          angle={arrowPosition.angle || 0}
        />
      )}
    </GridSVG>
  );
};

export default GridController;