import { useState, useEffect, useRef } from "react";
import { saveFile, getFile, deleteFile} from "../utils/fileStorage";

import "../styles/dashboard.css";


import {
  
  FiClock,
  FiCalendar,
  FiBookOpen,
  FiEdit3,
          
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

/*
   Dashboard accepts optional editMode / onEditModeChange props so it can be
   controlled from a parent (e.g. the top NavBar's "Edit Workspace" / "Done"
   button). If not provided, it falls back to managing edit mode internally
   so the component still works standalone.
*/
function Dashboard({ editMode: editModeProp, onEditModeChange } = {})
/* State */
{
  // Controls whether the widget menu overlay is open or closed
  const [openMenu, setOpenMenu] = useState(false);

  // Stores the widget selected from the widget menu before placement
  const [selectedWidget, setSelectedWidget] = useState(null);

  const [noteText, setNoteText] = useState("");

  const [selectedNoteColor, setSelectedNoteColor] = useState("#FEF08A");
  
  
  const [calendarTitle, setCalendarTitle] = useState("");
const [calendarDate, setCalendarDate] = useState("");


  // Stores all widgets currently placed on the dashboard canvas
  const [placedWidgets, setPlacedWidgets] = useState([]);

  // Pomodoro timer state 

  const [pomodoroTime, setPomodoroTime] = useState(25 * 60);
const [pomodoroRunning, setPomodoroRunning] = useState(false);


  // Tracks which placed widget is currently selected on the canvas
  const [activeWidgetId, setActiveWidgetId] = useState(null);

  // Whether the dashboard is in Edit Workspace mode. Can be controlled by a
  // parent (via editModeProp/onEditModeChange) or managed locally.
  const [internalEditMode, setInternalEditMode] = useState(false);
  const editMode = editModeProp !== undefined ? editModeProp : internalEditMode;
  const setEditMode = onEditModeChange || setInternalEditMode;

  // Tracks the widget that was just added but not yet "confirmed" — its
  // size/delete controls stay visible until the student clicks elsewhere,
  // even outside of Edit Workspace mode.
  const [justPlacedId, setJustPlacedId] = useState(null);

  // A widget's editing controls (size + delete) and drag handle are active
  // whenever we're in Edit Workspace mode, or the widget was just placed
  // and hasn't been confirmed/settled yet.
  const isWidgetEditable = (instanceId) =>
    editMode || justPlacedId === instanceId;


  // Tracks which widget is currently being dragged
  const [draggingId, setDraggingId] = useState(null);

 // Stores mouse offset so widgets do not jump while dragging
  const [offset, setOffset] = useState({ x: 0, y: 0 });

   // Enables snap-to-grid movement
  const [snapEnabled] = useState(true);

  const [newFolderName, setNewFolderName] = useState(""); 
  const [activeFolderId, setActiveFolderId] = useState(null); 



  

 




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
     Exiting Edit Workspace mode should return the dashboard to a fully
     clean state: close the widget menu if it's open, and clear any
     lingering "just placed" / active selection so no editing controls
     remain visible.
  */
  useEffect(() => {
    if (!editMode) {
      setOpenMenu(false);
      setJustPlacedId(null);
      setActiveWidgetId(null);
    }
  }, [editMode]);


      //pomodoro countdown 
      useEffect(() => {
      if (!pomodoroRunning) return;

      const timer = setInterval(() => {
      setPomodoroTime((prevTime) => {
        if (prevTime <= 1) {
          setPomodoroRunning(false);
          return 0;
        }
        return prevTime - 1;
      });
      }, 1000);

      return () => clearInterval(timer);
      }, [pomodoroRunning]);
   /* 
     DELETE WIDGET

     Removes a widget from the dashboard canvas.
   */

  const deleteWidget = (id) => {
    setPlacedWidgets((prev) => prev.filter((w) => w.instanceId !== id));
    if (activeWidgetId === id) setActiveWidgetId(null);
    if (justPlacedId === id) setJustPlacedId(null);
  };
  const formatPomodoroTime = (seconds) => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(remainingSeconds).padStart(2, "0")}`;
};


const addFolder = (widgetInstanceId, folderName) => {
  if (!folderName.trim()) return;
  setPlacedWidgets((prev) =>
    prev.map((widget) =>
      widget.instanceId === widgetInstanceId
        ? {
            ...widget,
            folders: [
              ...(widget.folders || []),
              { id: crypto.randomUUID(), name: folderName, files: [] }
            ]
          }
        : widget
    )
  );
  setNewFolderName("");
};

const deleteFolder = (widgetInstanceId, folderId) => {
  // clean up any stored blobs first
  const widget = placedWidgets.find((w) => w.instanceId === widgetInstanceId);
  const folder = widget?.folders?.find((f) => f.id === folderId);
  folder?.files?.forEach((f) => deleteFile(f.id));

  setPlacedWidgets((prev) =>
    prev.map((widget) =>
      widget.instanceId === widgetInstanceId
        ? { ...widget, folders: widget.folders.filter((f) => f.id !== folderId) }
        : widget
    )
  );
};

const uploadFilesToFolder = async (widgetInstanceId, folderId, fileList) => {
  const files = Array.from(fileList);
  const saved = await Promise.all(files.map((f) => saveFile(f)));
  const fileMeta = saved.map(({ id, name, type, size }) => ({ id, name, type, size }));

  setPlacedWidgets((prev) =>
    prev.map((widget) =>
      widget.instanceId === widgetInstanceId
        ? {
            ...widget,
            folders: widget.folders.map((f) =>
              f.id === folderId ? { ...f, files: [...f.files, ...fileMeta] } : f
            )
          }
        : widget
    )
  );
};

const removeFileFromFolder = async (widgetInstanceId, folderId, fileId) => {
  await deleteFile(fileId);
  setPlacedWidgets((prev) =>
    prev.map((widget) =>
      widget.instanceId === widgetInstanceId
        ? {
            ...widget,
            folders: widget.folders.map((f) =>
              f.id === folderId
                ? { ...f, files: f.files.filter((file) => file.id !== fileId) }
                : f
            )
          }
        : widget
    )
  );
};

const openStoredFile = async (fileId) => {
  const record = await getFile(fileId);
  if (!record) return;
  const url = URL.createObjectURL(record.blob);
  window.open(url, "_blank");
  // revoke later so it doesn't leak memory
  setTimeout(() => URL.revokeObjectURL(url), 10000);
};
  return (
    <div className="dashboard-container">
      {/* 
          CANVAS

          Main dashboard workspace where widgets are placed,
          dragged, resized, and managed.
    */}
      <div
        className={`canvas ${openMenu ? "blur" : ""} ${editMode ? "edit-mode" : ""}`}
        style={
          editMode
            ? { outline: "2px dashed #4F46E5", outlineOffset: "-2px" }
            : undefined
        }
          // Place selected widget on the canvas 
        
        onClick={(e) => {
          if (selectedWidget) {
            const rect = e.currentTarget.getBoundingClientRect();
            let x = e.clientX - rect.left;
            let y = e.clientY - rect.top;
            // Applies snap - to - grid placement
            if (snapEnabled) {
              const grid = 20;
              x = Math.round(x / grid) * grid;
              y = Math.round(y / grid) * grid;
            }

            const newInstanceId = crypto.randomUUID();

            setPlacedWidgets([
              ...placedWidgets,
              {
                ...selectedWidget,
                instanceId: newInstanceId,
                x,
                y,
                size: "medium",
                notes: selectedWidget.title == "Sticky Notes" ? [] : undefined,
                events: selectedWidget.title == "Calendar" ? [] : undefined
              }
            ]);

            // Newly placed widgets stay temporarily editable (size + delete
            // controls visible, draggable) until the student clicks
            // elsewhere on the canvas to confirm placement.
            setActiveWidgetId(newInstanceId);
            setJustPlacedId(newInstanceId);

            setSelectedWidget(null);
            setOpenMenu(false);
            return;
          }

          // Clicking empty canvas space (not a widget) confirms/settles
          // whatever widget was just placed, hiding its controls.
          if (e.target === e.currentTarget) {
            setActiveWidgetId(null);
            setJustPlacedId(null);
          }
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
        {editMode && (
          <div className="add-button" onClick={() => setOpenMenu(true)}>
            +
          </div>
        )}
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
              /* SELECT WIDGET AND, IF EDITABLE, START DRAG */
            onMouseDown={(e) => {
              e.stopPropagation();
              setActiveWidgetId(w.instanceId);

              // Outside Edit Workspace mode (and once a newly placed widget
              // has settled), widgets are not draggable — the student only
              // interacts with the widget's own content.
              if (!isWidgetEditable(w.instanceId)) return;

              setDraggingId(w.instanceId);

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
          ? { ...widget, notes: widget.notes.filter((n) => n.id !== note.id) }
          : widget
      )
    );
  }}
>
  x
</button>

      {note.text}
    </div>
  ))}
</div>
  </div>
)}

{w.title === "Pomodoro Timer" && (
  <div className="pomodoro-content">
    <div className="pomodoro-time">
      {formatPomodoroTime(pomodoroTime)}
    </div>

    <div className="pomodoro-controls">
      <button
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => {
          e.stopPropagation();
          setPomodoroRunning((prev) => !prev);
        }}
      >
        {pomodoroRunning ? "Pause" : "Start"}
      </button>

      <button
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => {
          e.stopPropagation();
          setPomodoroRunning(false);
          setPomodoroTime(25 * 60);
        }}
      >
        Reset
      </button>
    </div>
  </div>
)}

{w.title === "Course Folders" && (
  <div className="course-folders-content">
    <div className="folder-create-row">
      <input
        type="text"
        placeholder="New course folder (e.g. CS 4200)"
        value={activeWidgetId === w.instanceId ? newFolderName : newFolderName}
        onChange={(e) => setNewFolderName(e.target.value)}
        onMouseDown={(e) => e.stopPropagation()}
      />
      <button
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => {
          e.stopPropagation();
          addFolder(w.instanceId, newFolderName);
        }}
      >
        + Folder
      </button>
    </div>

    <div className="folder-list">
      {(w.folders || []).map((folder) => (
        <div key={folder.id} className="course-folder">
          <div
            className="folder-header"
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              setActiveFolderId(activeFolderId === folder.id ? null : folder.id);
            }}
          >
            <span> {folder.name} ({folder.files.length})</span>
            <button
              className="delete-folder-btn"
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                deleteFolder(w.instanceId, folder.id);
              }}
            >
           x
            </button>
          </div>

          {activeFolderId === folder.id && (
            <div className="folder-body">
              <input
                type="file"
                multiple
                onMouseDown={(e) => e.stopPropagation()}
                onClick={(e) => e.stopPropagation()}
                onChange={(e) => {
                  if (e.target.files.length) {
                    uploadFilesToFolder(w.instanceId, folder.id, e.target.files);
                    e.target.value = ""; // allow re-uploading same filename
                  }
                }}
              />

              <div className="folder-files-list">
                {folder.files.map((file) => (
                  <div key={file.id} className="folder-file-row">
                    <span
                      className="file-name"
                      onMouseDown={(e) => e.stopPropagation()}
                      onClick={(e) => {
                        e.stopPropagation();
                        openStoredFile(file.id);
                      }}
                    >
                      {file.name}
                    </span>
                    <button
                      onMouseDown={(e) => e.stopPropagation()}
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFileFromFolder(w.instanceId, folder.id, file.id);
                      }}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  </div>
)}
{w.title === "Calendar" && (
  <div className="calendar-widget-content">
    <input
      type="text"
      placeholder="Event or deadline title"
      value={calendarTitle}
      onChange={(e) => setCalendarTitle(e.target.value)}
      onMouseDown={(e) => e.stopPropagation()}
    />

    <input
      type="date"
      value={calendarDate}
      onChange={(e) => setCalendarDate(e.target.value)}
      onMouseDown={(e) => e.stopPropagation()}
    />

    <button
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => {
        e.stopPropagation();

        if (!calendarTitle.trim() || !calendarDate) return;

        setPlacedWidgets((prev) =>
          prev.map((widget) =>
            widget.instanceId === w.instanceId
              ? {
                  ...widget,
                  events: [
                    ...(widget.events || []),
                    {
                      id: crypto.randomUUID(),
                      title: calendarTitle,
                      date: calendarDate
                    }
                  ]
                }
              : widget
          )
        );

        setCalendarTitle("");
        setCalendarDate("");
      }}
    >
      Add Event
    </button>

    <div className="calendar-events-list">
      {(w.events || []).map((event) => (
        <div key={event.id} className="calendar-event-card">
          <strong>{event.title}</strong>
          <span>{event.date}</span>
        </div>
      ))}
    </div>
  </div>
)}
             {/* Widget toolbar: visible in Edit Workspace mode, or
                 temporarily right after this widget was placed */}

            {isWidgetEditable(w.instanceId) && (
              <div className="widget-toolbar">
                <button onClick={() => deleteWidget(w.instanceId)}>
                  Delete
                </button>
              </div>
            )}
{/* Size controls: same visibility rule as the toolbar above — not
    permanently shown, only during Edit Workspace mode or right after
    initial placement, until confirmed. */}
            {isWidgetEditable(w.instanceId) && (
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
            )}
          </div>
        ))}
 {/* Empty canvas hint */}
        {placedWidgets.length === 0 && (
          <div className="hint">
            {editMode ? "Add your first widget" : "Enter Edit Workspace to add a widget"}
          </div>
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
