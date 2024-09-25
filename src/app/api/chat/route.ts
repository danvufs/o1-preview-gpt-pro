import OpenAI from 'openai';
import { NextResponse } from 'next/server';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const runtime = "edge";

export async function POST(req: Request) {
  const { messages } = await req.json();

  // Append the markdown instruction to the last user message
  const modifiedMessages = [...messages];
  if (modifiedMessages.length > 0) {
    const lastMessage = modifiedMessages[modifiedMessages.length - 1];
    if (lastMessage.role === 'user') {
      lastMessage.content += ' (Please respond in markdown format)';
    }
  }

  try {
    const response = await openai.chat.completions.create({
      model: "o1-preview",
      messages: modifiedMessages,
    });

    return NextResponse.json(response.choices[0].message);
  } catch (error) {
    console.error('OpenAI API error:', error);
    return NextResponse.json({ error: 'An error occurred while processing your request.' }, { status: 500 });
  }
}