import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

export type AttendanceRecord = {
  last_check: string;
  check_start_date: string;
  check_count: number;
  in_a_row: number;
  score: number;
};

type GuildScore = {
  last_score: number;
  last_calculate: string;
};

type GuildAttendance = {
  score: GuildScore;
  members: Record<string, AttendanceRecord>;
};

type AttendanceDatabase = Record<string, GuildAttendance>;

type AttendanceRecordWithoutScore = Omit<AttendanceRecord, "score">;

export type AttendanceScoreResult = {
  record: AttendanceRecord;
  awardScore: number;
  baseScore: number;
  hasStreakBonus: boolean;
};

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

  return database[guildId]?.members[memberId] ?? null;
}

function getDefaultGuildAttendance(today: string): GuildAttendance {
  return {
    score: {
      last_score: 0,
      last_calculate: today,
    },
    members: {},
  };
}

function calculateBaseScore(score: GuildScore, today: string): number {
  if (score.last_calculate !== today || score.last_score <= 0) {
    return 100;
  }

  return Math.round(score.last_score * 0.9);
}

function calculateAwardScore(baseScore: number, inARow: number): number {
  if (inARow < 5) {
    return baseScore;
  }

  return Math.round(baseScore * 1.2);
}

export async function setAttendanceWithScore(
  guildId: string,
  memberId: string,
  record: AttendanceRecordWithoutScore,
  today: string,
): Promise<AttendanceScoreResult> {
  const database = await readDatabase();

  database[guildId] ??= getDefaultGuildAttendance(today);

  const guildAttendance = database[guildId];
  const baseScore = calculateBaseScore(guildAttendance.score, today);
  const awardScore = calculateAwardScore(baseScore, record.in_a_row);
  const previousScore = guildAttendance.members[memberId]?.score ?? 0;
  const nextRecord = {
    ...record,
    score: previousScore + awardScore,
  };

  guildAttendance.score = {
    last_score: baseScore,
    last_calculate: today,
  };
  guildAttendance.members[memberId] = nextRecord;

  await writeDatabase(database);

  return {
    record: nextRecord,
    awardScore,
    baseScore,
    hasStreakBonus: record.in_a_row >= 5,
  };
}
