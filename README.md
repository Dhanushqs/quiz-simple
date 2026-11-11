# Simple Quiz Portal

Upload study material (PDF or DOCX) → AI writes **10 multiple-choice questions** → you check them → publish → students take a **randomised, timed** quiz → scores are saved permanently → you download them as **CSV or Excel**.

**Built with:** Next.js · Tailwind CSS · Supabase (database only) · Groq (writes the questions) · Vercel (hosting)

**You only need 4 settings in total:**

| Setting name | What it is |
|---|---|
| `SUPABASE_URL` | Address of your database |
| `SUPABASE_SERVICE_ROLE_KEY` | Secret key of your database |
| `ADMIN_PASSWORD` | The password YOU choose to open the admin page |
| `GROQ_API_KEY` | Groq key that writes the questions |

There is no email login and no Supabase login. The admin page is opened with one password.

---

# STEP-BY-STEP GUIDE

Do the parts in order. Finish each part before starting the next.
You do **not** need to install anything on your computer.

## PART 1: Put the code on GitHub

1. Unzip `quiz-simple.zip` on your computer. Open the unzipped folder. Inside you will see: `src`, `supabase`, `package.json`, `package-lock.json`, `next.config.mjs`, `postcss.config.mjs`, `jsconfig.json`, `README.md`, `.env.example` and `.gitignore`.
2. Go to **github.com** and sign in. Click the **+** (top right) → **New repository**.
3. Name it `quiz-simple`. Leave everything else as it is (do NOT tick "Add a README"). Click **Create repository**.
4. On the new empty repository page, click **uploading an existing file**.
5. Open the unzipped folder, press **Ctrl+A** (select everything inside it) and **drag all of it** into the GitHub page. Use **Google Chrome or Edge**. This keeps the folders.
6. Wait until the upload bars finish. Scroll down and click **Commit changes**.
7. **Check it:** the repository front page must show the folders **`src`** and **`supabase`** and the file **`package.json`** (not inside another folder). Open `src` → `app` → `quiz`: you must see a folder named **`[token]`** (with the square brackets). If a folder is missing, drag that folder in again (**Add file → Upload files**).

## PART 2: Create the database (Supabase)

1. Go to **supabase.com** → sign in → **New project**.
   - Name: `quiz`. Database password: click **Generate** and save it somewhere.
   - Region: **South Asia (Mumbai)** (or the closest to your students). Click **Create new project** and wait 1 to 2 minutes.
   - (If you already made a project earlier you can reuse it. Running the SQL again is safe.)
2. Left menu → **SQL Editor** → **New query**.
3. On GitHub, open `supabase` → `schema.sql` → click the **Copy raw file** button (two squares icon). Paste it into the Supabase editor. Click **Run**.
   You should see **Success**. Check: left menu → **Table Editor** shows `quizzes`, `questions`, `attempts`.
4. Copy your two values. Go to **Project Settings** (gear icon) → **API Keys**:
   - **Project URL**: looks like `https://abcdxyz.supabase.co`. (It is also shown under **Data API**, or behind the **Connect** button at the top.)
   - **Secret key**: the `service_role` key (a very long text starting with `eyJ`), found under the **Legacy API keys** tab. If you do not see that tab, use the **Secret key** (starts with `sb_secret_`) instead. Click **Reveal** and copy it.
   Paste both into a private note for Part 4.
   **Never share the secret key or put it on GitHub.**

## PART 3: Get the Groq key

1. Go to **console.groq.com** → sign in → **API Keys** → **Create API Key**.
2. Give it any name, click **Submit**, and **copy the key at once** (starts with `gsk_`). It is shown only one time.
3. Paste it into your private note.

## PART 4: Put the website online (Vercel)

1. Go to **vercel.com** → **Sign up** with GitHub (or log in).
2. Click **Add New…** → **Project**. Find `quiz-simple` and click **Import**. (If you do not see it, click **Adjust GitHub App Permissions** and allow that repository.)
3. Leave **Framework Preset = Next.js**. Open the **Environment Variables** section and add these **4** one by one (type the name, paste the value, click **Add**). Keep the default environment choice (all environments):

   | Name (type exactly) | Value |
   |---|---|
   | `SUPABASE_URL` | the Project URL |
   | `SUPABASE_SERVICE_ROLE_KEY` | the secret key |
   | `ADMIN_PASSWORD` | a password you invent: long, at least 8 characters (e.g. `Green-Mango-River-4821`) |
   | `GROQ_API_KEY` | the Groq key |

   No spaces before or after the values, and no quote marks.
