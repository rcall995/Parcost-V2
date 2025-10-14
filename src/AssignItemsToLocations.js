import React, { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";
import ParcostHeader from "./components/ParcostHeader";
import BackButton from "./BackButton";

export default function AssignItemsMatrix({ onNavigate }) {
  const [locations, setLocations] = useState([]);
  const [items, setItems] = useState([]);
  const [mapping, setMapping] = useState({}); // { [itemId]: Set(locationId) }
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Load all locations, items, and mapping
  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError("");
      // Fetch locations
      const { data: locs, error: locErr } = await supabase.from("locations").select("*").order("name", { ascending: true });
      if (locErr) { setError("Failed to load storage areas"); setLoading(false); return; }
      setLocations(locs);

      // Fetch items
      const { data: itms, error: itmErr } = await supabase.from("items").select("*").order("restaurant_nickname", { ascending: true });
      if (itmErr) { setError("Failed to load items"); setLoading(false); return; }
      setItems(itms);

      // Fetch location_map
      const { data: maps, error: mapErr } = await supabase.from("location_map").select("*");
      if (mapErr) { setError("Failed to load assignments"); setLoading(false); return; }

      // Build mapping: itemId => Set of locationIds
      const m = {};
      itms.forEach(item => { m[item.id] = new Set(); });
      (maps || []).forEach(row => {
        if (m[row.item_id]) m[row.item_id].add(row.location_id);
      });
      setMapping(m);

      setLoading(false);
    }
    fetchData();
  }, []);

  // Assign/unassign logic
  async function handleToggle(itemId, locationId, checked) {
    setSaving(true);
    setError("");
    let result;
    if (checked) {
      // Assign
      result = await supabase.from("location_map").insert({ item_id: itemId, location_id: locationId });
    } else {
      // Unassign
      result = await supabase.from("location_map").delete().eq("item_id", itemId).eq("location_id", locationId);
    }
    if (result.error) {
      setError("Failed to update: " + result.error.message);
    } else {
      setMapping(prev => {
        const newMap = { ...prev };
        const set = new Set(newMap[itemId]);
        if (checked) set.add(locationId);
        else set.delete(locationId);
        newMap[itemId] = set;
        return newMap;
      });
    }
    setSaving(false);
  }

  // Styling for sticky headers and table
  const tableStyle = {
    width: "100%",
    borderCollapse: "collapse",
    background: "#fff",
    boxShadow: "0 2px 10px #0001",
    borderRadius: 8,
    overflow: "hidden"
  };
  const thStyle = {
    background: "#f4f6fa",
    fontWeight: 700,
    fontSize: 16,
    padding: "14px 8px",
    border: "2px solid #dbe3ec",
    textAlign: "center",
    position: "sticky",
    top: 0,
    zIndex: 2
  };
  const tdStyle = {
    padding: "12px 8px",
    border: "1.5px solid #e2e8f0",
    fontSize: 15,
    background: "#fafdff",
    verticalAlign: "middle",
    textAlign: "center"
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--brand-gray)" }}>
      <ParcostHeader />
      <div style={{
        maxWidth: 1150,
        margin: "40px auto",
        background: "#fff",
        borderRadius: 12,
        boxShadow: "0 2px 12px #0001",
        padding: 32
      }}>
        <BackButton onClick={() => onNavigate("dashboard")} />
        <h2 style={{ color: "var(--brand-blue)", fontWeight: 800, textAlign: "center", marginBottom: 28 }}>
          Assign Items to Storage Areas
        </h2>
        {error && <div style={{ color: "#bd3131", margin: "12px 0" }}>{error}</div>}
        {loading
          ? <div>Loading...</div>
          : (
            <div style={{ overflowX: "auto", maxHeight: 550 }}>
              <table style={tableStyle}>
                <thead>
                  <tr>
                    <th style={{ ...thStyle, left: 0, zIndex: 3, background: "#f4f6fa" }}>Item</th>
                    {locations.map(loc => (
                      <th key={loc.id} style={thStyle}>{loc.name}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {items.map(item => (
                    <tr key={item.id}>
                      <td style={{ ...tdStyle, textAlign: "left", fontWeight: 600, position: "sticky", left: 0, background: "#fff", zIndex: 2 }}>
                        {item.restaurant_nickname}
                      </td>
                      {locations.map(loc => (
                        <td key={loc.id} style={tdStyle}>
                          <input
                            type="checkbox"
                            checked={!!mapping[item.id]?.has(loc.id)}
                            onChange={e => handleToggle(item.id, loc.id, e.target.checked)}
                            disabled={saving}
                            aria-label={`Assign ${item.restaurant_nickname} to ${loc.name}`}
                            style={{ width: 20, height: 20, accentColor: "var(--brand-blue)" }}
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        }
      </div>
    </div>
  );
}