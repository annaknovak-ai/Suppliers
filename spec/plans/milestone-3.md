# תוכנית – Milestone 3: ייצוא ל-Excel

> מבוסס על MILESTONES.md (M3), PRD (F4, Flow 2, טבלת "טקסטים בקובץ ה-Excel", מקרי קצה), ARCHITECTURE.md (2.2, 2.4, 2.5, 2.7, 2.8 Flow 2, טבלת הסיכונים) ו-DESIGN.md (1.2, כפתור Secondary, אייקון הורדה). הקוד של M1–M2 הוא נקודת המוצא.
> **לא בונים ב-M3:** כפתור Сохранить / Сохранено ו-`savedId` (M4), ייצוא של רשימת הספקים השמורים (מחוץ לגרסה, PRD 6ג), כלל WAF ל-`/api/export` (לא מוגדר ב-spec).

---

## 1. מטרה ותוצר

אחרי חיפוש שהחזיר לפחות ספק אחד, מופיע במסך התוצאות כפתור «Экспорт в Excel». לחיצה עליו יוצרת בשרת קובץ `.xlsx` עם פרמטרי החיפוש, תאריך החיפוש ושורה לכל ספק שמוצג, עם כל השדות. כותרות הקובץ בשפת הממשק, ונתוני הספקים בשפת המקור. במחשב הקובץ יורד, וב-Android נפתח תפריט השיתוף של המכשיר (או הורדה רגילה, אם השיתוף לא נתמך).

אין הקמת חשבונות או מפתחות חדשים ב-M3.

---

## 2. תלות חדשה

- `exceljs` – הגרסה היציבה העדכנית (כרגע `4.4.0`), גרסה מדויקת ב-`package.json`. בשימוש בצד השרת בלבד (`/server/excel`).
- לפני כתיבת הקוד: לבדוק בטיפוסים של החבילה המותקנת את `Workbook`, `addWorksheet`, `addRow`, `getColumn().width`, `views` (הקפאת שורות), `alignment.wrapText`, `cell.value = { text, hyperlink }` ו-`workbook.xlsx.writeBuffer()`.
- לבדוק ב-`node_modules/next/dist/docs/` (AGENTS.md) אם צריך להוסיף את `exceljs` ל-`serverExternalPackages` ב-`next.config.ts`. מוסיפים רק אם ה-Build או הריצה נכשלים בלי זה.

---

## 3. מבנה קבצים – מה נוצר ומה משתנה

```
app/
  api/export/route.ts            חדש – Route Handler ‏POST
shared/
  schemas/index.ts               שינוי – ExportRequestSchema
  exportFileName.ts              חדש – exportFileName(search, searchedAt) – משמש את השרת ואת הלקוח
  i18n/{ru,en,uk}.json           שינוי – מקטע "excel" עם טקסטי הקובץ (סעיף 7)
server/
  excel/index.ts                 חדש – buildSuppliersWorkbook(request) → Buffer ‏(import "server-only")
src/
  services/api.ts                שינוי – exportSuppliers(request) → Blob
  services/download.ts           חדש – deliverFile(blob, fileName): שיתוף או הורדה
  ui/ResultsView.tsx (+css)      שינוי – כפתור הייצוא בכותרת התוצאות
```

כללי השכבות נשמרים: `/src` מייבא מ-`/shared` בלבד, `/server` ו-`/app/api` מייבאים מ-`/shared`.

---

## 4. סכמה ושם הקובץ (`/shared`)

- **`ExportRequestSchema`** = `{ search: SearchRequestSchema, response: SearchResponseSchema, uiLanguage: z.enum(["ru","en","uk"]) }`, עם תנאי נוסף ש-`response.suppliers` כולל לפחות ספק אחד. מייצא גם את הטיפוס `ExportRequest`.
- **`exportFileName(search, searchedAt)`** → `suppliers_<countryId>_<cityId>_<serviceId>_<YYYY-MM-DD>.xlsx`, לפי ARCHITECTURE 2.7. המזהים מהקטלוג (באותיות לטיניות, למשל `suppliers_UA_kyiv_cleaning_2026-11-01.xlsx`), כך שהשם תקין בכל מערכת הפעלה. התאריך הוא התאריך של `searchedAt`.