4. Click **Deploy**. Wait about a minute until you see the confetti / **Congratulations**.
5. Click **Continue to Dashboard** → **Visit**. That address (like `https://quiz-simple-xxxx.vercel.app`) is **your students' link**.
   Your admin page is the same address plus `/admin/login`.

**Changed a setting later?** Vercel → your project → **Settings → Environment Variables** → edit → then **Deployments → latest → ⋯ → Redeploy**. Settings only take effect after a redeploy.

## PART 5: Test it yourself (do this before the real quiz)

1. Open `your-address/admin/login`, type your `ADMIN_PASSWORD`, click **Sign in**.
2. Click **+ New quiz from study material**.
3. Type a title, choose the time in minutes, and upload a small PDF or DOCX (or paste some text). Click **Generate 10 questions** and wait up to a minute.
4. Read all 10 questions. Fix anything wrong. The **round green button** marks the correct answer, so check each one. Click **Save & publish**.
5. Open your students' link in a **private / incognito window**. Type a username, press **Start quiz**, answer a few, **refresh the page** (your answers and the timer must still be there), then **Submit**. You see your score.
6. Back in admin, open the quiz → **Results** tab. Your attempt is listed. Try **Download CSV** and **Download Excel**.
7. Click **Delete all attempts** so your test data is gone.

## PART 6: Run the real quiz

1. A day before: open your Supabase dashboard once (free projects pause after about a week of no use). Publish the quiz and do the test in Part 5.
2. On the day: send students the link. Tell them to use their **real name or roll number** as username.
3. Watch the **Results** tab. It updates every 15 seconds.
4. A student who lost their session shows as "In progress": click **Reset** on their row so they can start again.
5. When done: click **Close quiz**, then **Download Excel / CSV**. Students who never pressed Submit are graded automatically from the answers they had saved.

---

# If something goes wrong

| Problem | What to do |
|---|---|
| Vercel build fails | Open the failed deployment and read the red text. Most often `package.json` is not at the top of the GitHub repo (Part 1 step 7). |
| Admin login says "ADMIN_PASSWORD is missing" | Add `ADMIN_PASSWORD` in Vercel (Part 4) and **Redeploy**. |
| Admin login says "Wrong password" | Type the exact `ADMIN_PASSWORD` value from Vercel. If you edited it, redeploy. |
| "Something went wrong on the server" | Vercel → your project → **Logs**. Read the red line. Usually the SQL (Part 2 step 3) was not run, or `SUPABASE_URL` / the secret key is wrong. If you used one kind of key and get "Invalid API key", try the other kind (legacy `service_role` or `sb_secret_`). |
| "Groq says: …" when generating | The message shows Groq's real reason. "API key" → fix `GROQ_API_KEY` and redeploy. "rate limit" → wait a minute. |
| "I could not find enough text" | The PDF is a scan (pictures). Copy the text out and paste it in the text box instead. |
| Student: "username already used" | Admin → quiz → **Results** → **Reset** on that row. |

# How it keeps the quiz fair and safe

- **Correct answers never reach students.** Grading happens on the server after submitting.
- **The timer is checked on the server.** The deadline is saved when the student starts. Answers saved after the deadline are refused, and a late submit only counts the answers saved before the deadline.
- **Refresh-safe.** Question order, saved answers and the deadline are stored in the database. Every click is saved at once.
- **No double submissions.** An attempt can be graded only once, however many times Submit is pressed.
- **Random order per student**, for both the questions and the answer options.
- **Admin is protected.** Every admin action checks a signed, hidden login cookie. The database is not reachable from browsers at all.

**Honest limits:** students use only a username (no password), so the first person to type a name owns it. Use real names or roll numbers, and use **Reset** if needed. Only the first ~8 pages of your material are used (Groq's free plan limit); upload the part you want tested. Files can be up to 4 MB.

# Project map (for the curious)

```
src/app/page.js                 student home page (enter username)
src/app/quiz/[token]/page.js    the quiz screen: timer, questions, result
src/app/admin/...               admin login + dashboard
src/app/api/quiz/...            student endpoints (start, answer, submit...)
src/app/api/admin/...           admin endpoints (all need the admin cookie)
src/lib/logic.js                shuffling, grading, validation
src/lib/ai.js                   asks Groq for the 10 questions
src/lib/auth.js                 admin password check
supabase/schema.sql             the database tables
```
