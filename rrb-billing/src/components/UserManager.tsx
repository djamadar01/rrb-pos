"use client";

import { useState, useEffect } from "react";

export default function UserManager() {
  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [newUser, setNewUser] = useState({ name: "", email: "", password: "", role: "MANAGER" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editUserData, setEditUserData] = useState({ name: "", email: "", password: "" });

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/users");
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUser.name || !newUser.email || !newUser.password) return;
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newUser)
      });
      if (res.ok) {
        setNewUser({ name: "", email: "", password: "", role: "MANAGER" });
        fetchUsers();
      } else {
        const data = await res.json();
        alert(`Failed to add user: ${data.error}`);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleStatus = async (user: any) => {
    if (user.role === "OWNER") {
      alert("Cannot disable the Owner account.");
      return;
    }
    
    try {
      const res = await fetch("/api/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: user.id, isActive: !user.isActive })
      });
      if (res.ok) fetchUsers();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (user: any) => {
    if (user.role === "OWNER") {
      alert("Cannot delete the Owner account.");
      return;
    }
    if (!confirm(`Are you sure you want to completely delete manager "${user.name}"?`)) return;
    
    try {
      const res = await fetch(`/api/users?id=${user.id}`, { method: "DELETE" });
      const data = await res.json();
      if (res.ok) {
        fetchUsers();
      } else {
        alert(data.error || "Failed to delete");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const startEditing = (user: any) => {
    setEditingUserId(user.id);
    setEditUserData({ name: user.name, email: user.email, password: "" });
  };

  const saveEdit = async (user: any) => {
    try {
      const payload: any = { id: user.id, name: editUserData.name, email: editUserData.email };
      if (editUserData.password) payload.password = editUserData.password;
      
      const res = await fetch("/api/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setEditingUserId(null);
        fetchUsers();
      } else {
        alert("Failed to save changes.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (isLoading) return <div>Loading users...</div>;

  return (
    <div className="user-manager" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <section className="add-user glass-panel" style={{ padding: '1.5rem', background: 'rgba(0,0,0,0.2)' }}>
        <h3 style={{ marginBottom: '1rem' }}>Add New Manager</h3>
        <form onSubmit={handleAdd} style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1, minWidth: '150px' }}>
            <label>Name</label>
            <input 
              type="text" required value={newUser.name} 
              onChange={e => setNewUser({...newUser, name: e.target.value})}
              style={{ padding: '0.75rem', borderRadius: '4px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }}
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1, minWidth: '200px' }}>
            <label>Email Address</label>
            <input 
              type="email" required value={newUser.email} 
              onChange={e => setNewUser({...newUser, email: e.target.value})}
              style={{ padding: '0.75rem', borderRadius: '4px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }}
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1, minWidth: '150px' }}>
            <label>Initial Password</label>
            <input 
              type="text" required value={newUser.password} 
              onChange={e => setNewUser({...newUser, password: e.target.value})}
              style={{ padding: '0.75rem', borderRadius: '4px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }}
            />
          </div>
          <button type="submit" className="btn-primary" disabled={isSubmitting} style={{ height: '45px', padding: '0 2rem' }}>
            {isSubmitting ? "Adding..." : "+ Create Manager"}
          </button>
        </form>
      </section>

      <section className="user-list">
        <h3 style={{ marginBottom: '1rem' }}>Staff Accounts</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1rem' }}>
          {users.map(user => (
            <div key={user.id} className="glass-panel" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', opacity: user.isActive ? 1 : 0.5 }}>
              {editingUserId === user.id ? (
                <>
                  <input type="text" value={editUserData.name} onChange={e => setEditUserData({...editUserData, name: e.target.value})} style={{ padding: '0.5rem', background: 'rgba(0,0,0,0.3)', border: '1px solid #333', color: 'white' }} />
                  <input type="email" value={editUserData.email} onChange={e => setEditUserData({...editUserData, email: e.target.value})} style={{ padding: '0.5rem', background: 'rgba(0,0,0,0.3)', border: '1px solid #333', color: 'white' }} />
                  <input type="text" placeholder="New Password (leave blank to keep)" value={editUserData.password} onChange={e => setEditUserData({...editUserData, password: e.target.value})} style={{ padding: '0.5rem', background: 'rgba(0,0,0,0.3)', border: '1px solid #333', color: 'white' }} />
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                    <button onClick={() => saveEdit(user)} className="btn-primary" style={{ flex: 1, padding: '0.5rem' }}>Save</button>
                    <button onClick={() => setEditingUserId(null)} style={{ flex: 1, padding: '0.5rem', background: '#333', color: 'white', border: 'none', borderRadius: '4px' }}>Cancel</button>
                  </div>
                </>
              ) : (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 'bold' }}>{user.name} <span style={{ fontSize: '0.7rem', background: 'var(--accent-color)', padding: '2px 6px', borderRadius: '4px' }}>{user.role}</span></div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{user.email}</div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button 
                      onClick={() => startEditing(user)}
                      style={{ padding: '0.4rem 0.8rem', borderRadius: '4px', border: 'none', background: 'var(--accent-color)', color: 'white', cursor: 'pointer' }}
                    >
                      Edit
                    </button>
                    {user.role !== "OWNER" && (
                      <>
                        <button 
                          onClick={() => toggleStatus(user)}
                          style={{ padding: '0.4rem 0.8rem', borderRadius: '4px', border: 'none', background: user.isActive ? '#eab308' : 'var(--success-color)', color: 'white', cursor: 'pointer' }}
                        >
                          {user.isActive ? "Disable" : "Enable"}
                        </button>
                        <button 
                          onClick={() => handleDelete(user)}
                          style={{ padding: '0.4rem 0.8rem', borderRadius: '4px', border: 'none', background: 'var(--danger-color)', color: 'white', cursor: 'pointer' }}
                        >
                          Delete
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
