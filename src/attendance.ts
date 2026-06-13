import { type ChatInputCommandInteraction, type Client, Events, type Message } from "discord.js";

import type { AppConfig } from "./config.js";
import { getAttendanceDate, getYesterday } from "./date.js";
import {
  applyScoreGamble,
  getAttendance,
  getScoreRanking,
  setAttendanceWithScore,
  type AttendanceRecord,
} from "./database.js";
import {
  createAttendanceCheckEmbed,
  createAttendanceEmbed,
  createNoticeEmbed,
  createScoreGamblePendingEmbed,
  createScoreGambleResultEmbed,
  createScoreRankingEmbed,
} from "./embeds.js";

type AttendanceRecordWithoutScore = Omit<AttendanceRecord, "score">;
const minimumScoreGambleSuccessRate = 0.4;
const maximumScoreGambleSuccessRate = 0.48;
const maximumScoreGambleRateStreakDays = 16;
const scoreGambleDelayMilliseconds = 3_000;

export function registerAttendanceEvents(client: Client, config: AppConfig): void {
  client.on(Events.MessageCreate, (message) => {
    void handleAttendanceMessage(message, config);
  });
  client.on(Events.InteractionCreate, async (interaction) => {
    if (!interaction.isChatInputCommand()) {
      return;
    }

    await handleAttendanceCheckCommand(interaction, config);
  });
}

async function handleAttendanceMessage(message: Message, config: AppConfig): Promise<void> {
  if (!message.guildId || message.author.bot) {
    return;
  }

  const today = getAttendanceDate(new Date(), config.attendanceDayStartHour);
  const yesterday = getYesterday(today);
  const guildId = message.guildId;
  const memberId = message.author.id;
  const existingAttendance = await getAttendance(guildId, memberId);

  if (existingAttendance?.last_check === today) {
    return;
  }

  const nextAttendance: AttendanceRecordWithoutScore = existingAttendance
    ? {
        last_check: today,
        check_start_date: existingAttendance.check_start_date,
        check_count: existingAttendance.check_count + 1,
        in_a_row: existingAttendance.last_check === yesterday ? existingAttendance.in_a_row + 1 : 1,
      }
    : {
        last_check: today,
        check_start_date: today,
        check_count: 1,
        in_a_row: 1,
      };

  const savedAttendance = await setAttendanceWithScore(guildId, memberId, nextAttendance, today);

  await message.reply({
    embeds: [
      createAttendanceEmbed(
        savedAttendance.record,
        today,
        memberId,
        savedAttendance.awardScore,
        savedAttendance.baseScore,
        savedAttendance.hasStreakBonus,
      ),
    ],
  });
}

async function handleAttendanceCheckCommand(interaction: ChatInputCommandInteraction, config: AppConfig): Promise<void> {
  if (interaction.commandName === "점수순위") {
    await handleScoreRankingCommand(interaction);
    return;
  }

  if (interaction.commandName === "점수도박") {
    await handleScoreGambleCommand(interaction);
    return;
  }

  if (interaction.commandName !== "출석확인") {
    return;
  }

  if (!interaction.guildId) {
    await interaction.reply({
      embeds: [createNoticeEmbed("출석 기록", "서버에서만 확인 가능")],
    });
    return;
  }

  const targetUser = interaction.options.getUser("유저") ?? interaction.user;
  const attendance = await getAttendance(interaction.guildId, targetUser.id);

  if (!attendance) {
    await interaction.reply({
      embeds: [createNoticeEmbed("출석 기록", `<@${targetUser.id}> 출석 기록 없음`)],
    });
    return;
  }

  await interaction.reply({
    embeds: [createAttendanceCheckEmbed(attendance, getAttendanceDate(new Date(), config.attendanceDayStartHour), targetUser.id)],
  });
}

async function handleScoreRankingCommand(interaction: ChatInputCommandInteraction): Promise<void> {
  if (!interaction.guildId) {
    await interaction.reply({
      embeds: [createNoticeEmbed("점수 순위", "서버에서만 확인 가능")],
    });
    return;
  }

  const ranking = await getScoreRanking(interaction.guildId);

  if (ranking.length === 0) {
    await interaction.reply({
      embeds: [createNoticeEmbed("점수 순위", "출석 기록 없음")],
    });
    return;
  }

  await interaction.reply({ embeds: [createScoreRankingEmbed(ranking)] });
}

async function handleScoreGambleCommand(interaction: ChatInputCommandInteraction): Promise<void> {
  if (!interaction.guildId) {
    await interaction.reply({
      embeds: [createNoticeEmbed("점수 도박", "서버에서만 가능")],
    });
    return;
  }

  const betScore = interaction.options.getInteger("점수", true);

  if (betScore < 10) {
    await interaction.reply({
      embeds: [createNoticeEmbed("점수 도박", "최소 베팅 점수는 10점")],
    });
    return;
  }

  const attendance = await getAttendance(interaction.guildId, interaction.user.id);

  if (!attendance) {
    await interaction.reply({
      embeds: [createNoticeEmbed("점수 도박", "출석 기록 없음")],
    });
    return;
  }

  if (attendance.score < betScore) {
    await interaction.reply({
      embeds: [createNoticeEmbed("점수 도박", `보유 점수 부족 (${attendance.score}점)`)],
    });
    return;
  }

  const successRate = calculateScoreGambleSuccessRate(attendance.in_a_row);

  await interaction.reply({
    embeds: [createScoreGamblePendingEmbed(interaction.user.id, betScore, successRate)],
  });

  await delay(scoreGambleDelayMilliseconds);

  const isSuccess = Math.random() < successRate;
  const result = await applyScoreGamble(interaction.guildId, interaction.user.id, betScore, isSuccess);

  if (!result) {
    await interaction.editReply({
      embeds: [createNoticeEmbed("점수 도박", "점수 처리 실패")],
    });
    return;
  }

  await interaction.editReply({
    embeds: [createScoreGambleResultEmbed(result, interaction.user.id, successRate)],
  });
}

function calculateScoreGambleSuccessRate(inARow: number): number {
  const streakDays = Math.min(Math.max(inARow, 1), maximumScoreGambleRateStreakDays);
  const progress = (streakDays - 1) / (maximumScoreGambleRateStreakDays - 1);

  return minimumScoreGambleSuccessRate + (maximumScoreGambleSuccessRate - minimumScoreGambleSuccessRate) * progress;
}

function delay(milliseconds: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, milliseconds);
  });
}
