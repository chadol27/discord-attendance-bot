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

export const scoreGambleCommand = new SlashCommandBuilder()
  .setName("점수도박")
  .setDescription("현재 점수로 도박합니다. (확률: 40% ~ 48(연속 16일 이상))")
  .addIntegerOption((option) =>
    option
      .setName("점수")
      .setDescription("도박에 걸 점수입니다. (최소 10, 최대 보유 점수의 50%)")
      .setRequired(true),
  );

export const commands = [attendanceCheckCommand, scoreRankingCommand, scoreGambleCommand];
