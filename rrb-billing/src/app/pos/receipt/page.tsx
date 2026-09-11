"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ReceiptPrintPage() {
  const router = useRouter();
  const bill = {
    billNumber: "B-1025",
    date: new Date().toLocaleString(),
    outletName: "Main St. Outlet",
    items: [
      { name: "Burger", qty: 1, price: 5.00 },
      { name: "Coke", qty: 2, price: 4.00 }
    ],
    subtotal: 9.00,
    tax: 0.45,
    total: 9.45
  };

  useEffect(() => {
    // Automatically trigger print dialog when this page loads
    // setTimeout(() => window.print(), 500);
  }, []);

  const handleBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push("/pos");
    }
  };

  return (
    <div className="receipt-container">
      <style jsx global>{`
        body { background: white; color: black; font-family: monospace; }
        .receipt-container { width: 300px; margin: 0 auto; padding: 1rem; }
        .receipt-header { text-align: center; margin-bottom: 1rem; }
        .receipt-divider { border-top: 1px dashed black; margin: 0.5rem 0; }
        .receipt-item { display: flex; justify-content: space-between; }
        .receipt-total { font-weight: bold; font-size: 1.2rem; }
        @media print {
          .no-print { display: none !important; }
          @page { margin: 0; }
          body { margin: 1cm; }
        }
      `}</style>
      
      <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <button 
          onClick={handleBack} 
          style={{ 
            padding: '0.5rem 1rem', 
            background: '#1e293b', 
            color: 'white', 
            border: 'none', 
            borderRadius: '6px', 
            cursor: 'pointer',
            fontSize: '0.85rem',
            fontFamily: 'sans-serif'
          }}
        >
          &larr; Back to POS
        </button>
        <button 
          onClick={() => window.print()} 
          style={{ 
            padding: '0.5rem 1rem', 
            background: '#059669', 
            color: 'white', 
            border: 'none', 
            borderRadius: '6px', 
            cursor: 'pointer',
            fontSize: '0.85rem',
            fontFamily: 'sans-serif'
          }}
        >
          🖨️ Print
        </button>
      </div>

      <div className="receipt-header">
        <h2>RRB Fast Food</h2>
        <p>{bill.outletName}</p>
        <p>Bill: {bill.billNumber}</p>
        <p>{bill.date}</p>
      </div>

      <div className="receipt-divider"></div>

      <div className="receipt-items">
        {bill.items.map((item, idx) => (
          <div key={idx} className="receipt-item">
            <span>{item.qty}x {item.name}</span>
            <span>${item.price.toFixed(2)}</span>
          </div>
        ))}
      </div>

      <div className="receipt-divider"></div>

      <div className="receipt-summary">
        <div className="receipt-item">
          <span>Subtotal</span>
          <span>${bill.subtotal.toFixed(2)}</span>
        </div>
        <div className="receipt-item">
          <span>Tax (5%)</span>
          <span>${bill.tax.toFixed(2)}</span>
        </div>
        <div className="receipt-divider"></div>
        <div className="receipt-item receipt-total">
          <span>Total</span>
          <span>${bill.total.toFixed(2)}</span>
        </div>
      </div>
      
      <div className="receipt-divider"></div>
      <p style={{ textAlign: "center", marginTop: "1rem" }}>Thank you for dining with us!</p>
    </div>
  );
}
