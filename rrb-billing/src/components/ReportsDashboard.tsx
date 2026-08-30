"use client";

import { useState, useEffect } from "react";
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from "recharts";
import { useLanguage } from "@/lib/i18n";

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function ReportsDashboard() {
  const { t } = useLanguage();
  const [analytics, setAnalytics] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState("day");

  useEffect(() => {
    fetch(`/api/reports/analytics?range=${timeRange}`)
      .then(res => res.json())
      .then(data => {
        setAnalytics(data);
        setIsLoading(false);
      })
      .catch(err => {
        console.error(err);
        setIsLoading(false);
      });
  }, [timeRange]);

  const handleExport = async (format: "csv" | "pdf") => {
    const code = prompt(`Enter your 2FA Code to export this ${format.toUpperCase()} report:`, "");
    if (!code) return;

    try {
      const res = await fetch(`/api/reports/export`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: format.toUpperCase(), token: code, range: timeRange })
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        alert(errorData.error || "Export failed.");
        return;
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.style.display = "none";
      a.href = url;
      a.download = `report_${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert("Error generating report.");
    }
  };

  if (isLoading) return <div>Loading Analytics...</div>;
  if (!analytics || analytics.error) return <div>Failed to load analytics.</div>;

  return (
    <div className="reports-dashboard" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* Header and Export Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2>Sales & Analytics</h2>
          <p style={{ color: 'var(--text-secondary)' }}>Overview of your performance metrics.</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <select 
            value={timeRange} 
            onChange={(e) => setTimeRange(e.target.value)}
            style={{ padding: '0.5rem', borderRadius: '4px', background: 'rgba(255,255,255,0.1)', color: 'white', border: '1px solid rgba(255,255,255,0.2)' }}
          >
            <option value="day" style={{ color: 'black' }}>1 Day</option>
            <option value="week" style={{ color: 'black' }}>1 Week</option>
            <option value="month" style={{ color: 'black' }}>1 Month</option>
          </select>
          <button onClick={() => handleExport('csv')} className="btn-primary" style={{ background: '#10b981' }}>Export CSV</button>
          <button onClick={() => handleExport('pdf')} className="btn-primary" style={{ background: '#ef4444' }}>Export PDF</button>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem' }}>
        <div className="glass-panel" style={{ padding: '1.5rem', textAlign: 'center' }}>
          <h4 style={{ color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>{t("todayRevenue")}</h4>
          <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--accent-color)' }}>
            ₹{analytics.dailyRevenue.toFixed(2)}
          </div>
        </div>
        <div className="glass-panel" style={{ padding: '1.5rem', textAlign: 'center' }}>
          <h4 style={{ color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>{t("totalOrdersToday")}</h4>
          <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'white' }}>
            {analytics.totalOrders}
          </div>
        </div>
        <div className="glass-panel" style={{ padding: '1.5rem', textAlign: 'center' }}>
          <h4 style={{ color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>{t("avgOrderValue")}</h4>
          <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--success-color)' }}>
            ₹{analytics.avgOrderValue.toFixed(2)}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
        
        {/* Line Chart: 7-Day Trend */}
        <div className="glass-panel" style={{ padding: '1.5rem', minHeight: '350px' }}>
          <h3 style={{ marginBottom: '1.5rem', color: 'var(--text-primary)' }}>7-Day Revenue Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={analytics.chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="date" stroke="var(--text-secondary)" />
              <YAxis stroke="var(--text-secondary)" />
              <Tooltip 
                contentStyle={{ backgroundColor: 'var(--bg-secondary)', border: 'none', borderRadius: '8px' }}
                itemStyle={{ color: 'var(--accent-color)' }}
              />
              <Line type="monotone" dataKey="revenue" stroke="var(--accent-color)" strokeWidth={3} activeDot={{ r: 8 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Top Items & Pie Chart Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          {/* Top Items */}
          <div className="glass-panel" style={{ padding: '1.5rem' }}>
            <h3 style={{ marginBottom: '1rem' }}>Top Sellers</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
              {analytics.topItems.map((item: any, idx: number) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
                  <span>{idx + 1}. {item.name}</span>
                  <span style={{ color: 'var(--success-color)' }}>{item.qty} sold</span>
                </div>
              ))}
              {analytics.topItems.length === 0 && <span style={{ opacity: 0.5 }}>No sales yet.</span>}
            </div>
          </div>

          {/* Pie Chart */}
          <div className="glass-panel" style={{ padding: '1.5rem', flex: 1, minHeight: '250px' }}>
            <h3 style={{ marginBottom: '1rem', textAlign: 'center' }}>Sales by Category</h3>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={analytics.categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {analytics.categoryData.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: 'var(--bg-secondary)', border: 'none', borderRadius: '8px' }} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  );
}
