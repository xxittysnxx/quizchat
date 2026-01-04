from fastapi import FastAPI, UploadFile, File, Depends, HTTPException, APIRouter
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List
from database import engine, Base, SessionLocal
import models, schemas, services
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, RedirectResponse
import os

# Create tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Create API Router
api_router = APIRouter()

@api_router.post("/upload", response_model=schemas.QuizSchema)
async def upload_file(file: UploadFile = File(...), db: Session = Depends(get_db)):
    content = await file.read()
    try:
        text_content = content.decode("utf-8")
    except UnicodeDecodeError:
        raise HTTPException(status_code=400, detail="Invalid file format. Please upload a UTF-8 text file.")
    
    try:
        quiz_id = services.generate_quiz(db, file.filename, text_content)
        quiz = db.query(models.Quiz).filter(models.Quiz.id == quiz_id).first()
        return quiz
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@api_router.get("/quizzes", response_model=List[schemas.QuizSchema])
def get_quizzes(db: Session = Depends(get_db)):
    quizzes = db.query(models.Quiz).order_by(models.Quiz.created_at.desc()).all()
    return quizzes

@api_router.get("/quiz/{quiz_id}/metadata", response_model=schemas.QuizSchema)
def get_quiz_metadata(quiz_id: str, db: Session = Depends(get_db)):
    quiz = db.query(models.Quiz).filter(models.Quiz.id == quiz_id).first()
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
    return quiz

@api_router.get("/quiz/{quiz_id}", response_model=List[schemas.QuestionSchema])
def get_quiz(quiz_id: str, db: Session = Depends(get_db)):
    questions = db.query(models.Question).filter(models.Question.quiz_id == quiz_id).all()
    if not questions:
        raise HTTPException(status_code=404, detail="Quiz not found")
    return questions

@api_router.post("/quiz/{quiz_id}/submit", response_model=schemas.AttemptResponse)
def submit_quiz(quiz_id: str, attempt: schemas.AttemptCreate, db: Session = Depends(get_db)):
    questions = db.query(models.Question).filter(models.Question.quiz_id == quiz_id).all()
    if not questions:
        raise HTTPException(status_code=404, detail="Quiz not found")
    
    if len(attempt.answers) != len(questions):
        raise HTTPException(status_code=400, detail="Number of answers does not match number of questions")
    
    score = 0
    for i, q in enumerate(questions):
        if attempt.answers[i] == q.correct_answer:
            score += 10 # 10 points per correct answer
            
    db_attempt = models.Attempt(
        quiz_id=quiz_id,
        user_name=attempt.user_name,
        score=score
    )
    db.add(db_attempt)
    db.commit()
    db.refresh(db_attempt)
    
    # Calculate rank? For now just return basic info
    return db_attempt

@api_router.get("/quiz/{quiz_id}/leaderboard", response_model=List[schemas.LeaderboardEntry])
def get_leaderboard(quiz_id: str, db: Session = Depends(get_db)):
    attempts = db.query(models.Attempt).filter(models.Attempt.quiz_id == quiz_id).order_by(models.Attempt.score.desc()).all()
    return attempts

# Include router for LOCAL development (http://localhost:8000/api/...)
app.include_router(api_router, prefix="/api")

# Include router for PRODUCTION deployment (https://domain.com/quizchat/api/...)
app.include_router(api_router, prefix="/quizchat/api")

# Serve React Static Files
if os.path.exists("../frontend/dist"):
    # PRODUCTION: Mount assets to /quizchat/assets
    app.mount("/quizchat/assets", StaticFiles(directory="../frontend/dist/assets"), name="assets_prod")
    # DEV/LOCAL: Mount assets to /assets (likely needed if testing built version locally without /quizchat prefix)
    app.mount("/assets", StaticFiles(directory="../frontend/dist/assets"), name="assets_dev")

    # Serve React App for /quizchat prefix (Production)
    @app.get("/quizchat/{full_path:path}")
    async def serve_react_app_prod(full_path: str):
        if full_path.startswith("api"):
             raise HTTPException(status_code=404, detail="Not Found")
        
        file_path = f"../frontend/dist/{full_path}"
        if os.path.exists(file_path) and os.path.isfile(file_path):
            return FileResponse(file_path)
            
        return FileResponse("../frontend/dist/index.html")

    # Explicitly handle /quizchat (no slash) by redirecting to /quizchat/
    # This ensures relative assets in index.html (like specific imports) resolve against /quizchat/
    @app.get("/quizchat")
    def serve_root_prod():
         return RedirectResponse(url="/quizchat/")

    # Serve React App for root (optional: allows accessing localhost:8000/ directly if you want)
    # But more importantly, catches anything that falls through
    @app.get("/")
    def serve_root_local():
        return FileResponse("../frontend/dist/index.html")

else:
    @app.get("/")
    def read_root():
        return {"message": "QuizChat Backend API (Frontend build not found)"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
