/*---------------------------------------------------------------------------------------------
 *  Copyright (c) VLC Community. All rights reserved.
 *  VLC Community is student-run and not school-sanctioned, and is not in any way affiliated with or endorsed by the VLC. 
 *  The VLC name, logo, and all other branding are property of the Virtual Learning Center.
 *--------------------------------------------------------------------------------------------*/

const { discordClient, studentsCollection, guildsCollection, globals } = require('../../../index');

module.exports = async function(interaction) {
  let mongoGuild = await guildsCollection.findOne({ _id: interaction.guild.id });
  let secondaryRole = null;
  if (interaction.options.get('secondaryrole')) { secondaryRole = interaction.options.get('secondaryrole').role; }
  
  if (!mongoGuild) {
    guildsCollection.insertOne({
      _id: interaction.guild.id,
      name: interaction.guild.name,
      verifiedRole: interaction.options.get('verifiedrole').role.id,
      secondaryRole: secondaryRole.id
    });
  } else {
    guildsCollection.updateOne({ _id: interaction.guild.id }, {
      $set: {
        name: interaction.guild.name,
        verifiedRole: interaction.options.get('verifiedrole').role.id,
        secondaryRole: secondaryRole.id
      }
    }); 
  }
  globals.respond(interaction, true, '', '✅ Successfully initialized server.')
}