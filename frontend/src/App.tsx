import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./components/Home";
import Quiz from "./components/Quiz";
import Leaderboard from "./components/Leaderboard";

function App() {
    return (
        <Router basename={import.meta.env.BASE_URL}>
            <div className="min-h-screen bg-slate-900 text-white selection:bg-indigo-500 selection:text-white">
                <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/quiz/:quizId" element={<Quiz />} />
                    <Route path="/leaderboard/:quizId" element={<Leaderboard />} />
                </Routes>
            </div>
        </Router>
    );
}

export default App;
