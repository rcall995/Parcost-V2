import React, { useState } from 'react';
import { supabase } from './supabaseClient';
import ParcostHeader from "./components/ParcostHeader";

const BRAND_BLUE = "var(--brand-blue)";
const BRAND_GREEN = "var(--brand-green)";
const BRAND_GRAY = "var(--brand-gray, #fafdff)";
const BRAND_RED = "var(--brand-red, #bd3131)";

export default function AuthPage({ onAuth }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    let result;
    if (isLogin) {
      result = await supabase.auth.signInWithPassword({ email, password });
    } else {
      result = await supabase.auth.signUp({ email, password });
    }
    setLoading(false);
    if (result.error) {
      setError(result.error.message);
    } else {
      onAuth(result.data.user);
    }
  }

  return (
    <div style={{
      minHeight: "100vh",
      background: BRAND_GRAY,
      display: "flex",
      flexDirection: "column",
      alignItems: "center"
    }}>
      <ParcostHeader />
      <div style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        flex: 1,
        width: "100%",
        marginTop: 30
      }}>
        <div style={{
          background: "#fff",
          borderRadius: 16,
          boxShadow: "0 2px 14px #0001",
          padding: "32px 34px",
          minWidth: 320,
          maxWidth: 380,
          margin: "0 auto"
        }}>
          <h2 style={{
            color: BRAND_BLUE,
            fontWeight: 800,
            fontSize: 26,
            textAlign: "center",
            marginBottom: 20
          }}>{isLogin ? 'Login' : 'Sign Up'}</h2>
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column" }}>
            <input
              type="email"
              placeholder="Email"
              autoComplete="username"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              style={{
                marginBottom: 10,
                padding: 12,
                borderRadius: 7,
                border: "1.5px solid #e2e8f0",
                fontSize: 17,
                background: "#fafdff"
              }}
            />
            <input
              type="password"
              placeholder="Password"
              autoComplete={isLogin ? "current-password" : "new-password"}
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              style={{
                marginBottom: 14,
                padding: 12,
                borderRadius: 7,
                border: "1.5px solid #e2e8f0",
                fontSize: 17,
                background: "#fafdff"
              }}
            />
            <button
              disabled={loading}
              style={{
                background: BRAND_GREEN,
                color: "#fff",
                fontWeight: 700,
                fontSize: 17,
                border: "none",
                borderRadius: 8,
                padding: "12px 0",
                marginBottom: 10,
                cursor: loading ? "not-allowed" : "pointer",
                boxShadow: "0 1.5px 5px #0001"
              }}
            >
              {loading ? (isLogin ? 'Logging in...' : 'Signing up...') : (isLogin ? 'Login' : 'Sign Up')}
            </button>
            <button
              type="button"
              onClick={() => setIsLogin(l => !l)}
              style={{
                background: "none",
                border: "none",
                color: BRAND_BLUE,
                cursor: "pointer",
                fontWeight: 600,
                marginBottom: 10,
                fontSize: 15
              }}
            >
              {isLogin ? "Don't have an account? Sign up" : "Already have an account? Login"}
            </button>
            {error && <div style={{ color: BRAND_RED, marginTop: 8, textAlign: "center", fontWeight: 500 }}>{error}</div>}
          </form>
        </div>
      </div>
    </div>
  );
}