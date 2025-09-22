import React from "react";

const Marker = ({ x, y, type }) => {
  return (
    <circle
      cx={x}
      cy={y}
      r={5}
      className={`stroke-black stroke-[1] ${
        type === "source" ? "fill-blue-600" : "fill-red-600"
      }`}
    />
  );
};

export default Marker;
