import { useState } from "react";
import "../styles/dashboard.css";

function Dashboard() {
  const [openMenu, setOpenMenu] = useState(false);

  return (
    <div className="dashboard-container">

      {/* Canvas */}
      <div className={`canvas ${openMenu ? "blur" : ""}`}>

        {/* Guided + button */}
        <div className="add-button" onClick={() => setOpenMenu(true)}>
          +
        </div>

        {/* First-time guidance hint (simple version) */}
        <div className="hint">
          Add your first widget
        </div>

      </div>

      {/* Overlay Panel */}
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
              <div className="card">Calendar</div>
              <div className="card">Sticky Notes</div>
              <div className="card">Pomodoro</div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

export default Dashboard;