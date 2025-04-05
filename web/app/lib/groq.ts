import { instructions } from '@/instructions';

const GROQ_API_KEY = process.env.GROQ_API_KEY || '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';
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

export async function predictTaskType(userInput: string) {
    try {
        const response = await fetch(GROQ_API_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${GROQ_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: "llama3-70b-8192",
                messages: [
                    {
                        role: "system",
                        content: `You are a task analysis assistant that converts user inputs into structured task data. You must respond with valid JSON according to this schema:

JSON Grammar (MUST follow this exactly):
  root   ::= object
  value  ::= object | array | string | number | ("true" | "false" | "null") ws
  object ::= "{" ws (string ":" ws value ("," ws string ":" ws value)*)? "}" ws
  array  ::= "[" ws (value ("," ws value)*)? "]" ws
  string ::= "\"" ([^"\\\x7F\x00-\x1F] | "\\" (["\\bfnrt] | "u" [0-9a-fA-F]{4}))* "\"" ws
  number ::= ("-"? ([0-9] | [1-9] [0-9]{0,15})) ("." [0-9]+)? ([eE] [-+]? [0-9] [1-9]{0,15})? ws
  ws     ::= | " " | "\n" [ \t]{0,20}
  
  Response Format (REQUIRED):
  {
    "type": "todo|reminder|unknown",
    "action": {
      // For todos
      "todo": {
        "message": "Task description",
        "dueDate": "YYYY-MM-DDTHH:mm:ss.sssZ" | null,
        "priority": "high|medium|low",
      },
      // For reminders
      "reminder": {
        "message": "Reminder description",
        "dateTime": "YYYY-MM-DDTHH:mm:ss.sssZ" | null,
        "recurring": "daily|weekly|monthly|none",
        "priority": "high|medium|low",
      }
    },
    "parsedData": {
      "extractedDate": "YYYY-MM-DDTHH:mm:ss.sssZ",
      "extractedTime": "HH:mm:ss.sssZ",
      "extractedPriority": "any priority level mentioned",
      "mentionedCategories": ["array of categories mentioned"]
    },
    "confidence": 0.0-1.0,
    "requiresConfirmation": true|false,
    "missingInfo": ["array of missing required information"]
  }
    
  Response Guidelines:
  1. Analyze the input text intelligently for todo or reminder related requests
  2. Extract and interpret all relevant information flexibly:
     - Handle relative time expressions ("tonight", "this evening", "tomorrow morning")
     - For "night", generally assume 21:00 unless context suggests otherwise
     - For "morning", generally assume 09:00
     - For "evening", generally assume 18:00
     - For "afternoon", generally assume 14:00
     - Interpret seasonal times based on context
  3. Set appropriate type based on request context and intent:
     - "todo" for task creation requests
     - "reminder" for time-sensitive or alert-based requests
     - "unknown" only if genuinely unclear
  4. For todos:
     - Extract complete task description with context
     - Infer due dates from contextual clues
     - Derive priority from urgency words and context
     - Smart categorization based on task nature
     - Generate relevant tags from context
  5. For reminders:
     - Capture full reminder context
     - Intelligently parse date/time expressions
     - Detect recurring patterns from natural language
     - Infer notification preferences from context
  6. Handle date/time formats flexibly:
     - Support natural language (this weekend, next month, etc.)
     - Handle timezone-aware expressions
     - Interpret seasonal and holiday references
     - Default to reasonable times for general periods
  7. Set confidence level based on:
     - Clarity of intent
     - Completeness of information
     - Ambiguity in time expressions
  8. Only list truly missing critical information
  9. Set requiresConfirmation for genuinely ambiguous cases
  
  Todays Date and current time: ${new Date().toISOString().split('T')[0]} ${new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
  
  Examples:
  1. "Add a todo to buy groceries tonight"
     - Type: todo
     - Message: "Buy groceries"
     - DueDate: "2024-03-19T15:30:00.000Z" // 21:00 IST converted to UTC
     - Category: "shopping"
  
  2. "Remind me to call John tomorrow morning"
     - Type: reminder
     - Message: "Call John"
     - DateTime: "2024-03-20T03:30:00.000Z" // 09:00 IST converted to UTC
     - NotificationType: "push"
  
  CRITICAL: 
  1. ALWAYS return valid JSON
  2. All dates MUST be in ISO 8601 UTC format: "YYYY-MM-DDTHH:mm:ss.sssZ"
  3. Convert all local times to UTC before returning
  4. Set appropriate confidence levels
  5. Only list genuinely missing information
  6. Be flexible with time interpretations
  7. Infer reasonable defaults when appropriate
  8. Consider context for all parameters
  9. Don't leave fields empty unless truly unknown

Analyze the user's input and return ONLY the JSON response without any additional text or explanation.`
                    },
                    {
                        role: "user",
                        content: userInput
                    }
                ]
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`Groq API error: ${errorData.error?.message || response.statusText}`);
        }

        const result = await response.json();
        
        if (!result.choices?.[0]?.message?.content) {
            throw new Error('Invalid response from Groq API');
        }

        try {
            const prediction = JSON.parse(result.choices[0].message.content.trim());
            return prediction;
        } catch (parseError) {
            console.error('Error parsing Groq response:', result.choices[0].message.content);
            throw new Error('Failed to parse Groq API response');
        }
    } catch (error: any) {
        console.error('Error calling Groq API:', error);
        throw new Error(`Failed to process task: ${error.message}`);
    }
} 