# תוכנית – Milestone 1: תשתית ושלד האפליקציה

> מבוסס על `MILESTONES.md` (M1), `PRD.md`, `ARCHITECTURE.md` (סעיפים 2.2, 2.3, 2.9, 2.10, ADR-1–4) ו-`DESIGN.md` עם שלוש התמונות.
> מה **לא** נכלל ב-M1: קריאות API, Claude, Supabase, טבלאות, ייצוא, כרטיסי ספקים ומסך התוצאות. אלה שייכים ל-M2–M4.

---

## 1. מטרה ותוצר

אתר Next.js שרץ מקומית ומציג:
- את הכותרת העליונה המשותפת (Wordmark, ניווט ובורר שפות).
- את מסך Поиск עם טופס פעיל ואיור.
- את מסך `/saved` עם המצב הריק בלבד.
- החלפת שפה ru / en / uk.
- Manifest של PWA להתקנה ב-Android.

אחרי הדחיפה (רק כשהמשתמש מבקש), אותו אתר עולה ל-Production ב-Vercel.

---

## 2. סביבה וגרסאות

- Node 24 (מותקן מקומית), npm.
- **Next.js 16.4.3** (הגרסה היציבה העדכנית כעת), App Router, TypeScript, React 19.
- כל התלויות בגרסאות מדויקות ב-`package.json` (בלי `^`), עם `package-lock.json` (ARCHITECTURE 2.11).
- תלויות ריצה: `next`, `react`, `react-dom`, `i18next`, `react-i18next`, `server-only`.
- תלויות פיתוח: `typescript`, `@types/*`, `eslint`, `eslint-config-next`.
- **לא** מותקנים ב-M1: `zod`, `@anthropic-ai/sdk`, `@supabase/supabase-js`, `supabase` (CLI), `exceljs`. כל אחד נכנס ב-Milestone שבו הוא נדרש.
- אין צורך ב-`.env` או ב-`.env.example` ב-M1, כי אין עדיין משתני סביבה שהאפליקציה צריכה. `.env.example` ייווצר ב-M2.

**הקמה:** `npx create-next-app@16.4.3` בתיקייה זמנית (TypeScript, ESLint, App Router, בלי Tailwind, בלי `src/` כברירת מחדל), והעברת הקבצים לשורש הפרויקט. לא דורסים את `.gitignore` הקיים — הוא כבר מכסה `node_modules/`, `.next/`, `.vercel/`, `*.tsbuildinfo`. מוסיפים לו רק `next-env.d.ts` אם צריך.

---

## 3. מבנה קבצים שנוצר ב-M1

```
/app
  layout.tsx            <html lang>, גופנים, Providers, Header
  page.tsx              מסך Поиск (טופס + איור)
  page.module.css
  /saved/page.tsx       מסך Сохранённые поставщики – מצב ריק בלבד
  /saved/page.module.css
  manifest.ts           Web App Manifest
  globals.css           Design Tokens כמשתני CSS + reset בסיסי
  icon.svg              Favicon (סמל המוצר)
/src/ui
  Header.tsx + .module.css        Wordmark, ניווט, בורר שפות
  Wordmark.tsx                    סמל SVG + «Supplier Finder»
  LanguageSwitcher.tsx + .css     RU / EN / UK
  SearchForm.tsx + .module.css    שלושת ה-<select> וכפתור Найти
  Select.tsx + .module.css        <select> מעוצב עם תווית ו-Chevron
  Button.tsx + .module.css        וריאנטים: primary / secondary / saved / ghost / destructive
  EmptyState.tsx + .module.css    כרטיס ממורכז עם סמל וטקסט
  SearchIllustration.tsx          איור הבניינים והעלה (SVG, aria-hidden)
  /icons/*.tsx                    סט האייקונים כ-SVG
/src/state
  AppStateProvider.tsx            Context + useReducer: שפה ובחירות הטופס
  I18nProvider.tsx                אתחול i18next, עדכון <html lang>
/src/services                     (ריק ב-M1, ייווצר ב-M2)
/shared
  /catalog/index.ts               מדינות, ערים, תחומי שירות
  /i18n/ru.json, en.json, uk.json
  /i18n/index.ts                  הגדרת i18next
/server
  index.ts                        import "server-only" בלבד (שלד לשכבת השרת)
/scripts
  migrate.mjs
/public
  icon-192.png, icon-512.png, icon-maskable-512.png
next.config.ts                    Security Headers
vercel.json                       regions: ["fra1"]
eslint.config.mjs
tsconfig.json                     path aliases: @/src/*, @/shared/*, @/server/*
```

