from flask import Flask, request, jsonify
from pydantic import BaseModel, Field
from typing import List, Dict, Optional, Literal
from datetime import datetime, timedelta
import re
from enum import Enum
import uuid
from groq import Groq
import os
import requests

app = Flask(__name__)

# Initialize Groq client with API key
groq_client = Groq(api_key=os.environ.get("GROQ_API_KEY", "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"))

# URL to send notifications to
WEBHOOK_URL = os.environ.get("WEBHOOK_URL", "https://codeshastra.pradyutdas.in/api/adarsh")

# ---- Models for structured data ----

class Priority(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"

class TodoItem(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    task: str
    created_at: str = Field(default_factory=lambda: datetime.now().isoformat())
    due_date: Optional[str] = None
    priority: Priority = Priority.MEDIUM
    completed: bool = False

class Reminder(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    text: str
    created_at: str = Field(default_factory=lambda: datetime.now().isoformat())
    remind_at: str
    completed: bool = False

class TaskType(str, Enum):
    GENERAL_QUERY = "general_query"
    TODO = "todo"
    REMINDER = "reminder"
    ROADMAP = "roadmap"
    UNKNOWN = "unknown"

class TaskClassification(BaseModel):
    task_type: TaskType
    content: str
    details: Optional[Dict] = None

class RoadmapType(str, Enum):
    JEE = "jee"
    NEET = "neet"
    BOARD_EXAMS = "board_exams"
    OTHER = "other"

class StudyTask(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    topic: str
    subtopics: List[str] = []
    resources: List[str] = []
    priority: Priority = Priority.MEDIUM
    target_date: Optional[str] = None
    completed: bool = False
    parent_roadmap: Optional[str] = None

class Roadmap(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    type: RoadmapType
    tasks: List[StudyTask] = []
    created_at: str = Field(default_factory=lambda: datetime.now().isoformat())
    target_completion_date: Optional[str] = None

# ---- In-memory storage ----
todos = []
reminders = []
roadmaps = []
study_tasks = []

# ---- Helper Functions ----

def send_webhook_notification(item_type, item_data):
    """Send notification to webhook URL when a new item is created"""
    try:
        payload = {
            "type": item_type,
            "timestamp": datetime.now().isoformat(),
            "data": item_data.dict() if hasattr(item_data, "dict") else item_data
        }
        
        response = requests.post(WEBHOOK_URL, json=payload, timeout=5)
        
        if response.status_code >= 200 and response.status_code < 300:
            print(f"Successfully sent {item_type} notification to webhook")
            return True
        else:
            print(f"Failed to send notification: {response.status_code} - {response.text}")
            return False
    except Exception as e:
        print(f"Error sending webhook notification: {str(e)}")
        return False

def classify_task(user_input: str) -> TaskClassification:
    """Enhanced task classifier that properly routes to handlers"""
    user_input_lower = user_input.lower()
    
    # Roadmap detection
    roadmap_keywords = ["roadmap", "study plan", "exam prep", "syllabus", "curriculum"]
    exam_types = {
        "jee": ["jee", "joint entrance"],
        "neet": ["neet", "medical entrance"],
        "board": ["board exam", "cbse", "icse", "state board"]
    }
    
    if any(word in user_input_lower for word in roadmap_keywords):
        exam_type = RoadmapType.OTHER
        for exam, keywords in exam_types.items():
            if any(kw in user_input_lower for kw in keywords):
                exam_type = RoadmapType(exam)
                break
        
        return TaskClassification(
            task_type=TaskType.ROADMAP,
            content=user_input,
            details={"exam_type": exam_type.value}
        )
    
    # To-do detection
    # elif any(word in user_input_lower for word in ["todo", "task", "add", "complete", "finish"]):
    elif re.search(r"add|create|make|new|my todos|todo|todos", user_input_lower, re.IGNORECASE):
        print('user_input_lower in classify function: ', user_input_lower)
        priority = Priority.MEDIUM
        if "high priority" in user_input_lower:
            priority = Priority.HIGH
        elif "low priority" in user_input_lower:
            priority = Priority.LOW
        
        due_date = None
        date_match = re.search(r"by (\w+ \d{1,2}|\d{1,2}/\d{1,2})", user_input_lower)
        if date_match:
            due_date = date_match.group(1)
        
        return TaskClassification(
            task_type=TaskType.TODO,
            content=user_input,
            details={
                "task": re.sub(r"(add|create|new|todo|task)", "", user_input, flags=re.IGNORECASE).strip(),
                "priority": priority.value,
                "due_date": due_date
            }
        )
    
    # Reminder detection
    elif any(word in user_input_lower for word in ["remind", "remember", "don't forget", "alert","reminders",'my reminder'"reminds"]):
        time_match = re.search(
            r"(at|by|on) (\d{1,2}(:\d{2})? ?(am|pm)?|tomorrow|next week)",
            user_input_lower
        )
        remind_at = (datetime.now() + timedelta(hours=1)).isoformat()
        if time_match:
            remind_at = time_match.group(0)
        
        return TaskClassification(
            task_type=TaskType.REMINDER,
            content=user_input,
            details={
                "text": re.sub(r"(remind|remember|alert)", "", user_input, flags=re.IGNORECASE).strip(),
                "when": remind_at
            }
        )
    
    # Default to general query
    return TaskClassification(
        task_type=TaskType.GENERAL_QUERY,
        content=user_input
    )

def format_todo_list() -> str:
    """Format the to-do list for display"""
    if not todos:
        return "Your to-do list is empty."
    
    result = "📋 Your To-Do List:\n\n"
    for i, todo in enumerate(todos, 1):
        status = "✓" if todo.completed else "□"
        due = f" (Due: {todo.due_date})" if todo.due_date else ""
        priority_marker = {"high": "🔴", "medium": "🟡", "low": "🟢"}.get(todo.priority, "")
        result += f"{i}. {status} {priority_marker} {todo.task}{due}\n"
    return result

def format_reminders() -> str:
    """Format the reminders for display"""
    if not reminders:
        return "You don't have any reminders set."
    
    result = "⏰ Your Reminders:\n\n"
    for i, reminder in enumerate(reminders, 1):
        status = "✓" if reminder.completed else "□"
        display_time = reminder.remind_at
        try:
            dt = datetime.fromisoformat(reminder.remind_at)
            display_time = dt.strftime("%Y-%m-%d %H:%M")
        except:
            pass
        result += f"{i}. {status} {reminder.text} (At: {display_time})\n"
    return result

def format_study_tasks(roadmap_id: str) -> str:
    """Format study tasks for a specific roadmap"""
    tasks = [t for t in study_tasks if t.parent_roadmap == roadmap_id]
    if not tasks:
        return "No tasks found for this roadmap."
    
    result = ""
    for task in tasks:
        status = "✓" if task.completed else "□"
        subtopics = "\n    - " + "\n    - ".join(task.subtopics) if task.subtopics else ""
        resources = "\n    📚 " + ", ".join(task.resources) if task.resources else ""
        result += f"{status} {task.topic}{subtopics}{resources}\n"
    return result

# ---- API Endpoints ----

@app.route('/api/todo', methods=['GET', 'POST'])
def todo_handler():
    """Handle to-do list related tasks"""
    if request.method == 'POST':
        data = request.json
        content = data.get('content', '')
        details = data.get('details', {})
        
        if re.search(r"add|create|make|new", content, re.IGNORECASE):
            task = content
            priority = Priority.MEDIUM
            due_date = None
            
            if details:
                task = details.get("task", content)
                priority_str = details.get("priority", "medium").lower()
                priority = Priority(priority_str) if priority_str in [p.value for p in Priority] else Priority.MEDIUM
                due_date = details.get("due_date")
            
            todo = TodoItem(task=task, priority=priority, due_date=due_date)
            todos.append(todo)
            
            # Send webhook notification
            send_webhook_notification("todo", todo)
            
            return jsonify({
                "status": "success",
                "message": f"✅ Added to your to-do list: {task}",
                "todo_list": format_todo_list()
            })
    
    return jsonify({
        "status": "success",
        "todo_list": format_todo_list()
    })

@app.route('/api/reminder', methods=['GET', 'POST'])
def reminder_handler():
    """Handle reminder related tasks"""
    if request.method == 'POST':
        data = request.json
        content = data.get('content', '')
        details = data.get('details', {})
        
        if re.search(r"remind|remember|don't forget|alert", content, re.IGNORECASE):
            reminder_text = content
            remind_at = (datetime.now() + timedelta(hours=1)).isoformat()
            
            if details:
                reminder_text = details.get("text", content)
                if "when" in details:
                    remind_at = details["when"]
            
            reminder = Reminder(text=reminder_text, remind_at=remind_at)
            reminders.append(reminder)
            
            # Send webhook notification
            send_webhook_notification("reminder", reminder)
            
            display_time = remind_at
            try:
                dt = datetime.fromisoformat(remind_at)
                display_time = dt.strftime("%Y-%m-%d %H:%M")
            except:
                pass
            
            return jsonify({
                "status": "success",
                "message": f"⏰ I'll remind you to {reminder_text} at {display_time}",
                "reminders": format_reminders()
            })
    
    return jsonify({
        "status": "success",
        "reminders": format_reminders()
    })

@app.route('/api/roadmap', methods=['GET', 'POST'])
def roadmap_handler():
    """Handle exam preparation roadmaps and study planning"""
    global roadmaps, study_tasks
    
    if request.method == 'POST':
        data = request.json
        content = data.get('content', '')
        details = data.get('details', {})
        
        if re.search(r"roadmap|plan|schedule|prepare|jee|neet|exam", content, re.IGNORECASE):
            exam_type = RoadmapType.OTHER
            if re.search(r"\bjee\b", content, re.IGNORECASE):
                exam_type = RoadmapType.JEE
            elif re.search(r"\bneet\b", content, re.IGNORECASE):
                exam_type = RoadmapType.NEET
            
            roadmap = Roadmap(
                name=f"{exam_type.value.upper()} Preparation Roadmap",
                type=exam_type
            )
            
            if exam_type == RoadmapType.JEE:
                roadmap.tasks = [
                    StudyTask(
                        topic="Mathematics",
                        subtopics=["Algebra", "Calculus", "Trigonometry", "Coordinate Geometry"],
                        resources=["NCERT Class 11-12", "RD Sharma"]
                    ),
                    StudyTask(
                        topic="Physics",
                        subtopics=["Mechanics", "Electrodynamics", "Modern Physics"],
                        resources=["HC Verma", "Concepts of Physics"]
                    ),
                    StudyTask(
                        topic="Chemistry",
                        subtopics=["Physical Chemistry", "Organic Chemistry", "Inorganic Chemistry"],
                        resources=["OP Tandon", "NCERT"]
                    )
                ]
            
            roadmaps.append(roadmap)
            
            for task in roadmap.tasks:
                task.parent_roadmap = roadmap.id
                study_tasks.append(task)
            
            return jsonify({
                "status": "success",
                "message": (
                    f"📚 Created {roadmap.name} with {len(roadmap.tasks)} main subjects.\n\n"
                    f"Subjects:\n- " + "\n- ".join([t.topic for t in roadmap.tasks])
                ),
                "roadmap_id": roadmap.id
            })
        
        elif re.search(r"break down|weekly|schedule", content, re.IGNORECASE):
            if not roadmaps:
                return jsonify({"status": "error", "message": "Please create a roadmap first."}), 400
            
            current_roadmap = roadmaps[-1]
            
            if not current_roadmap.tasks:
                return jsonify({"status": "error", "message": "No tasks found in the current roadmap."}), 400
            
            weeks = 24
            time_match = re.search(r"(\d+)\s*(month|week)", content, re.IGNORECASE)
            if time_match:
                num, unit = time_match.groups()
                weeks = int(num) * 4 if "month" in unit.lower() else int(num)

            incomplete_subjects = [task for task in current_roadmap.tasks if not task.completed]
            
            if not incomplete_subjects:
                return jsonify({"status": "error", "message": "All subjects are already completed!"}), 400
            
            weekly_tasks = []
            
            for week in range(1, weeks + 1):
                subject = incomplete_subjects[(week - 1) % len(incomplete_subjects)]
                subtopic_index = (week - 1) // len(incomplete_subjects)
                subtopics = subject.subtopics
                subtopic_count = min(2, len(subtopics))
                
                if subtopic_index < len(subtopics):
                    selected_subtopics = subtopics[subtopic_index:subtopic_index+subtopic_count]
                    task_description = f"Week {week}: {subject.topic} - {' & '.join(selected_subtopics)}"
                else:
                    task_description = f"Week {week}: {subject.topic} Review"
                
                weekly_tasks.append(
                    TodoItem(
                        task=task_description,
                        due_date=(datetime.now() + timedelta(weeks=week)).isoformat(),
                        priority=Priority.HIGH if week <= 4 else Priority.MEDIUM
                    )
                )
            
            todos[:] = [todo for todo in todos if not todo.task.startswith("Week ")]
            todos.extend(weekly_tasks)
            
            # Send webhook notifications for all weekly tasks
            for task in weekly_tasks:
                send_webhook_notification("todo", task)
            
            return jsonify({
                "status": "success",
                "message": (
                    f"🗓 Created {weeks}-week optimized study plan:\n"
                    f"- Focuses on 1 subject per week\n"
                    f"- Covers 1-2 subtopics weekly\n"
                    f"- Includes review weeks\n\n"
                    f"First task: {weekly_tasks[0].task} (due {weekly_tasks[0].due_date[:10]})"
                ),
                "todo_list": format_todo_list()
            })
        
        elif re.search(r"done|completed|finished", content, re.IGNORECASE):
            if not roadmaps:
                return jsonify({"status": "error", "message": "No roadmap found. Create one first."}), 400
            
            completed_items = re.findall(r"\b(?:done|completed)\s+([\w\s]+)", content, re.IGNORECASE)
            if not completed_items:
                return jsonify({"status": "error", "message": "Please specify what you've completed"}), 400
            
            current_roadmap = roadmaps[-1]
            updated = []
            
            for item in completed_items:
                for task in current_roadmap.tasks:
                    if item.lower() in task.topic.lower():
                        task.completed = True
                        updated.append(task.topic)
                        break
                    for subtopic in task.subtopics:
                        if item.lower() in subtopic.lower():
                            task.completed = True
                            updated.append(subtopic)
                            break
            
            if updated:
                for todo in todos:
                    if any(item.lower() in todo.task.lower() for item in updated):
                        todo.completed = True
                
                return jsonify({
                    "status": "success",
                    "message": f"✅ Updated progress: {', '.join(updated)}",
                    "progress": format_study_tasks(current_roadmap.id)
                })
            return jsonify({"status": "error", "message": "Couldn't find those topics in your roadmap."}), 400
    
    if not roadmaps:
        return jsonify({"status": "error", "message": "No roadmap found. Create one first."}), 400
    
    current_roadmap = roadmaps[-1]
    completed = sum(1 for t in current_roadmap.tasks if t.completed)
    
    return jsonify({
        "status": "success",
        "message": (
            f"📊 {current_roadmap.name} Progress:\n"
            f"Completed: {completed}/{len(current_roadmap.tasks)} subjects"
        ),
        "progress": format_study_tasks(current_roadmap.id)
    })

@app.route('/api/query', methods=['POST'])
def general_query_handler():
    """Handle general queries using Groq API"""
    data = request.json
    query = data.get('query', '')
    
    if not query:
        return jsonify({"status": "error", "message": "No query provided"}), 400
    
    try:
        completion = groq_client.chat.completions.create(
            model="deepseek-r1-distill-llama-70b",
            messages=[{"role": "user", "content": query}],
            temperature=0.6,
            max_completion_tokens=4096,
            top_p=0.95,
            stream=True,
            stop=None,
        )
        
        full_response = ""
        for chunk in completion:
            content = chunk.choices[0].delta.content
            if content:
                full_response += content
        
        return jsonify({
            "status": "success",
            "response": full_response
        })
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": f"Error querying Groq API: {str(e)}"
        }), 500

# Main message handler
@app.route('/api/message', methods=['POST'])
def message_handler():
    """Main message handler that routes to appropriate function"""
    data = request.json
    message = data.get('message', '')
    
    if not message:
        return jsonify({"status": "error", "message": "No message provided"}), 400
    
    classification = classify_task(message)
    if classification:
        print('classification in message handler: ', classification)
        print('classification.task_type in message handler: ', classification.details)
    else:
        print('classification is none in message handler')
    
    # Route to appropriate handler
    if classification.task_type == TaskType.ROADMAP:
        return handle_roadmap(classification)
    elif classification.task_type == TaskType.TODO:
        return handle_todo(classification)
    elif classification.task_type == TaskType.REMINDER:
        return handle_reminder(classification)
    elif classification.task_type == TaskType.GENERAL_QUERY:
        return handle_general_query(classification)
    else:
        return jsonify({
            "status": "success",
            "message": "I can help with exam roadmaps, to-dos, reminders, and general questions."
        })

# Specific handlers
def handle_todo(classification: TaskClassification):
    """Handle todo requests"""
    try:
        content = classification.content
        details = classification.details or {}
        print('content in handle_todo: ', content)
        # Check if it's a list request
        if any(word in content.lower() for word in ["show", "my todos"]):
            print('content in handle_todo if: ', content)
            return jsonify({
                "status": "success",
                "todo_list": format_todo_list()
            })
        # Handle todo creation
        elif re.search(r"add|create|make|new", content, re.IGNORECASE):
            print('content in handle_todo elif: ', content)
            task = content
            priority = Priority.MEDIUM
            due_date = None
            
            if details:
                task = details.get("task", content)
                priority_str = details.get("priority", "medium").lower()
                priority = Priority(priority_str) if priority_str in [p.value for p in Priority] else Priority.MEDIUM
                due_date = details.get("due_date")
            
            todo = TodoItem(task=task, priority=priority, due_date=due_date)
            todos.append(todo)
            print('todos', todos)
            
            # Send webhook notification
            send_webhook_notification("todo", todo)
            
            return jsonify({
                "status": "success",
                "message": f"✅ Added to your to-do list: {task}",
                "todo_list": format_todo_list()
            })
        
        return jsonify({
            "status": "error",
            "message": "Could not understand todo request"
        }), 400
    
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": f"Failed to handle todo request: {str(e)}"
        }), 500

def handle_roadmap(classification: TaskClassification):
    """Handle roadmap requests"""
    try:
        payload = {
            "content": classification.content,
            "details": classification.details or {}
        }
        
        with app.test_request_context(
            '/api/roadmap',
            method='POST',
            json=payload
        ) as ctx:
            response = app.full_dispatch_request()
            return response
    
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": f"Failed to handle roadmap request: {str(e)}"
        }), 500

