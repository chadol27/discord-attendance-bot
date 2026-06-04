import { SlashCommandBuilder } from "discord.js";

export const attendanceCheckCommand = new SlashCommandBuilder()
  .setName("출석확인")
  .setDescription("출석 기록을 확인합니다.")
  .addUserOption((option) =>
    option
      .setName("유저")
      .setDescription("출석 기록을 확인할 유저입니다.")
      .setRequired(false),
  );

export const scoreRankingCommand = new SlashCommandBuilder()
  .setName("점수순위")
  .setDescription("서버 점수 순위를 확인합니다.");

export const commands = [attendanceCheckCommand, scoreRankingCommand];
