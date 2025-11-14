import React, { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";
import Home from "./Home";
import AuthPage from "./AuthPage";
import Dashboard from "./Dashboard";
import StartCount from "./StartCount";
import InventoryCount from "./InventoryCount";
import ReviewSubmit from "./ReviewSubmit";
import PreviousCounts from "./PreviousCounts";
import UsageReport from "./UsageReport";
import ManageFrequencies from "./ManageFrequencies";
import ManageItems from "./ManageItems";
import DeleteSnapshots from "./DeleteSnapshots";
import EraseAllCounts from "./EraseAllCounts";
import BusinessSetup from "./BusinessSetup";
import UserManagement from "./UserManagement";
import ManageStorageAreas from "./ManageStorageAreas";
import SortShelf from "./SortShelf";
import AssignItemsToLocations from "./AssignItemsToLocations";
import './styles.css';

export default function App() {
  const [page, setPage] = useState("dashboard"); // Skip auth, go straight to dashboard
  const [sessionId, setSessionId] = useState(null);
  const [user, setUser] = useState({ id: "temp-user" }); // Mock user
  const [firstName, setFirstName] = useState("Admin");
  const [userRole, setUserRole] = useState("owner");
  const [loading, setLoading] = useState(false); // No loading needed
  const [activeSession, setActiveSession] = useState(null);

  // AUTHENTICATION DISABLED - Direct access to dashboard
  useEffect(() => {
    // Skip all auth checks
  }, []);

  function handleNavigate(newPage, data) {
    setPage(newPage);
    if (newPage === "count" && data) setSessionId(data);
    if (newPage !== "count") setSessionId(null);
  }

  function handleSessionFinalized() {
    setActiveSession(null);
    setPage("dashboard");
  }

  async function handleLogout() {
    // Logout disabled - refresh page to reset
    window.location.reload();
  }

  // AUTHENTICATION BYPASSED - Direct dashboard access
  if (page === "dashboard")
    return (
      <Dashboard
        role={userRole}
        firstName={firstName}
        activeSessionId={activeSession}
        onStartCount={() => setPage("start_count")}
        onResumeCount={() => { setPage("count"); setSessionId(activeSession); }}
        onViewPrevious={() => setPage("previous_counts")}
        onUsageReport={() => setPage("usage_report")}
        onLogout={handleLogout}
        onBack={null}
        onEditBusiness={() => setPage("business_edit")}
        onUserManagement={() => setPage("user_management")}
        onManageLocations={() => setPage("shelf_to_sheet")}
        onManageStorageAreas={() => setPage("manage_storage_areas")}
        onManageItems={() => setPage("manage_items")}
        onManageFrequencies={() => setPage("manage_frequencies")}
        onDeleteSnapshots={() => setPage("delete_snapshots")}
        onEraseAllCounts={() => setPage("erase_all_counts")}
        onAssignItems={() => setPage("assign_items_to_locations")}
      />
    );

  // ... (rest of your page logic for other pages, unchanged)
  if (page === "business_edit") {
    return (
      <BusinessSetup
        ownerId={user.id}
        onComplete={() => setPage("dashboard")}
        onBackToDashboard={() => setPage("dashboard")}
        onLogout={handleLogout}
      />
    );
  }
  if (page === "user_management") {
    return (
      <UserManagement
        ownerId={user.id}
        onBackToAdmin={() => setPage("dashboard")}
        onLogout={handleLogout}
      />
    );
  }
  if (page === "manage_storage_areas") {
    return (
      <ManageStorageAreas
        user={user}
        userName={firstName}
        onBackToDashboard={() => setPage("dashboard")}
        onLogout={handleLogout}
      />
    );
  }
  if (page === "shelf_to_sheet") {
    return (
      <SortShelf
        onBackToDashboard={() => setPage("dashboard")}
        onLogout={handleLogout}
        userName={firstName}
      />
    );
  }
  if (page === "assign_items_to_locations") {
    return (
      <AssignItemsToLocations
        onNavigate={() => setPage("dashboard")}
      />
    );
  }
  if (page === "start_count")
    return (
      <StartCount
        user={user}
        onNavigate={handleNavigate}
        onSessionStarted={(sid) => {
          setSessionId(sid);
          setActiveSession(sid);
          setPage("count");
        }}
      />
    );
  if (page === "count")
    return (
      <InventoryCount
        user={user}
        sessionId={sessionId || activeSession}
        onNavigate={handleNavigate}
        onSessionFinalized={handleSessionFinalized}
      />
    );
  if (page === "review_submit")
    return (
      <ReviewSubmit
        user={user}
        sessionId={sessionId || activeSession}
        onNavigate={handleNavigate}
        onSessionFinalized={handleSessionFinalized}
      />
    );
  if (page === "previous_counts") return <PreviousCounts user={user} onNavigate={handleNavigate} />;
  if (page === "usage_report") return <UsageReport onNavigate={handleNavigate} />;
  if (page === "manage_frequencies") return <ManageFrequencies onNavigate={handleNavigate} />;
  if (page === "manage_items") return <ManageItems onNavigate={handleNavigate} />;
  if (page === "delete_snapshots") return <DeleteSnapshots onNavigate={handleNavigate} />;
  if (page === "erase_all_counts") return <EraseAllCounts onNavigate={handleNavigate} />;

  // Fallback
  return (
    <div style={{ margin: 40, color: "var(--brand-red)" }}>
      <h2>Page Not Found</h2>
      <button className="btn-secondary" onClick={() => setPage("dashboard")}>
        Back to Dashboard
      </button>
    </div>
  );
}