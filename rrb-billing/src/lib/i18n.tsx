"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';

type Language = 'en' | 'mr';

interface Translations {
  [key: string]: string;
}

const dictionaries: Record<Language, Translations> = {
  en: {
    // General
    home: "Home",
    role: "Role",
    verified: "Verified",
    
    // POS
    currentBill: "Current Bill",
    payCash: "Pay Cash (F4)",
    payOnline: "Pay Online (F5)",
    recentBills: "Recent Bills",
    subtotal: "Subtotal",
    tax: "Tax",
    total: "Total",
    checkout: "Checkout",
    items: "items",
    each: "each",
    noBillsYet: "No bills generated yet.",
    billDetails: "Bill Details",
    item: "Item",
    qty: "Qty",
    amt: "Amt",
    close: "Close",
    printBill: "Print Bill (Thermal)",
    
    // Owner Dashboard
    overview: "Overview",
    outlets: "Outlets",
    menuManagement: "Menu Management",
    reports: "Reports",
    auditLogs: "Audit Logs",
    settings: "Settings",
    
    todayRevenue: "Today's",
    totalOrdersToday: "Today's Orders",
    avgOrderValue: "Avg Order Value",
    onlinePayments: "Online Payments",
    cashPayments: "Cash Payments",
    
    // Menu
    addDish: "Add Dish",
    dishName: "Dish Name",
    price: "Price",
    category: "Category",
    save: "Save",
    cancel: "Cancel",
    edit: "Edit",
    delete: "Delete",
    disable: "Disable",
    enable: "Enable",
  },
  mr: {
    // General
    home: "मुख्यपृष्ठ",
    role: "भूमिका",
    verified: "सत्यापित",
    
    // POS
    currentBill: "सध्याचे बिल",
    payCash: "रोख रक्कम द्या (F4)",
    payOnline: "ऑनलाइन पेमेंट (F5)",
    recentBills: "अलीकडील बिले",
    subtotal: "उपएकूण",
    tax: "कर",
    total: "एकूण",
    checkout: "पैसे द्या",
    items: "पदार्थ",
    each: "प्रत्येकी",
    noBillsYet: "अद्याप कोणतीही बिले नाहीत.",
    billDetails: "बिलाचा तपशील",
    item: "पदार्थ",
    qty: "प्रमाण",
    amt: "रक्कम",
    close: "बंद करा",
    printBill: "बिल प्रिंट करा (थर्मल)",

    // Owner Dashboard
    overview: "आढावा",
    outlets: "दुकाने",
    menuManagement: "मेनू व्यवस्थापन",
    reports: "अहवाल",
    auditLogs: "ऑडिट लॉग",
    settings: "सेटिंग्ज",
    
    todayRevenue: "आजचे",
    totalOrdersToday: "आजच्या ऑर्डर्स",
    avgOrderValue: "सरासरी ऑर्डर मूल्य",
    onlinePayments: "ऑनलाइन पेमेंट",
    cashPayments: "रोख पेमेंट",

    // Menu
    addDish: "पदार्थ जोडा",
    dishName: "पदार्थाचे नाव",
    price: "किंमत",
    category: "वर्ग",
    save: "जतन करा",
    cancel: "रद्द करा",
    edit: "संपादित करा",
    delete: "हटवा",
    disable: "अक्षम करा",
    enable: "सक्षम करा",
  }
};

interface LanguageContextType {
  language: Language;
  toggleLanguage: () => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType>({
  language: 'en',
  toggleLanguage: () => {},
  t: (key) => key,
});

export const LanguageProvider = ({ children }: { children: React.ReactNode }) => {
  const [language, setLanguage] = useState<Language>('en');

  useEffect(() => {
    const savedLang = localStorage.getItem('app_lang') as Language;
    if (savedLang && (savedLang === 'en' || savedLang === 'mr')) {
      setLanguage(savedLang);
    }
  }, []);

  const toggleLanguage = () => {
    const newLang = language === 'en' ? 'mr' : 'en';
    setLanguage(newLang);
    localStorage.setItem('app_lang', newLang);
  };

  const t = (key: string) => {
    return dictionaries[language][key] || dictionaries['en'][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
