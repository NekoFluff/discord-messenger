import dotenv from "dotenv";
dotenv.config();

import { Client, Collection, MessageEmbed, TextChannel } from "discord.js";
import { Commands, Command } from "@app/types/Command";

class DiscordMessenger {

  private static discordMessenger: DiscordMessenger;

  static getMessenger() {
    if (this.discordMessenger) return this.discordMessenger;
    else this.discordMessenger = new DiscordMessenger();
    return this.discordMessenger;
  }

  private bot?: Client;

  private onCooldown: { [key: string]: boolean } = {};
  private cooldownTimer = 15 * 60 * 1000; // 15 minute cooldown

  getBot(botCommands: Commands = {}) {
    if (this.bot) return this.bot;
    else this.bot = this.createBot(botCommands)
    return this.bot;
  }

  private createBot(botCommands: Commands = {}) {
    const prefix = process.env.BOT_PREFIX || "!";
    const bot = new Client();
    const storedBotCommands = new Collection();

    console.log("Commands: ");
    Object.keys(botCommands).map((key: string) => {
      const name = botCommands[key].name.toLocaleLowerCase();
      console.log(prefix + name);
      storedBotCommands.set(prefix + name, botCommands[key]);
    });

    const TOKEN = process.env.TOKEN;

    bot.login(TOKEN);

    bot.on("ready", () => {
      console.info(`Logged in as ${bot.user!.tag}!`);
      this.transmitToServers(`${bot.user!.tag} is now operational!`, "auto-trader")
      this.transmitDeveloperNotification(`${bot.user!.tag} is now operational!`)
    });

    bot.on("message", (msg) => {
      const args = msg.content.split(/ +/);
      let command = args.shift() || "";
      command = command.toLocaleLowerCase();

      if (!storedBotCommands.has(command)) return;
      console.info(`Executing: ${command}`);

      try {
        const storedCommand = storedBotCommands.get(command) as Command;
        storedCommand.execute(msg, args);
      } catch (error) {
        console.error(error);
        msg.reply("there was an error trying to execute that command!");
      }
    });

    return bot;
  }

  transmitDeveloperNotification(message: string) {
    // console.log(discordBot.users);
    const user = this.getBot().users.cache.get("142090800279453696");
    if (user) user.send("[Developer Message]\n" + message);
    else console.log('Unable to find developer to transmit message to')
  }


  transmitDiscordNotification(
    author: string,
    embed: MessageEmbed | string,
    cooldownKey?: string,
    channel?: string
  ) {
    const key = cooldownKey || author + embed.toString();

    if (cooldownKey != "disabled" && this.onCooldown[key] === true) {
      // console.log(key + " on cooldown");
      return;
    }
    this.onCooldown[key] = true;

    setTimeout(() => {
      this.onCooldown[key] = false;
    }, this.cooldownTimer);

    // Transmit to subscribers
    // transmitToSubscribers(author, embed);

    // Transmit to servers
    this.transmitToServers(embed, channel);
  }

  transmitToServers(embed: MessageEmbed | string, targetChannel?: string) {
    const discordBot = this.getBot();

    for (const [_key, guild] of discordBot.guilds.cache) {
      const channel = guild.channels.cache.find(
        (ch) => {
          if (targetChannel) {
            return ch.name === targetChannel
          } else {
            return ch.name === "coinbase-notifications"
          }
        }
      );
      if (channel && channel.type === "text") {
        // Skip non-developer servers when developer mode is on
        if (
          process.env.DEVELOPER_MODE === "on" &&
          !(
            channel.guild.id === "757705063878623343" ||
            channel.guild.id === "757774890366664774"
          )
        )
          continue;
        if (typeof embed === "string") (channel as TextChannel).send(embed);
        else
          (channel as TextChannel).send(
            embed.url
              ? `[${embed.author?.name}] ${embed.title}: ${embed.url}`
              : embed
          );
      }
    }
  }
}

export default DiscordMessenger;
