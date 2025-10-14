import React from 'react';

export default function BackButton({ onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        margin: "20px 0",
        padding: "8px 18px",
        fontSize: 16,
        background: "var(--brand-blue)",
        color: "#fff",
        border: "none",
        borderRadius: 8,
        cursor: "pointer",
        fontWeight: 700,
        boxShadow: "0 1px 4px #0001",
        transition: "background 0.18s"
      }}
    >
      ← Back to Dashboard
    </button>
  );
}