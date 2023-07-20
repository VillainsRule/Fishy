// Version 1.0.0.6
const version = '1.0.0';
const versionNotes = 'Dev Edit 6'
const internalVersion = '1.0.0.6';

const fs = require('fs')
const https = require('https')

const chalk = require('chalk')
const express = require('express')
const tesseract = require('node-tesseract-ocr')
const selfbot = require('discord.js-selfbot-v13')
const socketio = require('socket.io')
const figlet = require('figlet')

let data = {}

console.log(chalk.redBright(
  figlet.textSync('F i s h y!', {
    font: 'Bloody',
    whitespaceBreak: true
  })
));
console.log(chalk.hex('#FFA500')(`╰ Running version ${chalk.bold(`${version}, ${versionNotes}`)}`))
console.log(chalk.hex('#FFA500')(`╰ Built by thonk (discord @iamthonk)`))
console.log(chalk.yellowBright(`╰ Join our Discord for support: ${chalk.bold('https://discord.gg/AwzRJcN6By')}\n`))

if (process.version.match(/^v(\d+\.\d+)/)[1] < 20) log(chalk.redBright('You are running a NodeJS version under v20. If you don\'t upgrade, you may get large lag spikes or ram overloads.'))

const config = process.env.config ? JSON.parse(process.env.config) : require('./config.json');
const tokens = process.env.tokens ? process.env.tokens.split('\n') : fs.readFileSync('tokens.txt', 'utf-8').split('\n');

process.on('unhandledRejection', (error) => {
  if (error.toString().includes(`Cannot read properties of undefined (reading 'type')`)) return;
  if (error.toString().includes('INTERACTION_TIMEOUT')) return;
  if (error.toString().includes('Cannot send messages to this user')) return console.error(chalk.red(`Make sure you are in a mutual server with Virtual Fisher.`));
  
  console.log(chalk.gray('—————————————————————————————————'));
  console.log(chalk.white('['), chalk.red.bold('Anti-Crash'), chalk.white(']'), chalk.gray(' : '), chalk.white.bold('Unhandled Rejection/Catch'));
  console.log(chalk.gray('—————————————————————————————————'));
  console.error('unhandledRejection', error);
});

process.on('uncaughtException', (error) => {
  console.log(chalk.gray('—————————————————————————————————'));
  console.log(chalk.white('['), chalk.red.bold('Anti-Crash'), chalk.white(']'), chalk.gray(' : '), chalk.white.bold('Unhandled Exception/Catch'));
  console.log(chalk.gray('—————————————————————————————————'));
  console.error('uncaughtException', error);
});

https.get('https://raw.githubusercontent.com/VillainsRule/Fishy/main/main.js', (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => {
    if (data === '404: Not Found') return console.log(chalk.bold.bgRed(`I cannot fetch the latest version information from Github.`) + chalk.bold.redBright(' Please contact support.\n'));
    let v = data.match(/Version ([0-9]*\.?)+/)[0]?.replace('Version ', '');
    if (v && v !== internalVersion) log(chalk.bold.bgRed(`There is a new version available! Please update to v${v}: ${chalk.underline('https://github.com/VillainsRule/Fisky')}\n`));
  })
})

const app = express();
app.use(express.static('site'));

