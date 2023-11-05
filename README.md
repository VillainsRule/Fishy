<div align="center">
  <img src="https://i.imgur.com/XP2BohW.png">
  <p>made with ❤️ by <b>@xthonk</b></p>
  <hr>
  <h2>Features</h2>
</div>

- [x] Captcha Solver
- [x] Auto Daily
- [x] Fishing & advanced logging
- [x] Auto Buy
  - [x] includes bait, rods, upgrades, & boosts!
- [x] Auto Sell
- [x] Simple, easy dashboard
- [x] Infinite accounts
- [x] and even more!

<h3 align="center">DISCLAIMER</h3>
<p align="center"><b>USE AT YOUR OWN RISK.</b><br>This is a selfbot and is in violation of Discord's and Virtual Fisher's rules and TOS. By using this software, you acknowledge that we take no responsibility for any action taken against your account(s), whether by Discord or Virtual Fisher.<br><br>We are aware our Captcha Solver does not work 100% of the time, and some accounts may be banned.</p>

<h2 align="center">Installation</h2>
  
1. Install [NodeJS](https://nodejs.org/en/download/current).
2. Open your Terminal (Mac)/Powershell (Windows) app.
3. Install Tesseract ([Windows tutorial](https://linuxhint.com/install-tesseract-windows/), [Mac/Linux tutorial](https://www.oreilly.com/library/view/building-computer-vision/9781838644673/95de5b35-436b-4668-8ca2-44970a6e2924.xhtml))
4. Clone the repo from Git:
```
git clone https://github.com/VillainsRule/Fishy.git
```
4. Enter the new folder:
```
cd Fishy
```
5. Install dependencies:
```
npm i
```
6. Edit values in config.json.<br>On Mac, run `open -e config.json`. On Windows, run `notepad config.json`.<br><br>
7. Add tokens & channel IDs to tokens.txt.<br>On Mac, run `open -e tokens.txt`. On Windows, run `notepad tokens.txt`.<br><br>Each line should look like this: `channelID_to_run_token_in token_here`.<br>Example: `1033322763085152317 MTAFEIWFUWIEHKGFYUEWBJKFGEYUGUEWUYGUBLAH`.<br><br>
8. Then, run the program!
```
node .
```

<h2 align="center">Running Later</h2>
Once the Terminal/Powershell app has been quit, getting back to the bot can be hard.

1. Open your Terminal (Mac)/Powershell (Windows) app.
2. Enter your Fishy folder:
```
cd Fishy
```
3. Run the program:
```
node .
```

<h2 align="center">Updating Fishy</h2>
Sometime, you will get a message informing you to update.

1. Fully Close/Quit your Terminal/Powershell.
2. Open your Terminal/Powershell again.
3. Enter your Fishy folder:
```
cd Fishy
```
4. Pull the latest repo from Git.
```
git fetch --all
```
5. Save your tokens list. It will be wiped.
6. Force merge the latest and yours.
```
git reset --hard origin/main
```
7. Redo your config. To edit your config on Mac, run `open -e config.json`. For Windows, run `notepad config.json`.
- The config has likely changed with things moved around and new keys/structure.
- Do NOT repaste an old config file.
8. Repaste your tokens/channelIDs. On Mac, run `open -e tokens.txt`. On Windows, run `notepad tokens.txt`.
9. Run the program!
```
node .
```

In the future, we may offer a Fishy Update tool.

<h2 align="center">Config</h2>
This is how to set up your config.<br><br>

```json
{
  "discord": {
    "statuses": ["invisible", "dnd", "idle", "online"], // all the statuses your accounts can be. this will be randomized.
    "loginDelay": 1500 // how fast to log the accounts in to discord
  },

  "dashboard": {
    "port": 42002 // the dashboard URL: CHANGE IF DEVELOPER
  },

  "advancedLogging": true, // advanced logging, becomes overkill at >3 accounts

  "disableTips": true, // if to disable those stupid tips (could confuse bot)

  "autoDaily": true, // if to auto claim daily
  "autoBuy": {
    "rods": true, // if to auto buy/use the best rod
    "bait": {
      "active": true, // if to auto buy bait
      "minAmount": 200, // the min number of bait bought per purchase
      "maxAmount": 500, // the max number of bait bought per purchase
      "preferred": "Worms" // the bait to buy
    },
    "boats": true // if to auto buy boats
  },
  "autoSell": true, // if to auto sell fish
  "autoClan": {
    "enabled": true, // if to automatically create a clan only you are in (self-buffs)
    "descriptions": [ // all the descriptions for the clans, randomized. PLEASE change from default as these may be blacklisted sometime.
      "hi",
      "this is a clan",
      "very cool clan",
      "trust me very cool clan"
    ]
  },
  "autoBoost": {
    "enabled": true, // if to auto boost (/shop boosts)
    "purchaseOrder": [ // the order to buy boosts in, based off button labels
      "Fish Boost (20m)",
      "Treasure Boost (20m)",
      "Worker (30m)",
      "Fish Boost (5m)",
      "Treasure Boost (5m)",
      "Worker (10m)"
    ]
  },

  "delays": { // delays
    "buttonClickDelay": { // how fast to click buttons
      "min": 500, // min time (milliseconds)
      "max": 750 // max time (milliseconds)
    },
    "shortBreak": { // how long is a short break
      "min": 45000,
      "max": 75000,
      "frequency": 0.0005 // how often is a short break
    },
    "longBreak": {
      "min": 125000,
      "max": 175000,
      "frequency": 0.0001
    },
    "commandInterval": { // how often to run commands
      "min": 3000,
      "max": 3250
    }
  }
}
```
