/*---------------------------------------------------------------------------------------------
 *  Copyright (c) VLC Community. All rights reserved.
 *  VLC Community is student-run and not school-sanctioned, and is not in any way affiliated with or endorsed by the VLC. 
 *  The VLC name, logo, and all other branding are property of the Virtual Learning Center.
 *--------------------------------------------------------------------------------------------*/

const { discordClient, studentsCollection, guildsCollection, globals } = require('../../../index');

module.exports = async function(interaction) {
  try {
    await interaction.channel.send({
      embeds: [{
        'title': interaction.options.getString('title'),
        'description': interaction.options.getString('description'),
        'footer': {
          'iconURL': discordClient.user.displayAvatarURL(),
          'text': 'VLC OneKey | Verified once, verified forever.'
        }, 'color': 2201331
      }], 'components': [{
        'type': 1,
        'components': [
          {
            'type': 2,
            'label': 'Enroll',
            'style': 5,
            'url': interaction.options.getString('link')
          }, {
            'type': 2,
            'label': '✅',
            'style': 3,
            'custom_id': 'clubMemberRole'
          }
        ]
      }]
    });
    globals.respond(interaction, true, '', '✅ Successfully sent membership embed.');
  } catch (err) {
    globals.respond(interaction, false, '❌ Error', `Unable to send membership embed.\n\`\`\`\n${err}\n\`\`\``);
  }
}