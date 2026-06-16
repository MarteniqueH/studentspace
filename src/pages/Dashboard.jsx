import { useState } from "react";
import "../styles/dashboard.css";

function Dashboard() {
  const [openMenu, setOpenMenu] = useState(false);

  return (
    <div className="dashboard-container">

      <div className={`canvas ${openMenu ? "blur" : ""}`}>
        <div className="add-button" onClick={() => setOpenMenu(true)}>
          +
        </div>
        <div className="hint">
          Add your first widget
        </div>
      </div>

      {openMenu && (
        <div className="overlay">
          <div className="widget-panel">

            <div className="panel-header">
              <h2>Widgets</h2>
              <span onClick={() => setOpenMenu(false)}>Close</span>
            </div>

            <input placeholder="Search widgets..." />

            <div className="category">
              <h3>Recommended for You</h3>
              <div className="widget-grid">
                <div className="widget-card">
                  <h4>Calendar</h4>
                  <p>Track assignments, exams, and deadlines.</p>
                </div>
                <div className="widget-card">
                  <h4>Sticky Notes</h4>
                  <p>Capture quick reminders and ideas.</p>
                </div>
                <div className="widget-card">
                  <h4>Pomodoro Timer</h4>
                  <p>Stay focused with structured study sessions.</p>
                </div>
              </div>
            </div>

            <div className="category">
              <h3>Time Management</h3>
              <div className="widget-grid">
                <div className="widget-card">
                  <h4>Calendar</h4>
                  <p>Track assignments, exams, and deadlines.</p>
                </div>
                <div className="widget-card">
                  <h4>Pomodoro Timer</h4>
                  <p>Stay focused with structured study sessions.</p>
                </div>
              </div>
            </div>

            <div className="category">
              <h3>Note Taking</h3>
              <div className="widget-grid">
                <div className="widget-card">
                  <h4>Sticky Notes</h4>
                  <p>Capture quick reminders and ideas.</p>
                </div>
              </div>
            </div>

            <div className="category">
              <h3>Active Recall Resources</h3>
              <div className="widget-grid">
                <div className="widget-card">
                  <h4>AI Flashcards</h4>
                  <p>Generate flashcards from notes and study materials.</p>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

export default Dashboard;