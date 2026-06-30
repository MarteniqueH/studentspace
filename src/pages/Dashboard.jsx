import { useState, useEffect } from "react";
import "../styles/dashboard.css";
import {
  FiClock,
  FiCalendar,
  FiBookOpen,
  FiEdit3
} from "react-icons/fi";

import {
  HiOutlineFolderOpen
} from "react-icons/hi";

import {
  BsStars
} from "react-icons/bs";
/*
Static Widget Catalog 
This array defines all widgets currently available in the widget menu

*/

const widgets = [
  {
    id: 1,
    icon: <HiOutlineFolderOpen />,
    title: "Course Folders",
    description: "Organize notes, files, slides, and class materials.",
    category: "Study Resources"
  },
  {
    id: 2,
   icon: <FiCalendar />,
    title: "Calendar",
    description: "Track assignments, exams, and deadlines.",
    category: "Time Management"
  },
  {
    id: 3,
    icon: <FiClock />,
    title: "Pomodoro Timer",
    description: "Stay focused with structured study sessions.",
    category: "Time Management"
  },
  {
    id: 4,
    icon: <FiEdit3 />,
    title: "Sticky Notes",
    description: "Capture quick reminders and ideas.",
    category: "Note Taking"
  },
  {
    id: 5,
     icon: <BsStars />,
    title: "AI Flashcards",
    description: "Generate flashcards from notes and study materials.",
    category: "Active Recall Resources"
  }
];


/*
   WIDGET CATEGORIES

   These categories control how widgets are grouped
   inside the widget menu.
*/
const categories = [
  "Study Resources",
  "Time Management",
  "Note Taking",
  "Active Recall Resources"
];

const noteColors = ["#FEF08A", "#F9A8D4", "#BAE6FD", "#BBF7D0", "#DDD6FE"];
function Dashboard()
/* State */
{
  // Controls whether the widget menu overlay is open or closed
  const [openMenu, setOpenMenu] = useState(false);

  // Stores the widget selected from the widget menu before placement
  const [selectedWidget, setSelectedWidget] = useState(null);

  const [noteText, setNoteText] = useState("");

  const [selectedNoteColor, setSelectedNoteColor] = useState("#FEF08A");


  // Stores all widgets currently placed on the dashboard canvas
  const [placedWidgets, setPlacedWidgets] = useState([]);


  // Tracks which placed widget is currently selected on the canvas
  const [activeWidgetId, setActiveWidgetId] = useState(null);


  // Tracks which widget is currently being dragged
  const [draggingId, setDraggingId] = useState(null);

 // Stores mouse offset so widgets do not jump while dragging
  const [offset, setOffset] = useState({ x: 0, y: 0 });

   // Enables snap-to-grid movement
  const [snapEnabled] = useState(true);

 




  /* 
     LOCAL STORAGE

     Loads saved dashboard widgets when the page opens.
 */

  useEffect(() => {
    const saved = localStorage.getItem("dashboard-widgets");
    if (saved) setPlacedWidgets(JSON.parse(saved));
  }, []);


  /*
     LOCAL STORAGE

     Saves dashboard widgets whenever placement, size,
     or position changes.
 */

  useEffect(() => {
    localStorage.setItem("dashboard-widgets", JSON.stringify(placedWidgets));
  }, [placedWidgets]);

   /* 
     DELETE WIDGET

     Removes a widget from the dashboard canvas.
   */

  const deleteWidget = (id) => {
    setPlacedWidgets((prev) => prev.filter((w) => w.instanceId !== id));
    if (activeWidgetId === id) setActiveWidgetId(null);
  };

  return (
    <div className="dashboard-container">
      {/* 
          CANVAS

          Main dashboard workspace where widgets are placed,
          dragged, resized, and managed.
    */}
      <div
        className={`canvas ${openMenu ? "blur" : ""}`}
          // Place selected widget on the canvas 
        
        onClick={(e) => {
          if (!selectedWidget) return;

          const rect = e.currentTarget.getBoundingClientRect();
          let x = e.clientX - rect.left;
          let y = e.clientY - rect.top;
          // Applies snap - to - grid placement 
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
              size: "medium",
              notes: selectedWidget.title == "Sticky Notes" ? [] : undefined
            }
          ]);

          

          setSelectedWidget(null);
          setOpenMenu(false);
        }}
         /* DRAG PLACED WIDGET */
        onMouseMove={(e) => {
          if (!draggingId) return;

          const rect = e.currentTarget.getBoundingClientRect();
          let x = e.clientX - rect.left - offset.x;
          let y = e.clientY - rect.top - offset.y;


          // Apply snap-to-grid movement
          if (snapEnabled) {
            const grid = 20;
            x = Math.round(x / grid) * grid;
            y = Math.round(y / grid) * grid;
          }

          setPlacedWidgets((prev) =>
            prev.map((w) =>
              w.instanceId === draggingId ? { ...w, x, y } : w
            )
          );
        }}
         /* END DRAG */
        onMouseUp={() => setDraggingId(null)}
      >
        <div className="add-button" onClick={() => setOpenMenu(true)}>
          +
        </div>
 {/* Render widgets that have been placed on the canvas */}
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
              /* SELECT WIDGET AND START DRAG */
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
            <h4>{w.icon} {w.title}</h4>

            {w.title === "Sticky Notes" && (
  <div className="sticky-notes-content">
    <textarea
      placeholder="Type your note..."
      value={noteText}
      onChange={(e) => setNoteText(e.target.value)}
      onMouseDown={(e) => e.stopPropagation()}
    />

    <button
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => {
        e.stopPropagation();

        if (!noteText.trim()) return;

        setPlacedWidgets((prev) =>
          prev.map((widget) =>
            widget.instanceId === w.instanceId
              ? {
                  ...widget,
                  notes: [
                    ...(widget.notes || []),
                    {
                      id: crypto.randomUUID(),
                      text: noteText,
                      color: selectedNoteColor
                    }
                  ]
                }
              : widget
          )
        );

        setNoteText("");
      }}
    >
      Add
    </button>
<div className="note-color-row">
  {noteColors.map((color) => (
    <button
      key={color}
      className={`note-color ${
        selectedNoteColor === color ? "selected" : ""
      }`}
      style={{ background: color }}
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => {
        e.stopPropagation();
        setSelectedNoteColor(color);
      }}
    />
  ))}
