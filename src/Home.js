import React from "react";
import logo from "./assets/parcost-logo.png";
import "./styles.css";

const BRAND_BLUE = "var(--brand-blue)";
const BRAND_GREEN = "var(--brand-green)";
const BRAND_GRAY = "var(--brand-gray)";

export default function Home({ onNavigate }) {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: BRAND_GRAY,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "40px 20px",
      }}
    >
      {/* Logo Section */}
      <div
        style={{
          marginBottom: 40,
          textAlign: "center",
        }}
      >
        <img
          src={logo}
          alt="ParCost Inventory"
          style={{
            width: 200,
            height: "auto",
            background: "#fff",
            borderRadius: 12,
            padding: 16,
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
          }}
        />
      </div>

      {/* Hero Section with Coming Soon Overlay */}
      <div
        style={{
          position: "relative",
          width: "100%",
          maxWidth: 900,
          background: "#fff",
          borderRadius: 16,
          padding: "60px 40px",
          boxShadow: "0 4px 20px rgba(0, 0, 0, 0.08)",
          textAlign: "center",
          overflow: "hidden",
          marginBottom: 40,
        }}
      >
        {/* Coming Soon Diagonal Banner */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            pointerEvents: "none",
            zIndex: 1,
          }}
        >
          <div
            style={{
              fontSize: "clamp(3rem, 10vw, 6rem)",
              fontWeight: 900,
              color: BRAND_GREEN,
              opacity: 0.15,
              transform: "rotate(-35deg)",
              whiteSpace: "nowrap",
              letterSpacing: "0.05em",
              textTransform: "uppercase",
            }}
          >
            Coming Soon
          </div>
        </div>

        {/* Hero Text */}
        <h1
          style={{
            fontSize: "clamp(2rem, 5vw, 3.5rem)",
            fontWeight: 800,
            color: BRAND_BLUE,
            marginBottom: 20,
            lineHeight: 1.2,
            position: "relative",
            zIndex: 2,
          }}
        >
          Welcome to ParCost Inventory!
        </h1>

        <p
          style={{
            fontSize: "clamp(1.1rem, 2.5vw, 1.5rem)",
            color: "var(--text-mid)",
            lineHeight: 1.6,
            maxWidth: 700,
            margin: "0 auto",
            position: "relative",
            zIndex: 2,
          }}
        >
          Your comprehensive solution for restaurant inventory management
        </p>
      </div>

      {/* Description Section */}
      <div
        style={{
          width: "100%",
          maxWidth: 900,
          background: "#fff",
          borderRadius: 16,
          padding: "40px",
          boxShadow: "0 4px 20px rgba(0, 0, 0, 0.08)",
        }}
      >
        <h2
          style={{
            fontSize: "clamp(1.5rem, 3vw, 2rem)",
            fontWeight: 700,
            color: BRAND_BLUE,
            marginBottom: 20,
            textAlign: "center",
          }}
        >
          What ParCost Inventory Offers
        </h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
            gap: 24,
            marginTop: 32,
          }}
        >
          <div
            style={{
              padding: 20,
              borderRadius: 8,
              border: `2px solid var(--border-light)`,
              transition: "transform 0.2s, box-shadow 0.2s",
            }}
            className="feature-card"
          >
            <div
              style={{
                fontSize: "2rem",
                marginBottom: 12,
              }}
            >
              📊
            </div>
            <h3
              style={{
                fontSize: "1.25rem",
                fontWeight: 700,
                color: BRAND_BLUE,
                marginBottom: 8,
              }}
            >
              Real-time Tracking
            </h3>
            <p
              style={{
                fontSize: "1rem",
                color: "var(--text-mid)",
                lineHeight: 1.5,
                margin: 0,
              }}
            >
              Track your inventory levels in real-time with precision and ease
            </p>
          </div>

          <div
            style={{
              padding: 20,
              borderRadius: 8,
              border: `2px solid var(--border-light)`,
              transition: "transform 0.2s, box-shadow 0.2s",
            }}
            className="feature-card"
          >
            <div
              style={{
                fontSize: "2rem",
                marginBottom: 12,
              }}
            >
              📈
            </div>
            <h3
              style={{
                fontSize: "1.25rem",
                fontWeight: 700,
                color: BRAND_BLUE,
                marginBottom: 8,
              }}
            >
              Usage Reports
            </h3>
            <p
              style={{
                fontSize: "1rem",
                color: "var(--text-mid)",
                lineHeight: 1.5,
                margin: 0,
              }}
            >
              Generate detailed reports to understand your consumption patterns
            </p>
          </div>

          <div
            style={{
              padding: 20,
              borderRadius: 8,
              border: `2px solid var(--border-light)`,
              transition: "transform 0.2s, box-shadow 0.2s",
            }}
            className="feature-card"
          >
            <div
              style={{
                fontSize: "2rem",
                marginBottom: 12,
              }}
            >
              🏪
            </div>
            <h3
              style={{
                fontSize: "1.25rem",
                fontWeight: 700,
                color: BRAND_BLUE,
                marginBottom: 8,
              }}
            >
              Multi-location Support
            </h3>
            <p
              style={{
                fontSize: "1rem",
                color: "var(--text-mid)",
                lineHeight: 1.5,
                margin: 0,
              }}
            >
              Manage inventory across multiple storage areas and locations
            </p>
          </div>
        </div>

        <div
          style={{
            marginTop: 40,
            padding: 24,
            background: BRAND_GRAY,
            borderRadius: 8,
            textAlign: "center",
          }}
        >
          <p
            style={{
              fontSize: "1.1rem",
              color: "var(--text-mid)",
              margin: 0,
              lineHeight: 1.6,
              marginBottom: 20,
            }}
          >
            <strong style={{ color: BRAND_BLUE }}>Stay tuned!</strong> ParCost Inventory
            is being built to streamline your restaurant's inventory management
            with powerful features and an intuitive interface.
          </p>
          {onNavigate && (
            <button
              onClick={() => onNavigate("auth")}
              style={{
                background: BRAND_BLUE,
                color: "#fff",
                border: "none",
                borderRadius: 8,
                padding: "14px 32px",
                fontSize: "1.1rem",
                fontWeight: 700,
                cursor: "pointer",
                boxShadow: "0 4px 12px rgba(0, 28, 255, 0.3)",
                transition: "transform 0.2s, box-shadow 0.2s",
              }}
              onMouseOver={(e) => {
                e.target.style.transform = "translateY(-2px)";
                e.target.style.boxShadow = "0 6px 16px rgba(0, 28, 255, 0.4)";
              }}
              onMouseOut={(e) => {
                e.target.style.transform = "translateY(0)";
                e.target.style.boxShadow = "0 4px 12px rgba(0, 28, 255, 0.3)";
              }}
            >
              Get Started
            </button>
          )}
        </div>
      </div>

      {/* Footer */}
      <div
        style={{
          marginTop: 40,
          textAlign: "center",
          color: "var(--text-mid)",
          fontSize: "0.9rem",
        }}
      >
        <p style={{ margin: 0 }}>© 2025 ParCost Inventory. All rights reserved.</p>
      </div>
    </div>
  );
}
