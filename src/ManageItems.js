import React, { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";
import BackButton from "./BackButton";
import ParcostHeader from "./components/ParcostHeader";

const BRAND_BLUE = "var(--brand-blue)";
const BRAND_RED = "var(--brand-red, #bd3131)";
const BRAND_GRAY = "var(--brand-gray)";
const BRAND_GREEN = "var(--brand-green, #17c37b)";

// Robust CSV utilities
function csvToItems(csv) {
  csv = csv.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const [headerLine, ...rows] = csv.trim().split('\n');
  const tabCount = (headerLine.match(/\t/g) || []).length;
  const commaCount = (headerLine.match(/,/g) || []).length;
  const delimiter = tabCount > commaCount ? '\t' : ',';
  const headers = headerLine
    .split(delimiter)
    .map(h => h.replace(/^"+|"+$/g, '').replace(/\r/g, '').trim());
  return rows
    .filter(row => row.trim())
    .map(row => {
      const values = row.split(delimiter).map(cell =>
        cell.replace(/^"+|"+$/g, '').replace(/\r/g, '').trim()
      );
      const obj = {};
      headers.forEach((header, i) => (obj[header] = values[i]));
      return obj;
    });
}

function itemsToCSV(items) {
  if (!items || items.length === 0) return "";
  const headers = Object.keys(items[0]);
  const csvRows = [
    headers.join(","),
    ...items.map((item) =>
      headers.map((header) => JSON.stringify(item[header] ?? "")).join(",")
    ),
  ];
  return csvRows.join("\n");
}

export default function ManageItems({ onNavigate }) {
  const [items, setItems] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editItem, setEditItem] = useState({});
  const [adding, setAdding] = useState(false);
  const [newItem, setNewItem] = useState({});
  const [loading, setLoading] = useState(false);
  const [csvError, setCsvError] = useState("");
  const [csvDownloadUrl, setCsvDownloadUrl] = useState("");
  const [csvFile, setCsvFile] = useState(null);

  useEffect(() => {
    fetchItems();
    // eslint-disable-next-line
  }, []);

  async function fetchItems() {
    setLoading(true);
    const { data } = await supabase.from("items").select("*").order("restaurant_nickname");
    setItems(data || []);
    setLoading(false);
  }

  function startEdit(item) {
    setEditingId(item.id);
    setEditItem({ ...item });
  }

  function handleEditChange(e) {
    const { name, value } = e.target;
    setEditItem((prev) => ({ ...prev, [name]: value }));
  }

  async function saveEditItem(e) {
    e.preventDefault();
    setLoading(true);
    await supabase.from("items").update(editItem).eq("id", editingId);
    setEditingId(null);
    setEditItem({});
    fetchItems();
    setLoading(false);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditItem({});
  }

  async function deleteItem(id) {
    if (!window.confirm("Delete this item?")) return;
    setLoading(true);
    await supabase.from("items").delete().eq("id", id);
    fetchItems();
    setLoading(false);
  }

  function startAddItem() {
    setAdding(true);
    setNewItem({});
  }
  function handleNewItemChange(e) {
    const { name, value } = e.target;
    setNewItem((prev) => ({ ...prev, [name]: value }));
  }
  async function saveNewItem(e) {
    e.preventDefault();
    setLoading(true);
    await supabase.from("items").insert([newItem]);
    setAdding(false);
    setNewItem({});
    fetchItems();
    setLoading(false);
  }
  function cancelAdd() {
    setAdding(false);
    setNewItem({});
  }

  // CSV Export
  function handleDownloadCSV() {
    const csv = itemsToCSV(items);
    const blob = new Blob([csv], { type: "text/csv" });
    setCsvDownloadUrl(URL.createObjectURL(blob));
    setTimeout(() => URL.revokeObjectURL(csvDownloadUrl), 10000);
  }

  // CSV Template Download
  function handleDownloadTemplate() {
    const headers = fields.map(f => f.name);
    const sampleItem = {
      restaurant_nickname: "Sample Cups",
      category: "Disposables",
      vendor: "Sample Vendor",
      purchase_unit: "Case",
      count_tier1_unit: "Sleeve",
      count_tier1_factor: "20",
      count_tier2_unit: "Cup",
      count_tier2_factor: "50",
      count_tier3_unit: "Each",
      count_tier3_factor: "1",
      conversion_factor: "1000",
      master_inv_unit: "Cup",
      price: "100",
      par_level: "5",
      last_purchase_cost: "100",
      average_cost: "100",
      current_stock: "1000"
    };
    const sampleRow = headers.map(h => sampleItem[h] ?? "");
    const csv = [headers.join(","), sampleRow.join(",")].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "items_template.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 10000);
  }

  // CSV File Import (from file input)
  function handleFileChange(e) {
    setCsvError("");
    if (e.target.files && e.target.files[0]) {
      setCsvFile(e.target.files[0]);
    } else {
      setCsvFile(null);
    }
  }

  async function handleUploadCSV(e) {
    e.preventDefault();
    setCsvError("");
    if (!csvFile) {
      setCsvError("Please select a CSV file.");
      return;
    }
    const reader = new FileReader();
    reader.onload = async function(evt) {
      try {
        const csv = evt.target.result;
        const imported = csvToItems(csv);

        // Optional: Validate columns
        const expectedHeaders = fields.map(f => f.name);
        const fileHeaders = Object.keys(imported[0] || {});
        const missing = expectedHeaders.filter(h => !fileHeaders.includes(h));
        if (missing.length > 0) {
          setCsvError("Missing columns: " + missing.join(", "));
          setLoading(false);
          return;
        }

        setLoading(true);
        for (const item of imported) {
          if (item.id) {
            await supabase.from("items").upsert([item], { onConflict: ["id"] });
          } else {
            await supabase.from("items").insert([item]);
          }
        }
        fetchItems();
      } catch (err) {
        setCsvError("CSV import failed: " + err.message);
      }
      setLoading(false);
    };
    reader.onerror = function() {
      setCsvError("Error reading file.");
    };
    reader.readAsText(csvFile);
  }

  // Table fields
  const fields = [
    { name: "restaurant_nickname", label: "Nickname", width: 160 },
    { name: "category", label: "Category", width: 110 },
    { name: "vendor", label: "Vendor", width: 100 },
    { name: "purchase_unit", label: "Purchase Unit", width: 100 },
    { name: "count_tier1_unit", label: "Sleeve", width: 90 },
    { name: "count_tier1_factor", label: "T1 Factor", width: 70 },
    { name: "count_tier2_unit", label: "Cup", width: 90 },
    { name: "count_tier2_factor", label: "T2 Factor", width: 70 },
    { name: "count_tier3_unit", label: "Each", width: 90 },
    { name: "count_tier3_factor", label: "T3 Factor", width: 70 },
    { name: "conversion_factor", label: "Conv. Factor", width: 85 },
    { name: "master_inv_unit", label: "Master Unit", width: 100 },
    { name: "price", label: "Price", width: 70 },
    { name: "par_level", label: "Par Level", width: 80 },
    { name: "last_purchase_cost", label: "Last Cost", width: 90 },
    { name: "average_cost", label: "Avg Cost", width: 90 },
    { name: "current_stock", label: "Stock", width: 70 },
  ];

  return (
    <div style={{ minHeight: "100vh", background: BRAND_GRAY }}>
      <ParcostHeader />
      <div style={{
        maxWidth: 1400,
        margin: "40px auto",
        background: "#fff",
        borderRadius: 12,
        boxShadow: "0 2px 12px #0001",
        padding: 32
      }}>
        <BackButton onClick={() => onNavigate("dashboard")} />
        <h2 style={{ color: BRAND_BLUE, fontWeight: 800, textAlign: "center" }}>Manage Inventory Items</h2>
        <div style={{ display: "flex", gap: 18, marginBottom: 18 }}>
          <button
            style={mainBtnStyle}
            onClick={startAddItem}
            disabled={adding || loading}
          >
            + Add Item
          </button>
          <button
            style={mainBtnStyle}
            onClick={handleDownloadCSV}
            disabled={loading}
          >
            Download All (CSV)
          </button>
          {csvDownloadUrl && (
            <a
              href={csvDownloadUrl}
              download="items.csv"
              style={{
                marginLeft: 8,
                color: BRAND_BLUE,
                fontWeight: 600,
                fontSize: 15,
              }}
            >
              Save CSV
            </a>
          )}
          <button
            style={mainBtnStyle}
            onClick={handleDownloadTemplate}
          >
            Download Template
          </button>
        </div>
        <form
          onSubmit={handleUploadCSV}
          style={{
            marginBottom: 24,
            background: "#f4f6fa",
            padding: 12,
            borderRadius: 6,
            display: "flex",
            alignItems: "end",
            gap: 10,
          }}
        >
          <label style={{ fontWeight: 500 }}>
            Upload CSV:&nbsp;
            <input
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              style={{ fontSize: 13 }}
            />
          </label>
          <button
            type="submit"
            style={mainBtnStyle}
            disabled={loading || !csvFile}
          >
            Import CSV
          </button>
          {csvError && (
            <div style={{ color: BRAND_RED, fontWeight: 500 }}>{csvError}</div>
          )}
        </form>
        <div style={{ overflowX: "auto" }}>
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
                {fields.map((f) => (
                  <th
                    key={f.name}
                    style={{
                      background: "#f4f6fa",
                      fontWeight: 700,
                      fontSize: 17,
                      padding: "12px 8px",
                      border: "2px solid #dbe3ec",
                      minWidth: f.width,
                      textAlign: "center"
                    }}
                  >
                    {f.label}
                  </th>
                ))}
                <th style={{ ...thActionStyle, textAlign: "center" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {adding && (
                <tr>
                  {fields.map((f) => (
                    <td key={f.name} style={tdCenterStyle}>
                      <input
                        name={f.name}
                        value={newItem[f.name] ?? ""}
                        onChange={handleNewItemChange}
                        style={{
                          width: "100%",
                          padding: "5px 6px",
                          borderRadius: 4,
                          border: "1px solid #bbb",
                          fontSize: 15,
                          textAlign: "center"
                        }}
                      />
                    </td>
                  ))}
                  <td style={tdCenterStyle}>
                    <button onClick={saveNewItem} style={mainBtnStyle}>
                      Save
                    </button>
                    <button onClick={cancelAdd} style={mainBtnStyle}>
                      Cancel
                    </button>
                  </td>
                </tr>
              )}
              {items.map((item) =>
                editingId === item.id ? (
                  <tr key={item.id}>
                    {fields.map((f) => (
                      <td key={f.name} style={tdCenterStyle}>
                        <input
                          name={f.name}
                          value={editItem[f.name] ?? ""}
                          onChange={handleEditChange}
                          style={{
                            width: "100%",
                            padding: "5px 6px",
                            borderRadius: 4,
                            border: "1px solid #bbb",
                            fontSize: 15,
                            textAlign: "center"
                          }}
                        />
                      </td>
                    ))}
                    <td style={tdCenterStyle}>
                      <button onClick={saveEditItem} style={mainBtnStyle}>
                        Save
                      </button>
                      <button onClick={cancelEdit} style={mainBtnStyle}>
                        Cancel
                      </button>
                    </td>
                  </tr>
                ) : (
                  <tr key={item.id}>
                    {fields.map((f) => (
                      <td key={f.name} style={tdCenterStyle}>
                        {item[f.name]}
                      </td>
                    ))}
                    <td style={tdCenterStyle}>
                      <button onClick={() => startEdit(item)} style={mainBtnStyle}>
                        Edit
                      </button>
                      <button
                        onClick={() => deleteItem(item.id)}
                        style={dangerBtnStyle}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

const mainBtnStyle = {
  background: BRAND_BLUE,
  color: "#fff",
  border: "none",
  borderRadius: 4,
  padding: "7px 16px",
  fontWeight: 500,
  fontSize: 15,
  marginRight: 6,
  cursor: "pointer",
  transition: "background 0.15s, color 0.15s"
};
const dangerBtnStyle = {
  ...mainBtnStyle,
  background: BRAND_RED,
  color: "#fff"
};
const thActionStyle = {
  background: "#f4f6fa",
  fontWeight: 700,
  fontSize: 17,
  padding: "12px 8px",
  border: "2px solid #dbe3ec",
  minWidth: 110,
};
const tdStyle = {
  padding: "7px 8px",
  border: "1.5px solid #e2e8f0",
  fontSize: 15,
  background: "#fafdff",
  verticalAlign: "middle",
};
const tdCenterStyle = {
  ...tdStyle,
  textAlign: "center"
};