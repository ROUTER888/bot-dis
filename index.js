require('dotenv').config();
const keepAlive = require('./keep_alive.js');
const { Client, GatewayIntentBits } = require('discord.js');
const { 
    joinVoiceChannel, 
    createAudioPlayer, 
    createAudioResource, 
    AudioPlayerStatus, 
    NoSubscriberBehavior,
    getVoiceConnection
} = require('@discordjs/voice');

// 1. Khởi chạy Web Server giữ bot online 24/7
keepAlive();

// 2. Khởi tạo Discord Client
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

// 3. Danh sách URL Stream Lofi Radio trực tiếp 24/7 chất lượng cao
const LOFI_STREAMS = [
    'https://stream.zeno.fm/f3wvbbqmdg8uv', // Lofi Hip Hop
    'https://stream.zeno.fm/0r0xa792kwzuv', // Lofi Chill/Relax
];

const LOFI_STREAM_URL = LOFI_STREAMS[0];

// 4. Hàm phát nhạc Lofi vào kênh thoại
function playLofi(connection) {
    const player = createAudioPlayer({
        behaviors: {
            noSubscriber: NoSubscriberBehavior.Play
        }
    });

    const resource = createAudioResource(LOFI_STREAM_URL, {
        inlineVolume: true
    });

    // Đặt âm lượng mặc định 80% (tránh bị rè)
    if (resource.volume) {
        resource.volume.setVolume(0.8);
    }

    player.play(resource);
    connection.subscribe(player);

    // Tự động phát lại nếu stream ngắt
    player.on(AudioPlayerStatus.Idle, () => {
        console.log('Stream bị ngắt, đang kết nối lại...');
        setTimeout(() => playLofi(connection), 3000);
    });

    player.on('error', error => {
        console.error('Lỗi Audio Player:', error.message);
        setTimeout(() => playLofi(connection), 3000);
    });
}

// 5. Sự kiện khi bot sẵn sàng (Đã sửa lại clientReady để không báo warning)
client.once('clientReady', () => {
    console.log(`Bot đã sẵn sàng! Đăng nhập dưới tên: ${client.user.tag}`);
});

// 6. Xử lý các lệnh từ người dùng
client.on('messageCreate', async message => {
    if (message.author.bot) return;

    // Lệnh phát nhạc: !lofi
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
                selfDeaf: true // Tắt tai nghe bot để tiết kiệm băng thông
            });

            playLofi(connection);
            message.reply(`🎵 Đã tham gia kênh **${voiceChannel.name}** và bắt đầu phát Lofi 24/7!`);
        } catch (error) {
            console.error(error);
            message.reply('Đã có lỗi xảy ra khi tham gia kênh thoại.');
        }
    }

    // Lệnh ngắt nhạc và rời kênh: !stop
    if (message.content === '!stop') {
        const connection = getVoiceConnection(message.guild.id);
        if (connection) {
            connection.destroy();
            message.reply('👋 Đã dừng phát và rời kênh thoại.');
        } else {
            message.reply('Bot hiện không có trong kênh thoại nào.');
        }
    }
});

// 7. Đăng nhập Bot
client.login(process.env.DISCORD_TOKEN);
