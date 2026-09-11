"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';

export type Language = 'en' | 'mr' | 'hi';

interface Translations {
  [key: string]: string;
}

const dictionaries: Record<Language, Translations> = {
  en: {
    // General
    home: "Home",
    back: "Back",
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
    
    // Thermal Receipt
    restaurantName: "RRB Fast Food & Chinese",
    billNo: "Bill No",
    date: "Date",
    cashier: "Cashier",
    paidVia: "Paid via",
    cash: "Cash",
    online: "Online",
    thankYouMsg1: "Thank you for visiting!",
    thankYouMsg2: "Please come again.",

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
    full: "Full",
    half: "Half",
    fullRate: "Full Rate (₹)",
    halfRate: "Half Rate (₹)",
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
    back: "मागे",
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

    // Thermal Receipt
    restaurantName: "आरआरबी फास्ट फूड & चायनीज",
    billNo: "बिल क्र.",
    date: "दिनांक",
    cashier: "कॅशियर",
    paidVia: "पेमेंट पद्धत",
    cash: "रोख",
    online: "ऑनलाइन",
    thankYouMsg1: "भेट दिल्याबद्दल धन्यवाद!",
    thankYouMsg2: "पुन्हा नक्की या.",

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
    full: "फुल",
    half: "हाफ",
    fullRate: "फुल दर (₹)",
    halfRate: "हाफ दर (₹)",
    category: "वर्ग",
    save: "जतन करा",
    cancel: "रद्द करा",
    edit: "संपादित करा",
    delete: "हटवा",
    disable: "अक्षम करा",
    enable: "सक्षम करा",
  },
  hi: {
    // General
    home: "होम",
    back: "वापस",
    role: "भूमिका",
    verified: "सत्यापित",
    
    // POS
    currentBill: "वर्तमान बिल",
    payCash: "नकद भुगतान (F4)",
    payOnline: "ऑनलाइन भुगतान (F5)",
    recentBills: "हाल के बिल",
    subtotal: "उपकुल",
    tax: "कर (टैक्स)",
    total: "कुल योग",
    checkout: "चेकआउट",
    items: "आइटम",
    each: "प्रति",
    noBillsYet: "अभी तक कोई बिल नहीं बना है।",
    billDetails: "बिल विवरण",
    item: "आइटम",
    qty: "मात्रा",
    amt: "राशि",
    close: "बंद करें",
    printBill: "बिल प्रिंट करें (थर्मल)",

    // Thermal Receipt
    restaurantName: "आरआरबी फास्ट फूड & चायनीज",
    billNo: "बिल सं.",
    date: "दिनांक",
    cashier: "कैशियर",
    paidVia: "भुगतान प्रकार",
    cash: "नकद",
    online: "ऑनलाइन",
    thankYouMsg1: "पधारने के लिए धन्यवाद!",
    thankYouMsg2: "कृपया फिर पधारें।",

    // Owner Dashboard
    overview: "अवलोकन",
    outlets: "आउटलेट्स",
    menuManagement: "मेनू प्रबंधन",
    reports: "रिपोर्ट्स",
    auditLogs: "ऑडिट लॉग",
    settings: "सेटिंग्स",
    
    todayRevenue: "आज का",
    totalOrdersToday: "आज के ऑर्डर्स",
    avgOrderValue: "औसत ऑर्डर मूल्य",
    onlinePayments: "ऑनलाइन भुगतान",
    cashPayments: "नकद भुगतान",

    // Menu
    addDish: "आइटम जोड़ें",
    dishName: "आइटम का नाम",
    price: "मूल्य",
    full: "फुल",
    half: "हाफ",
    fullRate: "फुल दर (₹)",
    halfRate: "हाफ दर (₹)",
    category: "श्रेणी",
    save: "सुरक्षित करें",
    cancel: "रद्द करें",
    edit: "संपादित करें",
    delete: "हटाएं",
    disable: "अक्षम करें",
    enable: "सक्षम करें",
  }
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType>({
  language: 'en',
  setLanguage: () => {},
  toggleLanguage: () => {},
  t: (key) => key,
});

export const LanguageProvider = ({ children }: { children: React.ReactNode }) => {
  const [language, setLanguageState] = useState<Language>('en');

  useEffect(() => {
    const savedLang = localStorage.getItem('app_lang') as Language;
    if (savedLang && (savedLang === 'en' || savedLang === 'mr' || savedLang === 'hi')) {
      setLanguageState(savedLang);
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('app_lang', lang);
  };

  const toggleLanguage = () => {
    const nextLang: Record<Language, Language> = {
      en: 'mr',
      mr: 'hi',
      hi: 'en',
    };
    setLanguage(nextLang[language]);
  };

  const t = (key: string) => {
    return dictionaries[language]?.[key] || dictionaries['en']?.[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
