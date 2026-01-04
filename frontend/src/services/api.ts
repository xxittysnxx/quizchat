import axios from "axios";

// In production (when served by backend), use relative path
// In development, use localhost:8000
// In production, use the current base URL + "api"
const API_URL = import.meta.env.PROD ? `${import.meta.env.BASE_URL}api` : "http://localhost:8000/api";

const api = axios.create({
    baseURL: API_URL,
});

export const uploadFile = async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    const response = await api.post("/upload", formData, {
        headers: {
            "Content-Type": "multipart/form-data",
        },
    });
    return response.data;
};

export const getQuizzes = async () => {
    const response = await api.get("/quizzes");
    return response.data;
};

export const getQuiz = async (quizId: string) => {
    const response = await api.get(`/quiz/${quizId}`);
    return response.data;
};

export const getQuizMetadata = async (quizId: string) => {
    const response = await api.get(`/quiz/${quizId}/metadata`);
    return response.data;
};

export const submitQuiz = async (quizId: string, userName: string, answers: number[]) => {
    const response = await api.post(`/quiz/${quizId}/submit`, {
        user_name: userName,
        answers,
    });
    return response.data;
};

export const getLeaderboard = async (quizId: string) => {
    const response = await api.get(`/quiz/${quizId}/leaderboard`);
    return response.data;
};
