import React, { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';
import BackButton from './BackButton';
import ParcostHeader from './components/ParcostHeader';

const BRAND_BLUE = "var(--brand-blue)";
const BRAND_GREEN = "var(--brand-green)";
const BRAND_WHITE = "#fff";
const CARD_BG = "#fff";
const GRAY_BG = "var(--brand-gray)";
const BTN_DANGER = "var(--brand-red, #bd3131)";

export default function InventoryItems({ onNavigate }) {
  const [items, setItems] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);

  // For new item creation
  const [newItem, setNewItem] = useState({
    restaurant_nickname: "",
    category: "",
    vendor: "",
    current_stock: ""
  });
  const [newItemLocations, setNewItemLocations] = useState([]);

  // For editing
  const [editingId, setEditingId] = useState(null);
  const [editItem, setEditItem] = useState({});
  const [editItemLocations, setEditItemLocations] = useState([]);

  // For displaying locations mapped to each item
  const [locationMap, setLocationMap] = useState({});

  useEffect(() => {
    fetchAll();
    // eslint-disable-next-line
  }, []);

  // Fetch items and locations
  async function fetchAll() {
    setLoading(true);
    const { data: itemsData, error: itemsError } = await supabase.from('items').select('*');
    if (itemsError) {
      alert('Error fetching items: ' + itemsError.message);
      setLoading(false);
      return;
    }
    setItems(itemsData);

    const { data: locData, error: locError } = await supabase.from('locations').select('*');
    if (locError) {
      alert('Error fetching locations: ' + locError.message);
      setLoading(false);
      return;
    }
    setLocations(locData);

    // Build a cache of location_map for display
    const { data: locationMapData, error: locMapError } = await supabase.from('location_map').select('*');
    if (locationMapData && !locMapError) {
      const map = {};
      locationMapData.forEach(row => {
        if (!map[row.item_id]) map[row.item_id] = [];
        map[row.item_id].push(row.location_id);
      });
      setLocationMap(map);
    }

    setLoading(false);
  }

  async function fetchItemLocations(itemId, setFn) {
    const { data, error } = await supabase.from('location_map').select('location_id').eq('item_id', itemId);
    if (!error && data) {
      setFn(data.map(d => d.location_id));
    }
  }

  async function handleAddItem(e) {
    e.preventDefault();
    if (!newItem.restaurant_nickname) {
      alert("Nickname is required");
      return;
    }
    const { data, error } = await supabase.from('items').insert([newItem]).select();
    if (error) {
      alert('Error adding item: ' + error.message);
      return;
    }
    const itemId = data[0].id;
    if (newItemLocations.length > 0) {
      const entries = newItemLocations.map(locId => ({ item_id: itemId, location_id: locId }));
      await supabase.from('location_map').insert(entries);
    }
    setNewItem({ restaurant_nickname: "", category: "", vendor: "", current_stock: "" });
    setNewItemLocations([]);
    fetchAll();
  }

  function handleInputChange(e) {
    setNewItem({ ...newItem, [e.target.name]: e.target.value });
  }
  function handleLocationChange(e, setter, current) {
    const val = e.target.value;
    if (e.target.checked) {
      setter([...current, val]);
    } else {
      setter(current.filter(l => l !== val));
    }
  }

  function startEdit(item) {
    setEditingId(item.id);
    setEditItem({ ...item });
    fetchItemLocations(item.id, setEditItemLocations);
  }
  function handleEditChange(e) {
    setEditItem({ ...editItem, [e.target.name]: e.target.value });
  }
  async function saveEditItem(e) {
    e.preventDefault();
    const { error } = await supabase
      .from('items')
      .update(editItem)
      .eq('id', editingId);
    if (error) {
      alert('Error updating item: ' + error.message);
      return;
    }
    await supabase.from('location_map').delete().eq('item_id', editingId);
    if (editItemLocations.length > 0) {
      const entries = editItemLocations.map(locId => ({ item_id: editingId, location_id: locId }));
      await supabase.from('location_map').insert(entries);
    }
    setEditingId(null);
    setEditItem({});
    setEditItemLocations([]);
    fetchAll();
  }
  function cancelEdit() {
    setEditingId(null);
    setEditItem({});
    setEditItemLocations([]);
  }

  async function deleteItem(id) {
    if (!window.confirm('Delete this item?')) return;
    const { error } = await supabase.from('items').delete().eq('id', id);
    if (error) {
      alert('Error deleting item: ' + error.message);
    } else {
      fetchAll();
    }
  }

  function getItemLocations(itemId) {
    return locations
      .filter(loc =>
        locationMap[itemId] && locationMap[itemId].includes(loc.id)
      )
      .map(loc => loc.name)
      .join(', ');
  }

  return (
    <div style={{ minHeight: "100vh", background: GRAY_BG }}>
      <ParcostHeader />
      <div style={{
        maxWidth: 980,
        margin: '30px auto',
        background: CARD_BG,
        borderRadius: 14,
        boxShadow: "0 2px 12px #0001",
        padding: "32px 28px"
      }}>
        <BackButton onClick={() => onNavigate(null)} />
        <div style={{
          fontSize: 32,
          fontWeight: 800,
          margin: "32px 0 20px",
          color: BRAND_BLUE
        }}>Inventory Items</div>
        <form onSubmit={handleAddItem} style={{
          marginBottom: 24, display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8
        }}>
          <input
            name="restaurant_nickname"
            placeholder="Nickname"
            value={newItem.restaurant_nickname}
            onChange={handleInputChange}
            required
            style={{ flex: "1 1 180px", minWidth: 140, padding: 8, border: "1.5px solid #e2e8f0", borderRadius: 6, fontSize: 16 }}
          />
          <input
            name="category"
            placeholder="Category"
            value={newItem.category}
            onChange={handleInputChange}
            style={{ flex: "1 1 180px", minWidth: 140, padding: 8, border: "1.5px solid #e2e8f0", borderRadius: 6, fontSize: 16 }}
          />
          <input
            name="vendor"
            placeholder="Vendor"
            value={newItem.vendor}
            onChange={handleInputChange}
            style={{ flex: "1 1 180px", minWidth: 140, padding: 8, border: "1.5px solid #e2e8f0", borderRadius: 6, fontSize: 16 }}
          />
          <input
            name="current_stock"
            placeholder="Current Stock"
            value={newItem.current_stock}
            onChange={handleInputChange}
            type="number"
            min="0"
            style={{ flex: "1 1 120px", minWidth: 100, padding: 8, border: "1.5px solid #e2e8f0", borderRadius: 6, fontSize: 16 }}
          />
          <button type="submit" style={{
            background: BRAND_GREEN, color: BRAND_WHITE, border: "none", borderRadius: 8, padding: "8px 18px",
            fontWeight: 700, marginLeft: 6, cursor: "pointer", fontSize: 15
          }}>Add Item</button>
          <div style={{
            width: "100%", margin: "8px 0 0 0", fontSize: 15, display: 'flex', alignItems: 'center', gap: 12
          }}>
            <span style={{ fontWeight: 500 }}>Storage Locations: </span>
            {locations.map(loc => (
              <label key={loc.id} style={{ marginRight: 8, whiteSpace: "nowrap" }}>
                <input
                  type="checkbox"
                  value={loc.id}
                  checked={newItemLocations.includes(loc.id)}
                  onChange={e => handleLocationChange(e, setNewItemLocations, newItemLocations)}
                  style={{ marginRight: 3 }}
                />
                {loc.name}
              </label>
            ))}
          </div>
        </form>
        {loading ? (
          <p>Loading...</p>
        ) : items.length === 0 ? (
          <p>No items found.</p>
        ) : (
          <table style={{
            width: "100%", borderCollapse: "collapse", marginTop: 12, background: "#fff",
            boxShadow: "0 2px 10px #0001", borderRadius: 8, overflow: "hidden"
          }}>
            <thead>
              <tr>
                <th style={{
                  background: "#f4f6fa", fontWeight: 700, fontSize: 17, padding: "12px 10px", border: "2px solid #dbe3ec"
                }}>Nickname</th>
                <th style={{
                  background: "#f4f6fa", fontWeight: 700, fontSize: 17, padding: "12px 10px", border: "2px solid #dbe3ec"
                }}>Category</th>
                <th style={{
                  background: "#f4f6fa", fontWeight: 700, fontSize: 17, padding: "12px 10px", border: "2px solid #dbe3ec"
                }}>Vendor</th>
                <th style={{
                  background: "#f4f6fa", fontWeight: 700, fontSize: 17, padding: "12px 10px", border: "2px solid #dbe3ec"
                }}>Current Stock</th>
                <th style={{
                  background: "#f4f6fa", fontWeight: 700, fontSize: 17, padding: "12px 10px", border: "2px solid #dbe3ec"
                }}>Storage Locations</th>
                <th style={{
                  background: "#f4f6fa", fontWeight: 700, fontSize: 17, padding: "12px 10px", border: "2px solid #dbe3ec"
                }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map(item =>
                editingId === item.id ? (
                  <tr key={item.id}>
                    <td style={tdStyle}>
                      <input
                        name="restaurant_nickname"
                        value={editItem.restaurant_nickname || ""}
                        onChange={handleEditChange}
                        style={{ width: "100%", padding: 8, borderRadius: 6, border: "1.5px solid #e2e8f0", fontSize: 16 }}
                      />
                    </td>
                    <td style={tdStyle}>
                      <input
                        name="category"
                        value={editItem.category || ""}
                        onChange={handleEditChange}
                        style={{ width: "100%", padding: 8, borderRadius: 6, border: "1.5px solid #e2e8f0", fontSize: 16 }}
                      />
                    </td>
                    <td style={tdStyle}>
                      <input
                        name="vendor"
                        value={editItem.vendor || ""}
                        onChange={handleEditChange}
                        style={{ width: "100%", padding: 8, borderRadius: 6, border: "1.5px solid #e2e8f0", fontSize: 16 }}
                      />
                    </td>
                    <td style={tdStyle}>
                      <input
                        name="current_stock"
                        type="number"
                        min="0"
                        value={editItem.current_stock || ""}
                        onChange={handleEditChange}
                        style={{ width: "100%", padding: 8, borderRadius: 6, border: "1.5px solid #e2e8f0", fontSize: 16 }}
                      />
                    </td>
                    <td style={tdStyle}>
                      <div style={{ display: "flex", gap: 16, flexWrap: "wrap", alignItems: "center" }}>
                        {locations.map(loc => (
                          <label key={loc.id} style={{ marginRight: 0, whiteSpace: "nowrap" }}>
                            <input
                              type="checkbox"
                              value={loc.id}
                              checked={editItemLocations.includes(loc.id)}
                              onChange={e => handleLocationChange(e, setEditItemLocations, editItemLocations)}
                              style={{ marginRight: 3 }}
                            />
                            {loc.name}
                          </label>
                        ))}
                      </div>
                    </td>
                    <td style={tdStyle}>
                      <button onClick={saveEditItem} style={actionBtnStyle}>Save</button>
                      <button onClick={cancelEdit} style={actionBtnStyle}>Cancel</button>
                    </td>
                  </tr>
                ) : (
                  <tr key={item.id}>
                    <td style={tdStyle}>{item.restaurant_nickname}</td>
                    <td style={tdStyle}>{item.category}</td>
                    <td style={tdStyle}>{item.vendor}</td>
                    <td style={tdStyle}>{item.current_stock}</td>
                    <td style={tdStyle}>
                      {getItemLocations(item.id)}
                    </td>
                    <td style={tdStyle}>
                      <button onClick={() => startEdit(item)} style={actionBtnStyle}>Edit</button>
                      <button onClick={() => deleteItem(item.id)} style={{ ...actionBtnStyle, background: BTN_DANGER }}>Delete</button>
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

const tdStyle = {
  padding: "10px 12px",
  border: "1.5px solid #e2e8f0",
  fontSize: 16,
  background: "#fafdff",
  verticalAlign: "middle"
};
const actionBtnStyle = {
  background: BRAND_BLUE, color: "#fff", border: "none", borderRadius: 6, padding: "7px 16px", fontWeight: 500,
  marginRight: 6, cursor: "pointer", fontSize: 15
};