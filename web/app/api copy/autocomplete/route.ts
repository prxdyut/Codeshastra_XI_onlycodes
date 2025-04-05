import { NextResponse, NextRequest } from 'next/server';
import { Groq } from 'groq-sdk';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const inputText = searchParams.get('text');

    if (!inputText) {
      return NextResponse.json(
        { error: 'Missing text parameter' },
        { status: 400 }
      );
    }

    // Generate autocomplete suggestions using Groq
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant that generates autocomplete suggestions. Return only a JSON array of 5 suggestions as strings."
        },
        {
          role: "user",
          content: `Generate autocomplete suggestions for: "${inputText}"`
        }
      ],
      model: "mixtral-8x7b-32768",
      temperature: 0.7,
      max_tokens: 50
    });

    // Extract and parse the response content
    const responseText = completion.choices[0]?.message?.content;
    let suggestions = [];
    
    try {
      suggestions = JSON.parse(responseText || '[]');
    } catch (error) {
      console.error('Error parsing response:', error);
      return NextResponse.json(
        { error: 'Failed to parse suggestions' },
        { status: 500 }
      );
    }

    return NextResponse.json(suggestions, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      }
    });

  } catch (error) {
    console.error('Groq API error:', error);
    return NextResponse.json(
      { error: 'Failed to generate suggestions' },
      { status: 500 }
    );
  }
}