import React from "react";

/**
 * Layout wrapper that composes top navigation, sidebar, and main content.
 */
// PUBLIC_INTERFACE
export function AppShell({ topNav, sidebar, sidebarOpen, children }) {
  return (
    <div className={`appShell ${sidebarOpen ? "sidebarOpen" : ""}`}>
      <div className="topNav" role="banner">
        {topNav}
      </div>

      <div className="contentWrap">
        {sidebar}
        <main className="main" role="main">
          {children}
        </main>
      </div>
    </div>
  );
}