def handle_reminder(classification: TaskClassification):
    """Handle reminder requests"""
    try:
        payload = {
            "content": classification.content,
            "details": classification.details or {}
        }
        
        if any(word in classification.content.lower() for word in ["list", "show", "my reminders"]):
            with app.test_request_context('/api/reminder', method='GET') as ctx:
                response = app.full_dispatch_request()
                return response
        else:
            with app.test_request_context(
                '/api/reminder',
                method='POST',
                json=payload
            ) as ctx:
                response = app.full_dispatch_request()
                return response
    
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": f"Failed to handle reminder request: {str(e)}"
        }), 500

def handle_general_query(classification: TaskClassification):
    """Handle general queries using Groq API"""
    try:
        completion = groq_client.chat.completions.create(
            model="deepseek-r1-distill-llama-70b",
            messages=[{"role": "user", "content": classification.content}],
            temperature=0.6,
            max_completion_tokens=4096,
            top_p=0.95,
            stream=True,
            stop=None,
        )
        
        full_response = ""
        for chunk in completion:
            content = chunk.choices[0].delta.content
            if content:
                full_response += content
        
        return jsonify({
            "status": "success",
            "response": full_response
        })
    
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": f"Failed to handle query: {str(e)}"
        }), 500

# Environment configuration endpoint
@app.route('/api/config/webhook', methods=['POST'])
def set_webhook_url():
    """Configure the webhook URL"""
    global WEBHOOK_URL
    data = request.json
    new_url = data.get('url')
    
    if not new_url:
        return jsonify({"status": "error", "message": "No URL provided"}), 400
    
    try:
        # Validate URL format
        if not new_url.startswith(('http://', 'https://')):
            return jsonify({"status": "error", "message": "Invalid URL format. Must start with http:// or https://"}), 400
        
        # Set the new webhook URL
        WEBHOOK_URL = new_url
        
        # Test the webhook with a ping
        test_result = send_webhook_notification("test", {"message": "Webhook connection test"})
        
        if test_result:
            return jsonify({
                "status": "success",
                "message": f"Webhook URL set to {new_url} and test notification sent successfully"
            })
        else:
            return jsonify({
                "status": "warning",
                "message": f"Webhook URL set to {new_url} but test notification failed"
            })
    
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": f"Failed to set webhook URL: {str(e)}"
        }), 500

@app.route('/api/help', methods=['GET'])
def help_handler():
    """Return help documentation"""
    return jsonify({
        "status": "success",
        "help": """# Smart Assistant Help

## Exam Preparation
- Create study roadmaps for JEE/NEET
- Break down into weekly tasks
- Track your progress

## To-Do List
- Add tasks
- List tasks
- Mark tasks complete

## Reminders
- Set reminders
- List reminders

## General Questions
- Ask any question

## Webhooks
- Configure webhook notifications by calling /api/config/webhook

Try: "Create a JEE roadmap" or "I completed algebra today"
"""
    })

if __name__ == '__main__':
    app.run(debug=True)