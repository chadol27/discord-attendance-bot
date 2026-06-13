import { SlashCommandBuilder } from "discord.js";

import type { AppConfig } from "./config.js";

export function createCommands(config: AppConfig) {
  const attendanceCheckCommand = new SlashCommandBuilder()
    .setName("출석확인")
    .setDescription("출석 기록을 확인합니다.")
    .addUserOption((option) =>
      option
        .setName("유저")
        .setDescription("출석 기록을 확인할 유저입니다.")
        .setRequired(false),
    );

  const scoreRankingCommand = new SlashCommandBuilder()
    .setName("점수순위")
    .setDescription("서버 점수 순위를 확인합니다.");

  const scoreGambleCommand = new SlashCommandBuilder()
    .setName("점수도박")
    .setDescription(
      `현재 점수로 도박합니다. (확률: ${formatPercent(config.scoreGamble.minimumSuccessRate)} ~ ${formatPercent(
        config.scoreGamble.maximumSuccessRate,
      )})`,
    )
    .addIntegerOption((option) =>
      option
        .setName("점수")
        .setDescription(
          `도박에 걸 점수입니다. (최소 ${config.scoreGamble.minimumBetScore}, 최대 보유 점수의 ${formatPercent(
            config.scoreGamble.maximumBetScoreRate,
          )})`,
        )
        .setRequired(true),
    );

  return [attendanceCheckCommand, scoreRankingCommand, scoreGambleCommand];
}

function formatPercent(rate: number): string {
  const percent = rate * 100;
  const roundedPercent = Math.round(percent * 10) / 10;

  return `${Number.isInteger(roundedPercent) ? roundedPercent.toFixed(0) : roundedPercent.toFixed(1)}%`;
}
