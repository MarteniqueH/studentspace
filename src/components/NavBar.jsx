import React, { useState, useEffect, useRef } from "react";
import { Search, Bell, Pencil, ChevronDown, User } from "lucide-react";
import "../styles/NavBar.css";



export default function NavBar({
  workspaceName = "My Workspace",
  notificationCount = 3,
  userName = "Martenique Harmon",
  userImageUrl = null,
  onSearch = () => {},
  onEditWorkspace = () => {},
  onOpenNotifications = () => {},
  onOpenProfile = () => {},
  onSwitchWorkspace = () => {},
}) {
  const [isMac, setIsMac] = useState(true);
  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef(null);

  useEffect(() => {
    setIsMac(
      typeof navigator !== "undefined" &&
        /Mac|iPhone|iPod|iPad/.test(navigator.platform || navigator.userAgent)
    );
  }, []);

  useEffect(() => {
    function handleClick(e) {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotifOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  useEffect(() => {
    function handleKey(e) {
      const cmdKey = isMac ? e.metaKey : e.ctrlKey;
      if (cmdKey && e.key.toLowerCase() === "k") {
        e.preventDefault();
        onSearch();
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isMac, onSearch]);

  const initials = userName
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <nav className="navbar">
      {/* Left: logo + workspace */}
      <div className="navbar-left">
        <div className="navbar-brand">
          <div className="navbar-logo-mark">
            <span>S</span>
            <span className="navbar-logo-dot" />
          </div>
          <span className="navbar-wordmark">StudentSpace</span>
        </div>

        <span className="navbar-divider" />

        <button className="navbar-workspace" onClick={onSwitchWorkspace}>
          <span className="navbar-workspace-name">{workspaceName}</span>
          <ChevronDown size={14} strokeWidth={2.25} className="navbar-workspace-chevron" />
        </button>
      </div>

      {/* Center: search / command */}
      <div className="navbar-center">
        <button className="navbar-search" onClick={onSearch}>
          <Search size={16} strokeWidth={2} className="navbar-search-icon" />
          <span className="navbar-search-placeholder">Search StudentSpace</span>
          <span className="navbar-search-kbd">{isMac ? "⌘" : "Ctrl"}K</span>
        </button>
      </div>

      {/* Right: notifications, edit workspace, profile */}
      <div className="navbar-right">
        <div style={{ position: "relative" }} ref={notifRef}>
          <button
            className="navbar-icon-btn"
            aria-label="Notifications"
            onClick={() => {
              setNotifOpen((v) => !v);
              onOpenNotifications();
            }}
          >
            <Bell size={18} strokeWidth={1.75} />
            {notificationCount > 0 && (
              <span className="navbar-badge">
                {notificationCount > 9 ? "9+" : notificationCount}
              </span>
            )}
          </button>

          {notifOpen && (
            <div className="navbar-notif-dropdown">
              <p className="navbar-notif-title">Notifications</p>
              {notificationCount > 0 ? (
                <p className="navbar-notif-body">
                  You have {notificationCount} unread notification
                  {notificationCount === 1 ? "" : "s"}.
                </p>
              ) : (
                <p className="navbar-notif-empty">You're all caught up.</p>
              )}
            </div>
          )}
        </div>

        <button className="navbar-edit-btn" onClick={onEditWorkspace}>
          <Pencil size={14} strokeWidth={2} />
          Edit Workspace
        </button>

        <button className="navbar-avatar" aria-label="Profile" onClick={onOpenProfile}>
          {userImageUrl ? (
            <img src={userImageUrl} alt={userName} />
          ) : initials ? (
            <span>{initials}</span>
          ) : (
            <User size={16} color="white" />
          )}
        </button>
      </div>
    </nav>
  );
}