---

## 5. צד השרת

### `/server/excel` – `buildSuppliersWorkbook({ search, response, uiLanguage })`
גיליון אחד. כל הטקסטים הקבועים נלקחים מקובץ התרגום של `uiLanguage` (מקטע `excel`, ו-«Нет данных» מ-`supplier.notAvailable`).

1. **ראש הגיליון** – ארבע שורות "תווית | ערך":
   - Страна / Город / Вид услуги – שמות מהקטלוג בשפת הממשק.
   - Дата поиска – התאריך של `searchedAt`.
   - שורה ריקה אחת.
2. **שורת כותרות** (מודגשת, עם רקע בהיר, מוקפאת בגלילה), בסדר הזה:
   Название · Описание · Телефон · Эл. почта · Сайт · Адрес · Рег. № / лицензия · Лет работы · Бизнес-клиенты (кол-во) · Примеры бизнес-клиентов · Регистрация / лицензия · 3+ лет работы · 3+ бизнес-клиентов · Соответствует всем условиям · Источники
3. **שורה לכל ספק**, באותו סדר שבו הספקים מוצגים במסך:
   - שדות טקסט – כמו שהם, בשפת המקור. שדה ריק (`null`) → «Нет данных» בשפת הממשק (PRD, הערה לטבלה).
   - Сайт – קישור לחיץ, רק אם הכתובת `http`/`https` (`safeHttpUrl`); אחרת טקסט רגיל.
   - Примеры бизнес-клиентов – מחוברים ב-`; `. רשימה ריקה → «Нет данных».
   - שלוש עמודות הסטטוס – Выполнено / Не выполнено / Не подтверждено (מ-`criteria.status`).
   - Соответствует всем условиям – Да / Нет.
   - Источники – כל כתובות המקורות של הספק (`sources` ו-`sourceUrls` של שלושת התנאים), בלי כפילויות (`urlKey`), רק `http`/`https`, כל כתובת בשורה נפרדת בתוך התא. אין מקורות → «Нет данных».
4. **עיצוב בסיסי:** רוחב עמודות קבוע וסביר, גלישת טקסט (wrap) בעמודות הארוכות, יישור לראש התא.
5. מחזיר `Buffer` מ-`workbook.xlsx.writeBuffer()`.

הערות: ExcelJS כותב את כל הערכים כטקסט ולא כנוסחאות, ולכן תוכן מהרשת שמתחיל ב-`=` לא יורץ כנוסחה. השרת לא קורא ל-OpenAI ולא שומר דבר – הוא רק בונה קובץ מהנתונים שהלקוח שולח.

