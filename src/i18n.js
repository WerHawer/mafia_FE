import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { i18nextPlugin } from 'translation-check'

import Backend from 'i18next-http-backend';
import LanguageDetector from 'i18next-browser-languagedetector';

const SUPPORTED_LANGUAGES = ['en', 'uk'];

function convertDetectedLanguage(lng) {
    const base = lng.split('-')[0].toLowerCase();
    return SUPPORTED_LANGUAGES.includes(base) ? base : 'en';
}

i18n
    .use(Backend)
    .use(LanguageDetector)
    .use(initReactI18next)
    .use(i18nextPlugin)
    .init({
        fallbackLng: 'en',
        supportedLngs: SUPPORTED_LANGUAGES,
        debug: true,

        detection: {
            // localStorage is checked first — user's manual choice wins.
            // navigator is the browser/system language used when no saved preference exists.
            order: ['localStorage', 'navigator'],
            caches: ['localStorage'],
            lookupLocalStorage: 'i18nextLng',
            convertDetectedLanguage,
        },

        interpolation: {
            escapeValue: false,
        }
    });


export default i18n;