const io = new socketio.Server(
  app.listen(config.dashboard.port, () => console.log(chalk.magentaBright(`Dashboard started. Visit ${chalk.bold(`http://localhost:${config.dashboard.port}`)} to access it.\n`)))
);

let logs = [];
let log = (msg) => {
  console.log(msg);
  logs.push(msg.replace(new RegExp([
    '[\\u001B\\u009B][[\\]()#;?]*(?:(?:(?:(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]+)*|[a-zA-Z\\d]+(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]*)*)?\\u0007)',
    '(?:(?:\\d{1,4}(?:;\\d{0,4})*)?[\\dA-PR-TZcf-ntqry=><~]))'
  ].join('|'), 'g'), ''));
  io.emit('log', msg.replace(new RegExp([
    '[\\u001B\\u009B][[\\]()#;?]*(?:(?:(?:(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]+)*|[a-zA-Z\\d]+(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]*)*)?\\u0007)',
    '(?:(?:\\d{1,4}(?:;\\d{0,4})*)?[\\dA-PR-TZcf-ntqry=><~]))'
  ].join('|'), 'g'), ''));
};

io.on('connection', (socket) => {
  socket.emit('balanceUpdate', data);
  socket.emit('logs', logs);
});

let i = 0;
tokens.forEach((token) => {
  i++;
  setTimeout(() => {
    if (!token.trim().split(' ')[1]) start(token.trim().split(' ')[0]);
    else start(token.trim().split(' ')[1], token.trim().split(' ')[0]);
  }, i * config.discord.loginDelay);
});

async function start(token, channelId) {
  let onGoingCommands = [];
  let queueCommands = [];
  let isOnBreak = false;
  let balance = 0;
  let level = 0;
  let rod = '';
  let biome = '';
  let banned = false;
  let highestBuyableRod = '';
  let doBuyLastRod = false;

  let status = config.discord.statuses[randomInt(0, config.discord.statuses.length-1)];

  const client = new selfbot.Client({
    checkUpdate: false,
    presence: {
      status
    }
  });

  let channel;

  client.on('ready', async () => {
    log(`${chalk.hex('#0ee3dc')('@' + client.user.username)} ${chalk.hex('#18a8a3')(`logged in as ${chalk.green(status)}.`)}`);

    const user = await client.users.fetch('574652751745777665');
    const createdDm = await user.createDM();
    channelId = channelId || createdDm.id;
    channel = await client.channels.fetch(channelId);
    
    data[client.user.id] = {};

    if (config.autoDaily) {
      const now = Date.now();
      const gmt0 = new Date(now).setUTCHours(0, 0, 0, 0);
      let remainingTime;
      if (now > gmt0) {
        const nextGmt0 = new Date(gmt0).setUTCDate(new Date(gmt0).getUTCDate() + 1);
        remainingTime = nextGmt0 - now;
      } else remainingTime = gmt0 - now;

      await channel.sendSlash('574652751745777665', 'daily').then(() => {
        setInterval(async () => queueCommands.push({
          command: 'daily'
        }), remainingTime + randomInt(10000, 60000));
      }).catch((e) => {
        return console.log(e);
      });
    }

    await wait(1000);
    await channel.sendSlash('574652751745777665', 'play').catch((e) => console.log(e));

    main(onGoingCommands, channel, client, queueCommands, isOnBreak);
  });

  client.on('messageCreate', async (message) => {
    if (banned) return;

    if (message.author.id === client.user.id && message.content.startsWith('vf.eval')) eval(message.content.split('vf.eval ')[1])

    if (message.author.id !== '574652751745777665') return;
    if (message?.interaction?.user !== client?.user) return;

    // =================== Notification Start ===================

    if (message.embeds[0]?.title?.includes('Help support Virtual Fisher\'s development')) message.embeds.shift();

    if (message.embeds[0]?.description?.includes('boost ended')) {
      queueCommands.push({
        command: 'shop boosts'
      })
    }

    if (message.embeds[0]?.description?.includes('Your worker has stopped working.')) {
      if (config.advancedLogging) log(`${chalk.hex('#0ee3dc')('@' + client.user.username)} ${chalk.hex('#18a8a3')('had their worker end work. They got')} ${chalk.green(message.embeds[0]?.description?.match(/\*\*(.*?)\*\*/)[1])} ${chalk.hex('#18a8a3')('total fish!')}`);
      queueCommands.push({
        command: 'shop upgrades'
      })
      message.embeds.shift();
    }

    // =================== Notification End ===================


    // =================== Captcha/Ban Start ===================

    if (message?.embeds[0]?.title?.includes('AUTOMATING COMMANDS BAN')) {
      log(chalk.redBright(`${'@' + client.user.username} has been banned!`));
      banned = true;
      return;
    }

    if (message?.embeds[0]?.description?.includes('Please use **/verify** with this code to continue playing.')) {
      log(chalk.redBright(`${'@' + client.user.username} GOT A CAPTCHA! URL: ${message?.embeds[0]?.image?.url}`));
      isOnBreak = true;

      let code = await (await tesseract.recognize(message?.embeds[0]?.image?.url, {
        lang: 'eng',
        oem: 1,
        psm: 3,
        tessedit_char_whitelist: '123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'
      })).replaceAll(' ', '').split('\n')[0].trim();

      log(chalk.redBright(`${'@' + client.user.username} is sending captcha response ${code}`))

      await wait(randomInt(config.delays.commandInterval.min, config.delays.commandInterval.max));
      channel.sendSlash('574652751745777665', 'verify', [code]);

      return;
    }
    
    if (message?.flags?.has('EPHEMERAL') && message.content?.includes('Incorrect code.')) {
      log(chalk.redBright(`${'@' + client.user.username} sent incorrect captcha code, regenerating captcha...`))
      await wait(randomInt(config.delays.commandInterval.min, config.delays.commandInterval.max));
      channel.sendSlash('574652751745777665', 'verify', ['regen']);
    }

    if (message?.flags?.has('EPHEMERAL') && message.content?.includes('You may now continue.')) {
      log(chalk.redBright(`${'@' + client.user.username} solved a captcha!`));
      isOnBreak = false;
    } 

    // =================== Captcha End ===================

    // =================== Catch Logging Start ===================

    if (message.embeds[0]?.title?.includes('You caught:') && config.advancedLogging) {
      if (message.embeds[0]?.description.includes('You ran out of')) {
        let baitToBuy = randomInt(2, 5) * 100;
        queueCommands.push({
          command: 'buy',
          args: [config.autoBuy.bait.preferred, baitToBuy.toString()]
        });
        if (config.advancedLogging) log(`${chalk.hex('#0ee3dc')('@' + client.user.username)} ` + chalk.hex('#18a8a3')(`Bait needed! Queued buy of ${baitToBuy.toString()} ${config.autoBuy.bait.preferred}.`))
      }

      let lines = message.embeds[0]?.description?.split('\n');
      let catches = lines.filter(a => a.includes(':fb_') && !a.includes('chest') && !a.includes('LEVEL UP!'));
      catches = catches.map(a => a = a.replace(/<[^>]+>/g, '').replace(/\s{2,}/g, ' '));
      if (catches.length > 0 && config.advancedLogging) log(`${chalk.hex('#0ee3dc')('@' + client.user.username)} ${chalk.hex('#18a8a3')('got')} ${chalk.green(catches.join(' & '))} ${chalk.hex('#18a8a3')('from a fishing trip!')}`);
      let chest = lines.filter(a => a.includes('from the chest'))[0];
      if (chest && config.advancedLogging) log(`${chalk.hex('#0ee3dc')('@' + client.user.username)} ${chalk.hex('#18a8a3')('got')} ${chalk.green(chest.match(/got\s(.*?)\sfrom/)[1].replaceAll('*', ''))} ${chalk.hex('#18a8a3')('from a chest!')}`);
      let leveledUp = lines.filter(a => a.includes('LEVEL UP'))[0];
      if (leveledUp) log(`${chalk.hex('#0ee3dc')('@' + client.user.username)} ${chalk.hex('#18a8a3')('leveled up! now level')} ${chalk.green(lines.filter(a => a.includes('now level'))[0].split('now level ')[1].slice(0, -1))}${chalk.hex('#18a8a3')('.')}`);
      let questCompleted = message.embeds[0]?.description?.includes('QUEST COMPLETE');
      if (!questCompleted || config.advancedLogging) return;
      questCompleted = lines[lines.indexOf(lines.filter(a => a.includes('COMPLETE'))[0]) + 1];
      log(`${chalk.hex('#0ee3dc')('@' + client.user.username)} ${chalk.hex('#18a8a3')('completed quest')} ${chalk.green(questCompleted.replaceAll('*', ''))}`);
    }

    // =================== Catch Logging End ===================

    // =================== Play Command Start ===================

    if (message.interaction.commandName === 'play' && message?.embeds[0]?.title?.includes('Inventory of ')) {
      if (message?.embeds[0]?.description?.startsWith('Clan'))[cl, b, lv, rd, bi] = [...message?.embeds[0]?.description?.matchAll(/\*\*([^*]+)\*\*/g)].map(match => match[1]);
      else [b, lv, rd, bi] = [...message?.embeds[0]?.description?.matchAll(/\*\*([^*]+)\*\*/g)].map(match => match[1]);
      let fishValue = message?.embeds[0]?.description?.split('\n').filter(a => a.includes('Fish Value'))[0].split('$')[1].replaceAll('*', '').replaceAll(',', '');

      balance = Number(b.slice(1).replaceAll(',', ''));
      level = Number(lv.slice(6));
      rod = rd.slice(0, -4);
      biome = bi;

      if (!message.embeds[0]?.description?.startsWith('Clan') && config.autoClan.enabled) queueCommands.push({
        command: 'clan create'
      })

      if (config.autoBuy.bait.active && !message?.embeds[0]?.description?.includes(config.autoBuy.bait.preferred)) {
        let baitToBuy = randomInt(2, 5) * 100;
        queueCommands.push({
          command: 'buy',
          args: [config.autoBuy.bait.preferred, baitToBuy.toString()]
        });
       if (config.advancedLogging) log(`${chalk.hex('#0ee3dc')('@' + client.user.username)} ` + chalk.hex('#18a8a3')(`Bait needed! Queued buy of ${baitToBuy.toString()} ${config.autoBuy.bait.preferred}.`))
      }

      log(`${chalk.hex('#0ee3dc')('@' + client.user.username)} ` + chalk.hex('#18a8a3')(`stat check! Balance: ${chalk.green(balance.toLocaleString())}, Level: ${chalk.green(level.toLocaleString())}, Rod: ${chalk.green(rod)}, Biome: ${chalk.green(biome)}, Fish Value: ${chalk.green(fishValue.toLocaleString())}`))

      if (Number(fishValue.slice(0, -2).slice(2)) > 10000) {
        queueCommands.push({
          command: 'sell',
          args: ['all']
        });
      };
    }

    // =================== Play Command End ===================

    // =================== Sell Command Start ===================

    if (message.embeds[0]?.description?.includes('You sold your entire inventory for') && config.advancedLogging) {
      let values = Array.from(message?.embeds[0]?.description?.matchAll(/\*\*(.*?)\*\*/g), match => match[1]);
      log(chalk.hex('#0ee3dc')(`${'@' + client.user.username} `) + chalk.hex('#18a8a3')(`sold entire inventory for `) + chalk.green(values[0]) + chalk.hex('#18a8a3')(`, new bal: `) + chalk.green(values[1]))
    }

    // =================== Sell Command End ===================
    
    // =================== Tip Disable Start ===================

    if (message.embeds[0]?.footer?.text?.includes('You can disable these tips using the /set tips off command.') && config.disableTips) {
      queueCommands.push({
        command: 'set',
        args: ['Tips', 'off']
      })
    };

    if (message.embeds[0]?.description?.includes('Tips will no longer be shown as you fish.') && config.advancedLogging) {
      log(`${chalk.hex('#0ee3dc')('@' + client.user.username)} ` + chalk.hex('#18a8a3')(`disabled tips`));
    }

    // =================== Tip Disable End ===================

    // =================== Clan Create Start ===================

    if (message.embeds[0]?.description?.includes('You created a new clan named') && config.advancedLogging) {
      log(`${chalk.hex('#0ee3dc')('@' + client.user.username)} ` + chalk.hex('#18a8a3')(`created clan`) + chalk.green(message.embeds[0]?.description?.match(/``([^`]*)``/)[1]));
    };

    // =================== Clan Create End ===================

    // =================== Biome Start ===================

    if (message.embeds[0]?.description?.includes('You cast your rod and fail to reach the water. Try switching biomes or using a different rod.')) {
      queueCommands.push({
        command: 'biome'
      })
    }

    if (message.embeds[0]?.title?.includes('Current Biome:')) {
      let biomes = message.components[0].components.filter(a => !a.disabled);
      let bestBiome = biomes[biomes.length - 1];
      let rodRequirements = {
        'biome_river_circle': ['Plastic Rod', 'Improved Rod', 'Steel Rod', 'Fiberglass Rod', 'Heavy Rod', 'Alloy Rod', 'Lava Rod', 'Magma Rod', 'Oceanium Rod', 'Golden Rod', 'Superium Rod', 'Infinity Rod', 'Floating Rod', 'Sky Rod', 'Space Rod', 'Alien Rod', 'Supporter Rod'],
        'biome_volcanic_circle': ['Lava Rod', 'Magma Rod', 'Golden Rod', 'Superium Rod', 'Infinity Rod', 'Floating Rod', 'Sky Rod', 'Space Rod', 'Alien Rod', 'Supporter Rod'],
        'biome_ocean_circle': ['Oceanium Rod', 'Golden Rod', 'Superium Rod', 'Infinity Rod', 'Floating Rod', 'Sky Rod', 'Space Rod', 'Alien Rod', 'Supporter Rod'],
        'biome_sky_circle': ['Golden Rod', 'Superium Rod', 'Infinity Rod', 'Floating Rod', 'Sky Rod', 'Space Rod', 'Alien Rod', 'Supporter Rod'],
        'biome_space_circle': ['Floating Rod', 'Sky Rod', 'Meteor Rod', 'Space Rod', 'Alien Rod', 'Supporter Rod'],
        'biome_alien_circle': ['Meteor Rod', 'Space Rod', 'Alien Rod', 'Supporter Rod']
      }
      if (!bestBiome.disabled && rodRequirements[bestBiome.emoji.name].indexOf(rod + ' Rod') > -1) {
        message.clickButton(bestBiome);
        queueCommands.push({
          command: 'play'
        })
      };
    };

    // =================== Biome End ===================

    // =================== Daily Start ===================

    if (message.embeds[0]?.title?.includes('Daily reward')) {
      log(chalk.hex('#0ee3dc')(`${'@' + client.user.username} `) + chalk.hex('#18a8a3')(`claimed daily rewards`));

      if (message?.embeds[0]?.description?.includes('Personal booster')) queueCommands.push({
        command: 'use',
        args: ['Personal']
      })
    }

    // =================== Daily End ===================

    // =================== Auto Buy Start ===================

    if (message.embeds[0]?.description?.includes('You now have enough to afford a new rod') && config.autoBuy.rods) {
      queueCommands.push({
        command: 'shop rods'
      });
    }

    if (message.embeds[0]?.title?.includes('Fishing Rod Shop')) {
      let rods = message.components[1].components;
      if (!rods[rods.length - 1].disabled) {
        highestBuyableRod = rods[4].label;
        await wait(randomInt(config.delays.buttonClickDelay.min, config.delays.buttonClickDelay.max));
        message.clickButton(message.components[0].components[1]);
      } else {
        if (rods[4].label.includes('Select')) return message.clickButton(message.components[0].components[1]);
        rods = rods.filter(a => !a.disabled);
        highestBuyableRod = rods[rods.length - 1];
        await wait(randomInt(config.delays.buttonClickDelay.min, config.delays.buttonClickDelay.max));
        message.clickButton(highestBuyableRod);
        queueCommands.push({
          command: 'rod',
          args: [ highestBuyableRod.customId.split('buy ')[1]]
        })
      }
    }

    if (message?.embeds[0]?.title?.includes('Temporary Boosts')) {
      let fishCounts = [...message?.embeds[0]?.description?.split('\n')[0].matchAll(/\*\*([^*]+)\*\*/g)].map(match => match[1]);
      fishCounts = fishCounts.map(a => a = Number(a));
      [ goldFish, emeraldFish ] = fishCounts;
      
      let findButton = (label) => {
        let fnum = -1;
        let snum = -1;

        message.components.forEach(a => {
          a.components.forEach(b => {
            if (b.label === label && !b.disabled) {
              fnum = message.components.indexOf(a);
              snum = a.components.indexOf(b) 
            }
          })
        });

        return message.components[fnum]?.components[snum];
      };
      
      let purchasedValid = false;
      config.autoBoost.purchaseOrder.forEach(a => {
        let btn = findButton(a);
        if (!btn || purchasedValid) return;
        purchasedValid = true;
        message.clickButton(btn);
      })
    }

    if (message?.embeds[0]?.title?.includes('Upgrades in this category are permanent and can be leveled up multiple times.')) {
      let comp = message.components[1].components.filter(a => !a.disabled);
      if (!comp.length && !message.components[0].components[1].disabled) message.clickButton(message.components[0].components[1]);
      else if (comp.length) message.clickButton(comp[randomInt(0, comp.length - 1)]);
    }

    if (message.embeds[0]?.title?.includes('All boats are permanent and decrease fishing cooldown and increase fish count slightly.')) {
      if (!message.components[0].components[0].disabled) {
        await wait(randomInt(config.delays.buttonClickDelay.min, config.delays.buttonClickDelay.max));
        message.clickButton(message.components[0].components[0])
        log(`${chalk.hex('#0ee3dc')('@' + client.user.username)} ` + chalk.hex('#18a8a3')(`got a new boat!`));
      }
    }

    // =================== Auto Buy End ===================
  });

  client.on('messageUpdate', async (old, message) => {
    if (banned) return;

    if (message.author.id !== '574652751745777665') return;
    if (message?.interaction?.user !== client?.user) return;

    if (message.embeds[0]?.title?.includes('Help support Virtual Fisher\'s development')) message.embeds.shift();

    // =================== Auto Buy Start ===================

    if (message.embeds[0]?.title?.includes('Fishing Rod Shop')) {
      let rods = message.components[1].components;
      if (!rods[rods.length - 1].disabled && !doBuyLastRod) {
        await wait(randomInt(config.delays.buttonClickDelay.min, config.delays.buttonClickDelay.max));
        message.clickButton(message.components[0].components[1]);
      } else if (rods.filter(a => !a.disabled).length < 1) {
        doBuyLastRod = true;
        await wait(randomInt(config.delays.buttonClickDelay.min, config.delays.buttonClickDelay.max));
        message.clickButton(message.components[0].components[0]);
      } else {
        doBuyLastRod = false;
        rods = rods.filter(a => !a.disabled);
        if (rods[rods.length - 1]?.label.includes('Select')) return;
        highestBuyableRod = rods[rods.length - 1];
        await wait(randomInt(config.delays.buttonClickDelay.min, config.delays.buttonClickDelay.max));
        message.clickButton(highestBuyableRod);
        queueCommands.push({
          command: 'rod',
          args: [ highestBuyableRod.customId.split('buy ')[1]]
        })
      }
    }

    if (message?.embeds[0]?.title?.includes('Temporary Boosts')) {
      let fishCounts = [...message?.embeds[0]?.description?.split('\n')[0].matchAll(/\*\*([^*]+)\*\*/g)].map(match => match[1]);
      fishCounts = fishCounts.map(a => a = Number(a));
      [ goldFish, emeraldFish ] = fishCounts;
      
      let findButton = (label) => {
        let fnum = -1;
        let snum = -1;

        message.components.forEach(a => {
          a.components.forEach(b => {
            if (b.label === label && !b.disabled) {
              fnum = message.components.indexOf(a);
              snum = a.components.indexOf(b) 
            }
          })
        });

        return message.components[fnum]?.components[snum];
      };
      
      let purchasedValid = false;
      config.autoBoost.purchaseOrder.forEach(a => {
        let btn = findButton(a);
        if (!btn || purchasedValid) return;
        purchasedValid = true;
        message.clickButton(btn);
      })
    }

    if (message?.embeds[0]?.title?.includes('Upgrades in this category are permanent and can be leveled up multiple times.')) {
      let comp = message.components[1].components.filter(a => !a.disabled);
      await wait(randomInt(config.delays.buttonClickDelay.min, config.delays.buttonClickDelay.max));
      if (!comp.length && !message.components[0].components[1].disabled) message.clickButton(message.components[0].components[1]);
      else if (comp.length) message.clickButton(comp[randomInt(0, comp.length - 1)]);
    }

    if (message.embeds[0]?.title?.includes('All boats are permanent and decrease fishing cooldown and increase fish count slightly.')) {
      if (!message.components[0].components[0].disabled) {
        await wait(randomInt(config.delays.buttonClickDelay.min, config.delays.buttonClickDelay.max));
        message.clickButton(message.components[0].components[0])
        log(`${chalk.hex('#0ee3dc')('@' + client.user.username)} ` + chalk.hex('#18a8a3')(`got a new boat!`));
      }
    }

    // =================== Auto Buy End ===================
  });

  client.on('interactionModalCreate', async (modal) => {
    if (banned) return;

    if (modal.application.id !== '574652751745777665') return;

    // =================== Clan Command Start ===================

    if (modal.title === 'Create a clan') {
      if (config.advancedLogging) console.log(`${chalk.hex('#0ee3dc')('@' + client.user.username)} ` + chalk.hex('#18a8a3')(`is creating a clan...`));

      await wait(randomInt(1000, 3000))
      modal.components[0].components[0].setValue(client.user.username + '_' + Math.round(Math.random() * 100000).toString())
      await wait(randomInt(2000, 4000))
      modal.components[1].components[0].setValue(config.autoClan.descriptions[randomInt(0, config.autoClan.descriptions.length - 1)])
      await wait(randomInt(1000, 2000))
      modal.reply()
    }

    // =================== Clan Command End ===================
  })

  client.login(token).catch((err) => {
    if (err.toString().includes('TOKEN_INVALID')) console.log(`${chalk.redBright('ERROR:')} ${chalk.hex('#FFA500')('Invalid Token')} ${chalk.green(token || 'no token')}`);
  });

  async function main(onGoingCommands, channel, client, queueCommands, isOnBreak) {
    if (banned) return;

    let commandCooldown = randomInt(config.delays.commandInterval.min, config.delays.commandInterval.max);
    let shortBreakCooldown = randomInt(config.delays.shortBreak.min, config.delays.shortBreak.max);
    let longBreakCooldown = randomInt(config.delays.longBreak.min, config.delays.longBreak.max);

    let actualDelay = commandCooldown;

    if (queueCommands.length > 0) {
      if (queueCommands[0]?.command) {
        if (queueCommands.length <= 0) {
          queueCommands.shift();
          setTimeout(() => {
            isOnBreak = false;
            main(onGoingCommands, channel, client, queueCommands, isOnBreak);
          }, actualDelay);
        } else {
          return channel.sendSlash('574652751745777665', queueCommands[0].command, queueCommands[0].args ? queueCommands[0].args : []).then(() => {
            queueCommands.shift();
            log(`${chalk.hex('#0ee3dc')('@' + client.user.username)} ${chalk.hex('#18a8a3')('sent queued command')} ${chalk.hex('#18a8a3')(queueCommands[0].command)}`);
            setTimeout(() => {
              isOnBreak = false;
              main(onGoingCommands, channel, client, queueCommands, isOnBreak);
            }, actualDelay);
          }).catch((err) => {
            queueCommands.shift();
            setTimeout(() => {
              isOnBreak = false;
              main(onGoingCommands, channel, client, queueCommands, isOnBreak);
            }, actualDelay);
          });
        };
      } else {
        queueCommands.shift();
        setTimeout(() => {
          isOnBreak = false;
          main(onGoingCommands, channel, client, queueCommands, isOnBreak);
        }, actualDelay);
      }
    }

    if (randomInt(1, 25) == 1) {
      queueCommands.push({
        command: 'play',
      });
      if (config.advancedLogging) log(`${chalk.hex('#0ee3dc')('@' + client.user.username)} ${chalk.hex('#18a8a3')('queued play command')} `);
    } else if (randomInt(1, 100) == 1 && config.autoSell) {
      queueCommands.push({
        command: 'sell',
        args: ['all'],
      });
      if (config.advancedLogging) log(`${chalk.hex('#0ee3dc')('@' + client.user.username)} ${chalk.hex('#18a8a3')('queued sell command')} `);
    } else if (randomInt(1, 200) === 1 && config.autoBuy.boats) {
      queueCommands.push({
        command: 'shop boats'
      })
      if (config.advancedLogging) log(`${chalk.hex('#0ee3dc')('@' + client.user.username)} ${chalk.hex('#18a8a3')('queued shop boats command')} `);
    } else if (randomInt(1, 200) === 1 && config.autoBuy.rods) {
      queueCommands.push({
        command: 'shop rods'
      })
      if (config.advancedLogging) log(`${chalk.hex('#0ee3dc')('@' + client.user.username)} ${chalk.hex('#18a8a3')('queued shop rods command')} `);
    } else if (randomInt(1, 200) === 1 && config.autoBoost.enabled) {
      queueCommands.push({
        command: 'shop boosts'
      })
      if (config.advancedLogging) log(`${chalk.hex('#0ee3dc')('@' + client.user.username)} ${chalk.hex('#18a8a3')('queued shop boosts command')} `);
    } else if (randomInt(1, 200) === 1 && config.autoBoost.enabled) {
      queueCommands.push({
        command: 'biome'
      })
      if (config.advancedLogging) log(`${chalk.hex('#0ee3dc')('@' + client.user.username)} ${chalk.hex('#18a8a3')('queued biome command')} `);
    }

    data[client.user.id] = {
      isOnBreak,
      balance,
      level,
      rod,
      biome,
      banned,
      username: client.user.username
    };

    io.emit('balanceUpdate', data);

    channel.sendSlash('574652751745777665', 'fish')
    
    if (Math.random() < config.delays.shortBreak.frequency) {
      actualDelay = shortBreakCooldown;
      isOnBreak = true;
      log(`${chalk.hex('#0ee3dc')('@' + client.user.username)} ${chalk.hex('#18a8a3')('taking a short break for')} ${chalk.green((shortBreakCooldown / 1000).toFixed(1))} ${chalk.hex('#18a8a3')('seconds')}`);
    } else if (Math.random() < config.delays.longBreak.frequency) {
      actualDelay = longBreakCooldown;
      isOnBreak = true;
      log(`${chalk.hex('#0ee3dc')('@' + client.user.username)} ${chalk.hex('#18a8a3')('taking a long break for')} ${chalk.green((longBreakCooldown / 1000).toFixed(1))} ${chalk.hex('#18a8a3')('seconds')}`);
    } else isOnBreak = false;

    setTimeout(() => {
      isOnBreak = false;
      main(onGoingCommands, channel, client, queueCommands, isOnBreak);
    }, actualDelay);
  }
}

const wait = async (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
