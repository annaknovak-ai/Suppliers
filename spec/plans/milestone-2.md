# תוכנית – Milestone 2: חיפוש ספקים מקצה לקצה

> מבוסס על MILESTONES.md (M2), PRD (F2, F3, Flow 1, Flow 3, מקרי קצה), ARCHITECTURE.md (2.3–2.7, 2.9–2.11) ו-DESIGN.md (1.2, 2.3). הקוד של M1 הוא נקודת המוצא.
> **עדכון:** מנוע החיפוש הוחלף מ-Claude ל-OpenAI GPT לפי החלטת המשתמשת (ARCHITECTURE.md, ADR-6). הסעיפים 2, 3, 4 ו-7 עודכנו בהתאם; שאר התוכנית (כללי העסק, הממשק, המצבים) לא השתנתה וכבר נבנתה ונבדקה.
> **לא בונים ב-M2:** כפתור Сохранить / Сохранено, סימון `savedId` מול Database (M4), כפתור Экспорт в Excel ו-`/api/export` (M3). השדה `savedId` קיים בסכמה ומוחזר תמיד כ-`null`.

---

## 1. מטרה ותוצר

המשתמש בוחר מדינה, עיר ותחום, לוחץ Найти, ומקבל עד 5 ספקים אמיתיים מהרשת, עם סטטוס לכל תנאי סף, קישורים למקורות ופרטי קשר פעילים. כל מצבי המסך (טעינה, פחות מ-5, לא נמצאו, שגיאה) עובדים בשלוש השפות.

---

## 2. הקמה בהדרכת המשתמש (לפני הבנייה / במהלכה)

המשתמש מבצע בעצמו, לפי הדרכה צעד אחר צעד בשפה פשוטה. **לעולם לא מבקשים להדביק מפתח בשיחה.**

1. **חשבון OpenAI** ב-OpenAI Platform, עם אמצעי תשלום.
2. **שני Projects:** `dev` ו-`prod`. בכל אחד: יצירת API Key ותקרת הוצאה חודשית (Budget). סכום התקרה – החלטת המשתמש (הצעה: 20$ ל-`dev`).
3. **קובץ `.env.example`** (אני יוצר) עם השמות בלבד: `OPENAI_API_KEY`, `OPENAI_MODEL`, `OPENAI_REASONING_EFFORT`, `SEARCH_MAX_TOOL_CALLS` (ו-`SUPABASE_*` מוצגים רק ב-M4). אני מעתיק אותו פעם אחת ל-`.env`; המשתמש ממלא את ערכי `dev` (`gpt-5.5`, `low`, `8`, והמפתח של ה-Project ‏`dev`). קובץ `.env.example` מתעדכן לשמות החדשים, והמשתמשת מעדכנת את `.env` בעצמה. אני לא קורא את `.env`.
4. **Vercel → Settings → Environment Variables**, היקף Production בלבד: אותם ארבעה משתנים עם מפתח `prod`. (אפשר לעשות לפני הדחיפה של M2.)
5. **WAF Rate Limiting** (אחרי הדחיפה, ב-Vercel → Firewall): כלל על הנתיב `/api/search`, ‏10 בקשות ל-IP בחלון של 10 דקות, פעולה: Rate limit (מחזיר `429`).

אם בזמן הבנייה אין עדיין מפתח ב-`.env` — אני בונה ובודק את כל מה שאפשר עם נתוני דמה (ראו סעיף 11), ועוצר לפני הבדיקות האמיתיות.

---

## 3. תלויות חדשות (גרסאות מדויקות ב-`package.json`)

- `openai` – הגרסה היציבה העדכנית (במקום `@anthropic-ai/sdk`, שמוסר מ-`package.json`).
- `zod` – הגרסה היציבה העדכנית.

