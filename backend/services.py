import os
import json
import logging
import uuid
import random
import google.generativeai as genai
from typing import List
from sqlalchemy.orm import Session
from dotenv import load_dotenv
import models

# Load environment variables
load_dotenv()

# Configure Logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def generate_quiz_with_gemini(content: str) -> List[dict]:
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        logger.error("GEMINI_API_KEY not found.")
        raise ValueError("GEMINI_API_KEY not set in .env file.")

    genai.configure(api_key=api_key)
    # Switched to gemini-2.5-flash due to quota limits on 3-pro
    model = genai.GenerativeModel('gemini-2.5-flash')

    prompt = f"""
    [Task]
    You are an expert at analyzing long conversation logs. 
    Analyze the ENTIRE chat log provided below and generate 20 high-quality multiple-choice questions.
    
    [Requirements]
    1. Focus: funny moments, unique inside jokes, specific details (dates, amounts, locations), and identifying who said what.
    2. Distribution: Ensure the questions are derived from DIFFERENT parts of the log (beginning, middle, and end) to represent the whole conversation.
    3. Language: Everything (questions and options) MUST be in Traditional Chinese (繁體中文).
    4. Output Format: STRICTLY output a raw JSON array of objects. No markdown, no preamble, no trailing text.
    
    [JSON Schema]
    [
        {{
            "text": "問題題目",
            "options": ["選項 A", "選項 B", "選項 C", "選項 D"],
            "correct_answer": 0,
            "explanation": "簡短解釋正確答案的出處或原因"
        }}
    ]

    [Chat Log Content]
    {content[:250000]}
    """

    try:
        response = model.generate_content(prompt)
        text_response = response.text.replace('```json', '').replace('```', '').strip()
        questions_data = json.loads(text_response)
        
        # Validate structure
        valid_questions = []
        for q in questions_data:
            if "text" in q and "options" in q and "correct_answer" in q:
                if isinstance(q["options"], list) and len(q["options"]) >= 2:
                     valid_questions.append(q)
        
        return valid_questions
    except Exception as e:
        logger.error(f"Gemini generation failed: {e}")
        raise ValueError(f"Gemini generation failed: {e}")

def get_unique_filename(db: Session, filename: str) -> str:
    # 1. Remove extension
    base_name = os.path.splitext(filename)[0]
    
    # 2. Check for existence and append suffix if needed
    name = base_name
    counter = 2
    while True:
        existing_quiz = db.query(models.Quiz).filter(models.Quiz.filename == name).first()
        if not existing_quiz:
            return name
        name = f"{base_name} {counter}"
        counter += 1

def generate_quiz(db: Session, filename: str, content: str) -> str:
    # Get unique, clean filename
    unique_name = get_unique_filename(db, filename)

    # Directly call Gemini, no heuristics
    try:
        gemini_questions = generate_quiz_with_gemini(content)
    except Exception as e:
        raise ValueError(f"Failed to generate quiz with AI: {str(e)}")

    if not gemini_questions:
        raise ValueError("AI returned no questions. Please try again or check the file content.")

    quiz_id = str(uuid.uuid4())
    db_quiz = models.Quiz(id=quiz_id, filename=unique_name)
    db.add(db_quiz)
    db.commit()
    db.refresh(db_quiz)

    logger.info(f"Generated {len(gemini_questions)} questions using Gemini.")
    for q_data in gemini_questions:
        # Ensure we have 4 options if possible, or handle what the AI gave
        options = q_data["options"]
        correct_idx = q_data["correct_answer"]
        
        db_question = models.Question(
            quiz_id=quiz_id,
            text=q_data["text"],
            options=options,
            correct_answer=correct_idx,
            explanation=q_data.get("explanation", "")
        )
        db.add(db_question)
    
    db.commit()
    return quiz_id
