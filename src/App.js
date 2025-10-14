import React, { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";
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
  const [page, setPage] = useState("dashboard");
  const [sessionId, setSessionId] = useState(null);
  const [user, setUser] = useState(null);
  const [firstName, setFirstName] = useState("");
  const [userRole, setUserRole] = useState("");
  const [loading, setLoading] = useState(true);
  const [activeSession, setActiveSession] = useState(null); // <-- NEW STATE

  // Check Supabase session and active count on mount
  useEffect(() => {
    let ignore = false;
    async function checkSession() {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      let fetchedFirstName = "";
      let fetchedRole = "";
      let activeSessionData = null; // To hold the open session info

      if (user) {
        // 1. Fetch the user's first_name and role from user_roles table
        const { data: profile } = await supabase
          .from('user_roles')
          .select('first_name, role')
          .eq('user_id', user.id)
          .single();
        if (profile) {
          fetchedFirstName = profile.first_name || "";
          fetchedRole = profile.role || "";
        }

        // 2. Check for an active inventory session
        const { data: openSession } = await supabase
          .from('inventory_sessions')
          .select('id')
          .eq('status', 'in_progress')
          .single();

        if (openSession) {
          activeSessionData = openSession.id;
        }
      }

      if (!ignore) {
        setUser(user);
        setFirstName(fetchedFirstName);
        setUserRole(fetchedRole);
        setActiveSession(activeSessionData); // <-- SET ACTIVE SESSION
        setLoading(false);
      }
    }
    checkSession();
    // Listen for auth changes
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (!session) setPage("dashboard");
    });
    return () => {
      ignore = true;
      authListener?.subscription.unsubscribe();
    };
  }, []);

  // Function to navigate and update activeSession status
  function handleNavigate(newPage, data) {
    setPage(newPage);
    if (newPage === "count" && data) setSessionId(data);
    if (newPage !== "count") setSessionId(null);
  }

  // Function called when a session is officially completed/finalized
  function handleSessionFinalized() {
    setActiveSession(null); // Clear the active session status
    setPage("dashboard");
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    setUser(null);
    setPage("dashboard");
  }

  if (loading) return <div>Loading...</div>;
  if (!user) return <AuthPage onAuth={() => window.location.reload()} />;
  
  // Logic to handle navigation for the single open session
  const activeSessionId = sessionId || activeSession;
  
  if (page === "start_count" && activeSession) {
      // If the user tries to start a new count but one is active, redirect to resume
      setPage("count"); 
      setSessionId(activeSession);
  }

  // Business Info Edit page (owner/admin only)
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
  
  // User Management
  if (page === "user_management") {
    return (
      <UserManagement
        ownerId={user.id}
        onBackToAdmin={() => setPage("dashboard")}
        onLogout={handleLogout}
      />
    );
  }

  // Manage Storage Areas
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

  // Shelf to Sheet (Sort Shelf)
  if (page === "shelf_to_sheet") {
    return (
      <SortShelf
        onBackToDashboard={() => setPage("dashboard")}
        onLogout={handleLogout}
        userName={firstName}
      />
    );
  }

  // Assign Items to Locations
  if (page === "assign_items_to_locations") {
    return (
      <AssignItemsToLocations
        onNavigate={() => setPage("dashboard")}
      />
    );
  }

  // Main Dashboard/Menu (all roles)
  if (page === "dashboard")
    return (
      <Dashboard
        role={userRole}
        firstName={firstName}
        // Pass the active session status down to the Dashboard
        activeSessionId={activeSession} 
        
        onStartCount={() => setPage("start_count")}
        // If an active session exists, clicking StartCount acts as ResumeCount
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

  // Inventory Count workflow
  if (page === "start_count")
    return (
      <StartCount
        user={user}
        onNavigate={handleNavigate}
        onSessionStarted={(sid) => {
          setSessionId(sid);
          setActiveSession(sid); // Set the new session as active
          setPage("count");
        }}
      />
    );
  
  if (page === "count")
    return (
      <InventoryCount
        user={user}
        sessionId={activeSessionId}
        onNavigate={handleNavigate}
        // Pass the finalization handler down
        onSessionFinalized={handleSessionFinalized} 
      />
    );
    
  if (page === "review_submit")
    return (
      <ReviewSubmit
        user={user}
        sessionId={activeSessionId}
        onNavigate={handleNavigate}
        onSessionFinalized={handleSessionFinalized} // Use the new centralized handler
      />
    );

  // History/Reporting
  if (page === "previous_counts")
    return <PreviousCounts user={user} onNavigate={handleNavigate} />;
  if (page === "usage_report")
    return <UsageReport onNavigate={handleNavigate} />;

  // Admin/Owner functions
  if (page === "manage_frequencies")
    return <ManageFrequencies onNavigate={handleNavigate} />;
  if (page === "manage_items")
    return <ManageItems onNavigate={handleNavigate} />;
  if (page === "delete_snapshots")
    return <DeleteSnapshots onNavigate={handleNavigate} />;
  if (page === "erase_all_counts")
    return <EraseAllCounts onNavigate={handleNavigate} />;

  // Default fallback
  return (
    <div style={{ margin: 40, color: "var(--brand-red)" }}>
      <h2>Page Not Found</h2>
      <button className="btn-secondary" onClick={() => setPage("dashboard")}>
        Back to Dashboard
      </button>
    </div>
  );
}