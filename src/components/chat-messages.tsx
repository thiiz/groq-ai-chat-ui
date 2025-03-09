"use client";

import { Message } from "@/@types/message";
import { formatDistanceToNow } from "date-fns";
import { Bot, User } from "lucide-react";
import * as React from "react";
import { MessageContent } from "./message-content";

interface ChatMessagesProps {
  messages: Message[];
  isGenerating: boolean;
}

export const ChatMessages: React.FC<ChatMessagesProps> = ({ messages, isGenerating }) => {
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="flex-1 overflow-y-auto p-2 sm:p-4 space-y-4 sm:space-y-6 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-background to-background/95">
      {messages.length === 0 && (
        <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground p-4">
          <Bot className="h-8 w-8 sm:h-12 sm:w-12 mb-2 sm:mb-4 opacity-20" />
          <p className="text-base sm:text-lg font-medium">No messages yet</p>
          <p className="text-xs sm:text-sm">Start a conversation by typing a message below</p>
        </div>
      )}
      {messages.map((message) => {
        const messageDate = message.timestamp ? new Date(message.timestamp) : new Date();
        const timeAgo = formatDistanceToNow(messageDate, { addSuffix: true });

        return (
          <div
            key={message.id}
            className={`message ${message.role === "user" ? "user" : "assistant"} mb-8 animate-in fade-in-50 duration-300`}
          >
            <div className={`flex items-start ${message.role === "user" ? "flex-row-reverse" : ""} gap-4`}>
              <div className="flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center bg-muted shadow-sm border border-border/40">
                {message.role === "user" ? (
                  <User className="h-5 w-5 text-foreground" />
                ) : (
                  <Bot className="h-5 w-5 text-primary" />
                )}
              </div>
              <div className={`flex-1 space-y-2 ${message.role === "user" ? "text-right" : ""}`}>
                <MessageContent
                  content={message.content}
                  isThinking={isGenerating && message.id === messages[messages.length - 1]?.id}
                  model={message.model}
                  isUserMessage={message.role === "user"}
                />
                <div className="text-xs text-muted-foreground">
                  {timeAgo}
                </div>
              </div>
            </div>
          </div>
        );
      })}
      <div ref={messagesEndRef} />
    </div>
  );
};