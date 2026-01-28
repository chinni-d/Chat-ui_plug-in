"use client";

import { useState, FormEvent, useEffect, useRef } from "react";
import { 
  Send, Sparkles, User, RefreshCcw, X, Copy, CheckCheck, Check, 
  Maximize2, Minimize2, Mic, MicOff, Square, ThumbsUp, ThumbsDown, Volume2, VolumeX, Pause,
  Plus, MessageSquare, Trash2, MoreVertical, History, ArrowLeft
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

interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;

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

  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string>("");
  const [showHistory, setShowHistory] = useState(false);

  // Initialize sessions
  useEffect(() => {
    const savedSessions = localStorage.getItem("chat-sessions");
    const savedHistory = localStorage.getItem("chat-history"); // Legacy support

    if (savedSessions) {
      try {
        const parsedSessions: ChatSession[] = JSON.parse(savedSessions);
        setSessions(parsedSessions);
        if (parsedSessions.length > 0) {
          // Load most recent or first
          const mostRecent = parsedSessions[0]; // Assuming prepended
          setMessages(mostRecent.messages);
          setCurrentSessionId(mostRecent.id);
        } else {
          startNewSession();
        }
      } catch (e) {
        console.error("Failed to parse chat sessions", e);
        startNewSession();
      }
    } else if (savedHistory) {
      // Migrate legacy history to first session
      try {
        const oldMessages: Message[] = JSON.parse(savedHistory);
        const newSessionId = Date.now().toString();
        const newSession: ChatSession = {
          id: newSessionId,
          title: oldMessages.length > 0 ? (oldMessages[0].content.slice(0, 30) + "...") : "Previous Chat",
          messages: oldMessages,
          createdAt: Date.now(),
        };
        setSessions([newSession]);
        setMessages(oldMessages);
        setCurrentSessionId(newSessionId);
        localStorage.setItem("chat-sessions", JSON.stringify([newSession]));
        localStorage.removeItem("chat-history");
      } catch (e) {
        startNewSession();
      }
    } else {
      startNewSession();
    }
    setIsInitialized(true);
  }, []);

  const startNewSession = () => {
    const newId = Date.now().toString();
    setCurrentSessionId(newId);
    setMessages([]);
    // We don't necessarily add it to sessions list until it has messages, or we can add it immediately.
    // Let's add it immediately to track state, but maybe filter empty ones later?
    // Actually, let's just set ID and empty messages. We will save to sessions array in the effect when messages change.
  };

  const handleNewChat = () => {
    // Save current if not empty (handled by effect, but let's ensure immediate UI feedback)
    if (messages.length > 0) {
        // Logic handled by the effect listening to 'messages'
    }
    startNewSession();
    setShowHistory(false);
  };

  const handleDeleteSession = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const updatedSessions = sessions.filter(s => s.id !== id);
    setSessions(updatedSessions);
    localStorage.setItem("chat-sessions", JSON.stringify(updatedSessions));
    
    if (id === currentSessionId) {
      if (updatedSessions.length > 0) {
        loadSession(updatedSessions[0]);
      } else {
        startNewSession();
      }
    }
  };

  const loadSession = (session: ChatSession) => {
    setCurrentSessionId(session.id);
    setMessages(session.messages);
    setShowHistory(false);
  };


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
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
      // Check if we've already shown the notification in this session
      const hasShownNotification = sessionStorage.getItem("chat_notification_shown");
      
      if (!isDismissed && !isChatOpen && !hasShownNotification) {
        setShowNotification(true);
        sessionStorage.setItem("chat_notification_shown", "true");
        
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
  }, [isChatOpen, isDismissed, soundSrc, isAudioMuted]);

  useEffect(() => {
    if (isChatOpen) {
      setShowNotification(false);
      setIsDismissed(true);
      // Mark as shown if the user opens the chat manually
      sessionStorage.setItem("chat_notification_shown", "true");
    }
  }, [isChatOpen]);

  const handleDismissNotification = () => {
    setShowNotification(false);
    setIsDismissed(true);
  };

  useEffect(() => {
    if (isInitialized && currentSessionId) {
      setSessions(prev => {
        const existingIndex = prev.findIndex(s => s.id === currentSessionId);
        
        let newTitle = "New Chat";
        if (messages.length > 0) {
           newTitle = messages[0].content.slice(0, 30);
           if (messages[0].content.length > 30) newTitle += "...";
        }

        const updatedSession: ChatSession = {
            id: currentSessionId,
            title: existingIndex !== -1 ? (messages.length > 0 ? newTitle : prev[existingIndex].title) : newTitle,
            messages: messages,
            createdAt: existingIndex !== -1 ? prev[existingIndex].createdAt : Date.now(),
        };

        let newSessions;
        if (existingIndex !== -1) {
            newSessions = [...prev];
            newSessions[existingIndex] = updatedSession;
        } else {
            // Only add if there are messages or it's the active one we are building
            if (messages.length > 0) {
                newSessions = [updatedSession, ...prev];
            } else {
                return prev;
            }
        }
        
        localStorage.setItem("chat-sessions", JSON.stringify(newSessions));
        return newSessions;
      });
    }
  }, [messages, isInitialized, currentSessionId]);

  const handleReset = () => {
    setIsResetDialogOpen(true);
  };

  const confirmReset = () => {
    setMessages([]);
    // Update the session in storage to be empty
    setSessions(prev => {
        const updated = prev.map(s => s.id === currentSessionId ? { ...s, messages: [] } : s);
        localStorage.setItem("chat-sessions", JSON.stringify(updated));
        return updated;
    });
    setIsResetDialogOpen(false);
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
                className="absolute top-3 right-3 h-8 w-8 text-muted-foreground hover:text-foreground z-10"
                onClick={handleDismissNotification}
              >
                <X className="h-5 w-5" />
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
        className="border-none"
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
        {mobileMenuOpen && (
          <>
            <div 
              className="absolute inset-0 z-[9998]" 
              onClick={() => setMobileMenuOpen(false)}
            />
            <div className="absolute top-[70px] right-4 w-48 rounded-lg bg-popover text-popover-foreground shadow-xl border border-border/50 z-[9999] p-1 flex flex-col animate-in fade-in zoom-in-95 duration-200">
               <button
                  className="w-full text-left px-3 py-3 text-sm hover:bg-muted text-foreground transition-colors flex items-center gap-3 rounded-md"
                  onClick={() => {
                    setShowHistory(!showHistory);
                    setMobileMenuOpen(false);
                  }}
               >
                 <div className="w-4 h-4 flex items-center justify-center shrink-0">
                   {showHistory ? (
                     <ArrowLeft className="h-4 w-4" />
                   ) : (
                     <History className="h-4 w-4" />
                   )}
                 </div>
                 <span className="font-medium whitespace-nowrap">
                   {showHistory ? "Back to Chat" : "Start New Chat"}
                 </span>
               </button>

               <button
                  className="w-full text-left px-3 py-3 text-sm hover:bg-muted text-foreground transition-colors flex items-center gap-3 rounded-md"
                  onClick={() => {
                    if (!isAudioMuted) {
                      window.speechSynthesis.cancel();
                      setSpeakingMessageId(null);
                    }
                    setIsAudioMuted(!isAudioMuted);
                    setMobileMenuOpen(false);
                  }}
               >
                  <div className="w-4 h-4 flex items-center justify-center shrink-0">
                    {isAudioMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                  </div>
                  <span className="font-medium whitespace-nowrap">
                    {isAudioMuted ? "Unmute" : "Mute"}
                  </span>
               </button>

               <button
                  className="w-full text-left px-3 py-3 text-sm hover:bg-muted text-foreground transition-colors flex items-center gap-3 rounded-md"
                  onClick={() => {
                    handleReset();
                    setMobileMenuOpen(false);
                  }}
               >
                  <div className="w-4 h-4 flex items-center justify-center shrink-0">
                    <RefreshCcw className="h-4 w-4" />
                  </div>
                  <span className="font-medium whitespace-nowrap">Reset Chat</span>
               </button>
            </div>
          </>
        )}
        <ExpandableChatHeader 
          className="flex-col justify-center relative !border-b-0 !p-0 pb-6 min-h-[110px] !bg-transparent"
          style={{ borderBottom: "none" }}
        >
          <div 
             className="absolute inset-0"
             style={{ background: "linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)" }}
          />
            
          <div className="relative z-10 flex flex-col p-5 pb-8 w-full">
            <div className="flex items-center justify-between w-full mb-1">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full overflow-hidden shrink-0 ring-2 ring-white/30 shadow-sm">
                  <img src={logoSrc} alt="Bot" className="h-full w-full object-cover bg-white" />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-white flex items-center gap-1.5 drop-shadow-sm">
                    {title}
                    <Sparkles className="h-4 w-4 text-yellow-300 fill-yellow-300 animate-pulse" />
                  </h1>
                  <p className="text-xs text-blue-100/90 flex items-center gap-1.5 font-medium">
                    <span className="flex h-2 w-2 rounded-full bg-green-400 shadow-[0_0_4px_rgba(74,222,128,0.6)] animate-pulse"></span>
                    Online and ready to help
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-0.5 mr-9 sm:mr-1">
                {/* Desktop Actions */}
                <div className="hidden sm:flex items-center gap-0.5">
                  <Tooltip text={showHistory ? "Back to Chat" : "Start New Chat"} side="top">
                    <Button
                      variant="ghost"
                      size="icon"
                      className={cn(
                        "h-8 w-8 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-colors",
                         showHistory && "bg-white/20 text-white"
                      )}
                      onClick={() => setShowHistory(!showHistory)}
                    >
                      <Plus className={cn("h-4 w-4 transition-transform duration-200", showHistory && "rotate-45")} />
                    </Button>
                  </Tooltip>
                   <Tooltip text={isAudioMuted ? "Unmute" : "Mute"} side="top">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-colors"
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
                   <Tooltip text={isMaximized ? "Minimize" : "Maximize"} side="top">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-colors"
                      onClick={() => setIsMaximized(!isMaximized)}
                    >
                      {isMaximized ? (
                        <Minimize2 className="h-4 w-4" />
                      ) : (
                        <Maximize2 className="h-4 w-4" />
                      )}
                    </Button>
                  </Tooltip>
                  <Tooltip text="Reset Chat" side="top">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-colors group"
                      onClick={handleReset}
                    >
                      <RefreshCcw className="h-4 w-4 group-hover:animate-[spin_1s_linear_1]" />
                    </Button>
                  </Tooltip>
                </div>

                {/* Mobile Menu Trigger */}
                <div className="flex sm:hidden relative">
                   <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-colors"
                      onClick={() => setMobileMenuOpen(true)}
                    >
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Wave SVG */}
          <div className="absolute -bottom-[1px] left-0 w-full leading-[0] z-20">
            <svg
              className="w-full h-8 sm:h-12 text-background fill-current"
              viewBox="0 0 1440 320"
              preserveAspectRatio="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M0,96L48,112C96,128,192,160,288,160C384,160,480,128,576,112C672,96,768,96,864,112C960,128,1056,160,1152,160C1248,160,1344,128,1392,112L1440,96L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
              ></path>
            </svg>
          </div>
        </ExpandableChatHeader>

        <ExpandableChatBody className="bg-background">
          {showHistory ? (
             <div className="flex flex-col w-full h-full overflow-y-auto p-4 gap-2 animate-in fade-in duration-300">
               <div className="flex items-center justify-between mb-2 px-1">
                 <h3 className="text-sm font-semibold text-muted-foreground">Previous Chats</h3>
                 <span className="text-xs text-muted-foreground/60">{sessions.length} saved</span>
               </div>
               
               {sessions.length === 0 ? (
                 <div className="text-center py-10 text-muted-foreground text-sm flex flex-col items-center gap-2">
                   <MessageSquare className="h-8 w-8 opacity-20" />
                   <p>No chat history yet.</p>
                 </div>
               ) : (
                 sessions.map((session) => (
                   <div 
                     key={session.id}
                     className={cn(
                       "flex items-center justify-between p-3 rounded-lg border transition-all duration-200 cursor-pointer group",
                       currentSessionId === session.id
                         ? "bg-muted border-primary/20 shadow-sm"
                         : "bg-card hover:bg-accent/50 border-transparent hover:border-border/50"
                     )}
                     onClick={() => loadSession(session)}
                   >
                      <div className="flex flex-col gap-1 overflow-hidden">
                        <span className={cn(
                          "text-sm font-medium truncate pr-2",
                          currentSessionId === session.id ? "text-foreground" : "text-muted-foreground group-hover:text-foreground"
                        )}>
                          {session.title || "New Chat"}
                        </span>
                        <span className="text-[10px] text-muted-foreground/60">
                           {new Date(session.createdAt).toLocaleDateString()} • {new Date(session.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </span>
                      </div>
                      <Button
                        variant="ghost" 
                        size="icon"
                        className="h-7 w-7 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all"
                        onClick={(e) => handleDeleteSession(e, session.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                   </div>
                 ))
               )}
               
               <Button 
                 className="mt-4 w-full" 
                 variant="outline" 
                 onClick={handleNewChat}
               >
                 <Plus className="h-4 w-4 mr-2" /> Start New Chat
               </Button>
             </div>
          ) : messages.length === 0 ? (
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
                      className={cn("gap-3", isMaximized && "gap-4")}
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
        
        {isResetDialogOpen && (
          <div className="absolute inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-lg p-6 animate-in fade-in duration-200">
            <div className="bg-background border rounded-xl shadow-xl p-6 w-full max-w-sm flex flex-col gap-4 relative animate-in zoom-in-95 duration-200">
              <div className="flex flex-col gap-1">
                <h3 className="text-lg font-semibold text-foreground">Reset Chat?</h3>
                <p className="text-sm text-muted-foreground">
                  This will clear your current conversation history. Are you sure you want to proceed?
                </p>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <Button 
                  variant="outline" 
                  onClick={() => setIsResetDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  variant="destructive" 
                  onClick={confirmReset}
                >
                  Reset
                </Button>
              </div>
            </div>
          </div>
        )}
      </ExpandableChat>
    </>
    </div>
  );
}
