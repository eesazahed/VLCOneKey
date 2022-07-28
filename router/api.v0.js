/*---------------------------------------------------------------------------------------------
 *  Copyright (c) VLC Community. All rights reserved.
 *  VLC Community is student-run and not school-sanctioned, and is not in any way affiliated with or endorsed by the VLC. 
 *  The VLC name, logo, and all other branding are property of the Virtual Learning Center.
 *--------------------------------------------------------------------------------------------*/

const express = require("express");
const router = express.Router();

const fetch = require("node-fetch");
const { studentsCollection } = require("../index");

router.get("/status", async (req, res) => {
  const response = await fetch("https://discord.com/api/users/@me", {
    headers: {
      Authorization: `Bot ${process.env['DISCORD_TOKEN']}`,
    },
  });

  res.sendStatus(response.status);

  if (response.status != 200) {
    exec("kill 1");  // restart repl
  };
});

router.get("/search", async (req, res) => {
  const query = req.body.query || req.query.query; // JSON or URL parameter
  if (!query) {
    res.status(400).send({"errors": ['Missing "query" field in JSON body.']});  // Bad request
  };

  const result = await studentsCollection.find({
    $text: {
      $search: query
    }
  })
  .limit(5) // limit to 4 results
  .sort({
    score: {
      $meta: "textScore"
    }
  });

  res.send(result);
});

router.get("/users/:id", async (req, res) => {
  const user = await studentsCollection.findOne({
    _id: req.params.id
  });
  
  if (!user) {
    res.status(404).send({"errors": ["User not found!"]});
  };

  res.send(user);
});

module.exports = router;