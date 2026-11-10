// ─────────────────────────────────────────────────────────────────────────────
//  HIDE & SEEK BIRTHDAY GAME · world.config.js
//
//  This is the only file you need to edit to make the game your own.
//  Change the values below, save, and reload the page.
//  Step-by-step instructions: SETUP.md
// ─────────────────────────────────────────────────────────────────────────────

export default {
  // ── 1. The birthday person ────────────────────────────────────────────────
  birthdayPerson: {
    name: 'Alex',            // shown on the title screen, signs and the finale
    age: 25,                 // how many candles go on the cake (and sparkles on the title screen)
    look: {
      skin: '#efcfb6',       // any CSS colour
      hair: '#2a1d18',
    },
    outfit: 'casual',        // starting outfit: casual, sundress, hoodie, party, graduation, overalls
  },

  // ── 2. The words on screen ────────────────────────────────────────────────
  //  {name} and {age} are filled in for you. {ordinal} gives "25th".
  text: {
    pageTitle: "{name}'s Birthday Hide & Seek",
    kicker: 'Happy {ordinal} Birthday {name}!',
    title: "{name}'s Archipelago",
    premise: 'A little world made of the places you’ve been and the people who love you. Your friends have hidden birthday messages all over it. Can you find them all?',
    startButton: 'Start your adventure',
    finaleTitle: 'Happy {ordinal} birthday, {name}.',
    finaleMessage: 'Look how much love you’ve collected along the way.',
  },

  // ── 3. Pets that follow the birthday person around ───────────────────────
  pets: {
    cat: { name: 'Mochi' },                                   // always tags along
    dog: { name: 'Biscuit', island: 'nyc', spot: 'dogPark' }, // waits here until you say hi
  },

  // ── 4. Background music (optional) ────────────────────────────────────────
  //  Only use music you have the rights to share. Leave both empty for silence.
  music: {
    youtube: '',             // a YouTube video id, e.g. 'dQw4w9WgXcQ'
    file: '',                // or a file you add, e.g. 'media/music/song.mp3'
  },

  // ── 5. The islands ────────────────────────────────────────────────────────
  //  Rename them and write a caption for each. A caption is a short line about
  //  what that place means to the birthday person ("Where we met", "College years"…).
  islands: {
    nyc: { name: 'New York City',    caption: 'Example island · rename me in world.config.js' },
    dc:  { name: 'Washington, D.C.', caption: 'Example island · rename me in world.config.js' },
  },

  // Misty islands out at sea that say "your place goes here". Set to false to hide them.
  showPlaceholderIslands: true,

  // ── 6. The hidden birthday messages ───────────────────────────────────────
  //  One entry per message. Each one glows somewhere on an island.
  //    from    who it's from (shown as "From …" and on their little character)
  //    island  'nyc' or 'dc'
  //    spot    where it's hidden on that island (see the list below)
  //    video   path to the video file, e.g. 'media/videos/sam.mp4'
  //            leave it as null and the spot shows a setup tip instead
  //    poster  optional still image shown before the video plays
  //    look    optional: how their character looks (or design it in Friend Studio, ?edit=1)
  //            { skin, hair, hairStyle, top, bottom, glasses, beard, cap, jacket, necklace, dress, tall }
  //            hairStyle: short, swept, wavyShort, curly, bun, shoulder, long, wavy
  //    cat     optional: make this "friend" a fluffy cat instead, e.g. cat: '#b07a4a'
  //
  //  Spots
  //    nyc: mailbox, rooftop, parkBench, stoop, newsstand, fountain
  //    dc:  waterBench, bookshop, capitolSteps, blossomArch, gazebo
  messages: [
    { from: '', island: 'nyc', spot: 'mailbox',      video: null },
    { from: '', island: 'nyc', spot: 'stoop',        video: null },
    { from: '', island: 'nyc', spot: 'parkBench',    video: null },
    { from: '', island: 'nyc', spot: 'rooftop',      video: null },
    { from: '', island: 'dc',  spot: 'capitolSteps', video: null },
    { from: '', island: 'dc',  spot: 'waterBench',   video: null },
    { from: '', island: 'dc',  spot: 'bookshop',     video: null },
  ],
};
