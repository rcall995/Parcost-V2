import React, { useEffect, useState, useRef } from "react";
import { supabase } from "./supabaseClient";
import ParcostHeader from "./components/ParcostHeader";

const BRAND_BLUE = "var(--brand-blue)";
const BRAND_GREEN = "var(--brand-green)";
const BRAND_WHITE = "#fff";
const CARD_BG = "#fff";
const GRAY_BG = "var(--brand-gray)";
const BTN_DANGER = "var(--brand-red, #bd3131)";

export default function ManageStorageAreas({ user, userName, onBackToDashboard, onLogout }) {
  const [areas, setAreas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [areaName, setAreaName] = useState("");
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState("");
  const [orderSaving, setOrderSaving] = useState(false);

  // Drag state
  const [draggedIdx, setDraggedIdx] = useState(null);

  // Check role
  const [hasPermission, setHasPermission] = useState(false);
  useEffect(() => {
    async function fetchRole() {
      if (!user) return;
      const { data } = await supabase
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

  // Fetch storage areas
  useEffect(() => {
    if (!hasPermission) return;
    async function fetchAreas() {
      setLoading(true);
      const { data } = await supabase
        .from("locations")
        .select("*")
        .order("sort_order", { ascending: true })
        .order("name", { ascending: true });
      if (data) {
        // Defensive: ensure all have sort_order
        let changed = false;
        const cleaned = data.map((a, i) => {
          if (a.sort_order === null || typeof a.sort_order === "undefined") {
            changed = true;
            return { ...a, sort_order: i };
          }
          return a;
        });
        setAreas(cleaned);
        // If any had null, update them in DB
        if (changed) {
          cleaned.forEach(async (a, i) => {
            if (a.sort_order !== i) {
              await supabase.from("locations").update({ sort_order: i }).eq("id", a.id);
            }
          });
        }
      }
      setLoading(false);
    }
    fetchAreas();
  }, [hasPermission]);

  async function handleAddArea(e) {
    e.preventDefault();
    setAddError("");
    setAddLoading(true);
    if (!areaName.trim()) {
      setAddError("Storage area name cannot be empty");
      setAddLoading(false);
      return;
    }
    try {
      // Find max sort_order
      const maxOrder = areas.length > 0 ? Math.max(...areas.map(a => a.sort_order ?? 0)) : 0;
      const { error } = await supabase
        .from("locations")
        .insert([{ name: areaName.trim(), sort_order: maxOrder + 1 }]);
      if (error) throw error;
      setAreaName("");
      // Refresh areas
      const { data } = await supabase
        .from("locations")
        .select("*")
        .order("sort_order", { ascending: true })
        .order("name", { ascending: true });
      if (data) setAreas(data);
    } catch (err) {
      setAddError(err.message || "Error adding storage area");
    }
    setAddLoading(false);
  }

  async function handleDeleteArea(id) {
    setDeleteLoading(id);
    try {
      const { error } = await supabase
        .from("locations")
        .delete()
        .eq("id", id);
      if (error) throw error;
      setAreas(prev => prev.filter(area => area.id !== id));
    } catch (err) {
      alert(err.message || "Error deleting storage area.");
    }
    setDeleteLoading(null);
  }

  function startEdit(id, name) {
    setEditingId(id);
    setEditingName(name);
  }

  async function handleEditArea(id) {
    if (!editingName.trim()) return;
    setAddLoading(true);
    try {
      const { error } = await supabase
        .from("locations")
        .update({ name: editingName.trim() })
        .eq("id", id);
      if (error) throw error;
      setEditingId(null);
      setEditingName("");
      // Refresh areas
      const { data } = await supabase
        .from("locations")
        .select("*")
        .order("sort_order", { ascending: true })
        .order("name", { ascending: true });
      if (data) setAreas(data);
    } catch (err) {
      setAddError(err.message || "Error renaming storage area");
    }
    setAddLoading(false);
  }

  // Drag/Drop reorder logic
  function handleDragStart(idx) {
    setDraggedIdx(idx);
  }
  function handleDragEnter(idx) {
    if (draggedIdx === null || draggedIdx === idx) return;
    setAreas(prev => {
      const arr = [...prev];
      const [removed] = arr.splice(draggedIdx, 1);
      arr.splice(idx, 0, removed);
      return arr;
    });
    setDraggedIdx(idx);
  }
  function handleDragEnd() {
    setDraggedIdx(null);
  }

  async function handleSaveOrder() {
    setOrderSaving(true);
    try {
      for (let i = 0; i < areas.length; i++) {
        const area = areas[i];
        if (area.sort_order !== i) {
          await supabase.from("locations").update({ sort_order: i }).eq("id", area.id);
        }
      }
      alert("Storage area order saved!");
      // Re-fetch to ensure fresh state
      const { data } = await supabase
        .from("locations")
        .select("*")
        .order("sort_order", { ascending: true })
        .order("name", { ascending: true });
      if (data) setAreas(data);
    } catch (err) {
      alert(err.message || "Error saving order.");
    }
    setOrderSaving(false);
  }

  // Restrict if not restaurant role
  if (!hasPermission)
    return (
      <div style={{
        minHeight: "100vh", background: GRAY_BG,
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        color: BRAND_BLUE, padding: "24px 6vw"
      }}>
        <ParcostHeader
          showBack={true}
          onBackToDashboard={onBackToDashboard}
          showLogout={true}
          onLogout={onLogout}
          userName={userName}
        />
        <div style={{
          background: CARD_BG, borderRadius: 14, boxShadow: "0 2px 16px #0002",
          padding: "40px 30px", maxWidth: 420, width: "100%", textAlign: "center"
        }}>
          <h2 style={{ color: BRAND_BLUE, fontWeight: 900, fontSize: 24 }}>Access Denied</h2>
          <p style={{ marginTop: 14, color: "#444" }}>
            You do not have permission to manage storage areas.
          </p>
        </div>
      </div>
    );

  return (
    <div style={{ background: GRAY_BG, minHeight: "100vh", padding: "32px 0" }}>
      <ParcostHeader
        showBack={true}
        onBackToDashboard={onBackToDashboard}
        showLogout={true}
        onLogout={onLogout}
        userName={userName}
      />
      <div style={{
        maxWidth: 530, margin: "0 auto", background: CARD_BG,
        borderRadius: 18, boxShadow: "0 2px 16px #0002", padding: "30px 32px"
      }}>
        <h1 style={{
          color: BRAND_BLUE,
          fontSize: 26,
          fontWeight: 900,
          marginBottom: 8,
          letterSpacing: "-0.02em"
        }}>Manage Storage Areas</h1>
        <form onSubmit={handleAddArea} style={{ display: "flex", gap: 14, marginBottom: 22, marginTop: 10 }}>
          <input
            style={inputStyle}
            placeholder="New Storage Area Name"
            value={areaName}
            onChange={e => setAreaName(e.target.value)}
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
        <div style={{ margin: "20px 0 4px 0", fontWeight: 600, fontSize: 18 }}>Current Storage Areas</div>
        {loading ? (
          <div>Loading storage areas...</div>
        ) : (
          <>
            <ul style={{ padding: 0, margin: 0, listStyle: "none" }}>
              {areas.map((area, idx) => (
                <li
                  key={area.id}
                  draggable
                  onDragStart={() => handleDragStart(idx)}
                  onDragEnter={draggedIdx !== null ? () => handleDragEnter(idx) : undefined}
                  onDragEnd={handleDragEnd}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "9px 0",
                    borderBottom: "1px solid #f2f3f8",
                    background: draggedIdx === idx ? "#e3e7f6" : "#fff",
                    cursor: "grab"
                  }}
                >
                  <span style={{ fontSize: 18, fontWeight: 600, width: 24, textAlign: "center", color: "#aaa" }}>{idx + 1}</span>
                  <div style={{ flex: 1 }}>
                    {editingId === area.id ? (
                      <input
                        value={editingName}
                        onChange={e => setEditingName(e.target.value)}
                        style={inputStyle}
                        autoFocus
                        onKeyDown={e => {
                          if (e.key === "Enter") handleEditArea(area.id);
                          if (e.key === "Escape") setEditingId(null);
                        }}
                      />
                    ) : (
                      area.name
                    )}
                  </div>
                  <div>
                    {editingId === area.id ? (
                      <>
                        <button
                          onClick={() => handleEditArea(area.id)}
                          style={{
                            background: BRAND_BLUE,
                            color: "#fff",
                            border: "none",
                            borderRadius: 6,
                            padding: "6px 13px",
                            fontWeight: 600,
                            cursor: addLoading ? "not-allowed" : "pointer",
                            marginRight: 8
                          }}>Save</button>
                        <button
                          onClick={() => setEditingId(null)}
                          style={{
                            background: "#fff",
                            color: BRAND_BLUE,
                            border: `1.5px solid ${BRAND_BLUE}`,
                            borderRadius: 6,
                            padding: "6px 13px",
                            fontWeight: 600,
                            cursor: "pointer"
                          }}>Cancel</button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => startEdit(area.id, area.name)}
                          style={{
                            background: BRAND_BLUE,
                            color: "#fff",
                            border: "none",
                            borderRadius: 6,
                            padding: "6px 13px",
                            fontWeight: 600,
                            cursor: "pointer",
                            marginRight: 8
                          }}>Edit</button>
                        <button
                          onClick={() => handleDeleteArea(area.id)}
                          disabled={deleteLoading === area.id}
                          style={{
                            background: BTN_DANGER,
                            color: "#fff",
                            border: "none",
                            borderRadius: 6,
                            padding: "6px 13px",
                            fontWeight: 600,
                            cursor: deleteLoading === area.id ? "not-allowed" : "pointer"
                          }}>
                          {deleteLoading === area.id ? "Deleting..." : "Delete"}
                        </button>
                      </>
                    )}
                  </div>
                  <span style={{ marginLeft: 10, color: "#bbb", fontSize: 18, cursor: "grab" }} title="Drag to reorder">☰</span>
                </li>
              ))}
              {areas.length === 0 && (
                <li style={{ color: "#888", padding: "17px 0", textAlign: "center" }}>
                  No storage areas yet.
                </li>
              )}
            </ul>
            {areas.length > 1 && (
              <button
                onClick={handleSaveOrder}
                disabled={orderSaving}
                style={{
                  marginTop: 24,
                  background: BRAND_GREEN,
                  color: "#fff",
                  border: "none",
                  borderRadius: 8,
                  fontWeight: 700,
                  fontSize: 17,
                  padding: "13px 0",
                  width: 200,
                  boxShadow: "0 1.5px 5px #0001",
                  display: "block",
                  marginLeft: "auto",
                  marginRight: "auto",
                  cursor: orderSaving ? "not-allowed" : "pointer"
                }}>
                {orderSaving ? "Saving..." : "Save Order"}
              </button>
            )}
          </>
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