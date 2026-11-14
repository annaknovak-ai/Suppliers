# Milestone 7 – התחברות עם Google ורשימה אישית (תוכנית)

> מבוסס על MILESTONES.md (M7), PRD F6, Flow 6, FR7.1–FR7.3, FR7.8, מקרי הקצה וטבלת הטקסטים, DESIGN.md (רכיבים משותפים וסעיף 1.0), ARCHITECTURE.md סעיפים 2.1–2.5, 2.7–2.10 ו-ADR-12.

## מטרה
אי אפשר להשתמש באפליקציה בלי התחברות עם Google. כל משתמש רואה, מעדכן, מוחק ומייצא רק את הספקים השמורים שלו. תוצאות החיפוש השמורות (M6) נשארות משותפות לכולם.

## הערה חשובה: M7 נבנית לפני ש-M6 אושרה
- לפי בקשת המשתמשת: מפתח ה-OpenAI של Development לא עובד כרגע, ולכן M6 עדיין 🟡 ולא נבדקה. M7 נבנית מעליה, על הקוד של M6 שכבר נמצא בתיקייה (לא ב-commit).
- **השלכה על הבדיקות:** כל עוד אין מפתח OpenAI תקין, אי אפשר לבדוק חיפוש ברשת. אפשר לבדוק חיפוש רק אם יש תוצאה שמורה ב-`search_results` של Development. סעיף ה-DoD "החיפוש והתוצאות השמורות ממשיכים לעבוד" ייבדק במלואו רק כשהמפתח יגיע. את שמירת הספקים, הרשימה האישית והייצוא אפשר לבדוק על תוצאה שמורה (אם יש), או לסמן כ"לא נבדק" עד שיגיע המפתח.
- **דחיפה:** ה-Migrations של M6 ושל M7 ירוצו על Production יחד, בדחיפה אחת או בשתיים, ולפני כל דחיפה אעצור לאישור (כולל אזהרה שה-Migration של M7 מוחקת את כל הספקים השמורים ב-Production).

---

## 0. הגדרות חשבונות – המשתמשת מבצעת, בהדרכה צעד אחר צעד

לפני הבנייה, או במקביל לה. בלי השלבים האלה אי אפשר להתחבר בפועל. **לעולם לא מדביקים בשיחה Client Secret או מפתח.**

### 0.1 Google Cloud (פעם אחת, לשני הפרויקטים)
1. יוצרים פרויקט ב-Google Cloud Console (למשל `supplier-finder`).
2. **OAuth consent screen** (Google Auth Platform → Branding / Audience):
   - סוג: **External**.
   - שם האפליקציה: Supplier Finder, מייל תמיכה ומייל מפתח – של המשתמשת.
   - הרשאות (Data Access): רק `openid`, `.../auth/userinfo.email`, `.../auth/userinfo.profile`.
   - Audience: לוחצים **Publish app** (מצב In production). בלי זה רק חשבונות מרשימת הבודקים יוכלו להתחבר (ARCHITECTURE 1.3).
3. **OAuth Client** (Clients → Create client): סוג **Web application**. ב-**Authorized redirect URIs** מוסיפים שתי כתובות:
   - `https://<ref-של-suppliers-dev>.supabase.co/auth/v1/callback`
   - `https://<ref-של-suppliers-prod>.supabase.co/auth/v1/callback`
   (את ה-ref רואים בכתובת של כל פרויקט ב-Supabase, או ב-Authentication → Providers → Google, שם מוצגת כתובת ה-Callback המדויקת.)
4. שומרים את ה-Client ID וה-Client Secret – מעתיקים אותם ישירות ל-Supabase (שלב הבא), לא לשיחה.

### 0.2 בכל אחד משני פרויקטי Supabase (`suppliers-dev` ואז `suppliers-prod`)
1. **Authentication → Sign In / Providers:**
   - **Google:** מפעילים ומדביקים את ה-Client ID וה-Client Secret.
   - **Email:** מכבים.
   - **"Allow new users to sign up": מפעילים מחדש.** ב-M4 כיבינו אותו. עכשיו הוא חייב להיות פעיל, אחרת ההתחברות הראשונה של כל משתמש תיכשל (ARCHITECTURE 2.10).
2. **Authentication → URL Configuration:**
   - Development: Site URL ‏`http://localhost:3000`, Redirect URL ‏`http://localhost:3000/auth/callback`.
   - Production: Site URL ‏`https://suppliers-umber-phi.vercel.app`, Redirect URL ‏`https://suppliers-umber-phi.vercel.app/auth/callback`.
