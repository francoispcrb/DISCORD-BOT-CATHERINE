module.exports = {
    "name": "voiceStateUpdate",
    async execute(oldState, newState) {
        const targetVoiceChannelId = '1252637467991998524';
        const notificationChannelId = '1383552275556991178';

        // Si l'utilisateur rejoint le salon cible
        if (newState.channelId === targetVoiceChannelId && oldState.channelId !== targetVoiceChannelId) {
            const member = newState.member;

            const notifChannel = await newState.guild.channels.fetch(notificationChannelId);
            if (!notifChannel || !notifChannel.isTextBased()) return;

            notifChannel.send({
            content: `@here <@${member.user.id}> vient de se connecter dans <#1252637467991998524>.`,
            allowedMentions: { parse: ['everyone'] } // autorise la mention @here
            });
        }
    }
}