כללי התלות (ARCHITECTURE 2.2): `/src` מייבא רק מ-`/shared`. `/shared` לא מייבא מאף שכבה. `/server` מסומן ב-`server-only`.

---

## 4. תצורה

### `package.json` – סקריפטים
```
"dev":   "next dev"
"build": "node scripts/migrate.mjs && next build"
"start": "next start"
"lint":  "eslint ."
```
(ב-Next.js 16 הפקודה `next lint` הוסרה, ולכן משתמשים ב-ESLint ישירות עם `eslint-config-next`.)

### `next.config.ts`
- `headers()` לכל הנתיבים: `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin` (ARCHITECTURE 2.9).

### `vercel.json`
- `{ "regions": ["fra1"] }` – אזור ה-Functions (ARCHITECTURE 2.4, 2.10).

### `scripts/migrate.mjs`
- טוען את `.env` אם קיים (`process.loadEnvFile` של Node, בתוך try – בלי לקרוא או להדפיס ערכים).
- אם `SUPABASE_DB_URL` לא מוגדר: מדפיס שורה אחת ("Skipping migrations: SUPABASE_DB_URL not set") ויוצא בקוד 0.
- אם מוגדר: מריץ `npx supabase db push --db-url "$SUPABASE_DB_URL"` (דרך `spawnSync` עם `stdio: inherit`), ויוצא עם קוד היציאה שלו, כך שכישלון עוצר את ה-Build.
- ב-M1 המשתנה לא מוגדר בשום מקום, ולכן הסקריפט תמיד מדלג. חבילת ה-CLI ותיקיית `supabase/` נוספות ב-M4.

### `server/index.ts`
- `import "server-only";` ותו לא. כך השכבה קיימת ומוגנת מהיום הראשון.

---

## 5. Design Tokens (`app/globals.css`)

כל הערכים מ-DESIGN.md סעיף 2, כמשתני CSS על `:root`:

- **צבעים:** `--green-900/700/500/300/100/50`, `--navy-900/700/500/300/100/50`, `--paper`, `--ivory`, `--ivory-200`, `--line`, `--line-strong`, `--muted`, `--ink`.
- **פינות:** `--radius-control: 2px`, `--radius-card: 4px`, `--radius-pill: 999px`.
- **צללים:** `--shadow-raised: 0 4px 14px rgba(10,41,71,.10)`, `--shadow-overlay: 0 12px 32px rgba(10,41,71,.14)`.
- **מרווחים:** `--space-1..8` = 4 / 8 / 12 / 16 / 24 / 32 / 48 / 64.
- **פריסה:** `--content-max: 1200px`, `--gutter: 24px` (16px מתחת ל-768px).
- **טקסט:** מחלקות/משתנים לסולם: H1 32/40 (26/34), H2 24/32 (20/28), H3 18/26 (17/24), H4 15/22, Body 15/24, Interface 14/20, Caption 12/16. ערכי Mobile מתחת ל-768px.
- **Focus:** `:focus-visible` – מסגרת Deep Navy 2px במרחק 2px.
- `body`: רקע Ivory, טקסט Ink, Lora.

**גופנים:** `next/font/google` – `Lora` (400/500/600, subsets `latin` + `cyrillic`) ו-`Italiana` (400, `latin`), כמשתני CSS `--font-lora` ו-`--font-italiana`. הגופנים נארזים עם האתר (Self-hosted), בלי פנייה ל-Google בזמן ריצה.

**אייקונים:** רכיבי SVG פנימיים (בלי ספרייה חיצונית), כדי לעמוד בדרישה המדויקת של ה-Style Guide: רשת 24px, קו 1.75px, `stroke-linecap="square"`, `stroke-linejoin="miter"`, `stroke="currentColor"`, `fill="none"`. ב-M1 נוצרים כל 14 האייקונים שברשימה ב-DESIGN 2.3 (חיפוש, Chevron, הורדה, סימנייה, ✓, ✕, ?, פח, טלפון, מייל, קישור חיצוני, מיקום, גלובוס, i), אף שרק חלקם בשימוש עכשיו. כולם `aria-hidden`.

