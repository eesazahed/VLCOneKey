/*---------------------------------------------------------------------------------------------
 *  Copyright (c) VLC Community. All rights reserved.
 *  VLC Community is student-run and not school-sanctioned, and is not in any way affiliated with or endorsed by the VLC. 
 *  The VLC name, logo, and all other branding are property of the Virtual Learning Center.
 *--------------------------------------------------------------------------------------------*/

const DEVELOPMENT_MODE = process.env["DEVELOPMENT"];

if (DEVELOPMENT_MODE) {
  require("dotenv").config(); // load ENV variables from .env
}

// Discord imports

const {
  Client,
  Intents,
  Permissions
} = require("discord.js");

// Express imports

const express = require("express");
const bodyParser = require("body-parser");
const fetch = require("node-fetch");
const exec = require('child_process').exec;

// Database Credentials

const {
  MongoClient
} = require("mongodb");

const mongoDB = new MongoClient(process.env["MONGO_URI"] + "myFirstDatabase?retryWrites=true&w=majority", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Connect to Mongo

mongoDB.connect((err) => {
  if (!err) {
    console.log("✅ Connected to MongoDB.");
  } else {
    console.log(`❌ Failed to connect to MongoDB. ${err}`);
  };
});

// Mongo Collections

const studentsDB = mongoDB.db("StudentsDB");
const studentsCollection = studentsDB.collection("Students");
const guildsCollection = studentsDB.collection("Guilds");
const statesCollection = studentsDB.collection("States");

const developerDB = mongoDB.db("DeveloperDB");
const keyCollection = developerDB.collection("Api_Keys");

// Discord

const discordClient = new Client({
  intents: 32727,
});

discordClient.login(process.env["TOKEN"]);

// EXPORTS

module.exports = {
  discordClient: discordClient,
  studentsCollection: studentsCollection,
  guildsCollection: guildsCollection,
  statesCollection: statesCollection,
  keyCollection: keyCollection
};

const globals = require('./bot/globals');
module.exports.globals = globals;

// Discord Event Listeners
discordClient.once("ready", async() => {
  console.log("✅ Connected to Discord.");

  if (!DEVELOPMENT_MODE) {
    discordClient.user.setActivity({
      'name': `${await studentsCollection.countDocuments()} verified VLCers!`,
      'type': 3
    });
  };
});

if (!DEVELOPMENT_MODE) {
  discordClient.on("debug", (e) => {
    if (e.substr(6, 3) == "429") { // discord ban/ratelimit
      exec("kill 1");
    };
  });

  discordClient.on("interactionCreate", async(interaction) => {
    if (interaction.isCommand()) {
      try {
        let executeCommand = require(`./bot/commands/${interaction.commandName}`);
        await executeCommand(interaction);
      } catch (error) {
        console.log(`❌ Unable to execute ${interaction.commandName} command. \n` + error)
      }
    } else if (interaction.isButton()) {
      try {
        let executeButton = require(`./bot/buttons/${interaction.customId}`);
        await executeButton(interaction);
      } catch (error) {
        console.log(`❌ Unable to execute ${interaction.customId} button. \n` + error)
      }
    }
  });

  const guildMemberAdd = require("./bot/events/guildMemberAdd");
  const guildMemberUpdate = require("./bot/events/guildMemberUpdate");
  const guildCreate = require("./bot/events/guildCreate");
  const guildDelete = require("./bot/events/guildDelete");

  discordClient.on("guildMemberAdd", (member) => {
    guildMemberAdd(member);
  });
  discordClient.on("guildMemberUpdate", (oldMember, newMember) => {
    guildMemberUpdate(oldMember, newMember);
  });
  discordClient.on("guildCreate", (guild) => {
    guildCreate(guild);
  });
  discordClient.on("guildDelete", (guild) => {
    guildDelete(guild);
  });

  console.log("✅ Activated event listeners for Discord.");
} else {
  console.log("[!] Ignoring event listeners. (Development Mode)");
}

// Express

const app = express();

app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(bodyParser.json());
app.use(require("./router"));


app.listen(8080, () => {
  if (!DEVELOPMENT_MODE) {
      console.log("✅ OneKey online: https://vlconekey.com");
  } else {
      console.log("✅ Webserver online: http://localhost:8080")
  };
});
