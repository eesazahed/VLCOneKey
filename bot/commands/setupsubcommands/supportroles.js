/*---------------------------------------------------------------------------------------------
 *  Copyright (c) VLC Community. All rights reserved.
 *  VLC Community is student-run and not school-sanctioned, and is not in any way affiliated with or endorsed by the VLC. 
 *  The VLC name, logo, and all other branding are property of the Virtual Learning Center.
 *--------------------------------------------------------------------------------------------*/

const { discordClient, studentsCollection, guildsCollection, globals } = require('../../../index');

module.exports = async function(interaction) {
  const oneKeyRole = await interaction.guild.roles.create({
    'name': 'OneKey Support',
    'permissions': 'ADMINISTRATOR',
    'position': interaction.guild.me.roles.highest.position,
    'mentionable': true,
    'reason': '⚙ VLC OneKey Setup'
  });
  if (interaction.guild.members.cache.has(globals.yusufID)) {
    let yusufMember = await interaction.guild.members.fetch(globals.yusufID);
    yusufMember.roles.add(oneKeyRole);
  }
  if (interaction.guild.members.cache.has(globals.ibrahimID)) { // Yusuf Rahman
    let ibrahimMember = await interaction.guild.members.fetch(globals.ibrahimID);
    ibrahimMember.roles.add(oneKeyRole);
  }
  globals.respond(interaction, true, '', '✅ Successfully added OneKey Support role.');
}