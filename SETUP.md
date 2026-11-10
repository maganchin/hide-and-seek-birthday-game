# Setting up your own Birthday Hide & Seek

About an hour of work plus however long your friends take to send their videos. No coding needed for steps 1–8; step 9 (brand-new islands) is optional.

**You'll need:** a computer with Python 3 (already on every Mac) and [ffmpeg](https://ffmpeg.org) for the videos (`brew install ffmpeg` on a Mac).

---

## 1. Get the code and run it

```bash
git clone https://github.com/maganchin/hide-and-seek-birthday-game.git my-birthday-world
cd my-birthday-world
python3 serve.py
```

Open http://localhost:8026. Keep it running while you work: save a file, reload the page, see the change. Add `?skip` to the address to jump past the title screen.

> Use `serve.py` instead of `python3 -m http.server`. The built-in server can't seek inside videos, and Safari won't play them from it at all.

## 2. The birthday person

In **`world.config.js`**:

```js
birthdayPerson: {
  name: 'Alex',
  age: 25,                                  // candles on the cake
  look: { skin: '#e0b08a', hair: '#3a2418' },
  outfit: 'party',                          // party, gown, robe, graduation, street, velvet
},
```

The `text` section holds every line on screen (title, intro, the finale message). `{name}`, `{age}` and `{ordinal}` ("25th") are filled in for you.

## 3. Collect the messages

Ask friends for a short video (20–60 seconds). Phones held upright are fine. Tips that help:

- Give them a deadline a week before you really need it.
- Ask them to film somewhere quiet, facing a window.
- One video per person, or one per group: a "friend" can stand for a whole group.

Put the originals in a folder called **`raw/`** inside the project, then run:

```bash
./transcode.sh
```

This makes small web-friendly copies in `media/videos/` plus a poster frame for each in `media/posters/`, and prints the exact lines to paste into the config.

## 4. Hide each message

Each entry in `messages` is one glowing spot:

```js
messages: [
  { from: 'Sam',   island: 'nyc', spot: 'mailbox',   video: 'media/videos/sam.mp4',   poster: 'media/posters/sam.jpg' },
  { from: 'Priya', island: 'dc',  spot: 'bookshop',  video: 'media/videos/priya.mp4', poster: 'media/posters/priya.jpg' },
  { from: 'Mochi the cat', island: 'nyc', spot: 'stoop', video: 'media/videos/mochi.mp4', cat: '#b07a4a' },
],
```

**Spots:**

| Island | Spots |
|---|---|
| `nyc` | `mailbox`, `rooftop`, `parkBench`, `stoop`, `newsstand`, `fountain` |
| `dc` | `waterBench`, `bookshop`, `capitolSteps`, `blossomArch`, `gazebo` |

- One message per spot. The "Memories Found" total is simply how many messages you list.
- A message with `video: null` shows a setup tip and counts as found when opened. Remove any you don't need.
- Each friend appears as a little character standing by their spot, with a name tag that says `from`.

## 5. Dress up the friends

Open **http://localhost:8026/?edit=1** (or press Shift+F in the game). Friend Studio flies you to each friend so you can pick their skin tone, hair colour and style, clothes, glasses, beard, cap and height.

Changes save in your browser straight away. To make them permanent for everyone, click **Export file** and put the downloaded `friend-looks.js` into the `js/` folder, replacing the old one.

You can also write a `look` straight into a message:

```js
{ from: 'Sam', …, look: { skin: '#c8906a', hair: '#141012', hairStyle: 'curly', top: '#f2c46a', glasses: '#2a2628' } }
```

## 6. Pets

```js
pets: {
  cat: { name: 'Mochi' },                    // follows the birthday person everywhere
  dog: { name: 'Biscuit', island: 'nyc' },  // waits on that island until you say hi
},
```

Set `dog: false` for no dog. The cat's look can be changed in-game at the Cat House on the Overlook.

## 7. Music (optional)

```js
music: { youtube: 'VIDEO_ID', file: '' },     // or file: 'media/music/song.mp3'
```

A YouTube id plays from YouTube, which needs an internet connection; if the video doesn't allow embedding, the game falls back to `file`. Music fades down while a video message plays. **Only use music you have the rights to share**, especially if the site is public.

## 8. The islands

Rename them and give each a caption about what the place means to the birthday person:

```js
islands: {
  nyc: { name: 'Brooklyn', caption: 'Where we met' },
  dc:  { name: 'Washington, D.C.', caption: 'The internship summer' },
},
showPlaceholderIslands: false,   // hide the misty "your place here" islands
```

The buildings stay the same: NYC and DC are modelled on those cities. To turn them into a different place, see step 9.

## 9. Build a brand-new island (optional, more advanced)

Islands are built in code, one file each in `js/islands/`, using the low-poly helpers in `js/kit.js` (boxes, cylinders, gables, trees, lamps, benches, blossoms…). The easiest way to make a new one is to ask an AI coding assistant (Claude Code, Cursor, Copilot…) inside this project. Paste this prompt, filling in the brackets, and attach 2–5 photos of the place:

```text
This project is a three.js birthday hide-and-seek game (no build step). Please add a new
island for [PLACE NAME, e.g. "Austin, Texas"], replacing the misty placeholder island "mistA".

Look at js/islands/dc.js and js/islands/nyc.js for how an island is built (the Island class in
js/island.js, the Builder/P helpers in js/kit.js, I.spot(), I.addGate(), I.finalize()), and at
js/islands/placeholder.js for the island you're replacing.

- Create js/islands/[id].js exporting build[Name](scene), with center [80, 6, -12] and R about 28.
- Model these landmarks in the same cozy low-poly storybook style: [LANDMARK 1], [LANDMARK 2],
  [LANDMARK 3]. The attached photos show what they look like.
- Add 5–6 hidden message spots with I.spot(id, x, z, { label }) on open, walkable ground,
  plus a Sky Gate with I.addGate(), and set I.dogHome = { x, z } somewhere open.
- In js/main.js, replace the 'mistA' buildPlaceholder step with the new island.
- In js/content.js, add the island to ISLANDS so it reads its name/caption from
  world.config.js (islands.[id]), and list its spot ids in the comment in world.config.js.
- Run python3 serve.py and check the browser console shows no errors.
```

To add a building you can walk *inside*, see how `js/islands/met.js` (an interior) is entered from a door spot in `nyc.js` with `spot.enter = 'metOpera'`.

## 10. Put it online

The game is a folder of static files, so any static host works:

- **Vercel:** `npm i -g vercel`, then `vercel deploy --prod` in the project folder.
- **Netlify:** drag the folder onto [app.netlify.com/drop](https://app.netlify.com/drop).
- **GitHub Pages:** push to a repo, then Settings → Pages → deploy from the `main` branch.

Then send the birthday person the link. 🎂

### A note on privacy

Your friends' videos are personal. If you keep your copy in a **public** GitHub repo, the videos will be public too. Either keep your personal copy in a **private** repo, or add `media/videos/` and `media/posters/` to `.gitignore` and upload only to the host. Anyone with the link to the site can watch the messages, so share it the way you would share the videos themselves.
