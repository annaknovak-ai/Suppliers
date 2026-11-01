# תוכנית – Milestone 4: ספקים שמורים

> מבוסס על MILESTONES.md (M4), PRD (F6, F7, Flow 4–5, טבלת הטקסטים, מקרי קצה), ARCHITECTURE.md (2.2, 2.3, 2.4, 2.5, 2.7, 2.8 Flow 4–5, 2.9, 2.10, 2.11) ו-DESIGN.md (1.2, 1.3, 2.3, 2.4) וה-Mockups. הקוד של M1–M3 הוא נקודת המוצא.
> **לא בונים ב-M4:** הרצת ה-Migration על Production (קורית רק בדחיפה, אחרי אישור מפורש), נתוני הדגמה ו-`DEMO.md` (M5), ייצוא של הרשימה השמורה, עדכון אוטומטי של ספקים (`last_checked_at` נוצר אבל לא בשימוש).

---

## 1. מטרה ותוצר

בכל כרטיס במסך התוצאות יש כפתור «Сохранить». לחיצה שומרת את הספק ב-Supabase עם הסטטוס «Новый», והכפתור מתחלף ל-«Сохранено». במסך «Сохранённые поставщики» מוצגת הרשימה המשותפת מה-Database, מהחדש לישן, עם «Всего: N». לכל ספק אפשר לשנות סטטוס (נשמר מיד), לכתוב הערה ולשמור אותה, ולמחוק אחרי חלון אישור. כל השינויים נשארים אחרי ריענון ומשותפים לכל המכשירים.

---

## 2. הקמה בהדרכת המשתמשת (לפני כתיבת הקוד שתלוי ב-Database)

אני עוצר ומדריך צעד אחר צעד, בשפה פשוטה. **לא מבקשים להדביק בשיחה אף מפתח, סיסמה או מחרוזת חיבור.**

1. **Development:** Organization בתוכנית Free ← פרויקט באזור Frankfurt (`eu-central-1`) ← סיסמת Database חזקה (נשמרת אצל המשתמשת).
2. **Production:** פרויקט נוסף באותו Organization, באזור Frankfurt (עודכן: ARCHITECTURE.md ADR-8, פרויקט לימודי).
3. **בכל אחד מהשניים:**
   - Settings → API Keys: יצירת Secret Key ייעודי.
   - Authentication → Sign In / Providers: כיבוי "Allow new users to sign up".
   - Connect → Session Pooler: העתקת מחרוזת החיבור (עם הסיסמה).
4. **ערכי Development** – המשתמשת מוסיפה ל-`.env` המקומי: `SUPABASE_URL`, `SUPABASE_SECRET_KEY`, `SUPABASE_DB_URL`.
5. **ערכי Production** – המשתמשת מוסיפה ב-Vercel → Settings → Environment Variables, בהיקף **Production בלבד**, את אותם שלושה שמות.
6. **בדיקה:** המשתמשת מאשרת שב-`.env` המקומי יש רק ערכי Development. אני לא קורא את `.env`; אני בודק רק שהאפליקציה מתחברת לפרויקט ה-Development (לפי שם הפרויקט ב-Dashboard שבו מופיעה הטבלה).
7. **כלל WAF** (אפשר לעשות גם בסוף הבנייה): Vercel → Firewall → Rate Limiting – כלל חדש על נתיב שמתחיל ב-`/api/saved-suppliers`, ‏60 בקשות ל-IP בדקה, פעולה: חסימה (`429`). נבדק בפועל רק אחרי הדחיפה.

---

## 3. תלות חדשה

