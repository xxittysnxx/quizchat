# QuizChat

QuizChat is a full-stack web application that allows users to upload chat logs (e.g., from WhatsApp or Line) and automatically generates interactive quizzes using AI (Gemini). It features a leaderboard, answer explanations, and a modern UI.

## Features

-   **AI-Powered Quizzes**: Automatically generates 10+ multiple-choice questions from uploaded chat logs.
-   **Immediate Feedback**: Shows correct/incorrect status and detailed explanations.
-   **Leaderboard**: Tracks scores for each specific quiz/chat log.
-   **Online DBMS**: Built-in SQLite Web interface for database management.
-   **Dockerized**: Easy deployment with Docker Compose and Cloudflare Tunnel.

## Project Structure

-   `frontend/`: React + Vite + TailwindCSS application.
-   `backend/`: FastAPI + SQLAlchemy + Google Gemini implementation.
-   `docker-compose.yml`: Orchestration for App, DB UI, and Tunnel.

## Prerequisites

-   Docker & Docker Desktop
-   Google Gemini API Key

## getting Started

### 1. Configuration

Create a `.env` file in `backend/` or use the root `.env` referenced in docker-compose.
Copy `.env.example` to `backend/.env` and fill in your API key:

```bash
cp .env.example backend/.env
# Edit backend/.env and set GEMINI_API_KEY
```

### 2. Run with Docker (Recommended)

This will start the Frontend, Backend, SQLite Web, and Cloudflare Tunnel.

```bash
docker compose up --build -d
```

-   **App**: `http://localhost:8000` (or your configured custom domain)
-   **Database UI**: `http://localhost:8080/quizchat/db` (or `/quizchat/db` on your domain)

### 3. Local Development

**Backend:**
```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python main.py
```
*Running on http://localhost:8000*

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```
*Running on http://localhost:5173*

## Deployment

The project is configured to use **Cloudflare Tunnel** for exposing the local server to the internet correctly.
Check `cloudflared_config.yml` for ingress rules (routes `/quizchat` and `/db`).
