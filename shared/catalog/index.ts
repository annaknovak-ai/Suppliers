// Fixed catalog of countries, cities and service types (PRD FR1.2–FR1.3).

export type Lang = "ru" | "en" | "uk";
export const LANGS: Lang[] = ["ru", "en", "uk"];

export type LocalizedName = Record<Lang, string>;

export type CountryId = "UA" | "MD";

export type Country = {
  id: CountryId;
  iso2: string;
  names: LocalizedName;
};

export type City = {
  id: string;
  countryId: CountryId;
  names: LocalizedName;
  timezone: string;
};

export type ServiceType = {
  id: string;
  names: LocalizedName;
};

export const COUNTRIES: Country[] = [
  { id: "MD", iso2: "MD", names: { ru: "Молдова", en: "Moldova", uk: "Молдова" } },
  { id: "UA", iso2: "UA", names: { ru: "Украина", en: "Ukraine", uk: "Україна" } },
];

export const CITIES: City[] = [
  {
    id: "chisinau",
    countryId: "MD",
    names: { ru: "Кишинёв", en: "Chișinău", uk: "Кишинів" },
    timezone: "Europe/Chisinau",
  },
  {
    id: "odesa",
    countryId: "UA",
    names: { ru: "Одесса", en: "Odesa", uk: "Одеса" },
    timezone: "Europe/Kyiv",
  },
  {
    id: "kyiv",
    countryId: "UA",
    names: { ru: "Киев", en: "Kyiv", uk: "Київ" },
    timezone: "Europe/Kyiv",
  },
  {
    id: "kryvyi-rih",
    countryId: "UA",
    names: { ru: "Кривой Рог", en: "Kryvyi Rih", uk: "Кривий Ріг" },
    timezone: "Europe/Kyiv",
  },
  {
    id: "zaporizhzhia",
    countryId: "UA",
    names: { ru: "Запорожье", en: "Zaporizhzhia", uk: "Запоріжжя" },
    timezone: "Europe/Kyiv",
  },
  {
    id: "kharkiv",
    countryId: "UA",
    names: { ru: "Харьков", en: "Kharkiv", uk: "Харків" },
    timezone: "Europe/Kyiv",
  },
];

export const SERVICES: ServiceType[] = [
  { id: "cleaning", names: { ru: "Уборка", en: "Cleaning", uk: "Прибирання" } },
  {
    id: "air-conditioning",
    names: {
      ru: "Обслуживание систем кондиционирования",
      en: "Air conditioning maintenance",
      uk: "Обслуговування систем кондиціонування",
    },
  },
  {
    id: "ventilation",
    names: {
      ru: "Обслуживание систем вентиляции",
      en: "Ventilation systems maintenance",
      uk: "Обслуговування систем вентиляції",
    },
  },
  {
    id: "elevators",
    names: {
      ru: "Обслуживание лифтов",
      en: "Elevator maintenance",
      uk: "Обслуговування ліфтів",
    },
  },
  {
    id: "fire-safety",
    names: {
      ru: "Обслуживание пожарной сигнализации и средств пожаротушения",
      en: "Fire alarm and firefighting equipment maintenance",
      uk: "Обслуговування пожежної сигналізації та засобів пожежогасіння",
    },
  },
  {
    id: "burglar-alarm",
    names: {
      ru: "Обслуживание охранной сигнализации",
      en: "Burglar alarm maintenance",
      uk: "Обслуговування охоронної сигналізації",
    },
  },
  {
    id: "waste-removal",
    names: { ru: "Вывоз мусора", en: "Waste removal", uk: "Вивезення сміття" },
  },
  {
    id: "physical-security",
    names: { ru: "Физическая охрана", en: "Physical security", uk: "Фізична охорона" },
  },
  {
    id: "cctv",
    names: {
      ru: "Обслуживание систем видеонаблюдения",
      en: "CCTV systems maintenance",
      uk: "Обслуговування систем відеоспостереження",
    },
  },
  {
    id: "heating",
    names: {
      ru: "Обслуживание систем отопления",
      en: "Heating systems maintenance",
      uk: "Обслуговування систем опалення",
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
