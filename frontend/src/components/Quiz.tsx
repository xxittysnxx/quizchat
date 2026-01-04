import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getQuiz, submitQuiz, getQuizMetadata } from "../services/api";
import { motion, AnimatePresence } from "framer-motion";

interface Question {
    id: number;
    text: string;
    options: string[];
    correct_answer: number;
    explanation: string;
}

export default function Quiz() {
    const { quizId } = useParams();
    const navigate = useNavigate();
    const [questions, setQuestions] = useState<Question[]>([]);
    const [loading, setLoading] = useState(true);
    const [answers, setAnswers] = useState<number[]>([]);
    const [userName, setUserName] = useState("");
    const [started, setStarted] = useState(false);
    const [quizTitle, setQuizTitle] = useState("");
    const [currentQIndex, setCurrentQIndex] = useState(0);

    useEffect(() => {
        if (quizId) {
            getQuizMetadata(quizId).then(data => {
                setQuizTitle(data.filename);
                document.title = `Quiz of ${data.filename}`;
            });

            getQuiz(quizId)
                .then((data) => {
                    setQuestions(data);
                    setAnswers(new Array(data.length).fill(-1));
                    setLoading(false);
                })
                .catch((err) => {
                    console.error(err);
                    setLoading(false);
                });
        }
    }, [quizId]);


    const handleAnswer = (optionIndex: number) => {
        if (answers[currentQIndex] !== -1) return; // Prevent creating multiple answers for same question

        const newAnswers = [...answers];
        newAnswers[currentQIndex] = optionIndex;
        setAnswers(newAnswers);
    };

    const handleNext = () => {
        if (currentQIndex < questions.length - 1) {
            setCurrentQIndex(prev => prev + 1);
        } else {
            submit();
        }
    };

    const submit = async () => {
        finalizeQuiz();
    };

    // ... handleStart, finalizeQuiz ...

    const handleStart = () => {
        if (userName.trim()) setStarted(true);
    };

    const finalizeQuiz = async () => {
        if (!quizId) return;
        try {
            await submitQuiz(quizId, userName, answers);
            navigate(`/leaderboard/${quizId}`);
        } catch (err) {
            console.error(err);
        }
    };

    // Remove auto-submit effect

    if (loading) return <div className="flex justify-center items-center h-screen text-white">Loading Quiz...</div>;

    if (!started) {
        // ... (Keep existing Name Input UI) ...
        return (
            <div className="flex flex-col items-center justify-center min-h-screen p-4">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-slate-800 p-8 rounded-2xl shadow-xl max-w-md w-full space-y-6"
                >
                    <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-emerald-400">
                        {quizTitle ? `Quiz of ${quizTitle}` : "Quiz Time!"}
                    </h1>
                    <p className="text-slate-400">Enter your name to start the challenge!</p>
                    <input
                        type="text"
                        placeholder="Enter your name"
                        className="w-full bg-slate-900 border border-slate-700 p-3 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition text-white"
                        value={userName}
                        onChange={e => setUserName(e.target.value)}
                    />
                    <button
                        disabled={!userName.trim()}
                        onClick={handleStart}
                        className="w-full bg-gradient-to-r from-indigo-500 to-pink-500 p-3 rounded-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition text-white"
                    >
                        Start Quiz
                    </button>

                    <button
                        onClick={() => navigate(`/leaderboard/${quizId}`)}
                        className="w-full bg-slate-700 p-3 rounded-lg font-bold hover:bg-slate-600 transition text-slate-200 mt-2"
                    >
                        View Leaderboard
                    </button>
                </motion.div>
            </div>
        );
    }

    if (questions.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
                <h2 className="text-2xl font-bold text-red-400 mb-4">Error Loading Quiz</h2>
                <p className="text-slate-400 mb-8">Could not load questions. Please try refreshing or creating a new quiz.</p>
                <button
                    onClick={() => navigator.clipboard.writeText(window.location.href).then(() => alert("URL copied!"))}
                    className="text-indigo-400 text-sm hover:text-indigo-300 underline mb-4"
                >
                    Copy Debug URL
                </button>
                <div className="space-x-4">
                    <button
                        onClick={() => window.location.reload()}
                        className="px-6 py-2 bg-indigo-600 rounded-lg font-bold hover:bg-indigo-700 transition"
                    >
                        Retry
                    </button>
                    <button
                        onClick={() => navigate("/")}
                        className="px-6 py-2 bg-slate-700 rounded-lg font-bold hover:bg-slate-600 transition"
                    >
                        Back to Home
                    </button>
                </div>
            </div>
        );
    }

    const currentQuestion = questions[currentQIndex];
    const isAnswered = answers[currentQIndex] !== -1;
    const isCorrect = isAnswered && answers[currentQIndex] === currentQuestion.correct_answer;

    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-4">
            <div className="w-full max-w-2xl">
                <div className="mb-4 flex justify-between items-center text-slate-400">
                    <span>Question {currentQIndex + 1} / {questions.length}</span>
                    <span>{userName}</span>
                </div>

                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentQIndex}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="bg-slate-800 p-8 rounded-2xl shadow-xl border border-slate-700"
                    >
                        <h3 className="text-2xl font-medium mb-8 leading-relaxed text-white">
                            {currentQuestion.text}
                        </h3>

                        <div className="grid grid-cols-1 gap-4">
                            {currentQuestion.options.map((opt, idx) => {
                                let btnClass = "bg-slate-900 border-slate-700 hover:bg-slate-700 text-slate-200";

                                if (isAnswered) {
                                    if (idx === currentQuestion.correct_answer) {
                                        btnClass = "bg-green-600 border-green-500 text-white";
                                    } else if (idx === answers[currentQIndex]) {
                                        btnClass = "bg-red-600 border-red-500 text-white";
                                    } else {
                                        btnClass = "bg-slate-900 border-slate-700 opacity-50";
                                    }
                                } else if (answers[currentQIndex] === idx) {
                                    btnClass = "bg-indigo-600 border-indigo-500 text-white";
                                }

                                return (
                                    <button
                                        key={idx}
                                        onClick={() => handleAnswer(idx)}
                                        disabled={isAnswered}
                                        className={`p-4 rounded-lg text-left transition duration-200 border ${btnClass} ${!isAnswered && 'hover:border-indigo-500'}`}
                                    >
                                        {opt}
                                    </button>
                                );
                            })}
                        </div>

                        {isAnswered && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={`mt-6 p-4 rounded-lg ${isCorrect ? "bg-green-900/30 border border-green-500/50" : "bg-red-900/30 border border-red-500/50"}`}
                            >
                                <p className={`font-bold mb-2 ${isCorrect ? "text-green-400" : "text-red-400"}`}>
                                    {isCorrect ? "Correct! 🎉" : "Incorrect 😅"}
                                </p>
                                <p className="text-slate-300">
                                    {currentQuestion.explanation || "No explanation provided."}
                                </p>
                                <button
                                    onClick={handleNext}
                                    className="mt-4 bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2 rounded-lg transition-colors w-full sm:w-auto"
                                >
                                    {currentQIndex < questions.length - 1 ? "Next Question" : "Finish Quiz"}
                                </button>
                            </motion.div>
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
}
