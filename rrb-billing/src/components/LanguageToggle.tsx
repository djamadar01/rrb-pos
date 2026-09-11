"use client";

import { useLanguage, Language } from "@/lib/i18n";

export default function LanguageToggle() {
  const { language, setLanguage } = useLanguage();

  const languages: { code: Language; label: string; title: string }[] = [
    { code: 'en', label: 'EN', title: 'English' },
    { code: 'mr', label: 'मराठी', title: 'मराठी (Marathi)' },
    { code: 'hi', label: 'हिंदी', title: 'हिंदी (Hindi)' },
  ];

  return (
    <div 
      className="language-toggle-group"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        background: 'rgba(255, 255, 255, 0.08)',
        border: '1px solid rgba(255, 255, 255, 0.15)',
        borderRadius: '20px',
        padding: '2px',
        gap: '2px',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.25)',
      }}
    >
      {languages.map((lang) => {
        const isActive = language === lang.code;
        return (
          <button
            key={lang.code}
            onClick={() => setLanguage(lang.code)}
            title={lang.title}
            type="button"
            style={{
              background: isActive ? 'var(--accent-color)' : 'transparent',
              color: isActive ? '#ffffff' : 'var(--text-secondary)',
              border: 'none',
              borderRadius: '16px',
              padding: '0.3rem 0.65rem',
              fontSize: '0.8rem',
              fontWeight: isActive ? 700 : 500,
              cursor: 'pointer',
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: isActive ? '0 2px 6px rgba(255, 71, 87, 0.4)' : 'none',
              outline: 'none',
            }}
          >
            {lang.label}
          </button>
        );
      })}
    </div>
  );
}
