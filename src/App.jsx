import { useState } from "react";
import Dashboard from "./pages/Dashboard";
import NavBar from "./components/NavBar";

function AppShell({ children }) {
  const [currentWorkspace] = useState({ name: "My Workspace" });
  const [unreadCount] = useState(0);

  function openCommandPalette() {

    console.log("open command palette");
  }

  return (
    <div className="min-h-screen flex flex-col">
      <NavBar
        workspaceName={currentWorkspace.name}
        notificationCount={unreadCount}
        onSearch={openCommandPalette}
      />
      <main className="flex-1">{children}</main>
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