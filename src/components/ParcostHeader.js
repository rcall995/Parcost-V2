import React from "react";
import logo from "../assets/parcost-logo.png"; // Adjust this path to match your project structure

export default function ParcostHeader({
  onLogout,
  onBackToDashboard,
  showBack = false,
  showLogout = false,
  userName = ""
}) {
  // New Logo Height: 48px * 2.5 = 120px
  // New Header Min Height: 70px * 2 = 140px (to allow for padding/spacing)
  const newHeaderHeight = 140; 
  const newLogoHeight = 120;
  
  return (
    <header
      style={{
        background: "var(--brand-blue)",
        padding: "0 0 0 0",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        minHeight: newHeaderHeight, // Increased to accommodate larger logo
        boxShadow: "0 2px 8px #0001",
        width: "100%",
        position: "relative"
      }}
    >
      <div style={{
        display: "flex",
        alignItems: "center",
        height: newHeaderHeight, // Increased to accommodate larger logo
        marginLeft: 24
      }}>
        <img
          src={logo}
          alt="ParCost Inventory"
          height={newLogoHeight} // 2.5x larger than original 48px
          style={{
            background: "#fff",
            borderRadius: 7,
            marginRight: 16,
            objectFit: "contain"
          }}
        />
        <span style={{
          color: "#fff",
          fontWeight: 700,
          fontSize: 24, // Increased slightly for visual balance
          letterSpacing: 1,
          fontFamily: "inherit"
        }}>
          ParCost Inventory
        </span>
        {userName && (
          <span style={{
            color: "#fff",
            opacity: 0.85,
            fontWeight: 400,
            fontSize: 20, // Increased slightly for visual balance
            marginLeft: 24
          }}>
            {userName}
          </span>
        )}
      </div>
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        marginRight: 24
      }}>
        {showBack && (
          <button
            onClick={onBackToDashboard}
            style={{
              background: "#fff",
              color: "var(--brand-blue)",
              border: "none",
              borderRadius: 8,
              padding: "10px 18px",
              fontWeight: 700,
              fontSize: 16,
              cursor: "pointer",
              marginRight: 8,
              boxShadow: "0 2px 5px #0002"
            }}
          >← Back to Dashboard</button>
        )}
        {showLogout && (
          <button
            onClick={onLogout}
            style={{
              background: "var(--brand-blue)",
              color: "#fff",
              border: "2px solid #fff",
              borderRadius: 8,
              padding: "10px 18px",
              fontWeight: 700,
              fontSize: 16,
              cursor: "pointer",
              boxShadow: "0 2px 5px #0002"
            }}
          >Log Out</button>
        )}
      </div>
    </header>
  );
}
