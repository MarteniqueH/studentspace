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

// Backend URL for the AI Notes / Flashcard & Quiz Generator. Override with
// VITE_API_BASE_URL in your .env for a deployed backend.
const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

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

const [calendarViewDate, setCalendarViewDate] = useState(new Date());
const [selectedCalendarDate, setSelectedCalendarDate] = useState(null);
const [hoveredCalendarDate, setHoveredCalendarDate] = useState(null);


 // Stores mouse offset so widgets do not jump while dragging
  const [offset, setOffset] = useState({ x: 0, y: 0 });

   // Enables snap-to-grid movement
  const [snapEnabled] = useState(true);

  const [newFolderName, setNewFolderName] = useState(""); 
  const [activeFolderId, setActiveFolderId] = useState(null); 

  // Transient, per-widget-instance UI state for the AI Notes / Flashcard &
  // Quiz Generator widget (draft text, selected file, loading/error, and
  // in-progress flashcard/quiz navigation). Keyed by instanceId so multiple
  // AI Flashcards widgets on the canvas don't interfere with each other.
  // Generated results themselves (w.studyMaterial) are persisted on the
  // widget and saved to localStorage like everything else; this state is
  // not persisted and resets on reload.
  const [aiWidgetState, setAiWidgetState] = useState({});

  const getAiState = (instanceId) => aiWidgetState[instanceId] || {};

  const updateAiState = (instanceId, patch) => {
    setAiWidgetState((prev) => ({
      ...prev,
      [instanceId]: { ...prev[instanceId], ...patch },
    }));
  };



  

 




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

/*
   AI NOTES / FLASHCARD & QUIZ GENERATOR

   Sends whatever the student provided (pasted text or an uploaded
   PDF/.txt file) to the backend, which extracts the text and calls the
   AI model to produce flashcards + a quiz. The result is stored on the
   widget itself so it persists like any other widget content.
*/

const handleGenerateStudyMaterial = async (instanceId) => {
  const state = getAiState(instanceId);

  if (!state.file && !(state.draftText || "").trim()) {
    updateAiState(instanceId, { error: "Paste some notes or choose a file first." });
    return;
  }

  updateAiState(instanceId, { loading: true, error: null });

  try {
    const formData = new FormData();
    if (state.file) formData.append("file", state.file);
    if (state.draftText) formData.append("text", state.draftText);

    const response = await fetch(`${API_BASE}/api/generate-study-material`, {
      method: "POST",
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data?.error || "Generation failed. Try again.");
    }

    setPlacedWidgets((prev) =>
      prev.map((widget) =>
        widget.instanceId === instanceId
          ? {
              ...widget,
              studyMaterial: data,
              sourceFileName: state.file ? state.file.name : "Pasted notes",
            }
          : widget
      )
    );

    updateAiState(instanceId, {
      loading: false,
      error: null,
      file: null,
      draftText: "",
      activeTab: "flashcards",
      flashcardIndex: 0,
      flashcardFlipped: false,
      quizIndex: 0,
      quizSelections: {},
    });
  } catch (err) {
    updateAiState(instanceId, {
      loading: false,
      error: err.message || "Something went wrong generating study material.",
    });
  }
};

const clearStudyMaterial = (instanceId) => {
  setPlacedWidgets((prev) =>
    prev.map((widget) =>
      widget.instanceId === instanceId
        ? { ...widget, studyMaterial: null, sourceFileName: null }
        : widget
    )
  );
  updateAiState(instanceId, {
    file: null,
    draftText: "",
    error: null,
    flashcardIndex: 0,
    flashcardFlipped: false,
    quizIndex: 0,
    quizSelections: {},
  });
};