### `/api/export/route.ts`
- `POST`. בלי הגדרת `runtime` (ADR-5). אין צורך ב-`maxDuration` מיוחד.
- קורא JSON; JSON לא תקין, ולידציה של `ExportRequestSchema` שנכשלת, `isValidSelection` שנכשל, או רשימת ספקים ריקה → `400` עם `{ error: { code: "invalid_input" } }` ו-`Cache-Control: no-store` (כמו `/api/search`).
- הצלחה → `200` עם גוף הקובץ ו-headers:
  - `Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
  - `Content-Disposition: attachment; filename="<exportFileName>"`
  - `Cache-Control: no-store`
- שגיאה לא צפויה ביצירת הקובץ → רישום בלוג ו-`500` עם `{ error: { code: "export_failed" } }`.

---

## 6. צד הלקוח

### `src/services/api.ts` – `exportSuppliers(request: ExportRequest): Promise<Blob>`
`POST /api/export` עם JSON, `cache: "no-store"`. תשובה שאינה `200` → `ApiRequestError`. מחזיר `response.blob()`.

### `src/services/download.ts` – `deliverFile(blob, fileName)`
לפי PRD Flow 2 (במחשב – הורדה; בנייד – שמירה או שיתוף לפי התנהגות מערכת ההפעלה) ו-ARCHITECTURE 2.8 Flow 2:
1. יוצר `File` מה-Blob, עם השם וה-MIME של xlsx.
2. **בנייד** (מזוהה לפי `matchMedia("(pointer: coarse)")`) ואם `navigator.canShare?.({ files: [file] })` מחזיר `true` → `navigator.share({ files: [file] })`.
   - המשתמש ביטל את השיתוף (`AbortError`) → לא עושים כלום.
   - כל שגיאה אחרת (למשל `NotAllowedError`, כשעבר יותר מדי זמן מהלחיצה) → ממשיכים להורדה רגילה.
3. **אחרת** → הורדה רגילה: `URL.createObjectURL`, קישור זמני עם `download=fileName`, `click()`, ושחרור ה-URL אחרי רגע.

הסיבה להגבלת השיתוף לנייד: Chrome ב-Windows תומך גם הוא בשיתוף קבצים, ובלי ההגבלה במחשב היה נפתח חלון שיתוף של Windows במקום הורדה – בניגוד ל-PRD Flow 2.

### `ResultsView` – כפתור הייצוא
- בכותרת התוצאות: הכותרת והמונה משמאל, ובצד ימין כפתור `Button variant="secondary"` עם `DownloadIcon` והטקסט `search.export` (כבר קיים בשלוש השפות).
- מוצג **רק** כש-`status === "success"` ויש לפחות ספק אחד (FR4.1, מקרה הקצה "לא נמצא אף ספק").
- בלחיצה: שולח `{ search: request, response, uiLanguage: lang }` – השפה הפעילה ברגע הלחיצה (FR4.4). הכפתור מושבת (`disabled`, `aria-busy`) עד שהקובץ מוכן, כדי למנוע לחיצה כפולה.
- **שגיאה בייצוא** (כל תשובה שאינה `200` או כשל רשת): מתחת לכותרת התוצאות מוצג `Banner variant="error"` עם `search.exportError`, והכפתור חוזר להיות פעיל לניסיון נוסף. ההודעה נעלמת בלחיצה הבאה על הייצוא או בחיפוש חדש (סעיף 10.1).
- CSS: `.heading` מקבל `justify-content: space-between` ו-`align-items: center`; ברוחב 375px הכפתור יורד לשורה משלו (`flex-wrap` כבר קיים) בלי גלילה אופקית.
- מצב הייצוא נשמר מקומית ברכיב (`useState`), לא ב-`AppStateProvider`.

---

## 7. i18n – מפתחות חדשים (ru / en / uk)

מקטע `excel` חדש בשלושת קובצי התרגום, בדיוק לפי הטבלה "טקסטים בקובץ ה-Excel" ב-PRD:
`country`, `city`, `service`, `searchDate`, `columns.{name, description, phone, email, website, address, regNumber, yearsActive, businessClientsCount, businessClientExamples, registration, yearsActiveCriterion, businessClientsCriterion, meetsAll, sources}`, `yes`, `no`.

ערכי הסטטוס (`criteria.status.*`) ו-«Нет данных» (`supplier.notAvailable`) כבר קיימים ומשמשים גם את הקובץ.
מפתח נוסף `search.exportError` – הודעת השגיאה של הייצוא (סעיף 10.1).

---

## 8. בדיקות שאני מריץ בסוף הבנייה

1. `npm run lint` ו-`npm run build` עוברים.
2. מריץ `npm run dev`, ושולח ל-`/api/export` בקשות בדיקה (בלי לבצע חיפוש בתשלום), עם נתוני ספקים לדוגמה:
   - בקשה תקינה ב-ru, en ו-uk → `200`, headers נכונים, ושם הקובץ לפי התבנית.
   - רשימת ספקים ריקה, JSON שבור, עיר שלא במדינה, שפה לא מוכרת → `400`.
3. קורא את שלושת הקבצים שנוצרו בסקריפט קצר עם ExcelJS (בתיקיית ה-scratchpad, לא בפרויקט) ומוודא: פרמטרי החיפוש והתאריך, שורה לכל ספק, כל העמודות, הסטטוסים, Да/Нет, «Нет данных» בשדות ריקים, קישורים במקורות, כותרות בשפה הנכונה ונתונים בשפת המקור.
4. בדפדפן המובנה: חיפוש אמיתי אחד (עלות של חיפוש יחיד), ואז:
   - הכפתור מופיע בכותרת התוצאות, ונראה לפי ה-Mockups.
   - לחיצה מורידה קובץ (בדיקה דרך Network: `POST /api/export` מחזיר `200` עם xlsx).
   - החלפת שפה ל-EN ולחיצה נוספת → `uiLanguage: "en"` בבקשה.
   - ברוחב 375px – אין גלילה אופקית.
   - מצב "לא נמצאו ספקים" (בדיקה עם תשובה מדומה בקוד הבדיקה בלבד, או לפי הקוד) → אין כפתור.
   - כשל בייצוא (חסימה זמנית של `/api/export` בכלי הדפדפן) → מוצגת הודעת השגיאה בשפת הממשק, והכפתור חוזר להיות פעיל.
5. סוגר את השרת בסיום.

**לא אפשרי לבדוק אצלי:** פתיחה ב-Excel עצמו ובמכשיר Android. את אלה בודקת המשתמשת: Excel – בהרצה המקומית; Android, כולל אתר מותקן – בכתובת ה-Production אחרי הדחיפה.

---

## 9. Definition of Done – איך כל סעיף נבדק

| סעיף | איך נבדק |
|---|---|
| הקובץ נפתח ב-Excel, עם פרמטרים, תאריך, שורה לכל ספק, כל השדות, סטטוסים ומקורות | סקריפט הקריאה (סעיף 8.3) + פתיחה ב-Excel על ידי המשתמשת |
| ב-EN/UK כותרות בשפה הזו, נתוני הספקים בשפת המקור | קבצים בשלוש השפות (8.2–8.3) + בדיקה בממשק (8.4) |
| כשאין ספקים – אין כפתור; רשימה ריקה → `400` | 8.4 + 8.2 |
| הורדה במחשב וב-Android, גם כשהאתר מותקן | מחשב – אצלי ואצל המשתמשת מקומית; Android – המשתמשת, ב-Production אחרי הדחיפה. בעיה בפלטפורמה כלשהי מדווחת |

---

## 10. שאלות פתוחות והחלטות פרשנות – לאישור המשתמשת

1. **הודעה כשהייצוא נכשל** – ✅ הוחלט (המשתמשת אישרה): באנר שגיאה מתחת לכותרת התוצאות, עם נוסח חדש: RU «Не удалось экспортировать файл. Попробуйте ещё раз.» / EN «Export failed. Please try again.» / UK «Не вдалося експортувати файл. Спробуйте ще раз.». הנוסח נוסף לטבלת הטקסטים ב-PRD.
2. **תאריך החיפוש בקובץ** בפורמט `YYYY-MM-DD` (כמו בשם הקובץ), לפי שעון UTC של זמן החיפוש. ליד חצות שעון אוקראינה/מולדובה התאריך עלול להיות של היום הקודם – מקובל לגרסה הזו.
3. **שמות בשם הקובץ** – מזהי הקטלוג הלטיניים (`UA`, `kyiv`, `cleaning`) ולא השמות המתורגמים, כדי ששם הקובץ יעבוד בכל מכשיר ובכל שפה.
4. **שיתוף רק בנייד** – במחשב תמיד הורדה רגילה (PRD Flow 2), גם אם הדפדפן תומך בשיתוף.
5. **עמודת המקורות** מאחדת את המקורות הכלליים של הספק ואת המקורות של כל תנאי, בלי כפילויות, כתובת בכל שורה בתוך התא.