- `@supabase/supabase-js` – גרסה יציבה עדכנית, מדויקת, ב-`dependencies`. בשימוש בשרת בלבד (`/server/db`).
- `supabase` (CLI) – גרסה מדויקת ב-`devDependencies`, כדי ש-`npx supabase` ב-`scripts/migrate.mjs` ישתמש בגרסה קבועה גם מקומית וגם ב-Build של Vercel (Vercel מתקין devDependencies).
- לפני הקוד: לבדוק ב-`node_modules/next/dist/docs/` את החתימה של Route Handler דינמי (`params` כ-Promise) ואיך מוודאים ש-`GET` לא נשמר כסטטי כש-`cacheComponents` פעיל (למשל `await connection()` או קריאה מה-request).

---

## 4. מבנה קבצים – מה נוצר ומה משתנה

```
supabase/
  config.toml                              חדש – npx supabase init (בלי Docker; משמש רק ל-CLI)
  migrations/<timestamp>_create_saved_suppliers.sql   חדש – npx supabase migration new
app/
  api/saved-suppliers/route.ts             חדש – GET, POST
  api/saved-suppliers/[id]/route.ts        חדש – PATCH, DELETE
  saved/page.tsx                           שינוי – רשימה אמיתית
  saved/page.module.css                    שינוי
server/
  db/index.ts                              חדש – Supabase client + פעולות על saved_suppliers
  search.ts                                שינוי – סימון savedId
shared/
  schemas/index.ts                         שינוי – SavedSupplier, SaveRequest, UpdateRequest, סטטוסים
src/
  services/api.ts                          שינוי – 4 פונקציות חדשות
  state/AppStateProvider.tsx               שינוי – פעולה "supplierSaved"
  ui/SupplierDetails.tsx (+ .module.css)   חדש – גוף הכרטיס המשותף (חילוץ מ-SupplierCard)
  ui/SupplierCard.tsx                      שינוי – משתמש ב-SupplierDetails + כפתור שמירה
  ui/ResultsView.tsx                       שינוי – key לפי שם+אתר (קיים), העברת request לכרטיס
  ui/SavedSupplierCard.tsx (+ .module.css) חדש – אזור פרטים + אזור עריכה
  ui/StatusChip.tsx (+ .module.css)        חדש – צ'יפ לארבעת הסטטוסים
  ui/ConfirmDialog.tsx (+ .module.css)     חדש – <dialog> לאישור מחיקה
shared/i18n/ru|en|uk.json                  בדיקה – מפתחות saved.* כבר קיימים מ-M1; משלימים רק מה שחסר
.env.example                               שינוי – 3 משתני Supabase
```

---

## 5. Database – ה-Migration הראשונה

קובץ SQL אחד, לפי ARCHITECTURE 2.5:

- `create table public.saved_suppliers` עם כל העמודות שבטבלה: `id uuid default gen_random_uuid() primary key`, `country_id` (`check in ('UA','MD')`), `city_id`, `service_id`, `name`, `name_key`, `website_domain`, `description`, `address`, `phone`, `email`, `website`, `registration_or_license_number`, `years_active int`, `business_clients_count int`, `business_client_examples jsonb not null default '[]'`, `criteria jsonb not null`, `meets_all_criteria boolean not null`, `sources jsonb not null default '[]'`, `status text not null default 'new' check (status in ('new','contacted','approved','not_suitable'))`, `note text not null default '' check (char_length(note) <= 1000)`, `saved_at`, `updated_at` (`timestamptz not null default now()`), `last_checked_at timestamptz`.
- `unique (city_id, service_id, name_key)`.
- `create unique index … on saved_suppliers (city_id, service_id, website_domain) where website_domain is not null`.
- `create index … on saved_suppliers (saved_at desc)`.
- פונקציית Trigger ‏`set_updated_at()` (`set search_path = ''`) + `before update` Trigger.
- `alter table saved_suppliers enable row level security;` – בלי Policies.

הרצה: `node scripts/migrate.mjs` מקומית (מול Development מ-`.env`). אין עריכה של הקובץ אחרי שהורץ.

---

## 6. סכמות (`/shared/schemas`)

