/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { cn } from "@/lib/utils";
import { Check, Clock, Copy } from 'lucide-react';
import React from "react";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface MessageContentProps {
    content: string;
    isThinking?: boolean;
    model?: string; // Add model property
    isUserMessage?: boolean; // Add property to identify user messages
}

export const MessageContent: React.FC<MessageContentProps> = ({ content, isThinking = false, model, isUserMessage = false }) => {
    const startTimeRef = React.useRef(new Date());
    const [thinkingDuration, setThinkingDuration] = React.useState<string | null>(null);
    const [copiedCode, setCopiedCode] = React.useState<string | null>(null);

    React.useEffect(() => {
        if (!isThinking && !thinkingDuration) {
            const endTime = new Date();
            const duration = (endTime.getTime() - startTimeRef.current.getTime()) / 1000;
            setThinkingDuration(`${duration.toFixed(1)}s`);
        }
    }, [isThinking, thinkingDuration]);

    // Reset copied state after 2 seconds
    React.useEffect(() => {
        if (copiedCode) {
            const timeout = setTimeout(() => {
                setCopiedCode(null);
            }, 2000);
            return () => clearTimeout(timeout);
        }
    }, [copiedCode]);

    const handleCopyCode = (code: string) => {
        navigator.clipboard.writeText(code)
            .then(() => {
                setCopiedCode(code);
            })
            .catch((err) => {
                console.error('Failed to copy code:', err);
            });
    };

    // Check if content contains a thinking section
    const hasThinkingContent = content.includes("<think>") && content.includes("</think>");

    // Extract thinking content if present
    let mainContent = content;
    let thinkingContent = "";

    if (hasThinkingContent) {
        const thinkRegex = /<think>([\s\S]*?)<\/think>/;
        const match = content.match(thinkRegex);

        if (match && match[1]) {
            thinkingContent = match[1].trim();
            // Remove the thinking section from the main content
            mainContent = content.replace(thinkRegex, "").trim();
        }
    }

    // Code block component with copy button
    const CodeBlock = ({ language, children }: { language: string, children: string }) => {
        const isCopied = copiedCode === children;

        return (
            <div className="relative group rounded-xl overflow-hidden border border-border/50 my-5 shadow-md transition-all hover:shadow-lg hover:border-primary/30">
                <div className="bg-muted/80 px-4 py-2.5 text-xs font-mono flex items-center justify-between border-b border-border/50 backdrop-blur-sm">
                    <span className="text-muted-foreground font-medium">{language}</span>
                    <button
                        onClick={() => handleCopyCode(children)}
                        className="p-1.5 rounded-md hover:bg-primary/20 text-muted-foreground hover:text-primary transition-all duration-200"
                        aria-label="Copy code"
                    >
                        {isCopied ? (
                            <Check className="h-4 w-4 text-primary" />
                        ) : (
                            <Copy className="h-4 w-4" />
                        )}
                    </button>
                </div>
                <SyntaxHighlighter
                    style={vscDarkPlus}
                    language={language}
                    PreTag="div"
                    className="text-sm !bg-muted/30 !m-0 !p-6"
                    showLineNumbers
                >
                    {children}
                </SyntaxHighlighter>
            </div>
        );
    };

    return (
        <>
            {/* Model name display */}
            {model && (
                <div className={`text-xs text-muted-foreground font-medium mb-3 flex ${isUserMessage ? "justify-end" : "justify-start"} items-center gap-2`}>
                    <span className="bg-primary/15 text-primary px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-sm transition-all hover:bg-primary/20 hover:shadow-md">
                        <Clock className="h-3 w-3" />
                        <span className="font-medium">{model}</span>
                    </span>
                </div>
            )}
            <div className={`message-content space-y-4 ${isUserMessage ? "items-end" : "items-start"}`}>


                {/* Thinking content with animation */}
                {thinkingContent && (
                    <div className={`thinking-content mb-5 ${isUserMessage ? "border-r-2 pr-4 text-right" : "border-l-2 pl-4"} border-primary/40 pb-3`}>
                        <div className={`flex items-center gap-2 mb-3 ${isUserMessage ? "justify-end" : "justify-start"}`}>
                            <div className="thinking-animation flex gap-1">
                                <span className="h-2 w-2 bg-primary/70 rounded-full animate-pulse"
                                    style={{ animationDelay: "0ms" }} />
                                <span className="h-2 w-2 bg-primary/70 rounded-full animate-pulse"
                                    style={{ animationDelay: "300ms" }} />
                                <span className="h-2 w-2 bg-primary/70 rounded-full animate-pulse"
                                    style={{ animationDelay: "600ms" }} />
                            </div>
                            <span className="text-xs font-medium text-primary/80">
                                {isThinking ? "Thinking" : `Thought process (${thinkingDuration})`}
                            </span>
                        </div>
                        <div className="bg-primary/5 rounded-xl p-4 text-sm text-muted-foreground shadow-md border border-primary/10">
                            <ReactMarkdown
                                components={{
                                    code: ({ className, children, ...props }) => {
                                        const match = /language-(\w+)/.exec(className || "");
                                        return match ? (
                                            <CodeBlock language={match[1]}>
                                                {String(children).replace(/\n$/, "")}
                                            </CodeBlock>
                                        ) : (
                                            <code className="bg-muted/70 px-1.5 py-0.5 rounded text-sm font-mono" {...props}>
                                                {children}
                                            </code>
                                        );
                                    },
                                }}
                            >
                                {thinkingContent}
                            </ReactMarkdown>
                        </div>
                    </div>
                )}

                {/* Loading animation when message is being generated */}
                {isThinking && (
                    <div className="flex items-center gap-2 mb-3 p-2 rounded-lg bg-primary/5 inline-flex">
                        <div className="thinking-animation flex gap-1">
                            <span className="h-2 w-2 bg-primary/60 rounded-full animate-pulse"
                                style={{ animationDelay: "0ms" }} />
                            <span className="h-2 w-2 bg-primary/60 rounded-full animate-pulse"
                                style={{ animationDelay: "300ms" }} />
                            <span className="h-2 w-2 bg-primary/60 rounded-full animate-pulse"
                                style={{ animationDelay: "600ms" }} />
                        </div>
                        <span className="text-xs font-medium text-primary/80">Generating response...</span>
                    </div>
                )}

                {/* Main content with markdown rendering */}
                <div className={cn(
                    "prose prose-sm dark:prose-invert max-w-none",
                    "prose-headings:font-semibold prose-headings:text-foreground",
                    "prose-h1:text-xl prose-h2:text-lg prose-h3:text-base",
                    "prose-p:my-3 prose-p:leading-relaxed",
                    "prose-pre:bg-transparent prose-pre:p-0 prose-pre:m-0 prose-pre:border-none",
                    "prose-code:text-primary prose-a:text-primary hover:prose-a:text-primary/80 prose-a:no-underline hover:prose-a:underline",
                    isUserMessage && "text-right"
                )}>
                    <ReactMarkdown
                        components={{
                            h1: ({ ...props }) => <h1 className="text-2xl font-bold mt-4 mb-2" {...props} />,
                            h2: ({ ...props }) => <h2 className="text-xl font-semibold mt-3 mb-2" {...props} />,
                            h3: ({ ...props }) => <h3 className="text-lg font-medium mt-2 mb-1" {...props} />,
                            code: ({ className, children, ...props }) => {
                                const match = /language-(\w+)/.exec(className || "");
                                return match ? (
                                    <CodeBlock language={match[1]}>
                                        {String(children).replace(/\n$/, "")}
                                    </CodeBlock>
                                ) : (
                                    <code className="bg-primary/10 px-1.5 py-0.5 rounded text-sm font-mono shadow-sm" {...props}>
                                        {children}
                                    </code>
                                );
                            },
                            ul: ({ ...props }) => <ul className="list-disc pl-6 my-2 space-y-1" {...props} />,
                            ol: ({ ...props }) => <ol className="list-decimal pl-6 my-2 space-y-1" {...props} />,
                            li: ({ ...props }) => <li className="my-1" {...props} />,
                            blockquote: ({ ...props }) => (
                                <blockquote className="border-l-4 border-primary/30 pl-4 italic my-3 text-muted-foreground bg-muted/30 py-2 pr-2 rounded-r-md" {...props} />
                            ),
                            a: ({ ...props }) => (
                                <a className="text-primary underline hover:text-primary/80 transition-colors" {...props} />
                            ),
                            table: ({ ...props }) => (
                                <div className="overflow-x-auto my-4">
                                    <table className="border-collapse border border-border w-full text-sm" {...props} />
                                </div>
                            ),
                            th: ({ ...props }) => <th className="border border-border bg-muted p-2 text-left font-medium" {...props} />,
                            td: ({ ...props }) => <td className="border border-border p-2" {...props} />,
                        }}
                    >
                        {mainContent}
                    </ReactMarkdown>
                </div>
            </div>
        </>
    );
};