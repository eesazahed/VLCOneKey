/*---------------------------------------------------------------------------------------------
 *  Copyright (c) VLC Community. All rights reserved.
 *  VLC Community is student-run and not school-sanctioned, and is not in any way affiliated with or endorsed by the VLC. 
 *  The VLC name, logo, and all other branding are property of the Virtual Learning Center.
 *--------------------------------------------------------------------------------------------*/

// Discord imports

const {
  Client,
  Intents,
  Permissions
} = require("discord.js");

// Express imports

const express = require("express");
const bodyParser = require("body-parser");
const {
  OAuth2Client
} = require("google-auth-library");
const googleClient = new OAuth2Client(process.env["GOOGLE_SECRET"]);
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
  if (err) {
      console.log(`❌ Failed to connect to MongoDB.`);
      console.log(err);
  }
  console.log("✅ Connected to MongoDB.");
});

// Mongo Collections

const studentsDB = mongoDB.db("StudentsDB");
const studentsCollection = studentsDB.collection("Students");
const guildsCollection = studentsDB.collection("Guilds");
const statesCollection = studentsDB.collection("States");

// Discord

const discordClient = new Client({
  intents: 32727,
});

discordClient.login(process.env["TOKEN"]);

// EXPORTS

module.exports = {
  discordClient: discordClient,
  studentsCollection: studentsCollection,
  guildsCollection: guildsCollection
};

const globals = require('./bot/globals');
module.exports.globals = globals;

// Discord Event Listeners
discordClient.on("debug", (e) => {
  if (e.substr(6, 3) == "429") { // discord ban/ratelimit
    exec("kill 1");
  };
});

discordClient.once("ready", async() => {
  console.log("✅ Connected to Discord.");

  discordClient.user.setActivity({
    'name': `${await studentsCollection.countDocuments()} verified VLCers!`,
    'type': 3
  });
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

const userVerify = require("./bot/events/userVerify");
const guildMemberAdd = require("./bot/events/guildMemberAdd");
const guildMemberUpdate = require("./bot/events/guildMemberUpdate");

discordClient.on("guildMemberAdd", (member) => {
  guildMemberAdd(member);
});
discordClient.on("guildMemberUpdate", (oldMember, newMember) => {
  guildMemberUpdate(oldMember, newMember);
});

console.log("✅ Activated event listeners for Discord.");

// Express

const app = express();

app.set("view engine", "ejs");
app.set("views", __dirname + "/views");
app.use(express.static(__dirname + "/public"));
app.use(bodyParser.json());


// index & Discord sign in 
app.get("/", (req, res) => {
  (async() => {
    let error, verified;

    // if discord oauth code
    if (req.query.code) {
      const state = await statesCollection.findOne({ state: req.query.state });

      // verify state
      if (!state) {
        error = "Missing or invalid state";
      } 

      else {
        // get oauth token from discord using code
        let response = await fetch("https://discord.com/api/oauth2/token", {
          method: "POST",
          body: new URLSearchParams({
            client_id: "919271957051105311",
            client_secret: process.env["CLIENT_SECRET"],
            grant_type: "authorization_code",
            code: req.query.code,
            redirect_uri: "https://vlconekey.com",
          }).toString(),
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
        });

        // json response
        let data = await response.json();
        if (!data.access_token) {
          error = "Invalid Discord OAuth token";
        } 
        
        else {
          // fetch discord ID from api
          response = await fetch("https://discord.com/api/users/@me", {
            headers: {
              Authorization: `Bearer ${data.access_token}`,
            },
          });
          data = await response.json();

          // check if discord already verified
          discordInDB = await studentsCollection.findOne({
            _id: data.id
          });
          if (discordInDB) {
            error = `${data.username}#${data.discriminator} already verified as ${emailInDB.email}!`;
          } 
          
          else {
            // Verification is completed
            try {
              studentsCollection.insertOne({
                _id: data.id,
                name: state.name,
                email: state.email,
                timestamp: Date.now(),
              });
              userVerify(data.id, state.name);
              console.log(`🔓 Verified ${data.id} as ${state.name}.`);
            } catch (error) {
              console.log(`❌ Failed to verify ${data.id} as ${state.name}.`);
              globals.error(`Failed to verify ${data.id} as ${state.name}.`)
            }
            verified = true;
            
            // delete all previous user states
            statesCollection.deleteMany({ email: state.email }); 
          };
        };
      };

      if (error) {
        res.statusCode = 405;
      };
    };

    res.render("index", {
      discordCompleted: verified,
      error: error,
    });
  })();
});

// Google Sign In
app.post("/", (req, res) => {
  // if missing ID token
  if (!req.body.token) { 
    res.statusCode = 405;
    return res.send("Missing token");
  }
  
  const verify = async () => {
    // verify legitimacy of ID token
    const ticket = await googleClient.verifyIdToken({
      idToken: req.body.token,
      audience: process.env["GOOGLE_SECRET"],
    });

    // get user payload
    const payload = ticket.getPayload();
    if (payload.hd !== "virtuallearning.ca") {
      res.statusCode = 405;
      return res.send("You must sign in with your VLC (@virtuallearning.ca) account.");
    };

    // if already verified
    emailInDB = await studentsCollection.findOne({
      email: payload.email
    });
    if (emailInDB) {
      // fetch discord user through api
       const response = await fetch(`https://discord.com/api/v9/users/${emailInDB._id}`, {
          headers: {
            Authorization: `Bot ${process.env['TOKEN']}`,
          },
        }); 

      if (response.status != 200) {
        exec("kill 1");
        res.sendStatus(500);
      };
      
      const user = await response.json(); 
      
      return res.status(405).send(`${emailInDB.email} already verified as ${user.username}#${user.discriminator}! If you have lost access to your old Discord account and would like to verify with a new one, please contact <a href=\"https://vlconekey.com/discord\">OneKey Support</a>.`);
    };

    // generate random state
    const state = Math.random().toString(36).substr(2, 5);
    await statesCollection.insertOne({
      email: payload.email,
      name: payload.name,
      state: state,
    });

    // send discord oauth with state
    res.send(`https://discord.com/oauth2/authorize?client_id=919271957051105311&response_type=code&scope=identify&state=${state}`);
  }

  verify(); // call async function
});

app.get("/discordstatus", (req, res) => {
  fetch("https://discord.com/api/users/@me", {
    headers: {
      Authorization: `Bot ${process.env['TOKEN']}`,
    },
  }).then(response => {
    res.sendStatus(response.status);
    
    if (response.status != 200) {
      exec("kill 1");
    };
  });
});

// VLC OneKey notion
app.get("/info", (_req, res) => {
  res.redirect("https://vlccommunity.notion.site/VLC-OneKey-4dc05c574d27492a907865fe1d02502a");
});

// Uptimerobot status
app.get("/status", (_req, res) => {
  res.redirect("https://stats.uptimerobot.com/XVl3Gu41AL");
});

// Terms & Conditions
app.get("/terms", (_req, res) => {
  res.redirect("https://vlccommunity.notion.site/VLC-OneKey-Terms-and-Conditions-53d53468331d4f74bc1f0d358a8810d5");
});

// VLC OneKey Discord Server
app.get("/discord", (_req, res) => {
  res.redirect("https://discord.gg/aGrNsyHPTT");
});

// Replit
app.get("/code", (_req, res) => {
  res.redirect("https://replit.com/@notyusufr/VLCOneKey");
});

app.listen(8080, () => {
  console.log("✅ OneKey online: https://vlconekey.com");
});
