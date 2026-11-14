# Milestone 6 – שמירת תוצאות החיפוש (תוכנית)

> מבוסס על MILESTONES.md (M6), PRD FR2.6–FR2.9, FR3.10 וטבלאות הטקסטים, DESIGN.md סעיף 1.2, ARCHITECTURE.md סעיפים 2.4, 2.5, 2.10 ו-ADR-11.

## מטרה
תוצאה של חיפוש מוצלח ברשת נשמרת בטבלה `search_results` (שורה אחת לכל עיר ותחום). חיפוש חוזר של אותו צירוף בתוך 30 ימים נטען מהמסד תוך שנייה, בלי OpenAI. מעל התוצאות מוצגים תאריך החיפוש וכפתור «Искать заново», שמחפש ברשת מחדש ומחליף את השורה.

## הערה חשובה: M6 לפני M7
עדיין אין התחברות. לכן:
- `/api/search` לא מזהה משתמש (זה יתווסף ב-M7).
- הסימון `savedId` ממשיך לעבוד כמו היום, מול הרשימה המשותפת של `saved_suppliers` (בלי סינון לפי משתמש). ב-M7 יתווסף התנאי `user_id`.
- `search_results` משותפת ממילא לכל המשתמשים, כך שהיא לא תשתנה ב-M7.

---

## 1. Migration – הטבלה `search_results`

קובץ חדש, נוצר עם `npx supabase migration new create_search_results`:
`supabase/migrations/<timestamp>_create_search_results.sql`

```sql
-- Latest web search result per city and service, reused for 30 days (ARCHITECTURE 2.5, ADR-11).
create table public.search_results (
  city_id text not null,
  service_id text not null,
  response jsonb not null,          -- SearchResponse after business rules, without savedId
  searched_at timestamptz not null, -- time of the web search; drives the 30-day validity
  primary key (city_id, service_id)
);

-- Only the server (Secret Key) may access the table; no policies on purpose.
alter table public.search_results enable row level security;
```

- אין שינוי בטבלה `saved_suppliers` (תואם לאחור).
- הרצה על **Development בלבד**: `node scripts/migrate.mjs`, שקורא את `SUPABASE_DB_URL` מ-`.env` (ה-`.env` המקומי מכיל רק את פרטי ה-Development).
- Production: לא נוגעים. ה-Migration תרוץ שם רק בדחיפה של M6, אחרי אישור מפורש.

## 2. `/shared/schemas`

- `SearchRequestSchema`: הוספת `refresh: z.boolean().optional()`.
- `CachedSearchResponseSchema` (חדש): ה-`SearchResponse` בלי `savedId` בכל ספק, לבדיקת התוכן שנקרא מהמסד. כך שורה פגומה או ישנה במבנה שלה לא מפילה את החיפוש — היא פשוט לא משמשת, ומתבצע חיפוש ברשת.
- `ExportRequestSchema` ו-`SaveSupplierRequestSchema` משתמשים ב-`SearchRequestSchema`; השדה האופציונלי `refresh` לא מפריע להם. בשמירה ובייצוא הלקוח שולח את הבקשה בלי `refresh` (ראו סעיף 5).

## 3. `/server/db` – פעולות על `search_results`

ב-`server/db/index.ts` (אותו client עם ה-Secret Key):
- `getCachedSearch(cityId, serviceId)` → `{ response, searchedAt } | null`. קורא את השורה (`maybeSingle`), בודק את `response` עם `CachedSearchResponseSchema`. שורה לא תקינה מחזירה `null` עם שורת לוג `search_cache_invalid`. שגיאת מסד זורקת `DbError`.
- `storeSearch(cityId, serviceId, response)` → `upsert` לפי `(city_id, service_id)`, עם `response` בלי `savedId` ו-`searched_at = response.searchedAt`. שגיאה זורקת `DbError`.
- עדכון הערת הכותרת של הקובץ (הוא כבר לא רק `saved_suppliers`).

## 4. `/server/search.ts` – הזרימה החדשה

