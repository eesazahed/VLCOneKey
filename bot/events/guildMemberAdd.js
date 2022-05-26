/*---------------------------------------------------------------------------------------------
 *  Copyright (c) VLC Community. All rights reserved.
 *  VLC Community is student-run and not school-sanctioned, and is not in any way affiliated with or endorsed by the VLC. 
 *  The VLC name, logo, and all other branding are property of the Virtual Learning Center.
 *--------------------------------------------------------------------------------------------*/

const { discordClient, studentsCollection, guildsCollection, globals } = require('../../index');

module.exports = async function (member) {
  let mongoStudent = await studentsCollection.findOne({ _id: member.id });

  if (mongoStudent == null) return;

  // ======== Sets nickname ========

  try {
    await member.setNickname(mongoStudent.name, '✅ Verified with VLC OneKey.');
  } catch {
    // Cannot change nickname
  }

  // ======== Adds role ========

  let mongoGuild = await guildsCollection.findOne({ '_id': member.guild.id });

  if (mongoGuild == null) {
    globals.warn(`Guild settings not configured for **${member.guild.name}**.`);
    return;
  }
  
  try {
    let verifiedRole = await member.guild.roles.fetch(mongoGuild.verifiedRole);
    await member.roles.add(verifiedRole, '✅ Verified with VLC OneKey.');
  } catch (error) {
    globals.error(`Unable to add verified role to <@${member.user.id}> (\`${member.user.id}\`) in **${member.guild.name}**.\n\`\`\`\n${error}\n\`\`\``);
  }
}