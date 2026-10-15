
import "dotenv/config";
import bcrypt from "bcryptjs";
import pool from "../config/db.js";

const [
  username,
  password,
  firstName,
  lastName,
  roleSlug,
] = process.argv.slice(2);

const profileTables = {
  admin: "tbl_admin",
  vet: "tbl_veterinarian",
  customer: "tbl_pet_owner",
};

const createAccount = async () => {
  if (
    !username ||
    !password ||
    !firstName ||
    !lastName ||
    !profileTables[roleSlug]
  ) {
    console.error(
      'Usage: npm run create:account -- <username> <password> "<First>" "<Last>" <admin|vet|customer>'
    );
    process.exitCode = 1;
    return;
  }

  if (
    username.length > 50 ||
    password.length < 8 ||
    firstName.length > 255 ||
    lastName.length > 255
  ) {
    console.error("Invalid username, password or name length.");
    process.exitCode = 1;
    return;
  }

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [roles] = await connection.execute(
      "SELECT role_id FROM tbl_role WHERE role_slug = ? LIMIT 1",
      [roleSlug]
    );

    if (!roles.length) {
      throw new Error(`Role "${roleSlug}" does not exist.`);
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const [result] = await connection.execute(
      `INSERT INTO tbl_account
        (role_id, username, password, first_name, last_name)
       VALUES (?, ?, ?, ?, ?)`,
      [
        roles[0].role_id,
        username,
        passwordHash,
        firstName,
        lastName,
      ]
    );

    const table = profileTables[roleSlug];

    await connection.execute(
      `INSERT INTO ${table} (account_id, is_deleted)
       VALUES (?, 0)`,
      [result.insertId]
    );

    await connection.commit();

    console.log("Account created successfully.");
    console.log(`Account ID: ${result.insertId}`);
    console.log(`Username: ${username}`);
    console.log(`Role: ${roleSlug}`);
  } catch (error) {
    await connection.rollback();

    console.error("Account creation failed:", error.message);
    process.exitCode = 1;
  } finally {
    connection.release();
  }
};

try {
  await createAccount();
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
} finally {
  await pool.end();
}
