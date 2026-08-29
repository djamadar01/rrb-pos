"use client";

import { useLanguage } from "@/lib/i18n";

export default function LanguageToggle() {
  const { language, toggleLanguage } = useLanguage();

  return (
    <button 
      onClick={toggleLanguage}
      title="Toggle English / Marathi"
      style={{
        background: 'var(--accent-color)',
        color: 'white',
        border: '1px solid rgba(255,255,255,0.2)',
        padding: '0.4rem 0.8rem',
        borderRadius: '8px',
        cursor: 'pointer',
        fontWeight: 'bold',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        boxShadow: '0 2px 10px rgba(0,0,0,0.3)',
        transition: 'transform 0.2s',
      }}
      onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
      onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
    >
      <span style={{ opacity: language === 'en' ? 1 : 0.5 }}>A</span>
      <span style={{ opacity: 0.5 }}>/</span>
      <span style={{ opacity: language === 'mr' ? 1 : 0.5 }}>अ</span>
    </button>
  );
}
