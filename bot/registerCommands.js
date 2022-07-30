const { Client, Intents } = require('discord.js');
const client = new Client({ intents: 32727 });

const commands = []

client.on("ready", async () => {
  console.log(`Logged in as ${client.user.tag}.`);
  
  for (let command of commands) {
    const registeredCommand = await client.application.commands.create(command); // register the command
    console.log(`✅ Created /${registeredCommand.name}`);
  };

  client.destroy(); // end script
});

client.login(process.env["TOKEN"]);
