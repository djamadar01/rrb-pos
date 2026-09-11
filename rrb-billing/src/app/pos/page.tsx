"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import MenuManager from "@/components/MenuManager";
import { useLanguage } from "@/lib/i18n";
import LanguageToggle from "@/components/LanguageToggle";
import { getLocalizedDishName } from "@/lib/dishTranslations";

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
  const validTabs = ["Menu", "Current Bill", "Recent Bills", "Menu Management"];
  const [activeTab, setActiveTab] = useState("Menu");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { language, t } = useLanguage();

  // Sync tab and category with URL & browser history
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const tabParam = params.get("tab");
    if (tabParam && validTabs.includes(tabParam)) {
      setActiveTab(tabParam);
    }
    const catParam = params.get("cat");
    if (catParam && categories.length > 0) {
      const found = categories.find(c => c.id === catParam);
      if (found) setSelectedCategory(found);
    }

    const handlePopState = () => {
      const currentParams = new URLSearchParams(window.location.search);
      const currentTab = currentParams.get("tab");
      if (currentTab && validTabs.includes(currentTab)) {
        setActiveTab(currentTab);
      } else {
        setActiveTab("Menu");
      }

      const currentCat = currentParams.get("cat");
      if (currentCat && categories.length > 0) {
        const found = categories.find(c => c.id === currentCat);
        setSelectedCategory(found || null);
      } else {
        setSelectedCategory(null);
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [categories]);

  const switchTab = (tab: string) => {
    if (tab === activeTab) return;
    setActiveTab(tab);
    setIsSidebarOpen(false);
    setSelectedCategory(null);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      if (tab === "Menu") {
        url.searchParams.delete("tab");
      } else {
        url.searchParams.set("tab", tab);
      }
      url.searchParams.delete("cat");
      window.history.pushState({ tab }, "", url.toString());
    }
  };

  const selectCategory = (cat: any) => {
    setSelectedCategory(cat);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      if (cat) {
        url.searchParams.set("cat", cat.id);
      } else {
        url.searchParams.delete("cat");
      }
      window.history.pushState({ tab: activeTab, cat: cat?.id }, "", url.toString());
    }
  };

  const handleBack = () => {
    if (selectedCategory) {
      selectCategory(null);
      return;
    }
    if (typeof window !== "undefined") {
      if (window.history.length > 1) {
        router.back();
        return;
      }
    }
    router.push("/");
  };

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  const itemsToShow = useMemo(() => {
    if (!selectedCategory) return [];
    return menu.filter(item => item.categoryId === selectedCategory.id);
  }, [menu, selectedCategory]);

  const fetchRecentBills = useCallback(async (currentOutletId: string) => {
    try {
      const res = await fetch(`/api/bills/recent?outletId=${currentOutletId}`);
      const data = await res.json();
      if (Array.isArray(data)) setRecentBills(data);
    } catch (err) {
      console.error(err);
    }
  }, []);

  // 1. Instant hydration from client cache (0ms load time!)
  useEffect(() => {
    try {
      const cachedCats = localStorage.getItem("rrb_pos_cats");
      const cachedMenu = localStorage.getItem("rrb_pos_menu");
      const cachedOutlet = localStorage.getItem("rrb_pos_outlet");
      if (cachedCats) setCategories(JSON.parse(cachedCats));
      if (cachedMenu) setMenu(JSON.parse(cachedMenu));
      if (cachedOutlet) setOutlet(JSON.parse(cachedOutlet));
    } catch (e) {
      console.error("Cache hydration error:", e);
    }
  }, []);

  // 2. Fetch fresh menu, categories, and outlet in background (SWR pattern)
  useEffect(() => {
    if (status !== "authenticated") return;
    let isMounted = true;

    // Fetch categories
    fetch("/api/categories")
      .then(res => res.json())
      .then(catData => {
        if (!isMounted) return;
        if (Array.isArray(catData)) {
          setCategories(catData);
          try { localStorage.setItem("rrb_pos_cats", JSON.stringify(catData)); } catch {}
        }
      })
      .catch(console.error);

    // Fetch menu
    fetch("/api/menu")
      .then(res => res.json())
      .then(menuData => {
        if (!isMounted) return;
        if (Array.isArray(menuData)) {
          const active = menuData.filter((item: any) => item.isActive);
          setMenu(active);
          try { localStorage.setItem("rrb_pos_menu", JSON.stringify(active)); } catch {}
        }
      })
      .catch(console.error);

    // Fetch outlet
    fetch("/api/outlets")
      .then(res => res.json())
      .then(outletsData => {
        if (!isMounted) return;
        if (Array.isArray(outletsData) && outletsData.length > 0) {
          setOutlet(outletsData[0]);
          try { localStorage.setItem("rrb_pos_outlet", JSON.stringify(outletsData[0])); } catch {}
          fetchRecentBills(outletsData[0].id);
        }
      })
      .catch(console.error);

    return () => { isMounted = false; };
  }, [status, fetchRecentBills]);

  // Re-fetch recent bills when switching to Recent Bills tab
  useEffect(() => {
    if (activeTab === "Recent Bills" && outlet?.id) {
      fetchRecentBills(outlet.id);
    }
  }, [activeTab, outlet?.id, fetchRecentBills]);

  const addToCart = (item: any, portion: "FULL" | "HALF" = "FULL") => {
    const itemPrice = (portion === "HALF" && item.halfPrice != null && item.halfPrice > 0) 
      ? item.halfPrice 
      : item.price;
    const itemCartKey = `${item.id}-${portion}`;
    
    setCart(prev => {
      const existing = prev.find(i => i.cartKey === itemCartKey);
      if (existing) {
        return prev.map(i => i.cartKey === itemCartKey ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [
        ...prev, 
        { 
          ...item, 
          cartId: Date.now() + Math.random(), 
          cartKey: itemCartKey,
          portion,
          price: itemPrice, 
          quantity: 1 
        }
      ];
    });
  };

  const getCartQuantity = (itemId: string, portion: "FULL" | "HALF" = "FULL") => {
    const itemCartKey = `${itemId}-${portion}`;
    const existing = cart.find(i => i.cartKey === itemCartKey);
    return existing ? existing.quantity : 0;
  };
  
  const getCartId = (itemId: string, portion: "FULL" | "HALF" = "FULL") => {
    const itemCartKey = `${itemId}-${portion}`;
    const existing = cart.find(i => i.cartKey === itemCartKey);
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
            portion: item.portion || "FULL",
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
        
        // Render bill immediately and auto-print
        setSelectedBill(newBill);
        setTimeout(() => window.print(), 100); // Slight delay for modal to render
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
            portion: item.portion || "FULL",
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
        
        // Render bill immediately and auto-print
        setSelectedBill(newBill);
        setTimeout(() => window.print(), 100);
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

  const handleCheckoutRef = useRef(handleCheckout);
  handleCheckoutRef.current = handleCheckout;
  const handleRazorpayCheckoutRef = useRef(handleRazorpayCheckout);
  handleRazorpayCheckoutRef.current = handleRazorpayCheckout;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "F1") { e.preventDefault(); setActiveTab("Menu"); }
      if (e.key === "F4") { e.preventDefault(); handleCheckoutRef.current(); }
      if (e.key === "F5") { e.preventDefault(); handleRazorpayCheckoutRef.current(); }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

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

  const shareBill = async () => {
    if (!selectedBill) return;
    
    let text = `--- ${t("restaurantName")} ---\n`;
    text += `${selectedBill.outlet?.name || ''}\n`;
    text += `${t("billNo")}: ${selectedBill.billNumber}\n`;
    text += `${t("date")}: ${new Date(selectedBill.createdAt).toLocaleString(language === 'mr' ? 'mr-IN' : language === 'hi' ? 'hi-IN' : 'en-IN')}\n`;
    text += `${t("cashier")}: ${selectedBill.creator?.name || ''}\n`;
    if (selectedBill.payments?.[0]?.method) {
      const payLabel = selectedBill.payments[0].method === 'CASH' ? t("cash") : (selectedBill.payments[0].method === 'RAZORPAY' || selectedBill.payments[0].method === 'ONLINE' ? t("online") : selectedBill.payments[0].method);
      text += `${t("paidVia")}: ${payLabel}\n`;
    }
    text += `----------------------\n`;
    
    selectedBill.items.forEach((item: any) => {
       const localizedName = getLocalizedDishName(item.menuItem || item, language);
       const portionTag = item.portion ? ` (${item.portion === 'HALF' ? t("half") : t("full")})` : '';
       const name = localizedName + portionTag;
       text += `${name}\n`;
       text += `${item.quantity} x Rs.${(item.subtotal/item.quantity).toFixed(2)} = Rs.${item.subtotal.toFixed(2)}\n`;
    });
    
    text += `----------------------\n`;
    text += `${t("subtotal")}: Rs.${selectedBill.subtotal.toFixed(2)}\n`;
    text += `${t("tax")}: Rs.${selectedBill.taxAmount.toFixed(2)}\n`;
    text += `${t("total").toUpperCase()}: Rs.${selectedBill.finalAmount.toFixed(2)}\n`;
    text += `----------------------\n`;
    text += `${t("thankYouMsg1")}\n`;
    text += `${t("thankYouMsg2")}\n`;

    const base64Text = btoa(unescape(encodeURIComponent(text)));
    const url = "intent:base64," + base64Text + "#Intent;scheme=rawbt;package=ru.a402d.rawbtprinter;end;";
    window.location.href = url;
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
            onClick={() => switchTab("Menu")}
          >
            <span className="icon">🍔</span>
            <span>Menu Categories</span>
          </button>
          <button 
            className={`sidebar-btn ${activeTab === "Current Bill" ? "active" : ""}`}
            onClick={() => switchTab("Current Bill")}
          >
            <span className="icon">🛒</span>
            <span>Current Bill {cart.length > 0 && `(${cart.length})`}</span>
          </button>
          <button 
            className={`sidebar-btn ${activeTab === "Recent Bills" ? "active" : ""}`}
            onClick={() => switchTab("Recent Bills")}
          >
            <span className="icon">🧾</span>
            <span>Recent Bills</span>
          </button>
          <button 
            className={`sidebar-btn ${activeTab === "Menu Management" ? "active" : ""}`}
            onClick={() => switchTab("Menu Management")}
          >
            <span className="icon">🍔</span>
            <span>{t("menuManagement")}</span>
          </button>
        </nav>

        <div className="sidebar-footer">
          <LanguageToggle />
          <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.5rem' }}>
            <button 
              type="button"
              onClick={handleBack} 
              className="sidebar-btn" 
              style={{ 
                flex: 1, 
                padding: '0.5rem', 
                justifyContent: 'center', 
                borderLeft: 'none', 
                background: 'rgba(255,255,255,0.06)', 
                border: '1px solid rgba(255,255,255,0.1)', 
                borderRadius: '6px',
                cursor: 'pointer',
                color: 'inherit',
                fontSize: '0.85rem'
              }}
              title="Go back to previous page"
            >
              &larr; {t("back") || "Back"}
            </button>
            <Link 
              href="/" 
              className="sidebar-btn" 
              style={{ 
                flex: 1, 
                textDecoration: 'none', 
                padding: '0.5rem', 
                justifyContent: 'center', 
                borderLeft: 'none', 
                background: 'rgba(255,255,255,0.06)', 
                border: '1px solid rgba(255,255,255,0.1)', 
                borderRadius: '6px',
                color: 'inherit',
                fontSize: '0.85rem'
              }}
              title="Return to Home"
            >
              🏠 {t("home") || "Home"}
            </Link>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', fontSize: '0.8rem', textAlign: 'center', marginTop: '0.5rem' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Status: <span style={{ color: 'var(--success-color)' }}>Online</span></span>
            <span className="badge info" style={{ padding: '0.2rem' }}>{outlet ? outlet.name : "Loading..."}</span>
          </div>
        </div>
      </aside>

      <main className="dashboard-main-content">
        <div className="pos-main" style={{ display: activeTab === "Menu" ? 'flex' : 'none', flexDirection: 'column', flex: 1 }}>
          <section className="pos-menu glass-panel" style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2>Menu (F1)</h2>
              {selectedCategory && (
                <button onClick={() => selectCategory(null)} className="btn-primary" style={{ padding: '0.5rem 1rem', background: '#334155' }}>
                  &larr; Back to Categories
                </button>
              )}
            </div>
            
            {!selectedCategory ? (
              categories.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                  <p>⏳ Loading categories & dishes...</p>
                </div>
              ) : (
                <div className="menu-grid">
                {categories.map(cat => (
                  <button 
                    key={cat.id} 
                    className="category-btn"
                    onClick={() => selectCategory(cat)}
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
                      <img src={cat.imageUrl} alt={cat.name} loading="lazy" decoding="async" style={{ width: '60px', height: '60px', borderRadius: '50%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>🏷️</div>
                    )}
                    <span>{cat.name}</span>
                  </button>
                ))}
              </div>
              )
            ) : (
              itemsToShow.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                  <p>No dishes found in this category.</p>
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
                          <img src={item.imageUrl} alt={item.name} loading="lazy" decoding="async" style={{ width: '100%', height: '120px', objectFit: 'cover', borderRadius: '8px' }} />
                        ) : (
                          <div style={{ width: '100%', height: '120px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>🍽️</div>
                        )}
                        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'flex-start', flexDirection: 'column', gap: '0.2rem' }}>
                          <span className="item-name" style={{ fontWeight: 'bold', fontSize: '1rem', wordBreak: 'break-word', lineHeight: 1.3 }}>
                            {getLocalizedDishName(item, language)}
                          </span>
                          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', fontSize: '0.85rem' }}>
                            <span style={{ color: 'var(--accent-color)', fontWeight: 600 }}>{t("full")}: ₹{item.price.toFixed(2)}</span>
                            {item.halfPrice != null && item.halfPrice > 0 && (
                              <span style={{ color: '#60a5fa', fontWeight: 600 }}>{t("half")}: ₹{item.halfPrice.toFixed(2)}</span>
                            )}
                          </div>
                        </div>
                        
                        <div style={{ marginTop: '0.5rem' }}>
                          {item.halfPrice != null && item.halfPrice > 0 ? (
                            <div style={{ display: 'flex', gap: '0.4rem' }}>
                              {/* Full Button */}
                              <div style={{ flex: 1 }}>
                                {getCartQuantity(item.id, "FULL") === 0 ? (
                                  <button 
                                    onClick={() => addToCart(item, "FULL")}
                                    style={{ width: '100%', padding: '0.45rem 0.2rem', borderRadius: '4px', border: '1px solid var(--accent-color)', background: 'transparent', color: 'var(--text-primary)', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.8rem' }}
                                  >
                                    + {t("full")} (₹{item.price})
                                  </button>
                                ) : (
                                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(212, 175, 55, 0.2)', border: '1px solid var(--accent-color)', borderRadius: '4px', overflow: 'hidden' }}>
                                    <button onClick={() => updateQuantity(getCartId(item.id, "FULL")!, -1)} style={{ padding: '0.4rem 0.5rem', background: 'transparent', color: 'var(--text-primary)', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>-</button>
                                    <span style={{ fontWeight: 'bold', fontSize: '0.8rem' }}>{getCartQuantity(item.id, "FULL")} F</span>
                                    <button onClick={() => updateQuantity(getCartId(item.id, "FULL")!, 1)} style={{ padding: '0.4rem 0.5rem', background: 'transparent', color: 'var(--text-primary)', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>+</button>
                                  </div>
                                )}
                              </div>

                              {/* Half Button */}
                              <div style={{ flex: 1 }}>
                                {getCartQuantity(item.id, "HALF") === 0 ? (
                                  <button 
                                    onClick={() => addToCart(item, "HALF")}
                                    style={{ width: '100%', padding: '0.45rem 0.2rem', borderRadius: '4px', border: '1px solid #3b82f6', background: 'transparent', color: 'var(--text-primary)', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.8rem' }}
                                  >
                                    + {t("half")} (₹{item.halfPrice})
                                  </button>
                                ) : (
                                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(59, 130, 246, 0.2)', border: '1px solid #3b82f6', borderRadius: '4px', overflow: 'hidden' }}>
                                    <button onClick={() => updateQuantity(getCartId(item.id, "HALF")!, -1)} style={{ padding: '0.4rem 0.5rem', background: 'transparent', color: 'var(--text-primary)', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>-</button>
                                    <span style={{ fontWeight: 'bold', fontSize: '0.8rem' }}>{getCartQuantity(item.id, "HALF")} H</span>
                                    <button onClick={() => updateQuantity(getCartId(item.id, "HALF")!, 1)} style={{ padding: '0.4rem 0.5rem', background: 'transparent', color: 'var(--text-primary)', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>+</button>
                                  </div>
                                )}
                              </div>
                            </div>
                          ) : (
                            <div>
                              {getCartQuantity(item.id, "FULL") === 0 ? (
                                <button 
                                  onClick={() => addToCart(item, "FULL")}
                                  style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--accent-color)', background: 'transparent', color: 'var(--text-primary)', cursor: 'pointer', fontWeight: 'bold' }}
                                >
                                  + {t("addDish")}
                                </button>
                              ) : (
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '4px', overflow: 'hidden' }}>
                                  <button onClick={() => updateQuantity(getCartId(item.id, "FULL")!, -1)} style={{ padding: '0.5rem 1rem', background: 'transparent', color: 'var(--text-primary)', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>-</button>
                                  <span style={{ fontWeight: 'bold' }}>{getCartQuantity(item.id, "FULL")}</span>
                                  <button onClick={() => updateQuantity(getCartId(item.id, "FULL")!, 1)} style={{ padding: '0.5rem 1rem', background: 'transparent', color: 'var(--text-primary)', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>+</button>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )
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

        <div className="pos-main" style={{ display: activeTab === "Current Bill" ? 'flex' : 'none', gap: '1rem', flex: 1, flexDirection: 'column' }}>
          <section className="pos-cart glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', flex: 1 }}>
            <div>
              <h2>{t("currentBill")}</h2>
              <div className="cart-items">
                {cart.map((item, index) => (
                  <div key={item.cartId} className="cart-item" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: 600, wordBreak: 'break-word' }}>
                          {getLocalizedDishName(item, language)}
                        </span>
                        <span style={{ 
                          fontSize: '0.7rem', 
                          fontWeight: 'bold',
                          padding: '1px 5px', 
                          borderRadius: '3px',
                          background: item.portion === 'HALF' ? '#2563eb' : 'var(--accent-color)',
                          color: item.portion === 'HALF' ? 'white' : 'var(--bg-primary)'
                        }}>
                          {item.portion === 'HALF' ? t("half") : t("full")}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.8rem', opacity: 0.7, marginTop: '0.2rem' }}>₹{item.price.toFixed(2)} {t("each")}</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <button onClick={() => updateQuantity(item.cartId, -1)} style={{ padding: '0.2rem 0.5rem', background: 'rgba(255, 255, 255, 0.1)', color: 'var(--text-primary)', border: 'none', borderRadius: '4px' }}>-</button>
                      <span style={{ fontWeight: 'bold' }}>{item.quantity}</span>
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

        <div className="pos-main" style={{ display: activeTab === "Recent Bills" ? 'flex' : 'none', flexDirection: 'column', gap: '1rem', flex: 1 }}>
          <section className="glass-panel" style={{ flex: 1, overflowY: 'auto', padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2>{t("recentBills")}</h2>
              {outlet?.id && (
                <button 
                  onClick={() => fetchRecentBills(outlet.id)} 
                  className="btn-primary" 
                  style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem', background: '#334155' }}
                >
                  🔄 Refresh
                </button>
              )}
            </div>
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

        <div className="glass-panel" style={{ display: activeTab === "Menu Management" ? 'flex' : 'none', padding: '2rem', flexDirection: 'column', gap: '1rem', flex: 1 }}>
          <h2>Menu Management</h2>
          <p style={{ color: 'var(--text-secondary)' }}>Manage dishes and categories for this outlet.</p>
          <MenuManager />
        </div>
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
            <div className={`print-receipt receipt-${language}`} style={{ background: 'white', color: 'black', padding: '1rem', borderRadius: '4px' }}>
              <div style={{ textAlign: 'center', marginBottom: '0.8rem' }}>
                <img 
                  src="/rrb-logo.jpg" 
                  alt="RRB Logo" 
                  className="receipt-logo" 
                />
                <h3 style={{ margin: '0.2rem 0', fontSize: '1.15rem', fontWeight: 800 }}>{t("restaurantName")}</h3>
                <p style={{ margin: '0.1rem 0', fontSize: '0.85rem', fontWeight: 600 }}>{selectedBill.outlet?.name}</p>
                <p style={{ margin: '0.1rem 0', fontSize: '0.8rem' }}>{t("billNo")}: <strong>{selectedBill.billNumber}</strong></p>
                <p style={{ margin: '0.1rem 0', fontSize: '0.8rem' }}>{t("date")}: {new Date(selectedBill.createdAt).toLocaleString(language === 'mr' ? 'mr-IN' : language === 'hi' ? 'hi-IN' : 'en-IN')}</p>
                <p style={{ margin: '0.1rem 0', fontSize: '0.8rem' }}>{t("cashier")}: {selectedBill.creator?.name}</p>
                {selectedBill.payments?.[0]?.method && (
                  <p style={{ margin: '0.1rem 0', fontSize: '0.8rem', fontWeight: 'bold' }}>
                    {t("paidVia")}: {selectedBill.payments[0].method === 'CASH' ? t("cash") : (selectedBill.payments[0].method === 'RAZORPAY' || selectedBill.payments[0].method === 'ONLINE' ? t("online") : selectedBill.payments[0].method)}
                  </p>
                )}
              </div>

              <div style={{ borderTop: '1px dashed #ccc', borderBottom: '1px dashed #ccc', padding: '0.5rem 0', margin: '0.8rem 0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', marginBottom: '0.4rem', borderBottom: '1px solid #eee', paddingBottom: '0.2rem' }}>
                  <span style={{ flex: 2 }}>{t("item")}</span>
                  <span style={{ flex: 1, textAlign: 'center' }}>{t("qty")}</span>
                  <span style={{ flex: 1, textAlign: 'right' }}>{t("amt")}</span>
                </div>
                {selectedBill.items.map((item: any) => {
                  const localizedName = getLocalizedDishName(item.menuItem || item, language);
                  const portionTag = item.portion ? ` (${item.portion === 'HALF' ? t("half") : t("full")})` : '';
                  const itemName = localizedName + portionTag;
                  return (
                    <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.35rem', gap: '0.5rem' }}>
                      <span style={{ flex: 2, whiteSpace: 'normal', wordBreak: 'break-word', lineHeight: 1.25 }}>{itemName}</span>
                      <span style={{ flex: 1, textAlign: 'center', whiteSpace: 'nowrap' }}>{item.quantity}</span>
                      <span style={{ flex: 1, textAlign: 'right', whiteSpace: 'nowrap' }}>₹{item.subtotal.toFixed(2)}</span>
                    </div>
                  );
                })}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
                <span>{t("subtotal")}:</span>
                <span>₹{selectedBill.subtotal.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
                <span>{t("tax")}:</span>
                <span>₹{selectedBill.taxAmount.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '1.2rem', marginTop: '0.4rem', borderTop: '1px dashed #ccc', paddingTop: '0.4rem' }}>
                <span>{t("total")}:</span>
                <span>₹{selectedBill.finalAmount.toFixed(2)}</span>
              </div>
              
              <div style={{ textAlign: 'center', marginTop: '1.2rem', fontSize: '0.85rem' }}>
                <p style={{ margin: 0, fontWeight: 600 }}>{t("thankYouMsg1")}</p>
                <p style={{ margin: '0.1rem 0 0 0' }}>{t("thankYouMsg2")}</p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
              <button className="btn-primary" onClick={printBill} style={{ flex: 1, background: 'var(--success-color)' }}>
                {t("printBill")}
              </button>
              <button className="btn-primary" onClick={shareBill} style={{ flex: 1, background: 'var(--accent-color)', color: 'var(--bg-primary)' }}>
                Print via RawBT
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
