import { type ChatInputCommandInteraction, type Client, Events, type Message } from "discord.js";

import { formatDate, getYesterday } from "./date.js";
import { getAttendance, setAttendance, type AttendanceRecord } from "./database.js";
import { createAttendanceCheckEmbed, createAttendanceEmbed, createNoticeEmbed } from "./embeds.js";

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

  const nextAttendance: AttendanceRecord = existingAttendance
    ? {
        ...existingAttendance,
        last_check: today,
        check_count: existingAttendance.check_count + 1,
        in_a_row: existingAttendance.last_check === yesterday ? existingAttendance.in_a_row + 1 : 1,
      }
    : {
        last_check: today,
        check_start_date: today,
        check_count: 1,
        in_a_row: 1,
      };

  await setAttendance(guildId, memberId, nextAttendance);
  await message.reply({ embeds: [createAttendanceEmbed(nextAttendance, today)] });
}

async function handleAttendanceCheckCommand(interaction: ChatInputCommandInteraction): Promise<void> {
  if (interaction.commandName !== "출석확인") {
    return;
  }

  if (!interaction.guildId) {
    await interaction.reply({
      embeds: [createNoticeEmbed("출석 기록", "서버에서만 출석 기록을 확인할 수 있어.")],
    });
    return;
  }

  const targetUser = interaction.options.getUser("유저") ?? interaction.user;
  const attendance = await getAttendance(interaction.guildId, targetUser.id);

  if (!attendance) {
    await interaction.reply({
      embeds: [createNoticeEmbed("출석 기록", `<@${targetUser.id}>의 출석 기록이 아직 없어.`)],
    });
    return;
  }

  await interaction.reply({ embeds: [createAttendanceCheckEmbed(attendance, formatDate(), targetUser.id)] });
}
