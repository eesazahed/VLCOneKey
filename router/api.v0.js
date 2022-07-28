/*---------------------------------------------------------------------------------------------
 *  Copyright (c) VLC Community. All rights reserved.
 *  VLC Community is student-run and not school-sanctioned, and is not in any way affiliated with or endorsed by the VLC. 
 *  The VLC name, logo, and all other branding are property of the Virtual Learning Center.
 *--------------------------------------------------------------------------------------------*/

const express = require("express");
const router = express.Router();

const fetch = require("node-fetch");
const { studentsCollection } = require("../index");

router.get("/docs", (req, res) => {
  res.render("docs");
});

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

router.get("/search", (req, res) => {
  // TODO VALIDATE API TOKEN
  // if (!req.headers("Authorization")) {
  //   res.sendStatus(401);  // Unauthorized
  // };
  
  const query = req.body.name;
  if (!query) {
    res.status(400).send('Missing "id" or "name" field in JSON body.');  // Bad request
  };
});

router.get("/users/:id", (req, res) => {
  const user = await studentsCollection.findOne({
    _id: data.id
  });
  
  if (!user) {
    res.status(404).send("User not found!");
  };

  res.send(user);
})

module.exports = router;