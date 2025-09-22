import React, { useState, useEffect, useRef } from "react";

const PathTracer = () => {
  const svgRef = useRef(null);

  // Grid configuration
  const gridCols = 17;
  const gridRows = 13;

  // State
  const [sourcePoint, setSourcePoint] = useState(null);
  const [destinationPoint, setDestinationPoint] = useState(null);
  const [sourceMarker, setSourceMarker] = useState(null);
  const [destinationMarker, setDestinationMarker] = useState(null);
  const [arrowElement, setArrowElement] = useState(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [animationSpeed] = useState(150);

  // ---------- Helper ----------
  class GridPoint {
    constructor(x, y, lineType, lineIndex) {
      this.x = x;
      this.y = y;
      this.lineType = lineType;
      this.lineIndex = lineIndex;
    }
    equals(other) {
      return Math.abs(this.x - other.x) < 5 && Math.abs(this.y - other.y) < 5;
    }
  }

  // ---------- Grid Creation ----------
  const createGrid = () => {
    const svg = svgRef.current;
    if (!svg) return;
    svg.innerHTML = "";

    const { width, height } = svg.getBoundingClientRect();
    const cellWidth = width / (gridCols - 1);
    const cellHeight = height / (gridRows - 1);

    // Horizontal lines
    for (let row = 0; row < gridRows; row++) {
      const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
      line.setAttribute("class", "stroke-black stroke-[1] [stroke-dasharray:2,3] cursor-pointer");
      line.setAttribute("x1", 0);
      line.setAttribute("y1", row * cellHeight);
      line.setAttribute("x2", width);
      line.setAttribute("y2", row * cellHeight);
      line.dataset.type = "horizontal";
      line.dataset.index = row;
      line.addEventListener("click", handleLineClick);
      svg.appendChild(line);
    }

    // Vertical lines
    for (let col = 0; col < gridCols; col++) {
      const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
      line.setAttribute("class", "stroke-black stroke-[1] [stroke-dasharray:2,3] cursor-pointer");
      line.setAttribute("x1", col * cellWidth);
      line.setAttribute("y1", 0);
      line.setAttribute("x2", col * cellWidth);
      line.setAttribute("y2", height);
      line.dataset.type = "vertical";
      line.dataset.index = col;
      line.addEventListener("click", handleLineClick);
      svg.appendChild(line);
    }
  };

  // ---------- Marker ----------
  const createMarker = (x, y) => {
    const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    circle.setAttribute("cx", x);
    circle.setAttribute("cy", y);
    circle.setAttribute("r", 4);
    circle.setAttribute("class", "fill-black");
    return circle;
  };

  // ---------- Arrow ----------
  const createArrow = (x, y) => {
    const arrow = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
    arrow.setAttribute("class", "fill-black");
    arrow.setAttribute("points", "0,-8 12,0 0,8 -4,0");
    arrow.setAttribute("transform", `translate(${x}, ${y})`);
    return arrow;
  };

  const solidifyLineSegment = (from, to) => {
    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    line.setAttribute("class", "solid-line stroke-black stroke-[2]");
    line.setAttribute("x1", from.x);
    line.setAttribute("y1", from.y);
    line.setAttribute("x2", from.x);
    line.setAttribute("y2", from.y);
    svgRef.current.appendChild(line);

    const duration = animationSpeed;
    const startTime = performance.now();

    const animate = (time) => {
      const progress = Math.min((time - startTime) / duration, 1);
      const currentX = from.x + (to.x - from.x) * progress;
      const currentY = from.y + (to.y - from.y) * progress;
      line.setAttribute("x2", currentX);
      line.setAttribute("y2", currentY);

      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  };

  const animateArrowMovement = (from, to, angle, arrow, callback) => {
    const duration = animationSpeed;
    const startTime = performance.now();

    const animate = (time) => {
      const progress = Math.min((time - startTime) / duration, 1);
      const currentX = from.x + (to.x - from.x) * progress;
      const currentY = from.y + (to.y - from.y) * progress;
      arrow.setAttribute("transform", `translate(${currentX}, ${currentY}) rotate(${angle})`);

      if (progress < 1) requestAnimationFrame(animate);
      else callback();
    };

    requestAnimationFrame(animate);
  };

  const animateArrow = (path, index, arrow) => {
    if (index >= path.length - 1) {
      setIsAnimating(false);
      return;
    }

    const current = path[index];
    const next = path[index + 1];
    const dx = next.x - current.x;
    const dy = next.y - current.y;
    const angle = (Math.atan2(dy, dx) * 180) / Math.PI;

    solidifyLineSegment(current, next);
    animateArrowMovement(current, next, angle, arrow, () => {
      setTimeout(() => animateArrow(path, index + 1, arrow), animationSpeed / 2);
    });
  };

  // ---------- Pathfinding ----------
  const findPath = (start, end) => {
    const svg = svgRef.current;
    if (!svg) return [];
    const { width, height } = svg.getBoundingClientRect();
    const cellWidth = width / (gridCols - 1);
    const cellHeight = height / (gridRows - 1);

    const path = [];
    path.push({ x: start.x, y: start.y });

    if (start.lineType === end.lineType && start.lineIndex === end.lineIndex) {
      path.push({ x: end.x, y: end.y });
      return path;
    }

    if (start.lineType === "horizontal" && end.lineType === "vertical") {
      path.push({ x: end.x, y: start.y });
      path.push({ x: end.x, y: end.y });
    } else if (start.lineType === "vertical" && end.lineType === "horizontal") {
      path.push({ x: start.x, y: end.y });
      path.push({ x: end.x, y: end.y });
    } else if (start.lineType === "horizontal") {
      const bridgeX = Math.round(((start.x + end.x) / 2) / cellWidth) * cellWidth;
      path.push({ x: bridgeX, y: start.y });
      path.push({ x: bridgeX, y: end.y });
      path.push({ x: end.x, y: end.y });
    } else {
      const bridgeY = Math.round(((start.y + end.y) / 2) / cellHeight) * cellHeight;
      path.push({ x: start.x, y: bridgeY });
      path.push({ x: end.x, y: bridgeY });
      path.push({ x: end.x, y: end.y });
    }

    return path;
  };

  const startPathAnimation = () => {
    if (!sourcePoint || !destinationPoint) return;
    const path = findPath(sourcePoint, destinationPoint);
    if (!path) return;

    setIsAnimating(true);
    const arrow = createArrow(path[0].x, path[0].y);
    svgRef.current.appendChild(arrow);
    setArrowElement(arrow);
    animateArrow(path, 0, arrow);
  };

  // ---------- Handle Click ----------
  const handleLineClick = (event) => {
    if (isAnimating) return;

    const svg = svgRef.current;
    const { width, height } = svg.getBoundingClientRect();

    const clickX = event.clientX - svg.getBoundingClientRect().left;
    const clickY = event.clientY - svg.getBoundingClientRect().top;

    const scaledX = clickX * (width / width);
    const scaledY = clickY * (height / height);

    const lineType = event.target.dataset.type;
    const lineIndex = parseInt(event.target.dataset.index);

    let actualX, actualY;
    if (lineType === "horizontal") {
      actualX = Math.max(0, Math.min(width, scaledX));
      actualY = lineIndex * (height / (gridRows - 1));
    } else {
      actualX = lineIndex * (width / (gridCols - 1));
      actualY = Math.max(0, Math.min(height, scaledY));
    }

    const clickedPoint = new GridPoint(actualX, actualY, lineType, lineIndex);

    if (!sourcePoint) {
      setSourcePoint(clickedPoint);
      const circle = createMarker(actualX, actualY);
      setSourceMarker(circle);
      svg.appendChild(circle);
    } else if (sourcePoint.equals(clickedPoint)) {
      if (sourceMarker) sourceMarker.remove();
      setSourcePoint(null);
      setSourceMarker(null);
    } else if (!destinationPoint) {
      setDestinationPoint(clickedPoint);
      const circle = createMarker(actualX, actualY);
      setDestinationMarker(circle);
      svg.appendChild(circle);
      setTimeout(() => startPathAnimation(), 300);
    } else {
      if (destinationMarker) destinationMarker.remove();
      const circle = createMarker(actualX, actualY);
      setDestinationPoint(clickedPoint);
      setDestinationMarker(circle);
      svg.appendChild(circle);
      svg.querySelectorAll(".solid-line").forEach((l) => l.remove());
      if (arrowElement) arrowElement.remove();
      setArrowElement(null);
      setTimeout(() => startPathAnimation(), 300);
    }
  };

  // ---------- Recreate Grid on Resize ----------
  useEffect(() => {
    createGrid();
    window.addEventListener("resize", createGrid);
    return () => window.removeEventListener("resize", createGrid);
  }, []);

  return (
    <div className="w-screen h-screen flex justify-center items-center bg-white">
      <svg
        ref={svgRef}
        className="cursor-crosshair bg-white w-full h-full"
        preserveAspectRatio="none"
      />
    </div>
  );
};

export default PathTracer;
