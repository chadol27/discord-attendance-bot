import { type ChatInputCommandInteraction, type Client, Events, type Message } from "discord.js";

import { formatDate, getYesterday } from "./date.js";
import { getAttendance, setAttendanceWithScore, type AttendanceRecord } from "./database.js";
import { createAttendanceCheckEmbed, createAttendanceEmbed, createNoticeEmbed } from "./embeds.js";

type AttendanceRecordWithoutScore = Omit<AttendanceRecord, "score">;

export function registerAttendanceEvents(client: Client): void {
  client.on(Events.MessageCreate, handleAttendanceMessage);
  client.on(Events.InteractionCreate, async (interaction) => {
    if (!interaction.isChatInputCommand()) {
      return;
    }

    await handleAttendanceCheckCommand(interaction);
  });
}

async function handleAttendanceMessage(message: Message): Promise<void> {
  if (!message.guildId || message.author.bot) {
    return;
  }

  const today = formatDate();
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
        savedAttendance.awardScore,
        savedAttendance.baseScore,
        savedAttendance.hasStreakBonus,
      ),
    ],
  });
}

async function handleAttendanceCheckCommand(interaction: ChatInputCommandInteraction): Promise<void> {
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

  await interaction.reply({ embeds: [createAttendanceCheckEmbed(attendance, formatDate(), targetUser.id)] });
}
