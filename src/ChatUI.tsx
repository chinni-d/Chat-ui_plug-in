"use client";

import { useState, FormEvent, useEffect, useRef } from "react";
import { 
  Send, Sparkles, User, RefreshCcw, X, Copy, CheckCheck, Check, 
  Maximize2, Minimize2, Mic, MicOff, Square, ThumbsUp, ThumbsDown, Volume2, VolumeX, Pause 
} from "lucide-react";
import { Button } from "./components/ui/button";
import {
  ChatBubble,
  ChatBubbleAvatar,
  ChatBubbleMessage,
} from "./components/ui/chat-bubble";
import { ChatInput } from "./components/ui/chat-input";
import { Tooltip } from "./components/ui/tooltip";
import {
  ExpandableChat,
  ExpandableChatHeader,
  ExpandableChatBody,
  ExpandableChatFooter,
} from "./components/ui/expandable-chat";
import { ChatMessageList } from "./components/ui/chat-message-list";

import { ShiningText } from "./components/ui/shining-text";
import { Button as MovingBorderButton } from "./components/ui/moving-border";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "./lib/utils";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt?: string;
  feedback?: "up" | "down";
  isStreaming?: boolean;
}

import { DEFAULT_LOGO, DEFAULT_SOUND } from "./assets";

export interface ChatUIProps {
  endpoint: string;
  logoSrc?: string;
  soundSrc?: string;
  title?: string;
  welcomeMessage?: string;
  description?: string;
  footerText?: React.ReactNode;
  inputPlaceholder?: string;
  theme?: "light" | "dark" | "auto";
  position?: "right" | "left";
}

