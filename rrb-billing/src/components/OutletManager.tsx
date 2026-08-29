"use client";

import { useState, useEffect } from "react";

export default function OutletManager() {
  const [outlets, setOutlets] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [newOutlet, setNewOutlet] = useState({ name: "", location: "", contactInfo: "", taxRate: 5, serviceCharge: 0 });
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [editingOutletId, setEditingOutletId] = useState<string | null>(null);
  const [editOutletData, setEditOutletData] = useState({ name: "", location: "", contactInfo: "", taxRate: 5, serviceCharge: 0 });

  const fetchOutlets = async () => {
    try {
      const res = await fetch("/api/outlets");
      if (res.ok) {
        const data = await res.json();
        setOutlets(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOutlets();
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOutlet.name || !newOutlet.location || !newOutlet.contactInfo) return;
    setIsSubmitting(true);

    try {
      const payload = {
        name: newOutlet.name,
        location: newOutlet.location,
        contactInfo: newOutlet.contactInfo,
        taxConfiguration: JSON.stringify({ taxRate: newOutlet.taxRate, serviceCharge: newOutlet.serviceCharge })
      };

      const res = await fetch("/api/outlets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setNewOutlet({ name: "", location: "", contactInfo: "", taxRate: 5, serviceCharge: 0 });
        fetchOutlets();
      } else {
        const data = await res.json();
        alert(`Failed to add outlet: ${data.error}`);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const startEditing = (outlet: any) => {
    setEditingOutletId(outlet.id);
    let taxConfig = { taxRate: 5, serviceCharge: 0 };
    try {
      taxConfig = JSON.parse(outlet.taxConfiguration);
    } catch (e) {}
    
    setEditOutletData({ 
      name: outlet.name, 
      location: outlet.location, 
      contactInfo: outlet.contactInfo,
      taxRate: taxConfig.taxRate || 0,
      serviceCharge: taxConfig.serviceCharge || 0
    });
  };

  const saveEdit = async (outlet: any) => {
    try {
      const payload = { 
        id: outlet.id, 
        name: editOutletData.name, 
        location: editOutletData.location,
        contactInfo: editOutletData.contactInfo,
        taxConfiguration: JSON.stringify({ taxRate: editOutletData.taxRate, serviceCharge: editOutletData.serviceCharge })
      };
      
      const res = await fetch("/api/outlets", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setEditingOutletId(null);
        fetchOutlets();
      } else {
        alert("Failed to save changes.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (outlet: any) => {
    if (!confirm(`Are you sure you want to completely delete outlet "${outlet.name}"?`)) return;
    try {
      const res = await fetch(`/api/outlets?id=${outlet.id}`, { method: "DELETE" });
      const data = await res.json();
      if (res.ok) {
        fetchOutlets();
      } else {
        alert(data.error || "Failed to delete");
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (isLoading) return <div>Loading outlets...</div>;

  return (
    <div className="outlet-manager" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <section className="add-outlet glass-panel" style={{ padding: '1.5rem', background: 'rgba(0,0,0,0.2)' }}>
        <h3 style={{ marginBottom: '1rem' }}>Add New Outlet</h3>
        <form onSubmit={handleAdd} style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1, minWidth: '150px' }}>
            <label>Outlet Name</label>
            <input 
              type="text" required value={newOutlet.name} 
              onChange={e => setNewOutlet({...newOutlet, name: e.target.value})}
              style={{ padding: '0.75rem', borderRadius: '4px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }}
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1, minWidth: '150px' }}>
            <label>Location</label>
            <input 
              type="text" required value={newOutlet.location} 
              onChange={e => setNewOutlet({...newOutlet, location: e.target.value})}
              style={{ padding: '0.75rem', borderRadius: '4px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }}
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1, minWidth: '150px' }}>
            <label>Contact Info</label>
            <input 
              type="text" required value={newOutlet.contactInfo} 
              onChange={e => setNewOutlet({...newOutlet, contactInfo: e.target.value})}
              style={{ padding: '0.75rem', borderRadius: '4px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }}
            />
          </div>
          <div style={{ display: 'flex', gap: '1rem' }}>
             <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', width: '80px' }}>
                <label>Tax %</label>
                <input 
                  type="number" step="0.1" required value={newOutlet.taxRate} 
                  onChange={e => setNewOutlet({...newOutlet, taxRate: parseFloat(e.target.value)})}
                  style={{ padding: '0.75rem', borderRadius: '4px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }}
                />
             </div>
             <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', width: '80px' }}>
                <label>Svc %</label>
                <input 
                  type="number" step="0.1" required value={newOutlet.serviceCharge} 
                  onChange={e => setNewOutlet({...newOutlet, serviceCharge: parseFloat(e.target.value)})}
                  style={{ padding: '0.75rem', borderRadius: '4px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }}
                />
             </div>
          </div>
          <button type="submit" className="btn-primary" disabled={isSubmitting} style={{ height: '45px', padding: '0 2rem' }}>
            {isSubmitting ? "Adding..." : "+ Create Outlet"}
          </button>
        </form>
      </section>

      <section className="outlet-list">
        <h3 style={{ marginBottom: '1rem' }}>Existing Outlets</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem' }}>
          {outlets.map(outlet => {
             let taxConfig = { taxRate: 0, serviceCharge: 0 };
             try { taxConfig = JSON.parse(outlet.taxConfiguration); } catch(e){}

             return (
              <div key={outlet.id} className="glass-panel" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {editingOutletId === outlet.id ? (
                  <>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <input type="text" value={editOutletData.name} onChange={e => setEditOutletData({...editOutletData, name: e.target.value})} style={{ padding: '0.5rem', background: 'rgba(0,0,0,0.3)', border: '1px solid #333', color: 'white', flex: 1 }} />
                      <input type="text" value={editOutletData.location} onChange={e => setEditOutletData({...editOutletData, location: e.target.value})} style={{ padding: '0.5rem', background: 'rgba(0,0,0,0.3)', border: '1px solid #333', color: 'white', flex: 1 }} />
                      <input type="text" value={editOutletData.contactInfo} onChange={e => setEditOutletData({...editOutletData, contactInfo: e.target.value})} style={{ padding: '0.5rem', background: 'rgba(0,0,0,0.3)', border: '1px solid #333', color: 'white', flex: 1 }} />
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                      <label style={{alignSelf: 'center'}}>Tax Rate %: </label>
                      <input type="number" step="0.1" value={editOutletData.taxRate} onChange={e => setEditOutletData({...editOutletData, taxRate: parseFloat(e.target.value)})} style={{ padding: '0.5rem', background: 'rgba(0,0,0,0.3)', border: '1px solid #333', color: 'white', width: '80px' }} />
                      <label style={{alignSelf: 'center', marginLeft: '1rem'}}>Service Charge %: </label>
                      <input type="number" step="0.1" value={editOutletData.serviceCharge} onChange={e => setEditOutletData({...editOutletData, serviceCharge: parseFloat(e.target.value)})} style={{ padding: '0.5rem', background: 'rgba(0,0,0,0.3)', border: '1px solid #333', color: 'white', width: '80px' }} />
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                      <button onClick={() => saveEdit(outlet)} className="btn-primary" style={{ padding: '0.5rem 1rem' }}>Save Changes</button>
                      <button onClick={() => setEditingOutletId(null)} style={{ padding: '0.5rem 1rem', background: '#333', color: 'white', border: 'none', borderRadius: '4px' }}>Cancel</button>
                    </div>
                  </>
                ) : (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 'bold', fontSize: '1.2rem' }}>{outlet.name}</div>
                      <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                        {outlet.location} &bull; {outlet.contactInfo}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--accent-color)', marginTop: '0.2rem' }}>
                        Tax Rate: {taxConfig.taxRate}% &bull; Service Charge: {taxConfig.serviceCharge}%
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button 
                        onClick={() => startEditing(outlet)}
                        style={{ padding: '0.5rem 1rem', borderRadius: '4px', border: 'none', background: 'var(--accent-color)', color: 'white', cursor: 'pointer' }}
                      >
                        Edit Details
                      </button>
                      <button 
                        onClick={() => handleDelete(outlet)}
                        style={{ padding: '0.5rem 1rem', borderRadius: '4px', border: 'none', background: 'var(--danger-color)', color: 'white', cursor: 'pointer' }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </section>
    </div>
  );
}