לפני כתיבת הקוד: לבדוק בתיעוד העדכני של OpenAI ובטיפוסים של ה-SDK המותקן את: `responses.create`, הכלי `web_search` ו-`user_location`, `max_tool_calls`, `include: ["web_search_call.action.sources"]`, `text.format` מסוג `json_schema` עם `strict`, `reasoning.effort`, מבנה פריטי `web_search_call` והערות `url_citation`, ושמות שדות ה-`usage`. אם `json_schema` לא עובד יחד עם `web_search` — משתמשים ב-Function Tool ‏`submit_suppliers` עם `strict: true` (ARCHITECTURE 2.6). אם משהו אחר מה-ARCHITECTURE לא קיים או שונה ב-API — עוצרים ומדווחים, לא ממציאים חלופה.

---

## 4. מבנה קבצים – מה נוצר ומה משתנה

```
app/
  api/search/route.ts            חדש – Route Handler
  page.tsx                       שינוי – טופס בלי תוצאות / תוצאות
  page.module.css                שינוי – פריסת מסך התוצאות
shared/
  catalog/index.ts               שינוי – searchLanguages, localNames, searchTerms
  schemas/index.ts               חדש – Zod: SearchRequest, Supplier, SearchResponse, AI output
  normalize.ts                   חדש – nameKey(), websiteDomain(), safeHttpUrl()
  i18n/{ru,en,uk}.json           שינוי – מפתחות שחסרים (סעיף 9)
server/
  ai/client.ts                   חדש – OpenAI client + קריאה ל-Responses API (מחליף את server/claude/client.ts)
  ai/prompt.ts                   חדש – הוראות קבועות + הודעת משתמש (מחליף את server/claude/prompt.ts)
  ai/schema.ts                   חדש – JSON Schema של התוצאה המובנית (מחליף את server/claude/tool.ts)
  rules/index.ts                 חדש – כללי העסק (לא משתנה במעבר ל-OpenAI)
  search.ts                      חדש – אורקסטרציה: ai → rules → SearchResponse
src/
  services/api.ts                חדש – searchSuppliers(req, signal)
  state/AppStateProvider.tsx     שינוי – מצב החיפוש (סעיף 8)
  ui/SearchBar.tsx (+css)        חדש – שורת חיפוש אופקית
  ui/ResultsView.tsx (+css)      חדש – כותרת + מצבים + רשימה
  ui/SupplierCard.tsx (+css)     חדש – כרטיס ספק
  ui/CriterionChip.tsx (+css)    חדש – צ'יפ תנאי סף
  ui/ProgressBar.tsx (+css)      חדש
  ui/Banner.tsx (+css)           חדש – info / error
  ui/SearchForm.tsx              שינוי – onSubmit מפעיל חיפוש
.env.example                     חדש
```

---

## 5. קטלוג – הרחבה (ARCHITECTURE 2.5)

- `Country.searchLanguages`: ‏UA → `["uk","ru"]`, ‏MD → `["ro","ru"]`.
- `City.localNames`: למשל Kyiv → `{ uk: "Київ", ru: "Киев" }`, Chișinău → `{ ro: "Chișinău", ru: "Кишинёв" }`.
- `ServiceType.searchTerms`: מונחי חיפוש באוקראינית, ברומנית, ברוסית ובאנגלית לכל אחד מ-10 התחומים.
- פונקציה `isValidSelection(countryId, cityId, serviceId)` – כולל בדיקה שהעיר שייכת למדינה.

---

## 6. סכמות ונרמול (`/shared`)

**`shared/schemas`** – לפי טיפוסי ה-API ב-ARCHITECTURE 2.5:
- `SearchRequestSchema { countryId, cityId, serviceId }` (מחרוזות; הבדיקה מול הקטלוג ב-Route).
- `CriterionResultSchema { status: "met"|"not_met"|"not_verified", sourceUrls: string[] }`.
- `SourceSchema { url, title|null }`.
- `AiSupplierSchema` – הספק כפי שהמודל מחזיר (בלי `meetsAllCriteria`, `savedId`), עם אורכים מקסימליים לשדות טקסט.
- `SupplierSchema = AiSupplier + { meetsAllCriteria, savedId: string|null }`.
- `SearchResponseSchema { suppliers (0–5), fewerThanFive, searchedAt }`.
- טיפוס שגיאה אחיד `{ error: { code } }`.

