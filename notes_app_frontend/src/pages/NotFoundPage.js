import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/Button";

// PUBLIC_INTERFACE
export function NotFoundPage() {
  const nav = useNavigate();
  return (
    <section className="panel">
      <div className="panelHeader">
        <h1 className="h1">Page not found</h1>
        <div className="muted" style={{ marginTop: 6 }}>
          The page you requested doesn’t exist.
        </div>
      </div>
      <div className="panelBody">
        <Button variant="primary" onClick={() => nav("/notes")}>
          Go to notes
        </Button>
      </div>
    </section>
  );
}
