import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import translationEN from './translations/en/translation.json';
import translationFI from './translations/fi/translation.json';

const resources = {
  en: {
    
    translation: translationEN
  },
  fi: {
    
    translation: translationFI
  }
};

i18n.use(initReactI18next).init({
  resources,
  lng: 'fi',
  interpolation: {
    escapeValue: false
  }
});

export default i18n;
