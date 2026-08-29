"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
          background: linear-gradient(135deg, var(--bg-color) 0%, #1a1a2e 100%);
        }
        .login-box {
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(20px);
          padding: 3rem;
          border-radius: var(--radius-lg);
          border: 1px solid rgba(255, 255, 255, 0.1);
          width: 100%;
          max-width: 400px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
          animation: slideUp 0.6s ease-out forwards;
        }
        .login-box h2 {
          text-align: center;
          margin-bottom: 2rem;
          color: white;
          font-size: 1.8rem;
        }
        .input-group {
          margin-bottom: 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        .input-group label {
          color: var(--text-secondary);
          font-size: 0.9rem;
        }
        .input-group input {
          padding: 1rem;
          border-radius: var(--radius-sm);
          background: rgba(0, 0, 0, 0.2);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: white;
          font-size: 1rem;
          outline: none;
          transition: border-color 0.2s;
        }
        .input-group input:focus {
          border-color: var(--accent-color);
        }
        .login-btn {
          width: 100%;
          padding: 1rem;
          background: var(--accent-color);
          color: white;
          border: none;
          border-radius: var(--radius-sm);
          font-size: 1.1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          margin-top: 1rem;
        }
        .login-btn:hover {
          background: #ff6b81;
          transform: translateY(-2px);
        }
        .login-btn:disabled {
          background: #555;
          cursor: not-allowed;
          transform: none;
        }
        .error-msg {
          color: var(--danger-color);
          background: rgba(255, 71, 87, 0.1);
          padding: 0.75rem;
          border-radius: var(--radius-sm);
          margin-bottom: 1.5rem;
          text-align: center;
          font-size: 0.9rem;
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div className="login-box">
        <h2>System Login</h2>
        {error && <div className="error-msg">{error}</div>}
        
        <form onSubmit={async (e) => {
          e.preventDefault();
          setLoading(true);
          setError("");
          const res = await signIn("credentials", {
            email,
            password,
            redirect: true,
            callbackUrl: "/"
          });
          if (res?.error) {
            setError(res.error);
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
            <input 
              type="password" 
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              required 
              placeholder="••••••••"
            />
          </div>
          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? "Authenticating..." : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}
