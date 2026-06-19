import { useState, useEffect } from "react";
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
  /* STATE */
  const [openMenu, setOpenMenu] = useState(false);
  const [selectedWidget, setSelectedWidget] = useState(null);
  const [placedWidgets, setPlacedWidgets] = useState([]);

  const [activeWidgetId, setActiveWidgetId] = useState(null);
  const [draggingId, setDraggingId] = useState(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [snapEnabled] = useState(true);

  /* LOAD FROM STORAGE */
  useEffect(() => {
    const saved = localStorage.getItem("dashboard-widgets");
    if (saved) setPlacedWidgets(JSON.parse(saved));
  }, []);

  useEffect(() => {
    localStorage.setItem("dashboard-widgets", JSON.stringify(placedWidgets));
  }, [placedWidgets]);

  /* DELETE WIDGET */
  const deleteWidget = (id) => {
    setPlacedWidgets((prev) =>
      prev.filter((w) => w.instanceId !== id)
    );

    if (activeWidgetId === id) {
      setActiveWidgetId(null);
    }
  };

  return (
    <div className="dashboard-container">

      {/* =========================
          CANVAS
      ========================= */}
      <div
        className={`canvas ${openMenu ? "blur" : ""}`}

        /* PLACE WIDGET */
        onClick={(e) => {
          if (!selectedWidget) return;

          const rect = e.currentTarget.getBoundingClientRect();
          let x = e.clientX - rect.left;
          let y = e.clientY - rect.top;

          // snap
          if (snapEnabled) {
            const grid = 20;
            x = Math.round(x / grid) * grid;
            y = Math.round(y / grid) * grid;
          }

          setPlacedWidgets([
            ...placedWidgets,
            {
              ...selectedWidget,
              instanceId: crypto.randomUUID(),
              x,
              y,
              size: "medium"
            }
          ]);

          setSelectedWidget(null);
          setOpenMenu(false);
        }}

        /* DRAG MOVE (ONLY SYSTEM) */
        onMouseMove={(e) => {
          if (!draggingId) return;

          const rect = e.currentTarget.getBoundingClientRect();

          let x = e.clientX - rect.left - offset.x;
          let y = e.clientY - rect.top - offset.y;

          if (snapEnabled) {
            const grid = 20;
            x = Math.round(x / grid) * grid;
            y = Math.round(y / grid) * grid;
          }

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

        {/* OPEN MENU */}
        <div className="add-button" onClick={() => setOpenMenu(true)}>
          +
        </div>

        {/* PLACED WIDGETS */}
        {placedWidgets.map((w) => (
          <div
            key={w.instanceId}
            className={`placed-widget ${w.size} ${
              activeWidgetId === w.instanceId ? "active" : ""
            }`}
            style={{
              position: "absolute",
              left: `${w.x}px`,
              top: `${w.y}px`
            }}

            /* SELECT + START DRAG */
            onMouseDown={(e) => {
              e.stopPropagation();

              setDraggingId(w.instanceId);
              setActiveWidgetId(w.instanceId);

              const rect = e.currentTarget.getBoundingClientRect();

              setOffset({
                x: e.clientX - rect.left,
                y: e.clientY - rect.top
              });
            }}
          >
            <h4>{w.title}</h4>

            {/* DELETE */}
            {activeWidgetId === w.instanceId && (
              <div className="widget-toolbar">
                <button onClick={() => deleteWidget(w.instanceId)}>
                  Delete
                </button>
              </div>
            )}

            {/* SIZE CONTROLS */}
            <div className="size-controls">
              <button onClick={() =>
                setPlacedWidgets((prev) =>
                  prev.map((widget) =>
                    widget.instanceId === w.instanceId
                      ? { ...widget, size: "small" }
                      : widget
                  )
                )
              }>S</button>

              <button onClick={() =>
                setPlacedWidgets((prev) =>
                  prev.map((widget) =>
                    widget.instanceId === w.instanceId
                      ? { ...widget, size: "medium" }
                      : widget
                  )
                )
              }>M</button>

              <button onClick={() =>
                setPlacedWidgets((prev) =>
                  prev.map((widget) =>
                    widget.instanceId === w.instanceId
                      ? { ...widget, size: "large" }
                      : widget
                  )
                )
              }>L</button>
            </div>
          </div>
        ))}

        {/* EMPTY STATE */}
        {placedWidgets.length === 0 && (
          <div className="hint">
            Add your first widget
          </div>
        )}
      </div>

      {/* =========================
          OVERLAY MENU
      ========================= */}
      {openMenu && (
        <div className="overlay">
          <div className="widget-panel">

            <div className="panel-header">
              <h2>Widgets</h2>
              <span onClick={() => setOpenMenu(false)}>Close</span>
            </div>

            <input placeholder="Search widgets..." />

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