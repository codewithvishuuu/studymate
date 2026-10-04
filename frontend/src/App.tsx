import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import Layout from "./components/Layout";
import Chat from "./pages/Chat";
import Dashboard from "./pages/Dashboard";
import Flashcards from "./pages/Flashcards";
import Landing from "./pages/Landing";
import Notes from "./pages/Notes";
import NotFound from "./pages/NotFound";
import Quiz from "./pages/Quiz";
import Settings from "./pages/Settings";
import StudyPlan from "./pages/StudyPlan";
import Summaries from "./pages/Summaries";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route index element={<Landing />} />
        <Route element={<Layout />}>
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="notes" element={<Notes />} />
          <Route path="chat" element={<Chat />} />
          <Route path="ask" element={<Navigate to="/chat" replace />} />
          <Route path="summaries" element={<Summaries />} />
          <Route path="quiz" element={<Quiz />} />
          <Route path="flashcards" element={<Flashcards />} />
          <Route path="study-plan" element={<StudyPlan />} />
          <Route path="settings" element={<Settings />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
