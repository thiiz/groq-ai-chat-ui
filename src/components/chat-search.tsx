"use client";

import { Search } from "lucide-react";
import * as React from "react";

interface ChatSearchProps {
  searchQuery: string;
  setSearchQuery: React.Dispatch<React.SetStateAction<string>>;
}

export const ChatSearch: React.FC<ChatSearchProps> = ({
  searchQuery,
  setSearchQuery,
}) => {
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    // Focus the input when it's mounted
    inputRef.current?.focus();
  }, []);

  return (
    <div className="p-3 border-b animate-in slide-in-from-top-2 duration-200">
      <div className="relative">
        <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-primary">
          <Search className="h-4 w-4" />
        </div>
        <input
          ref={inputRef}
          id="message-search"
          type="text"
          placeholder="Search messages..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-3 rounded-lg border border-primary/20 bg-background/80 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 shadow-sm"
        />
      </div>
    </div>
  );
};