import React, { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";
import BackButton from "./BackButton";
import ParcostHeader from "./components/ParcostHeader";

const BRAND_RED = "var(--brand-red, #bd3131)";
const BRAND_GRAY = "var(--brand-gray)";
const BRAND_BLUE = "var(--brand-blue)";

export default function DeleteSnapshots({ onNavigate }) {
  const [snapshots, setSnapshots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    fetchSnapshots();
    // eslint-disable-next-line
  }, []);

  async function fetchSnapshots() {
    setLoading(true);
    setError("");
    setSuccess("");
    const { data, error } = await supabase
      .from("snapshots")
      .select("*")
      .order("timestamp", { ascending: false });
    if (error) {
      setError("Failed to load snapshots: " + error.message);
      setSnapshots([]);
    } else {
      setSnapshots(data || []);
    }
    setLoading(false);
  }

  async function deleteSnapshot(id) {
    if (!window.confirm("Are you sure you want to permanently delete this snapshot?")) return;
    setDeleting(true);
    setError("");
    setSuccess("");
    const { error } = await supabase.from("snapshots").delete().eq("id", id);
    if (error) {
      setError("Failed to delete snapshot: " + error.message);
    } else {
      setSuccess("Snapshot deleted.");
      fetchSnapshots();
    }
    setDeleting(false);
  }

  async function deleteAllSnapshots() {
    if (
      !window.confirm(
        "⚠️ This will permanently delete ALL snapshots. Are you absolutely sure?"
      )
    )
      return;
    setDeleting(true);
    setError("");
    setSuccess("");
    const { error } = await supabase.from("snapshots").delete().neq("id", ""); // deletes all
    if (error) {
      setError("Failed to delete all snapshots: " + error.message);
    } else {
      setSuccess("All snapshots deleted.");
      fetchSnapshots();
    }
    setDeleting(false);
  }

  return (
    <div style={{ minHeight: "100vh", background: BRAND_GRAY }}>
      <ParcostHeader />
      <div style={{
        maxWidth: 900,
        margin: "40px auto",
        background: "#fff",
        borderRadius: 12,
        boxShadow: "0 2px 12px #0001",
        padding: 32
      }}>
        <BackButton onClick={() => onNavigate(null)} />
        <h2 style={{ color: BRAND_BLUE, fontWeight: 800, textAlign: "center" }}>
          Delete Snapshots
        </h2>
        <div style={{
          marginBottom: 20,
          color: BRAND_RED,
          fontWeight: 500,
          background: "#faf5f5",
          border: "1px solid #ffe4e6",
          borderRadius: 6,
          padding: 15,
        }}>
          Warning: Deleting a snapshot is permanent and cannot be undone.
        </div>
        <button
          onClick={deleteAllSnapshots}
          disabled={deleting}
          style={{
            background: BRAND_RED,
            color: "#fff",
            border: "none",
            borderRadius: 6,
            padding: "10px 30px",
            fontWeight: 600,
            fontSize: 16,
            marginBottom: 24,
            cursor: deleting ? "not-allowed" : "pointer",
          }}
        >
          ⚠️ Delete ALL Snapshots
        </button>
        {error && <div style={{ color: BRAND_RED, marginBottom: 10 }}>{error}</div>}
        {success && <div style={{ color: "var(--brand-green)", marginBottom: 10 }}>{success}</div>}
        {loading ? (
          <p>Loading...</p>
        ) : snapshots.length === 0 ? (
          <p style={{ color: "#666" }}>No snapshots found.</p>
        ) : (
          <table style={{
            width: "100%",
            borderCollapse: "collapse",
            background: "#fff",
            boxShadow: "0 2px 10px #0001",
            borderRadius: 8,
            overflow: "hidden"
          }}>
            <thead>
              <tr>
                <th style={thStyle}>Timestamp</th>
                <th style={thStyle}>Type</th>
                <th style={thStyle}>Created By</th>
                <th style={thStyle}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {snapshots.map((snap) => (
                <tr key={snap.id}>
                  <td style={tdStyle}>
                    {snap.timestamp && new Date(snap.timestamp).toLocaleString()}
                  </td>
                  <td style={tdStyle}>{snap.count_type}</td>
                  <td style={tdStyle}>{snap.created_by}</td>
                  <td style={tdStyle}>
                    <button
                      onClick={() => deleteSnapshot(snap.id)}
                      disabled={deleting}
                      style={{
                        background: BRAND_RED,
                        color: "#fff",
                        border: "none",
                        borderRadius: 4,
                        padding: "6px 15px",
                        fontWeight: 500,
                        cursor: deleting ? "not-allowed" : "pointer",
                      }}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

const thStyle = {
  background: "#f4f6fa",
  fontWeight: 700,
  fontSize: 17,
  padding: "12px 10px",
  border: "2px solid #dbe3ec",
};
const tdStyle = {
  padding: "10px 12px",
  border: "1.5px solid #e2e8f0",
  fontSize: 16,
  background: "#fafdff",
  verticalAlign: "middle",
};