---

## 6. קטלוג (`/shared/catalog`)

```ts
type Lang = "ru" | "en" | "uk";
type LocalizedName = Record<Lang, string>;
Country { id: "UA" | "MD"; iso2; names }
City    { id; countryId; names; timezone }
ServiceType { id; names }
```
- **מדינות:** `MD` (Молдова / Moldova / Молдова), `UA` (Украина / Ukraine / Україна). סדר התצוגה כמו בטבלת FR1.2.
- **ערים:** `chisinau` (MD, Europe/Chisinau); `odesa`, `kyiv`, `kryvyi-rih`, `zaporizhzhia`, `kharkiv` (UA, Europe/Kyiv). השמות בדיוק כמו ב-FR1.2.
- **תחומי שירות:** 10 התחומים של FR1.3 בסדר שלהם, עם מזהים באנגלית (`cleaning`, `air-conditioning`, `ventilation`, `elevators`, `fire-safety`, `burglar-alarm`, `waste-removal`, `physical-security`, `cctv`, `heating`).
- פונקציות עזר: `getCitiesByCountry(countryId)`, `getCountry/getCity/getService(id)`.
- השדות שמשמשים רק לחיפוש (`iso2` נשאר, אבל `searchLanguages`, `localNames`, `searchTerms`) **נוספים ב-M2**, יחד עם החיפוש עצמו.
- שמות הקטלוג לא נכנסים לקובצי ה-JSON; הם מוצגים ישירות מ-`names[lang]`.

---

## 7. i18n

- `/shared/i18n/{ru,en,uk}.json` – כל הטקסטים מטבלת "טקסטים מרכזיים בממשק" ב-PRD, וגם הודעות מקרי הקצה מ-PRD 4ב (פחות מ-5, לא נמצאו, שגיאת חיפוש, «Повторить», שגיאת טעינה, «Нет сохранённых поставщиков», שגיאת שמירה), כדי שקובצי התרגום יהיו שלמים כבר עכשיו. טקסטי ה-Excel נוספים ב-M3.
- מפתחות באנגלית לפי אזור, למשל `nav.search`, `search.title`, `search.country.label`, `search.country.placeholder`, `search.submit`, `saved.empty`, `language.switcherLabel`.
- `{n}` → אינטרפולציה של i18next (`{{n}}`).
- אתחול: `lng: "ru"`, `fallbackLng: "ru"`, משאבים מיובאים סטטית (בלי טעינה ברשת), `interpolation.escapeValue: false`.
- `I18nProvider` (Client Component) עוטף את האפליקציה. בהחלפת שפה: `i18n.changeLanguage(lang)` ועדכון `document.documentElement.lang`.
- `<html lang="ru">` ב-Server Render (ברירת המחדל). השפה **לא** נשמרת בין כניסות (ARCHITECTURE 2.3).
- `<title>` ו-Manifest: «Supplier Finder» בכל השפות.

---

## 8. מצב משותף (`/src/state`)

`AppStateProvider` ב-`app/layout.tsx`, עם `useReducer`:
```ts
{ lang: Lang; form: { countryId: string | null; cityId: string | null; serviceId: string | null } }
actions: setLang, setCountry (מאפס cityId), setCity, setService
```
- בחירות הטופס נשמרות ב-Context ברמת ה-Layout, ולכן מעבר ל-`/saved` וחזרה, וגם החלפת שפה, לא מוחקים אותן (PRD Flow 3). ב-M2 יתווספו לכאן תוצאות החיפוש.

---

## 9. רכיבי UI ומסכים

