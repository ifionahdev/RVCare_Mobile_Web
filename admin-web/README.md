# RaphaCare admin/vet website

Place `admin-web/` inside the root of your existing `rvcare/` repository, alongside `backend/` and `lib/`. Do not replace the Flutter `web/` directory.

## Run

```bash
cd admin-web
npm install
npm run dev
```

Open http://localhost:5173/login or /forgot-password.

These are frontend-only forms: authentication and reset email sending require backend implementation. No mock login bypass is provided.
