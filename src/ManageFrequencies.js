import React, { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";
import BackButton from "./BackButton";
import ParcostHeader from "./components/ParcostHeader";

const BRAND_BLUE = "var(--brand-blue)";
const BRAND_RED = "var(--brand-red, #bd3131)";
const BRAND_GREEN = "var(--brand-green, #17c37b)";
const BRAND_GRAY = "var(--brand-gray)";

export default function ManageFrequencies({ onNavigate }) {
  const [items, setItems] = useState([]);
  const [itemFreqs, setItemFreqs] = useState({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [sortBy, setSortBy] = useState("name");

  useEffect(() => {
    async function fetchItems() {
      // Fetch all columns so we can always upsert all NOT NULL columns
      const { data: itemsData } = await supabase.from("items").select("*");
      setItems(itemsData || []);
      const freqMap = {};
      (itemsData || []).forEach((item) => {
        const freq = new Set(item.count_frequency || []);
        if (freq.has("Daily")) freqMap[item.id] = { Monthly: true, Weekly: true, Daily: true };
        else if (freq.has("Weekly")) freqMap[item.id] = { Monthly: true, Weekly: true, Daily: false };
        else freqMap[item.id] = { Monthly: true, Weekly: false, Daily: false };
      });
      setItemFreqs(freqMap);
    }
    fetchItems();
  }, []);

  function handleCheck(itemId, freq) {
    setItemFreqs((prev) => {
      const prevState = prev[itemId] || { Monthly: true, Weekly: false, Daily: false };
      let updated = { ...prevState };

      if (freq === "Daily") {
        const newDaily = !prevState.Daily;
        updated.Daily = newDaily;
        updated.Weekly = newDaily ? true : prevState.Weekly;
        updated.Monthly = true;
      } else if (freq === "Weekly") {
        const newWeekly = !prevState.Weekly;
        updated.Weekly = newWeekly;
        if (newWeekly) updated.Monthly = true;
        if (!newWeekly) updated.Daily = false;
      }
      updated.Monthly = true;
      return { ...prev, [itemId]: updated };
    });
  }

  function filterItems(items, itemFreqs, filter) {
    if (filter === "daily") {
      return items.filter(item => itemFreqs[item.id]?.Daily);
    }
    if (filter === "weekly") {
      return items.filter(item => itemFreqs[item.id]?.Weekly);
    }
    return items;
  }

  function sortItems(items, itemFreqs, sortBy) {
    if (sortBy === "frequency") {
      return [...items].sort((a, b) => {
        const af = itemFreqs[a.id] || {};
        const bf = itemFreqs[b.id] || {};
        const freqRank = (f) => f.Daily ? 0 : f.Weekly ? 1 : 2;
        const diff = freqRank(af) - freqRank(bf);
        if (diff !== 0) return diff;
        return (a.restaurant_nickname || "").localeCompare(b.restaurant_nickname || "");
      });
    }
    return [...items].sort((a, b) =>
      (a.restaurant_nickname || "").localeCompare(b.restaurant_nickname || "")
    );
  }

  const filterBtnStyle = (active) => ({
    background: active ? "var(--brand-blue)" : "#fff",
    color: active ? "#fff" : "var(--brand-blue)",
    border: "1.5px solid var(--brand-blue)",
    borderRadius: 7,
    fontWeight: 600,
    fontSize: 15,
    padding: "6px 15px",
    cursor: "pointer"
  });

  async function handleSaveAll(e) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSaving(true);

    // Fetch all NOT NULL columns for all items
    const { data: allItems, error: fetchErr } = await supabase.from("items").select("*");
    if (fetchErr) {
      setError("Failed to fetch items: " + fetchErr.message);
      setSaving(false);
      return;
    }
    // List all NOT NULL columns (from your schema images)
    const notNullCols = [
      "restaurant_nickname", "category", "vendor", "purchase_unit",
      "count_tier1_unit", "count_tier1_factor", "count_tier2_unit", "count_tier2_factor",
      "count_tier3_unit", "count_tier3_factor", "conversion_factor", "master_inv_unit", "price", "par_level",
      "last_purchase_cost", "average_cost", "current_stock"
    ];

    const updates = items.map((item) => {
      const orig = allItems.find(i => i.id === item.id) || item;
      const freqObj = itemFreqs[item.id] || { Monthly: true, Weekly: false, Daily: false };
      const freqArr = ["Monthly"];
      if (freqObj.Weekly) freqArr.push("Weekly");
      if (freqObj.Daily) freqArr.push("Daily");
      // Always include id and count_frequency
      const upsertObj = {
        id: item.id,
        count_frequency: freqArr,
      };
      // Add all NOT NULL columns from the original row
      notNullCols.forEach(col => {
        upsertObj[col] = orig[col];
      });
      return upsertObj;
    });

    const { error: upErr } = await supabase.from("items").upsert(updates, { onConflict: ["id"] });
    setSaving(false);
    if (upErr) {
      setError("Failed to update frequencies: " + upErr.message);
    } else {
      setSuccess("Frequencies saved!");
    }
  }

  const filteredSortedItems = sortItems(
    filterItems(items, itemFreqs, selectedFilter),
    itemFreqs,
    sortBy
  );

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
        <BackButton onClick={() => onNavigate("dashboard")} />
        <h2 style={{ color: BRAND_BLUE, fontWeight: 800, textAlign: "center" }}>Manage Count Frequencies</h2>
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 18, flexWrap: "wrap" }}>
          <span style={{ fontWeight: 600 }}>Filter:</span>
          <button type="button" style={filterBtnStyle(selectedFilter === "all")} onClick={() => setSelectedFilter("all")}>Show All</button>
          <button type="button" style={filterBtnStyle(selectedFilter === "daily")} onClick={() => setSelectedFilter("daily")}>Show Daily</button>
          <button type="button" style={filterBtnStyle(selectedFilter === "weekly")} onClick={() => setSelectedFilter("weekly")}>Show Weekly</button>
          <span style={{ marginLeft: 28, fontWeight: 600 }}>Sort:</span>
          <button type="button" style={filterBtnStyle(sortBy === "name")} onClick={() => setSortBy("name")}>Name</button>
          <button type="button" style={filterBtnStyle(sortBy === "frequency")} onClick={() => setSortBy("frequency")}>Frequency</button>
        </div>
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: 18,
          fontSize: 15,
          marginBottom: 14,
          marginLeft: 2,
          fontWeight: 500
        }}>
          <span><b>D</b> = Daily</span>
          <span><b>W</b> = Weekly</span>
          <span><b>M</b> = Monthly</span>
        </div>
        <form
          onSubmit={handleSaveAll}
          style={{
            marginBottom: 28,
            display: "flex",
            alignItems: "end",
            gap: 24,
            flexWrap: "wrap",
          }}
        >
          <button
            type="submit"
            style={{
              background: BRAND_GREEN,
              color: "#fff",
              border: "none",
              borderRadius: 6,
              padding: "11px 38px",
              fontSize: 18,
              fontWeight: 700,
              cursor: saving ? "not-allowed" : "pointer",
              minWidth: 110
            }}
            disabled={saving}
          >
            {saving ? "Saving..." : "Save"}
          </button>
          {error && <div style={{ color: BRAND_RED, fontWeight: 500 }}>{error}</div>}
          {success && <div style={{ color: BRAND_GREEN, fontWeight: 500 }}>{success}</div>}
        </form>
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
              <th style={thStyle}>Item Name</th>
              <th style={thStyle}>D</th>
              <th style={thStyle}>W</th>
              <th style={thStyle}>M</th>
            </tr>
          </thead>
          <tbody>
            {filteredSortedItems.map((item) => {
              const freqObj = itemFreqs[item.id] || { Monthly: true, Weekly: false, Daily: false };
              return (
                <tr key={item.id}>
                  <td style={tdStyle}>{item.restaurant_nickname}</td>
                  <td style={tdStyleCheckbox}>
                    <input
                      type="checkbox"
                      checked={freqObj.Daily}
                      onChange={() => handleCheck(item.id, "Daily")}
                      style={{ accentColor: BRAND_BLUE, width: 20, height: 20 }}
                      aria-label="Daily"
                    />
                  </td>
                  <td style={tdStyleCheckbox}>
                    <input
                      type="checkbox"
                      checked={freqObj.Weekly}
                      onChange={() => handleCheck(item.id, "Weekly")}
                      style={{ accentColor: BRAND_BLUE, width: 20, height: 20 }}
                      aria-label="Weekly"
                    />
                  </td>
                  <td style={tdStyleCheckbox}>
                    <input
                      type="checkbox"
                      checked={true}
                      disabled
                      readOnly
                      style={{ accentColor: BRAND_BLUE, width: 20, height: 20, opacity: 0.8 }}
                      aria-label="Monthly"
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
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
  textAlign: "center"
};
const tdStyle = {
  padding: "16px 10px",
  border: "1.5px solid #e2e8f0",
  fontSize: 16,
  background: "#fafdff",
  verticalAlign: "middle",
  textAlign: "left"
};
const tdStyleCheckbox = {
  padding: "16px 0",
  border: "1.5px solid #e2e8f0",
  background: "#fafdff",
  textAlign: "center"
};