### Header (כל המסכים) – לפי Mockups ו-DESIGN 1
- פס לבן, קו תחתון Line, תוכן ברוחב עד 1200px עם שוליים.
- **Wordmark:** סמל SVG (בניינים בירוק ובכחול + עלה ירוק, כמו בסמל שב-Style Guide) + «Supplier Finder» ב-Italiana, באנגלית תמיד. קישור ל-`/`.
- **ניווט:** `<nav>` עם שני `Link` – `/` (Поиск) ו-`/saved` (Сохранённые поставщики). הפריט הפעיל לפי `usePathname()`: Forest Green, SemiBold, קו תחתון 2px, ו-`aria-current="page"`.
- **בורר שפות:** קבוצת שלושה `<button>` בתוך מסגרת Navy אחת, `role="group"` עם `aria-label` («Язык интерфейса»), `aria-pressed` לשפה הפעילה. פעיל: רקע Navy וטקסט Ivory.
- **מובייל (מתחת ל-768px):** ה-Mockups מציגים רק Desktop, ו-DESIGN 2.4 קובע עמודה אחת עם אזורי לחיצה נוחים. לכן הכותרת נשברת לשתי שורות: שורה 1 – Wordmark ובורר השפות; שורה 2 – הניווט. גובה אזורי לחיצה לפחות 40px.

### מסך Поиск (`/`)
- H1 «Поиск поставщиков», שורת הסבר ב-Muted.
- כרטיס טופס לבן, קו Line, פינות 4px, רוחב קבוע של כ-360px (לפי היחס ב-Mockups), מיושר לשמאל.
- `Select` × 3, כל אחד עם `<label>` מעל ב-Lora SemiBold, `<option value="" disabled>` כ-Placeholder בצבע Muted, Chevron כאייקון מימין (`appearance: none`). גובה 40px, קו Line strong, פינות 2px. Focus: קו Navy 1.5px + טבעת Navy 100 של 3px.
  - **Страна:** אפשרויות מהקטלוג בשפת הממשק.
  - **Город:** `disabled` עד שנבחרת מדינה (רקע Ivory 200, טקסט אפור). מציג רק ערים של המדינה. החלפת מדינה מאפסת את העיר.
  - **Вид услуги:** 10 התחומים.
- **Найти:** Primary ברוחב מלא עם אייקון חיפוש; `disabled` (Primary disabled) עד ששלושת השדות מלאים. ב-M1 הלחיצה לא מבצעת חיפוש (הטופס עם `onSubmit` שמונע שליחה; החיבור ל-`/api/search` ב-M2).
- **איור:** SVG של בניינים אנכיים בירוק ובכחול עם חלונות בקווי Ivory ועלה ירוק, כמו ב-Mockups, בצד ימין צמוד לתחתית אזור התוכן. `aria-hidden="true"`.
  - **מובייל:** הטופס ברוחב מלא, והאיור מוצג מתחתיו בגודל מוקטן, בלי לגרום לגלילה אופקית.

### מסך `/saved`
- H2 «Сохранённые поставщики» (בלי «Всего», כי הרשימה עוד לא קיימת).
- `EmptyState`: כרטיס לבן ממורכז, הסמל של המוצר ומתחתיו «Нет сохранённых поставщиков» ב-Lora Medium (Style Guide, Visual Style → Imagery).

### Button
- נבנה עכשיו עם כל הווריאנטים מ-DESIGN 2.3 (גובה 38px רגיל / 30px קומפקטי, אייקון משמאל לטקסט), כדי שה-Milestones הבאים ישתמשו בו. ב-M1 בשימוש רק Primary.

---

## 10. PWA

- `app/manifest.ts`: `name` ו-`short_name` «Supplier Finder», `start_url: "/"`, `display: "standalone"`, `background_color: #FAFBF2`, `theme_color: #1B4B2F`, `lang: "ru"`, אייקונים 192 ו-512 (`purpose: "any"`) ו-512 maskable.
- אייקוני PNG ב-`/public`: הסמל של המוצר על רקע Ivory (ה-maskable עם שוליים בטוחים). נוצרים פעם אחת מקובץ SVG של הסמל, בכלי חד-פעמי (`npx` בלי להוסיף תלות לפרויקט), ונשמרים כקבצים ב-Repository.
- `app/icon.svg` כ-Favicon.
- **אין** Service Worker, אין `apple-touch-icon`, אין הנחיית התקנה ל-iOS (ARCHITECTURE 2.3, ADR-4).
- `viewport` ב-`layout.tsx`: `themeColor` ו-`width=device-width`.

---

## 11. נגישות

