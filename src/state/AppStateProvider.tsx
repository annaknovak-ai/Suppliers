"use client";

// Layout-level app state: interface language and search form selections.
// Kept above the routes so navigating between screens does not reset it.
import { createContext, useCallback, useContext, useMemo, useReducer, useState } from "react";
import { I18nextProvider } from "react-i18next";
import type { Lang } from "@/shared/catalog";
import { createI18n, DEFAULT_LANG } from "@/shared/i18n";

export type SearchForm = {
  countryId: string | null;
  cityId: string | null;
  serviceId: string | null;
};

type State = {
  lang: Lang;
  form: SearchForm;
};

type Action =
  | { type: "setLang"; lang: Lang }
  | { type: "setCountry"; countryId: string | null }
  | { type: "setCity"; cityId: string | null }
  | { type: "setService"; serviceId: string | null };

const initialState: State = {
  lang: DEFAULT_LANG,
  form: { countryId: null, cityId: null, serviceId: null },
};

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "setLang":
      return { ...state, lang: action.lang };
    case "setCountry":
      // Changing the country always resets the city (PRD 3ג).
      return { ...state, form: { ...state.form, countryId: action.countryId, cityId: null } };
    case "setCity":
      return { ...state, form: { ...state.form, cityId: action.cityId } };
    case "setService":
      return { ...state, form: { ...state.form, serviceId: action.serviceId } };
  }
}

type AppStateContextValue = State & {
  setLang: (lang: Lang) => void;
  setCountry: (countryId: string | null) => void;
  setCity: (cityId: string | null) => void;
  setService: (serviceId: string | null) => void;
};

const AppStateContext = createContext<AppStateContextValue | null>(null);

export function AppStateProvider({ children }: { children: React.ReactNode }) {
  const [i18n] = useState(createI18n);
  const [state, dispatch] = useReducer(reducer, initialState);

  const setLang = useCallback(
    (lang: Lang) => {
      i18n.changeLanguage(lang);
      document.documentElement.lang = lang;
      dispatch({ type: "setLang", lang });
    },
    [i18n],
  );

  const value = useMemo<AppStateContextValue>(
    () => ({
      ...state,
      setLang,
      setCountry: (countryId) => dispatch({ type: "setCountry", countryId }),
      setCity: (cityId) => dispatch({ type: "setCity", cityId }),
      setService: (serviceId) => dispatch({ type: "setService", serviceId }),
    }),
    [state, setLang],
  );

  return (
    <I18nextProvider i18n={i18n}>
      <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>
    </I18nextProvider>
  );
}

export function useAppState(): AppStateContextValue {
  const ctx = useContext(AppStateContext);
  if (!ctx) throw new Error("useAppState must be used inside AppStateProvider");
  return ctx;
}
