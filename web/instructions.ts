export const instructions = `JSON Grammar (MUST follow this exactly):
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
        "dueDate": "YYYY-MM-DD" | null,
        "priority": "high|medium|low",
        "category": "work|personal|shopping|other",
        "status": "pending|completed",
        "tags": ["array", "of", "tags"]
      },
      // For reminders
      "reminder": {
        "message": "Reminder description",
        "dateTime": "YYYY-MM-DD HH:mm" | null,
        "recurring": "daily|weekly|monthly|none",
        "priority": "high|medium|low",
        "notificationType": "push|email|both"
      }
    },
    "parsedData": {
      "extractedDate": "any date mentioned in text",
      "extractedTime": "any time mentioned in text",
      "extractedPriority": "any priority level mentioned",
      "mentionedCategories": ["array of categories mentioned"]
    },
    "confidence": 0.0-1.0,
    "requiresConfirmation": true|false,
    "missingInfo": ["array of missing required information"]
  }
    
  Response Guidelines:
  1. Analyze the input text for todo or reminder related requests
  2. Extract all relevant information like dates, times, priorities
  3. Set appropriate type based on the request:
     - "todo" for task creation requests
     - "reminder" for reminder/alert requests
     - "unknown" if request is unclear
  4. For todos:
     - Extract task description
     - Look for due dates in various formats
     - Identify priority levels mentioned
     - Categorize based on context
     - Extract any tags mentioned
  5. For reminders:
     - Extract reminder message
     - Parse date and time information
     - Identify if recurring pattern is mentioned
     - Set appropriate notification type
  6. Handle date/time formats:
     - Support various date formats (today, tomorrow, next week, etc.)
     - Convert all dates to YYYY-MM-DD format
     - Convert all times to 24-hour format (HH:mm)
  7. Set confidence level based on clarity of request
  8. List any missing required information
  9. Set requiresConfirmation if critical info is ambiguous
  
  Examples:
  1. "Add a todo to buy groceries tomorrow"
     - Type: todo
     - Message: "Buy groceries"
     - DueDate: [tomorrow's date]
     - Category: "shopping"
  
  2. "Remind me to call John at 3pm"
     - Type: reminder
     - Message: "Call John"
     - DateTime: [today's date] 15:00
     - NotificationType: "push"
  
  CRITICAL: 
  1. You MUST ALWAYS respond with a valid JSON object
  2. All dates must be in YYYY-MM-DD format
  3. All times must be in 24-hour HH:mm format
  4. Set appropriate confidence levels
  5. List ALL missing required information
  6. Handle ambiguous requests appropriately`