`runSearch(request, cancelSignal)`:
1. **אם `refresh` אינו `true`:** `getCachedSearch`. אם יש שורה ו-`searchedAt` בתוך 30 ימים (קבוע `CACHE_DAYS = 30`) — בונים `SearchResponse` עם `savedId: null` לכל ספק, מריצים `markSaved`, רושמים בלוג `search_cached` (`cityId`, `serviceId`, `durationMs`, `searchedAt`) ומחזירים. אם הקריאה נכשלת — `console.warn` עם `search_cache_read_failed`, וממשיכים לחיפוש ברשת.
2. **חיפוש ברשת:** כמו היום (`searchWithAi` → `applyRules`).
3. **שמירה:** `storeSearch` לפני `markSaved` (כדי שלא יישמר `savedId`). כישלון → `console.warn` עם `search_cache_write_failed`, והחיפוש ממשיך.
4. `markSaved` ושורת הלוג `search` הקיימת.

- חיפוש שנכשל או בוטל זורק לפני שלב 3, ולכן לא נוגע בשורה הקיימת (FR2.8).
- תוצאה מוצלחת עם 0 ספקים היא חיפוש מוצלח, ולכן נשמרת גם היא (ARCHITECTURE 2.6 כלל 6: "רק חיפוש שהצליח נשמר"). אפשר לרענן אותה בכפתור.
- `/app/api/search/route.ts`: בלי שינוי מהותי — `refresh` עובר דרך `parsed.data`.

## 5. לקוח

### `src/services/api.ts`
- בלי שינוי: `searchSuppliers` שולח את ה-`SearchRequest` כפי שהוא, כולל `refresh` כשקיים.

### `src/state/AppStateProvider.tsx`
- `runSearch(request)` נשאר; ההבדל רק בבקשה.
- חדש: `refreshSearch()` — שולח את הבקשה האחרונה עם `refresh: true`.
- ה-`request` שנשמר ב-state וב-`sessionStorage` הוא **בלי** `refresh` (מנקים אותו לפני השמירה ב-state), כך ששמירת ספק, ייצוא וכותרת התוצאות לא מושפעים. `retrySearch` אחרי כישלון של «Искать заново» צריך לחזור על חיפוש ברשת, ולכן נשמר ב-state גם דגל `lastWasRefresh` שמשמש רק את `retrySearch`.
- **מצב הטעינה (DESIGN 1.2: "תוצאה שמורה מוצגת מיד, בלי מצב הטעינה"):** הלקוח לא יודע מראש אם התוצאה שמורה. לכן ב-Найти רגיל מחוון הטעינה מוצג רק אם התשובה לא הגיעה תוך ~800ms (קבוע `LOADING_DELAY_MS`). ב-«Искать заново» הוא מוצג מיד. בזמן ההמתנה הקצרה אזור התוצאות ריק ו-`aria-busy` פעיל. מימוש: ב-`ResultsView`/`SearchProgress` — `useState` + `setTimeout` לפי דגל `immediate` שמגיע מה-state.

### `src/ui/ResultsView.tsx` + `ResultsView.module.css`
- מתחת לשורת הכותרת (לפני הבאנרים), שורה משנית חדשה:
  - טקסט `t("results.searchedAt", { date })` ב-Caption ובצבע Muted.
  - כפתור `Button variant="ghost" compact` עם `SearchIcon`, הטקסט `t("results.searchAgain")`, שקורא ל-`refreshSearch`.
- השורה מוצגת בכל תוצאה מוצלחת, גם כשאין ספקים וגם בתוצאה שחופשה עכשיו (FR3.10).
- CSS: `display:flex; flex-wrap:wrap; align-items:center; gap`. ברוחב צר (`max-width` של נקודת השבירה הקיימת בפרויקט) — `flex-direction: column; align-items: flex-start`, כך שהכפתור עובר לשורה נפרדת מתחת לתאריך.

### פורמט התאריך
- הפונקציה `formatDate` (DD.MM.YYYY) עוברת מ-`SavedSupplierCard.tsx` לקובץ משותף `src/ui/formatDate.ts`, ומשמשת בשני המקומות. התאריך מוצג לפי השעון המקומי של הדפדפן.

### טקסטים – `shared/i18n/{ru,en,uk}.json`, תחת `results`
| מפתח | ru | en | uk |
|---|---|---|---|
| `searchedAt` | Результаты поиска от {{date}} | Search results from {{date}} | Результати пошуку від {{date}} |
| `searchAgain` | Искать заново | Search again | Шукати знову |

