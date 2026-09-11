import { Language } from './i18n';

interface LocalizedItem {
  name: string;
  nameMr?: string | null;
  nameHi?: string | null;
}

// Common fast food and Chinese dishes / terms dictionary
const dishDictionary: Record<string, { mr: string; hi: string; en?: string }> = {
  // Common terms
  "veg": { mr: "व्हेज", hi: "वेज" },
  "non-veg": { mr: "नॉन-व्हेज", hi: "नॉन-वेज" },
  "chicken": { mr: "चिकन", hi: "चिकन" },
  "paneer": { mr: "पनीर", hi: "पनीर" },
  "egg": { mr: "अंडा", hi: "अंडा" },
  "fish": { mr: "मासे", hi: "मछली" },
  "prawns": { mr: "कोळंबी", hi: "झींगा" },
  "mushroom": { mr: "मशरूम", hi: "मशरूम" },

  // Chinese & Fast Food
  "veg hakka noodles": { mr: "व्हेज हक्का नूडल्स", hi: "वेज हक्का नूडल्स" },
  "hakka noodles": { mr: "हक्का नूडल्स", hi: "हक्का नूडल्स" },
  "noodles": { mr: "नूडल्स", hi: "नूडल्स" },
  "chicken hakka noodles": { mr: "चिकन हक्का नूडल्स", hi: "चिकन हक्का नूडल्स" },
  "schezwan noodles": { mr: "शेजवान नूडल्स", hi: "शेजवान नूडल्स" },
  "shejwan noodles": { mr: "शेजवान नूडल्स", hi: "शेजवान नूडल्स" },
  "fried rice": { mr: "फ्राईड राईस", hi: "फ्राइड राइस" },
  "veg fried rice": { mr: "व्हेज फ्राईड राईस", hi: "वेज फ्राइड राइस" },
  "chicken fried rice": { mr: "चिकन फ्राईड राईस", hi: "चिकन फ्राइड राइस" },
  "egg fried rice": { mr: "अंडा फ्राईड राईस", hi: "अंडा फ्राइड राइस" },
  "schezwan fried rice": { mr: "शेजवान फ्राईड राईस", hi: "शेजवान फ्राइड राइस" },
  "shejwan fried rice": { mr: "शेजवान फ्राईड राईस", hi: "शेजवान फ्राइड राइस" },
  "triple rice": { mr: "ट्रिपल राईस", hi: "ट्रिपल राइस" },
  "triple schezwan rice": { mr: "ट्रिपल शेजवान राईस", hi: "ट्रिपल शेजवान राइस" },
  "manchurian": { mr: "मंचूरियन", hi: "मंचूरियन" },
  "veg manchurian": { mr: "व्हेज मंचूरियन", hi: "वेज मंचूरियन" },
  "chicken manchurian": { mr: "चिकन मंचूरियन", hi: "चिकन मंचूरियन" },
  "chilli": { mr: "चिल्ली", hi: "चिल्ली" },
  "paneer chilli": { mr: "पनीर चिल्ली", hi: "पनीर चिल्ली" },
  "chicken chilli": { mr: "चिकन चिल्ली", hi: "चिकन चिल्ली" },
  "crispy": { mr: "क्रिस्पी", hi: "क्रिस्पी" },
  "veg crispy": { mr: "व्हेज क्रिस्पी", hi: "वेज क्रिस्पी" },
  "chicken crispy": { mr: "चिकन क्रिस्पी", hi: "चिकन क्रिस्पी" },
  "lollipop": { mr: "लॉलीपॉप", hi: "लॉलीपॉप" },
  "chicken lollipop": { mr: "चिकन लॉलीपॉप", hi: "चिकन लॉलीपॉप" },
  "soup": { mr: "सूप", hi: "सूप" },
  "manchow soup": { mr: "मंचाऊ सूप", hi: "मंचाऊ सूप" },
  "hot and sour soup": { mr: "हॉट अँड सॉर सूप", hi: "हॉट एंड सॉर सूप" },

  // Kababs & Starters
  "kabab": { mr: "कबाब", hi: "कबाब" },
  "kebab": { mr: "कबाब", hi: "कबाब" },
  "shami kabab": { mr: "शामी कबाब", hi: "शामी कबाब" },
  "shami": { mr: "शामी", hi: "शामी" },
  "seekh kabab": { mr: "सीख कबाब", hi: "सीख कबाब" },
  "shejwan": { mr: "शेजवान", hi: "शेजवान" },
  "schezwan": { mr: "शेजवान", hi: "शेजवान" },

  // Burgers, Sandwiches & Snacks
  "burger": { mr: "बर्गर", hi: "बर्गर" },
  "veg burger": { mr: "व्हेज बर्गर", hi: "वेज बर्गर" },
  "chicken burger": { mr: "चिकन बर्गर", hi: "चिकन बर्गर" },
  "sandwich": { mr: "सँडविच", hi: "सैंडविच" },
  "veg sandwich": { mr: "व्हेज सँडविच", hi: "वेज सैंडविच" },
  "cheese sandwich": { mr: "चीज सँडविच", hi: "चीज सैंडविच" },
  "french fries": { mr: "फ्रेंच फ्राईज", hi: "फ्रेंच फ्राइज" },
  "fries": { mr: "फ्राइज", hi: "फ्राइज" },
  "roll": { mr: "रोल", hi: "रोल" },
  "frankie": { mr: "फ्रँकी", hi: "फ्रेंकी" },
  "momos": { mr: "मोमोज", hi: "मोमोज" },
  "pizza": { mr: "पिझ्झा", hi: "पिज़्ज़ा" },

  // Beverages
  "cold drink": { mr: "कोल्ड ड्रिंक", hi: "कोल्ड ड्रिंक" },
  "water bottle": { mr: "पाण्याची बाटली", hi: "पानी की बोतल" },
  "water": { mr: "पाणी", hi: "पानी" },
  "tea": { mr: "चहा", hi: "चाय" },
  "coffee": { mr: "कॉफी", hi: "कॉफी" },
  "abc": { mr: "एबीसी", hi: "एबीसी" },

  // Devanagari original entries
  "ट्रिपल राईस": { mr: "ट्रिपल राईस", hi: "ट्रिपल राइस", en: "Triple Rice" },
  "शामी कबाब": { mr: "शामी कबाब", hi: "शामी कबाब", en: "Shami Kabab" },
  "शामी कबाब ": { mr: "शामी कबाब", hi: "शामी कबाब", en: "Shami Kabab" },
};

