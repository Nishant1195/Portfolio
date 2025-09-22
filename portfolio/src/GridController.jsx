import React, { useState, useRef, useEffect } from "react";
import GridSVG from "./GridSVG";
import Marker from "./Marker";
import Arrow from "./Arrow";

const spacing = 81;

const GridController = () => {
  const [dimensions, setDimensions] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });
  const [sourcePoint, setSourcePoint] = useState(null);
  const [destinationPoint, setDestinationPoint] = useState(null);
  const [path, setPath] = useState([]);
  const arrowRef = useRef(null);
  const animationSpeed = useRef(150);

  useEffect(() => {
    const handleResize = () => {
      setDimensions({ width: window.innerWidth, height: window.innerHeight });
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleLineClick = (x, y, lineType, lineIndex) => {
    let actualX = x;
    let actualY = y;

    if (lineType === "horizontal") actualY = lineIndex * spacing;
    else actualX = lineIndex * spacing;

    const clickedPoint = { x: actualX, y: actualY, lineType, lineIndex };

    if (!sourcePoint) setSourcePoint(clickedPoint);
    else if (sourcePoint.x === clickedPoint.x && sourcePoint.y === clickedPoint.y)
      setSourcePoint(null);
    else if (!destinationPoint) setDestinationPoint(clickedPoint);
    else if (destinationPoint.x === clickedPoint.x && destinationPoint.y === clickedPoint.y)
      setDestinationPoint(null);
    else setDestinationPoint(clickedPoint);
  };

  // Compute Manhattan path whenever source/destination changes
  useEffect(() => {
    if (sourcePoint && destinationPoint) {
      const newPath = [{ x: sourcePoint.x, y: sourcePoint.y }];
      if (sourcePoint.x !== destinationPoint.x)
        newPath.push({ x: destinationPoint.x, y: sourcePoint.y });
      if (sourcePoint.y !== destinationPoint.y)
        newPath.push({ x: destinationPoint.x, y: destinationPoint.y });
      setPath(newPath);
    } else {
      setPath([]);
    }
  }, [sourcePoint, destinationPoint]);

  return (
    <GridSVG
      width={dimensions.width}
      height={dimensions.height}
      spacing={spacing}
      onLineClick={handleLineClick}
    >
      {sourcePoint && <Marker x={sourcePoint.x} y={sourcePoint.y} type="source" />}
      {destinationPoint && <Marker x={destinationPoint.x} y={destinationPoint.y} type="destination" />}
      {path.length > 0 && <Arrow path={path} ref={arrowRef} speed={animationSpeed.current} />}
    </GridSVG>
  );
};

export default GridController;