const renderFlashcards = (w) => {
  const cards = w.studyMaterial?.flashcards || [];
  const state = getAiState(w.instanceId);
  const index = Math.min(state.flashcardIndex || 0, Math.max(cards.length - 1, 0));
  const flipped = !!state.flashcardFlipped;
  const card = cards[index];

  if (!card) return <p className="ai-notes-empty">No flashcards were generated.</p>;

  return (
    <div className="flashcard-viewer">
      <div
        className={`flashcard ${flipped ? "flipped" : ""}`}
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => {
          e.stopPropagation();
          updateAiState(w.instanceId, { flashcardFlipped: !flipped });
        }}
      >
        <span className="flashcard-label">{flipped ? "Answer" : "Question"}</span>
        <p>{flipped ? card.back : card.front}</p>
        <span className="flashcard-hint">Tap to flip</span>
      </div>

      <div className="flashcard-nav">
        <button
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            updateAiState(w.instanceId, {
              flashcardIndex: Math.max(0, index - 1),
              flashcardFlipped: false,
            });
          }}
          disabled={index === 0}
        >
          ←
        </button>
        <span>
          {index + 1} / {cards.length}
        </span>
        <button
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            updateAiState(w.instanceId, {
              flashcardIndex: Math.min(cards.length - 1, index + 1),
              flashcardFlipped: false,
            });
          }}
          disabled={index === cards.length - 1}
        >
          →
        </button>
      </div>
    </div>
  );
};

const renderQuiz = (w) => {
  const questions = w.studyMaterial?.quiz || [];
  const state = getAiState(w.instanceId);
  const index = state.quizIndex || 0;
  const selections = state.quizSelections || {};
  const question = questions[index];
  const finished = index >= questions.length && questions.length > 0;

  if (finished) {
    const correctCount = questions.filter(
      (q) => selections[q.id] === q.correctOptionId
    ).length;

    return (
      <div className="quiz-complete">
        <p>
          You scored {correctCount} / {questions.length}
        </p>
        <button
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            updateAiState(w.instanceId, { quizIndex: 0, quizSelections: {} });
          }}
        >
          Retake Quiz
        </button>
      </div>
    );
  }

  if (!question) return <p className="ai-notes-empty">No quiz questions were generated.</p>;

  const selectedOptionId = selections[question.id];

  return (
    <div className="quiz-viewer">
      <p className="quiz-progress">
        Question {index + 1} of {questions.length}
      </p>
      <p className="quiz-question">{question.question}</p>

      <div className="quiz-options">
        {question.options.map((opt) => {
          const isSelected = selectedOptionId === opt.id;
          const showResult = !!selectedOptionId;
          const isCorrect = opt.id === question.correctOptionId;

          return (
            <button
              key={opt.id}
              className={`quiz-option ${isSelected ? "selected" : ""} ${
                showResult && isCorrect ? "correct" : ""
              } ${showResult && isSelected && !isCorrect ? "incorrect" : ""}`}
              disabled={!!selectedOptionId}
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                updateAiState(w.instanceId, {
                  quizSelections: { ...selections, [question.id]: opt.id },
                });
              }}
            >
              {opt.text}
            </button>
          );
        })}
      </div>

      {selectedOptionId && (
        <>
          <p className="quiz-explanation">{question.explanation}</p>
          <button
            className="quiz-next-btn"
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              updateAiState(w.instanceId, { quizIndex: index + 1 });
            }}
          >
            {index + 1 === questions.length ? "See Results" : "Next Question"}
          </button>
        </>
      )}
    </div>
  );
};
const formatCalendarDate = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const getCalendarEventsForDate = (events, date) => {
  const dateKey = formatCalendarDate(date);

  return (events || []).filter(
    (event) => event.date === dateKey
  );
};

const changeCalendarMonth = (amount) => {
  setCalendarViewDate((current) => {
    return new Date(
      current.getFullYear(),
      current.getMonth() + amount,
      1
    );
  });

  setSelectedCalendarDate(null);
  setHoveredCalendarDate(null);
};