export function ChatUI({
  endpoint,
  logoSrc = DEFAULT_LOGO,
  soundSrc = DEFAULT_SOUND,
  title = "AI Assistant",
  welcomeMessage = "Welcome to AI Assistant! 👋",
  description = "I'm here to help you navigate our services. Feel free to ask me anything!",
  footerText = (
    <>
      Developed by <a href="https://www.dmanikanta.me" target="_blank" rel="noopener noreferrer" className="hover:underline hover:text-primary transition-colors">Manikanta Darapureddy</a> 💛
    </>
  ),
  inputPlaceholder = "Message",
  theme = "light",
  position = "right",
}: ChatUIProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  
  // Theme management
  const [activeTheme, setActiveTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    if (theme === "auto") {
      const checkParentTheme = () => {
        const isDark = document.documentElement.classList.contains("dark");
        setActiveTheme(isDark ? "dark" : "light");
      };

      checkParentTheme();

      const observer = new MutationObserver(checkParentTheme);
      observer.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ["class"],
      });

      return () => observer.disconnect();
    } else {
      setActiveTheme(theme);
    }
  }, [theme]);

  useEffect(() => {
    const savedMessages = localStorage.getItem("chat-history");
    if (savedMessages) {
      try {
        setMessages(JSON.parse(savedMessages));
      } catch (e) {
        console.error("Failed to parse chat history", e);
      }
    }
    setIsInitialized(true);
  }, []);

  // -- Feature: Abort Controller for Stop Generation --
  const abortControllerRef = useRef<AbortController | null>(null);

  // -- Feature: Voice Input --
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if ("SpeechRecognition" in window || "webkitSpeechRecognition" in window) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput((prev) => prev ? `${prev} ${transcript}` : transcript);
        setIsListening(false);
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error("Speech recognition error", event.error);
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }
  }, []);

  const toggleVoiceInput = () => {
    if (!recognitionRef.current) {
      alert("Speech recognition is not supported in this browser.");
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  const handleStop = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsLoading(false);
    }
  };

  // -- Feature: Feedback UI --
  const handleFeedback = (messageId: string, type: "up" | "down") => {
    setMessages((prev) => 
      prev.map((msg) => {
        if (msg.id === messageId) {
          // Toggle: if clicking the same feedback type, remove it (deselect)
          // Otherwise set to the new type
          const newFeedback = msg.feedback === type ? undefined : type;
          return { ...msg, feedback: newFeedback };
        }
        return msg;
      })
    );
    // Ideally send this to backend
    console.log(`Feedback ${type} for message ${messageId}`);
  };

  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  
  // -- Feature: Text-to-Speech (TTS) --
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);

  const speakMessage = (text: string, messageId: string) => {
    if (!window.speechSynthesis) return;

    // Stop any current speech
    window.speechSynthesis.cancel();
    setSpeakingMessageId(null);

    // If we are toggling off the same message
    if (speakingMessageId === messageId) {
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    // Optional: Select a specific voice if needed
    // const voices = window.speechSynthesis.getVoices();
    // utterance.voice = voices[0]; 

    utterance.onend = () => {
      setSpeakingMessageId(null);
    };
    utterance.onerror = () => {
      setSpeakingMessageId(null);
    };

    setSpeakingMessageId(messageId);
    window.speechSynthesis.speak(utterance);
  };

  // Stop speaking when chat closes or component unmounts
  useEffect(() => {
    return () => {
      window.speechSynthesis?.cancel();
    };
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!isDismissed && !isChatOpen) {
        setShowNotification(true);
        if (!isAudioMuted) {
          const audio = new Audio(soundSrc);
          audio.play().catch((error) => {
            if (error.name !== "NotAllowedError") {
              console.error("Error playing notification sound:", error);
            }
          });
        }
      }
    }, 2000);
    return () => clearTimeout(timer);
  }, [isChatOpen, isDismissed, soundSrc]);

  useEffect(() => {
    if (isChatOpen) {
      setShowNotification(false);
      setIsDismissed(true);
    }
  }, [isChatOpen]);

  const handleDismissNotification = () => {
    setShowNotification(false);
    setIsDismissed(true);
  };

  useEffect(() => {
    if (isInitialized) {
      localStorage.setItem("chat-history", JSON.stringify(messages));
    }
  }, [messages, isInitialized]);

  const handleReset = () => {
    setMessages([]);
    localStorage.removeItem("chat-history");
  };

  // Core logic to send message to API
  const sendMessage = async (userText: string, currentHistory: Message[]) => {
    if (!endpoint) return;

    setIsLoading(true);
    
    // Create new AbortController
    abortControllerRef.current = new AbortController();
    let currentBotMessageId: string | null = null;

    try {
      const historyForApi = currentHistory.map((msg) => ({
        role: msg.role,
        content: msg.content,
      }));

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: userText,
          history: historyForApi,
          stream: true,
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.body) {
        throw new Error("ReadableStream not supported.");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let aiResponse = "";
      let isFirstChunk = true;

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        aiResponse += chunk;

        if (isFirstChunk) {
          isFirstChunk = false;
          setIsLoading(false); // Hide "Thinking..." bubble
          // Add initial bot message
          const botMessageId = (Date.now() + 1).toString();
          const botMessage: Message = {
            id: botMessageId,
            role: "assistant",
            content: aiResponse,
            createdAt: new Date().toISOString(),
            isStreaming: true,
          };
          currentBotMessageId = botMessageId;
          setMessages((prev) => [...prev, botMessage]);
        } else {
          // Update existing bot message
          setMessages((prev) => {
            const updated = [...prev];
            const lastMsgIndex = updated.length - 1;
            if (
              lastMsgIndex >= 0 &&
              updated[lastMsgIndex].role === "assistant"
            ) {
              updated[lastMsgIndex] = {
                ...updated[lastMsgIndex],
                content: aiResponse,
              };
            }
            return updated;
          });
        }
      }

      // Mark streaming as finished for the bot message
      if (currentBotMessageId) {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === currentBotMessageId ? { ...msg, isStreaming: false } : msg
          )
        );
      }

      // Play notification sound
      if (!isAudioMuted) {
        const audio = new Audio(soundSrc);
        audio
          .play()
          .catch((e) => console.error("Error playing notification sound:", e));
      }
    } catch (error: any) {
      // Ensure we turn off streaming if we hit an error
      if (currentBotMessageId) {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === currentBotMessageId ? { ...msg, isStreaming: false } : msg
          )
        );
      } else if (abortControllerRef.current) {
        // If we haven't created a message yet (error before first chunk)
        // Nothing to update regarding isStreaming
      }

      if (error.name === "AbortError") {
        console.log("Generation stopped by user");
        // Optional: Add a small indicator that it was stopped?
      } else {
        console.error("Chat error:", error);
        setMessages((prev) => [
          ...prev,
          {
            id: (Date.now() + 2).toString(),
            role: "assistant",
            content:
              "I apologize, but I encountered an error. Please try again later.",
            createdAt: new Date().toISOString(),
          },
        ]);
      }
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userQuestion = input.trim();
    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: userQuestion,
      createdAt: new Date().toISOString(),
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");

    if (!endpoint) {
       const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content:
          "Contact admin for api endpoint or check you have added correct endpoint or not contact developer at darapureddymanikanta8@gmail.com",
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMessage]);
      return;
    }

    await sendMessage(userQuestion, messages); 
  };



  return (
    <div id="chat-ui-scope" className={cn("font-sans", activeTheme === "dark" && "dark")}>
    <>
      {showNotification && !isChatOpen && (
        <div className={cn(
          "fixed bottom-24 z-[9998] animate-in fade-in slide-in-from-bottom-5 duration-300",
          position === "right" ? "right-5" : "left-5"
        )}>
          {/* Wrapper to position tail relative to the button */}
          <div className="relative">
            <MovingBorderButton
              as="div"
              borderRadius="0.75rem"
              duration={3000}
              containerClassName="w-72 sm:w-80 h-auto overflow-hidden rounded-xl bg-transparent"
              borderClassName="bg-[radial-gradient(#0ea5e9_40%,transparent_60%)]"
              className="bg-background bg-[radial-gradient(hsl(var(--chat-border))_1px,transparent_1px)] [background-size:16px_16px] border p-5 items-start justify-start flex-col w-full h-full text-foreground shadow-lg"
            >
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-3 right-3 h-6 w-6 text-muted-foreground hover:text-foreground z-10"
                onClick={handleDismissNotification}
              >
                <X className="h-4 w-4" />
                <span className="sr-only">Close</span>
              </Button>

              <div className="flex items-start gap-3 mb-4 w-full">
                <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full ring-2 ring-background">
                  <img
                    src={logoSrc}
                    alt="AI"
                    className="object-cover h-full w-full"
                  />
                </div>
                <div className="flex flex-col pt-0.5">
                  <h3 className="font-bold text-sm leading-tight text-foreground">
                    {title}
                  </h3>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                    </span>
                    <span className="text-xs text-muted-foreground font-medium">
                      Online
                    </span>
                  </div>
                </div>
              </div>

              <div className="w-full text-left">
                <p className="text-sm font-medium text-foreground leading-snug">
                  {welcomeMessage}
                </p>
                <p className="text-sm text-muted-foreground leading-relaxed mt-2">
                  {description}
                </p>
                <Button
                  className="w-full mt-4 h-10 rounded-lg bg-[#535bf2] hover:bg-[#464ec9] text-white shadow-sm transition-all duration-200 font-medium"
                  onClick={() => setIsChatOpen(true)}
                >
                  Start chatting
                </Button>
              </div>
            </MovingBorderButton>

            <div className={cn(
              "absolute -bottom-2 w-4 h-4 bg-background border-b border-r transform rotate-45 z-0",
              position === "right" ? "right-6" : "left-6"
            )}></div>
          </div>
        </div>
      )}

      <ExpandableChat
        size="lg"
        position={position === "right" ? "bottom-right" : "bottom-left"}
        isOpen={isChatOpen}
        onOpenChange={setIsChatOpen}
        isMaximized={isMaximized}
        icon={
          <div className="relative h-full w-full overflow-hidden rounded-full">
            <img
              src={logoSrc}
              alt="AI"
              className="object-cover h-full w-full"
            />
          </div>
        }
      >
        <ExpandableChatHeader className="bg-muted/40 flex-col text-center justify-center border-b p-4 relative">
          <h1 className="text-xl font-semibold flex items-center justify-center gap-2">
            <div className="h-8 w-8 rounded-full overflow-hidden shrink-0 border border-border/50">
              <img src={logoSrc} alt="Bot" className="h-full w-full object-cover" />
            </div>
            {title}
            <Sparkles className="h-4 w-4 text-yellow-500 fill-yellow-500" />
          </h1>
          <p className="text-sm text-muted-foreground flex items-center justify-center gap-1.5 pt-1">
            <span className="flex h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
            Online and ready to help
          </p>
          <div className="absolute top-3 left-3 flex items-center gap-1 sm:top-5 sm:right-5 sm:left-auto">
            <Tooltip text={isAudioMuted ? "Unmute Audio" : "Mute Audio"}>
              <Button
                variant="ghost"
                size="icon"
                className="hidden sm:flex h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted/50"
                onClick={() => {
                  if (!isAudioMuted) {
                    window.speechSynthesis.cancel();
                    setSpeakingMessageId(null);
                  }
                  setIsAudioMuted(!isAudioMuted);
                }}
              >
                {isAudioMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
              </Button>
            </Tooltip>
             <Tooltip text={isMaximized ? "Minimize" : "Maximize"}>
              <Button
                variant="ghost"
                size="icon"
                className="hidden sm:flex h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted/50"
                onClick={() => setIsMaximized(!isMaximized)}
              >
                {isMaximized ? (
                  <Minimize2 className="h-4 w-4" />
                ) : (
                  <Maximize2 className="h-4 w-4" />
                )}
              </Button>
            </Tooltip>
            <Tooltip text="Reset Chat">
              <Button
                variant="ghost"
                size="icon"
                className="group h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted/50"
                onClick={handleReset}
              >
                <RefreshCcw className="h-4 w-4 group-hover:animate-[spin_1s_linear_1]" />
              </Button>
            </Tooltip>
          </div>
        </ExpandableChatHeader>

        <ExpandableChatBody className="bg-background/50 bg-[radial-gradient(hsl(var(--chat-border))_1px,transparent_1px)] [background-size:16px_16px]">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full p-6 text-center animate-in fade-in duration-500">
              <div className="bg-background rounded-full p-4 mb-6 shadow-md ring-1 ring-border/50">
                <div className="relative w-16 h-16 overflow-hidden rounded-full">
                  <img
                    src={logoSrc}
                    alt="AI Logo"
                    className="object-cover w-full h-full"
                  />
                </div>
              </div>
              <h2 className="text-2xl font-bold mb-2 tracking-tight">
                {title}
              </h2>
              <p className="text-muted-foreground text-sm">
                Welcome to {title} 💛
              </p>
            </div>
          ) : (
            <ChatMessageList>
              {messages.map((message) => {


                return (
                  <div key={message.id} className="w-full flex flex-col group">

                    <ChatBubble
                      variant={message.role === "user" ? "sent" : "received"}
                      className={cn(isMaximized && "gap-4")}
                    >
                      <ChatBubbleAvatar
                        className="h-8 w-8 shrink-0"
                        src={message.role === "user" ? undefined : logoSrc}
                        fallback={
                          message.role === "user" ? (
                            <User className="h-4 w-4" />
                          ) : (
                            "AI"
                          )
                        }
                      />
                      <div className={cn("flex flex-col gap-1 max-w-[85%]", message.role === "user" ? "items-end" : "items-start")}>
                        <ChatBubbleMessage
                          variant={message.role === "user" ? "sent" : "received"}
                          className={cn(
                            "max-w-full",
                            message.role === "user"
                              ? cn(
                                  "!px-3 !py-2 rounded-2xl border border-border/10 shadow-sm !text-[hsl(var(--chat-foreground))]",
                                  activeTheme === "dark" ? "!bg-white/10" : "!bg-black/5"
                                )
                              : "!bg-transparent !text-[hsl(var(--chat-foreground))] !px-0 !py-0"
                          )}
                        >
                          {message.role === "user" ? (
                            message.content
                          ) : (
                            <div
                              className={cn(
                                "prose text-sm break-words leading-normal max-w-none",
                                "prose-p:m-0 prose-ul:m-0 prose-ol:m-0 prose-li:m-0",
                              )}
                            >
                              <ReactMarkdown
                                remarkPlugins={[remarkGfm]}
                                components={{
                                  ul: ({ node, ...props }: any) => (
                                    <ul className="list-disc pl-4 my-1" {...props} />
                                  ),
                                  ol: ({ node, ...props }: any) => (
                                    <ol
                                      className="list-decimal pl-4 my-1"
                                      {...props}
                                    />
                                  ),
                                  li: ({ node, ...props }: any) => (
                                    <li className="my-0.5 pl-1" {...props} />
                                  ),
                                  p: ({ node, ...props }: any) => (
                                    <p className="mb-2 last:mb-0" {...props} />
                                  ),
                                  strong: ({ node, ...props }: any) => (
                                    <span
                                      className="font-bold text-foreground"
                                      {...props}
                                    />
                                  ),
                                  a: ({ node, href, children, ...props }: any) => (
                                    <a
                                      href={href}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="font-semibold text-primary hover:text-primary/80 hover:underline transition-colors break-all"
                                      {...props}
                                    >
                                      {children}
                                    </a>
                                  ),
                                }}
                              >
                                {message.content}
                              </ReactMarkdown>
                            </div>
                          )}
                        </ChatBubbleMessage>
                        <div
                          className={cn(
                            "items-center gap-1.5 px-1 select-none flex flex-row",
                            message.isStreaming ? "hidden" : "flex"
                          )}
                        >
                          <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                            {message.createdAt
                              ? new Date(message.createdAt).toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })
                              : new Date().toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                          </span>
                          {message.role === "user" ? (
                            <CheckCheck className="h-3 w-3 text-muted-foreground" />
                          ) : (
                            <div className="flex items-center gap-1.5 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-200">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-5 w-5 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors rounded-md"
                                onClick={() => {
                                  navigator.clipboard.writeText(message.content);
                                  setCopiedMessageId(message.id);
                                  setTimeout(() => setCopiedMessageId(null), 2000);
                                }}
                              >
                                {copiedMessageId === message.id ? (
                                  <Check className="h-3 w-3 text-green-500" />
                                ) : (
                                  <Copy className="h-3 w-3" />
                                )}
                                <span className="sr-only">Copy</span>
                              </Button>

                              <div className="flex items-center gap-1 border-l border-border/40 pl-1.5 ml-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className={cn(
                                    "h-6 w-6 hover:bg-muted transition-colors rounded-md",
                                    speakingMessageId === message.id 
                                      ? "text-primary bg-muted" 
                                      : "text-muted-foreground hover:text-foreground"
                                  )}
                                  onClick={() => speakMessage(message.content, message.id)}
                                >
                                  {speakingMessageId === message.id ? (
                                    <Pause className="h-3 w-3 fill-current" />
                                  ) : (
                                    <Volume2 className="h-3 w-3" />
                                  )}
                                  <span className="sr-only">{speakingMessageId === message.id ? "Stop" : "Listen"}</span>
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className={cn(
                                    "h-6 w-6 hover:bg-muted transition-colors rounded-md",
                                    message.feedback === "up" 
                                      ? "text-foreground" 
                                      : "text-muted-foreground hover:text-foreground"
                                  )}
                                  onClick={() => handleFeedback(message.id, "up")}
                                >
                                  <ThumbsUp className={cn("h-3 w-3", message.feedback === "up" && "fill-current")} />
                                  <span className="sr-only">Helpful</span>
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className={cn(
                                    "h-6 w-6 hover:bg-muted transition-colors rounded-md",
                                    message.feedback === "down" 
                                      ? "text-foreground" 
                                      : "text-muted-foreground hover:text-foreground"
                                  )}
                                  onClick={() => handleFeedback(message.id, "down")}
                                >
                                  <ThumbsDown className={cn("h-3 w-3", message.feedback === "down" && "fill-current")} />
                                  <span className="sr-only">Not helpful</span>
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </ChatBubble>
                  </div>
                );
              })}

              {isLoading && (
                <ChatBubble variant="received">
                  <ChatBubbleAvatar
                    className="h-8 w-8 shrink-0"
                    src={logoSrc}
                    fallback="AI"
                  />
                  <ChatBubbleMessage className="bg-transparent p-0 flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-foreground/50" />
                    <ShiningText text="AI Assistant thinking..." />
                  </ChatBubbleMessage>
                </ChatBubble>
              )}
            </ChatMessageList>
          )}
        </ExpandableChatBody>

        <ExpandableChatFooter className="bg-muted/40 p-3">
          <form
            onSubmit={handleSubmit}
            className="relative rounded-3xl border bg-background focus-within:ring-1 focus-within:ring-ring p-1 shadow-sm"
          >
            <ChatInput
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={inputPlaceholder}
              rows={1}
              className="min-h-0 h-auto max-h-32 resize-none rounded-2xl bg-background border-0 px-3 py-2.5 shadow-none focus-visible:ring-0 text-base sm:text-sm"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e as unknown as FormEvent);
                }
              }}
            />
            <div className="flex items-center justify-between px-2 pb-1">
              <div className="flex items-center gap-2">
                 <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className={cn("h-6 w-6 rounded-full text-muted-foreground hover:text-primary transition-colors", isListening && "text-red-500 animate-pulse bg-red-500/10")}
                    onClick={toggleVoiceInput}
                  
                  >
                   {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                </Button>
              </div>
              <div className="flex items-center gap-2">
                {isLoading ? (
                  <Button
                    type="button"
                    size="icon"
                    className="h-8 w-8 rounded-full bg-red-500 hover:bg-red-600 transition-all duration-200"
                    onClick={handleStop}
                  >
                    <Square className="h-3 w-3 fill-current" />
                    <span className="sr-only">Stop Generation</span>
                  </Button>
                ) : (
                   <Button
                    type="submit"
                    size="icon"
                    className="h-8 w-8 rounded-full transition-all duration-200"
                    disabled={!input.trim()}
                  >
                    <Send className="h-4 w-4" />
                    <span className="sr-only">Send</span>
                  </Button>
                )}
               </div>
            </div>
          </form>
          <div className="mt-2 text-center flex flex-col items-center justify-center gap-0.5">
            <span className="text-[10px] text-muted-foreground/60">
              {footerText}
            </span>
          </div>
        </ExpandableChatFooter>
      </ExpandableChat>
    </>
    </div>
  );
}
