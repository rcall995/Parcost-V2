import React, { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";
import BackButton from "./BackButton";
import ParcostHeader from "./components/ParcostHeader";

const BRAND_GRAY = "var(--brand-gray)";
const BRAND_BLUE = "var(--brand-blue)";

export default function PreviousCounts({ user, onNavigate }) {
  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);
  const [counts, setCounts] = useState([]);
  const [locations, setLocations] = useState({});
  const [items, setItems] = useState({});

  // Fetch previous sessions (finalized only)
  useEffect(() => {
    async function fetchSessions() {
      setLoading(true);
      const { data } = await supabase
        .from("inventory_sessions")
        .select("*")
        .eq("status", "finalized")
        .order("ended_at", { ascending: false });
      setSessions(data || []);
      setLoading(false);
    }
    fetchSessions();
  }, []);

  // Fetch details for a selected session
  useEffect(() => {
    if (!selectedSession) {
      setCounts([]);
      setLocations({});
      setItems({});
      return;
    }
    setLoading(true);
    async function fetchDetails() {
      const { data: countsData } = await supabase
        .from("session_counts")
        .select("*")
        .eq("session_id", selectedSession.id);
      const locationIds = [...new Set((countsData || []).map((c) => c.location_id))];
      const itemIds = [...new Set((countsData || []).map((c) => c.item_id))];
      const { data: locs } = await supabase
        .from("locations")
        .select("*")
        .in("id", locationIds);
      const { data: its } = await supabase
        .from("items")
        .select("*")
        .in("id", itemIds);
      const locMap = {};
      for (const loc of locs || []) locMap[loc.id] = loc;
      const itemMap = {};
      for (const itm of its || []) itemMap[itm.id] = itm;
      setCounts(countsData || []);
      setLocations(locMap);
      setItems(itemMap);
      setLoading(false);
    }
    fetchDetails();
  }, [selectedSession]);

  return (
    <div style={{ minHeight: "100vh", background: BRAND_GRAY }}>
      <ParcostHeader />
      <div style={{
        maxWidth: 1000,
        margin: "40px auto",
        background: "#fff",
        borderRadius: 12,
        boxShadow: "0 2px 12px #0001",
        padding: 32
      }}>
        <BackButton onClick={() => onNavigate("dashboard")} />
        <h2 style={{ color: BRAND_BLUE, fontWeight: 800, textAlign: "center" }}>Previous Inventory Counts</h2>
        {loading ? (
          <p>Loading...</p>
        ) : (
          <>
            <div style={{ marginBottom: 32 }}>
              <label>
                <strong>Select Session:&nbsp;</strong>
                <select
                  value={selectedSession ? selectedSession.id : ""}
                  onChange={(e) => {
                    const sess = sessions.find((s) => s.id === e.target.value);
                    setSelectedSession(sess || null);
                  }}
                  style={{
                    border: "1.5px solid #e2e8f0",
                    borderRadius: 6,
                    padding: "10px 14px",
                    fontSize: "1rem",
                    minWidth: 140,
                    background: "var(--brand-gray)"
                  }}
                >
                  <option value="">-- Select a Session --</option>
                  {sessions.map((sess) => (
                    <option key={sess.id} value={sess.id}>
                      {sess.count_type} &mdash;{" "}
                      {sess.ended_at
                        ? new Date(sess.ended_at).toLocaleString()
                        : ""}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            {selectedSession && (
              <>
                <div style={{ marginBottom: 16 }}>
                  <strong>Session Type:</strong> {selectedSession.count_type} <br />
                  <strong>Started At:</strong>{" "}
                  {selectedSession.started_at && new Date(selectedSession.started_at).toLocaleString()} <br />
                  <strong>Ended At:</strong>{" "}
                  {selectedSession.ended_at && new Date(selectedSession.ended_at).toLocaleString()}
                </div>
                <table
                  style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    background: "#fff",
                    boxShadow: "0 2px 10px #0001",
                    marginBottom: 32,
                    borderRadius: 8,
                    overflow: "hidden"
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
                        Location
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
                        Nickname
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
                        Count
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {counts.map((row) => (
                      <tr key={row.id}>
                        <td
                          style={{
                            padding: "10px 12px",
                            border: "1.5px solid #e2e8f0",
                            fontSize: 16,
                            background: "#fafdff",
                            verticalAlign: "middle",
                          }}
                        >
                          {locations[row.location_id]?.name || row.location_id}
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
                          {items[row.item_id]?.restaurant_nickname || row.item_id}
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
                          {row.count}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}