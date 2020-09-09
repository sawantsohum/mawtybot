const Discord = require("discord.js");
const { prefix, token } = require("./config.json");
const ytdl = require("ytdl-core");

const client = new Discord.Client();

const queue = new Map();


client.once("ready", () => {
  console.log("Ready!");
});

client.once("reconnecting", () => {
  console.log("Reconnecting!");
});

client.once("disconnect", () => {
  console.log("Disconnect!");
});

client.on("message", async message => {
  if (message.author.bot) return;
  if (!message.content.startsWith(prefix)) return;

  const serverQueue = queue.get(message.guild.id);

  if (message.content.startsWith(`${prefix}play`)) {
    execute(message, serverQueue);
    return;
  } else if (message.content.startsWith(`${prefix}skip`)) {
    skip(message, serverQueue);
    return;
  } else if (message.content.startsWith(`${prefix}stop`)) {
    stop(message, serverQueue);
    return;
  } else if (message.content.startsWith(`${prefix}volume`)) {
    volume(message, serverQueue);
    return;
  } else if (message.content.startsWith(`${prefix}pause`)) {
    pause(message, serverQueue);
    return;
  } else if (message.content.startsWith(`${prefix}resume`)) {
    resume(message, serverQueue);
    return;
  } else if (message.content.startsWith(`${prefix}list`)) {
    list(message, serverQueue);
    return;
  } else if (message.content.startsWith(`${prefix}mawty`)) {
    mawty(message, serverQueue);
    return;
  } else if (message.content.startsWith(`${prefix}help`)) {
    help(message, serverQueue);
    return;
  }else {
    message.channel.send("You need to enter a valid command!");
  }
});
async function help(message, serverQueue) {
    var commandList = "Full list of commands are \n ~play youtubelink \n ~skip \n ~stop \n ~volume (value 1-100) \n ~pause \n ~resume \n ~list to get the current queue of songs \n ~mawty if you wanna talk to your favorite bro\n";
    return message.chanel.send(commandList);
}
async function mawty(message, serverQueue) {
    var fs = require('fs');
    fs.readFile('sayings.txt', function(err, data) {
        if(err) throw err;
        var array = data.toString().split("\n");
        const random = Math.floor(Math.random() * array.length);
        return message.channel.send(array[random]);
    });
}
async function list(message, serverQueue) {
    if (!serverQueue) message.channel.send('No music is being played rn you wop');
    var songQueueString = "";
    for (songIn of serverQueue.songs) {
        songQueueString += songIn.title +'\n';
    }
    let embed = new Discord.MessageEmbed()
        .setColor('RANDOM')
        .setDescription(`**-=- Music Queue -=-**\n${songQueueString}\n\n🎵 **Currently Playing:** ${serverQueue.songs[0].title}`);

    return message.channel.send(embed);
}
async function resume(message, serverQueue) {
    if (serverQueue && !serverQueue.playing) {
        serverQueue.playing = true;
        serverQueue.connection.dispatcher.resume();
        return message.channel.send(`🎵 Music has now been paused`);
    }
    return message.channel.send(`No music is playing dumb fuck`);
}
async function pause(message, serverQueue) {
    if (serverQueue && serverQueue.playing) {
        serverQueue.playing = false;
        serverQueue.connection.dispatcher.pause();
        return message.channel.send(`🎵 Music has now been paused`);
    }
    return message.channel.send(`No music is playing dumb fuck`);
}
async function volume(message, serverQueue) {
    const args = message.content.split(/ +/);
    if (Number(args[1]) < 0 || Number(args[1]) > 100) return message.channel.send("Volume value must be in the range of 0-100");
    serverQueue.volume = Number(args[1] / 100);
    serverQueue.connection.dispatcher.setVolumeLogarithmic(serverQueue.volume);
    return message.channel.send(`🎵 Volume has now been set to **${args[1]}/100**`);
}
async function execute(message, serverQueue) {
  const args = message.content.split(" ");

  const voiceChannel = message.member.voice.channel;
  if (!voiceChannel)
    return message.channel.send(
      "You need to be in a voice channel to play music!"
    );
  const permissions = voiceChannel.permissionsFor(message.client.user);
  if (!permissions.has("CONNECT") || !permissions.has("SPEAK")) {
    return message.channel.send(
      "I need the permissions to join and speak in your voice channel!"
    );
  }

  const songInfo = await ytdl.getInfo(args[1]);
  const song = {
    title: songInfo.title,
    url: songInfo.video_url
  };

  if (!serverQueue) {
    const queueContruct = {
      textChannel: message.channel,
      voiceChannel: voiceChannel,
      connection: null,
      songs: [],
      volume: 5,
      playing: true
    };

    queue.set(message.guild.id, queueContruct);

    queueContruct.songs.push(song);

    try {
      var connection = await voiceChannel.join();
      queueContruct.connection = connection;
      play(message.guild, queueContruct.songs[0]);
    } catch (err) {
      console.log(err);
      queue.delete(message.guild.id);
      return message.channel.send(err);
    }
  } else {
    serverQueue.songs.push(song);
    return message.channel.send(`${song.title} has been added to the queue!`);
  }
}

function skip(message, serverQueue) {
  if (!message.member.voice.channel)
    return message.channel.send(
      "You have to be in a voice channel to stop the music!"
    );
  if (!serverQueue)
    return message.channel.send("There is no song that I could skip!");
  serverQueue.connection.dispatcher.end();
}

function stop(message, serverQueue) {
  if (!message.member.voice.channel)
    return message.channel.send(
      "You have to be in a voice channel to stop the music!"
    );
  serverQueue.songs = [];
  serverQueue.connection.dispatcher.end();
}

function play(guild, song) {
  const serverQueue = queue.get(guild.id);
  if (!song) {
    serverQueue.voiceChannel.leave();
    queue.delete(guild.id);
    return;
  }

  const dispatcher = serverQueue.connection
    .play(ytdl(song.url))
    .on("finish", () => {
      serverQueue.songs.shift();
      play(guild, serverQueue.songs[0]);
    })
    .on("error", error => console.error(error));
  dispatcher.setVolumeLogarithmic(serverQueue.volume / 5);
  serverQueue.textChannel.send(`Start playing: **${song.title}**`);
}
client.login(token);