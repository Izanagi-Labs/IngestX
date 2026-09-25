import * as React from "react";

export interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "content" | "standard" | "wide" | "full";
}

export const Container = React.forwardRef<HTMLDivElement, ContainerProps>(
  ({ className = "", variant = "standard", ...props }, ref) => {
    const variants = {
      content: "max-w-3xl",  // ~768px for readable articles
      standard: "max-w-6xl", // ~1152px for general content
      wide: "max-w-7xl",     // ~1280px for landing pages
      full: "max-w-full",    // unrestricted
    };

    return (
      <div
        ref={ref}
        className={`mx-auto w-full px-4 sm:px-6 lg:px-8 ${variants[variant]} ${className}`}
        {...props}
      />
    );
  }
);
Container.displayName = "Container";
