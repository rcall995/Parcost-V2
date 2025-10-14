import React, { useState } from "react";
import { supabase } from "./supabaseClient";
import BackButton from "./BackButton";
import ParcostHeader from "./components/ParcostHeader";

const FREQUENCIES = ["Daily", "Weekly", "Monthly"];

export default function StartCount({ user, onNavigate, onSessionStarted }) {
  const [frequency, setFrequency] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleStartCount(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    if (!frequency) {
      setError("Please select a frequency.");
      setLoading(false);
      return;
    }
    const insertObj = {
      count_type: frequency,
      status: "in_progress"
    };
    // Use user_id if present
    if (user?.id) insertObj.user_id = user.id;

    const { data, error } = await supabase
      .from("inventory_sessions")
      .insert([insertObj])
      .select()
      .single();

    setLoading(false);
    if (error || !data) {
      setError(error?.message || "Failed to create session.");
      return;
    }
    if (onSessionStarted) onSessionStarted(data.id);
    else if (onNavigate) onNavigate("count", data.id);
  }

  return (
    <div style={{ background: "var(--brand-gray, #fafdff)", minHeight: "100vh" }}>
      <ParcostHeader />
      <div style={{ maxWidth: 420, margin: "40px auto", background: "#fff", borderRadius: 12, boxShadow: "0 2px 12px #0001", padding: 32 }}>
        <BackButton onClick={() => onNavigate("dashboard")} />
        <h2 style={{ color: "var(--brand-blue)", fontWeight: 800, textAlign: "center", marginBottom: 28 }}>
          Start New Inventory Count
        </h2>
        <form onSubmit={handleStartCount} style={{ marginTop: 0 }}>
          <div style={{ marginBottom: 20 }}>
            <label style={{ fontWeight: 500, display: "block", marginBottom: 8 }}>
              Select Count Frequency:
            </label>
            <div>
              {FREQUENCIES.map((freq) => (
                <div key={freq} style={{ display: "flex", alignItems: "center", marginBottom: 10 }}>
                  <span style={{ width: 90 }}>{freq}</span>
                  <input
                    type="radio"
                    name="frequency"
                    value={freq}
                    checked={frequency === freq}
                    onChange={() => setFrequency(freq)}
                    style={{ marginLeft: 16, accentColor: "var(--brand-blue)" }}
                  />
                </div>
              ))}
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            style={{
              background: "var(--brand-green)",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              fontWeight: 700,
              fontSize: 17,
              width: 180,
              boxShadow: "0 1.5px 5px #0001",
              display: "block",
              marginLeft: "auto",
              marginRight: "auto",
              marginTop: 22,
              padding: "13px 0",
              cursor: loading ? "not-allowed" : "pointer",
              transition: "background .18s"
            }}
          >
            {loading ? "Starting..." : "Start Count"}
          </button>
          {error && (
            <div style={{ marginTop: 16, color: "var(--brand-red, #bd3131)", fontWeight: 500, textAlign: "center" }}>{error}</div>
          )}
        </form>
      </div>
    </div>
  );
}