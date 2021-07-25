import { Client, Collection, Intents, MessageEmbed, TextChannel, User } from "discord.js";
import { Commands, Command } from "../types/Command";

const DEFAULT_COOLDOWN_DURATION = 15 * 60 * 1000; // 15 minute cooldown

export type MessageTransmissionOptions = {
  cooldownDuration?: number,
  cooldownKey?: string,
  channel?: string,
  users?: User[]
}

export type DiscordMessengerOptions = {
  defaultChannelName: string,
  commandPrefix: string,
  token: string,
  developerMode: boolean
}

class DiscordMessenger {

  private static discordMessenger: DiscordMessenger;

  public static getMessenger(options?: DiscordMessengerOptions) {
    if (!this.discordMessenger) this.discordMessenger = new DiscordMessenger(options);

    if (options) this.discordMessenger.options = options;

    return this.discordMessenger;
  }

  private storedCommands: Collection<string, Command>
  private options?: DiscordMessengerOptions
  private bot?: Client
  private onCooldown: { [key: string]: boolean } = {};

  constructor(options?: DiscordMessengerOptions) {
    this.options = options;
    this.storedCommands = new Collection();
  }

  getBot(commands: Commands = {}) {
    if (!this.bot) this.bot = this.createBot()

    this.setCommands(commands);

    return this.bot;
  }

  private setCommands(commands: Commands) {
    const prefix = this.options?.commandPrefix || "!";
    this.storedCommands = new Collection();

    console.log("Commands: ");
    Object.keys(commands).map((key: string) => {
      const name = commands[key].name.toLocaleLowerCase();
      console.log(prefix + name);
      this.storedCommands.set(prefix + name, commands[key]);
    });
  }

  private createBot() {
    const bot = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES] });

    bot.login(this.options?.token);

    bot.on("ready", () => {
      console.info(`Logged in as ${bot.user!.tag}!`);
      this.transmitToServers(`${bot.user!.tag} is now operational!`)
      this.transmitDeveloperNotification(`${bot.user!.tag} is now operational!`)
    });

    bot.on("message", (msg) => {
      const args = msg.content.split(/ +/);
      let command = args.shift() || "";
      command = command.toLocaleLowerCase();

      if (!this.storedCommands.has(command)) return;
      console.info(`Executing: ${command}`);

      try {
        const storedCommand = this.storedCommands.get(command) as Command;
        storedCommand.execute(msg, args);
      } catch (error) {
        console.error(error);
        msg.reply("there was an error trying to execute that command!");
      }
    });

    return bot;
  }

  async transmitDeveloperNotification(message: string) {
    // console.log(discordBot.users);
    if (!this.options?.developerMode) return;

    const user = await this.getBot().users.fetch("142090800279453696");
    if (user) await user.send("[Developer Message]\n" + message);
    else console.log(`Unable to find developer to transmit the following message: ${message}`)
  }

  async transmitDiscordNotification(
    author: string,
    message: MessageEmbed | string,
    options?: MessageTransmissionOptions
  ) {
    const key = options?.cooldownKey || author + message.toString();

    if (key != "disabled" && this.onCooldown[key] === true) {
      // console.log(key + " on cooldown");
      return;
    }
    this.onCooldown[key] = true;

    setTimeout(() => {
      this.onCooldown[key] = false;
    }, options?.cooldownDuration ?? DEFAULT_COOLDOWN_DURATION);

    // Transmit to users
    if (options?.users) {
      await this.transmitToUsers(message, options.users);
    }

    // Transmit to servers
    await this.transmitToServers(message, options?.channel);
  }

  async transmitToUsers(message: MessageEmbed | string, users: User[]) {
    if (message instanceof MessageEmbed) {
      message = message.url
        ? `[${message.author?.name}] ${message.title}: ${message.url}`
        : message;
    }

    if (this.options?.developerMode) return;

    try {
      for (const user of users) {
        if (message instanceof MessageEmbed) {
          await user.send({ embeds: [message] });
        } else {
          await user.send(message);
        }
      }
    } catch (error) {
      console.log(`Unable to transmit message to servers: ${message}`)
    }
  }

  async transmitToServers(message: MessageEmbed | string, targetChannel?: string) {
    const discordBot = this.getBot();

    for (const [_key, guild] of discordBot.guilds.cache) {
      const channel = guild.channels.cache.find(
        (ch) => {
          if (targetChannel) {
            return ch.name === targetChannel
          } else {
            return ch.name === this.options?.defaultChannelName ?? "general"
          }
        }
      );

      if (channel && channel instanceof TextChannel) {
        // Skip non-developer servers when developer mode is on
        if (
          this.options?.developerMode &&
          !(
            channel.guild.id === "757705063878623343"
          )
        )
          continue;

        if (message instanceof MessageEmbed) {
          message = message.url
            ? `[${message.author?.name}] ${message.title}: ${message.url}`
            : message;
        }

        try {
          if (message instanceof MessageEmbed) {
            await channel.send({ embeds: [message] });
          } else {
            await channel.send(message);
          }
        } catch (error) {
          console.log(`Unable to transmit message to servers: ${message}`)
        }
      }
    }
  }
}

export default DiscordMessenger;
