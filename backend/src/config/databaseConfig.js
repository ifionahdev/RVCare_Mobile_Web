import "dotenv/config";

function fromUrl(url) {
  if (!url) return null;

  try {
    const parsed = new URL(url);
    return {
      host: parsed.hostname,
      port: Number(parsed.port || 3306),
      user: decodeURIComponent(parsed.username),
      password: decodeURIComponent(parsed.password),
      database: decodeURIComponent(parsed.pathname.replace(/^\//, "")),
    };
  } catch {
    return null;
  }
}

export function getDatabaseConfig() {
  const urlConfig =
    fromUrl(process.env.DATABASE_URL) ??
    fromUrl(process.env.MYSQL_URL);

  return {
    host:
      process.env.DB_HOST ??
      process.env.MYSQLHOST ??
      urlConfig?.host ??
      "127.0.0.1",
    port:
      Number(process.env.DB_PORT ?? process.env.MYSQLPORT) ||
      urlConfig?.port ||
      3306,
    user:
      process.env.DB_USER ??
      process.env.MYSQLUSER ??
      urlConfig?.user ??
      "root",
    password:
      process.env.DB_PASSWORD ??
      process.env.MYSQLPASSWORD ??
      urlConfig?.password ??
      "",
    database:
      process.env.DB_NAME ??
      process.env.MYSQLDATABASE ??
      process.env.MYSQL_DATABASE ??
      urlConfig?.database ??
      "db_rvcare_mobile",
  };
}
