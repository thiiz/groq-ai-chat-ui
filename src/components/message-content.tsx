/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { cn } from "@/lib/utils";
import { Check, Copy } from 'lucide-react';
import React from "react";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface MessageContentProps {
    content: string;
    isThinking?: boolean;
    model?: string; // Add model property
}

export const MessageContent: React.FC<MessageContentProps> = ({ content, isThinking = false, model }) => {
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
            <div className="relative group">
                <button
                    onClick={() => handleCopyCode(children)}
                    className="absolute top-2 right-2 p-1 rounded-md bg-muted/80 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                    aria-label="Copy code"
                >
                    {isCopied ? (
                        <Check className="h-4 w-4 text-green-500" />
                    ) : (
                        <Copy className="h-4 w-4" />
                    )}
                </button>
                <SyntaxHighlighter
                    style={vscDarkPlus}
                    language={language}
                    PreTag="div"
                    className="rounded-md text-sm my-4"
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
                <div className="text-xs text-muted-foreground font-medium mb-1 flex items-center">
                    <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-sm">
                        {model}
                    </span>
                </div>
            )}
            <div className="message-content space-y-4">


                {/* Thinking content with animation */}
                {thinkingContent && (
                    <div className="thinking-content mb-3 border-b border-border pb-3">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="thinking-animation flex gap-1">
                                <span className="h-2 w-2 bg-primary/60 rounded-full animate-pulse"
                                    style={{ animationDelay: "0ms" }} />
                                <span className="h-2 w-2 bg-primary/60 rounded-full animate-pulse"
                                    style={{ animationDelay: "300ms" }} />
                                <span className="h-2 w-2 bg-primary/60 rounded-full animate-pulse"
                                    style={{ animationDelay: "600ms" }} />
                            </div>
                            <span className="text-xs font-medium text-muted-foreground">
                                {isThinking ? "Thinking" : `Thinked (${thinkingDuration})`}
                            </span>
                        </div>
                        <div className="bg-muted/50 rounded-md p-3 text-sm text-muted-foreground">
                            <ReactMarkdown
                                components={{
                                    code: ({ className, children, ...props }) => {
                                        const match = /language-(\w+)/.exec(className || "");
                                        return match ? (
                                            <CodeBlock language={match[1]}>
                                                {String(children).replace(/\n$/, "")}
                                            </CodeBlock>
                                        ) : (
                                            <code className="bg-muted px-1 py-0.5 rounded text-sm" {...props}>
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
                    <div className="thinking-animation flex gap-1 mb-2">
                        <span className="h-2 w-2 bg-primary/60 rounded-full animate-pulse"
                            style={{ animationDelay: "0ms" }} />
                        <span className="h-2 w-2 bg-primary/60 rounded-full animate-pulse"
                            style={{ animationDelay: "300ms" }} />
                        <span className="h-2 w-2 bg-primary/60 rounded-full animate-pulse"
                            style={{ animationDelay: "600ms" }} />
                    </div>
                )}

                {/* Main content with markdown rendering */}
                <div className={cn(
                    "prose prose-sm dark:prose-invert max-w-none",
                    "prose-headings:font-semibold prose-headings:text-foreground",
                    "prose-h1:text-xl prose-h2:text-lg prose-h3:text-base",
                    "prose-p:my-2 prose-p:leading-relaxed",
                    "prose-pre:bg-muted prose-pre:border prose-pre:border-border",
                    "prose-code:text-primary"
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
                                    <code className="bg-muted px-1 py-0.5 rounded text-sm" {...props}>
                                        {children}
                                    </code>
                                );
                            },
                            ul: ({ ...props }) => <ul className="list-disc pl-6 my-2" {...props} />,
                            ol: ({ ...props }) => <ol className="list-decimal pl-6 my-2" {...props} />,
                            li: ({ ...props }) => <li className="my-1" {...props} />,
                            blockquote: ({ ...props }) => (
                                <blockquote className="border-l-4 border-primary/30 pl-4 italic my-2" {...props} />
                            ),
                        }}
                    >
                        {mainContent}
                    </ReactMarkdown>
                </div>
            </div>
        </>
    );
};