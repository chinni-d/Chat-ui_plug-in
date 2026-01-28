"use client";

import React, { useRef, useState } from "react";
import { X, MessageCircle } from "lucide-react";
import { cn } from "../../lib/utils";
import { Button } from "./button";

export type ChatPosition = "bottom-right" | "bottom-left";
export type ChatSize = "sm" | "md" | "lg" | "xl" | "full";

const chatConfig = {
  dimensions: {
    sm: "sm:max-w-sm sm:max-h-[500px]",
    md: "sm:max-w-md sm:max-h-[600px]",
    lg: "sm:max-w-lg sm:max-h-[700px]",
    xl: "sm:max-w-xl sm:max-h-[800px]",
    full: "sm:w-full sm:h-full",
  },
  positions: {
    "bottom-right": "bottom-5 right-5",
    "bottom-left": "bottom-5 left-5",
  },
  chatPositions: {
    "bottom-right": "sm:right-5 sm:bottom-24",
    "bottom-left": "sm:left-5 sm:bottom-24",
  },
  states: {
    open: "pointer-events-auto opacity-100 visible scale-100 translate-y-0",
    closed:
      "pointer-events-none opacity-0 invisible scale-100 sm:translate-y-5",
  },
};

const sizeConfig = {
  sm: { width: "min(90vw, 24rem)", height: "min(80vh, 500px)" },
  md: { width: "min(90vw, 28rem)", height: "min(80vh, 600px)" },
  lg: { width: "min(90vw, 32rem)", height: "min(80vh, 700px)" },
  xl: { width: "min(90vw, 36rem)", height: "min(80vh, 800px)" },
  full: { width: "100%", height: "100%" },
};

interface ExpandableChatProps extends React.HTMLAttributes<HTMLDivElement> {
  position?: ChatPosition;
  size?: ChatSize;
  icon?: React.ReactNode;
  isOpen?: boolean;
  onOpenChange?: (isOpen: boolean) => void;
  isMaximized?: boolean;
}

const ExpandableChat: React.FC<ExpandableChatProps> = ({
  className,
  position = "bottom-right",
  size = "md",
  icon,
  children,
  isOpen: controlledIsOpen,
  onOpenChange,
  isMaximized,
  ...props
}) => {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const isControlled = controlledIsOpen !== undefined;
  const isOpen = isControlled ? controlledIsOpen : internalIsOpen;
  const chatRef = useRef<HTMLDivElement>(null);

  const toggleChat = () => {
    const newState = !isOpen;
    if (isControlled && onOpenChange) {
      onOpenChange(newState);
    } else {
      setInternalIsOpen(newState);
    }
  };

  return (
    <div
      className={cn(`fixed ${chatConfig.positions[position]} z-[9999]`, className)}
      {...props}
    >
      <div
        ref={chatRef}
        style={{
          "--chat-width": isMaximized ? "60vw" : sizeConfig[size].width,
          "--chat-height": isMaximized ? "90vh" : sizeConfig[size].height,
          "--chat-offset": isMaximized ? "20vw" : "1.25rem",
          "--chat-bottom": isMaximized ? "5vh" : "6rem",
          transition: `width 0.4s ease-in-out, height 0.4s ease-in-out, ${position === "bottom-right" ? "right" : "left"} 0.4s ease-in-out, bottom 0.4s ease-in-out`,
        } as React.CSSProperties}
        className={cn(
          "flex flex-col bg-background sm:rounded-lg shadow-2xl border border-border overflow-hidden fixed inset-0 w-full h-full sm:inset-auto sm:left-auto sm:top-auto",
          chatConfig.chatPositions[position], 
          isOpen ? chatConfig.states.open : chatConfig.states.closed,
          "sm:w-[var(--chat-width)] sm:h-[var(--chat-height)] sm:bottom-[var(--chat-bottom)]",
          position === "bottom-right" ? "sm:right-[var(--chat-offset)]" : "sm:left-[var(--chat-offset)]",
          "sm:!max-w-none sm:!max-h-none", // Always apply this to prevent any other max-w interference
          className,
        )}
      >
        {children}
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-2 right-2 sm:hidden z-50 text-white hover:bg-white/10"
          onClick={toggleChat}
        >
          <X className="h-6 w-6" />
        </Button>
      </div>
      <ExpandableChatToggle
        icon={icon}
        isOpen={isOpen}
        toggleChat={toggleChat}
      />
    </div>
  );
};

ExpandableChat.displayName = "ExpandableChat";

const ExpandableChatHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className,
  ...props
}) => (
  <div
    className={cn("flex items-center justify-between p-4 border-b", className)}
    {...props}
  />
);

ExpandableChatHeader.displayName = "ExpandableChatHeader";

const ExpandableChatBody: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className,
  ...props
}) => <div className={cn("flex-grow overflow-hidden", className)} {...props} />;

ExpandableChatBody.displayName = "ExpandableChatBody";

const ExpandableChatFooter: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className,
  ...props
}) => <div className={cn("border-t p-4", className)} {...props} />;

ExpandableChatFooter.displayName = "ExpandableChatFooter";

interface ExpandableChatToggleProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon?: React.ReactNode;
  isOpen: boolean;
  toggleChat: () => void;
}

const ExpandableChatToggle: React.FC<ExpandableChatToggleProps> = ({
  className,
  icon,
  isOpen,
  toggleChat,
  ...props
}) => (
  <Button
    variant="default"
    onClick={toggleChat}
    className={cn(
      "w-14 h-14 rounded-full shadow-md flex items-center justify-center p-0 bg-blue-500 hover:bg-blue-600 text-white border-0 hover:shadow-[0_0_0_4px_#bfdbfe]",
      !isOpen ? "!bg-transparent" : "",
      className,
    )}
    {...props}
  >
    {isOpen ? (
      <X className="size-7 stroke-[2.5]" />
    ) : (
      icon || <MessageCircle className="size-7 stroke-[2.5]" />
    )}
  </Button>
);

ExpandableChatToggle.displayName = "ExpandableChatToggle";

export {
  ExpandableChat,
  ExpandableChatHeader,
  ExpandableChatBody,
  ExpandableChatFooter,
};
