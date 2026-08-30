"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import MenuManager from "@/components/MenuManager";
import UserManager from "@/components/UserManager";
import OutletManager from "@/components/OutletManager";
import ReportsDashboard from "@/components/ReportsDashboard";
import { useLanguage } from "@/lib/i18n";
import LanguageToggle from "@/components/LanguageToggle";

export default function OwnerDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { t } = useLanguage();
  const [stats, setStats] = useState({ revenue: 0, bills: 0, activeShifts: 0, onlinePayments: 0, cashPayments: 0 });
  const [outlets, setOutlets] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [recentBills, setRecentBills] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState("Overview");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    if (status !== "authenticated") return;

    const fetchData = () => {
      fetch("/api/reports/dashboard", { cache: 'no-store' })
        .then(res => res.json())
        .then(data => {
          if (!data.error) {
            setStats(data.stats);
            setOutlets(data.outlets);
            setLogs(data.logs);
            if (data.recentBills) setRecentBills(data.recentBills);
          }
        })
        .catch(console.error);
    };

    fetchData(); // Initial fetch
    const interval = setInterval(fetchData, 5000); // Poll every 5 seconds
    
    return () => clearInterval(interval);
  }, [status]);

  if (status === "loading") {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', color: 'white' }}>
        <p>Loading Dashboard...</p>
      </div>
    );
  }

  if (status === "unauthenticated") {
    return null;
  }

  const handleExport = async (type: string) => {
    const token = window.prompt(`Enter 2FA Code to export ${type} report (Use 123456 for demo):`);
    if (!token) return;

    try {
      const res = await fetch("/api/reports/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, token })
      });

      if (!res.ok) {
        const err = await res.json();
        alert(`Export failed: ${err.error}`);
        return;
      }

      // Handle file download
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = type === "CSV" ? "revenue_report.csv" : "tax_report.txt";
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
    } catch (err) {
      console.error(err);
      alert("An error occurred during export.");
    }
  };

  const renderContent = () => {
    if (activeTab === "Overview") {
      return (
        <>
          <section className="dashboard-stats">
            <div className="stat-card glass-panel" style={{ textAlign: 'center' }}>
              <h3 style={{ color: 'var(--text-secondary)' }}>{t("todayRevenue")}</h3>
              <p className="stat-value">₹{stats.revenue?.toFixed(2) || "0.00"}</p>
            </div>
            <div className="stat-card glass-panel" style={{ textAlign: 'center' }}>
              <h3 style={{ color: 'var(--text-secondary)' }}>{t("totalOrdersToday")}</h3>
              <p className="stat-value">{stats.bills || 0}</p>
            </div>
            <div className="stat-card glass-panel" style={{ textAlign: 'center' }}>
              <h3 style={{ color: 'var(--text-secondary)' }}>{t("onlinePayments")}</h3>
              <p className="stat-value">₹{stats.onlinePayments?.toFixed(2) || "0.00"}</p>
            </div>
            <div className="stat-card glass-panel" style={{ textAlign: 'center' }}>
              <h3 style={{ color: 'var(--text-secondary)' }}>{t("cashPayments")}</h3>
              <p className="stat-value">₹{stats.cashPayments?.toFixed(2) || "0.00"}</p>
            </div>
          </section>
          
          <section className="dashboard-logs glass-panel" style={{ marginTop: '1.5rem' }}>
            <h2>Recent Bills (Global)</h2>
            <div className="table-responsive">
              <table style={{ width: '100%', textAlign: 'left', color: 'white' }}>
                <thead>
                  <tr>
                    <th>Bill Number</th>
                    <th>Outlet</th>
                    <th>Creator</th>
                    <th>Total</th>
                    <th>Status</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {recentBills.map((bill: any) => (
                    <tr key={bill.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                      <td style={{ padding: '0.5rem 0' }}>{bill.billNumber}</td>
                      <td>{bill.outlet?.name}</td>
                      <td>{bill.creator?.name}</td>
                      <td>₹{bill.finalAmount.toFixed(2)}</td>
                      <td><span className={`badge ${bill.status === 'PAID' ? 'success' : 'danger'}`}>{bill.status}</span></td>
                      <td>{new Date(bill.createdAt).toLocaleString()}</td>
                    </tr>
                  ))}
                  {recentBills.length === 0 && (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', padding: '1rem' }}>No recent bills found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </>
      );
    }
    
    if (activeTab === "Outlets") {
      return (
        <section className="dashboard-outlets glass-panel">
          <h2>Revenue by Outlet</h2>
          <ul className="outlet-list">
            {outlets.map((outlet) => (
              <li key={outlet.id} className="outlet-item">
                <span className="outlet-name">{outlet.name}</span>
                <span className="outlet-revenue">₹{outlet.revenue?.toFixed(2) || "0.00"}</span>
              </li>
            ))}
          </ul>
        </section>
      );
    }
    
    if (activeTab === "Menu Management") {
      return (
        <section className="dashboard-menu glass-panel">
          <h2>Menu Management</h2>
          <p style={{ marginBottom: '1.5rem', color: 'var(--text-secondary)' }}>Add, edit, and organize dishes globally across all outlets.</p>
          <MenuManager />
        </section>
      );
    }
    
    if (activeTab === "Reports") {
      return (
        <section className="dashboard-reports">
          <ReportsDashboard />
        </section>
      );
    }
    
    if (activeTab === "Audit Logs") {
      return (
        <section className="dashboard-logs glass-panel">
          <h2>Recent Audit Logs (Security Flags)</h2>
          <ul className="log-list">
            {logs.map((log) => (
              <li key={log.id} className="log-item">
                <span className="log-time">[{log.time}]</span>
                <span className="log-action">{log.action}</span>
                <span className="log-reason">(Reason: {log.reason})</span>
              </li>
            ))}
            {logs.length === 0 && <li>No recent logs.</li>}
          </ul>
        </section>
      );
    }
    
    if (activeTab === "Settings") {
      return (
        <section className="dashboard-settings glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <div>
            <h2>System Management</h2>
            <p style={{ color: 'var(--text-secondary)' }}>Manage your branches and employee access.</p>
          </div>
          
          <div>
            <h3 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', marginBottom: '1rem', color: 'var(--accent-color)' }}>Outlets & Branches</h3>
            <OutletManager />
          </div>

          <div>
            <h3 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', marginBottom: '1rem', color: 'var(--accent-color)' }}>Staff & Managers</h3>
            <UserManager />
          </div>
        </section>
      );
    }
    
    return (
      <section className="dashboard-logs glass-panel">
        <h2>Settings</h2>
        <p>Global configuration and tax rates go here.</p>
      </section>
    );
  };

  const tabIcons: Record<string, string> = {
    "Overview": "📊",
    "Outlets": "🏪",
    "Menu Management": "🍔",
    "Reports": "📈",
    "Audit Logs": "🛡️",
    "Settings": "⚙️"
  };

  return (
    <div className="dashboard-layout">
      {/* Mobile Header with Hamburger */}
      <div className="mobile-header">
        <div className="sidebar-logo">RRB Dashboard</div>
        <button className="hamburger-btn" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
          ☰
        </button>
      </div>

      <aside className={`dashboard-sidebar ${isSidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-logo desktop-only">RRB Dashboard</div>
        
        <nav className="sidebar-nav">
          {["Overview", "Outlets", "Menu Management", "Reports", "Audit Logs", "Settings"].map(tab => {
            const i18nKey = tab.replace(" ", "");
            const key = i18nKey.charAt(0).toLowerCase() + i18nKey.slice(1);
            return (
              <button 
                key={tab}  
                className={`sidebar-btn ${activeTab === tab ? "active" : ""}`}
                onClick={() => {
                  setActiveTab(tab);
                  setIsSidebarOpen(false); // Close sidebar on mobile after clicking
                }}
              >
                <span className="icon">{tabIcons[tab]}</span>
                <span>{t(key)}</span>
              </button>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <LanguageToggle />
          <Link href="/" className="sidebar-btn" style={{ textDecoration: 'none', padding: '0.5rem', justifyContent: 'center', borderLeft: 'none' }}>&larr; {t("home")}</Link>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', fontSize: '0.8rem', textAlign: 'center', marginTop: '0.5rem' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Owner Role</span>
            <span className="badge success" style={{ padding: '0.2rem' }}>2FA: {t("verified")}</span>
          </div>
        </div>
      </aside>

      <main className="dashboard-main-content">
        {renderContent()}
      </main>
    </div>
  );
}
