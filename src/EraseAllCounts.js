import React, { useState } from "react";
import { supabase } from "./supabaseClient";
import BackButton from "./BackButton";
import ParcostHeader from "./components/ParcostHeader";

const BRAND_RED = "var(--brand-red, #bd3131)";
const BRAND_GRAY = "var(--brand-gray)";
const BRAND_BLUE = "var(--brand-blue)";
const BRAND_GREEN = "var(--brand-green)";

export default function EraseAllCounts({ onNavigate }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleEraseAll() {
    if (
      !window.confirm(
        "⚠️ This will permanently erase ALL inventory counts and sessions. Are you absolutely sure?"
      )
    )
      return;
    setLoading(true);
    setError("");
    setSuccess("");
    // Delete all from session_counts and inventory_sessions
    const { error: err1 } = await supabase.from("session_counts").delete().neq("id", "");
    const { error: err2 } = await supabase.from("inventory_sessions").delete().neq("id", "");
    if (err1 || err2) {
      setError(
        "Failed to erase all counts: " +
          [err1?.message, err2?.message].filter(Boolean).join("; ")
      );
    } else {
      setSuccess("All inventory counts and sessions have been erased.");
    }
    setLoading(false);
  }

  return (
    <div style={{ minHeight: "100vh", background: BRAND_GRAY }}>
      <ParcostHeader />
      <div style={{
        maxWidth: 600,
        margin: "40px auto",
        background: "#fff",
        borderRadius: 12,
        boxShadow: "0 2px 12px #0001",
        padding: 32
      }}>
        <BackButton onClick={() => onNavigate(null)} />
        <h2 style={{ color: BRAND_BLUE, fontWeight: 800, textAlign: "center" }}>
          Erase All Counts
        </h2>
        <div
          style={{
            marginBottom: 32,
            background: "#faf5f5",
            border: "1px solid #ffe4e6",
            borderRadius: 6,
            padding: 18,
            color: BRAND_RED,
            fontWeight: 500,
            fontSize: 16,
          }}
        >
          <strong>Warning:</strong> This will permanently erase <u>all</u> inventory counts and sessions. There is no undo.
        </div>
        <button
          onClick={handleEraseAll}
          disabled={loading}
          style={{
            background: BRAND_RED,
            color: "#fff",
            border: "none",
            borderRadius: 6,
            padding: "14px 36px",
            fontWeight: 700,
            fontSize: 17,
            marginBottom: 20,
            cursor: loading ? "not-allowed" : "pointer",
          }}
        >
          {loading ? "Erasing..." : "⚠️ ERASE ALL COUNTS"}
        </button>
        {error && <div style={{ color: BRAND_RED, fontWeight: 500 }}>{error}</div>}
        {success && <div style={{ color: BRAND_GREEN, fontWeight: 500 }}>{success}</div>}
      </div>
    </div>
  );
}