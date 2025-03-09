"use client";

import { Download, Keyboard, Search, Trash2 } from "lucide-react";
import * as React from "react";

interface ChatHeaderProps {
  isSearching: boolean;
  setIsSearching: React.Dispatch<React.SetStateAction<boolean>>;
  showShortcuts: boolean;
  setShowShortcuts: React.Dispatch<React.SetStateAction<boolean>>;
  handleNewChat: () => void;
  exportChat: () => void;
  messagesExist: boolean;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({
  isSearching,
  setIsSearching,
  showShortcuts,
  setShowShortcuts,
  handleNewChat,
  exportChat,
  messagesExist
}) => {
  return (
    <div className="flex items-center justify-between p-3 sm:p-4 border-b bg-background/95 backdrop-blur sticky top-0 z-10 shadow-sm">
      <div className="flex items-center gap-2 sm:gap-3">
        <h2 className="text-sm sm:text-base font-medium">Chat Session</h2>
      </div>
      <div className="flex items-center gap-1 sm:gap-2">
        <button
          onClick={() => setIsSearching((prev) => !prev)}
          className={`p-1.5 sm:p-2 rounded-md transition-all duration-200 ${
            isSearching 
              ? "bg-primary/20 text-primary" 
              : "hover:bg-primary/10 hover:text-primary"
          }`}
          title="Search messages (Ctrl+F)"
        >
          <Search className="h-3 w-3 sm:h-4 sm:w-4" />
        </button>
        <button
          onClick={exportChat}
          className="p-1.5 sm:p-2 rounded-md hover:bg-primary/10 hover:text-primary transition-all duration-200"
          title="Export chat"
          disabled={!messagesExist}
        >
          <Download className="h-3 w-3 sm:h-4 sm:w-4" />
        </button>
        <button
          onClick={handleNewChat}
          className="p-1.5 sm:p-2 rounded-md hover:bg-primary/10 hover:text-primary transition-all duration-200"
          title="New chat (Ctrl+N)"
        >
          <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
        </button>
        <button
          onClick={() => setShowShortcuts((prev) => !prev)}
          className={`p-1.5 sm:p-2 rounded-md transition-all duration-200 ${
            showShortcuts 
              ? "bg-primary/20 text-primary" 
              : "hover:bg-primary/10 hover:text-primary"
          }`}
          title="Keyboard shortcuts (Ctrl+/)"
        >
          <Keyboard className="h-3 w-3 sm:h-4 sm:w-4" />
        </button>
      </div>
    </div>
  );
};