- `<label htmlFor>` לכל `<select>`. HTML סמנטי (`header`, `nav`, `main`).
- ניווט מלא במקלדת; Focus גלוי לפי ה-Style Guide.
- אין טקסט קטן מ-12px. הניגודיות לפי טבלת הצבעים (כולם AA).
- אייקונים ואיור – `aria-hidden`.

---

## 12. הקמה בהדרכת המשתמש (GitHub + Vercel)

לפי CLAUDE.md, אין push לפני שהמשתמש מבקש "דחוף". לכן ההקמה מתבצעת **בשלב הדחיפה של M1**, לא בבנייה:
1. המשתמש יוצר Repository ריק ב-GitHub ונותן את הכתובת.
2. `git remote add origin …`, commit ו-push ל-`main`.
3. הדרכה צעד אחר צעד: פתיחת חשבון Vercel בתוכנית Pro, Import של ה-Repository (Git Integration), ווידוא ש-Vercel משתמש ב-`npm run build`.
4. בדיקת הכתובת שהתקבלה, ובדיקת PWA ב-Android בכתובת ה-Production.

אין משתני סביבה להזין ב-Vercel ב-M1.

---

## 13. בדיקות שאני מריץ בסוף הבנייה

1. `npm run lint` ו-`npm run build` – בלי שגיאות (ה-Build מדפיס שה-Migrations דולגו).
2. `npm run dev` ובדיקה בדפדפן המובנה:
   - השוואה ל-Mockups: צבעים, גופנים, Header, טופס, איור.
   - תלות מדינה ← עיר, איפוס עיר בהחלפת מדינה, מצב הכפתור.
   - RU → EN → UK: כל הטקסטים, שמות הקטלוג ו-`<html lang>`.
   - ניווט `/` ↔ `/saved`, סימון הפריט הפעיל, שמירת בחירות הטופס במעבר.
   - רוחב 375px וגם Desktop – אין גלילה אופקית (`scrollWidth <= clientWidth`).
   - `/manifest.webmanifest` נטען ותקין, והאייקונים נגישים.
   - Security Headers מופיעים בתשובה.
3. בדיקה ש-`/src` לא מייבא מ-`/server` (grep).
4. סגירת שרת הפיתוח בסיום.
5. מילוי "פקודות הרצה" ב-CLAUDE.md: dev = `npm run dev`, בדיקות = "אין" (בדיקות אוטומטיות לא מוגדרות ב-spec; הבדיקה היא lint + build + בדיקה ידנית).
6. סימון 🟡 ליד M1 ב-MILESTONES.md.

---

## 14. Definition of Done – איך כל סעיף נבדק

| סעיף | איך נבדק |
|---|---|
| רץ מקומית; Push מפרסם ל-Production | `npm run dev` בבנייה. החלק של Production – אחרי הדחיפה |
| תואם ל-Mockups | השוואה ויזואלית בצילום מסך מול `mockups.png` |
| מדינה מסננת ערים, איפוס, Найти | בדיקה ידנית בדפדפן |
| רוסית כברירת מחדל, EN/UK, `lang` | בדיקה ידנית + קריאת `document.documentElement.lang` |
| ניווט ופריט פעיל | בדיקה ידנית |
| בלי גלילה אופקית ב-375px וב-Desktop | שינוי גודל חלון + בדיקת `scrollWidth` |
| התקנה ב-Android | אחרי הדחיפה, בכתובת ה-Production (המשתמש בודק בטלפון) |
| `build` ו-`lint` עוברים | הרצת הפקודות |

---

## 15. החלטות פרשנות (לא מוגדרות במפורש ב-spec)

- **Header ב-Mobile בשתי שורות** ו**איור מתחת לטופס ב-Mobile** – נגזר מ-DESIGN 2.4 ("עמודה אחת"), כי ה-Mockups הם Desktop בלבד.
- **אייקונים כ-SVG פנימי** ולא ספרייה – כדי לעמוד בדיוק במפרט הקו של ה-Style Guide בלי תלות נוספת.
- **Next.js 16 → `eslint .`** במקום `next lint`.
- **שדות החיפוש בקטלוג** (`localNames`, `searchTerms`, `searchLanguages`) נדחים ל-M2.
- **הקמת GitHub ו-Vercel** – בשלב הדחיפה, בהתאם לכלל "אין push בלי בקשה".
