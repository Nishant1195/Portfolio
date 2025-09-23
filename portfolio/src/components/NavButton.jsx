import React, { useEffect } from "react";

const NavButton = ({
  children,
  href = null, // For link behavior
  onClick = null, // For button behavior
  size = "medium", // "small", "medium", "large", "xl"
  variant = "default", // "default", "outline", "ghost", "solid", "floating", "minimal"
  background = "white", // "white", "black", "transparent", "glass"
  textColor = "auto", // "auto", "black", "white", "gray"
  border = true,
  borderWidth = "2", // "1", "2", "4", "8"
  borderColor = "black", // "black", "white", "gray"
  shadow = false,
  shadowType = "solid", // "solid", "drop", "inner"
  rounded = false,
  animation = "hover", // "none", "hover", "pulse", "bounce", "glitch"
  glitch = false,
  disabled = false,
  loading = false,
  icon = null, // Icon component or element
  iconPosition = "left", // "left", "right", "top", "bottom"
  fullWidth = false,
  className = "",
  style = {},
  ...props
}) => {
  // Font loading effect
  useEffect(() => {
    const link = document.createElement("link");
    link.href = "https://fonts.googleapis.com/css2?family=Jersey+15&family=Pixelify+Sans:wght@400..700&display=swap";
    link.rel = "stylesheet";
    if (!document.head.querySelector(`link[href="${link.href}"]`)) {
      document.head.appendChild(link);
    }
  }, []);

  // Size configurations
  const sizeClasses = {
    small: "px-3 py-2 text-sm min-h-[36px]",
    medium: "px-4 py-3 text-base min-h-[44px]",
    large: "px-6 py-4 text-lg min-h-[52px]",
    xl: "px-8 py-5 text-xl min-h-[60px]"
  };

  // Background configurations
  const backgroundClasses = {
    white: "bg-white",
    black: "bg-black",
    transparent: "bg-transparent",
    glass: "bg-white/90 backdrop-blur-sm"
  };

  // Text color configurations
  const getTextColor = () => {
    if (textColor !== "auto") {
      return {
        black: "text-black",
        white: "text-white",
        gray: "text-gray-600"
      }[textColor];
    }
    
    // Auto text color based on background
    switch (background) {
      case "black":
        return "text-white";
      case "transparent":
      case "glass":
      case "white":
      default:
        return "text-black";
    }
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
    solid: "shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]",
    drop: "drop-shadow-lg",
    inner: "shadow-inner"
  };

  // Animation configurations
  const animationClasses = {
    none: "",
    hover: "transition-all duration-300 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:-translate-x-1 hover:-translate-y-1 active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-1 active:translate-y-1",
    pulse: "animate-pulse hover:animate-none",
    bounce: "hover:animate-bounce",
    glitch: "animate-[buttonGlitch_2s_infinite]"
  };

  // Variant configurations
  const variantStyles = {
    default: "",
    outline: `bg-transparent ${borderClasses[borderWidth]} ${borderColorClasses[borderColor]}`,
    ghost: "bg-transparent border-0 hover:bg-black/10",
    solid: backgroundClasses[background],
    floating: `${shadow ? shadowClasses[shadowType] : "shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"} hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:-translate-x-2 hover:-translate-y-2 transition-all duration-300`,
    minimal: "bg-transparent border-0 hover:bg-gray-100"
  };

  // Icon positioning
  const getIconClasses = () => {
    const spacing = {
      small: "gap-2",
      medium: "gap-3",
      large: "gap-4",
      xl: "gap-5"
    }[size];

    const directions = {
      left: `flex-row ${spacing}`,
      right: `flex-row-reverse ${spacing}`,
      top: `flex-col ${spacing}`,
      bottom: `flex-col-reverse ${spacing}`
    };

    return `flex items-center justify-center ${directions[iconPosition]}`;
  };

  // Build classes
  const baseClasses = [
    // Font family
    "font-[Pixelify_Sans,monospace]",
    // Base button styles
    "relative inline-flex items-center justify-center",
    "font-bold uppercase tracking-wide",
    "cursor-pointer select-none",
    "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black",
    // Size
    sizeClasses[size],
    // Width
    fullWidth ? "w-full" : "",
    // Spacing and layout
    icon ? getIconClasses() : "flex items-center justify-center",
    // Appearance
    backgroundClasses[background],
    getTextColor(),
    // Border
    border && variant !== "ghost" && variant !== "minimal" ? `${borderClasses[borderWidth]} ${borderColorClasses[borderColor]}` : "",
    // Shadow
    shadow && variant !== "ghost" && variant !== "minimal" ? shadowClasses[shadowType] : "",
    // Rounded
    rounded ? "rounded-lg" : "",
    // Animation
    animationClasses[animation],
    // Variant
    variant === "floating" ? variantStyles.floating : "",
    // States
    disabled ? "opacity-50 cursor-not-allowed pointer-events-none" : "",
    loading ? "cursor-wait" : "",
    // Glitch effect
    glitch ? "relative overflow-hidden" : "",
    // Custom classes
    className
  ].filter(Boolean).join(" ");

  // Custom styles
  const customStyles = {
    ...style
  };

  // Loading spinner component
  const LoadingSpinner = () => (
    <div className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full"></div>
  );

  // Button content
  const buttonContent = (
    <>
      {/* Glitch effect overlay */}
      {glitch && (
        <>
          <div className="absolute inset-0 bg-white opacity-10 animate-[buttonGlitch_1.5s_infinite] mix-blend-difference pointer-events-none"></div>
          <div className="absolute inset-0 bg-black opacity-5 animate-[buttonGlitch_2.5s_infinite_reverse] mix-blend-overlay pointer-events-none"></div>
        </>
      )}
      
      {loading && <LoadingSpinner />}
      {!loading && icon && <span className="flex-shrink-0">{icon}</span>}
      {!loading && children && <span>{children}</span>}
    </>
  );

  // Render as link or button
  const Component = href ? "a" : "button";
  const componentProps = href 
    ? { href, ...props }
    : { onClick: disabled ? undefined : onClick, disabled, ...props };

  return (
    <>
      {/* Custom CSS for animations */}
      <style>{`
        @keyframes buttonGlitch {
          0%, 100% { transform: translate(0); }
          10% { transform: translate(-1px, 1px); }
          20% { transform: translate(-1px, -1px); }
          30% { transform: translate(1px, 1px); }
          40% { transform: translate(1px, -1px); }
          50% { transform: translate(-1px, 1px); }
          60% { transform: translate(-1px, -1px); }
          70% { transform: translate(1px, 1px); }
          80% { transform: translate(-1px, -1px); }
          90% { transform: translate(1px, 1px); }
        }
      `}</style>

      <Component
        className={baseClasses}
        style={customStyles}
        {...componentProps}
      >
        {buttonContent}
      </Component>
    </>
  );
};

