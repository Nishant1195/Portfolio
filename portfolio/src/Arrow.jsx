import React from "react";

const Arrow = ({ x, y, angle = 0 }) => {
  return (
    <polygon
      points="0,-8 12,0 0,8 -4,0"
      transform={`translate(${x}, ${y}) rotate(${angle})`}
      className="fill-black stroke-black stroke-[1]"
    />
  );
};

export default Arrow;
