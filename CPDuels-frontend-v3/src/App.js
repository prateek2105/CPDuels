import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import PlayPage from "./pages/PlayPage";
import DuelPage from "./pages/DuelPage";
import DuelNotFoundPage from "./pages/DuelNotFoundPage";
import ScrollToTop from "./components/scrollToTop";

function App() {
  return (
    <Router>
      <ScrollToTop />
      <Routes>
        <Route path="/play" exact element={<PlayPage />} />
        <Route path="/play/:id" exact element={<DuelPage />} />
        <Route path="/noduel" exact element={<DuelNotFoundPage />} />
      </Routes>
    </Router>
  );
}

export default App;
