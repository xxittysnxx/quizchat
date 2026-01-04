import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { uploadFile, getQuizzes } from "../services/api";
import { motion } from "framer-motion";

interface QuizSummary {
    id: string;
    filename: string;
    created_at: string;
}

export default function Home() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [recentQuizzes, setRecentQuizzes] = useState<QuizSummary[]>([]);
    const navigate = useNavigate();

    useEffect(() => {
        document.title = "QuizChat";
        getQuizzes().then(setRecentQuizzes).catch(console.error);
    }, []);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setLoading(true);
            setError("");
            try {
                const file = e.target.files[0];
                const data = await uploadFile(file);
                navigate(`/quiz/${data.id}`);
            } catch (err: any) {
                console.error(err);
                setError("Failed to generate quiz. Please try a valid chat log.");
            } finally {
                setLoading(false);
            }
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-xl w-full text-center space-y-8"
            >
                <h1 className="text-5xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-pink-500">
                    QuizChat
                </h1>
                <p className="text-slate-400 text-lg">
                    Upload your chat logs and challenge your friends to see who remembers the conversation best.
                </p>

                <div className="relative group cursor-pointer">
                    <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-pink-500 rounded-xl blur opacity-25 group-hover:opacity-75 transition duration-200"></div>
                    <label className="relative block p-12 bg-slate-800 rounded-xl border border-slate-700 hover:border-slate-600 transition duration-200 cursor-pointer">
                        <div className="space-y-4">
                            <span className="text-4xl">📄</span>
                            <p className="text-xl font-medium text-slate-200">
                                {loading ? "Generating Quiz..." : "Drop your chat file here or click to upload"}
                            </p>
                            <p className="text-sm text-slate-500">Supports .txt files from WhatsApp, Line, etc.</p>
                        </div>
                        <input
                            type="file"
                            accept=".txt"
                            className="hidden"
                            onChange={handleFileChange}
                            disabled={loading}
                        />
                    </label>
                </div>

                {error && <p className="text-red-400">{error}</p>}

                {recentQuizzes.length > 0 && (
                    <div className="mt-12 text-left">
                        <h3 className="text-slate-400 mb-4 font-semibold uppercase tracking-wider text-sm">Recently Created</h3>
                        <div className="grid grid-cols-1 gap-3">
                            {recentQuizzes.map(quiz => (
                                <button
                                    key={quiz.id}
                                    onClick={() => navigate(`/quiz/${quiz.id}`)}
                                    className="flex items-center justify-between p-4 bg-slate-800/50 hover:bg-slate-800 border border-slate-700 hover:border-indigo-500/50 rounded-lg transition group"
                                >
                                    <span className="font-medium text-slate-200 truncate pr-4">{quiz.filename}</span>
                                    <span className="text-xs text-slate-500 font-mono">{new Date(quiz.created_at).toLocaleDateString()}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </motion.div>
        </div>
    );
}
