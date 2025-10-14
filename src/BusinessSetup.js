import React, { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";
import ParcostHeader from "./components/ParcostHeader";

const BRAND_BLUE = "var(--brand-blue)";
const BRAND_GREEN = "var(--brand-green)";
const BRAND_WHITE = "#fff";
const BRAND_GRAY = "var(--brand-gray)";
const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default function BusinessSetup({ ownerId, onComplete, onBackToDashboard, onLogout }) {
  const [businessName, setBusinessName] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [logoFile, setLogoFile] = useState(null);
  const [logoUrl, setLogoUrl] = useState("");
  const [weeklyDay, setWeeklyDay] = useState("Monday");
  const [monthlyType, setMonthlyType] = useState("EOM");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [initialLoad, setInitialLoad] = useState(true);

  // Fetch business and owner info on mount for editing
  useEffect(() => {
    async function fetchData() {
      setInitialLoad(true);
      // Fetch business info
      const { data: business } = await supabase
        .from("business_profiles")
        .select("*")
        .eq("owner_id", ownerId)
        .single();
      if (business) {
        setBusinessName(business.name || "");
        setAddress(business.address || "");
        setPhone(business.phone || "");
        setLogoUrl(business.logo_url || "");
        setWeeklyDay(business.weekly_inventory_day || "Monday");
        setMonthlyType(business.monthly_inventory_type || "EOM");
      }
      // Fetch owner info
      const { data: owner } = await supabase
        .from("user_roles")
        .select("first_name, last_name")
        .eq("user_id", ownerId)
        .single();
      if (owner) {
        setFirstName(owner.first_name || "");
        setLastName(owner.last_name || "");
      }
      setInitialLoad(false);
    }
    if (ownerId) fetchData();
  }, [ownerId]);

  async function handleLogoUpload(file) {
    const { data, error } = await supabase.storage
      .from("logos")
      .upload(`business/${ownerId}/${file.name}`, file, { upsert: true });
    if (error) throw error;
    const { data: publicUrlData } = supabase.storage
      .from("logos")
      .getPublicUrl(`business/${ownerId}/${file.name}`);
    return publicUrlData.publicUrl;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    let uploadedLogoUrl = logoUrl;
    try {
      // 1. Upload logo if present
      if (logoFile) {
        uploadedLogoUrl = await handleLogoUpload(logoFile);
        setLogoUrl(uploadedLogoUrl);
      }

      // 2. Upsert business information
      const { error: dbError } = await supabase
        .from("business_profiles")
        .upsert([
          {
            owner_id: ownerId,
            name: businessName,
            address,
            phone,
            logo_url: uploadedLogoUrl,
            weekly_inventory_day: weeklyDay,
            monthly_inventory_type: monthlyType,
          },
        ], { onConflict: ["owner_id"] });
      if (dbError) throw dbError;

      // 3. Upsert user role + name information
      const { error: rolesError } = await supabase
        .from("user_roles")
        .upsert([
          {
            user_id: ownerId,
            role: "owner",
            first_name: firstName,
            last_name: lastName,
            assigned_at: new Date().toISOString()
          }
        ], { onConflict: ["user_id"] });
      if (rolesError) throw rolesError;

      setLoading(false);
      if (onComplete) onComplete();
    } catch (err) {
      setError(err.message || "Error saving business info.");
      setLoading(false);
    }
  }

  return (
    <div style={{
      minHeight: "100vh",
      background: BRAND_GRAY,
      display: "flex",
      flexDirection: "column",
    }}>
      <ParcostHeader
        showBack={true}
        onBackToDashboard={onBackToDashboard}
        showLogout={true}
        onLogout={onLogout}
      />
      <div style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "calc(100vh - 110px)",
        color: BRAND_BLUE,
        padding: "24px 6vw"
      }}>
        <h1 style={{ fontWeight: 900, fontSize: 28, color: BRAND_BLUE, marginBottom: 8, textAlign: "center" }}>
          {initialLoad ? "Loading..." : "Edit Your Business"}
        </h1>
        <form onSubmit={handleSubmit} style={{
          background: "#fff",
          color: "#222",
          borderRadius: 14,
          maxWidth: 440,
          width: "100%",
          padding: "6vw 6vw 30px 6vw",
          boxShadow: "0 2px 16px #0002",
          display: "flex",
          flexDirection: "column",
          gap: 17
        }}>
          <label>
            First Name
            <input
              value={firstName}
              onChange={e => setFirstName(e.target.value)}
              required
              style={inputStyle}
              autoComplete="given-name"
            />
          </label>
          <label>
            Last Name
            <input
              value={lastName}
              onChange={e => setLastName(e.target.value)}
              required
              style={inputStyle}
              autoComplete="family-name"
            />
          </label>
          <label>
            Business Name
            <input value={businessName} onChange={e => setBusinessName(e.target.value)} required style={inputStyle} />
          </label>
          <label>
            Address
            <input value={address} onChange={e => setAddress(e.target.value)} required style={inputStyle} />
          </label>
          <label>
            Phone Number
            <input value={phone} onChange={e => setPhone(e.target.value)} required style={inputStyle} />
          </label>
          <label>
            Logo (square .png recommended)
            <input type="file" accept="image/*"
              onChange={e => setLogoFile(e.target.files[0])}
              style={inputStyle} />
          </label>
          {(logoFile || logoUrl) && (
            <div style={{ margin: "0 auto" }}>
              <img
                src={logoFile ? URL.createObjectURL(logoFile) : logoUrl}
                alt="Business Logo Preview"
                style={{ maxWidth: 70, maxHeight: 70, margin: "10px auto", borderRadius: 10 }}
              />
            </div>
          )}
          <label>
            Weekly Inventory Day
            <select value={weeklyDay} onChange={e => setWeeklyDay(e.target.value)} style={inputStyle}>
              {WEEKDAYS.map(day => <option key={day} value={day}>{day}</option>)}
            </select>
          </label>
          <label>
            Monthly Inventory Cycle
            <select value={monthlyType} onChange={e => setMonthlyType(e.target.value)} style={inputStyle}>
              <option value="EOM">End of Month (last calendar day)</option>
              <option value="13-period">13 Periods per Year</option>
            </select>
          </label>
          <div style={{ display: "flex", gap: 12, justifyContent: "flex-end", marginTop: 6 }}>
            <button
              type="button"
              style={{
                background: "#fff",
                color: "var(--brand-blue)",
                border: "1.5px solid var(--brand-blue)",
                borderRadius: 8,
                fontWeight: 600,
                padding: "10px 26px",
                fontSize: 16,
                cursor: "pointer",
              }}
              onClick={onBackToDashboard}
            >
              Cancel
            </button>
            <button
              type="submit"
              style={{
                background: BRAND_GREEN,
                color: BRAND_WHITE,
                fontWeight: 700,
                fontSize: 19,
                border: "none",
                borderRadius: 8,
                padding: "10px 26px",
                cursor: loading ? "not-allowed" : "pointer",
                boxShadow: "0 2px 8px #0002"
              }}
              disabled={loading}
            >
              {loading ? "Saving..." : "Save Changes"}
            </button>
          </div>
          {error && <div style={{ color: "#bd3131", marginTop: 12 }}>{error}</div>}
        </form>
      </div>
    </div>
  );
}

const inputStyle = {
  width: "100%",
  padding: "11px 13px",
  fontSize: 17,
  borderRadius: 6,
  border: "1.5px solid #e2e8f0",
  marginTop: 5,
  marginBottom: 2,
  background: "#fafdff"
};