const goToCalendarToday = () => {
  const now = new Date();

  setCalendarViewDate(
    new Date(now.getFullYear(), now.getMonth(), 1)
  );

  setSelectedCalendarDate(formatCalendarDate(now));
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
    {/* Create folder */}
    <div className="folder-create-row">
      <div className="folder-input-wrapper">
        <span className="folder-input-icon">📁</span>
        <input
          type="text"
          placeholder="New course folder..."
          value={newFolderName}
          onChange={(e) => setNewFolderName(e.target.value)}
          onMouseDown={(e) => e.stopPropagation()}
          onKeyDown={(e) => {
            if (e.key === "Enter" && newFolderName.trim()) {
              addFolder(w.instanceId, newFolderName);
            }
          }}
        />
      </div>

      <button
        className="create-folder-btn"
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => {
          e.stopPropagation();
          addFolder(w.instanceId, newFolderName);
        }}
      >
        <span>+</span>
        New Folder
      </button>
    </div>

    {/* Folder list */}
    <div className="folder-list">
      {(w.folders || []).length === 0 ? (
        <div className="empty-folders">
          <div className="empty-folder-icon">📂</div>
          <div className="empty-folder-title">No course folders yet</div>
          <div className="empty-folder-subtitle">
            Create a folder to organize your course files.
          </div>
        </div>
      ) : (
        (w.folders || []).map((folder) => {
          const isOpen = activeFolderId === folder.id;

          return (
            <div
              key={folder.id}
              className={`course-folder ${isOpen ? "folder-open" : ""}`}
            >
              {/* Folder header */}
              <div
                className="folder-header"
                onMouseDown={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveFolderId(
                    activeFolderId === folder.id ? null : folder.id
                  );
                }}
              >
                <div className="folder-info">
                  <div className="folder-icon">
                    {isOpen ? "📂" : "📁"}
                  </div>

                  <div className="folder-text">
                    <span className="folder-name">{folder.name}</span>
                    <span className="folder-count">
                      {folder.files.length}{" "}
                      {folder.files.length === 1 ? "file" : "files"}
                    </span>
                  </div>
                </div>

                <div className="folder-actions">
                  <span className={`folder-chevron ${isOpen ? "open" : ""}`}>
                    ›
                  </span>

                  <button
                    className="delete-folder-btn"
                    title="Delete folder"
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteFolder(w.instanceId, folder.id);
                    }}
                  >
                    ×
                  </button>
                </div>
              </div>

              {/* Folder contents */}
              {isOpen && (
                <div className="folder-body">
                  {/* Upload area */}
                  <label
                    className="folder-upload-area"
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="upload-icon">↑</div>

                    <div className="upload-text">
                      <strong>Upload files</strong>
                      <span>Drop files here or click to browse</span>
                    </div>

                    <input
                      type="file"
                      multiple
                      onMouseDown={(e) => e.stopPropagation()}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => {
                        if (e.target.files.length) {
                          uploadFilesToFolder(
                            w.instanceId,
                            folder.id,
                            e.target.files
                          );
                          e.target.value = "";
                        }
                      }}
                    />
                  </label>

                  {/* Files */}
                  {folder.files.length > 0 ? (
                    <div className="folder-files-list">
                      <div className="files-section-label">
                        Files
                      </div>

                      {folder.files.map((file) => (
                        <div
                          key={file.id}
                          className="folder-file-row"
                          onMouseDown={(e) => e.stopPropagation()}
                        >
                          <div
                            className="file-main"
                            onClick={(e) => {
                              e.stopPropagation();
                              openStoredFile(file.id);
                            }}
                          >
                            <div className="file-icon">📄</div>

                            <div className="file-info">
                              <span className="file-name">
                                {file.name}
                              </span>
                              <span className="file-action-hint">
                                Click to open
                              </span>
                            </div>
                          </div>

                          <button
                            className="remove-file-btn"
                            title="Remove file"
                            onMouseDown={(e) => e.stopPropagation()}
                            onClick={(e) => {
                              e.stopPropagation();
                              removeFileFromFolder(
                                w.instanceId,
                                folder.id,
                                file.id
                              );
                            }}
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="empty-folder-files">
                      <span>📄</span>
                      <p>This folder is empty</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  </div>
)}

{w.title === "Calendar" && (
  <div className="calendar-widget-content">

    {/* Add event */}
    <div className="calendar-add-event">
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
                        title: calendarTitle.trim(),
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
        + Add Event
      </button>
    </div>

    {/* Calendar */}
    <div className="mini-calendar">

      {/* Month header */}
      <div className="calendar-header">
        <button
          className="calendar-nav-btn"
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            changeCalendarMonth(-1);
          }}
        >
          ‹
        </button>

        <div className="calendar-month-title">
          <strong>
            {calendarViewDate.toLocaleString("default", {
              month: "long"
            })}
          </strong>

          <span>
            {calendarViewDate.getFullYear()}
          </span>
        </div>

        <button
          className="calendar-nav-btn"
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            changeCalendarMonth(1);
          }}
        >
          ›
        </button>
      </div>

      {/* Today */}
      <button
        className="calendar-today-btn"
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => {
          e.stopPropagation();
          goToCalendarToday();
        }}
      >
        Today
      </button>

      {/* Weekdays */}
      <div className="calendar-weekdays">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(
          (day) => (
            <div
              key={day}
              className="calendar-weekday"
            >
              {day}
            </div>
          )
        )}
      </div>

      {/* Calendar days */}
      <div className="calendar-grid">

        {/* Empty spaces before first day */}
        {Array.from(
          {
            length: new Date(
              calendarViewDate.getFullYear(),
              calendarViewDate.getMonth(),
              1
            ).getDay()
          },
          (_, index) => (
            <div
              key={`empty-${index}`}
              className="calendar-day empty"
            />
          )
        )}

        {/* Actual days */}
        {Array.from(
          {
            length: new Date(
              calendarViewDate.getFullYear(),
              calendarViewDate.getMonth() + 1,
              0
            ).getDate()
          },
          (_, index) => {
            const day = index + 1;

            const date = new Date(
              calendarViewDate.getFullYear(),
              calendarViewDate.getMonth(),
              day
            );

            const dateKey = formatCalendarDate(date);

            const dayEvents = getCalendarEventsForDate(
              w.events,
              date
            );

            const hasEvents = dayEvents.length > 0;

            const todayKey = formatCalendarDate(
              new Date()
            );

            const isToday = dateKey === todayKey;

            const isSelected =
              selectedCalendarDate === dateKey;

            const isHovered =
              hoveredCalendarDate === dateKey;

            return (
              <div
                key={dateKey}
                className={[
                  "calendar-day",
                  isToday ? "today" : "",
                  hasEvents ? "has-events" : "",
                  isSelected ? "selected" : ""
                ].join(" ")}
                onMouseDown={(e) => e.stopPropagation()}
                onMouseEnter={() => {
                  if (hasEvents) {
                    setHoveredCalendarDate(dateKey);
                  }
                }}
                onMouseLeave={() => {
                  setHoveredCalendarDate(null);
                }}
                onClick={(e) => {
                  e.stopPropagation();

                  setSelectedCalendarDate(
                    isSelected ? null : dateKey
                  );
                }}
              >

                {/* Day number */}
                <span className="calendar-day-number">
                  {day}
                </span>

                {/* Small event indicator */}
                {hasEvents && (
                  <span className="calendar-event-dot" />
                )}

                {/* Hover event details */}
                {isHovered && hasEvents && (
                  <div
                    className="calendar-event-tooltip"
                    onMouseDown={(e) => e.stopPropagation()}
                  >
                    <div className="tooltip-date">
                      {date.toLocaleDateString("default", {
                        month: "short",
                        day: "numeric"
                      })}
                    </div>

                    {dayEvents.map((event) => (
                      <div
                        key={event.id}
                        className="tooltip-event"
                      >
                        <span className="tooltip-event-dot" />
                        <span>{event.title}</span>
                      </div>
                    ))}
                  </div>
                )}

              </div>
            );
          }
        )}

      </div>

      {/* Selected date details */}
      {selectedCalendarDate && (
        <div className="selected-date-events">

          <div className="selected-date-header">
            <div>
              <span className="selected-date-label">
                Events
              </span>

              <strong>
                {new Date(
                  `${selectedCalendarDate}T00:00:00`
                ).toLocaleDateString("default", {
                  weekday: "long",
                  month: "long",
                  day: "numeric"
                })}
              </strong>
            </div>

            <button
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                setSelectedCalendarDate(null);
              }}
            >
              ×
            </button>
          </div>

          {getCalendarEventsForDate(
            w.events,
            new Date(`${selectedCalendarDate}T00:00:00`)
          ).length > 0 ? (

            <div className="selected-events-list">

              {getCalendarEventsForDate(
                w.events,
                new Date(`${selectedCalendarDate}T00:00:00`)
              ).map((event) => (

                <div
                  key={event.id}
                  className="selected-event"
                >
                  <span className="selected-event-dot" />

                  <div className="selected-event-info">
                    <strong>{event.title}</strong>
                    <span>{event.date}</span>
                  </div>
                </div>

              ))}

            </div>

          ) : (

            <div className="no-events-message">
              No events scheduled for this date.
            </div>

          )}

        </div>
      )}

    </div>
  </div>
)}



