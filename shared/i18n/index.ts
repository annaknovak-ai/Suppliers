// i18next instance with all interface translations bundled statically.
import i18next from "i18next";
import en from "./en.json";
import ru from "./ru.json";
import uk from "./uk.json";

export const DEFAULT_LANG = "ru";

export function createI18n() {
  const instance = i18next.createInstance();
  instance.init({
    lng: DEFAULT_LANG,
    fallbackLng: DEFAULT_LANG,
    resources: {
      ru: { translation: ru },
      en: { translation: en },
      uk: { translation: uk },
    },
    interpolation: { escapeValue: false },
    initAsync: false,
  });
  return instance;
}
