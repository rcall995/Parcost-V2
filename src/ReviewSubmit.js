import React, { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";
import BackButton from "./BackButton";
import ParcostHeader from "./components/ParcostHeader";

const BRAND_GRAY = "var(--brand-gray)";
const BRAND_BLUE = "var(--brand-blue)";
const BRAND_GREEN = "var(--brand-green)";

export default function ReviewSubmit({ user, sessionId, onSessionFinalized, onNavigate }) {
  const [loading, setLoading] = useState(true);
  const [sessionInfo, setSessionInfo] = useState(null);
  const [reviewData, setReviewData] = useState([]);
  const [locations, setLocations] = useState({});
  const [items, setItems] = useState({});

  useEffect(() => {
    if (!sessionId) return;
    setLoading(true);
    async function fetchAll() {
      // 1. Fetch session info
      const { data: session } = await supabase
        .from("inventory_sessions")
        .select("*")
        .eq("id", sessionId)
        .single();

      // 2. Fetch counts for this session
      const { data: counts } = await supabase
        .from("session_counts")
        .select("*")
        .eq("session_id", sessionId);

      // 3. Fetch all locations and items used
      const locationIds = [...new Set(counts.map((c) => c.location_id))];
      const itemIds = [...new Set(counts.map((c) => c.item_id))];

      const { data: locs } = await supabase
        .from("locations")
        .select("*")
        .in("id", locationIds);
      const { data: its } = await supabase
        .from("items")
        .select("*")
        .in("id", itemIds);

      // 4. Build lookup maps for locations/items
      const locMap = {};
      for (const loc of locs || []) locMap[loc.id] = loc;
      const itemMap = {};
      for (const itm of its || []) itemMap[itm.id] = itm;

      // 5. Group counts by location for review
      const grouped = {};
      for (const count of counts) {
        if (!grouped[count.location_id]) grouped[count.location_id] = [];
        grouped[count.location_id].push(count);
      }

      setSessionInfo(session);
      setReviewData(grouped);
      setLocations(locMap);
      setItems(itemMap);
      setLoading(false);
    }
    fetchAll();
  }, [sessionId]);

  async function handleFinalize() {
    setLoading(true);
    await supabase
      .from("inventory_sessions")
      .update({
        status: "finalized",
        ended_at: new Date().toISOString(),
      })
      .eq("id", sessionId);
    setLoading(false);
    if (onSessionFinalized) onSessionFinalized();
  }

  if (!sessionId) {
    return <div style={{ margin: 40, color: "#888" }}>No session selected.</div>;
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
        <h2 style={{ color: BRAND_BLUE, fontWeight: 800, textAlign: "center" }}>Review & Submit Inventory</h2>
        {loading ? (
          <p>Loading...</p>
        ) : (
          <>
            <div style={{ marginBottom: 24 }}>
              <strong>Session Type:</strong> {sessionInfo?.count_type} <br />
              <strong>Started At:</strong> {sessionInfo?.started_at && new Date(sessionInfo.started_at).toLocaleString()}
            </div>
            {Object.keys(reviewData).length === 0 ? (
              <div style={{ color: "#bd3131", fontWeight: 500 }}>
                No counts entered for this session.
              </div>
            ) : (
              Object.keys(reviewData).map((locId) => (
                <div key={locId} style={{ marginBottom: 30 }}>
                  <h3 style={{ marginBottom: 0 }}>{locations[locId]?.name || "Unknown Location"}</h3>
                  <table
                    style={{
                      width: "100%",
                      borderCollapse: "collapse",
                      background: "#fff",
                      boxShadow: "0 2px 10px #0001",
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
                      {reviewData[locId].map((row) => (
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
                </div>
              ))
            )}
            <button
              onClick={handleFinalize}
              disabled={loading || Object.keys(reviewData).length === 0}
              style={{
                background: BRAND_GREEN,
                color: "#fff",
                border: "none",
                borderRadius: 8,
                padding: "14px 36px",
                fontSize: 18,
                fontWeight: 700,
                cursor: loading ? "not-allowed" : "pointer",
                marginTop: 24,
                boxShadow: "0 1.5px 5px #0001",
                display: "block",
                marginLeft: "auto",
                marginRight: "auto"
              }}
            >
              {loading ? "Finalizing..." : "Finalize & Submit"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}