- `SAVED_STATUSES = ["new","contacted","approved","not_suitable"]`, `SavedStatus`.
- `SavedSupplierSchema` = `SupplierSchema` בלי `savedId` + `id`, `countryId`, `cityId`, `serviceId`, `status`, `note` (עד 1000), `savedAt`, `updatedAt`.
- `SaveSupplierRequestSchema = { search: SearchRequestSchema, supplier: SupplierSchema }`.
- `UpdateSavedSupplierRequestSchema` – `strict` עם `status?` ו-`note?` (`max(1000)`), ולפחות אחד מהם (`refine`). שדה אחר → `400`.
- `SavedSuppliersListSchema = { items, total }`.

---

## 7. צד השרת

### `/server/db` (מסומן `server-only`)
- Client אחד (`createClient(SUPABASE_URL, SUPABASE_SECRET_KEY, { auth: { persistSession: false } })`), נוצר בעצלות. חסר משתנה → שגיאה (שהופכת ל-`500` / ל-`savedId: null` בחיפוש).
- המרה בין שורה (snake_case) ל-`SavedSupplier` (camelCase), במקום אחד.
- `listSaved()` – `order saved_at desc`.
- `insertSaved(search, supplier)` – מחשב `name_key` (`nameKey`) ו-`website_domain` (`websiteDomain`) מ-`/shared/normalize`, מחשב מחדש `meets_all_criteria` מה-criteria, `status='new'`, `note=''`. כשל `23505` → מחפש את השורה הקיימת (אותה עיר ותחום, ו-`name_key` שווה או `website_domain` שווה) ומחזיר `{ conflict: true, existing }`.
- `updateSaved(id, patch)` – מחזיר `null` כשאין שורה (→ `404`).
- `deleteSaved(id)` – מחזיר `false` כשאין שורה (→ `404`).
- `findSavedIds(cityId, serviceId, suppliers)` – שאילתה אחת: `city_id`, `service_id`, ו-`name_key in (…)` או `website_domain in (…)`. מחזיר לכל ספק את ה-`id` התואם או `null`.

### Route Handlers
- כמו בקיימים: `error(code, status)` אחיד `{ error: { code } }`, `Cache-Control: no-store` בכל תשובה, בלי `runtime` (ADR-5).
- `GET /api/saved-suppliers` → `{ items, total }` / `500`. מוודא שהנתיב דינמי (סעיף 3).
- `POST /api/saved-suppliers` → ולידציה + `isValidSelection` → `201` עם השורה, או `409` עם הקיימת. `400` לקלט לא תקין.
- `PATCH /api/saved-suppliers/[id]` → `id` שאינו uuid → `404`; גוף לא תקין → `400`; `200` עם השורה המעודכנת.
- `DELETE /api/saved-suppliers/[id]` → `204` / `404`.
- כל שגיאת Database נרשמת בלוג (`event: "db_failed"`) בלי פרטי חיבור.

### `server/search.ts`
- אחרי `applyRules`: `findSavedIds` עטוף ב-`try/catch`. בכשל: לוג אזהרה, וכל `savedId` נשאר `null` – החיפוש לא נכשל.

---

## 8. צד הלקוח

### `src/services/api.ts`
`listSavedSuppliers()`, `saveSupplier(search, supplier)` (מחזיר `{ saved, alreadySaved }`; `201` ו-`409` נחשבים הצלחה), `updateSavedSupplier(id, patch)`, `deleteSavedSupplier(id)` (`404` נחשב הצלחה). כולן עם `cache: "no-store"` ו-Timeout של 15 שניות (`AbortSignal.timeout`). שגיאה זורקת `ApiRequestError` עם הסטטוס.

### מצב (`AppStateProvider`)
- פעולה חדשה `supplierSaved({ index, savedId })` – מעדכנת את `savedId` בתוצאות שב-Context, כך שהכפתור נשאר «Сохранено» גם אחרי מעבר בין המסכים.
- רשימת הספקים השמורים **לא** נשמרת ב-Context: נטענת מחדש בכל כניסה למסך (ARCHITECTURE 2.3).

