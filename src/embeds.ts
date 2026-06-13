import { EmbedBuilder } from "discord.js";

import { getAttendanceDays } from "./date.js";
import type { AttendanceRecord, ScoreGambleResult, ScoreRankingItem } from "./database.js";

const EMBED_COLORS = {
  success: 0x2ecc71,
  info: 0x3498db,
  warning: 0xf1c40f,
  error: 0xe74c3c,
  neutral: 0x95a5a6,
} as const;

export function createAttendanceEmbed(
  record: AttendanceRecord,
  today: string,
  userId: string,
  awardScore: number,
  baseScore: number,
  hasStreakBonus: boolean,
  streakBonusRate: number,
): EmbedBuilder {
  const attendanceDays = getAttendanceDays(record.check_start_date, today);
  const attendanceRate = (record.check_count / attendanceDays) * 100;
  const streakBonusPercent = formatPercent(streakBonusRate);
  const awardScoreText = hasStreakBonus ? `${awardScore}점 (${baseScore}+${streakBonusPercent})` : `${awardScore}점`;

  return new EmbedBuilder()
    .setTitle("출석 완료")
    .setColor(EMBED_COLORS.success)
    .addFields(
      { name: "대상", value: `<@${userId}>`, inline: false },
      { name: "출석 횟수", value: `${record.check_count}회`, inline: true },
      { name: "출석률", value: `${attendanceRate.toFixed(1)}% (${record.check_count}/${attendanceDays})`, inline: true },
      { name: "연속 출석", value: `${record.in_a_row}일`, inline: true },
      { name: "획득 점수", value: awardScoreText, inline: true },
      { name: "누적 점수", value: `${record.score}점`, inline: true },
    );
}

export function createScoreRankingEmbed(ranking: ScoreRankingItem[]): EmbedBuilder {
  const description = ranking
    .map(
      (item, index) =>
        `${index + 1}. <@${item.memberId}> - ${item.score}점 (${item.checkCount}회, ${item.inARow}일 연속)`,
    )
    .join("\n");

  return new EmbedBuilder()
    .setTitle("점수 순위")
    .setColor(EMBED_COLORS.warning)
    .setDescription(description);
}

export function createScoreGamblePendingEmbed(userId: string, betScore: number, successRate: number): EmbedBuilder {
  return new EmbedBuilder()
    .setTitle("점수 도박")
    .setColor(EMBED_COLORS.neutral)
    .addFields(
      { name: "대상", value: `<@${userId}>`, inline: false },
      { name: "베팅 점수", value: `${betScore}점`, inline: true },
      { name: "성공 확률", value: formatPercent(successRate), inline: true },
      { name: "상태", value: "결과 확인 중", inline: true },
    );
}

export function createScoreGambleLimitEmbed(
  betScore: number,
  minimumBetScore: number,
  maximumBetScore: number,
): EmbedBuilder {
  return new EmbedBuilder()
    .setTitle("점수 도박")
    .setColor(EMBED_COLORS.neutral)
    .setDescription("베팅 점수 범위 초과")
    .addFields(
      { name: "입력 점수", value: `${betScore}점`, inline: true },
      { name: "최소 베팅 점수", value: `${minimumBetScore}점`, inline: true },
      { name: "최대 베팅 점수", value: `${maximumBetScore}점`, inline: true },
    );
}

export function createScoreGambleResultEmbed(result: ScoreGambleResult, userId: string, successRate: number): EmbedBuilder {
  const title = result.isSuccess ? "점수 도박 성공" : "점수 도박 실패";
  const color = result.isSuccess ? EMBED_COLORS.success : EMBED_COLORS.error;
  const changeText = result.scoreChange > 0 ? `+${result.scoreChange}점` : `${result.scoreChange}점`;

  return new EmbedBuilder()
    .setTitle(title)
    .setColor(color)
    .addFields(
      { name: "대상", value: `<@${userId}>`, inline: false },
      { name: "베팅 점수", value: `${result.betScore}점`, inline: true },
      { name: "변동 점수", value: changeText, inline: true },
      { name: "성공 확률", value: formatPercent(successRate), inline: true },
      { name: "누적 점수", value: `${result.record.score}점`, inline: true },
    );
}

export function createAttendanceCheckEmbed(record: AttendanceRecord, today: string, userId: string): EmbedBuilder {
  const attendanceDays = getAttendanceDays(record.check_start_date, today);
  const attendanceRate = (record.check_count / attendanceDays) * 100;

  return new EmbedBuilder()
    .setTitle("출석 기록")
    .setColor(EMBED_COLORS.info)
    .addFields(
      { name: "대상", value: `<@${userId}>`, inline: false },
      { name: "첫 출석일", value: record.check_start_date, inline: true },
      { name: "마지막 출석일", value: record.last_check, inline: true },
      { name: "출석 횟수", value: `${record.check_count}회`, inline: true },
      { name: "출석률", value: `${attendanceRate.toFixed(1)}% (${record.check_count}/${attendanceDays})`, inline: true },
      { name: "연속 출석", value: `${record.in_a_row}일`, inline: true },
      { name: "누적 점수", value: `${record.score}점`, inline: true },
    );
}

export function createNoticeEmbed(title: string, description: string): EmbedBuilder {
  return new EmbedBuilder().setTitle(title).setDescription(description).setColor(EMBED_COLORS.neutral);
}

function formatPercent(rate: number): string {
  const percent = rate * 100;
  const roundedPercent = Math.round(percent * 10) / 10;

  return `${Number.isInteger(roundedPercent) ? roundedPercent.toFixed(0) : roundedPercent.toFixed(1)}%`;
}
