# Prisma Guide (everyone)

Backend uses **Prisma 7** + MySQL (XAMPP). Run all commands in `backend/`.

> **Never upgrade Prisma.** No `npm i prisma@latest`. Prisma 8 doesn't support MySQL.

## Rules

- `prisma/schema.prisma` = source of truth for tables.
- **Never** create or edit tables in phpMyAdmin (data is fine).

## 1. First-time setup

1. Start **MySQL** in XAMPP.

    **Already have the old imported DB?** Run `npx prisma migrate reset` then `npx prisma generate`. (Wipes your local data.)

2. phpMyAdmin: create an **empty** database `db_rvcare_mobile`. Don't import `.sql`.
3. Add to `backend/.env`:
   ```
   DATABASE_URL="mysql://root:@localhost:3306/db_rvcare_mobile"
   ```
4. Run:
   ```
   npm install
   npx prisma migrate deploy
   npx prisma generate
   ```
5. Check: `npx prisma migrate status` → "up to date".

## 2. After every `git pull`

If the pull changed anything in `backend/prisma/`:

```
npm install
npx prisma migrate deploy
npx prisma generate
```

Skipped it? You'll see `Table doesn't exist` or `Unknown column`.

## 3. Does it change my database?

| Command | Changes DB? |
|---|---|
| `git pull` | No |
| `migrate deploy` | **Yes**, applies new migrations |
| `migrate dev` | **Yes**, creates + applies a migration |
| `migrate reset` | **Yes, wipes everything** |
| `migrate status`, `generate`, `validate`, `format` | No |

Same DB you see in phpMyAdmin. Only your local copy changes.

## 4. Quick fixes

| Problem | Fix |
|---|---|
| `Can't reach database server` | Start MySQL in XAMPP |
| `Table doesn't exist` / `Unknown column` | `npx prisma migrate deploy` |
| Prisma Client model errors | `npx prisma generate` |
| `prisma: command not found` | `npm install` |
| Asked to "reset" the database | Say **no**, ask the team |

Want to add or change tables? See **PRISMA_MIGRATIONS.md**.