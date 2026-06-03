import { EmbedBuilder } from "discord.js";

import { getAttendanceDays } from "./date.js";
import type { AttendanceRecord } from "./database.js";

export function createAttendanceEmbed(
  record: AttendanceRecord,
  today: string,
  awardScore: number,
  baseScore: number,
  hasStreakBonus: boolean,
): EmbedBuilder {
  const attendanceDays = getAttendanceDays(record.check_start_date, today);
  const attendanceRate = (record.check_count / attendanceDays) * 100;
  const awardScoreText = hasStreakBonus ? `${awardScore}점 (${baseScore}+20%)` : `${awardScore}점`;

  return new EmbedBuilder()
    .setTitle("출석 완료")
    .setColor(0x2ecc71)
    .addFields(
      { name: "출석 횟수", value: `${record.check_count}회`, inline: true },
      { name: "출석률", value: `${attendanceRate.toFixed(1)}% (${record.check_count}/${attendanceDays})`, inline: true },
      { name: "연속 출석", value: `${record.in_a_row}일`, inline: true },
      { name: "획득 점수", value: awardScoreText, inline: true },
      { name: "누적 점수", value: `${record.score}점`, inline: true },
    );
}

export function createAttendanceCheckEmbed(record: AttendanceRecord, today: string, userId: string): EmbedBuilder {
  const attendanceDays = getAttendanceDays(record.check_start_date, today);
  const attendanceRate = (record.check_count / attendanceDays) * 100;

  return new EmbedBuilder()
    .setTitle("출석 기록")
    .setColor(0x3498db)
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
  return new EmbedBuilder().setTitle(title).setDescription(description).setColor(0x95a5a6);
}