</div>


   <div className="notes-list">
  {(w.notes || []).map((note) => (
    <div
      key={note.id}
      className="note-card"
      style={{ background: note.color }}
    >
      <button
        className="delete-note-btn"
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => {
          e.stopPropagation();

          setPlacedWidgets((prev) =>
            prev.map((widget) =>
              widget.instanceId === w.instanceId
                ? {
                    ...widget,
                    notes: widget.notes.filter(
                      (n) => n.id !== note.id
                    )
                  }
                : widget
            )
          );
        }}
      >
        ×
      </button>

      {note.text}
    </div>
  ))}
</div>
  </div>
)}
             {/* Widget toolbar appears only when widget is active */}

            {activeWidgetId === w.instanceId && (
              <div className="widget-toolbar">
                <button onClick={() => deleteWidget(w.instanceId)}>
                  Delete
                </button>
              </div>
            )}
{/* Size controls for small, medium, and large widget states */}
            <div className="size-controls">
              {["small", "medium", "large"].map((size) => (
                <button
                  key={size}
                  onClick={(e) => {
                    e.stopPropagation();
                    setPlacedWidgets((prev) =>
                      prev.map((widget) =>
                        widget.instanceId === w.instanceId
                          ? { ...widget, size }
                          : widget
                      )
                    );
                  }}
                >
                  {size[0].toUpperCase()}
                </button>
              ))}
            </div>
          </div>
        ))}
 {/* Empty canvas hint */}
        {placedWidgets.length === 0 && (
          <div className="hint">Add your first widget</div>
        )}
      </div>

      {/*
          WIDGET MENU OVERLAY
      */}
      {openMenu && (
      <div className="overlay">
  <div className="widget-panel">

    {/* LEFT SIDEBAR */}
    <div className="widget-sidebar">

      <div className="sidebar-header">
        <h2>Add Widgets</h2>
        <p>Browse and add to your dashboard</p>
      </div>

      <input placeholder="Search widgets..." />

      <div className="sidebar-menu">
        <button className="sidebar-item active">
          All Widgets
        </button>

        <button className="sidebar-item">
          Time Management
        </button>

        <button className="sidebar-item">
          Study Resources
        </button>

        <button className="sidebar-item">
          Note Taking
        </button>

        <button className="sidebar-item">
          Active Recall
        </button>
      </div>

    </div>

   {/* RIGHT CONTENT AREA */}
<div className="widget-main">

  <div className="main-header">
    <h3>✨ Based on your goals</h3>

    <span onClick={() => setOpenMenu(false)}>
      ×
    </span>
  </div>

  <div className="category">
              <h3>✨ Based on your goals</h3>
 {/* Recommended widget section */}
              <div className="recommended-list">
                {widgets.slice(0, 3).map((w) => (
                  <div
                    key={w.id}
                    className={`recommended-card ${
                      selectedWidget?.id === w.id ? "active" : ""
                    }`}
                    onClick={() => setSelectedWidget(w)}
                  >
                    <div className="widget-preview">{w.icon}</div>

                    <div className="widget-content">
                      <h4>{w.title}</h4>
                      <p>{w.description}</p>
                    </div>

                    <button
                      className="quick-add"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedWidget(w);
                        setOpenMenu(false);
                      }}
                    >
                      + Add
                    </button>
                  </div>
                ))}
              </div>
            </div>
        {/* Category-based widget discovery grid */}
            
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
                        <div className="widget-preview">{w.icon}</div>

                        <div className="widget-content">
                          <h4>{w.title}</h4>
                          <p>{w.description}</p>
                        </div>

                        <button
                          className="quick-add small"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedWidget(w);
                            setOpenMenu(false);
                          }}
                        >
                          +
                        </button>
                      </div>
                    ))}
                  
                </div>
              </div>
            ))}
          </div>
        </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;