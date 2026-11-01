// Fixed catalog of countries, cities and service types (PRD FR1.2–FR1.3).
// Local names and search terms are used only to build the search request (ARCHITECTURE 2.5).

export type Lang = "ru" | "en" | "uk";
export const LANGS: Lang[] = ["ru", "en", "uk"];

export type LocalizedName = Record<Lang, string>;

// Languages used for searching the web (not interface languages).
export type SearchLang = "uk" | "ru" | "ro" | "en";

export type CountryId = "UA" | "MD";

export type Country = {
  id: CountryId;
  iso2: string;
  names: LocalizedName;
  searchLanguages: SearchLang[];
};

export type City = {
  id: string;
  countryId: CountryId;
  names: LocalizedName;
  localNames: Partial<Record<SearchLang, string>>;
  timezone: string;
};

export type ServiceType = {
  id: string;
  names: LocalizedName;
  searchTerms: Partial<Record<SearchLang, string[]>>;
};

export const COUNTRIES: Country[] = [
  {
    id: "MD",
    iso2: "MD",
    names: { ru: "Молдова", en: "Moldova", uk: "Молдова" },
    searchLanguages: ["ro", "ru"],
  },
  {
    id: "UA",
    iso2: "UA",
    names: { ru: "Украина", en: "Ukraine", uk: "Україна" },
    searchLanguages: ["uk", "ru"],
  },
];

export const CITIES: City[] = [
  {
    id: "chisinau",
    countryId: "MD",
    names: { ru: "Кишинёв", en: "Chișinău", uk: "Кишинів" },
    localNames: { ro: "Chișinău", ru: "Кишинёв" },
    timezone: "Europe/Chisinau",
  },
  {
    id: "odesa",
    countryId: "UA",
    names: { ru: "Одесса", en: "Odesa", uk: "Одеса" },
    localNames: { uk: "Одеса", ru: "Одесса" },
    timezone: "Europe/Kyiv",
  },
  {
    id: "kyiv",
    countryId: "UA",
    names: { ru: "Киев", en: "Kyiv", uk: "Київ" },
    localNames: { uk: "Київ", ru: "Киев" },
    timezone: "Europe/Kyiv",
  },
  {
    id: "kryvyi-rih",
    countryId: "UA",
    names: { ru: "Кривой Рог", en: "Kryvyi Rih", uk: "Кривий Ріг" },
    localNames: { uk: "Кривий Ріг", ru: "Кривой Рог" },
    timezone: "Europe/Kyiv",
  },
  {
    id: "zaporizhzhia",
    countryId: "UA",
    names: { ru: "Запорожье", en: "Zaporizhzhia", uk: "Запоріжжя" },
    localNames: { uk: "Запоріжжя", ru: "Запорожье" },
    timezone: "Europe/Kyiv",
  },
  {
    id: "kharkiv",
    countryId: "UA",
    names: { ru: "Харьков", en: "Kharkiv", uk: "Харків" },
    localNames: { uk: "Харків", ru: "Харьков" },
    timezone: "Europe/Kyiv",
  },
];

