import React, { useEffect } from "react";

const PageContainer = ({
  children,
  size = "medium", // "small", "medium", "large", "fullscreen", "custom"
  variant = "default", // "default", "minimal", "bordered", "shadow", "floating"
  position = "center", // "center", "top", "bottom", "left", "right", "top-left", etc.
  padding = "default", // "none", "small", "default", "large", "xl"
  margin = "default", // "none", "small", "default", "large", "auto"
  background = "white", // "white", "black", "transparent", "glass"
  border = true,
  borderWidth = "4", // "1", "2", "4", "8"
  borderColor = "black", // "black", "white", "gray"
  shadow = false,
  shadowType = "solid", // "solid", "drop", "inner"
  rounded = false,
  animation = "none", // "none", "fade", "slide", "scale", "glitch"
  glitch = false,
  customWidth = null, // Custom width in any CSS unit
  customHeight = null, // Custom height in any CSS unit
  className = "",
  style = {},
  ...props
}) => {
  // Font loading effect
  useEffect(() => {
    // Load Google Fonts
    const link = document.createElement("link");
    link.href = "https://fonts.googleapis.com/css2?family=Jersey+15&family=Pixelify+Sans:wght@400..700&display=swap";
    link.rel = "stylesheet";
    document.head.appendChild(link);

    return () => {
      if (document.head.contains(link)) {
        document.head.removeChild(link);
      }
    };
  }, []);

  // Size configurations
  const sizeClasses = {
    small: "w-80 h-auto max-w-sm",
    medium: "w-full max-w-2xl h-auto",
    large: "w-full max-w-6xl h-auto min-h-[80vh]",
    fullscreen: "w-screen h-screen max-w-none",
    custom: ""
  };

  // Position configurations
  const positionClasses = {
    center: "mx-auto my-auto",
    top: "mx-auto mt-8",
    bottom: "mx-auto mb-8 mt-auto",
    left: "ml-8 my-auto",
    right: "mr-8 my-auto",
    "top-left": "ml-8 mt-8",
    "top-right": "mr-8 mt-8",
    "bottom-left": "ml-8 mb-8 mt-auto",
    "bottom-right": "mr-8 mb-8 mt-auto"
  };

  // Padding configurations
  const paddingClasses = {
    none: "p-0",
    small: "p-4",
    default: "p-8",
    large: "p-12",
    xl: "p-16"
  };

  // Margin configurations
  const marginClasses = {
    none: "m-0",
    small: "m-2",
    default: "m-4",
    large: "m-8",
    auto: "m-auto"
  };

  // Background configurations
  const backgroundClasses = {
    white: "bg-white",
    black: "bg-black text-white",
    transparent: "bg-transparent",
    glass: "bg-white/90 backdrop-blur-sm"
  };

  // Border configurations
  const borderClasses = {
    "1": "border",
    "2": "border-2",
    "4": "border-4",
    "8": "border-8"
  };

  const borderColorClasses = {
    black: "border-black",
    white: "border-white",
    gray: "border-gray-400"
  };

  // Shadow configurations
  const shadowClasses = {
    solid: "shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]",
    drop: "drop-shadow-xl",
    inner: "shadow-inner"
  };

  // Animation configurations
  const animationClasses = {
    none: "",
    fade: "animate-[fadeIn_0.8s_ease-out]",
    slide: "animate-[slideUp_0.6s_ease-out]",
    scale: "animate-[scaleIn_0.5s_ease-out]",
    glitch: "animate-[glitch_2s_infinite]"
  };

  // Variant configurations
  const variantStyles = {
    default: "",
    minimal: "border-0 shadow-none",
    bordered: `${border ? borderClasses[borderWidth] : ""} ${borderColorClasses[borderColor]}`,
    shadow: shadow ? shadowClasses[shadowType] : "",
    floating: `${shadow ? shadowClasses[shadowType] : ""} hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] hover:-translate-x-1 hover:-translate-y-1 transition-all duration-300`
  };

  // Build classes
  const baseClasses = [
    // Font family
    "font-[Pixelify_Sans,monospace]",
    // Size
    size === "custom" ? "" : sizeClasses[size],
    // Position
    positionClasses[position],
    // Spacing
    paddingClasses[padding],
    marginClasses[margin],
    // Appearance
    backgroundClasses[background],
    // Border
    border && variant !== "minimal" ? `${borderClasses[borderWidth]} ${borderColorClasses[borderColor]}` : "",
    // Shadow
    shadow && variant !== "minimal" ? shadowClasses[shadowType] : "",
    // Rounded
    rounded ? "rounded-lg" : "",
    // Animation
    animationClasses[animation],
    // Variant
    variant === "floating" ? variantStyles.floating : "",
    // Glitch effect
    glitch ? "relative overflow-hidden" : "",
    // Custom classes
    className
  ].filter(Boolean).join(" ");

  // Custom styles
  const customStyles = {
    ...(customWidth && { width: customWidth }),
    ...(customHeight && { height: customHeight }),
    ...style
  };

  return (
    <>
      {/* Custom CSS for animations */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes slideUp {
          from { 
            opacity: 0; 
            transform: translateY(30px); 
          }
          to { 
            opacity: 1; 
            transform: translateY(0); 
          }
        }
        
        @keyframes scaleIn {
          from { 
            opacity: 0; 
            transform: scale(0.9); 
          }
          to { 
            opacity: 1; 
            transform: scale(1); 
          }
        }
        
        @keyframes glitch {
          0%, 100% { transform: translate(0); }
          10% { transform: translate(-2px, 2px); }
          20% { transform: translate(-2px, -2px); }
          30% { transform: translate(2px, 2px); }
          40% { transform: translate(2px, -2px); }
          50% { transform: translate(-2px, 2px); }
          60% { transform: translate(-2px, -2px); }
          70% { transform: translate(2px, 2px); }
          80% { transform: translate(-2px, -2px); }
          90% { transform: translate(2px, 2px); }
        }
        
        .pixelify-font {
          font-family: 'Pixelify Sans', monospace;
        }
        
        .jersey-font {
          font-family: 'Jersey 15', monospace;
        }
      `}</style>

      <div 
        className={baseClasses}
        style={customStyles}
        {...props}
      >
        {/* Glitch effect overlay */}
        {glitch && (
          <>
            <div className="absolute inset-0 bg-white opacity-10 animate-[glitch_1.5s_infinite] mix-blend-difference pointer-events-none"></div>
            <div className="absolute inset-0 bg-black opacity-5 animate-[glitch_2.5s_infinite_reverse] mix-blend-overlay pointer-events-none"></div>
          </>
        )}
        
        {children}
      </div>
    </>
  );
};

// Example usage (remove this in production)
const Demo = () => (
  <PageContainer
    size="medium"
    variant="floating"
    animation="fade"
    shadow={true}
  >
    <h1 className="text-3xl font-bold mb-4 jersey-font">Demo Container</h1>
    <p className="font-mono">This is a reusable PageContainer component with customizable styling.</p>
  </PageContainer>
);

export default PageContainer;