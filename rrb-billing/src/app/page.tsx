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
          min-height: 100dvh;
          text-align: center;
          padding: 1.5rem 1rem;
          width: 100%;
          max-width: 100vw;
          overflow-x: hidden;
          box-sizing: border-box;
          background: linear-gradient(135deg, var(--bg-color) 0%, #1a1a2e 100%);
        }
        .hero {
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          padding: 3rem 2rem;
          border-radius: var(--radius-lg);
          border: 1px solid rgba(255, 255, 255, 0.1);
          width: 100%;
          max-width: 560px;
          box-sizing: border-box;
          animation: slideUp 0.8s ease-out forwards;
        }
        .hero h1 {
          font-size: clamp(1.75rem, 5.5vw, 3rem);
          line-height: 1.25;
          margin-bottom: 1rem;
          background: linear-gradient(to right, #fff, var(--accent-color));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          word-break: break-word;
        }
        .hero p {
          color: var(--text-secondary);
          font-size: clamp(0.95rem, 3.5vw, 1.2rem);
          margin-bottom: 2rem;
          line-height: 1.4;
        }
        .action-links {
          display: flex;
          flex-wrap: wrap;
          gap: 1rem;
          justify-content: center;
          width: 100%;
        }
        .link-btn {
          padding: 0.85rem 1.75rem;
          border-radius: var(--radius-md);
          font-weight: 600;
          text-decoration: none;
          transition: all 0.2s;
          font-size: 1rem;
          box-sizing: border-box;
          display: inline-flex;
          align-items: center;
          justify-content: center;
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
        @media (max-width: 600px) {
          .landing-container {
            padding: 1rem 0.75rem;
          }
          .hero {
            padding: 2rem 1.25rem;
            border-radius: 12px;
          }
          .action-links {
            flex-direction: column;
            gap: 0.75rem;
          }
          .link-btn {
            width: 100%;
            padding: 0.9rem 1.25rem;
          }
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
