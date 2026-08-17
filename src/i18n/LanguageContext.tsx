import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { Language, TranslationDictionary, translations } from './translations.js';
import { api } from '../services/api.js';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: TranslationDictionary;
  toggleLanguage: () => void;
  // User Data Translation Feature (Toggleable, backed by temporary cache files)
  translateUserData: boolean;
  setTranslateUserData: (enabled: boolean) => void;
  toggleTranslateUserData: () => void;
  translateUserText: (text: string) => Promise<string>;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const STORAGE_KEY = 'lifehub_language';
const TRANSLATE_DATA_KEY = 'lifehub_translate_user_data';

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === 'en' || saved === 'it') {
        return saved;
      }
    } catch {}
    return 'it';
  });

  const [translateUserData, setTranslateUserDataState] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(TRANSLATE_DATA_KEY);
      if (saved !== null) {
        return saved === 'true';
      }
    } catch {}
    return true; // Enabled by default so users enjoy instant translation
  });

  // In-memory runtime cache for client responsiveness
  const clientCacheRef = useRef<Map<string, string>>(new Map());

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch {}
  };

  const toggleLanguage = () => {
    setLanguage(language === 'it' ? 'en' : 'it');
  };

  const setTranslateUserData = (enabled: boolean) => {
    setTranslateUserDataState(enabled);
    try {
      localStorage.setItem(TRANSLATE_DATA_KEY, String(enabled));
    } catch {}
  };

  const toggleTranslateUserData = () => {
    setTranslateUserData(!translateUserData);
  };

  const translateUserText = useCallback(
    async (text: string): Promise<string> => {
      if (!text || typeof text !== 'string' || !translateUserData) {
        return text;
      }

      const cacheKey = `${text.trim()}:::${language}`;
      if (clientCacheRef.current.has(cacheKey)) {
        return clientCacheRef.current.get(cacheKey)!;
      }

      try {
        const res = await api.translate.translateText(text, language);
        if (res.translated) {
          clientCacheRef.current.set(cacheKey, res.translated);
          return res.translated;
        }
      } catch (err) {
        // Fallback to original text smoothly on network error
      }
      return text;
    },
    [language, translateUserData]
  );

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        t: translations[language] || translations.it,
        toggleLanguage,
        translateUserData,
        setTranslateUserData,
        toggleTranslateUserData,
        translateUserText,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

/**
 * Reusable component to render translated user-entered text without mutating original records
 */
export const TranslatedText: React.FC<{
  text: string;
  className?: string;
  fallback?: string;
}> = ({ text, className = '', fallback = '' }) => {
  const { language, translateUserData, translateUserText } = useLanguage();
  const [displayText, setDisplayText] = useState<string>(text || fallback);

  useEffect(() => {
    let isMounted = true;
    if (!translateUserData || !text) {
      setDisplayText(text || fallback);
      return;
    }

    translateUserText(text).then((translated) => {
      if (isMounted) {
        setDisplayText(translated || text || fallback);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [text, language, translateUserData, translateUserText, fallback]);

  return <span className={className}>{displayText}</span>;
};
