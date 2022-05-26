/*---------------------------------------------------------------------------------------------
 *  Copyright (c) VLC Community. All rights reserved.
 *  VLC Community is student-run and not school-sanctioned, and is not in any way affiliated with or endorsed by the VLC. 
 *  The VLC name, logo, and all other branding are property of the Virtual Learning Center.
 *--------------------------------------------------------------------------------------------*/

const { discordClient, studentsCollection, guildsCollection, globals } = require('../../index');

module.exports = async function(interaction) {
  const mongoStudent = await studentsCollection.findOne({ '_id': interaction.user.id });

  if (!mongoStudent) {
    await interaction.reply({
      embeds: [{
        'title': `❌ You are not verified.`,
        'description': 'Click `Verify` to verify your identity as a VLC student.',
        'footer': {
          'iconURL': discordClient.user.displayAvatarURL(),
          'text': 'VLC OneKey | Verified once, verified forever.'
        },
        'color': 15548997
      }],
      'components': [{
        'type': 1,
        'components': [{
          'type': 2,
          'label': 'Verify',
          'style': 5,
          'url': 'http://vlconekey.com/'
        }]
      }],
      ephemeral: true 
    });

    return;
  }

  const mongoGuild = await guildsCollection.findOne({ '_id': interaction.guild.id });

  if (!mongoGuild) {
    globals.warn(`Guild settings not configured for **${interaction.guild.name}**.`);
    return;
  }

  const secondaryRole = await interaction.guild.roles.fetch(mongoGuild.secondaryRole);
  await interaction.member.roles.add(mongoGuild.secondaryRole);
  await globals.respond(interaction, true, '✅ Membership role assigned.');
}