"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/lib/i18n";

export default function ReceiptPrintPage() {
  const router = useRouter();
  const { language, t } = useLanguage();

  const bill = {
    billNumber: "B-1025",
    date: new Date().toLocaleString(language === 'mr' ? 'mr-IN' : language === 'hi' ? 'hi-IN' : 'en-IN'),
    outletName: "Main St. Outlet",
    items: [
      { name: "Burger", qty: 1, price: 50.00 },
      { name: "Cold Drink", qty: 2, price: 40.00 }
    ],
    subtotal: 90.00,
    tax: 0.00,
    total: 90.00
  };

  const handleBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push("/pos");
    }
  };

  return (
    <div className={`receipt-container receipt-${language}`}>
      <style jsx global>{`
        body { background: white; color: black; }
        .receipt-container { 
          width: 300px; 
          margin: 0 auto; 
          padding: 1rem; 
          font-family: 'Courier New', Courier, monospace, 'Noto Sans Devanagari', sans-serif;
        }
        .receipt-container.receipt-mr,
        .receipt-container.receipt-hi {
          font-family: 'Noto Sans Devanagari', 'Mukta', 'Mangal', sans-serif !important;
          font-size: 12.5px;
        }
        .receipt-header { text-align: center; margin-bottom: 0.8rem; }
        .receipt-logo {
          width: 70px;
          height: 70px;
          object-fit: cover;
          border-radius: 50%;
          margin: 0 auto 0.4rem auto;
          display: block;
          border: 1px solid #000;
        }
        .receipt-divider { border-top: 1px dashed black; margin: 0.5rem 0; }
        .receipt-item { display: flex; justify-content: space-between; }
        .receipt-total { font-weight: bold; font-size: 1.2rem; }
        @media print {
          .no-print { display: none !important; }
          @page { margin: 0; }
          body { margin: 0.5cm; }
          .receipt-logo {
            width: 65px !important;
            height: 65px !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
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
          &larr; {t("back")}
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
          🖨️ {t("printBill")}
        </button>
      </div>

      <div className="receipt-header">
        <img 
          src="/rrb-logo.jpg" 
          alt="RRB Logo" 
          className="receipt-logo" 
        />
        <h2 style={{ margin: '0.2rem 0', fontSize: '1.2rem', fontWeight: 800 }}>{t("restaurantName")}</h2>
        <p style={{ margin: '0.1rem 0' }}>{bill.outletName}</p>
        <p style={{ margin: '0.1rem 0' }}>{t("billNo")}: {bill.billNumber}</p>
        <p style={{ margin: '0.1rem 0' }}>{t("date")}: {bill.date}</p>
      </div>

      <div className="receipt-divider"></div>

      <div className="receipt-items">
        <div className="receipt-item" style={{ fontWeight: 'bold', marginBottom: '0.3rem' }}>
          <span>{t("item")}</span>
          <span>{t("amt")}</span>
        </div>
        {bill.items.map((item, idx) => (
          <div key={idx} className="receipt-item" style={{ marginBottom: '0.2rem' }}>
            <span>{item.qty}x {item.name}</span>
            <span>₹{item.price.toFixed(2)}</span>
          </div>
        ))}
      </div>

      <div className="receipt-divider"></div>

      <div className="receipt-summary">
        <div className="receipt-item">
          <span>{t("subtotal")}</span>
          <span>₹{bill.subtotal.toFixed(2)}</span>
        </div>
        <div className="receipt-item">
          <span>{t("tax")}</span>
          <span>₹{bill.tax.toFixed(2)}</span>
        </div>
        <div className="receipt-divider"></div>
        <div className="receipt-item receipt-total">
          <span>{t("total")}</span>
          <span>₹{bill.total.toFixed(2)}</span>
        </div>
      </div>
      
      <div className="receipt-divider"></div>
      <div style={{ textAlign: "center", marginTop: "1rem" }}>
        <p style={{ margin: 0, fontWeight: 600 }}>{t("thankYouMsg1")}</p>
        <p style={{ margin: "0.2rem 0 0 0" }}>{t("thankYouMsg2")}</p>
      </div>
    </div>
  );
}
