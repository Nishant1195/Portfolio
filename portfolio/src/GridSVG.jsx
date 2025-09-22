import React from "react";

const GridSVG = ({ width, height, spacing, onLineClick, children }) => {
  const cols = Math.ceil(width / spacing);
  const rows = Math.ceil(height / spacing);

  const handleClick = (e, lineType, index) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    onLineClick(x, y, lineType, index);
  };

  const verticalLines = Array.from({ length: cols + 1 }, (_, i) => (
    <line
      key={`v-${i}`}
      x1={i * spacing}
      y1={0}
      x2={i * spacing}
      y2={height}
      className="stroke-black stroke-[1] [stroke-dasharray:2,3] cursor-pointer"
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
      className="stroke-black stroke-[1] [stroke-dasharray:2,3] cursor-pointer"
      onClick={(e) => handleClick(e, "horizontal", i)}
    />
  ));

  return (
    <svg
      width={width}
      height={height}
      className="absolute top-0 left-0 w-full h-full"
    >
      {verticalLines}
      {horizontalLines}
      {children}
    </svg>
  );
};

export default GridSVG;
