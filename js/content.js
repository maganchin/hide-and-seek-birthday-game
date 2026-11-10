// Reads world.config.js and turns it into what the game uses.
// You shouldn't need to edit this file: change world.config.js instead.
import CONFIG from '../world.config.js';

export { CONFIG };

const P = CONFIG.birthdayPerson || {};
export const PERSON = { name: P.name || 'Birthday Star', age: Math.max(1, Math.min(99, P.age | 0 || 1)), look: P.look || {}, outfit: P.outfit || 'party' };

const ordinal = (n) => n + ((n % 100 >= 11 && n % 100 <= 13) ? 'th' : ({ 1: 'st', 2: 'nd', 3: 'rd' }[n % 10] || 'th'));
// fill in {name}, {age} and {ordinal}
export const fill = (s) => String(s ?? '').replace(/\{name\}/g, PERSON.name).replace(/\{age\}/g, PERSON.age).replace(/\{ordinal\}/g, ordinal(PERSON.age));
const T = CONFIG.text || {};
export const TEXT = Object.fromEntries(Object.entries({
  pageTitle: "{name}'s Birthday Hide & Seek",
  kicker: 'Happy {ordinal} Birthday {name}!',
  title: "{name}'s Archipelago",
  premise: 'A little world made of the places you’ve been and the people who love you.',
  startButton: 'Start your adventure',
  finaleTitle: 'Happy {ordinal} birthday, {name}.',
  finaleMessage: 'Look how much love you’ve collected along the way.',
  catQuestion: `What should ${(CONFIG.pets || {}).cat?.name || 'Kitty'} look like?`,
  wardrobe: "{name}'s Wardrobe",
  ...T,
}).map(([k, v]) => [k, fill(v)]));

const pets = CONFIG.pets || {};
export const PETS = {
  cat: { name: pets.cat?.name || 'Kitty' },
  dog: pets.dog === false ? null : { name: pets.dog?.name || 'Pup', island: pets.dog?.island || 'nyc', spot: pets.dog?.spot || 'dogPark' },
};

export const MUSIC_YOUTUBE = CONFIG.music?.youtube || '';
export const MUSIC_FILE = CONFIG.music?.file || '';

// every message, in the shape the game expects
export const MEMORIES = (CONFIG.messages || []).map((m) => ({
  file: m.video || null,
  poster: m.poster || null,
  sender: m.from || '',
  island: m.island,
  spot: m.spot,
  look: m.look || null,
  cat: m.cat || null,
}));

const isl = CONFIG.islands || {};
export const SHOW_PLACEHOLDERS = CONFIG.showPlaceholderIslands !== false;
export const ISLANDS = {
  nyc:      { name: isl.nyc?.name || 'New York City',    era: fill(isl.nyc?.caption ?? '') },
  dc:       { name: isl.dc?.name || 'Washington, D.C.',  era: fill(isl.dc?.caption ?? '') },
  overlook: { name: 'The Overlook',                      era: 'Where every adventure begins' },
  rotunda:  { name: 'The Capitol Rotunda',               era: 'Drag down to look up at the dome ✦' },
  metOpera: { name: 'The Metropolitan Opera',            era: 'Lincoln Center · the grand lobby ✦' },
  metUp:    { name: 'The Metropolitan Opera',            era: 'The grand tier' },
  geffen:   { name: 'David Geffen Hall',                 era: 'Lincoln Center · the orchestra is playing ✦' },
  carnegie: { name: 'Carnegie Hall',                     era: 'The main hall · the concert is on ✦' },
  mistA:    { name: 'Your place here',                   era: 'Waiting for your story ✦ see SETUP.md' },
  mistB:    { name: 'Your place here',                   era: 'Waiting for your story ✦ see SETUP.md' },
};

// what an empty message spot (video: null) shows: a step of the setup guide
export const SETUP_TIPS = [
  { t: 'Make this world yours', b: 'Open <code>world.config.js</code> and change the birthday person’s name and age. Reload the page and they’re everywhere: the title screen, the signs, the candles on the cake.' },
  { t: 'Collect the messages', b: 'Ask friends to film a short birthday video (20–60 seconds, phone held upright is fine). Collect them in a folder called <code>raw/</code> next to this project.' },
  { t: 'Make them web-friendly', b: 'Run <code>./transcode.sh</code>. It shrinks every video in <code>raw/</code> into <code>media/videos/</code> and grabs a poster frame for each one.' },
  { t: 'Hide a message here', b: 'In <code>world.config.js</code>, find this spot in <code>messages</code> and set <code>from</code> to your friend’s name and <code>video</code> to their file, e.g. <code>\'media/videos/sam.mp4\'</code>.' },
  { t: 'Dress up your friends', b: 'Open the page with <code>?edit=1</code> on the end of the address. Friend Studio lets you pick each friend’s hair, skin, clothes and glasses, then export the looks.' },
  { t: 'Rename the islands', b: 'Each island has a <code>name</code> and a <code>caption</code> in <code>world.config.js</code>. Write what each place means to them: “Where we met”, “The college years”.' },
  { t: 'Put it online', b: 'Upload the whole folder to any static host (Vercel, Netlify, GitHub Pages) and send the birthday person the link. See SETUP.md for the one-command version.' },
];
