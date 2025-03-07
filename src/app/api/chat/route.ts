import Groq from 'groq-sdk';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    try {
        const { model, maxTokens, temperature, messages, apiKey, topP } = await request.json();

        // Validate required parameters
        if (!apiKey) {
            return NextResponse.json(
                { error: 'API key is required' },
                { status: 400 }
            );
        }

        if (!messages || !messages.length) {
            return NextResponse.json(
                { error: 'Messages are required' },
                { status: 400 }
            );
        }

        if (!model) {
            return NextResponse.json(
                { error: 'Model is required' },
                { status: 400 }
            );
        }

        // Initialize Groq client with the API key
        const groq = new Groq({ apiKey: apiKey.trim() });

        // Make API call to Groq with streaming enabled
        const completion = await groq.chat.completions.create({
            messages: messages.map((m: { role: string; content: string }) => ({ role: m.role, content: m.content })),
            model: model,
            temperature: temperature,
            max_completion_tokens: maxTokens,
            top_p: topP,
            stop: null,
            stream: true,
        });

        // Create a ReadableStream to stream the response
        const stream = new ReadableStream({
            async start(controller) {
                const encoder = new TextEncoder();
                for await (const chunk of completion) {
                    const content = chunk.choices[0]?.delta?.content || '';
                    if (content) {
                        controller.enqueue(encoder.encode(content));
                    }
                }
                controller.close();
            }
        });
        return new Response(stream, {
            headers: {
                'Content-Type': 'text/plain; charset=utf-8',
            },
        });

    } catch (error: unknown) {
        console.error('Error in chat API route:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Failed to get AI response' },
            { status: 500 }
        );
    }
}