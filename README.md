
# 🌐 Projecte API – Gestió de Calendari i Tasques

API RESTful creada amb TypeScript, Express i PostgreSQL per a la gestió de calendaris, tasques, categories i configuració d'usuari. Suporta autenticació JWT i OAuth amb Google, pensada per a ús des de web i app mòbil.

## 🚀 Funcionalitats principals

- 🔐 Autenticació segura per JWT (web/app) i Google OAuth
- 🗓️ Gestió de calendaris personals
- ✅ Tasques amb prioritats i categories
- 🧾 Registre de logs d’activitat
- ⚙️ Configuració d’usuari
- 📁 Separació clara per mòduls i controladors

## 📦 Instal·lació

```bash
git clone https://github.com/usuari/projecte-api.git
cd projecte-api
npm install
cp .env.example .env
# omplir variables d'entorn com DATABASE_URL, JWT_SECRET_APP, etc.
npm run dev
```

## 🔑 Variables d'entorn (.env)

```
DATABASE_URL=postgres://...
JWT_SECRET_WEB=...
JWT_SECRET_APP=...
GOOGLE_CLIENT_ID=...
```

## 🔧 Estructura del projecte

```
src/
├── api/
│   ├── routers/
│   ├── models/
│   ├── middlewares/
│   └── config/
├── index.ts
├── logger.ts
└── ...
```

## 📚 Documentació completa

Consulta la [RELEASE_V1.3.0.md](./RELEASE_V1.3.0.md) per a llistat d’endpoints i exemples detallats.

## 🧪 Tests

```bash
npm run test
```

## 📜 Llicència

Aquest projecte està sota llicència MIT.
