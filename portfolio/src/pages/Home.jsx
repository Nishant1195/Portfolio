import React, { useRef, useState, useMemo, useEffect } from "react";
import PageContainer from "../components/PageContainer";
import NavButton from "../components/NavButton";
import GridController from "../components/GridController";

export default function Home() {
  const sourceRef = useRef(null);
  const [anchors, setAnchors] = useState(null);
  const [dimensions, setDimensions] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1200,
    height: typeof window !== 'undefined' ? window.innerHeight : 800
  });

  const navButtons = [
    { label: "Projects", onClick: () => console.log("Projects clicked") },
    { label: "Skills", onClick: () => console.log("Skills clicked") },
    { label: "Contact", onClick: () => console.log("Contact clicked") },
    { label: "Resume", onClick: () => console.log("Resume clicked") },
    { label: "About", onClick: () => console.log("About clicked") },
  ];

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Calculate target positions based on 80px grid spacing
  const customTargets = useMemo(() => {
    const gridSpacing = 80;
    const centerX = dimensions.width / 2;
    const centerY = dimensions.height / 2;
    
    const containerWidth = 480;
    const containerHeight = 240;

    const targets = [
      {
        // Projects - Left side, one grid ABOVE
        x: centerX - (containerWidth / 2) - (gridSpacing * 3),
        y: centerY - (gridSpacing * 2),
        label: "Projects",
        buttonIndex: 0
      },
      {
        // Skills - Right side, one grid ABOVE
        x: centerX + (containerWidth / 2) + (gridSpacing * 3),
        y: centerY - (gridSpacing * 2),
        label: "Skills",
        buttonIndex: 1
      },
      {
        // Contact - Left side, one grid BELOW
        x: centerX - (containerWidth / 2) - (gridSpacing * 3),
        y: centerY + (gridSpacing * 2),
        label: "Contact",
        buttonIndex: 2
      },
      {
        // Resume - Right side, one grid BELOW
        x: centerX + (containerWidth / 2) + (gridSpacing * 3),
        y: centerY + (gridSpacing * 2),
        label: "Resume",
        buttonIndex: 3
      },
      {
        // About - Top center (unchanged)
        x: centerX,
        y: centerY - (containerHeight / 2) - (gridSpacing * 2),
        label: "About",
        buttonIndex: 4
      }
    ];

    return targets;
  }, [dimensions.width, dimensions.height]);

  // Define custom path strategies for the home page
  const homePagePathStrategies = useMemo(() => [
    // 0 - Projects (left, top) - Come from left side horizontally, then up only 1 grid
    (s, d, spacing) => [
      { x: s.x, y: s.y },                           // Start at center
      { x: d.x, y: s.y },                           // Go horizontally left to target column at center level
      { x: d.x, y: s.y - spacing },                 // Go up only 1 grid block
    ],

    // 1 - Skills (right, top) - Come from right side horizontally, then up only 1 grid  
    (s, d, spacing) => [
      { x: s.x, y: s.y },                           // Start at center
      { x: d.x, y: s.y },                           // Go horizontally right to target column at center level
      { x: d.x, y: s.y - spacing },                 // Go up only 1 grid block
    ],

    // 2 - Contact (left, bottom) - Use left side routing downward
    (s, d, spacing) => [
      { x: s.x, y: s.y },                           // Start at center
      { x: s.x - spacing, y: s.y },                 // Go left one grid block
      { x: s.x - spacing, y: s.y + spacing },       // Go down one grid block (unique left path)
      { x: d.x, y: s.y + spacing },                 // Go horizontally to target column at lower level
      { x: d.x, y: d.y }                            // Go to final target position
    ],

    // 3 - Resume (right, bottom) - Use right side routing downward
    (s, d, spacing) => [
      { x: s.x, y: s.y },                           // Start at center
      { x: s.x + spacing, y: s.y },                 // Go right one grid block  
      { x: s.x + spacing, y: s.y + spacing },       // Go down one grid block (unique right path)
      { x: d.x, y: s.y + spacing },                 // Go horizontally to target column at lower level
      { x: d.x, y: d.y }                            // Go to final target position
    ],

    // 4 - About (vertical above) - Stop in middle of grid cell before button
    (s, d, spacing) => [
      { x: s.x, y: s.y },
      { x: s.x, y: d.y + spacing/2}                // Stop halfway between grid intersections
    ]
  ], []);

  // Define path configuration for custom behaviors
  const homePagePathConfig = useMemo(() => ({
    customSnapping: {
      4: { skipFinalYSnap: true } // Don't snap the Y coordinate for the About button path
    }
  }), []);

  return (
    <div className="relative w-full h-screen bg-gray-100 overflow-hidden">
      {/* Grid Controller for animations */}
      <GridController
        sourceRef={sourceRef}
        spacing={80}
        stepPx={8}
        stagger={400}
        loop={false}
        persistTrails={true}
        targets={customTargets}
        pathStrategies={homePagePathStrategies}
        pathConfig={homePagePathConfig}
        onAnchorsComputed={setAnchors}
        showAnchors={false}
      />

      {/* Central Welcome Container */}
      <div
        ref={sourceRef}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20"
      >
        <PageContainer
          size="custom"
          variant="floating"
          padding="xl"
          rounded={true}
          shadow={true}
          shadowType="solid"
          border={true}
          borderWidth="4"
          borderColor="black"
          background="white"
          customWidth="480px"
          customHeight="240px"
          animation="fade"
        >
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-4 jersey-font text-black">
              Welcome
            </h1>
            <p className="text-gray-600 text-lg pixelify-font">
              Choose where to go
            </p>
          </div>
        </PageContainer>
      </div>

      {/* Navigation Buttons positioned at target locations */}
      {anchors?.targets?.map((target) => {
        const button = navButtons[target.buttonIndex];
        if (!button) return null;

        return (
          <div
            key={`nav-${target.label}`}
            className="absolute z-30"
            style={{
              left: target.x,
              top: target.y,
              transform: 'translate(-50%, -50%)'
            }}
          >
            <NavButton
              onClick={button.onClick}
              variant="floating"
              size="medium"
              shadow={true}
              shadowType="solid"
              border={true}
              borderWidth="2"
              borderColor="black"
              background="white"
              textColor="black"
              animation="hover"
              className="font-bold uppercase tracking-wide min-w-[100px] pixelify-font"
            >
              {button.label}
            </NavButton>
          </div>
        );
      })}
    </div>
  );
}