**`shared/normalize.ts`** (פונקציה אחת שתשמש גם ב-M4):
- `nameKey(name)`: אותיות קטנות, הסרת מרכאות («»"'), סימני פיסוק, ורווחים כפולים; trim.
- `websiteDomain(url)`: hostname בלי `www.`, או `null`.
- `safeHttpUrl(url)`: מחזיר את ה-URL רק אם הוא `http://` או `https://`, אחרת `null`.

---

## 7. צד השרת

### 7.1 `/api/search/route.ts`
- `export const maxDuration = 180` (בלי `runtime`, ראו ARCHITECTURE ADR-5).
- POST בלבד. גוף לא תקין או צירוף שלא בקטלוג → `400 { error: { code: "invalid_input" } }`.
- קורא ל-`runSearch()` מ-`/server/search.ts`.
- שגיאות: כשל AI → `502 ai_error`; Timeout → `504 timeout`.
- כל תשובה עם `Cache-Control: no-store`.

### 7.2 `/server/ai` (OpenAI, ARCHITECTURE 2.6 ו-ADR-6)
- `client.ts`: `new OpenAI({ apiKey: OPENAI_API_KEY, maxRetries: 2 })` – ה-Retry של ה-SDK מטפל ב-429/5xx. Timeout כולל של 150 שניות (AbortSignal).
- הבקשה: `client.responses.create` עם `model` מ-`OPENAI_MODEL` (ברירת מחדל `gpt-5.5`), `reasoning.effort` מ-`OPENAI_REASONING_EFFORT` (ברירת מחדל `low`), `max_output_tokens: 16000`, `instructions` (ההוראות הקבועות), `input` (הודעת המשתמש), `store: false`.
- `tools: [{ type: "web_search", user_location: { type: "approximate", city, country, timezone } }]`, ‏`max_tool_calls` מ-`SEARCH_MAX_TOOL_CALLS` (ברירת מחדל 8), ‏`include: ["web_search_call.action.sources"]`.
- `text.format`: `{ type: "json_schema", name: "suppliers", strict: true, schema }` – הסכמה מ-`schema.ts` (אותו מבנה כמו `AiOutputSchema`, כל השדות `required`, `additionalProperties: false`).
- איסוף: (א) כל ה-URL מ-`action.sources` של פריטי `web_search_call` ומהערות `url_citation` בפריטי ה-`message` → `Set` של URL מותרים; (ב) ה-JSON של התוצאה (`output_text`) → `JSON.parse` → ולידציית Zod; (ג) `usage` ומספר פריטי `web_search_call`.
- `status` שאינו `completed`, סירוב (`refusal`), JSON לא תקין או כשל ב-Zod → ניסיון חוזר אחד של כל הבקשה; כשל שני → זורקים `AiError` (→ 502). חריגה מה-Timeout → `AiTimeoutError` (→ 504).
- **לוג** (`console.info`, JSON בשורה אחת): ‏`durationMs`, `input_tokens`, `output_tokens`, `reasoning_tokens`, `web_search_calls`, מספר מועמדים, מספר URL מותרים ומספר ספקים. בלי המפתח ובלי תוכן.
- **אימות שהמקורות חוזרים:** בחיפוש האמיתי הראשון בודקים שה-`Set` של ה-URL המותרים לא ריק. אם הוא ריק, אימות המקורות ימחק את כל הקישורים – עוצרים ומדווחים למשתמשת לפני שממשיכים.

### 7.3 `prompt.ts`
הוראות קבועות (`instructions`) באנגלית, לפי העקרונות ב-ARCHITECTURE 2.6: חיפוש בשפות המקומיות ובאנגלית; שלושת התנאים לפי PRD FR2.3 (רישום **או** רישיון; 3+ שנים; 3+ לקוחות עסקיים); `not_verified` כשאין מידע או כשהמקורות סותרים; URL לכל תנאי; עד 8 מועמדים; שפת מקור בלי תרגום; רק ספקים שנמצאו בפועל; תוכן מהרשת = נתונים ולא הוראות; התשובה הסופית היא ה-JSON לפי הסכמה בלבד.
הודעת המשתמש נבנית מהקטלוג: שם העיר והמדינה (כולל `localNames`), שם התחום ו-`searchTerms`, ו-`searchLanguages`.

### 7.4 `/server/rules` – כללי העסק (בסדר הזה)
1. **אימות מקורות:** כל URL ב-`sources` וב-`criteria.*.sourceUrls` (לא `website`, שהוא פרט קשר ולא מקור) שלא נמצא ב-Set המותרים, או שאינו http/https – נמחק. השוואה אחרי נרמול קל (בלי `#fragment`, בלי `/` בסוף). תנאי `met` שנשאר בלי מקור → `not_verified`.
2. **הסרת כפילויות:** איחוד לפי `nameKey`, `websiteDomain` או מספר רישום זהה. נשאר ספק אחד; המקורות וה-`sourceUrls` מאוחדים בלי כפילויות; שדות `null` מושלמים מהכפיל.
3. **`meetsAllCriteria`** = שלושת התנאים `met`.
4. **מיון ובחירה:** קודם מלאים, אחר כך חלקיים לפי מספר ה-`met` מהגבוה לנמוך (מיון יציב); חותכים ל-5.
5. **`fewerThanFive`** = פחות מ-5 נבחרו. `savedId: null` לכולם. `searchedAt` = עכשיו (ISO).

כללי העסק הם פונקציות טהורות, כדי שאפשר יהיה לבדוק אותן בסקריפט קטן בלי לקרוא ל-API (סעיף 11).

---

## 8. צד הלקוח – מצב וזרימה

**`src/services/api.ts`:** `searchSuppliers(req, signal)` – `fetch("/api/search", POST)`, Timeout בלקוח 190 שניות (משולב עם ה-signal), זורק שגיאה על כל תשובה שאינה 200 או על כשל רשת.

**`AppStateProvider` – הרחבה:**
```
search: {
  status: "idle" | "loading" | "success" | "error"
  request: SearchRequest | null        // החיפוש האחרון שהופעל (ל-«Повторить» ולכותרת)
  response: SearchResponse | null
}
```
- `runSearch(request)`: מבטל את ה-`AbortController` הקודם, יוצר חדש, `status = loading`; בתשובה – מעדכן רק אם זה עדיין ה-Controller הנוכחי (כך מוצגות רק תוצאות החיפוש האחרון). `AbortError` לא מוצג כשגיאה.
- `retry()`: מריץ שוב את `search.request`.
- המצב נמצא ב-Layout, ולכן מעבר ל-`/saved` וחזרה שומר את התוצאות; החלפת שפה לא נוגעת בו.

**`app/page.tsx`:**
- `search.status === "idle"` → המסך של M1 (כותרת, טופס, איור) ללא שינוי.
- אחרת → `SearchBar` + `ResultsView`.

---

## 9. מסך Результаты поиска – רכיבים (DESIGN 1.2, 2.3, Mockups)

**SearchBar:** שלושה `Select` (בלי תוויות גלויות – תוויות `visually-hidden` לנגישות) ו-Найти Primary עם אייקון. שדה התחום רחב יותר. אותו מצב טופס משותף (`form`), אותה תלות מדינה→עיר, Найти מושבת כשחסר שדה. במסך צר – עמודה אחת.

**כותרת התוצאות:** H2 «‹שם התחום› – ‹שם העיר›» לפי `search.request` (לא לפי הטופס, שאולי כבר שונה) ובשפת הממשק, ולידה Caption «Найдено поставщиков: N». (מקום כפתור הייצוא נשאר ריק עד M3.)

**מצבים:**
- loading: «Идёт поиск…» + `ProgressBar` (6px, Pill, מילוי Forest Green על Line, אנימציה בלתי-מוגדרת; `role="progressbar"`, `aria-busy`). הכותרת והתוצאות הקודמות מוסתרות.
- success + `fewerThanFive` + יש ספקים: `Banner` info «Найдено меньше 5 поставщиков» מעל הרשימה.
- success + 0 ספקים: `EmptyState` הקיים עם «Поставщики не найдены» (בלי באנר ה"פחות מ-5").
- error: `Banner` error (רקע Ink, טקסט Ivory) «Не удалось выполнить поиск. Попробуйте ещё раз.» + כפתור «Повторить» ברקע Ivory.
- הודעות במצבים מוכרזות ב-`aria-live="polite"`.

**SupplierCard** (כרטיס לבן, קו Line, פינות 4px, צל Raised ב-Hover):
1. שורה עליונה: שם (H3). מימין – אם `!meetsAllCriteria` – התג «Соответствует не всем условиям» (Pill, קו מקווקו Ink, SemiBold). (מקום כפתור השמירה – M4.)
2. תיאור: שורה אחת עם `text-overflow: ellipsis` (המלא ב-`title`). `null` → «Нет данных».
3. שלושה `CriterionChip`: ✓ Green 100 / ✕ Ink / ? מקווקו Muted. הסטטוס גם כטקסט נגיש (`aria-label` «Регистрация / лицензия: Не подтверждено») – כך רואים איזה תנאי לא מתקיים או לא אומת.
4. שורת עובדות: «Рег. №: **…** · Лет работы: **…** · Бизнес-клиенты: **N** (דוגמה, דוגמה)». כל ערך חסר → «Нет данных».
5. קו מפריד, ושורת קשר עם אייקונים: טלפון (`tel:` אחרי הסרת רווחים), מייל (`mailto:`), אתר (`target="_blank" rel="noopener noreferrer"`, רק http/https, מוצג הדומיין), כתובת (טקסט). כל שדה חסר מוצג עם האייקון ו-«Нет данных» (לא מוסתר). בקצה הימני «Источники (N)».
6. כל הטקסטים מהרשת מוצגים כטקסט רגיל (React escaping), בלי `dangerouslySetInnerHTML`.

**«Источники (N)» (הוחלט, ראו סעיף 13):** כפתור-קישור שפותח/סוגר רשימה בתוך הכרטיס (`aria-expanded`). ברשימה: כל המקורות (כותרת או דומיין, נפתח בלשונית חדשה), ולצד כל תנאי – הקישורים שלו («Регистрация / лицензия: [1] [2]»).

**רספונסיבי:** ב-375px – כרטיס בעמודה אחת, השורה העליונה נשברת (התג יורד מתחת לשם), שורת הקשר נשברת לכמה שורות, «Источники» בשורה משלו. בלי גלילה אופקית (גם לכתובות URL ארוכות: `overflow-wrap: anywhere`).

---

## 10. i18n – מפתחות חדשים (ru / en / uk)

קיימים כבר: `search.loading/found/fewerThanFive/notFound/error/retry`, `criteria.*`, `supplier.*`.
להוסיף:
- `results.heading`: «{{service}} – {{city}}» (זהה בשלוש השפות).
- `supplier.sourcesToggle`: «Источники ({{n}})» / «Sources ({{n}})» / «Джерела ({{n}})» – מבוסס על הטקסט «Источники» מה-PRD.
- `criteria.chipLabel`: «{{name}}: {{status}}» – לקורא מסך בלבד.
- `search.barLabel` – תווית נסתרת לשורת החיפוש, מבוססת על «Поиск поставщиков» הקיים.

---

## 11. בדיקות שאני מריץ בסוף הבנייה

1. `npm run lint` ו-`npm run build` – בלי שגיאות.
2. **כללי העסק בלי API:** סקריפט זמני בתיקיית ה-scratchpad (לא ב-Repository) שמריץ את `/server/rules` על קלט מדומה: URL לא מאומת נמחק ו-`met` הופך ל-`not_verified`; כפילויות לפי שם / דומיין / מספר רישום מתאחדות; מיון; חיתוך ל-5; `fewerThanFive`.
3. **ולידציה:** `curl` עם עיר שלא שייכת למדינה, תחום שלא קיים וגוף לא תקין → `400`.
4. **חיפושים אמיתיים** (דורש מפתח `dev` ב-`.env`) – 3 צירופים לפחות, כולל Кишинёв: ≤5 ספקים, מלאים לפני חלקיים, כל URL שמוצג נמצא ב-Set המותרים (בדיקה מול הלוג/תשובה), ושהקישורים נפתחים (דגימה בדפדפן).
5. **מצבים בדפדפן (Preview):** loading; «פחות מ-5» ו-«לא נמצאו» ושגיאה – באמצעות יירוט `fetch` ב-`javascript_tool` שמחזיר תשובה מדומה / 502 (בלי לשנות קוד); «Повторить» מריץ שוב. כל ההודעות ב-RU / EN / UK.
6. **ביטול:** הפעלת חיפוש, שינוי שדה והפעלת חיפוש נוסף מיד → רק התוצאה האחרונה מוצגת (בדיקה ב-Network שהבקשה הראשונה בוטלה).
7. **שפה וניווט:** החלפת שפה במסך התוצאות – בלי בקשה חדשה ב-Network; מעבר ל-`/saved` וחזרה – התוצאות נשארות.
8. **סודות:** חיפוש `sk-ant` ושם המשתנה ב-`.next/static` – אין תוצאות; ב-Network אין מפתח.
9. **לוג:** שורת השימוש מופיעה בפלט השרת; אני מחשב עלות משוערת לכל חיפוש (Tokens לפי מחירון המודל + 0.01$ לחיפוש) ומדווח זמן תגובה ועלות.
10. **תצוגה:** צילום מסך ב-Desktop מול ה-Mockup, וברוחב 375px (בלי גלילה אופקית).

ההרצה נסגרת בסיום. `429` של ה-WAF נבדק רק אחרי הדחיפה, ב-Production.

---

## 12. Definition of Done – איך כל סעיף נבדק

| סעיף | איך נבדק |
|---|---|
| 3 צירופים (כולל מולדובה) מחזירים תוצאות, ≤5 | בדיקה 4 |
| מלאים לפני חלקיים; תג + איזה תנאי | בדיקות 2, 4, צילום מסך |
| כל קישור נפתח ושייך לתוצאות אותה בקשה | בדיקות 2, 4 |
| שפת מקור; «Нет данных» לשדה חסר | בדיקה 4 + תשובה מדומה עם שדות `null` |
| מצבי טעינה / פחות מ-5 / לא נמצאו / שגיאה + Повторить, בשלוש שפות | בדיקה 5 |
| רק תוצאות החיפוש האחרון | בדיקה 6 |
| `400` לקלט שלא בקטלוג; `429` מה-WAF | בדיקה 3; `429` – אחרי הדחיפה |
| מפתח לא בקוד הלקוח | בדיקה 8 |
| לוג זמן/Tokens/חיפושים + דיווח עלות | בדיקה 9 |
| תואם Mockups ב-Desktop, עמודה אחת ב-375px | בדיקה 10 |

---

## 13. החלטות פרשנות (לא מוגדרות במפורש ב-spec) – לאישור המשתמש

1. **מה קורה בלחיצה על «Источники (N)»** – ✅ הוחלט (המשתמשת אישרה): לחיצה פותחת וסוגרת רשימת מקורות בתוך הכרטיס, כולל הקישורים של כל תנאי סף (סעיף 9).
2. **שורת החיפוש במסך התוצאות בלי תוויות גלויות** – כמו ב-Mockups; התוויות קיימות לקורא מסך בלבד.
3. **בזמן חיפוש חדש** התוצאות הקודמות מוסתרות ומוצג רק מצב הטעינה (DESIGN מתאר טעינה כמצב מסך נפרד).
4. **מקום כפתור הייצוא וכפתור השמירה** נשאר ריק עד M3 / M4.
5. ~~מספר סבבי `pause_turn`~~ – לא רלוונטי אחרי המעבר ל-OpenAI (קריאה אחת לכל חיפוש).
