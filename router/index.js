/*---------------------------------------------------------------------------------------------
 *  Copyright (c) VLC Community. All rights reserved.
 *  VLC Community is student-run and not school-sanctioned, and is not in any way affiliated with or endorsed by the VLC. 
 *  The VLC name, logo, and all other branding are property of the Virtual Learning Center.
 *--------------------------------------------------------------------------------------------*/

const express = require("express");
const router = express.Router();

router.use(require("./redirects"));

const { statesCollection, studentsCollection } = require("../index");
const {
  OAuth2Client
} = require("google-auth-library");
const googleClient = new OAuth2Client(process.env["GOOGLE_SECRET"]);
const fetch = require("node-fetch");

// index & Discord sign in 
router.get("/", (req, res) => {
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
router.post("/", (req, res) => {
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

module.exports = router;