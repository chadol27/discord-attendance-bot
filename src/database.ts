import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

export type AttendanceRecord = {
  last_check: string;
  check_start_date: string;
  check_count: number;
  in_a_row: number;
};

type AttendanceDatabase = Record<string, Record<string, AttendanceRecord>>;

function getRequiredDatabasePath(): string {
  const databasePath = process.env.DB_PATH;

  if (!databasePath) {
    throw new Error("DB_PATH is required.");
  }

  return databasePath;
}

function getDatabasePaths(): {
  databaseDirectoryPath: string;
  databaseFilePath: string;
} {
  const databaseDirectoryPath = getRequiredDatabasePath();

  return {
    databaseDirectoryPath,
    databaseFilePath: join(databaseDirectoryPath, "database.json"),
  };
}

async function ensureDatabaseFile(): Promise<void> {
  const { databaseDirectoryPath, databaseFilePath } = getDatabasePaths();

  await mkdir(databaseDirectoryPath, { recursive: true });

  try {
    await readFile(databaseFilePath, "utf8");
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "ENOENT") {
      await writeFile(databaseFilePath, "{}\n", "utf8");
      return;
    }

    throw error;
  }
}

async function readDatabase(): Promise<AttendanceDatabase> {
  await ensureDatabaseFile();

  const { databaseFilePath } = getDatabasePaths();
  const rawDatabase = await readFile(databaseFilePath, "utf8");

  if (!rawDatabase.trim()) {
    return {};
  }

  return JSON.parse(rawDatabase) as AttendanceDatabase;
}

async function writeDatabase(database: AttendanceDatabase): Promise<void> {
  await ensureDatabaseFile();

  const { databaseFilePath } = getDatabasePaths();
  await writeFile(databaseFilePath, `${JSON.stringify(database, null, 2)}\n`, "utf8");
}

export async function getAttendance(
  guildId: string,
  memberId: string,
): Promise<AttendanceRecord | null> {
  const database = await readDatabase();

  return database[guildId]?.[memberId] ?? null;
}

export async function setAttendance(
  guildId: string,
  memberId: string,
  record: AttendanceRecord,
): Promise<void> {
  const database = await readDatabase();

  database[guildId] ??= {};
  database[guildId][memberId] = record;

  await writeDatabase(database);
}
