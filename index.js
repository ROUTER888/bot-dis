require('dotenv').config();
const keepAlive = require('./keep_alive.js');
const { Client, GatewayIntentBits } = require('discord.js');
const { 
    joinVoiceChannel, 
    getVoiceConnection
} = require('@discordjs/voice');

// 1. Khởi chạy Web Server keep-alive (nếu bạn dùng Render/Koyeb)
keepAlive();

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

client.once('clientReady', () => {
    console.log(`Bot đã sẵn sàng! Đăng nhập dưới tên: ${client.user.tag}`);
});

client.on('messageCreate', async message => {
    if (message.author.bot) return;

    // Lệnh gọi bot vào phòng voice và ở lì trong đó: !treo
    if (message.content === '!treo') {
        const voiceChannel = message.member?.voice.channel;

        if (!voiceChannel) {
            return message.reply('Bạn cần vào 1 kênh thoại (Voice Channel) trước!');
        }

        try {
            // Kết nối vào phòng và giữ kết nối vĩnh viễn
            const connection = joinVoiceChannel({
                channelId: voiceChannel.id,
                guildId: voiceChannel.guild.id,
                adapterCreator: voiceChannel.guild.voiceAdapterCreator,
                selfDeaf: true // Tự động tắt tai nghe
            });

            message.reply(`🛋️ Đã vào kênh **${voiceChannel.name}** và treo phòng thành công (ở lại 24/7 không out)!`);
        } catch (error) {
            console.error(error);
            message.reply('Đã có lỗi xảy ra khi tham gia kênh thoại.');
        }
    }

    // Lệnh đuổi bot ra khỏi phòng: !out
    if (message.content === '!out') {
        const connection = getVoiceConnection(message.guild.id);
        if (connection) {
            connection.destroy();
            message.reply('👋 Đã rời kênh thoại.');
        } else {
            message.reply('Bot hiện không có trong kênh thoại nào.');
        }
    }
});

client.login(process.env.DISCORD_TOKEN);
