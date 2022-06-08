/*---------------------------------------------------------------------------------------------
 *  Copyright (c) VLC Community. All rights reserved.
 *  VLC Community is student-run and not school-sanctioned, and is not in any way affiliated with or endorsed by the VLC. 
 *  The VLC name, logo, and all other branding are property of the Virtual Learning Center.
 *--------------------------------------------------------------------------------------------*/

const express = require("express");
const router = express.Router();

const fetch = require("node-fetch");

router.get("/status", (req, res) => {
  fetch("https://discord.com/api/users/@me", {
    headers: {
      Authorization: `Bot ${process.env['DISCORD_TOKEN']}`,
    },
  }).then(response => {
    res.sendStatus(response.status);
    
    if (response.status != 200) {
      exec("kill 1");
    };
  });
});

module.exports = router;