3. **Settings → API Keys:** מעתיקים את ה-**Publishable Key** (`sb_publishable_…`):
   - של Development → לשורה `SUPABASE_PUBLISHABLE_KEY=` בקובץ `.env` המקומי (אני מוסיף את השורה ל-`.env.example`, המשתמשת מוסיפה אותה ל-`.env` וממלאת).
   - של Production → משתנה סביבה חדש ב-Vercel, בהיקף Production בלבד. אפשר לעשות זאת לפני הדחיפה של M7.

---

## 1. Migration – שיוך הספקים השמורים למשתמש

קובץ חדש, נוצר עם `npx supabase migration new saved_suppliers_per_user` (חותמת הזמן תהיה אחרי זו של M6):
`supabase/migrations/<timestamp>_saved_suppliers_per_user.sql`

```sql
-- Saved suppliers become personal: each row belongs to one Google user (ARCHITECTURE 2.5, ADR-12).
-- Existing rows have no owner, so they are removed (user's decision). Not backward compatible on purpose.
delete from public.saved_suppliers;

alter table public.saved_suppliers
  add column user_id uuid not null references auth.users (id) on delete cascade;

-- Duplicates are now prevented per user (PRD FR7.2): two users may save the same supplier.
alter table public.saved_suppliers drop constraint saved_suppliers_name_unique;
alter table public.saved_suppliers
  add constraint saved_suppliers_name_unique unique (user_id, city_id, service_id, name_key);

drop index public.saved_suppliers_website_unique;
create unique index saved_suppliers_website_unique
  on public.saved_suppliers (user_id, city_id, service_id, website_domain)
  where website_domain is not null;

drop index public.saved_suppliers_saved_at_idx;
create index saved_suppliers_user_saved_at_idx on public.saved_suppliers (user_id, saved_at desc);
```

- RLS נשאר מופעל בלי Policies (ADR-12). אין שינוי ב-`search_results`.
- **הרצה על Development בלבד:** `node scripts/migrate.mjs` (קורא את `.env`). **ההרצה מוחקת את כל הספקים השמורים ב-Development** – זה חלק מה-DoD וההחלטה ב-ADR-12. אם ה-Migration של M6 עדיין לא רצה על Development, היא תרוץ קודם באותה הרצה.
- Production: לא נוגעים. היא תרוץ שם רק בדחיפה, אחרי אישור מפורש ואזהרה על המחיקה.
- בדיקה אחרי ההרצה: העמודה, האילוצים והאינדקסים החדשים ב-Dashboard של Development, והשורה ב-`supabase_migrations.schema_migrations`.

## 2. תלויות והגדרות

- התקנת **`@supabase/ssr`** בגרסה מדויקת (בלי `^`), עם עדכון `package-lock.json` (ARCHITECTURE 2.11).
- `.env.example`: הוספת `SUPABASE_PUBLISHABLE_KEY=` בקבוצת Supabase, עם הערה שהוא של Development בלבד. **לא מעתיקים שוב ל-`.env`** – המשתמשת מוסיפה את השורה בעצמה.
- אין משתנה עם `NEXT_PUBLIC_`. ה-Publishable Key נקרא רק בשרת.
- לפני כתיבת הקוד: קריאת המדריכים הרלוונטיים ב-`node_modules/next/dist/docs/` (Proxy, Authentication, `cookies`, `redirect`), כי זו גרסת Next.js עם שינויים (AGENTS.md).

## 3. `/server/auth` – זיהוי המשתמש

