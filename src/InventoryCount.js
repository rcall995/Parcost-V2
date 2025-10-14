import React, { useEffect, useState, useCallback, useMemo } from "react";
import { supabase } from "./supabaseClient";
import ParcostHeader from "./components/ParcostHeader";
import BackButton from "./BackButton";
import AreaSelector from "./AreaSelector";
import "./styles.css";

export default function InventoryCount({ user, sessionId, onNavigate }) {
  const [locations, setLocations] = useState([]);
  const [selectedLoc, setSelectedLoc] = useState("");
  const [items, setItems] = useState([]);
  const [counts, setCounts] = useState({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  
  // --- Temporary function to calculate completion percentage ---
  const getAreaCompletion = useCallback((locId) => {
    // NOTE: This is a simplified calculation based on local state, 
    // simulating database check until full persistence is implemented.
    if (!locId) return 0;
    
    // We filter items to only those belonging to the current selectedLoc, but 
    // this function needs to calculate for ALL locations to update the selector buttons.
    // For now, we simulate completion based on items currently in state.
    const currentLocItems = items.filter(item => {
        const vals = counts[item.id];
        // An item is considered 'counted' if any tier value is greater than 0
        return vals && (vals.t1 > 0 || vals.t2 > 0 || vals.t3 > 0);
    });
    
    const countedItems = currentLocItems.length;
    const totalItems = items.length; // Assumes all items belong to all locations for completion estimate

    if (totalItems === 0) return 0;

    return (countedItems / totalItems) * 100;
  }, [items, counts]); 

  // --- Map locations for AreaSelector consumption ---
  const areasWithCompletion = useMemo(() => {
    return locations.map(loc => ({
      ...loc,
      // Pass true completion for the selected one, and 0 for others (due to state limitations)
      completionPercentage: loc.id === selectedLoc ? getAreaCompletion(loc.id) : 0, 
    }));
  }, [locations, selectedLoc, getAreaCompletion]);


  // 1. Fetch storage areas (locations) on mount
  useEffect(() => {
    async function fetchAll() {
      const { data: locs, error: locErr } = await supabase.from("locations").select("*").order("name");
      if (locErr) {
        setError("Failed to load locations: " + locErr.message);
        return;
      }

      setLocations(locs || []);
      if (locs && locs.length > 0 && !selectedLoc) {
        setSelectedLoc(locs[0].id);
      }
    }
    fetchAll();
  }, [selectedLoc]);

  // 2. Fetch items for the currently selected location
  useEffect(() => {
    async function fetchLocationItems() {
      if (!selectedLoc) { 
        setItems([]); 
        return; 
      }
      
      const { data: mapData, error: mapErr } = await supabase.from("location_map").select("item_id").eq("location_id", selectedLoc);
      if (mapErr) {
          setError("Failed to load item assignments: " + mapErr.message);
          return;
      }
      const itemIds = (mapData || []).map(m => m.item_id);
      
      if (!itemIds.length) { 
        setItems([]); 
        return; 
      }
      
      // Fetch item details and order data
      const { data: orderData } = await supabase.from('location_item_order').select('item_id, sort_order').eq('location_id', selectedLoc);
      const orderMap = {};
      (orderData || []).forEach(o => { orderMap[o.item_id] = o.sort_order; });
      
      const { data: itms, error: itmsErr } = await supabase.from("items").select("*").in("id", itemIds);
      if (itmsErr) {
          setError("Failed to load item details: " + itmsErr.message);
          return;
      }
      
      // Sort items by custom order, fallback to nickname
      const sortedItems = (itms || []).sort((a, b) => {
        const oa = orderMap[a.id] ?? 9999;
        const ob = orderMap[b.id] ?? 9999;
        if (oa !== ob) return oa - ob;
        return a.restaurant_nickname.localeCompare(b.restaurant_nickname);
      });
      
      setItems(sortedItems);
      
      setCounts(prev => {
        const nc = { ...prev };
        (sortedItems || []).forEach(it => {
          if (!nc[it.id]) nc[it.id] = { t1: 0, t2: 0, t3: 0 };
        });
        return nc;
      });
    }
    fetchLocationItems();
  }, [selectedLoc]);

  // --- Handlers for Count Tiers (omitted for brevity, they are unchanged) ---
  const handleChange = (itemId, tier, val) => {
    setCounts(prev => ({
      ...prev,
      [itemId]: { ...prev[itemId], [tier]: Math.max(0, Number(val) || 0) }
    }));
  };
  const handleAdd = (itemId, tier) => {
    setCounts(prev => ({
      ...prev,
      [itemId]: { ...prev[itemId], [tier]: (prev[itemId]?.[tier] || 0) + 1 }
    }));
  };
  const handleSubtract = (itemId, tier) => {
    setCounts(prev => ({
      ...prev,
      [itemId]: { ...prev[itemId], [tier]: Math.max(0, (prev[itemId]?.[tier] || 0) - 1) }
    }));
  };
  // --- End Handlers ---

  function getTotals(item, vals) {
    const f1 = item.count_tier1_factor || 1; 
    const f2 = item.count_tier2_factor || 1;
    const f3 = item.count_tier3_factor || 1;

    const t1 = vals.t1 || 0, t2 = vals.t2 || 0, t3 = vals.t3 || 0;
    
    const totalCount = t1 * f1 + t2 * f2 + t3 * f3; 
    
    const pricePerMasterUnit = (item.last_purchase_cost || item.price || 0) / (item.count_tier1_factor || 1);
    
    const finalTotalValue = totalCount * pricePerMasterUnit;

    return { total: totalCount, value: finalTotalValue };
  }

  // Handle saving the accumulated counts
  async function handleSave() {
    setSaving(true);
    setError(""); setSuccess("");
    
    const countsToSave = [];
    Object.entries(counts).forEach(([itemId, vals]) => {
        const itemDetail = items.find(i => i.id === itemId);
        if (!itemDetail) return;
        
        const { total, value } = getTotals(itemDetail, vals);
        
        // Only save/upsert items that have been counted (total > 0)
        if (total > 0) {
            countsToSave.push({
                session_id: sessionId,
                location_id: selectedLoc,
                item_id: itemId,
                count: total, // Final aggregated count
                count_value: value, 
                tier1_count: vals.t1, // Assuming schema update added these columns
                tier2_count: vals.t2,
                tier3_count: vals.t3,
                counted_at: new Date().toISOString()
            });
        }
    });

    try {
        if (countsToSave.length > 0) {
            const { error: saveError } = await supabase
                .from("session_counts")
                .upsert(countsToSave, { onConflict: ['session_id', 'location_id', 'item_id'] });

            if (saveError) throw saveError;
        }

        setSuccess("Counts saved!");
        
    } catch (err) {
      setError("Failed to save: " + (err.message || err.toString()));
    }
    setSaving(false);
  }

  // --- Item Table Component (omitted for brevity, content is unchanged) ---
  const ItemCountTable = ({ item }) => {
    const vals = counts[item.id] || { t1: 0, t2: 0, t3: 0 };
    const { total, value } = getTotals(item, vals);
    
    const tiers = [1, 2, 3].map(tier => ({
      key: `t${tier}`,
      label: item[`count_tier${tier}_unit`],
      value: vals[`t${tier}`] || 0
    })).filter(t => !!t.label);

    const primaryCountUnit = item.count_tier1_unit || item.purchase_unit || 'Case unit';
    const masterUnit = item.master_inventory_unit || 'units';

    const purchaseUnitFactor = item.count_tier1_factor || 1; 
    const colCount = tiers.length; 

    return (
      <div className="inv-item-card-wrapper">
        <table className="inv-count-table">
          <tbody>
            {/* ROW 1: ITEM NAME / SUMMARY / TIER HEADERS (Desktop Layout) */}
            <tr className="inv-row inv-summary-header-row">
              <td className="inv-cell inv-totals-label-cell desktop-item-info" rowSpan={2}>
                <div className="item-nickname-container">
                  <span className="item-nickname">{item.restaurant_nickname}</span>
                  <div className="item-conversion-subtitle">
                      {`${purchaseUnitFactor} ${masterUnit} per ${primaryCountUnit}`}
                  </div>
                  <div className="item-totals-summary desktop-only">
                      <span className="tot-label">Total:</span> {total.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })} {masterUnit}
                      <span className="val-label">Value:</span> ${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                </div>
              </td>
              
              {/* Mobile Full-Width Summary Bar (Visible on Mobile, Hidden on Desktop) */}
              <td colSpan={colCount} className="inv-cell inv-mobile-summary-bar">
                <div className="mobile-summary-content">
                  <div className="mobile-summary-row mobile-summary-name-and-conv">
                      <span className="item-nickname-mobile">{item.restaurant_nickname}</span>
                      <span className="item-conversion-subtitle-mobile-top">
                          {`${purchaseUnitFactor} ${masterUnit} per ${primaryCountUnit}`}
                      </span>
                  </div>
                  <div className="mobile-summary-row mobile-summary-details">
                      <div className="inv-mobile-total-cell">
                          <span className="tot-label">Total:</span> {total.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })} {masterUnit}
                      </div>
                      <div className="inv-mobile-value-cell">
                          <span className="val-label">Value:</span> ${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                  </div>
                </div>
              </td>

              {/* Tier Headers (CASE, SLEEVE, EACH) - Visible on Desktop */}
              {tiers.map(tier => (
                <td className="inv-cell inv-tier-header-cell desktop-only-cell" key={tier.key}>
                  {tier.label}
                </td>
              ))}
            </tr>
            
            {/* ROW 2: COUNT CONTROLS (Desktop & Mobile Layout) */}
            <tr className="inv-row inv-counts-row">
              {/* This cell is ONLY for desktop alignment, so it's hidden on mobile */}
              <td className="inv-cell inv-totals-label-cell desktop-item-info mobile-hidden-cell"></td>
              
              {/* Count Controls */}
              {tiers.map(tier => (
                  <td className="inv-cell inv-tier-controls-wrapper-cell" key={tier.key}>
                    {/* Mobile: Show label here as well (hidden on desktop) */}
                    <div className="inv-count-label mobile-label-only">
                        {tier.label}
                    </div>
                    <div className="inv-card-tier-controls-cell">
                      <button type="button" onClick={() => handleSubtract(item.id, tier.key)} className="inv-tier-btn">-</button>
                      <input
                        type="number"
                        min={0}
                        value={tier.value}
                        onChange={e => handleChange(item.id, tier.key, e.target.value)}
                        className="inv-tier-input"
                      />
                      <button type="button" onClick={() => handleAdd(item.id, tier.key)} className="inv-tier-btn">+</button>
                    </div>
                  </td>
              ))}
            </tr>
            
          </tbody>
        </table>
      </div>
    );
  };
  // --- End Item Table Component ---

  const currentLocName = locations.find(loc => loc.id === selectedLoc)?.name || "Location";

  return (
    <div style={{ minHeight: "100vh", background: "var(--brand-gray)" }}>
      <ParcostHeader />
      {/* RESTORED: Embedded CSS Block (kept for component integrity) */}
      <style>
        {`
        /* --- GENERAL / DESKTOP STYLES (Screen width > 600px) --- */
        
        .inv-count-table {
          width: 100%;
          border-collapse: collapse;
          table-layout: fixed;
          font-size: 14px;
        }

        .inv-item-card-wrapper {
            margin-bottom: 20px;
            border: 1px solid #e0e0e0;
            border-radius: 8px;
            overflow: hidden; 
            box-shadow: 0 1px 3px rgba(0,0,0,0.05);
        }

        .inv-cell {
          border: 1px solid #e0e0e0;
          padding: 8px;
          text-align: center;
          vertical-align: middle;
        }
        
        .inv-summary-header-row {
            background-color: #f5f8ff;
        }

        .inv-totals-label-cell {
            background-color: #fff;
            width: 30%; 
            text-align: left;
            padding: 12px 12px;
            border-right: 1px solid #e0e0e0;
        }
        
        .inv-tier-header-cell {
            font-weight: 700;
            color: var(--brand-blue);
            text-transform: uppercase;
            font-size: 12px;
        }

        .item-nickname {
            font-weight: 700; 
            font-size: 16px; 
            color: var(--brand-blue);
        }

        .item-conversion-subtitle {
            margin-top: 5px; 
            font-size: 12px; 
            font-weight: 400; 
            color: #555;
            margin-bottom: 0; 
        }

        .item-totals-summary {
            font-size: 14px;
            font-weight: 500;
            margin-top: 10px;
            text-align: left;
        }
        
        .tot-label, .val-label {
            font-weight: 600;
        }
        .tot-label {
             color: var(--brand-blue);
        }
        .val-label {
             margin-left: 8px; 
             color: var(--brand-green);
        }

        .desktop-only {
            display: block; 
        }
        
        .inv-mobile-summary-bar {
            display: none; 
        }
        
        .mobile-label-only {
            display: none; 
        }
        
        .mobile-hidden-cell {
              display: none; 
        }


        .inv-counts-row {
            background-color: #fff;
        }
        
        .inv-tier-controls-wrapper-cell {
            padding: 12px 6px;
            border-top: 1px solid #e0e0e0;
        }

        .inv-card-tier-controls-cell {
          padding: 5px 0; 
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px; 
        }

        .inv-tier-btn {
          all: unset;
          cursor: pointer;
          background: var(--brand-blue);
          color: #fff;
          border-radius: 4px;
          width: 38px; 
          height: 38px; 
          font-weight: 700;
          line-height: 36px; 
          padding: 0;
          font-size: 18px; 
          transition: background 0.1s;
          text-align: center;
        }

        .inv-tier-input {
          all: unset;
          box-sizing: border-box;
          width: 70px; 
          height: 38px; 
          text-align: center;
          border: 1px solid #ccc;
          border-radius: 4px;
          margin: 0;
          font-size: 17px; 
          background-color: var(--brand-gray);
          padding: 0;
        }
        .inv-tier-controls-wrapper-cell input {
            margin: 0 !important;
            padding: 0 !important;
        }

        /* --- MOBILE OPTIMIZATION (Screen width <= 600px) --- */
        @media (max-width: 600px) {
            .card-container {
                margin: 20px 2vw;
                padding: 20px 4vw;
                box-shadow: none !important;
            }

            .inv-totals-label-cell, .desktop-only-cell, .mobile-hidden-cell {
                display: none; 
            }
            
            .inv-tier-header-cell {
                display: none;
            }
            
            .inv-mobile-summary-bar {
                display: table-cell; 
                padding: 0 !important;
                background-color: var(--brand-blue);
                color: #fff;
                border: none;
            }
            
            .inv-summary-header-row {
                background-color: #fff;
            }

            .inv-counts-row {
                display: flex;
                flex-direction: row;
                width: 100%;
                border-bottom: 1px solid var(--border-light);
            }
            
            .inv-tier-controls-wrapper-cell {
                width: 33.33%; 
                flex: 1 1 0;
                padding: 8px 0px !important;
                display: flex;
                flex-direction: column;
                justify-content: center;
                align-items: center;
                border: none !important; 
                border-left: 1px solid var(--border-light);
            }
            .inv-tier-controls-wrapper-cell:first-child {
                border-left: none !important;
            }
            
            .mobile-summary-content {
                display: flex;
                flex-direction: column; 
                padding: 10px 12px;
                width: 100%;
            }

            .mobile-summary-row.mobile-summary-name-and-conv {
                display: flex;
                justify-content: space-between;
                align-items: flex-start;
                margin-bottom: 5px;
            }
            
            .item-nickname-mobile {
                font-weight: 800; 
                font-size: 18px; 
                color: #fff; 
                text-transform: uppercase; 
                flex-basis: 55%; 
                text-align: left;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }
            
            .item-conversion-subtitle-mobile-top {
                color: #e5e5e5;
                font-size: 12px;
                text-align: right;
                font-weight: 500;
                flex-basis: 45%; 
                white-space: nowrap;
            }


            .mobile-summary-row.mobile-summary-details {
                display: grid;
                grid-template-columns: 1.0fr 2.2fr; 
                gap: 5px;
                width: 100%;
                font-size: 13px; 
                font-weight: 700;
            }

            .inv-mobile-total-cell {
                text-align: left;
                font-weight: 700;
            }

            .inv-mobile-value-cell {
                text-align: right;
                font-weight: 700;
            }
            
            .tot-label, .val-label {
                margin-left: 0;
                margin-right: 2px;
            }

            .inv-tier-btn {
                width: 30px; 
                height: 30px; 
                line-height: 28px;
                font-size: 15px; 
            }
            .inv-tier-input {
                width: 40px; 
                height: 30px;
                font-size: 14px;
            }

            .mobile-label-only {
                display: block; 
                font-weight: 600;
                margin-bottom: 5px;
                color: var(--text-dark);
            }
            .inv-count-table {
                table-layout: auto;
            }
        }
        `}
      </style>
      {/* END RESTORED: Embedded CSS Block */}
      
      <div 
        className="card-container" 
        style={{
          maxWidth: 800,
          margin: "40px auto",
          padding: 32
        }}
      >
        {/* Centered Back Button Wrapper */}
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
            <BackButton onClick={() => onNavigate("dashboard")} />
        </div>
        
        <h2 style={{ color: "var(--brand-blue)", fontWeight: 800, textAlign: "center", marginBottom: 22 }}>
          Inventory Count
        </h2>
        
        {/* --- AREA SELECTOR --- */}
        <AreaSelector
            areas={areasWithCompletion}
            selectedAreaId={selectedLoc}
            onSelectArea={setSelectedLoc}
        />

        <div style={{ marginBottom: 22, fontWeight: 600, fontSize: 18, textAlign: 'center' }}>
             Counting in: {currentLocName}
        </div>
        
        {error && <div className="text-danger" style={{ marginBottom: 8 }}>{error}</div>}
        {success && <div className="text-success" style={{ marginBottom: 8 }}>{success}</div>}

        {/* --- Render each item in its own table (card) --- */}
        <div className="inv-table-container">
          {items.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-mid)' }}>
                No items assigned to this location.
            </div>
          ) : (
            items.map(item => (
              <ItemCountTable key={item.id} item={item} />
            ))
          )}
        </div>
        
        <button
          onClick={handleSave}
          disabled={saving}
          className="btn-primary"
          style={{
            fontWeight: 700,
            fontSize: 17,
            width: 300, /* Slightly wider to fit new text */
            display: "block",
            margin: "38px auto 0 auto",
            padding: "13px 0",
          }}
        >
          {/* --- TEXT CHANGE HERE --- */}
          {saving ? "Saving..." : "Complete This Storage Area"} 
        </button>
        
        {/* Navigate to Review/Submit Page */}
        <button
          onClick={() => onNavigate("review_submit")}
          disabled={saving}
          className="btn-secondary"
          style={{
            fontWeight: 700,
            fontSize: 16,
            width: 250,
            display: "block",
            margin: "18px auto 0 auto",
            padding: "10px 0",
          }}
        >
          Finish Session & Review
        </button>
      </div>
    </div>
  );
}