### `SupplierDetails` (חילוץ)
כל מה שמוצג היום בגוף `SupplierCard` (תיאור, צ'יפים, עובדות, פרטי קשר, «Источники (N)» והרשימה הנפתחת) עובר לרכיב משותף, שמקבל גם שורת מטא-נתונים אופציונלית. כך שני סוגי הכרטיסים נראים אותו דבר בלי שכפול קוד.

### `SupplierCard` – כפתור השמירה (DESIGN 1.2)
- ראש הכרטיס: שם משמאל; מימין התג «Соответствует не всем условиям» (אם צריך) ואחריו הכפתור.
- `savedId === null` → «Сохранить» (Primary, קומפקטי, אייקון סימנייה). בזמן השמירה מושבת.
- `savedId` קיים → «Сохранено» (וריאנט `saved`, אייקון ✓, `disabled`).
- כשל → הכפתור חוזר ל-«Сохранить», ובכרטיס מוצג באנר השגיאה «Не удалось сохранить изменения. Попробуйте ещё раз.» (ראו שאלה 1).

### מסך `/saved`
- בטעינה: פס התקדמות (ראו שאלה 2). כשל → באנר שגיאה «Не удалось загрузить список…» עם «Повторить» שטוען שוב.
- כותרת H2 «Сохранённые поставщики» + «Всего: N» (מתעדכן אחרי מחיקה).
- רשימה ריקה → `EmptyState` עם «Нет сохранённых поставщиков».
- באנר השגיאה של שמירה שנכשלה מוצג בראש הכרטיס שבו נכשלה הפעולה.

### `SavedSupplierCard` (DESIGN 1.3, Mockups)
- **אזור פרטים (רחב, משמאל):** שם (H3); מטא «Страна · Город · Вид услуги · Сохранено: ДД.ММ.ГГГГ» (שמות מהקטלוג לפי שפת הממשק; התאריך בפורמט `dd.mm.yyyy` בכל השפות); ואחריו `SupplierDetails`.
- **אזור עריכה (צר, מימין, רוחב קבוע, קו אנכי Line):**
  - «Статус»: `<select>` עם ארבעת הסטטוסים, ו-`StatusChip` של הסטטוס הנוכחי ליד השדה (ADR-3). שינוי → `PATCH` מיד; בכשל הערך הקודם חוזר + הודעת שגיאה.
  - «Заметка»: `<textarea maxLength={1000}>` עם Placeholder, ומונה «N / 1000» מיושר לימין.
  - כפתורים: «Сохранить заметку» (Secondary, קומפקטי) ו-«Удалить» (Ghost, אייקון פח). אחרי שמירה מוצלחת – «Заметка сохранена» ליד הכפתור (ראו שאלה 3).
- **מחיקה:** `ConfirmDialog` → «Отмена» / «Удалить». הכרטיס יורד רק אחרי `204` (או `404`).
- **`PATCH` עם `404`:** הודעת השגיאה + טעינה מחדש של כל הרשימה.
- **שני משתמשים מעדכנים:** אחרי `PATCH` מוצלח הכרטיס מתעדכן מהשורה שהשרת החזיר.
- **מובייל (<768px):** שני האזורים בעמודה אחת, אזור העריכה מתחת לפרטים עם קו מפריד אופקי.

### `StatusChip` (DESIGN 2.3)
`new` – לבן עם קו וטקסט Navy; `contacted` – Navy 100 / Navy; `approved` – Forest Green / Ivory; `not_suitable` – Ivory 200, קו Line strong, טקסט Muted. טקסט תמיד מוצג (לא רק צבע).

### `ConfirmDialog` (DESIGN 2.3, ARCHITECTURE 2.11)
`<dialog>` עם `showModal()`, רקע לבן, פינות 4px, צל Overlay. שאלה ב-SemiBold, כפתורים מיושרים לימין: «Отмена» (Secondary) ואז «Удалить» (Destructive, אייקון פח). הפוקוס הראשוני על «Отмена», Escape סוגר.

---

## 9. i18n

כל טקסטי `saved.*` ו-`supplier.save/saved` כבר קיימים בשלוש השפות מ-M1. בבנייה רק מוודאים שאין מפתח חסר; טקסט חדש (אם יידרש, למשל מונה התווים) נוסף לשלוש השפות.

---

## 10. משתני סביבה

`.env.example` מקבל: `SUPABASE_URL=`, `SUPABASE_SECRET_KEY=`, `SUPABASE_DB_URL=` (עם הערה: ערכי Development בלבד). אני לא מעתיק שוב ל-`.env` (הוא כבר קיים) – אני אומר למשתמשת להוסיף את שלושת השמות עם הערכים שלה.

---

## 11. בדיקות שאני מריץ בסוף הבנייה

1. `node scripts/migrate.mjs` – מריץ את ה-Migration על Development בלבד. הרצה שנייה לא עושה כלום.
2. אימות מבנה ב-Development: הטבלה, האילוצים, האינדקסים, ה-Trigger וה-RLS, והרישום ב-`supabase_migrations.schema_migrations`. (אם כלי ה-Supabase מחובר – רק מול פרויקט ה-Development; אחרת המשתמשת מראה לי ב-Dashboard.)
3. API עם `curl` מול השרת המקומי: `GET` ריק; `POST` → `201`; אותו `POST` שוב → `409`; אותו אתר עם שם אחר → `409`; `PATCH status` → `200` ו-`updated_at` משתנה; `PATCH` עם הערה של 1001 תווים → `400`; `PATCH` עם שדה לא מותר → `400`; `PATCH`/`DELETE` ל-id לא קיים → `404`; `DELETE` → `204`; `POST` עם קטלוג לא תקין → `400`.
4. RLS: בדיקה שהתפקיד `anon` (כמו גישה עם Publishable Key) לא רואה שורות ולא יכול להכניס.
5. דפדפן (Preview): חיפוש אמיתי ← «Сохранить» ← «Сохранено» ← מעבר ל-`/saved` ← שינוי סטטוס, הערה, מחיקה עם אישור ← ריענון ← המצב נשמר. חיפוש חוזר מציג «Сохранено». שלוש שפות, 375px ו-Desktop.
6. כשלים: חסימת הבקשות בדפדפן (Offline) → הודעת השגיאה והערך חוזר; עדכון של ספק שנמחק בלשונית אחרת → שגיאה וטעינה מחדש.
7. חיפוש כש-`SUPABASE_URL` שגוי זמנית (בהרצת בדיקה בלבד, דרך משתנה בהרצה – בלי לגעת ב-`.env`) → החיפוש עובד, `savedId` הוא `null`.
8. אין `sb_secret`/`SUPABASE` ב-Bundle של הלקוח (חיפוש ב-`.next/static`).
9. `npm run lint` ו-`npm run build`.
10. בסוף: מחיקת נתוני הבדיקה שלי מטבלת ה-Development (אחרי שאני שואל), סגירת השרת, סימון 🟡.

---

## 12. Definition of Done – איך כל סעיף נבדק

| סעיף | איך נבדק |
|---|---|
| שני פרויקטים, ערכים בהיקפים הנכונים | המשתמשת מאשרת לפי ההדרכה (שלב 2). ערכי Production לא במחשב ולא ב-Repository |
| Migration רצה על Development | בדיקות 1–2 |
| Migration לא רצה על Production | לא מריצים אותה. בדחיפה אעצור לאישור מפורש, ואחריה נבדוק Build, טבלה ו-RLS ב-Production |
| שמירה → «Новый», «Сохранено», גם בחיפוש חוזר | בדיקה 5 |
| אין כפילות (שם או אתר) | בדיקה 3 |
| סטטוס, הערה, מחיקה נשמרים אחרי ריענון | בדיקה 5 |
| שינוי במכשיר אחד נראה באחר | שתי לשוניות / דפדפנים מול אותו שרת; ב-Android אחרי הדחיפה |
| הערה עד 1,000 תווים, בממשק וב-DB | `maxLength` + מונה; בדיקה 3 (`400`) + `check` ב-DB |
| כשל שמירה; עדכון ספק שנמחק | בדיקה 6 |
| RLS ואין מפתח בקוד הלקוח | בדיקות 4 ו-8 |
| תאימות ל-Mockups, מצב ריק, חלון אישור, 3 שפות, 375px | בדיקה 5 + צילומי מסך |
| כלל WAF | מוגדר בהדרכה; `429` נבדק רק ב-Production אחרי הדחיפה |

---

## 13. החלטות פרשנות – אושרו על ידי המשתמשת (כל ארבע ההצעות)

1. **איפה מוצגת הודעת "שמירה נכשלה"?** ה-spec מגדיר את הטקסט אבל לא את המיקום. הצעה: בתוך הכרטיס שבו הפעולה נכשלה (באנר כהה קטן), כדי שיהיה ברור לאיזה ספק זה שייך.
2. **מצב טעינה של הרשימה השמורה** לא מוגדר. הצעה: פס ההתקדמות הירוק הקיים, בלי טקסט.
3. **«Заметка сохранена»** – הצעה: מוצג אחרי השמירה ונעלם ברגע שמתחילים לערוך את ההערה שוב.
4. **ספק שנמחק מהרשימה אחרי שחיפשתי** – במסך התוצאות שכבר מוצג הוא יישאר «Сохранено» עד החיפוש הבא. הצעה: להשאיר כך (פשוט; בחיפוש הבא הסימון מתעדכן מה-Database).

---

## 14. שינוי במהלך הבדיקה – סינון הרשימה לפי עיר ותחום

לבקשת המשתמשת (PRD FR7.3 עודכן, ARCHITECTURE.md ADR-7):
- במסך `/saved` נוספה שורת סינון (`src/ui/SavedFilter.tsx`): מדינה, עיר ותחום שירות, בלי כפתור. שינוי מדינה מאפס את העיר.
- הבחירה נשמרת בכתובת הדף (`?country=&city=&service=`), והיא מקור האמת היחיד. הקישור «Сохранённые поставщики» ב-Header נבנה מהבחירה בטופס החיפוש, או מהחיפוש האחרון.
- הסינון נעשה בלקוח; ה-API וה-Database לא השתנו. «Всего: N» סופר רק את הספקים שמוצגים.
- כל עוד לא נבחרו עיר ותחום מוצג מצב ריק עם «Выберите город и вид услуги» (מפתח `saved.choose` בשלוש השפות).

## 15. תוספת אחרי אישור M4 – ייצוא הרשימה השמורה ל-Excel

לבקשת המשתמשת (PRD FR7.10, ARCHITECTURE.md ADR-9):
- `GET /api/saved-suppliers/export?city=&service=&lang=` קורא מה-Database את הספקים של העיר והתחום (`listSavedFor` ב-`/server/db`) ויוצר xlsx (`buildSavedSuppliersWorkbook` ב-`/server/excel`). קלט לא תקין או רשימה ריקה מחזירים `400`.
- בראש הגיליון תאריך הייצוא; בסוף כל שורה הסטטוס, ההערה ותאריך השמירה. מפתחות חדשים: `excel.exportDate`, `excel.columns.status/note/savedAt` בשלוש השפות.
- שם הקובץ `saved_suppliers_<country>_<city>_<service>_<date>.xlsx`; הלקוח לוקח אותו מ-`Content-Disposition` ומוסר את הקובץ עם `deliverFile`.
- הכפתור בשורת הכותרת של `/saved`, רק כשמוצג לפחות ספק אחד; כשל מציג את באנר השגיאה של הייצוא.