## 6. מה לא משתנה
- ייצוא ל-Excel: משתמש ב-`searchedAt` של התוצאה המוצגת (גם אם הגיעה מהמסד) — זה התאריך הנכון של החיפוש ברשת.
- הסימון `supplierSaved` ב-state מזהה את התוצאות לפי `searchedAt`; עם תוצאה שמורה זה עדיין עקבי (תוצאה חדשה ברשת = `searchedAt` חדש).
- אין ADR חדש: ההחלטות כבר מתועדות ב-ADR-11. אם במהלך הבנייה תתקבל החלטה טכנית חדשה (למשל ההשהיה של מחוון הטעינה), היא תתועד כ-ADR.
- `.env.example` לא משתנה (אין משתנה חדש).

---

## 7. בדיקות בזמן הבנייה (Development בלבד)

כל חיפוש ברשת עולה כסף ב-OpenAI. הבדיקות מתוכננות כך שיהיו בערך 3 חיפושים ברשת בסך הכול.

1. `npm run lint` ו-`npx tsc --noEmit` (או `next build` בלי Migrations: `npx next build`) — בלי שגיאות.
2. **Migration:** `node scripts/migrate.mjs` מול Development. בדיקה דרך Supabase MCP **בפרויקט `suppliers-dev` בלבד**: הטבלה קיימת, `relrowsecurity = true`, אין Policies, ושורת ה-Migration ב-`supabase_migrations.schema_migrations`.
3. **חיפוש ראשון** (חיפוש ברשת): נוספת שורה ל-`search_results`, בלוג `search`.
4. **חיפוש חוזר** של אותו צירוף: חוזר תוך כשנייה, בלוג `search_cached`, בלי `search`. מחוון הטעינה לא מופיע.
5. **ספק שמור בתוצאה שמורה:** שמירת ספק מהתוצאה, ואז חיפוש חוזר — הוא מוצג כ-«Сохранено».
6. **«Искать заново»:** מחוון טעינה מיד, חיפוש ברשת, ו-`searched_at` בשורה מתעדכן (וגם התאריך במסך).
7. **כישלון ברענון:** הרצה נוספת של שרת הפיתוח עם `OPENAI_MODEL` לא תקין במשתני הסביבה של התהליך (בלי לשנות קוד ובלי לגעת ב-`.env`), לחיצה על «Искать заново» → הודעת השגיאה, והשורה בטבלה לא השתנתה (משווים `searched_at` לפני ואחרי). כך אין עלות OpenAI.
8. **תוקף 30 יום:** ב-Development, `update search_results set searched_at = now() - interval '31 days'` לשורה אחת → החיפוש הבא מתבצע ברשת ומחליף אותה.
9. **RLS:** בקשה ל-Data API של פרויקט ה-Development עם ה-Publishable Key (נשלף דרך Supabase MCP, בלי להציג אותו) ל-`/rest/v1/search_results` → לא מחזירה שורות ולא מאפשרת כתיבה.
10. **ממשק:** שלוש השפות, במחשב וברוחב 375px (הכפתור בשורה נפרדת בנייד), כולל תוצאה ריקה.
11. סגירת שרת הפיתוח בסיום, סימון 🟡 ליד M6 ב-MILESTONES.md, בלי commit.

## 8. קבצים

| קובץ | שינוי |
|---|---|
| `supabase/migrations/<ts>_create_search_results.sql` | חדש |
| `shared/schemas/index.ts` | `refresh`, `CachedSearchResponseSchema` |
| `server/db/index.ts` | `getCachedSearch`, `storeSearch` |
| `server/search.ts` | זרימת המטמון, לוגים |
| `src/state/AppStateProvider.tsx` | `refreshSearch`, דגל רענון, ניקוי `refresh` מהבקשה השמורה |
| `src/ui/ResultsView.tsx`, `ResultsView.module.css` | שורת התאריך והכפתור, השהיית מחוון הטעינה |
| `src/ui/formatDate.ts` | חדש (הועבר מ-`SavedSupplierCard.tsx`) |
| `src/ui/SavedSupplierCard.tsx` | שימוש ב-`formatDate` המשותף |
| `shared/i18n/ru.json`, `en.json`, `uk.json` | שני מפתחות חדשים |
| `spec/MILESTONES.md` | 🟡 ליד M6 בסיום הבנייה |
