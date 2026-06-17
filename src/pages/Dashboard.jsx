import { useState } from "react";
import "../styles/dashboard.css";

/* =========================
   STATIC WIDGET CATALOG
========================= */
const widgets = [
  {
    id: 1,
    title: "Calendar",
    description: "Track assignments, exams, and deadlines.",
    category: "Time Management"
  },
  {
    id: 2,
    title: "Pomodoro Timer",
    description: "Stay focused with structured study sessions.",
    category: "Time Management"
  },
  {
    id: 3,
    title: "Sticky Notes",
    description: "Capture quick reminders and ideas.",
    category: "Note Taking"
  },
  {
    id: 4,
    title: "AI Flashcards",
    description: "Generate flashcards from notes and study materials.",
    category: "Active Recall Resources"
  }
];

const categories = [
  "Time Management",
  "Note Taking",
  "Active Recall Resources"
];

/* =========================
   DASHBOARD COMPONENT
========================= */
function Dashboard() {
  const [openMenu, setOpenMenu] = useState(false);
  const [selectedWidget, setSelectedWidget] = useState(null);
  const [placedWidgets, setPlacedWidgets] = useState([]);
  import { useEffect } from "react";
  const [draggingId, setDraggingId] = useState(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
useEffect(() => {
    const saved = localStorage.getItem("dashboard-widgets");
    if (saved) {
      setPlacedWidgets(JSON.parse(saved));
    }
  }, []);
  useEffect(() => {
  localStorage.setItem(
    "dashboard-widgets",
    JSON.stringify(placedWidgets)
  );
}, [placedWidgets]);

  return (
    <div className="dashboard-container">

      {/* =========================
          CANVAS (WORKSPACE)
      ========================= */}
      <div
        className={`canvas ${openMenu ? "blur" : ""}`}
        onClick={(e) => {
          // Must select a widget first
          if (!selectedWidget) return;

          const rect = e.currentTarget.getBoundingClientRect();
          const x = e.clientX - rect.left;
          const y = e.clientY - rect.top;

          // Add widget to canvas at click position
          setPlacedWidgets([
            ...placedWidgets,
            {
              ...selectedWidget,
              instanceId: crypto.randomUUID(),
              x,
              y
            }
          ]);

          // Reset UI state
          setSelectedWidget(null);
          setOpenMenu(false);
        }}

        onMouseMove={(e) => {
  if (!draggingId) return;

  const rect = e.currentTarget.getBoundingClientRect();

  const x = e.clientX - rect.left - offset.x;
  const y = e.clientY - rect.top - offset.y;

  setPlacedWidgets((prev) =>
    prev.map((w) =>
      w.instanceId === draggingId
        ? { ...w, x, y }
        : w
    )
  );
}}

onMouseUp={() => {
  setDraggingId(null);
}}
      >

        {/* Open widget menu */}
        <div className="add-button" onClick={() => setOpenMenu(true)}>
          +
        </div>

        {/* Render placed widgets */}
        {placedWidgets.map((w) => (
          <div
  key={w.instanceId}
  className="placed-widget"
  style={{
    position: "absolute",
    left: `${w.x}px`,
    top: `${w.y}px`,
    cursor: "grab"
  }}
  onMouseDown={(e) => {
    e.stopPropagation(); // prevents canvas click

    setDraggingId(w.instanceId);

    const rect = e.currentTarget.getBoundingClientRect();

    setOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top



    });
  }}
>
  {w.title}
</div>
        ))}

        {/* Empty state */}
        <div className="hint">
          Add your first widget
        </div>
      </div>

      {/* =========================
          WIDGET MENU OVERLAY
      ========================= */}
      {openMenu && (
        <div className="overlay">
          <div className="widget-panel">

            <div className="panel-header">
              <h2>Widgets</h2>
              <span onClick={() => setOpenMenu(false)}>Close</span>
            </div>

            <input placeholder="Search widgets..." />

            {/* CATEGORY LIST */}
            {categories.map((category) => (
              <div className="category" key={category}>
                <h3>{category}</h3>

                <div className="widget-grid">
                  {widgets
                    .filter((w) => w.category === category)
                    .map((w) => (
                      <div
                        key={w.id}
                        className={`widget-card ${
                          selectedWidget?.id === w.id ? "active" : ""
                        }`}
                        onClick={() => setSelectedWidget(w)}
                      >
                        <h4>{w.title}</h4>
                        <p>{w.description}</p>
                      </div>
                    ))}
                </div>
              </div>
            ))}

          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;