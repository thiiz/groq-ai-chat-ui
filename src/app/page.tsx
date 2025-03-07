

"use client"
import { Chat } from "@/components/chat";
import { ChatSidebar } from "@/components/chat-sidebar";
import * as React from "react";

export default function Home() {
  const [model, setModel] = React.useState("");
  const [temperature, setTemperature] = React.useState(0.7);
  const [topP, setTopP] = React.useState(1);
  const [maxTokens, setMaxTokens] = React.useState(2048);
  const [systemMessage, setSystemMessage] = React.useState("");

  React.useEffect(() => {
    // Load saved system message from localStorage after component mounts
    const savedSystemMessage = localStorage.getItem('systemMessage');
    if (savedSystemMessage) {
      setSystemMessage(savedSystemMessage);
    }
  }, []);

  React.useEffect(() => {
    // Save system message to localStorage whenever it changes
    if (typeof window !== 'undefined') {
      localStorage.setItem('systemMessage', systemMessage);
    }
  }, [systemMessage]);

  // Reference to the Chat component to access its methods
  const chatRef = React.useRef<{ handleNewChat: () => void, loadChat: (id: string) => void }>(null);

  const handleNewChat = () => {
    chatRef.current?.handleNewChat();
  };

  const handleLoadChat = (chatId: string) => {
    chatRef.current?.loadChat(chatId);
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <ChatSidebar
        defaultOpen={true}
        setModel={setModel}
        model={model}
        setTemperature={setTemperature}
        temperature={temperature}
        setMaxTokens={setMaxTokens}
        maxTokens={maxTokens}
        onNewChat={handleNewChat}
        onLoadChat={handleLoadChat}
        setSystemMessage={setSystemMessage}
        systemMessage={systemMessage}
        setTopP={setTopP}
        topP={topP}
      />
      <div className="flex-1 flex flex-col">
        <Chat
          systemMessage={systemMessage}
          ref={chatRef}
          model={model}
          topP={topP}
          temperature={temperature}
          maxTokens={maxTokens}
        />
      </div>
    </div>
  );
}
