# How to use
```
const options = {
  defaultChannelName: process.env.DM_DEFAULT_CHANNEL_NAME || 'general',
  commandPrefix: process.env.DM_COMMAND_PREFIX || "#",
  token: process.env.DM_BOT_TOKEN || "",
  developerMode: process.env.DM_DEVELOPER_MODE === "on"
};
const messenger = DiscordMessenger.getMessenger(options);
const bot = messenger.getBot(commands);
bot.on("ready", async () => {
  console.log(`Ready`);
});

messenger.transmitDeveloperNotification("Developer notification");
messenger.transmitDiscordNotification(
  "Author",
  `Discord bot notification`, // You can also pass a discord embed here.
  {
    cooldownKey: "disabled", // Typically there is a 15 min cooldown between transmissions with the same author and message or the same Author + Message. Setting to "disabled" disables the cooldown feature.
    users: [DiscordUser1, DiscordUser2]
  }
);
```

