import React, { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";
import ParcostHeader from "./components/ParcostHeader";

const BRAND_BLUE = "var(--brand-blue)";
const BRAND_GREEN = "var(--brand-green)";
const BRAND_WHITE = "#fff";
const BRAND_GRAY = "var(--brand-gray)";
const BRAND_RED = "var(--brand-red, #bd3131)";

export default function UserManagement({ ownerId, businessId, onBackToAdmin }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [invite, setInvite] = useState({
    email: "",
    first_name: "",
    last_name: "",
    role: "staff"
  });
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteError, setInviteError] = useState("");
  const [removeLoading, setRemoveLoading] = useState(null);

  // Fetch users for this business
  useEffect(() => {
    async function fetchUsers() {
      setLoading(true);
      let query = supabase.from("user_roles").select("*");
      if (businessId) {
        query = query.eq("business_id", businessId);
      } else {
        query = query.eq("owner_id", ownerId);
      }
      const { data, error } = await query;
      if (data) setUsers(data);
      setLoading(false);
    }
    fetchUsers();
  }, [ownerId, businessId]);

  async function handleInviteSubmit(e) {
    e.preventDefault();
    setInviteLoading(true);
    setInviteError("");
    try {
      const { error } = await supabase.from("user_roles").upsert([
        {
          email: invite.email,
          first_name: invite.first_name,
          last_name: invite.last_name,
          role: invite.role,
          business_id: businessId,
          owner_id: ownerId,
          invited_at: new Date().toISOString(),
          status: "invited"
        }
      ], { onConflict: ["email", "business_id"] });
      if (error) throw error;
      setInvite({ email: "", first_name: "", last_name: "", role: "staff" });
      // Reload users (optional: could append just-invited user to list instead)
      setTimeout(() => window.location.reload(), 800);
    } catch (err) {
      setInviteError(err.message || "Error inviting user.");
    }
    setInviteLoading(false);
  }

  async function handleRemoveUser(user_id) {
    setRemoveLoading(user_id);
    try {
      const { error } = await supabase.from("user_roles").delete().eq("user_id", user_id);
      if (error) throw error;
      setUsers(users.filter(u => u.user_id !== user_id));
    } catch (err) {
      alert(err.message || "Error removing user.");
    }
    setRemoveLoading(null);
  }

  return (
    <div style={{ minHeight: "100vh", background: BRAND_GRAY }}>
      <ParcostHeader />
      <div style={{
        maxWidth: 630,
        margin: "0 auto",
        background: "#fff",
        borderRadius: 18,
        boxShadow: "0 2px 16px #0002",
        padding: "30px 32px"
      }}>
        <h1 style={{
          color: BRAND_BLUE,
          fontSize: 26,
          fontWeight: 900,
          marginBottom: 20,
          textAlign: "center",
          letterSpacing: "-0.02em",
        }}>User Management</h1>
        {/* Back to Dashboard Button */}
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16 }}>
          <button
            onClick={onBackToAdmin}
            style={{
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
            }}
          >
            ← Back to Dashboard
          </button>
        </div>
        <form onSubmit={handleInviteSubmit} style={{ display: "flex", gap: 12, marginBottom: 28, flexWrap: "wrap", alignItems: "flex-end" }}>
          <div style={{ flex: 1, minWidth: 130 }}>
            <label style={labelStyle}>First Name
              <input style={inputStyle} required value={invite.first_name} onChange={e => setInvite(i => ({ ...i, first_name: e.target.value }))} />
            </label>
          </div>
          <div style={{ flex: 1, minWidth: 130 }}>
            <label style={labelStyle}>Last Name
              <input style={inputStyle} required value={invite.last_name} onChange={e => setInvite(i => ({ ...i, last_name: e.target.value }))} />
            </label>
          </div>
          <div style={{ flex: 2, minWidth: 180 }}>
            <label style={labelStyle}>Email
              <input style={inputStyle} required type="email" value={invite.email} onChange={e => setInvite(i => ({ ...i, email: e.target.value }))} />
            </label>
          </div>
          <div style={{ flex: 1, minWidth: 110 }}>
            <label style={labelStyle}>Role
              <select style={inputStyle} value={invite.role} onChange={e => setInvite(i => ({ ...i, role: e.target.value }))}>
                <option value="staff">Staff</option>
                <option value="manager">Manager</option>
                <option value="owner">Owner</option>
              </select>
            </label>
          </div>
          <div style={{ flexBasis: "100%", height: 0 }} />
          <button
            type="submit"
            disabled={inviteLoading}
            style={{
              background: BRAND_GREEN,
              color: BRAND_WHITE,
              fontWeight: 700,
              fontSize: 17,
              border: "none",
              borderRadius: 8,
              padding: "12px 25px",
              marginTop: 6,
              cursor: inviteLoading ? "not-allowed" : "pointer",
              boxShadow: "0 2px 8px #0002"
            }}>
            {inviteLoading ? "Inviting..." : "Invite User"}
          </button>
          {inviteError && <span style={{ color: BRAND_RED, marginLeft: 14 }}>{inviteError}</span>}
        </form>
        <div style={{ margin: "22px 0 4px 0", fontWeight: 600, fontSize: 18 }}>Current Users</div>
        {loading ? (
          <div>Loading users...</div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 17, background: "#fff" }}>
            <thead>
              <tr style={{ background: "#f4f8ff" }}>
                <th style={thStyle}>Name</th>
                <th style={thStyle}>Email</th>
                <th style={thStyle}>Role</th>
                <th style={thStyle}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.user_id}>
                  <td style={tdStyle}>{user.first_name} {user.last_name}</td>
                  <td style={tdStyle}>{user.email}</td>
                  <td style={tdStyle}>{user.role}</td>
                  <td style={tdStyle}>
                    {user.role === "owner"
                      ? <span style={{ color: "#888" }}>Owner</span>
                      : (
                        <button
                          onClick={() => handleRemoveUser(user.user_id)}
                          disabled={removeLoading === user.user_id}
                          style={{
                            background: BRAND_RED,
                            color: "#fff",
                            border: "none",
                            borderRadius: 6,
                            padding: "6px 13px",
                            fontWeight: 600,
                            cursor: removeLoading === user.user_id ? "not-allowed" : "pointer"
                          }}>
                          {removeLoading === user.user_id ? "Removing..." : "Remove"}
                        </button>
                      )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

const inputStyle = {
  width: "100%",
  padding: "8px 11px",
  fontSize: 16,
  borderRadius: 6,
  border: "1.5px solid #e2e8f0",
  marginTop: 4,
  background: "#fafdff"
};
const labelStyle = { fontWeight: 500, fontSize: 15, marginBottom: 2, display: "block" };
const thStyle = { textAlign: "left", padding: "7px 9px", fontWeight: 700, fontSize: 15, borderBottom: "2px solid #e6eafa" };
const tdStyle = { padding: "7px 9px", borderBottom: "1px solid #f0f0f0" };