// Background music: either a YouTube embed (MUSIC_YOUTUBE) or a local file
// played through Web Audio. Both support volume, mute and smooth ducking while
// a birthday video plays. Small synthesized chimes go through Web Audio and
// respect the mute toggle too.
export function createAudio({ file, youtube, state, onMissing }) {
  let ctx, master, sfxGain, started = false, ducked = false;
  const DUCK = 0.07;
  const target = () => (state.muted ? 0 : state.volume * (ducked ? DUCK : 1));

  // ── backend: YouTube ──
  let yt = null, ytReady = false, ytVol = 0, ytAnim = null, ytFailed = false;
  if (youtube) {
    const holder = document.createElement('div');
    holder.id = 'yt-music';
    holder.innerHTML = '<div id="yt-music-player"></div>';
    document.body.appendChild(holder);
    window.onYouTubeIframeAPIReady = () => {
      yt = new window.YT.Player('yt-music-player', {
        width: 200, height: 113, videoId: youtube,
        playerVars: { autoplay: 0, controls: 0, loop: 1, playlist: youtube, playsinline: 1, rel: 0, disablekb: 1, fs: 0, iv_load_policy: 3 },
        events: {
          onReady: () => { ytReady = true; yt.setVolume(0); if (started) ytPlay(); },
          onError: () => { ytFailed = true; if (started) startFile(); },
        },
      });
    };
    const s = document.createElement('script');
    s.src = 'https://www.youtube.com/iframe_api';
    s.onerror = () => { ytFailed = true; if (started) startFile(); };
    document.head.appendChild(s);
  }
  function ytPlay() { yt.playVideo(); ytFade(target(), 2.5); }
  function ytFade(v, secs) {
    if (!ytReady) return;
    clearInterval(ytAnim);
    const from = ytVol, to = v * 100, t0 = performance.now();
    ytAnim = setInterval(() => {
      const k = Math.min(1, (performance.now() - t0) / (secs * 1000));
      ytVol = from + (to - from) * k;
      yt.setVolume(Math.round(ytVol));
      if (k >= 1) clearInterval(ytAnim);
    }, 40);
  }

  // ── backend: local file through Web Audio ──
  let el, musicGain;
  function fileFade(v, secs) {
    if (!musicGain) return;
    const g = musicGain.gain, now = ctx.currentTime;
    g.cancelScheduledValues(now);
    g.setValueAtTime(g.value, now);
    g.linearRampToValueAtTime(v, now + secs);
  }

  const useYT = () => youtube && !ytFailed;
  const fadeTo = (v, secs = 0.8) => (useYT() ? ytFade(v, secs) : fileFade(v, secs));

  function start() {
    if (started) return;
    started = true;
    const AC = window.AudioContext || window.webkitAudioContext;
    ctx = new AC();
    master = ctx.createGain(); master.connect(ctx.destination);
    sfxGain = ctx.createGain(); sfxGain.gain.value = state.muted ? 0 : 0.5; sfxGain.connect(master);
    ctx.resume();
    if (useYT()) { if (ytReady) ytPlay(); return; }
    startFile();
  }

  // local file (also the fallback when YouTube won't play)
  function startFile() {
    if (musicGain || !ctx) return;
    musicGain = ctx.createGain(); musicGain.gain.value = 0; musicGain.connect(master);
    el = new Audio();
    el.src = file;
    el.loop = true;
    el.preload = 'auto';
    el.addEventListener('error', () => onMissing && onMissing(), { once: true });
    try { ctx.createMediaElementSource(el).connect(musicGain); } catch (e) { /* already connected */ }
    el.play().then(() => fadeTo(target(), 2.5)).catch(() => {});
  }

  function apply() {
    if (!ctx) return;
    fadeTo(target(), 0.3);
    sfxGain.gain.setTargetAtTime(state.muted ? 0 : 0.5, ctx.currentTime, 0.05);
  }

  function duck(on) {
    ducked = on;
    fadeTo(target(), on ? 0.7 : 1.4);
  }

  function bell(freq, when = 0, dur = 1.6, vol = 0.25) {
    if (!ctx || state.muted) return;
    const t = ctx.currentTime + when;
    for (const [mult, v] of [[1, 1], [2.01, 0.35], [3.02, 0.12]]) {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = 'sine'; o.frequency.value = freq * mult;
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(vol * v, t + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g).connect(sfxGain);
      o.start(t); o.stop(t + dur + 0.05);
    }
  }

  return {
    start, apply, duck,
    debug: () => ({ ytReady, ytFailed, ytVol: Math.round(ytVol), state: yt && yt.getPlayerState ? yt.getPlayerState() : null }),
    chime() { [784, 988, 1175, 1568].forEach((f, i) => bell(f, i * 0.09, 1.8, 0.18)); },
    tick(n) { bell(1046 + (n % 5) * 60, 0, 0.6, 0.06); },
    whoosh() {
      if (!ctx || state.muted) return;
      const len = ctx.sampleRate * 1.6, buf = ctx.createBuffer(1, len, ctx.sampleRate), d = buf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.sin(Math.PI * i / len);
      const s = ctx.createBufferSource(); s.buffer = buf;
      const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.Q.value = 0.8;
      f.frequency.setValueAtTime(300, ctx.currentTime); f.frequency.linearRampToValueAtTime(1400, ctx.currentTime + 0.8); f.frequency.linearRampToValueAtTime(400, ctx.currentTime + 1.6);
      const g = ctx.createGain(); g.gain.value = 0.12;
      s.connect(f).connect(g).connect(sfxGain); s.start();
    },
  };
}
