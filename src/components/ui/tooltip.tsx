"use client";

import * as React from "react";
import { cn } from "../../lib/utils";

interface TooltipProps {
  children: React.ReactNode;
  text: string;
  className?: string;
  sideOffset?: number;
  side?: "top" | "bottom" | "left" | "right";
}

export function Tooltip({ children, text, className, sideOffset = 4, side = "bottom" }: TooltipProps) {
  const sideClasses = {
    top: "bottom-full mb-2 origin-bottom",
    bottom: "top-full mt-2 origin-top",
    left: "right-full mr-2 top-1/2 -translate-y-1/2 origin-right",
    right: "left-full ml-2 top-1/2 -translate-y-1/2 origin-left",
  };

  const marginStyle = {
    top: { marginBottom: sideOffset },
    bottom: { marginTop: sideOffset },
    left: { marginRight: sideOffset },
    right: { marginLeft: sideOffset },
  };

  return (
    <div className={cn("relative flex items-center justify-center group", className)}>
      {children}
      <div 
        className={cn(
          "absolute px-2 py-1 z-50",
          "hidden group-hover:flex items-center justify-center",
          "bg-popover text-popover-foreground text-[10px] font-medium rounded-md shadow-md border ring-1 ring-black/5",
          "whitespace-nowrap animate-in fade-in zoom-in-95 duration-200",
          "select-none pointer-events-none",
          sideClasses[side]
        )}
        style={marginStyle[side]}
      >
        {text}
      </div>
    </div>
  );
}
