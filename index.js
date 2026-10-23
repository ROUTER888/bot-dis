require('dotenv').config();
const keepAlive = require('./keep_alive.js');

// Gọi hàm khởi chạy web server
keepAlive();

// ... các đoạn code bot Discord tiếp theo ...
require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');
const { 
    joinVoiceChannel, 
    createAudioPlayer, 
    createAudioResource, 
    AudioPlayerStatus, 
    VoiceConnectionStatus,
    NoSubscriberBehavior
} = require('@discordjs/voice');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

// Danh sách URL Stream Lofi Radio trực tiếp (24/7 MP3/AAC streams)
const LOFI_STREAMS = [
    'https://stream.zeno.fm/f3wvbbqmdg8uv', // Lofi Hip Hop Radio
    'https://play.streamafrica.net/lofi', // Lofi Chill
];

// Lấy 1 luồng stream
const LOFI_STREAM_URL = LOFI_STREAMS[0];

function playLofi(connection) {
    const player = createAudioPlayer({
        behaviors: {
            noSubscriber: NoSubscriberBehavior.Play
        }
    });

    const resource = createAudioResource(LOFI_STREAM_URL);
    player.play(resource);
    connection.subscribe(player);

    // Tự động phát lại nếu kết nối stream bị ngắt
    player.on(AudioPlayerStatus.Idle, () => {
        console.log('Stream bị ngắt, đang kết nối lại...');
        setTimeout(() => playLofi(connection), 3000);
    });

    player.on('error', error => {
        console.error('Lỗi Audio Player:', error.message);
        setTimeout(() => playLofi(connection), 3000);
    });
}

client.once('ready', () => {
    console.log(`Bot đã sẵn sàng! Đăng nhập dưới tên: ${client.user.tag}`);
});

client.on('messageCreate', async message => {
    if (message.author.bot) return;

    // Lệnh đệm vào phòng thoại: !lofi
    if (message.content === '!lofi') {
        const voiceChannel = message.member?.voice.channel;

        if (!voiceChannel) {
            return message.reply('Bạn cần vào 1 kênh thoại (Voice Channel) trước!');
        }

        try {
            const connection = joinVoiceChannel({
                channelId: voiceChannel.id,
                guildId: voiceChannel.guild.id,
                adapterCreator: voiceChannel.guild.voiceAdapterCreator,
                selfDeaf: true // Tự động tắt tai nghe bot để tiết kiệm băng thông
            });

            playLofi(connection);
            message.reply(`🎵 Đã tham gia kênh **${voiceChannel.name}** và bắt đầu phát Lofi 24/7!`);
        } catch (error) {
            console.error(error);
            message.reply('Đã có lỗi xảy ra khi tham gia kênh thoại.');
        }
    }

    // Lệnh cho bot rời phòng: !stop
    if (message.content === '!stop') {
        const { getVoiceConnection } = require('@discordjs/voice');
        const connection = getVoiceConnection(message.guild.id);
        if (connection) {
            connection.destroy();
            message.reply('👋 Đã dừng phát và rời kênh thoại.');
        } else {
            message.reply('Bot hiện không có trong kênh thoại nào.');
        }
    }
});

client.login(process.env.DISCORD_TOKEN);