export const SERVICES: ServiceType[] = [
  {
    id: "cleaning",
    names: { ru: "Уборка", en: "Cleaning", uk: "Прибирання" },
    searchTerms: {
      uk: ["клінінгова компанія", "прибирання офісів"],
      ru: ["клининговая компания", "уборка офисов"],
      ro: ["companie de curățenie", "servicii de curățenie birouri"],
      en: ["commercial cleaning company"],
    },
  },
  {
    id: "air-conditioning",
    names: {
      ru: "Обслуживание систем кондиционирования",
      en: "Air conditioning maintenance",
      uk: "Обслуговування систем кондиціонування",
    },
    searchTerms: {
      uk: ["обслуговування кондиціонерів", "сервіс систем кондиціонування"],
      ru: ["обслуживание кондиционеров", "сервис систем кондиционирования"],
      ro: ["service aer condiționat", "mentenanță sisteme de climatizare"],
      en: ["air conditioning maintenance"],
    },
  },
  {
    id: "ventilation",
    names: {
      ru: "Обслуживание систем вентиляции",
      en: "Ventilation systems maintenance",
      uk: "Обслуговування систем вентиляції",
    },
    searchTerms: {
      uk: ["обслуговування систем вентиляції", "сервіс вентиляції"],
      ru: ["обслуживание систем вентиляции", "сервис вентиляции"],
      ro: ["mentenanță sisteme de ventilație", "service ventilație"],
      en: ["ventilation system maintenance"],
    },
  },
  {
    id: "elevators",
    names: {
      ru: "Обслуживание лифтов",
      en: "Elevator maintenance",
      uk: "Обслуговування ліфтів",
    },
    searchTerms: {
      uk: ["обслуговування ліфтів", "ліфтова компанія"],
      ru: ["обслуживание лифтов", "лифтовая компания"],
      ro: ["întreținere ascensoare", "service lifturi"],
      en: ["elevator maintenance company"],
    },
  },
  {
    id: "fire-safety",
    names: {
      ru: "Обслуживание пожарной сигнализации и средств пожаротушения",
      en: "Fire alarm and firefighting equipment maintenance",
      uk: "Обслуговування пожежної сигналізації та засобів пожежогасіння",
    },
    searchTerms: {
      uk: ["обслуговування пожежної сигналізації", "перезарядка вогнегасників"],
      ru: ["обслуживание пожарной сигнализации", "перезарядка огнетушителей"],
      ro: ["mentenanță sisteme de alarmă la incendiu", "verificare stingătoare"],
      en: ["fire alarm maintenance", "fire extinguisher service"],
    },
  },
  {
    id: "burglar-alarm",
    names: {
      ru: "Обслуживание охранной сигнализации",
      en: "Burglar alarm maintenance",
      uk: "Обслуговування охоронної сигналізації",
    },
    searchTerms: {
      uk: ["обслуговування охоронної сигналізації", "монтаж охоронної сигналізації"],
      ru: ["обслуживание охранной сигнализации", "монтаж охранной сигнализации"],
      ro: ["mentenanță sisteme de alarmă antiefracție", "sisteme de securitate"],
      en: ["burglar alarm maintenance"],
    },
  },
  {
    id: "waste-removal",
    names: { ru: "Вывоз мусора", en: "Waste removal", uk: "Вивезення сміття" },
    searchTerms: {
      uk: ["вивіз сміття", "вивезення відходів"],
      ru: ["вывоз мусора", "вывоз отходов"],
      ro: ["evacuare deșeuri", "colectare gunoi"],
      en: ["waste removal company"],
    },
  },
  {
    id: "physical-security",
    names: { ru: "Физическая охрана", en: "Physical security", uk: "Фізична охорона" },
    searchTerms: {
      uk: ["охоронна компанія", "фізична охорона об'єктів"],
      ru: ["охранная компания", "физическая охрана объектов"],
      ro: ["firmă de pază", "servicii de pază fizică"],
      en: ["security guard company"],
    },
  },
  {
    id: "cctv",
    names: {
      ru: "Обслуживание систем видеонаблюдения",
      en: "CCTV systems maintenance",
      uk: "Обслуговування систем відеоспостереження",
    },
    searchTerms: {
      uk: ["обслуговування відеоспостереження", "монтаж систем відеоспостереження"],
      ru: ["обслуживание видеонаблюдения", "монтаж систем видеонаблюдения"],
      ro: ["mentenanță sisteme de supraveghere video", "instalare camere video"],
      en: ["CCTV maintenance"],
    },
  },
  {
    id: "heating",
    names: {
      ru: "Обслуживание систем отопления",
      en: "Heating systems maintenance",
      uk: "Обслуговування систем опалення",
    },
    searchTerms: {
      uk: ["обслуговування систем опалення", "сервіс котлів"],
      ru: ["обслуживание систем отопления", "сервис котлов"],
      ro: ["mentenanță sisteme de încălzire", "service centrale termice"],
      en: ["heating system maintenance"],
    },
  },
];

export function getCountry(id: string): Country | undefined {
  return COUNTRIES.find((c) => c.id === id);
}

export function getCity(id: string): City | undefined {
  return CITIES.find((c) => c.id === id);
}

export function getService(id: string): ServiceType | undefined {
  return SERVICES.find((s) => s.id === id);
}

export function getCitiesByCountry(countryId: string): City[] {
  return CITIES.filter((c) => c.countryId === countryId);
}

// True only when all three ids exist and the city belongs to the country.
export function isValidSelection(countryId: string, cityId: string, serviceId: string): boolean {
  const city = getCity(cityId);
  return Boolean(getCountry(countryId) && city && city.countryId === countryId && getService(serviceId));
}
