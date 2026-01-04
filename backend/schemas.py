from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class QuestionSchema(BaseModel):
    id: int
    text: str
    options: List[str]
    correct_answer: int
    explanation: str
    
    class Config:
        from_attributes = True

class QuizSchema(BaseModel):
    id: str
    filename: str
    created_at: datetime

    class Config:
        from_attributes = True

class AttemptCreate(BaseModel):
    user_name: str
    answers: List[int] # List of chosen option indices matching the order of questions

class AttemptResponse(BaseModel):
    id: int
    user_name: str
    score: int
    rank: Optional[int] = None

    class Config:
        orm_mode = True

class LeaderboardEntry(BaseModel):
    user_name: str
    score: int
    timestamp: datetime
