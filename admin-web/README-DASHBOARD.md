# RaphaCare admin dashboard update

Copy **only the contents of `admin-web/`** into your existing `rvcare/admin-web/` folder. Keep your Flutter `lib/`, `web/`, and `backend/` folders unchanged.

From `rvcare/admin-web` run:

```bash
npm install
npm run dev
```

Open http://localhost:5173/login . Enter any syntactically valid email and any non-empty password. This is a **temporary UI demo** only. The dashboard is at `/admin/dashboard` and uses fictional sample data. Sign out removes the demo session. Do not deploy this as real authentication: the browser sessionStorage flag is not secure and must be replaced with server-side identity and role validation.

Files updated: `src/main.jsx`, `src/pages/auth/Login.jsx`, `src/components/auth/AuthLayout.jsx`. New: `src/pages/admin/Dashboard.jsx`. No other feature pages implemented.
