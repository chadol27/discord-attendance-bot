import { readFile } from "node:fs/promises";

export type AppConfig = {
  attendanceDayStartHour: number;
};

const defaultConfig: AppConfig = {
  attendanceDayStartHour: 8,
};

export async function loadConfig(configPath = "config.json"): Promise<AppConfig> {
  let rawConfig: string;

  try {
    rawConfig = await readFile(configPath, "utf8");
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "ENOENT") {
      return defaultConfig;
    }

    throw error;
  }

  const config = JSON.parse(rawConfig) as Partial<AppConfig>;

  return {
    attendanceDayStartHour: validateAttendanceDayStartHour(config.attendanceDayStartHour),
  };
}

function validateAttendanceDayStartHour(value: unknown): number {
  if (typeof value !== "number" || !Number.isInteger(value) || value < 0 || value > 23) {
    throw new Error("config.json attendanceDayStartHour must be an integer between 0 and 23.");
  }

  return value;
}