קובץ חדש `server/auth/index.ts` (`import "server-only"`):
- `createAuthClient()` – `createServerClient` של `@supabase/ssr` עם `SUPABASE_URL` ו-`SUPABASE_PUBLISHABLE_KEY`, ועם `cookies()` של `next/headers` (`getAll` / `setAll`; ב-`setAll` עוטפים ב-`try`, כי ברכיב שרת אי אפשר לכתוב עוגיות – ה-Proxy מחדש אותן ממילא).
- `getUser()` → `{ id, email } | null`, דרך `auth.getUser()` (מאמת מול Supabase). כל שגיאה = לא מחובר.
- `safeNext(value)` – מחזיר רק נתיב פנימי: מתחיל ב-`/`, לא ב-`//` ולא ב-`/\`. אחרת `/`. משמש את `/auth/login`, את `/auth/callback` ואת מסך ההתחברות (ARCHITECTURE 2.3: "רק כתובת פנימית").
- פונקציה נפרדת לשימוש ה-Proxy, שעובדת על עוגיות ה-`NextRequest` וה-`NextResponse` (התבנית הרשמית של `@supabase/ssr` לחידוש Session).

## 4. `proxy.ts` (בשורש הפרויקט)

- בכל בקשה: יוצר Supabase client על עוגיות הבקשה והתשובה, וקורא ל-`auth.getUser()` – זה מחדש את ה-Session ומעדכן את העוגיות.
- **דפים** (לא `/login`, לא `/auth/*`, לא `/api/*`): בלי משתמש → הפניה ל-`/login?next=<pathname+search>`.
- **`/api/*`:** רק חידוש Session, בלי הפניה. ה-Route Handler עצמו מחזיר `401` (סעיף 6).
- **`matcher`** שמוציא קבצים סטטיים: `_next/static`, `_next/image`, `icon.svg`, אייקוני `/public`, ו-**`manifest.webmanifest`**. ה-Manifest חייב להיטען בלי התחברות, אחרת Android לא יציע התקנה (הדפדפן מוריד אותו בלי עוגיות).
- כשמחליפים את התשובה בהפניה, מעתיקים אליה את העוגיות שה-client עדכן, כדי שה-Session המחודש לא יאבד.

## 5. Route Handlers של ההתחברות – `/auth/*`

- **`app/auth/login/route.ts` (GET `?next=`):** `signInWithOAuth({ provider: "google", options: { redirectTo: <origin>/auth/callback?next=<safeNext> } })`, ואז הפניה (302) ל-`data.url`. ה-origin נלקח מכתובת הבקשה, כך שאותו קוד עובד ב-localhost וב-Production. שגיאה → `/login?error=1`.
- **`app/auth/callback/route.ts` (GET `?code=&next=`):** `exchangeCodeForSession(code)` שיוצר את ה-Session בעוגיות, והפניה ל-`safeNext(next)`. אין `code`, יש `error` מ-Google (למשל ביטול), או שההחלפה נכשלה → `/login?error=1` (עם ה-`next` המקורי, כדי שניסיון חוזר יחזיר לאותו דף).
- **`app/auth/logout/route.ts` (POST):** `auth.signOut()` והפניה (303) ל-`/login`.
- **סיכון ידוע:** אם Supabase לא יקבל את `redirectTo` עם `?next=` מול ה-Redirect URL שהוגדר (`.../auth/callback` בלי פרמטרים) ויפנה ל-Site URL במקום, אעביר את `next` בעוגייה קצרת חיים (HttpOnly) במקום בפרמטר, ואתעד זאת כ-ADR. כך לא צריך לשנות את ההגדרות שב-ARCHITECTURE 2.10.

## 6. Route Handlers של `/api` – משתמש ו-`401`

בכל אחד: בתחילת ה-Handler, לפני קריאת הגוף, `const user = await getUser()`; בלי משתמש → `{ error: { code: "unauthorized" } }` עם `401` ו-`Cache-Control: no-store`. פונקציית עזר משותפת אחת (למשל `requireUser()` ב-`/server/auth`) כדי לא לשכפל.

| Route | שינוי |
|---|---|
| `POST /api/search` | `401`, ו-`runSearch(request, user.id, signal)` |
| `POST /api/export` | `401` בלבד (הנתונים מגיעים מהלקוח) |
| `GET/POST /api/saved-suppliers` | `401`, ו-`user.id` לפונקציות ה-DB |
| `PATCH/DELETE /api/saved-suppliers/[id]` | `401`, ו-`user.id`. ספק של משתמש אחר → `404` (אותו קוד כמו "לא קיים") |
| `GET /api/saved-suppliers/export` | `401`, ו-`listSavedFor(user.id, …)` |

## 7. `/server/db` ו-`/server/search.ts`

`server/db/index.ts` – כל הפעולות על `saved_suppliers` מקבלות `userId` ומסננות `.eq("user_id", userId)`:
- `listSaved(userId)`, `listSavedFor(userId, cityId, serviceId)`.
- `insertSaved(userId, search, supplier)` – מכניס `user_id`. `findExisting` (אחרי `23505`) מסונן לפי המשתמש.
- `updateSaved(userId, id, patch)`, `deleteSaved(userId, id)` – תנאי `id` **וגם** `user_id`. שורה של משתמש אחר לא נמצאת → `null` / `false` → `404`.
- `findSavedIds(userId, search, suppliers)` – הסימון `savedId` רק מהספקים של המשתמש (PRD FR7.2).
- `user_id` נוסף ל-`Row` אבל **לא** ל-`SavedSupplier` שנשלח ללקוח (ARCHITECTURE 2.5).
- `getCachedSearch` / `storeSearch` – בלי שינוי (משותפות).

`server/search.ts` – `runSearch(request, userId, cancelSignal)` מעביר את `userId` ל-`markSaved`.

## 8. לקוח

### `src/services/api.ts` – תשובת `401`
- פונקציית עזר אחת שכל הקריאות עוברות דרכה: בתשובת `401` → `window.location.assign("/login?next=" + encodeURIComponent(pathname + search))`, וזריקת `ApiRequestError(401)` (ה-UI לא מציג שגיאה, כי הדף עובר). חל על החיפוש, השמירה, הרשימה, העדכון, המחיקה ושני הייצואים (מקרה הקצה "ההתחברות פגה בזמן העבודה").

### `src/state/browserMemory.ts`
- `clearSearch()` – מוחק את מפתח החיפוש מ-`sessionStorage` (בתוך `try`). השפה ב-`localStorage` נשארת – היא העדפה של המכשיר.

### אזור המשתמש בכותרת העליונה
- `app/layout.tsx` מעביר ל-`Header` רכיב שרת `UserArea` בתוך `<Suspense>` (קורא ל-`getUser()`; עם `cacheComponents` קריאת עוגיות חייבת להיות בתוך Suspense). כך המייל מגיע לכותרת בלי Endpoint נוסף ובלי מפתח בלקוח.
- `UserArea`: המייל (Caption, Muted, `text-overflow: ellipsis`, עם `title` למייל המלא) וכפתור Ghost קומפקטי «Выйти» (`SignOutButton`, רכיב לקוח).
- `SignOutButton`: `<form method="post" action="/auth/logout">`; ב-`onSubmit` קורא ל-`clearSearch()` לפני השליחה. השליחה היא ניווט מלא, ולכן גם המצב שבזיכרון (Context) מתאפס – משתמש אחר באותו דפדפן לא יראה את החיפוש הקודם (מקרה קצה ב-PRD).
- `Header`: ב-`/login` מוצגים רק ה-Wordmark ובורר השפות (בלי ניווט ובלי אזור משתמש).
- **CSS (DESIGN, רכיבים משותפים):** ב-Desktop – אזור חדש `user` מימין לבורר השפות. בנייד (`max-width: 767px`) – המייל מוסתר, ו-«Выйти» עובר לשורת הניווט, מיושר לימין (grid-areas: `"brand lang" / "nav user"`). בדיקה ברוחב 375px וגם ב-320px (ה-commit האחרון התאים את הכותרת לטלפונים צרים מאוד – לא לשבור את זה).

### מסך ההתחברות – `app/login/page.tsx` + `page.module.css` (DESIGN 1.0)
- רכיב לקוח בתוך `<Suspense>` (קורא `next` ו-`error` עם `useSearchParams`, כמו מסך הספקים השמורים).
- כרטיס לבן ממורכז, עד 400px (ברוחב מלא בנייד), קו מתאר דק, פינות 4px:
  - `BrandMark` בגודל בינוני, ממורכז.
  - H1 «Supplier Finder» ב-Italiana (`lang="en"`).
  - שורת הסבר Muted ממורכזת: `t("login.hint")`.
  - כשיש `error=1`: `Banner variant="error"` עם `t("login.error")`, מעל הכפתור.
  - כפתור Primary ברוחב מלא: קישור ל-`/auth/login?next=<next>`, עם סמל Google משמאל לטקסט `t("login.button")`. ניווט מלא (`<a>` רגיל, לא `Link`), כי היעד הוא Route Handler שמפנה ל-Google.
- `SearchIllustration` בתחתית, כמו במסך Поиск.
- סמל Google חדש ב-`src/ui/icons` (ה-"G" הרב-צבעוני הרשמי, `aria-hidden`).
- אם `Button` לא תומך בקישור – מוסיפים לו אפשרות `href` (או מחלקת CSS משותפת), בלי לשכפל את העיצוב.

### טקסטים – `shared/i18n/{ru,en,uk}.json`
מטבלת הטקסטים ב-PRD: `login.hint`, `login.button`, `login.error`, `auth.signOut` («Выйти» / «Sign out» / «Вийти»). שם האפליקציה «Supplier Finder» כבר קיים.

## 8א. דף מדיניות הפרטיות – `/privacy` (נבנה ראשון)
- `app/privacy/page.tsx` + `page.module.css` לפי DESIGN 1.5: H1, תאריך עדכון, פתיחה, סעיפים (נתונים מ-Google, ספקים שמורים, שימוש בנתונים, חיפוש, אחסון ועוגיות, מחיקה, יצירת קשר עם `mailto:`). הטקסט ב-`privacy.*` בקובצי התרגום.
- `Header`: ב-`/login` וב-`/privacy` רק Wordmark ובורר שפות.
- `proxy.ts` (סעיף 4) מחריג את `/privacy`. במסך ההתחברות קישור «Политика конфиденциальности» מתחת לכפתור.
- ב-Google Cloud → Branding: דף הבית `https://suppliers-umber-phi.vercel.app`, מדיניות הפרטיות `.../privacy`, ו-`suppliers-umber-phi.vercel.app` ב-Authorized domains.

## 9. `DEMO.md`
- שלב פתיחה חדש: התחברות עם Google בכתובת ה-Production.
- הסבר קצר: כל משתמש רואה רק את הרשימה שלו; התוצאות השמורות של החיפוש משותפות לכולם.
- הוכחת השמירה ב-Supabase: השורה ב-`saved_suppliers` כוללת עכשיו `user_id`, והמשתמש מופיע ב-Authentication → Users.
- תזכורת: נתוני ההדגמה הישנים נמחקים בדחיפה של M7, וצריך ליצור אותם מחדש בחשבון של המשתמשת.

## 10. ADR
- אם יתקבלו החלטות טכניות משמעותיות בזמן הבנייה (למשל העברת `next` בעוגייה, או האופן שבו המייל מגיע לכותרת), הן יתועדו כ-ADR-13 ואילך ב-ARCHITECTURE.md.

---

## 11. בדיקות שלי בזמן הבנייה

אני לא מתחבר בעצמי עם חשבון Google (אסור לי להזין סיסמאות). לכן:

**אני בודק:**
- `npm run lint` ו-`npm run build` עוברים.
- ה-Migration רצה על Development: עמודה, אילוצים, אינדקסים, רישום ב-`schema_migrations`, והטבלה ריקה.
- בלי התחברות: `/`, `/saved` ו-`/saved?city=…` מפנים ל-`/login?next=…` עם הכתובת הנכונה.
- כל ה-Endpoints של `/api` (7 שילובים של Route ו-Method) מחזירים `401` בלי עוגייה.
- `/manifest.webmanifest` והאייקונים נטענים בלי התחברות.
- `/auth/login` מפנה לכתובת ההתחברות של Supabase/Google (בודקים את ה-Location בלבד, בלי להתחבר).
- `/auth/callback` בלי `code` או עם `error` → `/login?error=1`. `next` חיצוני (`//evil.com`, `https://…`) מוחלף ב-`/`.
- מסך ההתחברות וההודעה על שגיאה: בשלוש השפות, ב-Desktop וברוחב 375px, מול DESIGN 1.0.
- גישה ישירה ל-`saved_suppliers` עם Publishable Key נחסמת (RLS), ואין מפתח Supabase ב-Bundle של הלקוח.

**המשתמשת בודקת ("הרץ כדי שאבדוק"):**
- התחברות אמיתית עם Google, החזרה לדף המקורי, הופעה ב-Authentication → Users, ונשארת מחוברת אחרי ריענון.
- ביטול בדף של Google → הודעת השגיאה.
- המייל ו-«Выйти» בכותרת; יציאה מחזירה ל-`/login` ומוחקת את זיכרון החיפוש.
- שני חשבונות Google: כל אחד רואה ומייצא רק את שלו, שניהם יכולים לשמור את אותו ספק.
- `404` לעדכון או מחיקה של ספק של משתמש אחר – אני יכול לבדוק זאת מול ה-DB אחרי שיהיו שני משתמשים אמיתיים (בעזרת ה-id מה-Dashboard), בלי להתחבר בעצמי, אם המשתמשת תאפשר.
- חיפוש ותוצאות שמורות עם «Сохранено» לפי המשתמש – רק כשיגיע מפתח OpenAI תקין (או על תוצאה שכבר שמורה).

**אחרי הדחיפה (לא בשלב הבנייה):** התחברות בכתובת ה-Production ומהאפליקציה המותקנת ב-Android, ויצירה מחדש של נתוני ההדגמה.

## 12. סדר העבודה בבנייה
1. הגדרות החשבונות (סעיף 0) – המשתמשת, בהדרכה. `SUPABASE_PUBLISHABLE_KEY` ב-`.env`.
2. `@supabase/ssr`, `.env.example`.
3. Migration והרצה על Development.
4. `/server/auth`, `proxy.ts`, `/auth/*`.
5. `/server/db`, `/server/search.ts`, כל ה-Route Handlers של `/api`.
6. לקוח: `api.ts` (401), `browserMemory`, אזור המשתמש בכותרת, מסך ההתחברות, טקסטים.
7. `DEMO.md`, ADR אם צריך.
8. בדיקות (סעיף 11), תיקונים, סימון 🟡 ב-MILESTONES.md, וסגירת ההרצה.
