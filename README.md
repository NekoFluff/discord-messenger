# How to use
```
const messenger = DiscordMessenger.getMessenger(options);
const bot = messenger.getBot(commands);
bot.on("ready", async () => {
  console.log(`Ready`);
});

messenger.transmitDeveloperNotification("Developer notification");
messenger.transmitDiscordNotification(
  "Author",
  `Discord bot notification`,
  {
    cooldownKey: "disabled", // Typically there is a 15 min cooldown between transmissions with the same author and message or the same Author + Message. Setting to "disabled" disables the cooldown feature.
    users: [DiscordUser1, DiscordUser2]
  }
);
```

