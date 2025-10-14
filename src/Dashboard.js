import React from "react";
import ParcostHeader from "./components/ParcostHeader";

export default function Dashboard({
  role,
  activeSessionId, // <-- NEW PROP
  onStartCount,
  onResumeCount, // <-- NEW PROP
  onViewPrevious,
  onUsageReport,
  onLogout,
  firstName,
  onEditBusiness,
  onUserManagement,
  onManageLocations,
  onManageStorageAreas,
  onManageItems,
  onManageFrequencies,
  onDeleteSnapshots,
  onEraseAllCounts,
  onAssignItems 
}) {
  const isOwner = role === "owner";
  const isManager = role === "manager";
  const isAdmin = isOwner || role === "admin";

  // Determine the primary count action
  const countAction = activeSessionId ? (
    <button className="btn-primary" onClick={onResumeCount} style={{padding: "15px 0", fontSize: 18, width: "100%", background: "var(--brand-yellow)"}}>
      Resume Inventory Count
    </button>
  ) : (
    <button className="btn-primary" onClick={onStartCount} style={{padding: "15px 0", fontSize: 18, width: "100%"}}>
      Start Inventory Count
    </button>
  );

  return (
    <div style={{ minHeight: "100vh", background: "var(--brand-gray)" }}>
      <ParcostHeader
        showLogout={true}
        onLogout={onLogout}
        userName={firstName && `Welcome, ${firstName}`}
      />
      <div
        style={{
          maxWidth: 900,
          margin: "0 auto",
          marginTop: 42,
          padding: "0 8px 60px 8px"
        }}
      >
        <h1
          style={{
            color: "var(--brand-blue)",
            fontSize: 28,
            fontWeight: 900,
            margin: "0 0 24px 0",
            textAlign: "center",
            letterSpacing: "-0.02em",
          }}
        >
          Dashboard
        </h1>
        <div
          style={{
            display: "flex",
            gap: 38,
            alignItems: "flex-start",
            justifyContent: "center",
            flexWrap: "wrap"
          }}
        >
          {/* Standard Features */}
          <div style={{ flex: "1 1 320px", minWidth: 300, maxWidth: 380 }}>
            <h2 className="section-title">Inventory</h2>
            <div className="button-group">
              
              {/* --- NEW/RESUME BUTTON --- */}
              {countAction} 
              {/* ------------------------- */}
              
              <button className="btn-secondary" onClick={onViewPrevious}>
                Previous Counts
              </button>
              <button className="btn-secondary" onClick={onUsageReport}>
                Usage Report
              </button>
              <button className="btn-secondary" onClick={onManageLocations}>
                Shelf to Sheet
              </button>
              <button className="btn-secondary" onClick={onManageStorageAreas}>
                Manage Storage Areas
              </button>
              {(isOwner || isManager) && (
                <button className="btn-secondary" onClick={onAssignItems}>
                  Assign Items to Locations
                </button>
              )}
            </div>
          </div>
          {/* Admin Features */}
          {isAdmin && (
            <div style={{ flex: "1 1 320px", minWidth: 300, maxWidth: 380 }}>
              <h2 className="section-title">Admin Features</h2>
              <div className="button-group">
                <button className="btn-secondary" onClick={onEditBusiness}>
                  Edit Business Info
                </button>
                <button className="btn-secondary" onClick={onUserManagement}>
                  User Management
                </button>
                <button className="btn-secondary" onClick={onManageItems}>
                  Manage All Inventory Items
                </button>
                <button className="btn-secondary" onClick={onManageFrequencies}>
                  Manage Count Frequencies
                </button>
                <button className="btn-secondary" onClick={onDeleteSnapshots}>
                  Delete Old Snapshots
                </button>
                <button className="btn-danger" style={{ marginTop: 8 }} onClick={onEraseAllCounts}>
                  <span role="img" aria-label="warning" style={{ marginRight: 8 }}>
                    ⚠️
                  </span>
                  Erase All Counts
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      <style>{`
        /* Note: Moving these embedded styles to styles.css in a later step is recommended */
        .section-title {
          color: var(--brand-blue);
          font-weight: 800;
          font-size: 20px;
          margin: 0 0 14px 0;
          letter-spacing: -0.01em;
          text-align: left;
        }
        .button-group {
            display: flex;
            flex-direction: column;
            gap: 16px;
        }
        .btn-secondary {
            background: var(--brand-white);
            color: var(--brand-blue);
            border: 1.5px solid var(--brand-blue);
            padding: 15px 0;
            font-size: 18px;
            width: 100%;
        }
      `}</style>
    </div>
  );
}