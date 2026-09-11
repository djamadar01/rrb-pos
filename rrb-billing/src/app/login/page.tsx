"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  
  return (
    <div className="login-container">
      <style jsx global>{`
        .login-container {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          background: radial-gradient(circle at center, var(--bg-secondary) 0%, var(--bg-primary) 100%);
          font-family: var(--font-main);
        }
        .login-box {
          background: var(--bg-card);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          padding: 3.5rem;
          border-radius: var(--radius-lg);
          border: 1px solid var(--border-color);
          width: 100%;
          max-width: 420px;
          box-shadow: var(--shadow-glow);
          animation: slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .login-box h2 {
          text-align: center;
          margin-bottom: 2.5rem;
          color: var(--accent-color);
          font-family: var(--font-heading);
          font-size: 2.2rem;
          font-weight: 600;
          letter-spacing: 0.5px;
        }
        .input-group {
          margin-bottom: 1.8rem;
          display: flex;
          flex-direction: column;
          gap: 0.6rem;
        }
        .input-group label {
          color: var(--text-secondary);
          font-size: 0.95rem;
          font-weight: 500;
        }
        .input-group input {
          padding: 1.1rem;
          border-radius: var(--radius-md);
          background: rgba(0, 0, 0, 0.25);
          border: 1px solid rgba(212, 175, 55, 0.1);
          color: var(--text-primary);
          font-size: 1rem;
          outline: none;
          transition: all 0.3s ease;
        }
        .input-group input:focus {
          border-color: var(--accent-color);
          box-shadow: 0 0 10px rgba(212, 175, 55, 0.1);
          background: rgba(0, 0, 0, 0.4);
        }
        .login-btn {
          width: 100%;
          padding: 1.1rem;
          background: var(--accent-color);
          color: var(--bg-primary);
          border: none;
          border-radius: var(--radius-md);
          font-size: 1.1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          margin-top: 1.5rem;
          font-family: var(--font-main);
        }
        .login-btn:hover:not(:disabled) {
          background: var(--accent-hover);
          transform: translateY(-2px);
          box-shadow: 0 4px 15px rgba(212, 175, 55, 0.3);
        }
        .login-btn:disabled {
          background: #475569;
          color: #94a3b8;
          cursor: not-allowed;
          transform: none;
        }
        .error-msg {
          color: var(--danger-color);
          background: rgba(239, 68, 68, 0.1);
          padding: 0.85rem;
          border: 1px solid rgba(239, 68, 68, 0.2);
          border-radius: var(--radius-md);
          margin-bottom: 1.5rem;
          text-align: center;
          font-size: 0.95rem;
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div className="login-box">
        <button 
          type="button" 
          onClick={() => {
            if (typeof window !== "undefined" && window.history.length > 1) {
              router.back();
            } else {
              router.push("/");
            }
          }}
          style={{ 
            background: 'transparent', 
            border: 'none', 
            color: 'var(--text-secondary)', 
            cursor: 'pointer', 
            fontSize: '0.85rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            padding: 0,
            marginBottom: '1rem'
          }}
        >
          &larr; Back
        </button>
        <h2>System Login</h2>
        {error && <div className="error-msg">{error}</div>}
        
        <form onSubmit={async (e) => {
          e.preventDefault();
          setLoading(true);
          setError("");
          try {
            const res = await signIn("credentials", {
              email: email.trim().toLowerCase(),
              password,
              redirect: false,
            });

            if (res?.error) {
              setError("Invalid email or password. Please try again.");
              setLoading(false);
            } else if (res?.ok) {
              const searchParams = new URLSearchParams(window.location.search);
              const target = searchParams.get("callbackUrl") || "/";
              router.push(target);
              router.refresh();
            } else {
              setLoading(false);
            }
          } catch (err: any) {
            console.error("Sign-in error:", err);
            setError("Login failed. Please check your credentials.");
            setLoading(false);
          }
        }}>
          <div className="input-group">
            <label>Email Address</label>
            <input 
              type="email" 
              value={email} 
              onChange={e => setEmail(e.target.value)} 
              required 
              placeholder="e.g. owner@rrb.com"
            />
          </div>
          <div className="input-group">
            <label>Password</label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <input 
                type={showPassword ? "text" : "password"} 
                value={password} 
                onChange={e => setPassword(e.target.value)} 
                required 
                placeholder="••••••••"
                style={{ width: '100%', paddingRight: '2.8rem' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                title={showPassword ? "Hide password" : "Show password"}
                style={{
                  position: 'absolute',
                  right: '0.85rem',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: showPassword ? 'var(--accent-color)' : 'var(--text-secondary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '0.25rem',
                  outline: 'none',
                  transition: 'color 0.2s',
                }}
              >
                {showPassword ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
          </div>
          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? "Authenticating..." : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}
