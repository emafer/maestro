# ♩ Maestro – Registro Musicale

App per docenti di strumento musicale: gestione alunni, lezioni, annotazioni e integrazione Google Calendar. Autenticazione multi-docente (ogni docente vede solo i propri dati).

---

## 🚀 Setup completo (30 minuti)

### FASE 1 — Supabase (database + autenticazione)

1. Vai su **https://supabase.com** → "Start your project" → crea un account gratuito
2. Clicca **"New project"**, dai un nome (es. `maestro`), scegli una password sicura, regione **EU West** → "Create new project" (attendi ~1 min)
3. Dal menu a sinistra vai su **SQL Editor** → "New query"
4. Copia e incolla tutto il contenuto di **`supabase_schema.sql`** → clicca **"Run"**
5. Dal menu a sinistra vai su **Project Settings → API**
6. Copia:
   - **Project URL** → sarà `REACT_APP_SUPABASE_URL`
   - **anon / public key** → sarà `REACT_APP_SUPABASE_ANON_KEY`

#### Abilitare la registrazione via email
- Menu → **Authentication → Providers** → Email: già abilitato di default ✓
- Facoltativo: in **Authentication → Email Templates** puoi personalizzare l'email di conferma in italiano

---

### FASE 2 — GitHub (repository del codice)

1. Vai su **https://github.com** → crea un account se non ce l'hai
2. Clicca **"New repository"** → nome `maestro-registro` → "Create repository"
3. Sul tuo computer, apri il terminale nella cartella del progetto:

```bash
git init
git add .
git commit -m "first commit"
git branch -M main
git remote add origin https://github.com/TUO_USERNAME/maestro-registro.git
git push -u origin main
```

---

### FASE 3 — Vercel (hosting gratuito)

1. Vai su **https://vercel.com** → "Sign up" con il tuo account GitHub
2. Clicca **"Add New Project"** → importa il repository `maestro-registro`
3. Framework: Vercel lo rileva automaticamente come **Create React App** ✓
4. **Clicca su "Environment Variables"** e aggiungi:

   | Nome | Valore |
   |------|--------|
   | `REACT_APP_SUPABASE_URL` | il Project URL di Supabase |
   | `REACT_APP_SUPABASE_ANON_KEY` | l'anon key di Supabase |

5. Clicca **"Deploy"** → attendi 2-3 minuti
6. Vercel ti darà un URL tipo `maestro-registro.vercel.app` — quella è la tua app! 🎉

---

### FASE 4 — Configurare il redirect email in Supabase

Dopo il deploy, torna su Supabase:
- **Authentication → URL Configuration**
- **Site URL**: `https://maestro-registro.vercel.app`
- **Redirect URLs**: aggiungi `https://maestro-registro.vercel.app/**`

---

## 👩‍🏫 Come si usa

1. Vai sull'URL di Vercel → clicca **"Registrati"** → inserisci email e password
2. Controlla l'email per la conferma (clicca il link)
3. Accedi → inizia ad aggiungere **Scuole**, poi **Alunni**, poi **Lezioni**
4. Per ogni lezione puoi aggiungere annotazioni e cosa portare la prossima volta
5. Il pulsante **📅 Google Calendar** crea l'evento direttamente nel tuo calendario

Ogni docente che si registra vede **solo i propri dati** grazie alla Row Level Security di Supabase.

---

## 🔧 Sviluppo locale (opzionale)

```bash
# Copia il file delle variabili
cp .env.example .env.local
# Modifica .env.local con i tuoi valori Supabase

npm install
npm start
# → http://localhost:3000
```

---

## 📁 Struttura del progetto

```
src/
├── lib/
│   ├── supabase.js      # Client Supabase
│   ├── AuthContext.js   # Autenticazione (login/logout/register)
│   └── hooks.js         # CRUD scuole, alunni, lezioni
├── pages/
│   ├── AuthPage.js      # Login / Registrazione
│   └── AppPage.js       # App principale
├── Root.js              # Router auth → app
└── index.js             # Entry point
supabase_schema.sql      # Schema database (esegui su Supabase)
```
# maestro
