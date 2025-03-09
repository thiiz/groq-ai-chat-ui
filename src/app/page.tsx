

"use client"
import { Message } from "@/@types/message";
import { Chat } from "@/components/chat";
import { ChatSidebar } from "@/components/chat-sidebar";
import { MobileSidebar } from "@/components/mobile-sidebar";
import { useIsMobile } from "@/hooks/use-mobile";
import * as React from "react";

export default function Home() {
  const isMobile = useIsMobile();
  // Set default model value to avoid empty model state
  const [model, setModel] = React.useState("llama-3.3-70b-versatile");
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

    // Load saved model from localStorage
    const savedModel = localStorage.getItem('selectedModel');
    if (savedModel) {
      setModel(savedModel);
    }
  }, []);

  React.useEffect(() => {
    // Save system message to localStorage whenever it changes
    if (typeof window !== 'undefined') {
      localStorage.setItem('systemMessage', systemMessage);
    }
  }, [systemMessage]);

  // Save selected model to localStorage whenever it changes
  React.useEffect(() => {
    if (typeof window !== 'undefined' && model) {
      localStorage.setItem('selectedModel', model);
    }
  }, [model]);

  // Reference to the Chat component to access its methods
  const chatRef = React.useRef<{ handleNewChat: () => void, loadChat: (id: string) => void }>(null);

  // State to track the current chat ID
  const [currentChatId, setCurrentChatId] = React.useState<string>(() => {
    // Initialize with the current chat ID from localStorage if available
    if (typeof window !== 'undefined') {
      const savedMessages = localStorage.getItem('chatMessages');
      const savedChats = localStorage.getItem('chatHistory');

      if (savedMessages && savedChats) {
        const chatHistory = JSON.parse(savedChats);
        const messages = JSON.parse(savedMessages);

        const matchingChat = chatHistory.find((chat: { messages: Message[] }) =>
          JSON.stringify(chat.messages) === JSON.stringify(messages));

        if (matchingChat) {
          return matchingChat.id;
        }
      }
    }
    return "";
  });

  // Listen for chatIdChanged event from Chat component
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const handleChatIdChanged = (event: CustomEvent) => {
        setCurrentChatId(event.detail);
      };

      window.addEventListener('chatIdChanged', handleChatIdChanged as EventListener);

      return () => {
        window.removeEventListener('chatIdChanged', handleChatIdChanged as EventListener);
      };
    }
  }, []);

  const handleNewChat = () => {
    chatRef.current?.handleNewChat();
    // Reset current chat ID when creating a new chat
    setCurrentChatId(Date.now().toString());
  };

  const handleLoadChat = (chatId: string) => {
    chatRef.current?.loadChat(chatId);
    // Update current chat ID when loading a chat
    setCurrentChatId(chatId);
  };

  const sidebarProps = {
    setModel,
    model,
    setTemperature,
    temperature,
    setMaxTokens,
    maxTokens,
    onNewChat: handleNewChat,
    onLoadChat: handleLoadChat,
    setSystemMessage,
    systemMessage,
    setTopP,
    topP,
    currentChatId,
  };

  return (
    <div className="flex flex-col md:flex-row h-screen overflow-hidden bg-background">
      {!isMobile && <ChatSidebar defaultOpen={true} {...sidebarProps} />}
      <div className="flex-1 flex flex-col relative border-l">
        {isMobile && <MobileSidebar {...sidebarProps} />}
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
