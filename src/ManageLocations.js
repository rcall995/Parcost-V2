import React, { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";
import ParcostHeader from "./components/ParcostHeader";

const BRAND_BLUE = "var(--brand-blue)";
const BRAND_GREEN = "var(--brand-green)";
const BRAND_WHITE = "#fff";
const CARD_BG = "#fff";
const GRAY_BG = "var(--brand-gray)";
const BTN_DANGER = "var(--brand-red, #bd3131)";

export default function ManageLocations({ user, onBackToDashboard }) {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [locationName, setLocationName] = useState("");
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(null);

  // Check role
  const [hasPermission, setHasPermission] = useState(false);
  useEffect(() => {
    async function fetchRole() {
      if (!user) return;
      // Assume user_roles table has user_id, role, and possibly business_id/restaurant_id
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .single();
      if (data && (data.role === "restaurant" || data.role === "owner" || data.role === "manager")) {
        setHasPermission(true);
      } else {
        setHasPermission(false);
      }
    }
    fetchRole();
  }, [user]);

  // Fetch locations
  useEffect(() => {
    if (!hasPermission) return;
    async function fetchLocations() {
      setLoading(true);
      const { data, error } = await supabase
        .from("locations")
        .select("*")
        .order("name", { ascending: true });
      if (data) setLocations(data);
      setLoading(false);
    }
    fetchLocations();
  }, [hasPermission]);

  async function handleAddLocation(e) {
    e.preventDefault();
    setAddError("");
    setAddLoading(true);
    if (!locationName.trim()) {
      setAddError("Location name cannot be empty");
      setAddLoading(false);
      return;
    }
    try {
      const { error } = await supabase
        .from("locations")
        .insert([{ name: locationName.trim() }]);
      if (error) throw error;
      setLocationName("");
      // Refresh locations
      const { data } = await supabase
        .from("locations")
        .select("*")
        .order("name", { ascending: true });
      if (data) setLocations(data);
    } catch (err) {
      setAddError(err.message || "Error adding location");
    }
    setAddLoading(false);
  }

  async function handleDeleteLocation(id) {
    setDeleteLoading(id);
    try {
      const { error } = await supabase
        .from("locations")
        .delete()
        .eq("id", id);
      if (error) throw error;
      setLocations(locations.filter(loc => loc.id !== id));
    } catch (err) {
      alert(err.message || "Error deleting location.");
    }
    setDeleteLoading(null);
  }

  // Restrict if not restaurant role
  if (!hasPermission)
    return (
      <div style={{
        minHeight: "100vh", background: GRAY_BG,
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        color: BRAND_BLUE, padding: "24px 6vw"
      }}>
        <ParcostHeader />
        <div style={{
          background: CARD_BG, borderRadius: 14, boxShadow: "0 2px 16px #0002",
          padding: "40px 30px", maxWidth: 420, width: "100%", textAlign: "center"
        }}>
          <h2 style={{ color: BRAND_BLUE, fontWeight: 900, fontSize: 24 }}>Access Denied</h2>
          <p style={{ marginTop: 14, color: "#444" }}>
            You do not have permission to manage locations.
          </p>
          <button
            onClick={onBackToDashboard}
            style={backBtnStyle}
          >← Back to Dashboard</button>
        </div>
      </div>
    );

  return (
    <div style={{ background: GRAY_BG, minHeight: "100vh", padding: "32px 0" }}>
      <ParcostHeader />
      <div style={{
        maxWidth: 530, margin: "0 auto", background: CARD_BG,
        borderRadius: 18, boxShadow: "0 2px 16px #0002", padding: "30px 32px"
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h1 style={{
            color: BRAND_BLUE,
            fontSize: 26,
            fontWeight: 900,
            marginBottom: 8,
            letterSpacing: "-0.02em"
          }}>Manage Locations</h1>
          <button
            onClick={onBackToDashboard}
            style={backBtnStyle}
          >← Back to Dashboard</button>
        </div>
        <form onSubmit={handleAddLocation} style={{ display: "flex", gap: 14, marginBottom: 22, marginTop: 10 }}>
          <input
            style={inputStyle}
            placeholder="New Location Name"
            value={locationName}
            onChange={e => setLocationName(e.target.value)}
            disabled={addLoading}
          />
          <button
            type="submit"
            disabled={addLoading}
            style={{
              background: BRAND_GREEN,
              color: BRAND_WHITE,
              fontWeight: 700,
              fontSize: 17,
              border: "none",
              borderRadius: 8,
              padding: "10px 22px",
              cursor: addLoading ? "not-allowed" : "pointer",
              boxShadow: "0 1px 4px #0001"
            }}>
            {addLoading ? "Adding..." : "Add"}
          </button>
        </form>
        {addError && <div style={{ color: BTN_DANGER, marginBottom: 10 }}>{addError}</div>}
        <div style={{ margin: "20px 0 4px 0", fontWeight: 600, fontSize: 18 }}>Current Locations</div>
        {loading ? (
          <div>Loading locations...</div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 17, background: "#fff" }}>
            <thead>
              <tr style={{ background: "#f4f8ff" }}>
                <th style={thStyle}>Name</th>
                <th style={thStyle}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {locations.map(loc => (
                <tr key={loc.id}>
                  <td style={tdStyle}>{loc.name}</td>
                  <td style={tdStyle}>
                    <button
                      onClick={() => handleDeleteLocation(loc.id)}
                      disabled={deleteLoading === loc.id}
                      style={{
                        background: BTN_DANGER,
                        color: "#fff",
                        border: "none",
                        borderRadius: 6,
                        padding: "6px 13px",
                        fontWeight: 600,
                        cursor: deleteLoading === loc.id ? "not-allowed" : "pointer"
                      }}>
                      {deleteLoading === loc.id ? "Deleting..." : "Delete"}
                    </button>
                  </td>
                </tr>
              ))}
              {locations.length === 0 && (
                <tr>
                  <td colSpan={2} style={{ color: "#888", padding: "17px 0", textAlign: "center" }}>
                    No locations yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

const inputStyle = {
  width: "100%",
  padding: "10px 12px",
  fontSize: 16,
  borderRadius: 6,
  border: "1.5px solid #e2e8f0",
  background: "#fafdff"
};
const thStyle = { textAlign: "left", padding: "7px 9px", fontWeight: 700, fontSize: 15, borderBottom: "2px solid #e6eafa" };
const tdStyle = { padding: "7px 9px", borderBottom: "1px solid #f0f0f0" };
const backBtnStyle = {
  background: BRAND_BLUE,
  color: "#fff",
  border: "none",
  borderRadius: 8,
  padding: "10px 18px",
  fontWeight: 700,
  fontSize: 16,
  cursor: "pointer",
  boxShadow: "0 1px 4px #0001",
  transition: "background 0.18s",
  marginLeft: 10
};