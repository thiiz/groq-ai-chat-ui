

"use client"
import { Chat } from "@/components/chat";
import { ChatSidebar } from "@/components/chat-sidebar";
import * as React from "react";

export default function Home() {
  const [model, setModel] = React.useState("");
  const [temperature, setTemperature] = React.useState(0.7);
  const [maxTokens, setMaxTokens] = React.useState(2048);
  const [systemMessage, setSystemMessage] = React.useState("");

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
        onTemperatureChange={setTemperature}
        onMaxTokensChange={setMaxTokens}
        onNewChat={handleNewChat}
        onLoadChat={handleLoadChat}
        onSystemMessageChange={setSystemMessage}
      />
      <div className="flex-1 flex flex-col">
        <Chat
          systemMessage={systemMessage}
          ref={chatRef}
          model={model}
          temperature={temperature}
          maxTokens={maxTokens}
        />
      </div>
    </div>
  );
}
