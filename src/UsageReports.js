import React, { useState } from "react";
import { supabase } from "./supabaseClient";
import BackButton from "./BackButton";

/**
 * UsageReport
 * Props:
 *   - onNavigate: function to go back to dashboard
 */
export default function UsageReport({ onNavigate }) {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState([]);
  const [itemsMap, setItemsMap] = useState({});
  const [error, setError] = useState("");

  async function handleGenerate(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setReport([]);
    setItemsMap({});

    // Get all finalized sessions in date range
    let { data: sessions, error: sessionErr } = await supabase
      .from("inventory_sessions")
      .select("id, ended_at")
      .eq("status", "finalized")
      .gte("ended_at", startDate)
      .lte("ended_at", endDate);
    if (sessionErr) {
      setError(sessionErr.message);
      setLoading(false);
      return;
    }
    if (!sessions || sessions.length < 2) {
      setError("Need at least two counts (sessions) to calculate usage.");
      setLoading(false);
      return;
    }
    // Sort by ended_at ascending
    sessions.sort((a, b) => new Date(a.ended_at) - new Date(b.ended_at));

    // Get first and last session in range
    const firstSession = sessions[0];
    const lastSession = sessions[sessions.length - 1];

    // Get counts for all items for both sessions
    let { data: firstCounts, error: fcErr } = await supabase
      .from("session_counts")
      .select("item_id, count")
      .eq("session_id", firstSession.id);
    let { data: lastCounts, error: lcErr } = await supabase
      .from("session_counts")
      .select("item_id, count")
      .eq("session_id", lastSession.id);

    if (fcErr || lcErr) {
      setError("Error fetching session data.");
      setLoading(false);
      return;
    }

    // Map counts by item_id
    const firstMap = {};
    (firstCounts || []).forEach((row) => {
      firstMap[row.item_id] = Number(row.count ?? 0);
    });
    const lastMap = {};
    (lastCounts || []).forEach((row) => {
      lastMap[row.item_id] = Number(row.count ?? 0);
    });

    // Compute usage for all items in either session
    const itemIds = Array.from(
      new Set([...Object.keys(firstMap), ...Object.keys(lastMap)])
    );
    // Fetch all item info
    let { data: items } = await supabase
      .from("items")
      .select("id, restaurant_nickname, price");
    const itemMap = {};
    (items || []).forEach((itm) => {
      itemMap[itm.id] = itm;
    });
    setItemsMap(itemMap);

    // Usage: previous count - current count
    const usageRows = itemIds.map((id) => {
      const prev = firstMap[id] ?? 0;
      const now = lastMap[id] ?? 0;
      const used = prev - now;
      const price = itemMap[id]?.price ?? 0;
      return {
        item_id: id,
        nickname: itemMap[id]?.restaurant_nickname || id,
        used,
        price,
        usage_cost: used * price,
      };
    });

    setReport(usageRows.filter((row) => row.used !== 0));
    setLoading(false);
  }

  return (
    <div style={{ maxWidth: 900, margin: "40px auto" }}>
      <BackButton onClick={() => onNavigate(null)} />
      <h2>Inventory Usage Report</h2>
      <form
        onSubmit={handleGenerate}
        style={{ marginBottom: 28, display: "flex", alignItems: "end", gap: 16 }}
      >
        <div>
          <label>
            Start Date:{" "}
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
            />
          </label>
        </div>
        <div>
          <label>
            End Date:{" "}
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              required
            />
          </label>
        </div>
        <button
          type="submit"
          style={{
            background: "#2d4669",
            color: "#fff",
            border: "none",
            borderRadius: 6,
            padding: "9px 30px",
            fontSize: 16,
            fontWeight: 600,
            cursor: loading ? "not-allowed" : "pointer",
          }}
          disabled={loading}
        >
          {loading ? "Generating..." : "Generate Report"}
        </button>
      </form>
      {error && (
        <div style={{ color: "#bd3131", marginBottom: 16, fontWeight: 500 }}>
          {error}
        </div>
      )}
      {report.length > 0 && (
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            background: "#fff",
            boxShadow: "0 2px 10px #0001",
          }}
        >
          <thead>
            <tr>
              <th
                style={{
                  background: "#f4f6fa",
                  fontWeight: 700,
                  fontSize: 17,
                  padding: "12px 10px",
                  border: "2px solid #dbe3ec",
                }}
              >
                Item Name
              </th>
              <th
                style={{
                  background: "#f4f6fa",
                  fontWeight: 700,
                  fontSize: 17,
                  padding: "12px 10px",
                  border: "2px solid #dbe3ec",
                }}
              >
                Quantity Used
              </th>
              <th
                style={{
                  background: "#f4f6fa",
                  fontWeight: 700,
                  fontSize: 17,
                  padding: "12px 10px",
                  border: "2px solid #dbe3ec",
                }}
              >
                Usage Cost
              </th>
            </tr>
          </thead>
          <tbody>
            {report.map((row) => (
              <tr key={row.item_id}>
                <td
                  style={{
                    padding: "10px 12px",
                    border: "1.5px solid #e2e8f0",
                    fontSize: 16,
                    background: "#fafdff",
                    verticalAlign: "middle",
                  }}
                >
                  {row.nickname}
                </td>
                <td
                  style={{
                    padding: "10px 12px",
                    border: "1.5px solid #e2e8f0",
                    fontSize: 16,
                    background: "#fafdff",
                    verticalAlign: "middle",
                  }}
                >
                  {row.used}
                </td>
                <td
                  style={{
                    padding: "10px 12px",
                    border: "1.5px solid #e2e8f0",
                    fontSize: 16,
                    background: "#fafdff",
                    verticalAlign: "middle",
                  }}
                >
                  ${row.usage_cost.toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {report.length === 0 && !loading && !error && (
        <div style={{ marginTop: 24, color: "#888" }}>
          No usage data available for the selected date range.
        </div>
      )}
    </div>
  );
}