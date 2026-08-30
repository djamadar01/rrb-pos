"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

export default function MenuManager() {
  const [activeTab, setActiveTab] = useState<"dishes" | "categories">("dishes");

  // State
  const [menu, setMenu] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // New Dish State
  const [newItem, setNewItem] = useState({ name: "", price: "", categoryId: "", imageUrl: "" });
  const [newDishImage, setNewDishImage] = useState<File | null>(null);

  // New Category State
  const [newCategory, setNewCategory] = useState({ name: "", imageUrl: "" });
  const [newCatImage, setNewCatImage] = useState<File | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Edit State
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editItemData, setEditItemData] = useState({ name: "", price: "", categoryId: "", imageUrl: "" });

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [menuRes, catRes] = await Promise.all([
        fetch("/api/menu"),
        fetch("/api/categories")
      ]);
      const [menuData, catData] = await Promise.all([menuRes.json(), catRes.json()]);
      if (Array.isArray(menuData)) setMenu(menuData);
      if (Array.isArray(catData)) setCategories(catData);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const uploadImage = async (file: File) => {
    // Compress image client-side to prevent massive Base64 strings in the DB
    const compressedBlob = await new Promise<Blob>((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new window.Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const MAX_WIDTH = 400;
          const MAX_HEIGHT = 400;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          ctx?.drawImage(img, 0, 0, width, height);
          canvas.toBlob(
            (blob) => {
              if (blob) resolve(blob);
              else reject(new Error("Canvas to Blob failed"));
            },
            "image/jpeg",
            0.7
          );
        };
      };
      reader.onerror = reject;
    });

    const formData = new FormData();
    formData.append("file", compressedBlob, file.name);
    const res = await fetch("/api/upload", { method: "POST", body: formData });
    if (!res.ok) throw new Error("Upload failed");
    const data = await res.json();
    return data.url;
  };

  // --- Category Handlers ---
  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategory.name) return;
    setIsSubmitting(true);
    try {
      let imageUrl = "";
      if (newCatImage) {
        imageUrl = await uploadImage(newCatImage);
      }
      
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newCategory.name, imageUrl })
      });
      
      if (res.ok) {
        setNewCategory({ name: "", imageUrl: "" });
        setNewCatImage(null);
        fetchData();
      } else {
        const data = await res.json().catch(() => ({}));
        alert(data.error === "Unauthorized" ? "Failed: Unauthorized. Please log in as an Owner or Manager." : `Failed: ${data.error || "Could not add category"}`);
      }
    } catch (err) {
      console.error(err);
      alert("An error occurred while creating the category.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteCategory = async (cat: any) => {
    if (!confirm(`Are you sure you want to delete category "${cat.name}"?`)) return;
    try {
      const res = await fetch(`/api/categories?id=${cat.id}`, { method: "DELETE" });
      if (res.ok) {
        fetchData();
      } else {
        const data = await res.json().catch(() => ({}));
        alert(data.error === "Unauthorized" ? "Failed: Unauthorized. Please log in." : data.error || "Could not delete category.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  // --- Dish Handlers ---
  const handleAddDish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItem.name || !newItem.price || !newItem.categoryId) return;
    setIsSubmitting(true);

    try {
      let imageUrl = "";
      if (newDishImage) {
        imageUrl = await uploadImage(newDishImage);
      }

      const res = await fetch("/api/menu", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...newItem, imageUrl })
      });
      
      if (res.ok) {
        setNewItem({ name: "", price: "", categoryId: "", imageUrl: "" });
        setNewDishImage(null);
        fetchData();
      } else {
        const data = await res.json().catch(() => ({}));
        alert(data.error === "Unauthorized" ? "Failed: Unauthorized. Please log in as an Owner or Manager." : `Failed: ${data.error || "Could not add dish"}`);
      }
    } catch (err) {
      console.error(err);
      alert("An error occurred while creating the dish.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const startEditing = (item: any) => {
    setEditingItemId(item.id);
    setEditItemData({ 
      name: item.name, 
      price: item.price.toString(), 
      categoryId: item.categoryId || "", 
      imageUrl: item.imageUrl || "" 
    });
  };

  const saveEdit = async (item: any) => {
    if (!editItemData.name || !editItemData.price || !editItemData.categoryId) return;
    try {
      const res = await fetch("/api/menu", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          id: item.id, 
          name: editItemData.name, 
          price: editItemData.price, 
          categoryId: editItemData.categoryId,
          // Not handling image update inline for simplicity, 
          // just keeping the old one unless we wanted to add a file input here too.
        })
      });
      if (res.ok) {
        setEditingItemId(null);
        fetchData();
      } else {
        alert("Failed to save changes.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const toggleDishStatus = async (item: any) => {
    try {
      const res = await fetch("/api/menu", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: item.id, isActive: !item.isActive })
      });
      if (res.ok) fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteDish = async (item: any) => {
    if (!confirm(`Are you sure you want to delete dish "${item.name}"?`)) return;
    try {
      const res = await fetch(`/api/menu?id=${item.id}`, { method: "DELETE" });
      if (res.ok) {
        fetchData();
      } else {
        const data = await res.json();
        alert(data.error);
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (isLoading) return <div>Loading menu data...</div>;

  return (
    <div className="menu-manager" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* Tabs */}
      <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '1rem' }}>
        <button 
          onClick={() => setActiveTab("dishes")}
          className="btn-primary" 
          style={{ background: activeTab === "dishes" ? 'var(--accent-color)' : 'rgba(255,255,255,0.1)' }}
        >
          Manage Dishes
        </button>
        <button 
          onClick={() => setActiveTab("categories")}
          className="btn-primary" 
          style={{ background: activeTab === "categories" ? 'var(--accent-color)' : 'rgba(255,255,255,0.1)' }}
        >
          Manage Categories
        </button>
      </div>

      {activeTab === "categories" && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <section className="add-category glass-panel" style={{ padding: '1.5rem', background: 'rgba(0,0,0,0.2)' }}>
            <h3 style={{ marginBottom: '1rem' }}>Add New Category</h3>
            <form onSubmit={handleAddCategory} className="mobile-stack-form" style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 2, minWidth: '200px' }}>
                <label>Category Name</label>
                <input type="text" required value={newCategory.name} onChange={e => setNewCategory({...newCategory, name: e.target.value})} style={{ padding: '0.75rem', borderRadius: '4px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1, minWidth: '200px' }}>
                <label>Category Image</label>
                <input type="file" accept="image/*" onChange={e => setNewCatImage(e.target.files?.[0] || null)} style={{ padding: '0.6rem', color: 'white' }} />
              </div>
              <button type="submit" className="btn-primary" disabled={isSubmitting} style={{ height: '45px', padding: '0 2rem' }}>
                {isSubmitting ? "Adding..." : "+ Add Category"}
              </button>
            </form>
          </section>

          <section className="category-list">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1rem' }}>
              {categories.map(cat => (
                <div key={cat.id} className="glass-panel" style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: '1rem', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    {cat.imageUrl && (
                      <img src={cat.imageUrl} alt={cat.name} style={{ width: '40px', height: '40px', borderRadius: '4px', objectFit: 'cover' }} />
                    )}
                    <span style={{ fontWeight: 'bold' }}>{cat.name}</span>
                  </div>
                  <button onClick={() => handleDeleteCategory(cat)} style={{ padding: '0.4rem 0.8rem', borderRadius: '4px', border: 'none', background: 'var(--danger-color)', color: 'white', cursor: 'pointer' }}>Delete</button>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}

      {activeTab === "dishes" && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <section className="add-dish glass-panel" style={{ padding: '1.5rem', background: 'rgba(0,0,0,0.2)' }}>
            <h3 style={{ marginBottom: '1rem' }}>Add New Dish</h3>
            <form onSubmit={handleAddDish} className="mobile-stack-form" style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 2, minWidth: '200px' }}>
                <label>Dish Name</label>
                <input type="text" required value={newItem.name} onChange={e => setNewItem({...newItem, name: e.target.value})} style={{ padding: '0.75rem', borderRadius: '4px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1, minWidth: '100px' }}>
                <label>Price (₹)</label>
                <input type="number" step="0.01" required value={newItem.price} onChange={e => setNewItem({...newItem, price: e.target.value})} style={{ padding: '0.75rem', borderRadius: '4px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1, minWidth: '150px' }}>
                <label>Category</label>
                <select 
                  required
                  value={newItem.categoryId} 
                  onChange={e => setNewItem({...newItem, categoryId: e.target.value})}
                  style={{ padding: '0.75rem', borderRadius: '4px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }}
                >
                  <option value="">Select Category</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1, minWidth: '200px' }}>
                <label>Dish Image</label>
                <input type="file" accept="image/*" onChange={e => setNewDishImage(e.target.files?.[0] || null)} style={{ padding: '0.6rem', color: 'white' }} />
              </div>
              <button type="submit" className="btn-primary" disabled={isSubmitting || categories.length === 0} style={{ height: '45px', padding: '0 2rem' }}>
                {isSubmitting ? "Adding..." : "+ Add Dish"}
              </button>
            </form>
            {categories.length === 0 && (
              <p style={{ color: 'var(--danger-color)', marginTop: '0.5rem', fontSize: '0.8rem' }}>Please create a category first before adding dishes.</p>
            )}
          </section>

          <section className="dish-list">
            <h3 style={{ marginBottom: '1rem' }}>Existing Dishes</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
              {menu.map(item => (
                <div key={item.id} className="glass-panel" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', opacity: item.isActive ? 1 : 0.5 }}>
                  {editingItemId === item.id ? (
                    <>
                      <input type="text" value={editItemData.name} onChange={e => setEditItemData({...editItemData, name: e.target.value})} style={{ padding: '0.5rem', background: 'rgba(0,0,0,0.3)', border: '1px solid #333', color: 'white' }} />
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <input type="number" step="0.01" value={editItemData.price} onChange={e => setEditItemData({...editItemData, price: e.target.value})} style={{ padding: '0.5rem', background: 'rgba(0,0,0,0.3)', border: '1px solid #333', color: 'white', flex: 1 }} />
                        <select 
                          value={editItemData.categoryId} 
                          onChange={e => setEditItemData({...editItemData, categoryId: e.target.value})} 
                          style={{ padding: '0.5rem', background: 'rgba(0,0,0,0.3)', border: '1px solid #333', color: 'white', flex: 1 }}
                        >
                          <option value="">Select Category</option>
                          {categories.map(cat => (
                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                          ))}
                        </select>
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                        <button onClick={() => saveEdit(item)} className="btn-primary" style={{ flex: 1, padding: '0.5rem' }}>Save</button>
                        <button onClick={() => setEditingItemId(null)} style={{ flex: 1, padding: '0.5rem', background: '#333', color: 'white', border: 'none', borderRadius: '4px' }}>Cancel</button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                          {item.imageUrl ? (
                             <img src={item.imageUrl} alt={item.name} style={{ width: '50px', height: '50px', borderRadius: '8px', objectFit: 'cover' }} />
                          ) : (
                             <div style={{ width: '50px', height: '50px', borderRadius: '8px', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem' }}>No Img</div>
                          )}
                          <div>
                            <div style={{ fontWeight: 'bold' }}>{item.name}</div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                              ₹{item.price.toFixed(2)} &bull; {item.category?.name || "Unknown"}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                        <button onClick={() => startEditing(item)} style={{ flex: 1, padding: '0.4rem', borderRadius: '4px', border: 'none', background: 'var(--accent-color)', color: 'white', cursor: 'pointer' }}>
                          Edit
                        </button>
                        <button onClick={() => toggleDishStatus(item)} style={{ flex: 1, padding: '0.4rem', borderRadius: '4px', border: 'none', background: item.isActive ? '#eab308' : 'var(--success-color)', color: 'white', cursor: 'pointer' }}>
                          {item.isActive ? "Disable" : "Enable"}
                        </button>
                        <button onClick={() => handleDeleteDish(item)} style={{ flex: 1, padding: '0.4rem', borderRadius: '4px', border: 'none', background: 'var(--danger-color)', color: 'white', cursor: 'pointer' }}>
                          Delete
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </section>
        </div>
      )}

    </div>
  );
}
