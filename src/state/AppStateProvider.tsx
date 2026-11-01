"use client";

// Layout-level app state: interface language, search form selections and the last search.
// Kept above the routes so navigating between screens does not reset it.
import { createContext, useCallback, useContext, useMemo, useReducer, useRef, useState } from "react";
import { I18nextProvider } from "react-i18next";
import type { Lang } from "@/shared/catalog";
import { createI18n, DEFAULT_LANG } from "@/shared/i18n";
import type { SearchRequest, SearchResponse } from "@/shared/schemas";
import { saveSupplier, searchSuppliers } from "@/src/services/api";

export type SearchForm = {
  countryId: string | null;
  cityId: string | null;
  serviceId: string | null;
};

export type SearchState = {
  status: "idle" | "loading" | "success" | "error";
  // The last search that was started; drives the results heading and "retry".
  request: SearchRequest | null;
  response: SearchResponse | null;
};

type State = {
  lang: Lang;
  form: SearchForm;
  search: SearchState;
};

type Action =
  | { type: "setLang"; lang: Lang }
  | { type: "setCountry"; countryId: string | null }
  | { type: "setCity"; cityId: string | null }
  | { type: "setService"; serviceId: string | null }
  | { type: "searchStarted"; request: SearchRequest }
  | { type: "searchSucceeded"; response: SearchResponse }
  | { type: "searchFailed" }
  | { type: "supplierSaved"; searchedAt: string; index: number; savedId: string };

const initialState: State = {
  lang: DEFAULT_LANG,
  form: { countryId: null, cityId: null, serviceId: null },
  search: { status: "idle", request: null, response: null },
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
    case "searchStarted":
      return { ...state, search: { status: "loading", request: action.request, response: null } };
    case "searchSucceeded":
      return { ...state, search: { ...state.search, status: "success", response: action.response } };
    case "searchFailed":
      return { ...state, search: { ...state.search, status: "error", response: null } };
    case "supplierSaved": {
      // Ignored when a newer search has replaced the results the save was made from.
      const response = state.search.response;
      if (!response || response.searchedAt !== action.searchedAt) return state;
      const suppliers = response.suppliers.map((s, i) => (i === action.index ? { ...s, savedId: action.savedId } : s));
      return { ...state, search: { ...state.search, response: { ...response, suppliers } } };
    }
  }
}

type AppStateContextValue = State & {
  setLang: (lang: Lang) => void;
  setCountry: (countryId: string | null) => void;
  setCity: (cityId: string | null) => void;
  setService: (serviceId: string | null) => void;
  runSearch: (request: SearchRequest) => void;
  retrySearch: () => void;
  // Saves a supplier from the shown results and marks it as saved; throws when saving fails.
  saveResultSupplier: (index: number) => Promise<void>;
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

  // A new search aborts the previous one; only the latest request may update the state.
  const controllerRef = useRef<AbortController | null>(null);
  const runSearch = useCallback(async (request: SearchRequest) => {
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    dispatch({ type: "searchStarted", request });
    try {
      const response = await searchSuppliers(request, controller.signal);
      if (controllerRef.current === controller) dispatch({ type: "searchSucceeded", response });
    } catch {
      if (controllerRef.current === controller) dispatch({ type: "searchFailed" });
    }
  }, []);

  const lastRequest = state.search.request;
  const retrySearch = useCallback(() => {
    if (lastRequest) runSearch(lastRequest);
  }, [lastRequest, runSearch]);

  const { request: searchRequest, response: searchResponse } = state.search;
  const saveResultSupplier = useCallback(
    async (index: number) => {
      if (!searchRequest || !searchResponse) return;
      const saved = await saveSupplier(searchRequest, searchResponse.suppliers[index]);
      dispatch({ type: "supplierSaved", searchedAt: searchResponse.searchedAt, index, savedId: saved.id });
    },
    [searchRequest, searchResponse],
  );

  const value = useMemo<AppStateContextValue>(
    () => ({
      ...state,
      setLang,
      setCountry: (countryId) => dispatch({ type: "setCountry", countryId }),
      setCity: (cityId) => dispatch({ type: "setCity", cityId }),
      setService: (serviceId) => dispatch({ type: "setService", serviceId }),
      runSearch,
      retrySearch,
      saveResultSupplier,
    }),
    [state, setLang, runSearch, retrySearch, saveResultSupplier],
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
