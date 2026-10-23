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

// 1. Khởi chạy Web Server keep-alive
keepAlive();

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

// 2. Sử dụng Link stream Lofi chuẩn định dạng MP3 trực tiếp (Rất ổn định)
const LOFI_STREAM_URL = 'https://stream.zeno.fm/f3wvbbqmdg8uv';

function playLofi(connection) {
    const player = createAudioPlayer({
        behaviors: {
            noSubscriber: NoSubscriberBehavior.Play
        }
    });

    // Tạo resource trực tiếp từ URL stream HTTP
    const resource = createAudioResource(LOFI_STREAM_URL, {
        inlineVolume: true
    });

    if (resource.volume) {
        resource.volume.setVolume(1.0); // Âm lượng tối đa 100%
    }

    player.play(resource);
    connection.subscribe(player);

    player.on(AudioPlayerStatus.Idle, () => {
        console.log('Stream kết thúc hoặc mất kết nối, đang phát lại...');
        setTimeout(() => playLofi(connection), 3000);
    });

    player.on('error', error => {
        console.error('Lỗi Audio Player:', error.message);
        setTimeout(() => playLofi(connection), 3000);
    });
}

client.once('clientReady', () => {
    console.log(`Bot đã sẵn sàng! Đăng nhập dưới tên: ${client.user.tag}`);
});

client.on('messageCreate', async message => {
    if (message.author.bot) return;

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
                selfDeaf: true
            });

            playLofi(connection);
            message.reply(`🎵 Đã tham gia kênh **${voiceChannel.name}** và bắt đầu phát Lofi 24/7!`);
        } catch (error) {
            console.error(error);
            message.reply('Đã có lỗi xảy ra khi tham gia kênh thoại.');
        }
    }

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

client.login(process.env.DISCORD_TOKEN);
