import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, X, Send, User, Bot, Loader2 } from "lucide-react";
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
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={toggleChat}
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-orange-500 text-white shadow-2xl shadow-orange-500/30 ring-4 ring-white transition-all hover:bg-orange-600 focus:outline-none"
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
            >
              <X className="h-6 w-6" />
            </motion.div>
          ) : (
            <motion.div
              key="chat"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
            >
              <MessageCircle className="h-6 w-6" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.9, transformOrigin: "bottom right" }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.9 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed bottom-24 right-6 z-[60] flex h-[500px] w-screen max-w-[380px] flex-col overflow-hidden rounded-[2.5rem] border border-white/20 bg-white shadow-2xl sm:right-6 sm:w-[380px]"
          >
            {/* Header */}
            <div className="flex items-center justify-between bg-orange-500 p-6 text-white shadow-lg">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 backdrop-blur-md">
                    <Bot className="h-6 w-6" />
                  </div>
                  <div className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-orange-500 bg-emerald-500" />
                </div>
                <div>
                  <h3 className="font-heading text-lg font-black tracking-tight">Support Bot</h3>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-orange-200">Online now</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleChat}
                className="rounded-full text-white hover:bg-white/10"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Chat Body */}
            <ScrollArea className="flex-1 p-6 bg-slate-50/30">
              <div className="flex flex-col gap-4">
                {messages.map((msg) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, scale: 0.8, x: msg.sender === "user" ? 20 : -20 }}
                    animate={{ opacity: 1, scale: 1, x: 0 }}
                    className={cn(
                      "flex max-w-[80%] flex-col gap-1 rounded-3xl px-4 py-3 shadow-sm",
                      msg.sender === "user"
                        ? "ml-auto bg-orange-500 text-white rounded-tr-none"
                        : "mr-auto bg-white text-slate-800 rounded-tl-none border border-slate-100"
                    )}
                  >
                    <p className="text-sm font-medium leading-relaxed">{msg.text}</p>
                    <span className={cn(
                      "text-[8px] font-bold uppercase tracking-wider",
                      msg.sender === "user" ? "text-orange-200" : "text-slate-400"
                    )}>
                      {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </motion.div>
                ))}
                
                {isTyping && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8, x: -20 }}
                    animate={{ opacity: 1, scale: 1, x: 0 }}
                    className="mr-auto flex items-center gap-2 rounded-3xl bg-white border border-slate-100 px-4 py-3 shadow-sm text-slate-400"
                  >
                    <Loader2 className="h-4 w-4 animate-spin text-orange-500" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Bot is typing...</span>
                  </motion.div>
                )}
                <div ref={scrollRef} />
              </div>
            </ScrollArea>

            {/* Footer */}
            <form
              onSubmit={handleSendMessage}
              className="mt-auto border-t border-slate-100 bg-white p-4"
            >
              <div className="flex gap-2 overflow-hidden rounded-2xl bg-slate-50 border border-slate-200 p-1 focus-within:ring-2 focus-within:ring-orange-500/20 transition-all">
                <Input
                  placeholder="Type your message..."
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  className="border-none bg-transparent shadow-none focus-visible:ring-0 text-sm font-medium placeholder:text-slate-400"
                />
                <Button
                  type="submit"
                  size="icon"
                  disabled={!inputValue.trim()}
                  className="h-10 w-10 rounded-xl bg-orange-500 text-white shadow-lg shadow-orange-500/20 transition-all hover:bg-orange-600 active:scale-95 disabled:opacity-50"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
