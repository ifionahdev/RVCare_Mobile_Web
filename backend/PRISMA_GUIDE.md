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

## 4. Seeding (starter data)

Seeds fill tables with shared starter data (roles, default admin, breeds). Migrations create the tables; **seeds never run on their own**.

### 4a. Apply the seeds

Do this after the tables exist:

```
npx prisma migrate deploy
npx prisma generate
npx prisma db seed
```

- Run it **again after every `migrate reset`** (reset wipes the data).
- Safe to re-run: seeds skip rows that already exist.
- Pulled a change to `prisma/seed.ts`? Run `npx prisma db seed` again.
- Optional: set `SEED_ADMIN_PASSWORD` in your `.env`. Otherwise the default dev password is used.

| Problem | Fix |
|---|---|
| `Table doesn't exist` | `npx prisma migrate deploy` first |
| `Cannot find module ... generated/prisma` | `npx prisma generate` |
| `tsx: command not found` | `npm install` |
| Duplicate / unique constraint error | Ask the team. Don't edit the seed to "fix" it |

### 4b. Create or edit seeds

Seeds live in **`prisma/seed.ts`**. It's wired up by `seed: "tsx prisma/seed.ts"` in the Prisma config file (`migrations` block).

1. Add your data inside `main()` in `prisma/seed.ts`.
2. Make it **re-runnable** (pick one):

   | Table has | Use |
   |---|---|
   | A unique column (`role_slug`, `username`) | `upsert` on that column |
   | No unique column (breeds, services) | Insert only if `count() === 0` |

   ```ts
   await prisma.tbl_role.upsert({
     where: { role_slug: "admin" },
     update: {},
     create: { role_slug: "admin", role_name: "Admin" },
   });
   ```
3. Seed **parents before children** (e.g. roles before accounts, accounts before admin profiles).
4. Hash passwords with `bcryptjs`. **Never** put real passwords in the seed.
5. Test it: run `npx prisma db seed` **twice**. The second run must not error or duplicate rows.
6. Commit `prisma/seed.ts`, push, tell the team to run `npx prisma db seed`.

**Seed the data everyone needs** (roles, lookup lists, default admin). Keep test/sample data out of the shared seed.

## 5. Quick fixes

| Problem | Fix |
|---|---|
| `Can't reach database server` | Start MySQL in XAMPP |
| `Table doesn't exist` / `Unknown column` | `npx prisma migrate deploy` |
| Prisma Client model errors | `npx prisma generate` |
| `prisma: command not found` | `npm install` |
| Asked to "reset" the database | Say **no**, ask the team |

Want to add or change tables? See **PRISMA_MIGRATIONS.md**.