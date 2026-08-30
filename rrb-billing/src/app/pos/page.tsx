"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import MenuManager from "@/components/MenuManager";
import { useLanguage } from "@/lib/i18n";
import LanguageToggle from "@/components/LanguageToggle";

export default function POSPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [cart, setCart] = useState<any[]>([]);
  const [menu, setMenu] = useState<any[]>([]);
  const [outlet, setOutlet] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [recentBills, setRecentBills] = useState<any[]>([]);
  const [selectedBill, setSelectedBill] = useState<any>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<any>(null);
  
  // Derived state for the total prevents any desyncs
  const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const [activeTab, setActiveTab] = useState("Menu");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { t } = useLanguage();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  const itemsToShow = useMemo(() => {
    if (!selectedCategory) return [];
    return menu.filter(item => item.categoryId === selectedCategory.id);
  }, [menu, selectedCategory]);

  const fetchRecentBills = async (currentOutletId: string) => {
    try {
      const res = await fetch(`/api/bills/recent?outletId=${currentOutletId}`);
      const data = await res.json();
      if (Array.isArray(data)) setRecentBills(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (status !== "authenticated") return;
    // Fetch menu
    fetch("/api/menu").then(res => res.json()).then(data => {
      if (Array.isArray(data)) setMenu(data.filter((item: any) => item.isActive));
    });
    // Fetch categories
    fetch("/api/categories").then(res => res.json()).then(data => {
      if (Array.isArray(data)) setCategories(data);
    });
    // Fetch outlet & shift
    fetch("/api/outlets").then(res => res.json()).then(data => {
      if (Array.isArray(data) && data.length > 0) {
        setOutlet(data[0]); // For demo, pick first outlet
        fetchRecentBills(data[0].id);
      }
    });

    // Keyboard shortcuts listener
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "F1") { e.preventDefault(); console.log("Focus menu"); }
      if (e.key === "F4") { e.preventDefault(); handleCheckout(); }
      if (e.key === "F5") { e.preventDefault(); handleRazorpayCheckout(); }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [cart, outlet]); // Added dependencies to allow handleCheckout to get latest state

  const addToCart = (item: any) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { ...item, cartId: Date.now(), quantity: 1 }];
    });
  };

  const getCartQuantity = (itemId: string) => {
    const existing = cart.find(i => i.id === itemId);
    return existing ? existing.quantity : 0;
  };
  
  const getCartId = (itemId: string) => {
    const existing = cart.find(i => i.id === itemId);
    return existing ? existing.cartId : null;
  };

  const updateQuantity = (cartId: number, delta: number) => {
    setCart(prev => {
      return prev.map(i => {
        if (i.cartId === cartId) {
          const newQty = i.quantity + delta;
          if (newQty > 0) {
            return { ...i, quantity: newQty };
          }
        }
        return i;
      });
    });
  };

  const removeFromCart = (cartId: number) => {
    setCart(prev => prev.filter(i => i.cartId !== cartId));
  };

  const handleCheckout = async () => {
    if (cart.length === 0 || !outlet || isProcessing) return;
    setIsProcessing(true);

    const shiftId = outlet.shifts?.[0]?.id || "dummy-shift-id";
    const subtotal = total;
    const taxAmount = 0; // Tax is 0 for now
    const finalAmount = subtotal + taxAmount;

    try {
      const res = await fetch("/api/bills", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": `idemp-${Date.now()}` // Generate unique idempotency key
        },
        body: JSON.stringify({
          outletId: outlet.id,
          shiftId,
          subtotal,
          taxAmount,
          serviceCharge: 0,
          discount: 0,
          finalAmount,
          paymentMethod: "CASH",
          items: cart.map(item => ({
            menuItemId: item.id,
            quantity: item.quantity,
            unitPrice: item.price,
            subtotal: item.price * item.quantity,
          }))
        })
      });

      if (res.ok) {
        const newBill = await res.json();
        setCart([]);
        fetchRecentBills(outlet.id);
        
        // Auto-print newly created bill
        await viewBill(newBill.id); 
        setTimeout(() => window.print(), 500); // Slight delay for modal to render
      } else {
        alert("Failed to create bill.");
      }
    } catch (err) {
      console.error(err);
      alert("Error creating bill.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRazorpayCheckout = async () => {
    if (cart.length === 0 || !outlet || isProcessing) return;
    setIsProcessing(true);

    const shiftId = outlet.shifts?.[0]?.id || "dummy-shift-id";
    const subtotal = total;
    const taxAmount = 0; // Tax is 0 for now
    const finalAmount = subtotal + taxAmount;

    try {
      // 1. Create Razorpay order
      const orderRes = await fetch("/api/payments/razorpay/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: finalAmount * 100, currency: "USD" }) // In cents/paise
      });

      if (!orderRes.ok) throw new Error("Failed to create order");
      const orderData = await orderRes.json();

      // 2. Simulate Razorpay Modal
      const userConfirmed = window.confirm(`[Mock Online Modal] Pay ₹${finalAmount.toFixed(2)} using UPI/Online for Order: ${orderData.id}?`);
      
      if (!userConfirmed) {
        setIsProcessing(false);
        return; // User cancelled payment
      }

      // 3. Finalize Bill in DB
      const res = await fetch("/api/bills", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": `idemp-rzp-${Date.now()}`
        },
        body: JSON.stringify({
          outletId: outlet.id,
          shiftId,
          subtotal,
          taxAmount,
          serviceCharge: 0,
          discount: 0,
          finalAmount,
          paymentMethod: "ONLINE",
          items: cart.map(item => ({
            menuItemId: item.id,
            quantity: item.quantity,
            unitPrice: item.price,
            subtotal: item.price * item.quantity,
          }))
        })
      });

      if (res.ok) {
        const newBill = await res.json();
        setCart([]);
        fetchRecentBills(outlet.id);
        
        // Auto-print newly created bill
        await viewBill(newBill.id); 
        setTimeout(() => window.print(), 500);
      } else {
        alert("Failed to create bill after payment.");
      }
    } catch (err) {
      console.error(err);
      alert("Error processing Razorpay payment.");
    } finally {
      setIsProcessing(false);
    }
  };

  const viewBill = async (billId: string) => {
    try {
      const res = await fetch(`/api/bills/${billId}`);
      if (res.ok) {
        const data = await res.json();
        setSelectedBill(data);
      } else {
        alert("Failed to fetch bill details");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const printBill = () => {
    window.print();
  };

  if (status === "loading") {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', color: 'white' }}>
        <p>Loading POS...</p>
      </div>
    );
  }

  if (status === "unauthenticated") {
    return null;
  }

  return (
    <div className="dashboard-layout">
      {/* Mobile Header with Hamburger */}
      <div className="mobile-header">
        <div className="sidebar-logo">RRB POS</div>
        <button className="hamburger-btn" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
          ☰
        </button>
      </div>

      <aside className={`dashboard-sidebar ${isSidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-logo desktop-only">RRB POS</div>
        <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1rem' }}>
          {outlet ? `${outlet.name}` : "Loading outlet..."}
        </div>
        
        <nav className="sidebar-nav">
          <button 
            className={`sidebar-btn ${activeTab === "Menu" ? "active" : ""}`}
            onClick={() => { setActiveTab("Menu"); setIsSidebarOpen(false); }}
          >
            <span className="icon">🍔</span>
            <span>Menu Categories</span>
          </button>
          <button 
            className={`sidebar-btn ${activeTab === "Current Bill" ? "active" : ""}`}
            onClick={() => { setActiveTab("Current Bill"); setIsSidebarOpen(false); }}
          >
            <span className="icon">🛒</span>
            <span>Current Bill {cart.length > 0 && `(${cart.length})`}</span>
          </button>
          <button 
            className={`sidebar-btn ${activeTab === "Recent Bills" ? "active" : ""}`}
            onClick={() => { setActiveTab("Recent Bills"); setIsSidebarOpen(false); }}
          >
            <span className="icon">🧾</span>
            <span>Recent Bills</span>
          </button>
          <button 
            className={`sidebar-btn ${activeTab === "Menu Management" ? "active" : ""}`}
            onClick={() => { setActiveTab("Menu Management"); setIsSidebarOpen(false); }}
          >
            <span className="icon">🍔</span>
            <span>{t("menuManagement")}</span>
          </button>
        </nav>

        <div className="sidebar-footer">
          <LanguageToggle />
          <Link href="/" className="sidebar-btn" style={{ textDecoration: 'none', padding: '0.5rem', justifyContent: 'center', borderLeft: 'none' }}>&larr; Home</Link>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', fontSize: '0.8rem', textAlign: 'center', marginTop: '0.5rem' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Status: <span style={{ color: 'var(--success-color)' }}>Online</span></span>
            <span className="badge info" style={{ padding: '0.2rem' }}>{outlet ? outlet.name : "Loading..."}</span>
          </div>
        </div>
      </aside>

      <main className="dashboard-main-content">
        {activeTab === "Menu" && (
          <div className="pos-main" style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
            <section className="pos-menu glass-panel" style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h2>Menu (F1)</h2>
                {selectedCategory && (
                  <button onClick={() => setSelectedCategory(null)} className="btn-primary" style={{ padding: '0.5rem 1rem', background: '#334155' }}>
                    &larr; Back to Categories
                  </button>
                )}
              </div>
              
              {!selectedCategory ? (
                <div className="menu-grid">
                {categories.map(cat => (
                  <button 
                    key={cat.id} 
                    className="category-btn"
                    onClick={() => setSelectedCategory(cat)}
                    style={{ 
                      padding: '1rem', 
                      borderRadius: '8px', 
                      border: 'none', 
                      background: selectedCategory?.id === cat.id ? 'var(--accent-color)' : 'rgba(255,255,255,0.1)', 
                      color: selectedCategory?.id === cat.id ? 'var(--bg-primary)' : 'var(--text-primary)', 
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}
                  >
                    {cat.imageUrl ? (
                      <img src={cat.imageUrl} alt={cat.name} style={{ width: '60px', height: '60px', borderRadius: '50%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>🏷️</div>
                    )}
                    <span>{cat.name}</span>
                  </button>
                ))}
              </div>
              ) : (
                <div className="menu-grid" style={{ paddingBottom: '80px' }}>
                  {itemsToShow.map((item) => {
                    const qty = getCartQuantity(item.id);
                    const cartId = getCartId(item.id);
                    
                    return (
                      <div 
                        key={item.id} 
                        className="menu-item-card glass-panel"
                        style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}
                      >
                        {item.imageUrl ? (
                          <img src={item.imageUrl} alt={item.name} style={{ width: '100%', height: '120px', objectFit: 'cover', borderRadius: '8px' }} />
                        ) : (
                          <div style={{ width: '100%', height: '120px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>🍽️</div>
                        )}
                        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                          <span className="item-name" style={{ fontWeight: 'bold' }}>{item.name}</span>
                          <span className="item-price" style={{ color: 'var(--accent-color)' }}>₹{item.price.toFixed(2)}</span>
                        </div>
                        
                        <div style={{ marginTop: '0.5rem' }}>
                          {qty === 0 ? (
                            <button 
                              onClick={() => addToCart(item)}
                              style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--accent-color)', background: 'transparent', color: 'var(--text-primary)', cursor: 'pointer', fontWeight: 'bold' }}
                            >
                              + ADD
                            </button>
                          ) : (
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '4px', overflow: 'hidden' }}>
                              <button onClick={() => updateQuantity(cartId!, -1)} style={{ padding: '0.5rem 1rem', background: 'transparent', color: 'var(--text-primary)', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>-</button>
                              <span style={{ fontWeight: 'bold' }}>{qty}</span>
                              <button onClick={() => updateQuantity(cartId!, 1)} style={{ padding: '0.5rem 1rem', background: 'transparent', color: 'var(--text-primary)', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>+</button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
            
            {/* Floating Review Bill Button */}
            {cart.length > 0 && (
              <div style={{
                position: 'fixed',
                bottom: '20px',
                left: '50%',
                transform: 'translateX(-50%)',
                width: 'calc(100% - 40px)',
                maxWidth: '400px',
                zIndex: 50
              }}>
                <button 
                  className="btn-primary" 
                  onClick={() => setActiveTab("Current Bill")}
                  style={{ width: '100%', padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--accent-color)', boxShadow: '0 4px 15px rgba(0,0,0,0.5)', fontSize: '1.1rem' }}
                >
                  <span>{cart.length} Item{cart.length > 1 ? 's' : ''} added</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    View Bill &rarr;
                  </span>
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === "Current Bill" && (
          <div className="pos-main" style={{ display: 'flex', gap: '1rem', flex: 1, flexDirection: 'column' }}>
            <section className="pos-cart glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', flex: 1 }}>
              <div>
                <h2>{t("currentBill")}</h2>
                <div className="cart-items">
                  {cart.map((item, index) => (
                    <div key={item.cartId} className="cart-item" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ flex: 1 }}>
                        <span>{item.name}</span>
                        <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>₹{item.price.toFixed(2)} {t("each")}</div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <button onClick={() => updateQuantity(item.cartId, -1)} style={{ padding: '0.2rem 0.5rem', background: 'rgba(255, 255, 255, 0.1)', color: 'var(--text-primary)', border: 'none', borderRadius: '4px' }}>-</button>
                        <span>{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.cartId, 1)} style={{ padding: '0.2rem 0.5rem', background: 'rgba(255, 255, 255, 0.1)', color: 'var(--text-primary)', border: 'none', borderRadius: '4px' }}>+</button>
                        <button onClick={() => removeFromCart(item.cartId)} style={{ marginLeft: '0.5rem', padding: '0.2rem 0.5rem', background: 'var(--danger-color)', color: 'white', border: 'none', borderRadius: '4px' }}>X</button>
                      </div>
                      <span style={{ marginLeft: '1rem', minWidth: '40px', textAlign: 'right' }}>₹{(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                  {cart.length === 0 && (
                    <div style={{ textAlign: 'center', opacity: 0.5, padding: '2rem 0' }}>No items in bill yet.</div>
                  )}
                </div>
                
                <div className="cart-summary">
                  <div className="summary-row">
                    <span>{t("subtotal")}:</span>
                    <span>₹{total.toFixed(2)}</span>
                  </div>
                  <div className="summary-row total-row">
                    <span>{t("total")}:</span>
                    <span>₹{total.toFixed(2)}</span>
                  </div>
                </div>

                <div className="cart-actions" style={{ marginTop: '1rem' }}>
                  <button className="btn-primary action-btn" onClick={handleCheckout} disabled={isProcessing || cart.length === 0}>
                    {isProcessing ? "Processing..." : t("payCash")}
                  </button>
                  <button className="btn-primary action-btn" onClick={handleRazorpayCheckout} disabled={isProcessing || cart.length === 0}>
                    {isProcessing ? "Processing..." : t("payOnline")}
                  </button>
                </div>
                
                <div style={{ marginTop: '1rem' }}>
                   <button className="btn-primary" onClick={() => setActiveTab("Menu")} style={{ width: '100%', background: '#334155' }}>
                     + Add More Items
                   </button>
                </div>
              </div>
            </section>
          </div>
        )}

        {activeTab === "Recent Bills" && (
          <div className="pos-main" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', flex: 1 }}>
            <section className="glass-panel" style={{ flex: 1, overflowY: 'auto', padding: '2rem' }}>
              <h2>{t("recentBills")}</h2>
              <div className="recent-bills-list" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '1rem' }}>
                {recentBills.map(bill => (
                  <div 
                    key={bill.id} 
                    onClick={() => viewBill(bill.id)}
                    style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', cursor: 'pointer', transition: 'background 0.2s' }}
                    onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                    onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                  >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                      <span style={{ fontWeight: 'bold' }}>{bill.billNumber}</span>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                        {new Date(bill.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.25rem' }}>
                      <span style={{ fontWeight: 'bold', color: 'var(--accent-color)' }}>₹{bill.finalAmount.toFixed(2)}</span>
                      <span className={`badge ${bill.status === 'PAID' ? 'success' : 'danger'}`} style={{ padding: '0.1rem 0.4rem', fontSize: '0.75rem' }}>
                        {bill.status}
                      </span>
                    </div>
                  </div>
                ))}
                {recentBills.length === 0 && (
                  <div style={{ textAlign: 'center', opacity: 0.5, padding: '2rem' }}>{t("noBillsYet")}</div>
                )}
              </div>
            </section>
          </div>
        )}

        {activeTab === "Menu Management" && (
          <div className="glass-panel" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem', flex: 1 }}>
            <h2>Menu Management</h2>
            <p style={{ color: 'var(--text-secondary)' }}>Manage dishes and categories for this outlet.</p>
            <MenuManager />
          </div>
        )}
      </main>

      {/* Bill View Modal (Kept as a modal since it pops over everything) */}
      {selectedBill && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
          background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div className="glass-panel no-print" style={{ padding: '2rem', width: '400px', maxHeight: '90vh', overflowY: 'auto' }}>
            <h2 style={{ textAlign: 'center', marginBottom: '1rem' }}>{t("billDetails")}</h2>
            
            {/* The Print Area */}
            <div className="print-receipt" style={{ background: 'white', color: 'black', padding: '1rem', borderRadius: '4px' }}>
              <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
                <h3 style={{ margin: 0 }}>RRB Fast Food</h3>
                <p style={{ margin: 0, fontSize: '0.8rem' }}>{selectedBill.outlet?.name}</p>
                <p style={{ margin: 0, fontSize: '0.8rem' }}>Bill No: {selectedBill.billNumber}</p>
                <p style={{ margin: 0, fontSize: '0.8rem' }}>Date: {new Date(selectedBill.createdAt).toLocaleString()}</p>
                <p style={{ margin: 0, fontSize: '0.8rem' }}>Cashier: {selectedBill.creator?.name}</p>
                {selectedBill.payments?.[0]?.method && (
                  <p style={{ margin: 0, fontSize: '0.8rem', fontWeight: 'bold' }}>Paid via: {selectedBill.payments[0].method}</p>
                )}
              </div>

              <div style={{ borderTop: '1px dashed #ccc', borderBottom: '1px dashed #ccc', padding: '0.5rem 0', margin: '1rem 0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                  <span style={{ flex: 2 }}>{t("item")}</span>
                  <span style={{ flex: 1, textAlign: 'center' }}>{t("qty")}</span>
                  <span style={{ flex: 1, textAlign: 'right' }}>{t("amt")}</span>
                </div>
                {selectedBill.items.map((item: any) => (
                  <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
                    <span style={{ flex: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.menuItem?.name || item.name}</span>
                    <span style={{ flex: 1, textAlign: 'center' }}>{item.quantity}</span>
                    <span style={{ flex: 1, textAlign: 'right' }}>₹{item.subtotal.toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>{t("subtotal")}:</span>
                <span>₹{selectedBill.subtotal.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>{t("tax")}:</span>
                <span>₹{selectedBill.taxAmount.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '1.2rem', marginTop: '0.5rem' }}>
                <span>{t("total")}:</span>
                <span>₹{selectedBill.finalAmount.toFixed(2)}</span>
              </div>
              
              <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.9rem' }}>
                <p style={{ margin: 0 }}>Thank you for visiting!</p>
                <p style={{ margin: 0 }}>Please come again.</p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
              <button className="btn-primary" onClick={printBill} style={{ flex: 1, background: 'var(--success-color)' }}>
                {t("printBill")}
              </button>
              <button className="btn-primary" onClick={() => setSelectedBill(null)} style={{ flex: 1, background: 'var(--danger-color)' }}>
                {t("close")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
