export interface Message {
    id: string;
    content: string;
    role: "user" | "assistant";
    timestamp: Date;
    model?: string; // Optional field to store the AI model name
}