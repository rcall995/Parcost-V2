import React, { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';
import ParcostHeader from "./components/ParcostHeader";
import BackButton from './BackButton';

const BRAND_BLUE = "var(--brand-blue)";
const BRAND_GREEN = "var(--brand-green)";
const BRAND_GRAY = "var(--brand-gray)";
const BRAND_RED = "var(--brand-red, #bd3131)";

function StorageLocations({ onBackToDashboard }) {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newLocation, setNewLocation] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetchLocations();
  }, []);

  async function fetchLocations() {
    setLoading(true);
    const { data, error } = await supabase.from('locations').select('*').order('name', { ascending: true });
    if (error) {
      setError('Error fetching storage locations: ' + error.message);
    } else {
      setLocations(data);
      setError("");
    }
    setLoading(false);
  }

  async function handleAddLocation(e) {
    e.preventDefault();
    if (!newLocation.trim()) return;
    const { error } = await supabase.from('locations').insert([{ name: newLocation.trim() }]);
    if (error) {
      setError('Error adding storage location: ' + error.message);
    } else {
      setNewLocation("");
      fetchLocations();
    }
  }

  function startEdit(loc) {
    setEditingId(loc.id);
    setEditName(loc.name);
  }

  async function saveEdit(e) {
    e.preventDefault();
    if (!editName.trim()) return;
    const { error } = await supabase
      .from('locations')
      .update({ name: editName.trim() })
      .eq('id', editingId);
    if (error) {
      setError('Error updating storage location: ' + error.message);
    } else {
      setEditingId(null);
      setEditName("");
      fetchLocations();
    }
  }

  async function deleteLocation(id) {
    if (!window.confirm('Delete this storage location?')) return;
    const { error } = await supabase.from('locations').delete().eq('id', id);
    if (error) {
      setError('Error deleting storage location: ' + error.message);
    } else {
      fetchLocations();
    }
  }

  return (
    <div style={{ minHeight: "100vh", background: BRAND_GRAY }}>
      <ParcostHeader />
      <div style={{
        maxWidth: 600, margin: '40px auto',
        background: "#fff", borderRadius: 14, boxShadow: "0 2px 12px #0001",
        padding: 32
      }}>
        {onBackToDashboard && (
          <BackButton onClick={onBackToDashboard} />
        )}
        <h2 style={{
          color: BRAND_BLUE,
          fontWeight: 800,
          fontSize: 24,
          textAlign: "center",
          marginBottom: 20
        }}>Storage Locations</h2>
        <form onSubmit={handleAddLocation} style={{ marginBottom: 20, display: "flex", gap: 12 }}>
          <input
            placeholder="New storage location name"
            value={newLocation}
            onChange={e => setNewLocation(e.target.value)}
            style={{
              padding: "10px 12px",
              fontSize: 16,
              borderRadius: 6,
              border: "1.5px solid #e2e8f0",
              flex: 1,
              background: "#fafdff"
            }}
          />
          <button
            type="submit"
            style={{
              background: BRAND_GREEN,
              color: "#fff",
              fontWeight: 700,
              fontSize: 16,
              border: "none",
              borderRadius: 8,
              padding: "10px 22px",
              cursor: "pointer",
              boxShadow: "0 1px 4px #0001"
            }}
          >Add</button>
        </form>
        {error && <div style={{ color: BRAND_RED, marginBottom: 10 }}>{error}</div>}
        {loading ? (
          <p>Loading...</p>
        ) : locations.length === 0 ? (
          <p>No storage locations found.</p>
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
                <th style={thStyle}>Name</th>
                <th style={thStyle}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {locations.map(loc =>
                editingId === loc.id ? (
                  <tr key={loc.id}>
                    <td style={tdStyle}>
                      <input
                        value={editName}
                        onChange={e => setEditName(e.target.value)}
                        style={{
                          width: "100%",
                          padding: "9px 12px",
                          fontSize: 16,
                          borderRadius: 6,
                          border: "1.5px solid #e2e8f0"
                        }}
                      />
                    </td>
                    <td style={tdStyle}>
                      <button
                        onClick={saveEdit}
                        style={actionBtnStyle}
                      >Save</button>
                      <button
                        onClick={() => setEditingId(null)}
                        style={actionBtnStyle}
                      >Cancel</button>
                    </td>
                  </tr>
                ) : (
                  <tr key={loc.id}>
                    <td style={tdStyle}>{loc.name}</td>
                    <td style={tdStyle}>
                      <button
                        onClick={() => startEdit(loc)}
                        style={actionBtnStyle}
                      >Edit</button>
                      <button
                        onClick={() => deleteLocation(loc.id)}
                        style={{ ...actionBtnStyle, background: BRAND_RED }}
                      >Delete</button>
                    </td>
                  </tr>
                )
              )}
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
  textAlign: "left"
};
const tdStyle = {
  padding: "10px 12px",
  border: "1.5px solid #e2e8f0",
  fontSize: 16,
  background: "#fafdff",
  verticalAlign: "middle"
};
const actionBtnStyle = {
  background: BRAND_BLUE,
  color: "#fff",
  border: "none",
  borderRadius: 6,
  padding: "7px 16px",
  fontWeight: 500,
  marginRight: 6,
  cursor: "pointer",
  fontSize: 15
};

export default StorageLocations;