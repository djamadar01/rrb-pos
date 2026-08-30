"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";

export default function Home() {
  const { data: session } = useSession();

  return (
    <div className="landing-container">
      <style jsx global>{`
        .landing-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          text-align: center;
          padding: 2rem;
          background: linear-gradient(135deg, var(--bg-color) 0%, #1a1a2e 100%);
        }
        .hero {
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(20px);
          padding: 4rem;
          border-radius: var(--radius-lg);
          border: 1px solid rgba(255, 255, 255, 0.1);
          max-width: 600px;
          animation: slideUp 0.8s ease-out forwards;
        }
        .hero h1 {
          font-size: 3rem;
          margin-bottom: 1rem;
          background: linear-gradient(to right, #fff, var(--accent-color));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .hero p {
          color: var(--text-secondary);
          font-size: 1.2rem;
          margin-bottom: 2rem;
        }
        .action-links {
          display: flex;
          gap: 1.5rem;
          justify-content: center;
        }
        .link-btn {
          padding: 1rem 2rem;
          border-radius: var(--radius-md);
          font-weight: 600;
          text-decoration: none;
          transition: all 0.2s;
        }
        .link-btn.primary {
          background: var(--accent-color);
          color: white;
          box-shadow: 0 4px 15px rgba(255, 71, 87, 0.3);
        }
        .link-btn.primary:hover {
          background: #ff6b81;
          transform: translateY(-2px);
        }
        .link-btn.secondary {
          background: rgba(255, 255, 255, 0.1);
          color: white;
        }
        .link-btn.secondary:hover {
          background: rgba(255, 255, 255, 0.2);
          transform: translateY(-2px);
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(40px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
      
      <div className="hero">
        <h1>RRB Fast Food & Chinese</h1>
        <p>Advanced Multi-Outlet Billing & Management System</p>
        
        <div className="action-links">
          {!session ? (
            <Link href="/login" className="link-btn primary">
              Sign In to System
            </Link>
          ) : (
            <>
              {session.user?.role === "OWNER" && (
                <Link href="/owner" className="link-btn primary">
                  Owner Dashboard
                </Link>
              )}
              {(session.user?.role === "MANAGER" || session.user?.role === "OWNER") && (
                <Link href="/pos" className="link-btn secondary">
                  Manager POS
                </Link>
              )}
              <button onClick={() => signOut()} className="link-btn secondary" style={{ background: 'rgba(255, 71, 87, 0.2)' }}>
                Sign Out
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
