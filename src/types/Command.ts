import { Message } from "discord.js";

export type Command = {
  name: string;
  description: string;
  execute: (msg: Message, args: string[]) => any;
};

export type Commands = {
  [key: string]: Command;
};