/**
 * Returns the localized name of a dish based on the active language.
 * Checks:
 * 1. Database nameMr / nameHi explicit fields
 * 2. Exact match in dish dictionary
 * 3. Token-based word replacement for compound dish names
 * 4. Graceful fallback to original name
 */
export function getLocalizedDishName(
  dish: LocalizedItem | string | null | undefined,
  lang: Language
): string {
  if (!dish) return "";

  const dishObj: LocalizedItem = typeof dish === 'string' ? { name: dish } : dish;
  const rawName = (dishObj.name || "").trim();

  if (lang === 'en') {
    // Check if originally entered in Devanagari and has an English dictionary translation
    const lowerKey = rawName.toLowerCase();
    if (dishDictionary[lowerKey]?.en) {
      return dishDictionary[lowerKey].en!;
    }
    return rawName;
  }

  if (lang === 'mr') {
    if (dishObj.nameMr && dishObj.nameMr.trim().length > 0) {
      return dishObj.nameMr.trim();
    }
    // Check dictionary
    const lowerKey = rawName.toLowerCase();
    if (dishDictionary[lowerKey]?.mr) {
      return dishDictionary[lowerKey].mr;
    }
    // Token replacement
    return translateTokens(rawName, 'mr');
  }

  if (lang === 'hi') {
    if (dishObj.nameHi && dishObj.nameHi.trim().length > 0) {
      return dishObj.nameHi.trim();
    }
    // Check dictionary
    const lowerKey = rawName.toLowerCase();
    if (dishDictionary[lowerKey]?.hi) {
      return dishDictionary[lowerKey].hi;
    }
    // Fallback to nameMr if already Devanagari
    if (dishObj.nameMr && dishObj.nameMr.trim().length > 0) {
      return dishObj.nameMr.trim();
    }
    // Token replacement
    return translateTokens(rawName, 'hi');
  }

  return rawName;
}

/**
 * Tokenize and translate individual words if whole phrase is not in dictionary.
 */
function translateTokens(name: string, targetLang: 'mr' | 'hi'): string {
  // If already in Devanagari script, return as-is
  if (/[\u0900-\u097F]/.test(name)) {
    return name;
  }

  const words = name.split(/\s+/);
  const translatedWords = words.map(word => {
    const cleanWord = word.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (dishDictionary[cleanWord]) {
      return dishDictionary[cleanWord][targetLang];
    }
    return word;
  });

  return translatedWords.join(' ');
}

/**
 * Helper to auto-suggest Marathi & Hindi dish names when adding/editing in MenuManager.
 */
export function autoSuggestTranslations(englishName: string): { nameMr: string; nameHi: string } {
  const trimmed = (englishName || "").trim();
  if (!trimmed) return { nameMr: "", nameHi: "" };

  const mr = getLocalizedDishName(trimmed, 'mr');
  const hi = getLocalizedDishName(trimmed, 'hi');

  return {
    nameMr: mr !== trimmed ? mr : "",
    nameHi: hi !== trimmed ? hi : ""
  };
}
