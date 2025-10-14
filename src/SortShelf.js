import React, { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';
import ParcostHeader from './components/ParcostHeader';

const GRAY_BG = "var(--brand-gray)";
const BRAND_BLUE = "var(--brand-blue)";
const BRAND_GREEN = "var(--brand-green)";

export default function SortShelf({
  onBackToDashboard,
  onLogout,
  userName
}) {
  const [areas, setAreas] = useState([]);
  const [selectedArea, setSelectedArea] = useState('');
  const [items, setItems] = useState([]);
  const [order, setOrder] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Fetch storage areas
  useEffect(() => {
    supabase.from('locations').select('*').then(({ data, error }) => {
      if (error) setError(error.message);
      setAreas(data || []);
    });
  }, []);

  // Fetch items in area and their order
  useEffect(() => {
    if (!selectedArea) return;
    setLoading(true);
    setError("");
    (async () => {
      // Get all items mapped to this area
      const { data: mapData, error: mapErr } = await supabase
        .from('location_map')
        .select('item_id')
        .eq('location_id', selectedArea);
      if (mapErr) { setError(mapErr.message); setLoading(false); return; }
      const itemIds = mapData?.map(m => m.item_id) || [];
      if (itemIds.length === 0) {
        setItems([]);
        setOrder([]);
        setLoading(false);
        return;
      }
      const { data: itemsData, error: itemsErr } = await supabase
        .from('items')
        .select('*')
        .in('id', itemIds);
      if (itemsErr) { setError(itemsErr.message); setLoading(false); return; }
      // Get sort order
      const { data: orderData, error: orderErr } = await supabase
        .from('location_item_order')
        .select('item_id, sort_order')
        .eq('location_id', selectedArea);
      if (orderErr) { setError(orderErr.message); setLoading(false); return; }
      // Sort items by order, fallback to name
      const orderMap = {};
      (orderData || []).forEach(o => { orderMap[o.item_id] = o.sort_order; });
      const sorted = [...(itemsData || [])].sort((a, b) => {
        const oa = orderMap[a.id] ?? 9999;
        const ob = orderMap[b.id] ?? 9999;
        if (oa !== ob) return oa - ob;
        return a.restaurant_nickname.localeCompare(b.restaurant_nickname);
      });
      setItems(sorted);
      setOrder(sorted.map(i => i.id));
      setLoading(false);
    })();
  }, [selectedArea]);

  function move(idx, dir) {
    if ((idx === 0 && dir === -1) || (idx === order.length - 1 && dir === 1)) return;
    const newOrder = [...order];
    [newOrder[idx], newOrder[idx + dir]] = [newOrder[idx + dir], newOrder[idx]];
    setOrder(newOrder);
  }

  async function saveOrder() {
    setLoading(true);
    setError("");
    try {
      for (let i = 0; i < order.length; ++i) {
        const { error } = await supabase.from('location_item_order').upsert({
          location_id: selectedArea,
          item_id: order[i],
          sort_order: i,
        }, { onConflict: ['location_id', 'item_id'] });
        if (error) throw error;
      }
      alert('Order saved!');
    } catch (err) {
      setError(err.message || "Error saving order.");
    }
    setLoading(false);
  }

  return (
    <div style={{ minHeight: "100vh", background: GRAY_BG }}>
      <ParcostHeader
        showBack={true}
        onBackToDashboard={onBackToDashboard}
        showLogout={true}
        onLogout={onLogout}
        userName={userName}
      />
      <div style={{ maxWidth: 700, margin: '40px auto', background: "#fff", borderRadius: 12, boxShadow: "0 2px 12px #0001", padding: 32 }}>
        <h2 style={{ color: BRAND_BLUE, fontWeight: 800, textAlign: "center" }}>Shelf to Sheet - Sort Items</h2>
        <div style={{ marginBottom: 20 }}>
          <label style={{ fontWeight: 600 }}>
            Select Storage Area:{' '}
            <select
              value={selectedArea}
              onChange={e => setSelectedArea(e.target.value)}
              style={{
                border: "1.5px solid #e2e8f0",
                borderRadius: 6,
                padding: "10px 14px",
                fontSize: "1rem",
                marginLeft: 8,
                minWidth: 140,
                background: "var(--brand-gray)"
              }}
            >
              <option value="">--Select--</option>
              {areas.map(area => (
                <option key={area.id} value={area.id}>
                  {area.name}
                </option>
              ))}
            </select>
          </label>
        </div>
        {error && <div style={{ color: "#bd3131", marginBottom: 12 }}>{error}</div>}
        {loading && <p>Loading...</p>}
        {!loading && selectedArea && order.length === 0 && (
          <div style={{ color: "#888", marginTop: 20, textAlign: "center" }}>
            No items assigned to this storage area.<br />
            Add items to this area via item management.
          </div>
        )}
        {selectedArea && order.length > 0 && (
          <>
            <table border="0" cellPadding="8" cellSpacing="0" width="100%" style={{ marginTop: 20, borderRadius: 8, borderCollapse: "separate", background: "#fafdff" }}>
              <thead>
                <tr style={{ background: BRAND_BLUE, color: "#fff" }}>
                  <th style={{ borderRadius: "8px 0 0 0" }}>Order</th>
                  <th>Item</th>
                  <th style={{ borderRadius: "0 8px 0 0" }}>Move</th>
                </tr>
              </thead>
              <tbody>
                {order.map((id, idx) => {
                  const item = items.find(i => i.id === id);
                  return (
                    <tr key={id}>
                      <td style={{ textAlign: "center", fontWeight: 600 }}>{idx + 1}</td>
                      <td>{item ? item.restaurant_nickname : id}</td>
                      <td style={{ textAlign: "center" }}>
                        <button
                          disabled={idx === 0}
                          onClick={() => move(idx, -1)}
                          style={{
                            marginRight: 8,
                            border: "none",
                            borderRadius: 6,
                            background: idx === 0 ? "#e3e7f6" : BRAND_BLUE,
                            color: idx === 0 ? "#aaa" : "#fff",
                            padding: "4px 10px",
                            fontWeight: 700,
                            cursor: idx === 0 ? "not-allowed" : "pointer"
                          }}
                        >↑</button>
                        <button
                          disabled={idx === order.length - 1}
                          onClick={() => move(idx, 1)}
                          style={{
                            border: "none",
                            borderRadius: 6,
                            background: idx === order.length - 1 ? "#e3e7f6" : BRAND_BLUE,
                            color: idx === order.length - 1 ? "#aaa" : "#fff",
                            padding: "4px 10px",
                            fontWeight: 700,
                            cursor: idx === order.length - 1 ? "not-allowed" : "pointer"
                          }}
                        >↓</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <button
              onClick={saveOrder}
              style={{
                marginTop: 24,
                background: BRAND_GREEN,
                color: "#fff",
                border: "none",
                borderRadius: 8,
                fontWeight: 700,
                fontSize: 17,
                padding: "13px 0",
                width: 180,
                boxShadow: "0 1.5px 5px #0001",
                display: "block",
                marginLeft: "auto",
                marginRight: "auto",
                cursor: "pointer"
              }}
              disabled={loading}
            >{loading ? "Saving..." : "Save Order"}</button>
          </>
        )}
      </div>
    </div>
  );
}