import React from "react";
import GridController from "./components/GridController";
import PageContainer from "./components/PageContainer";
import NavButton from "./components/NavButton";
import { ArrowRight } from "lucide-react";

function App() {
  return (
    <div className="relative w-screen h-screen bg-white overflow-hidden">
      {/* GridController as background */}
      <div className="absolute inset-0 z-0">
        <GridController />
      </div>
      
      {/* Content layer */}
      <div className="relative z-10 w-full h-full flex items-center justify-center p-8">
        <PageContainer
          size="medium"
          variant="floating"
          background="white"
          shadow={true}
          shadowType="solid"
          animation="fade"
          rounded={true}
          className="backdrop-blur-md"
        >
          <div className="text-center space-y-6">
            <h1 className="text-4xl font-bold jersey-font text-black">
              GRID BACKGROUND
            </h1>
            <p className="text-lg font-mono text-gray-800">
              This PageContainer is floating over the GridController background
            </p>
            <div className="grid grid-cols-2 gap-4 mt-8 text-sm font-mono">
              <div className="p-4 bg-black/10 rounded">
                <h3 className="font-bold mb-2">FEATURES</h3>
                <ul className="space-y-1 text-xs">
                  <li>• Grid background</li>
                  <li>• Glass effect</li>
                  <li>• Floating container</li>
                  <li>• Backdrop blur</li>
                </ul>
              </div>
              <div className="p-4 bg-black/10 rounded">
                <h3 className="font-bold mb-2">STYLING</h3>
                <ul className="space-y-1 text-xs">
                  <li>• Z-index layering</li>
                  <li>• Semi-transparent</li>
                  <li>• Solid shadow</li>
                  <li>• Fade animation</li>
                </ul>
              </div>
            </div>
            <button className="px-6 py-3 bg-black text-white font-mono text-sm border-2 border-black hover:bg-white hover:text-black transition-all duration-300 transform hover:scale-105">
              INTERACT WITH GRID
            </button>
          </div>
        </PageContainer>
        

      </div>
    </div>
  );
}

export default App;