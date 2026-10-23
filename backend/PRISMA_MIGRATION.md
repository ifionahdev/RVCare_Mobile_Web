# Prisma Migrations (making schema changes)

For members who add or change tables. Setup and catching up are in **PRISMA_GUIDE.md**. Run commands in `backend/`.

## QOL Tip: Install official Prisma extension

## Add a table

1. **Pull first**, run `npx prisma migrate deploy`.
2. Edit `prisma/schema.prisma`:
   ```prisma
   model tbl_example {
     example_id Int      @id @default(autoincrement())
     name       String   @db.VarChar(100)
     notes      String?  @db.Text
     created_at DateTime @default(now()) @db.DateTime(0)
   }
   ```
3. Check it:
   ```
   npx prisma format
   npx prisma validate
   ```
4. Create + apply the migration:
   ```
   npx prisma migrate dev --name add_example_table
   ```
5. **Read** `prisma/migrations/<timestamp>_add_example_table/migration.sql`. Only what you intended? (No stray `DROP`.)
6. Commit **schema + migration folder**, push:
   ```
   git add prisma
   git commit -m "Add tbl_example"
   git push
   ```
7. Tell the team to pull and run `migrate deploy`.

## Schema cheat sheet

| Want | Write |
|---|---|
| Primary key | `Int @id @default(autoincrement())` |
| Text (limited) | `String @db.VarChar(100)` |
| Optional column | add `?` → `String?` |
| Default value | `@default(false)` / `@default(now())` |
| Unique column | `@unique` |
| Link to another table | FK column + `@relation(...)` + field on the other model (copy `tbl_pet` ↔ `tbl_pet_owner`) |

Every model **must** have an `@id`, or Prisma ignores it.

## Change an existing table

Edit the model, then `npx prisma migrate dev --name what_changed`.

| Change | Risk |
|---|---|
| Drop column/table | **Deletes data** |
| Rename column | Becomes drop + add, **loses data**. Ask the team first |
| Remove `?` (make required) | Fails if rows have empty values |

## Do / Don't

- **Do** one change per migration, clear `--name`.
- **Do** read the generated SQL before committing.
- **Don't** edit or delete a migration folder after it's pushed. Make a new one.
- **Don't** use `db push` or `db pull` on the shared schema.
- **Don't** edit tables in phpMyAdmin.

## Problems

| Problem | Fix |
|---|---|
| `migrate dev` says **drift**, asks to reset | Someone changed tables outside Prisma. Say **no**. Run `migrate deploy`, ask the team |
| Two people made migrations at once | Pull, `migrate deploy`, ask the team. Don't delete anyone's |
| Unexpected `DROP` in `migration.sql` | Stop. Don't commit. Ask the team |