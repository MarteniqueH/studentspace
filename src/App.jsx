import { useState, cloneElement } from "react";
import Dashboard from "./pages/Dashboard";
import NavBar from "./components/NavBar";

function AppShell({ children }) {
  const [currentWorkspace] = useState({ name: "My Workspace" });
  const [unreadCount] = useState(0);

  // Lifted here so the NavBar's Edit Workspace / Done button and the
  // Dashboard's widget editing controls stay in sync.
  const [editMode, setEditMode] = useState(false);

  function openCommandPalette() {
    // wire this up to whatever search/command UI you build later
    console.log("open command palette");
  }

  return (
    <div className="app-shell">
      <NavBar
        workspaceName={currentWorkspace.name}
        notificationCount={unreadCount}
        onSearch={openCommandPalette}
        editMode={editMode}
        onToggleEditMode={() => setEditMode((v) => !v)}
      />
      <main className="app-main">
        {cloneElement(children, { editMode, onEditModeChange: setEditMode })}
      </main>
    </div>
  );
}

function App() {
  return (
    <AppShell>
      <Dashboard />
    </AppShell>
  );
}

export default App;
