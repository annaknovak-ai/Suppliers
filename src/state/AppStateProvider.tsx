"use client";

// Layout-level app state: interface language, search form selections and the last search.
// Kept above the routes so navigating between screens does not reset it, and remembered in the browser
// so a refresh does not reset it either.
import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef, useState } from "react";
import { I18nextProvider } from "react-i18next";
import type { Lang } from "@/shared/catalog";
import { createI18n, DEFAULT_LANG } from "@/shared/i18n";
import type { SearchRequest, SearchResponse } from "@/shared/schemas";
import { saveSupplier, searchSuppliers } from "@/src/services/api";
import { loadLang, loadSearch, storeLang, storeSearch, type StoredSearch } from "./browserMemory";

export type SearchForm = {
  countryId: string | null;
  cityId: string | null;
  serviceId: string | null;
};

export type SearchState = {
  status: "idle" | "loading" | "success" | "error";
  // The last search that was started, without the refresh flag; drives the results heading, saving and export.
  request: SearchRequest | null;
  // True when that search was "Search again": it always searches the web, so the loading state shows at once
  // and "retry" searches the web again too.
  refresh: boolean;
  response: SearchResponse | null;
};

type State = {
  lang: Lang;
  form: SearchForm;
  search: SearchState;
  // False until the remembered search has been read back from the browser.
  restored: boolean;
};

type Action =
  | { type: "setLang"; lang: Lang }
  | { type: "restore"; lang: Lang | null; stored: StoredSearch | null }
  | { type: "setCountry"; countryId: string | null }
  | { type: "setCity"; cityId: string | null }
  | { type: "setService"; serviceId: string | null }
  | { type: "searchStarted"; request: SearchRequest; refresh: boolean }
  | { type: "searchSucceeded"; response: SearchResponse }
  | { type: "searchFailed" }
  | { type: "supplierSaved"; searchedAt: string; index: number; savedId: string };

const initialState: State = {
  lang: DEFAULT_LANG,
  form: { countryId: null, cityId: null, serviceId: null },
  search: { status: "idle", request: null, refresh: false, response: null },
  restored: false,
};

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "setLang":
      return { ...state, lang: action.lang };
    case "restore":
      return {
        ...state,
        restored: true,
        lang: action.lang ?? state.lang,
        form: action.stored?.form ?? state.form,
        search: action.stored?.last ? { status: "success", refresh: false, ...action.stored.last } : state.search,
      };
    case "setCountry":
      // Changing the country always resets the city (PRD 3ג).
      return { ...state, form: { ...state.form, countryId: action.countryId, cityId: null } };
    case "setCity":
      return { ...state, form: { ...state.form, cityId: action.cityId } };
    case "setService":
      return { ...state, form: { ...state.form, serviceId: action.serviceId } };
    case "searchStarted":
      return {
        ...state,
        search: { status: "loading", request: action.request, refresh: action.refresh, response: null },
      };
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
  // "Search again": a new web search for the shown city and service, even when a saved result is valid.
  refreshSearch: () => void;
  // Saves a supplier from the shown results and marks it as saved; throws when saving fails.
  saveResultSupplier: (index: number) => Promise<void>;
};

const AppStateContext = createContext<AppStateContextValue | null>(null);

export function AppStateProvider({ children }: { children: React.ReactNode }) {
  const [i18n] = useState(createI18n);
  const [state, dispatch] = useReducer(reducer, initialState);

  const setLang = useCallback((lang: Lang) => {
    dispatch({ type: "setLang", lang });
    storeLang(lang);
  }, []);

  // The page is first rendered with the defaults, so the remembered state is applied right after it loads.
  useEffect(() => {
    dispatch({ type: "restore", lang: loadLang(), stored: loadSearch() });
  }, []);

  // i18next follows the committed state: changing it any earlier would make the parts of the page
  // React is still hydrating render a different language than the server sent.
  const { lang: activeLang, form, search, restored } = state;
  useEffect(() => {
    i18n.changeLanguage(activeLang);
    document.documentElement.lang = activeLang;
  }, [i18n, activeLang]);

  // Starts only after the restore above, so the empty defaults never overwrite what was remembered.
  useEffect(() => {
    if (!restored) return;
    const { status, request, response } = search;
    storeSearch({ form, last: status === "success" && request && response ? { request, response } : null });
  }, [restored, form, search]);

  // A new search aborts the previous one; only the latest request may update the state.
  const controllerRef = useRef<AbortController | null>(null);
  const runSearch = useCallback(async (request: SearchRequest, refresh = false) => {
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    const { countryId, cityId, serviceId } = request;
    dispatch({ type: "searchStarted", request: { countryId, cityId, serviceId }, refresh });
    try {
      const response = await searchSuppliers({ countryId, cityId, serviceId, refresh }, controller.signal);
      if (controllerRef.current === controller) dispatch({ type: "searchSucceeded", response });
    } catch {
      if (controllerRef.current === controller) dispatch({ type: "searchFailed" });
    }
  }, []);

  const { request: lastRequest, refresh: lastWasRefresh } = state.search;
  const retrySearch = useCallback(() => {
    if (lastRequest) runSearch(lastRequest, lastWasRefresh);
  }, [lastRequest, lastWasRefresh, runSearch]);
  const refreshSearch = useCallback(() => {
    if (lastRequest) runSearch(lastRequest, true);
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
      runSearch: (request) => runSearch(request),
      retrySearch,
      refreshSearch,
      saveResultSupplier,
    }),
    [state, setLang, runSearch, retrySearch, refreshSearch, saveResultSupplier],
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
