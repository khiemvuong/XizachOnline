"use client";

import { useState, useEffect, useRef } from "react";
import { Send, MessageCircle, X } from "lucide-react";

interface ChatMessage {
  senderId: string;
  senderName: string;
  text: string;
  timestamp: number;
}

interface WeredogChatProps {
  messages: ChatMessage[];
  myUserId: string;
  onSendMessage: (text: string) => void;
}

export default function WeredogChat({
  messages,
  myUserId,
  onSendMessage,
}: WeredogChatProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [inputText, setInputText] = useState("");
  const [messageCount, setMessageCount] = useState(0);
  const [rateLimited, setRateLimited] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const rateLimitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [lastReadCount, setLastReadCount] = useState(messages.length);
  const unreadCount = isOpen ? 0 : Math.max(0, messages.length - lastReadCount);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (isOpen && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (rateLimitTimerRef.current) {
        clearTimeout(rateLimitTimerRef.current);
      }
    };
  }, []);

  const handleToggle = () => {
    if (isOpen) {
      setLastReadCount(messages.length);
      setIsOpen(false);
    } else {
      setIsOpen(true);
    }
  };

  const handleClose = () => {
    setLastReadCount(messages.length);
    setIsOpen(false);
  };

  const handleSend = () => {
    if (!inputText.trim() || rateLimited) return;
    
    onSendMessage(inputText.trim());
    setInputText("");
    
    const newCount = messageCount + 1;
    setMessageCount(newCount);

    if (newCount >= 10) {
      setRateLimited(true);
      if (rateLimitTimerRef.current) clearTimeout(rateLimitTimerRef.current);
      rateLimitTimerRef.current = setTimeout(() => {
        setMessageCount(0);
        setRateLimited(false);
      }, 10000);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end">
      {/* Chat Panel */}
      {isOpen && (
        <div
          className="mb-2 w-72 sm:w-80 rounded-lg shadow-2xl overflow-hidden animate-fade-in"
          style={{
            backgroundColor: "rgba(15, 23, 42, 0.95)",
            border: "1px solid rgba(148, 163, 184, 0.2)",
          }}
        >
          {/* Header */}
          <div
            className="px-4 py-2 flex items-center justify-between"
            style={{
              backgroundColor: "rgba(30, 41, 59, 0.8)",
              borderBottom: "1px solid rgba(148, 163, 184, 0.2)",
            }}
          >
            <div className="flex items-center gap-2">
              <MessageCircle size={16} className="text-emerald-400" />
              <span className="text-sm font-medium text-gray-200">Trò chuyện</span>
            </div>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-200 transition-colors"
            >
              <X size={16} />
            </button>
          </div>

          <div
            ref={scrollContainerRef}
            className="px-3 py-2 overflow-y-auto space-y-2"
            style={{
              height: "40vh",
              minHeight: "130px",
              maxHeight: "300px",
              scrollbarWidth: "thin",
              scrollbarColor: "rgba(148, 163, 184, 0.3) transparent",
            }}
          >
            {messages.length === 0 && (
              <div className="text-center text-gray-500 text-xs mt-8">
                Chưa có tin nhắn nào
              </div>
            )}
            {messages.map((msg, idx) => {
              const isSystemMessage = msg.senderId === "system";
              const isMyMessage = msg.senderId === myUserId;

              if (isSystemMessage) {
                return (
                  <div
                    key={idx}
                    className="text-center text-xs py-1 px-2 rounded"
                    style={{
                      backgroundColor: "rgba(59, 130, 246, 0.1)",
                      color: "rgba(147, 197, 253, 0.9)",
                    }}
                  >
                    {msg.text}
                  </div>
                );
              }

              return (
                <div
                  key={idx}
                  className={`flex flex-col ${isMyMessage ? "items-end" : "items-start"}`}
                >
                  <div
                    className="max-w-[85%] rounded-lg px-3 py-1.5"
                    style={{
                      backgroundColor: isMyMessage
                        ? "rgba(16, 185, 129, 0.2)"
                        : "rgba(71, 85, 105, 0.4)",
                      border: isMyMessage
                        ? "1px solid rgba(16, 185, 129, 0.3)"
                        : "1px solid rgba(148, 163, 184, 0.2)",
                    }}
                  >
                    <div className="text-[10px] font-medium mb-0.5" style={{ color: isMyMessage ? "#10b981" : "#94a3b8" }}>
                      {isMyMessage ? "Bạn" : msg.senderName}
                    </div>
                    <div className="text-xs text-gray-200 wrap-break-word font-sans">
                      {msg.text}
                    </div>
                    <div className="text-[9px] text-gray-500 mt-0.5">
                      {formatTime(msg.timestamp)}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div
            className="px-3 py-2"
            style={{
              backgroundColor: "rgba(30, 41, 59, 0.8)",
              borderTop: "1px solid rgba(148, 163, 184, 0.2)",
            }}
          >
            {rateLimited && (
              <div className="text-[10px] text-amber-400 mb-1 px-1">
                Bạn đã gửi quá nhiều tin nhắn. Vui lòng đợi...
              </div>
            )}
            <div className="flex gap-2">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Nhập tin nhắn..."
                maxLength={500}
                disabled={rateLimited}
                className="flex-1 px-3 py-1.5 rounded text-sm text-gray-200 placeholder-gray-500 outline-none transition-all"
                style={{
                  backgroundColor: "rgba(51, 65, 85, 0.6)",
                  border: "1px solid rgba(148, 163, 184, 0.2)",
                }}
              />
              <button
                onClick={handleSend}
                disabled={!inputText.trim() || rateLimited}
                className="px-3 py-1.5 rounded transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  backgroundColor: inputText.trim() && !rateLimited ? "rgba(16, 185, 129, 0.2)" : "rgba(71, 85, 105, 0.3)",
                  border: inputText.trim() && !rateLimited ? "1px solid rgba(16, 185, 129, 0.4)" : "1px solid rgba(148, 163, 184, 0.2)",
                  color: inputText.trim() && !rateLimited ? "#10b981" : "#64748b",
                }}
              >
                <Send size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toggle Button */}
      <button
        onClick={handleToggle}
        className="w-12 h-12 rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-110 relative animate-fade-in pointer-events-auto"
        style={{
          backgroundColor: "rgba(16, 185, 129, 0.9)",
          border: "2px solid rgba(16, 185, 129, 0.4)",
        }}
      >
        <MessageCircle size={20} className="text-white" />
        {unreadCount > 0 && !isOpen && (
          <div
            className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold"
            style={{
              backgroundColor: "#ef4444",
              color: "white",
            }}
          >
            {unreadCount > 99 ? "99+" : unreadCount}
          </div>
        )}
      </button>
    </div>
  );
}
