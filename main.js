const Discord = require("discord.js");
//const { prefix, token } = require("./config.json");
const ytdl = require("ytdl-core");
const ytpl = require('ytpl');
const prefix = "~";
const token = process.env.token;
const client = new Discord.Client();

const queue = new Map();
global.secondRecent;
global.recent;
global.secondRecent = 0;
global.recent = 0;
global.recents = [];
global.constructedBruh = false;
global.busy = false;
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
  if (global.busy === true)  {
    return message.channel.send(`currently busy bud`)
  } else if (message.content.startsWith(`${prefix}restart`)) {
    restart(message, serverQueue);
    return;
  }else if (message.content.startsWith(`${prefix}play`)) {
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
  } else if (message.content.startsWith(`${prefix}write`)) {
    write(message, serverQueue);
    return;
  } else {
    message.channel.send("You need to enter a valid command!");
  }
});
async function restart(message, serverQueue) {
  // send channel a message that you're resetting bot [optional]
  message.channel.send('Resetting...')
  .then(msg => client.destroy())
  .then(() => client.login(token));
}
async function write(message, serverQueue) {
    const args = message.content.split(" ");
    var fs = require('fs');
    var leMessage = "";
    var file_descriptor = fs.openSync("sayings.txt");
    fs.readFile('sayings.txt', function(err, data) {
        if(err) throw err;
        var allSayings = data.toString();
        allSayings += "\n";
        for (a of args) {
            if (a.toString().trim() === '~write') {
                continue;
            } else {
                allSayings += a.toString().trim();
                allSayings += " ";
                leMessage += a.toString().trim();
                leMessage += " ";
            }
        }
        fs.writeFile('sayings.txt', allSayings, function (err) {
            if (err) throw err;
            console.log('Hello World > helloworld.txt');
            fs.close(file_descriptor, function() {
                console.log('wrote the file successfully');
            });
          });
          leMessage += " was added to my vocab my boi-o-pal";
        return message.channel.send(leMessage);
    });
}
async function help(message, serverQueue) {
    var commands = ["~play youtubeurl or playlisturl (note that only the first 15 songs can be uploaded to the queue due to server load)", "~skip", "~stop", "~volume 1-100",
                    "~pause", "~resume", "~list", "~mawty", "~write new sayings for martino",
                "MAKE SURE TO ENTER ALL COMMANDS IN THE BOT COMMANDS CHANNEL U WOPS"];
    var commandList = "";
    for (a of commands) {
        commandList += a +'\n';
    }
    let embed = new Discord.MessageEmbed()
        .setColor('RANDOM')
        .setDescription(`**-=- CommandList -=-**\n${commandList}\n\n`);
    return message.channel.send(embed);
}
async function mawty(message, serverQueue) {
  global.busy = true;
    var fs = require('fs');
    fs.readFile('sayings.txt', function(err, data) {
        if(err) throw err;
        var array = data.toString().split("\n");
        var random = global.recent;
        if (array.length - global.recents.length <= 20) {
            global.recents = [];
        }
        do {
            random = Math.floor(Math.random() * array.length);
        } while (global.recents.indexOf(random) > -1);
        global.recents.push(random);
        global.secondRecent = global.recent;
        global.recent = random;
        global.busy = false;
        return message.channel.send(array[random]);
    });
    global.busy = false;
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
    if (Number(args[1]) < 0 || Number(args[1]) > 100) {
      return message.channel.send("Volume value must be in the range of 0-100");
    }
    serverQueue.volume = Number(args[1] / 100);
    serverQueue.connection.dispatcher.setVolumeLogarithmic(serverQueue.volume);
    return message.channel.send(`🎵 Volume has now been set to **${args[1]}/100**`);
}
async function execute(message, serverQueue) {
  var responses = [];
  const args = message.content.split(" ");
  //global.busy = true;
  const voiceChannel = message.member.voice.channel;
  global.busy = false;
  if (!voiceChannel)
    return message.channel.send(
      "You need to be in a voice channel to play music!"
    );
    global.busy = false;
  const permissions = voiceChannel.permissionsFor(message.client.user);
  if (!permissions.has("CONNECT") || !permissions.has("SPEAK")) {
    return message.channel.send(
      "I need the permissions to join and speak in your voice channel!"
    );
  }
  global.busy = true;
  const pattern = /^.*(youtu.be\/|list=)([^#\&\?]*).*/gi;
  const queueContruct = {
    textChannel: message.channel,
    voiceChannel: voiceChannel,
    connection: null,
    songs: [],
    volume: 5,
    playing: true
  };
  if (pattern.test(args[1])) {
      message.channel.send("inputing playlist, this might take a while, dont fuck anything up by spamming commands you fucking obese wop");
      var playlist;
      global.busy = false;
      var i = 0;
      let responses = await ytpl(args[1]).catch(err => {
        console.log(err);
        return message.channel.send("can't download video(s) data. probably wrong url. error: "+err);
      });
      console.log(responses);
      for (item of responses.items) {
        console.log(item);
          if (i >= 15) {
            i = 0;
              break;
          }
            const song = {
                title: item.title,
                url: item.url_simple
            };
            if (!serverQueue) {
                queue.set(message.guild.id, queueContruct);
            
                queueContruct.songs.push(song);
            
                try {
                  var connection = await voiceChannel.join();
                  queueContruct.connection = connection;
                  play(message.guild,message, queueContruct.songs[0]);
                } catch (err) {
                  console.log(err);
                  queue.delete(message.guild.id);
                  return message.channel.send(err);
                }
                global.constructedBruh = true;
              } else {
                serverQueue.songs.push(song);
                //return message.channel.send(`${song.title} has been added to the queue! \n make sure to enter ~stop once you are done listening to music to save on server costs :) <3 `);
              }
              i++;
          }
          global.busy = false;
           return message.channel.send("added playlist to queue daddy, only added the first 15 songs were added due to server load \n ps wanna hang soon?");
  } else {
    const songInfo = await ytdl.getInfo(args[1]).catch(err => {
      console.log(err);
      return message.channel.send("can't download video(s) data. probably wrong url. error: "+err);
    });
    const song = {
      title: songInfo.title,
      url: songInfo.video_url
    };
  
    if (!serverQueue) {
  
      queue.set(message.guild.id, queueContruct);
  
      queueContruct.songs.push(song);
  
      try {
        var connection = await voiceChannel.join();
        queueContruct.connection = connection;
        play(message.guild, message, queueContruct.songs[0]);
      } catch (err) {
        console.log(err);
        queue.delete(message.guild.id);
        global.busy = false;
        return message.channel.send(err);
      }
      global.constructedBruh = true;
    } else {
      serverQueue.songs.push(song);
      global.busy = false;
      return message.channel.send(`${song.title} has been added to the queue! \n make sure to enter ~stop once you are done listening to music to save on server costs :) <3 `);
    }
  }
  list(message, serverQueue);
  global.busy = false;
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

function play(guild,message, song) {
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
      play(guild,message,serverQueue.songs[0]);
    })
    .on("error", error => console.error(error));
  dispatcher.setVolumeLogarithmic(serverQueue.volume / 5);
  //list(message, serverQueue)
  //serverQueue.textChannel.send(`Start playing: **${song.title}** \n make sure to enter ~stop once you are done listening to music to save on server costs :) <3`);
}
client.login(token);