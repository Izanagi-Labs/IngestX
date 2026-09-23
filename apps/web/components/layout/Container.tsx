import * as React from "react";

export interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "standard" | "wide" | "full";
}

export const Container = React.forwardRef<HTMLDivElement, ContainerProps>(
  ({ className = "", variant = "standard", ...props }, ref) => {
    const variants = {
      standard: "max-w-4xl", // docs/articles
      wide: "max-w-7xl",     // marketing
      full: "max-w-full",    // demo
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