// Demo component showing various button styles
const Demo = () => {
  const handleClick = (label) => {
    console.log(`${label} clicked!`);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8 space-y-8">
      <div className="space-y-4">
        <h2 className="text-2xl font-bold font-[Pixelify_Sans,monospace]">Button Sizes</h2>
        <div className="flex flex-wrap gap-4">
          <NavButton size="small" onClick={() => handleClick('Small')}>
            Small
          </NavButton>
          <NavButton size="medium" onClick={() => handleClick('Medium')}>
            Medium
          </NavButton>
          <NavButton size="large" onClick={() => handleClick('Large')}>
            Large
          </NavButton>
          <NavButton size="xl" onClick={() => handleClick('XL')}>
            Extra Large
          </NavButton>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-2xl font-bold font-[Pixelify_Sans,monospace]">Button Variants</h2>
        <div className="flex flex-wrap gap-4">
          <NavButton variant="default" onClick={() => handleClick('Default')}>
            Default
          </NavButton>
          <NavButton variant="outline" onClick={() => handleClick('Outline')}>
            Outline
          </NavButton>
          <NavButton variant="ghost" onClick={() => handleClick('Ghost')}>
            Ghost
          </NavButton>
          <NavButton variant="floating" shadow={true} onClick={() => handleClick('Floating')}>
            Floating
          </NavButton>
          <NavButton background="black" onClick={() => handleClick('Black')}>
            Black
          </NavButton>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-2xl font-bold font-[Pixelify_Sans,monospace]">Special Effects</h2>
        <div className="flex flex-wrap gap-4">
          <NavButton animation="pulse" onClick={() => handleClick('Pulse')}>
            Pulse
          </NavButton>
          <NavButton animation="bounce" onClick={() => handleClick('Bounce')}>
            Bounce
          </NavButton>
          <NavButton glitch={true} animation="glitch" onClick={() => handleClick('Glitch')}>
            Glitch
          </NavButton>
          <NavButton loading={true}>
            Loading
          </NavButton>
          <NavButton disabled={true}>
            Disabled
          </NavButton>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-2xl font-bold font-[Pixelify_Sans,monospace]">With Icons</h2>
        <div className="flex flex-wrap gap-4">
          <NavButton 
            icon={<span>→</span>} 
            iconPosition="right"
            onClick={() => handleClick('Arrow Right')}
          >
            Next
          </NavButton>
          <NavButton 
            icon={<span>←</span>} 
            iconPosition="left"
            onClick={() => handleClick('Arrow Left')}
          >
            Back
          </NavButton>
          <NavButton 
            icon={<span>★</span>} 
            iconPosition="top"
            size="large"
            onClick={() => handleClick('Star')}
          >
            Favorite
          </NavButton>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-2xl font-bold font-[Pixelify_Sans,monospace]">Full Width</h2>
        <NavButton fullWidth={true} size="large" onClick={() => handleClick('Full Width')}>
          Full Width Button
        </NavButton>
      </div>
    </div>
  );
};

export default NavButton;