from sqlalchemy import Column, Integer, String, ForeignKey, Text, JSON, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base

class Quiz(Base):
    __tablename__ = "quizzes"

    id = Column(String, primary_key=True, index=True)
    filename = Column(String, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    questions = relationship("Question", back_populates="quiz")
    attempts = relationship("Attempt", back_populates="quiz")

class Question(Base):
    __tablename__ = "questions"

    id = Column(Integer, primary_key=True, index=True)
    quiz_id = Column(String, ForeignKey("quizzes.id"))
    text = Column(Text, index=True)
    options = Column(JSON) # List of strings
    correct_answer = Column(Integer) # Index of correct option
    explanation = Column(Text) # Explanation for the answer
    
    quiz = relationship("Quiz", back_populates="questions")

class Attempt(Base):
    __tablename__ = "attempts"

    id = Column(Integer, primary_key=True, index=True)
    quiz_id = Column(String, ForeignKey("quizzes.id"))
    user_name = Column(String, index=True)
    score = Column(Integer)
    timestamp = Column(DateTime, default=datetime.utcnow)

    quiz = relationship("Quiz", back_populates="attempts")
