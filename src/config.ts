import { readFile } from "node:fs/promises";

export type AppConfig = {
  attendanceDayStartHour: number;
  attendanceScore: AttendanceScoreConfig;
  scoreGamble: ScoreGambleConfig;
};

type AttendanceScoreConfig = {
  initialBaseScore: number;
  sameDayBaseScoreRate: number;
  minimumStreakBonusRate: number;
  maximumStreakBonusRate: number;
  maximumStreakBonusRateDays: number;
};

type ScoreGambleConfig = {
  minimumBetScore: number;
  maximumBetScoreRate: number;
  minimumSuccessRate: number;
  maximumSuccessRate: number;
  maximumRateStreakDays: number;
  delayMilliseconds: number;
};

const defaultConfig: AppConfig = {
  attendanceDayStartHour: 8,
  attendanceScore: {
    initialBaseScore: 100,
    sameDayBaseScoreRate: 0.9,
    minimumStreakBonusRate: 0,
    maximumStreakBonusRate: 0.5,
    maximumStreakBonusRateDays: 30,
  },
  scoreGamble: {
    minimumBetScore: 10,
    maximumBetScoreRate: 0.5,
    minimumSuccessRate: 0.4,
    maximumSuccessRate: 0.48,
    maximumRateStreakDays: 16,
    delayMilliseconds: 3_000,
  },
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
  const attendanceScore = (config.attendanceScore ?? {}) as Partial<AttendanceScoreConfig>;
  const scoreGamble = (config.scoreGamble ?? {}) as Partial<ScoreGambleConfig>;

  return {
    attendanceDayStartHour: validateIntegerInRange(
      "attendanceDayStartHour",
      config.attendanceDayStartHour,
      defaultConfig.attendanceDayStartHour,
      0,
      23,
    ),
    attendanceScore: {
      initialBaseScore: validatePositiveInteger(
        "attendanceScore.initialBaseScore",
        attendanceScore.initialBaseScore,
        defaultConfig.attendanceScore.initialBaseScore,
      ),
      sameDayBaseScoreRate: validateRate(
        "attendanceScore.sameDayBaseScoreRate",
        attendanceScore.sameDayBaseScoreRate,
        defaultConfig.attendanceScore.sameDayBaseScoreRate,
      ),
      minimumStreakBonusRate: validateRate(
        "attendanceScore.minimumStreakBonusRate",
        attendanceScore.minimumStreakBonusRate,
        defaultConfig.attendanceScore.minimumStreakBonusRate,
      ),
      maximumStreakBonusRate: validateRate(
        "attendanceScore.maximumStreakBonusRate",
        attendanceScore.maximumStreakBonusRate,
        defaultConfig.attendanceScore.maximumStreakBonusRate,
      ),
      maximumStreakBonusRateDays: validatePositiveInteger(
        "attendanceScore.maximumStreakBonusRateDays",
        attendanceScore.maximumStreakBonusRateDays,
        defaultConfig.attendanceScore.maximumStreakBonusRateDays,
      ),
    },
    scoreGamble: {
      minimumBetScore: validatePositiveInteger(
        "scoreGamble.minimumBetScore",
        scoreGamble.minimumBetScore,
        defaultConfig.scoreGamble.minimumBetScore,
      ),
      maximumBetScoreRate: validateRate(
        "scoreGamble.maximumBetScoreRate",
        scoreGamble.maximumBetScoreRate,
        defaultConfig.scoreGamble.maximumBetScoreRate,
      ),
      minimumSuccessRate: validateRate(
        "scoreGamble.minimumSuccessRate",
        scoreGamble.minimumSuccessRate,
        defaultConfig.scoreGamble.minimumSuccessRate,
      ),
      maximumSuccessRate: validateRate(
        "scoreGamble.maximumSuccessRate",
        scoreGamble.maximumSuccessRate,
        defaultConfig.scoreGamble.maximumSuccessRate,
      ),
      maximumRateStreakDays: validatePositiveInteger(
        "scoreGamble.maximumRateStreakDays",
        scoreGamble.maximumRateStreakDays,
        defaultConfig.scoreGamble.maximumRateStreakDays,
      ),
      delayMilliseconds: validateNonNegativeInteger(
        "scoreGamble.delayMilliseconds",
        scoreGamble.delayMilliseconds,
        defaultConfig.scoreGamble.delayMilliseconds,
      ),
    },
  };
}

function validateIntegerInRange(
  name: string,
  value: unknown,
  defaultValue: number,
  minimum: number,
  maximum: number,
): number {
  if (value === undefined) {
    return defaultValue;
  }

  if (typeof value !== "number" || !Number.isInteger(value) || value < minimum || value > maximum) {
    throw new Error(`config.json ${name} must be an integer between ${minimum} and ${maximum}.`);
  }

  return value;
}

function validatePositiveInteger(name: string, value: unknown, defaultValue: number): number {
  if (value === undefined) {
    return defaultValue;
  }

  if (typeof value !== "number" || !Number.isInteger(value) || value < 1) {
    throw new Error(`config.json ${name} must be a positive integer.`);
  }

  return value;
}

function validateNonNegativeInteger(name: string, value: unknown, defaultValue: number): number {
  if (value === undefined) {
    return defaultValue;
  }

  if (typeof value !== "number" || !Number.isInteger(value) || value < 0) {
    throw new Error(`config.json ${name} must be a non-negative integer.`);
  }

  return value;
}

function validateRate(name: string, value: unknown, defaultValue: number): number {
  if (value === undefined) {
    return defaultValue;
  }

  if (typeof value !== "number" || value < 0 || value > 1) {
    throw new Error(`config.json ${name} must be a number between 0 and 1.`);
  }

  return value;
}
