import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getLeaderboard, getQuizMetadata } from "../services/api";
import { motion } from "framer-motion";

interface Entry {
    user_name: string;
    score: number;
}

export default function Leaderboard() {
    const { quizId } = useParams();
    const [entries, setEntries] = useState<Entry[]>([]);
    const [loading, setLoading] = useState(true);
    const [quizTitle, setQuizTitle] = useState("");

    useEffect(() => {
        if (quizId) {
            getQuizMetadata(quizId).then(data => {
                setQuizTitle(data.filename);
                document.title = `Leaderboard of ${data.filename}`;
            });

            getLeaderboard(quizId).then((data) => {
                setEntries(data);
                setLoading(false);
            });
        }
    }, [quizId]);

    if (loading) return <div className="text-center mt-20">Loading Leaderboard...</div>;

    return (
        <div className="flex flex-col items-center min-h-screen p-8">
            <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-yellow-400 to-orange-500 mb-8">
                {quizTitle ? `Leaderboard of ${quizTitle}` : "Leaderboard"}
            </h1>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-2xl bg-slate-800 rounded-2xl overflow-hidden shadow-2xl"
            >
                <table className="w-full">
                    <thead className="bg-slate-700 text-slate-300">
                        <tr>
                            <th className="p-4 text-left">Rank</th>
                            <th className="p-4 text-left">Name</th>
                            <th className="p-4 text-right">Score</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700">
                        {entries.map((entry, idx) => (
                            <tr key={idx} className="hover:bg-slate-700/50 transition">
                                <td className="p-4 text-slate-400">
                                    {idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : `#${idx + 1}`}
                                </td>
                                <td className="p-4 font-medium">{entry.user_name}</td>
                                <td className="p-4 text-right font-bold text-indigo-400">{entry.score}</td>
                            </tr>
                        ))}
                        {entries.length === 0 && (
                            <tr>
                                <td colSpan={3} className="p-8 text-center text-slate-500">No attempts yet. Be the first!</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </motion.div>

            <div className="mt-8 space-x-4">
                <Link to={`/quiz/${quizId}`} className="px-6 py-3 bg-indigo-600 rounded-lg font-bold hover:bg-indigo-700 transition">
                    Try Again
                </Link>
                <Link to="/" className="px-6 py-3 bg-slate-700 rounded-lg font-bold hover:bg-slate-600 transition">
                    Upload New File
                </Link>
            </div>
        </div>
    );
}
