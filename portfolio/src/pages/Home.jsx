// src/pages/Home.jsx
import React, { useRef } from "react";
import PageContainer from "../components/PageContainer"; // adjust path if needed
import NavButton from "../components/NavButton";         // adjust path if needed
import GridController from "../components/GridController"; // adjust path if needed

export default function Home() {
  // wrapper refs for measurement
  const sourceRef = useRef(null);
  const buttonWrappersRef = useRef([]); // we'll populate with DOM nodes

  const navButtons = [
    { label: "Projects", onClick: () => console.log("Projects") },
    { label: "Skills", onClick: () => console.log("Skills") },
    { label: "Contact", onClick: () => console.log("Contact") },
    { label: "Blog", onClick: () => console.log("Blog") },
    { label: "About", onClick: () => console.log("About") },
  ];

  // positions (example radial-ish positions around center)
  const positions = [
    { top: "12%", left: "50%", transform: "translate(-50%, 0)" },   // top
    { top: "50%", left: "88%", transform: "translate(-50%, -50%)" }, // right
    { top: "88%", left: "50%", transform: "translate(-50%, -100%)" },// bottom
    { top: "50%", left: "12%", transform: "translate(-50%, -50%)" }, // left
    { top: "22%", left: "22%", transform: "translate(-50%, -50%)" }, // top-left
  ];

  return (
    <div className="relative w-full h-screen bg-gray-50">
      {/* GridController in background: pass sourceRef and the array of DOM nodes */}
      <GridController
  sourceRef={sourceRef}
  targetRefs={buttonWrappersRef.current}
  spacing={81}
  stagger={350}
  loop={false}         // run once
  persistTrails={true} // keep final trails static
  stepPx={6}
  debug={true}
/>


      {/* Center container (wrap with ref so GridController can measure) */}
      <div
        ref={sourceRef}
        style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", zIndex: 30 }}
      >
        <PageContainer size="medium" variant="floating" padding="xl" rounded>
          <h1 className="text-4xl font-bold mb-2">Welcome</h1>
          <p className="text-sm text-gray-600">Explore my site</p>
        </PageContainer>
      </div>

      {/* Render nav buttons and attach refs to wrappers */}
      {navButtons.map((btn, i) => {
        const pos = positions[i] || { top: "50%", left: "50%", transform: "translate(-50%,-50%)" };
        return (
          <div
            key={`${btn.label}-${i}`}
            ref={(el) => (buttonWrappersRef.current[i] = el)}
            style={{ position: "absolute", top: pos.top, left: pos.left, transform: pos.transform, zIndex: 40 }}
          >
            <NavButton onClick={btn.onClick} variant="floating" shadow>
              {btn.label}
            </NavButton>
          </div>
        );
      })}
    </div>
  );
}
