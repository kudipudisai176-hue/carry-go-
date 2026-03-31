import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send, Bot, Loader2, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  text: string;
  sender: "user" | "bot";
  timestamp: Date;
}

export default function ChatSupport() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      text: "Hello 👋 How can I help you today?",
      sender: "bot",
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const toggleChat = () => setIsOpen(!isOpen);

  useEffect(() => {
    const handleOpenChat = () => setIsOpen(true);
    window.addEventListener("open-chat-support", handleOpenChat);
    return () => window.removeEventListener("open-chat-support", handleOpenChat);
  }, []);

  const handleSendMessage = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputValue.trim()) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      text: inputValue,
      sender: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputValue("");

    // Simulate bot reply
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        text: "Got it! Our team will get back to you soon. 👍",
        sender: "bot",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, botMsg]);
    }, 1500);
  };

  useEffect(() => {
    const chatContent = document.querySelector('[data-radix-scroll-area-viewport]');
    if (chatContent) {
      chatContent.scrollTop = chatContent.scrollHeight;
    }
  }, [messages, isTyping]);

  return (
    <>
      {/* Floating Toggle Button */}
      <motion.button
        whileHover={{ scale: 1.1, rotate: 5 }}
        whileTap={{ scale: 0.9 }}
        onClick={toggleChat}
        className="fixed bottom-6 right-6 z-50 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-[#FF6B00] to-[#FF8C00] text-white shadow-[0_8px_32px_rgba(255,107,0,0.4)] ring-4 ring-white transition-all focus:outline-none"
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
            >
              <X className="h-7 w-7" />
            </motion.div>
          ) : (
            <motion.div
              key="chat"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
            >
              <MessageCircle className="h-7 w-7" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.8, transformOrigin: "bottom right" }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.8 }}
            transition={{ type: "spring", damping: 20, stiffness: 250 }}
            className="fixed bottom-28 right-6 z-[60] flex h-[580px] w-screen max-w-[360px] flex-col overflow-hidden rounded-[2.5rem] border border-white/20 bg-white shadow-[0_20px_60px_rgba(0,0,0,0.18)] sm:right-6 sm:w-[360px]"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-[#FF6B00] to-[#FF8C00] p-6 text-white shadow-md relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl" />
              
              <div className="flex items-center justify-between relative z-10">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-md shadow-inner">
                      <span className="text-2xl">🤖</span>
                    </div>
                    <div className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-white bg-emerald-500 animate-pulse" />
                  </div>
                  <div>
                    <h3 className="font-heading text-lg font-bold tracking-tight leading-none mb-1 text-white">Support Bot</h3>
                    <div className="flex items-center gap-1.5 pt-0.5">
                      <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                      <p className="text-[10px] font-black uppercase tracking-widest text-[#FFC7A1]">Online now</p>
                    </div>
                  </div>
                </div>
                <button
                  onClick={toggleChat}
                  className="h-8 w-8 rounded-full flex items-center justify-center transition-colors hover:bg-white/10"
                >
                  <X className="h-5 w-5 opacity-80" />
                </button>
              </div>
            </div>

            {/* Chat Body */}
            <ScrollArea className="flex-1 p-5 bg-[#fafafa]">
              <div className="flex flex-col gap-5">
                {messages.map((msg) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={cn(
                      "flex max-w-[85%] flex-col gap-1",
                      msg.sender === "user" ? "ml-auto items-end" : "mr-auto items-start"
                    )}
                  >
                    <div className={cn(
                      "rounded-2xl px-4 py-3 shadow-sm text-sm font-medium leading-relaxed transition-all",
                      msg.sender === "user"
                        ? "bg-gradient-to-br from-[#FF6B00] to-[#FF8C00] text-white rounded-br-none"
                        : "bg-white text-slate-800 rounded-bl-none border border-slate-100"
                    )}>
                      {msg.text}
                    </div>
                    <span className={cn(
                      "text-[9px] font-bold uppercase tracking-wider px-1",
                      msg.sender === "user" ? "text-slate-400" : "text-slate-400"
                    )}>
                      {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </motion.div>
                ))}
                
                {isTyping && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8, x: -10 }}
                    animate={{ opacity: 1, scale: 1, x: 0 }}
                    className="mr-auto flex items-center gap-1.5 rounded-2xl bg-white border border-slate-100 px-4 py-3 shadow-sm"
                  >
                    <div className="flex gap-1">
                      <div className="w-1.5 h-1.5 bg-[#FF6B00] rounded-full animate-bounce [animation-delay:0ms]" />
                      <div className="w-1.5 h-1.5 bg-[#FF6B00] rounded-full animate-bounce [animation-delay:150ms]" />
                      <div className="w-1.5 h-1.5 bg-[#FF6B00] rounded-full animate-bounce [animation-delay:300ms]" />
                    </div>
                  </motion.div>
                )}
                <div ref={scrollRef} />
              </div>
            </ScrollArea>

            {/* Footer */}
            <form
              onSubmit={handleSendMessage}
              className="mt-auto border-t border-slate-100 bg-white p-5"
            >
              <div className="flex items-center gap-3">
                <div className="flex-1 overflow-hidden rounded-2xl bg-[#f8f9fb] border border-slate-200 px-4 py-1 transition-all focus-within:border-[#FF6B00] focus-within:ring-2 focus-within:ring-[#FF6B00]/10 focus-within:bg-white">
                  <Input
                    placeholder="Type your message..."
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    className="border-none bg-transparent shadow-none focus-visible:ring-0 text-sm font-semibold placeholder:text-slate-400 h-10 px-0"
                  />
                </div>
                <Button
                  type="submit"
                  size="icon"
                  disabled={!inputValue.trim()}
                  className="h-11 w-11 rounded-full bg-gradient-to-br from-[#FF6B00] to-[#FF8C00] text-white shadow-lg shadow-[#FF6B00]/20 transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
                >
                  <Send className="h-5 w-5 rotate-[-10deg]" />
                </Button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