{w.title === "AI Flashcards" && (
  <div className="ai-notes-content">
    {!w.studyMaterial ? (
      <div className="ai-notes-upload">
        <textarea
          placeholder="Paste your notes here, or upload a PDF/.txt file below..."
          value={getAiState(w.instanceId).draftText || ""}
          onChange={(e) => updateAiState(w.instanceId, { draftText: e.target.value })}
          onMouseDown={(e) => e.stopPropagation()}
        />

        <label className="ai-notes-file-label" onMouseDown={(e) => e.stopPropagation()}>
          <span>{getAiState(w.instanceId).file ? getAiState(w.instanceId).file.name : "Choose PDF or .txt file"}</span>
          <input
            type="file"
            accept=".pdf,.txt,text/plain,application/pdf"
            onClick={(e) => e.stopPropagation()}
            onChange={(e) => {
              const file = e.target.files[0] || null;
              updateAiState(w.instanceId, { file, error: null });
            }}
          />
        </label>

        {getAiState(w.instanceId).error && (
          <p className="ai-notes-error">{getAiState(w.instanceId).error}</p>
        )}

        <button
          className="ai-notes-generate-btn"
          disabled={getAiState(w.instanceId).loading}
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            handleGenerateStudyMaterial(w.instanceId);
          }}
        >
          {getAiState(w.instanceId).loading ? "Generating..." : "Generate Flashcards & Quiz"}
        </button>
      </div>
    ) : (
      <div className="ai-notes-results">
        <div className="ai-notes-results-header">
          <span className="ai-notes-source">{w.sourceFileName}</span>
          <button
            className="ai-notes-reset-btn"
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              clearStudyMaterial(w.instanceId);
            }}
          >
            Upload New Material
          </button>
        </div>

        <div className="ai-notes-tabs">
          <button
            className={`ai-notes-tab ${getAiState(w.instanceId).activeTab !== "quiz" ? "active" : ""}`}
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              updateAiState(w.instanceId, { activeTab: "flashcards" });
            }}
          >
            Flashcards ({(w.studyMaterial.flashcards || []).length})
          </button>
          <button
            className={`ai-notes-tab ${getAiState(w.instanceId).activeTab === "quiz" ? "active" : ""}`}
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              updateAiState(w.instanceId, { activeTab: "quiz" });
            }}
          >
            Quiz ({(w.studyMaterial.quiz || []).length})
          </button>
        </div>

        {getAiState(w.instanceId).activeTab === "quiz" ? renderQuiz(w) : renderFlashcards(w)}
      </div>
    )}
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
                {[ "medium", "large"].map((size) => (
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
                    {size[0].toUpperCase() + size.slice(1)}
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