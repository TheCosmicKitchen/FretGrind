/* Turns public-domain sources into the library in docs/lib. Run by hand; the site never needs it.
     node tools/import-music.mjs <folder with ryans/, oneills/ and mutopia/>
   ryans/ and oneills/ hold the ABC files from music21's corpus (Ryan's Mammoth Collection, 1883; O'Neill's Music of
   Ireland, 1903). mutopia/ holds pieces.json and each piece's .mid and .ly, only for pieces Mutopia marks Public Domain.
   A tune that can't be written faithfully in the song format is left out rather than bent to fit.
   piano/ holds the same for solo piano. lieder/ is a clone of github.com/OpenScore/Lieder (CC0): only composers who
   died before 1926 are used, the vocal line for guitar, and melody over the left hand for piano.
   The run also writes the guitar and piano paths. */
import { mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { METERS, build, check } from "../docs/js/songs/format.js";
import { grips, levelOfTab, playability, tabify } from "../docs/js/songs/tabify.js";
import { chunksOf } from "../docs/js/songs/path.js";
import { demandsOf, musicOf, skillsOf } from "../docs/js/songs/demands.js";
import { SONGS } from "../docs/js/songs/data.js";
import { changeKey, changesOf, chartFor } from "../docs/js/songs/changes.js";
import { buildSyllabus } from "./syllabus.mjs";

const T = 12, // twelfths of a sixteenth, as in format.js
  LEGAL = new Map([[8, "2/3"], [12, "1"], [16, "4/3"], [24, "2"], [32, "8/3"], [36, "3"], [48, "4"], [72, "6"], [96, "8"], [144, "12"], [192, "16"], [288, "24"]]),
  LEGAL_DESC = [...LEGAL.keys()].filter((k) => k % 12 === 0).sort((a, b) => b - a);

/* ---------- writing notes into bars ---------- */
/* notes = [{ ps: ["C5", ...] | null for a rest, t: twelfths }] -> bars string, or a reason it can't be done */
function toBars(stream, barLen, pickup) {
  const out = [];
  let cur = [],
    room = pickup || barLen;
  for (const n of stream) {
    if (n.t > room) return { why: "note crosses a barline" };
    const len = LEGAL.get(n.t);
    if (!len) return { why: "note length has no written form" };
    cur.push(`${n.ps ? n.ps.join("+") : "r"}:${len}`);
    room -= n.t;
    if (room === 0) {
      out.push(cur.join(" "));
      cur = [];
      room = barLen;
    }
  }
  // close the piece so a loop lands on the beat: after a pick-up the last bar gives that pick-up its time back
  const fill = (n) => {
    for (const r of [...LEGAL.keys()].sort((x, y) => y - x))
      while (n >= r) {
        cur.push(`r:${LEGAL.get(r)}`);
        n -= r;
      }
    return n === 0;
  };
  if (cur.length || pickup) {
    if (pickup && room < pickup) {
      if (!fill(room)) return { why: "last bar can't be completed" };
      out.push(cur.join(" "));
      cur = [];
      room = barLen;
    }
    if (!fill(room - pickup)) return { why: "last bar can't be completed" };
    out.push(cur.join(" "));
  }
  return { bars: out.join(" | ") };
}

/* ---------- ABC ---------- */
const SHARPS = "FCGDAEB", FLATS = "BEADGCF",
  TONIC = { C: 0, G: 1, D: 2, A: 3, E: 4, B: 5, "F#": 6, "C#": 7, F: -1, Bb: -2, Eb: -3, Ab: -4, Db: -5, Gb: -6 },
  MODE = { "": ["", 0], maj: ["", 0], m: ["m", -3], min: ["m", -3], dor: ["dor", -2], phr: ["phr", -4], lyd: ["lyd", 1], mix: ["mix", -1], loc: ["loc", -5], aeo: ["m", -3], ion: ["", 0] };
function abcKey(k) {
  const m = /^\s*([A-G][#b]?)\s*([A-Za-z]*)/.exec(k);
  if (!m) return null;
  const mode = MODE[m[2].slice(0, 3).toLowerCase()];
  if (!mode || TONIC[m[1]] === undefined) return null;
  const sig = TONIC[m[1]] + mode[1],
    acc = {};
  if (Math.abs(sig) > 7) return null;
  (sig > 0 ? SHARPS : FLATS).slice(0, Math.abs(sig)).split("").forEach((l) => (acc[l] = sig > 0 ? 1 : -1));
  return { key: m[1] + mode[0], acc };
}
const abcMeter = (m) => (m === "C" ? "4/4" : m === "C|" ? "2/2" : m);

/* The music of one tune as a flat list of notes and repeat marks. */
function abcScan(body, meter, L16, key) {
  const ev = [];
  let i = 0,
    acc = {}, // accidentals so far in this bar
    k = key,
    trip = 0,
    broken = 0, // >0: the next note takes this share of its length
    tied = false;
  const dur = (a, b) => {
    let v = (L16 * T * a) / b;
    if (trip > 0) ((v = (v * 2) / 3), trip--);
    if (broken) ((v *= broken), (broken = 0));
    return v;
  };
  const noteAt = (s, p) => {
    const m = /^(\^\^|__|\^|_|=)?([A-Ga-g])([,']*)/.exec(s.slice(p));
    if (!m) return null;
    const L = m[2].toUpperCase(),
      oct = (m[2] === L ? 4 : 5) + (m[3].match(/'/g) || []).length - (m[3].match(/,/g) || []).length,
      id = L + oct;
    if (m[1] === "^^" || m[1] === "__") throw "double accidental";
    if (m[1]) acc[id] = m[1] === "^" ? 1 : m[1] === "_" ? -1 : 0;
    const a = id in acc ? acc[id] : k.acc[L] || 0;
    if (oct < 0 || oct > 9) throw "pitch out of range";
    return { p: L + (a > 0 ? "#" : a < 0 ? "b" : "") + oct, len: m[0].length };
  };
  const lenAt = (s, p) => {
    const m = /^(\d*)(\/*)(\d*)/.exec(s.slice(p));
    const a = m[1] ? +m[1] : 1,
      b = m[3] ? +m[3] : m[2] ? 2 ** m[2].length : 1;
    return { a, b, len: m[0].length };
  };
  while (i < body.length) {
    const c = body[i],
      two = body.slice(i, i + 2);
    if (c === '"') i = body.indexOf('"', i + 1) + 1 || body.length;
    else if (c === "!" || c === "+") i = body.indexOf(c, i + 1) + 1 || body.length;
    else if (c === "{") i = body.indexOf("}", i) + 1 || body.length;
    else if (/^\[[KML]:/.test(body.slice(i, i + 3))) {
      const e = body.indexOf("]", i),
        f = body.slice(i + 1, e);
      if (f[0] === "K") k = abcKey(f.slice(2)) || (() => { throw "bad inline key"; })();
      else throw "meter or unit changes mid-tune";
      i = e + 1;
    } else if (c === "|" || c === ":" || two === "[|") {
      const m = /^(\[\||\|\]|\|\||\|:|:\|:?|::|\|)/.exec(body.slice(i));
      if (!m) { i++; continue; }
      i += m[0].length;
      acc = {};
      const n = /^\s*\[?([12])/.exec(body.slice(i));
      if (n && /^(\|\s*|\s*\[)?/.test(m[0])) {
        const after = /^\s*\[?[12](,[12])?/.exec(body.slice(i));
        // a digit straight after a bar line is a first or second ending
        ev.push({ bar: m[0] });
        if (/^\[?[12]/.test(body.slice(i))) {
          ev.push({ ending: +n[1] });
          i += after[0].length;
        }
        continue;
      }
      ev.push({ bar: m[0] });
    } else if (/^\[[12]/.test(body.slice(i, i + 2))) {
      ev.push({ ending: +body[i + 1] });
      i += 2;
    } else if (c === "(" && /\d/.test(body[i + 1] || "")) {
      const m = /^\((\d)(:\d*)?(:\d*)?/.exec(body.slice(i));
      if (m[1] !== "3" || m[2]) throw "tuplet other than a triplet";
      trip = 3;
      i += m[0].length;
    } else if (c === "[") {
      const e = body.indexOf("]", i);
      if (e < 0) throw "open chord";
      const ps = [];
      let p = i + 1, l = null;
      while (p < e) {
        const n = noteAt(body, p);
        if (!n) { p++; continue; }
        p += n.len;
        const q = lenAt(body, p);
        l = l || q;
        p += q.len;
        ps.push(n.p);
      }
      i = e + 1;
      const q = lenAt(body, i);
      i += q.len;
      if (!ps.length) continue;
      ev.push({ ps, t: dur((l ? l.a : 1) * q.a, (l ? l.b : 1) * q.b), tie: tied });
      tied = false;
    } else if (c === "z" || c === "x") {
      const q = lenAt(body, i + 1);
      i += 1 + q.len;
      ev.push({ ps: null, t: dur(q.a, q.b) });
    } else if (/[_^=A-Ga-g]/.test(c)) {
      const n = noteAt(body, i);
      if (!n) { i++; continue; }
      i += n.len;
      const q = lenAt(body, i);
      i += q.len;
      ev.push({ ps: [n.p], t: dur(q.a, q.b), tie: tied });
      tied = false;
    } else if (c === "-") {
      tied = true;
      i++;
    } else if (c === ">" || c === "<") {
      let n = 0;
      while (body[i] === c) (n++, i++);
      const big = 2 - 0.5 ** n,
        small = 0.5 ** n,
        last = [...ev].reverse().find((e) => e.t);
      if (!last) throw "broken rhythm at the start";
      last.t *= c === ">" ? big : small;
      broken = c === ">" ? small : big;
    } else i++;
  }
  return ev;
}

/* Play out the repeats: |: A :| twice, first and second endings, into one straight run. */
function unroll(ev) {
  const out = [];
  let cur = [],
    mark = -1;
  const repeat = () => {
    if (mark >= 0) out.push(...cur, ...cur.slice(0, mark));
    else out.push(...cur, ...cur);
    cur = [];
    mark = -1;
  };
  for (const e of ev) {
    if (e.ending) {
      if (e.ending === 1) mark = cur.length;
      continue;
    }
    if (e.bar) {
      if (e.bar.startsWith(":") || e.bar === "::") repeat();
      else if (["|:", "||", "|]", "[|"].includes(e.bar)) (out.push(...cur), (cur = []), (mark = -1));
      continue;
    }
    cur.push(e);
  }
  return out.concat(cur);
}

/* length of the opening bar, if it is shorter than a full one */
function abcPickup(ev, barLen) {
  let t = 0;
  for (const e of ev) {
    if (e.t) t += e.t;
    else if (e.bar && t > 0) break;
    else if (e.bar === undefined && e.ending) break;
  }
  return t > 0 && t < barLen ? t : 0;
}

const TEMPO = { // comfortable practice speeds, in the meter's own beat
  reel: 56, hornpipe: 50, jig: 72, "double jig": 72, "single jig": 72, "slip jig": 66, slipjig: 66, strathspey: 46, clog: 50, "highland fling": 50, fling: 50, slide: 72, polka: 88, march: 80, waltz: 96, air: 66, "": 72,
};
const titleCase = (t) => (t === t.toUpperCase() ? t.toLowerCase().replace(/(^|[\s(-])(\w)/g, (m, a, b) => a + b.toUpperCase()) : t);
/* "The Enchanted Valley", never "Enchanted Valley, The" */
function cleanTitle(t) {
  let s = t.replace(/\s*--\s*.*$/, "").replace(/["“”]/g, "").replace(/\s+/g, " ").replace(/[.,;]+$/, "").trim();
  const m = /^(.*),\s*(The|A|An)$/i.exec(s);
  if (m) s = `${m[2]} ${m[1]}`;
  s = titleCase(s);
  return s[0].toUpperCase() + s.slice(1);
}
const DANCE = (r) => {
  const x = r.toLowerCase().replace(/[^a-z ]/g, "").trim();
  if (/slip/.test(x)) return "slip jig";
  if (/double|single|jig/.test(x)) return "jig";
  if (/reel/.test(x)) return "reel";
  if (/hornpipe/.test(x)) return "hornpipe";
  if (/strathspey/.test(x)) return "strathspey";
  if (/clog/.test(x)) return "clog";
  if (/fling/.test(x)) return "highland fling";
  if (/waltz/.test(x)) return "waltz";
  if (/march|walkaround/.test(x)) return "march";
  if (/air/.test(x)) return "air";
  return "";
};

function parseAbcTune(text, collection, file) {
  const head = {},
    body = [];
  let inBody = false;
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.replace(/(^|[^\\])%.*$/, "$1");
    const m = /^([A-Za-z]):\s*(.*)$/.exec(line);
    if (m && !inBody) {
      if (!(m[1] in head)) head[m[1]] = m[2].trim();
      if (m[1] === "K") inBody = true;
    } else if (inBody && m) {
      if (m[1] === "K" || m[1] === "M" || m[1] === "L") {
        if (m[1] !== "K") throw "meter or unit changes mid-tune";
        body.push(`[K:${m[2]}]`);
      }
    } else if (inBody) body.push(line.replace(/\\\s*$/, ""));
  }
  if (!head.T || !head.M || !head.K) throw "incomplete header";
  const time = abcMeter(head.M.trim());
  if (!METERS[time]) throw "unsupported meter";
  const key = abcKey(head.K);
  if (!key) throw "unsupported key";
  const L = /^1\/(\d+)$/.exec(head.L || "1/8");
  if (!L) throw "unusual unit";
  const barLen = METERS[time].bar * T,
    ev = abcScan(body.join("\n"), time, 16 / +L[1], key),
    pickup = abcPickup(ev, barLen);
  // join tied notes
  const flat = [];
  for (const e of unroll(ev)) {
    if (!Number.isInteger(Math.round(e.t * 1e6) / 1e6)) throw "note length has no written form";
    const t = Math.round(e.t);
    if (e.tie && flat.length) flat[flat.length - 1].t += t;
    else flat.push({ ps: e.ps, t });
  }
  if (!flat.some((n) => n.ps)) throw "no notes";
  const r = toBars(flat, barLen, pickup);
  if (r.why) throw r.why;
  const dance = DANCE(head.R || ""),
    hasOwn = /^(.*?)\s*--/.test(head.T);
  return {
    title: cleanTitle(head.T),
    by: head.C ? head.C.replace(/^C:\s*/, "") : collection === "ryans" ? "Traditional, American and British Isles" : "Traditional Irish",
    style: dance === "air" || !dance ? "air" : ["reel", "jig", "hornpipe"].includes(dance) ? dance : ["waltz", "march"].includes(dance) ? "waltz" : "dance",
    dance,
    key: key.key,
    time,
    tempo: Math.max(40, Math.min(200, TEMPO[dance] || (time === "6/8" ? 66 : 72))),
    pickup: pickup ? pickup / T : 0,
    bars: r.bars,
    enc: (head.Z || "").replace(/[\w.-]+[:@][\w.-]+\.\w+/g, "").replace(/^Contributed by\s*/i, "").replace(/,\s*$/, "").trim(),
    file,
    hasOwn,
  };
}

/* ---------- MIDI (Mutopia) ---------- */
function readMidi(buf) {
  let p = 0;
  const u32 = () => ((p += 4), buf.readUInt32BE(p - 4)),
    u16 = () => ((p += 2), buf.readUInt16BE(p - 2)),
    vlq = () => {
      let v = 0, b;
      do ((b = buf[p++]), (v = (v << 7) | (b & 127)));
      while (b & 128);
      return v;
    };
  if (buf.toString("latin1", 0, 4) !== "MThd") throw "not a MIDI file";
  p = 8;
  u16();
  const tracks = u16(),
    ppq = u16();
  if (ppq & 0x8000) throw "SMPTE timing";
  const notes = [];
  let time = null, tempo = null, times = 0;
  for (let t = 0; t < tracks; t++) {
    if (buf.toString("latin1", p, p + 4) !== "MTrk") throw "bad track";
    p += 4;
    const end = u32() + p,
      on = {};
    let now = 0, st = 0;
    while (p < end) {
      now += vlq();
      let b = buf[p];
      if (b & 128) ((st = b), p++);
      const hi = st & 0xf0;
      if (st === 0xff) {
        const ty = buf[p++], len = vlq();
        if (ty === 0x58) {
          const v = `${buf[p]}/${2 ** buf[p + 1]}`;
          if (v !== time) times++;
          time = time || v;
        }
        if (ty === 0x51 && tempo === null) tempo = 60e6 / ((buf[p] << 16) | (buf[p + 1] << 8) | buf[p + 2]);
        p += len;
      } else if (st === 0xf0 || st === 0xf7) p += vlq();
      else if (hi === 0x90 || hi === 0x80) {
        const n = buf[p++], v = buf[p++];
        if (hi === 0x90 && v > 0) (on[n] ||= []).push(now);
        else if (on[n] && on[n].length) {
          const s = on[n].shift();
          notes.push({ n, s, e: now, trk: t });
        }
      } else p += hi === 0xc0 || hi === 0xd0 ? 1 : 2;
    }
    p = end;
  }
  return { ppq, notes: notes.sort((a, b) => a.s - b.s || a.n - b.n), time, tempo, times };
}
const SPELL_SHARP = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"],
  SPELL_FLAT = ["C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab", "A", "Bb", "B"];
const LYKEY = { c: "C", d: "D", e: "E", f: "F", g: "G", a: "A", b: "B", bes: "Bb", ees: "Eb", aes: "Ab", des: "Db", ges: "Gb", fis: "F#", cis: "C#", gis: "G#", dis: "D#", ais: "A#" };
function lyInfo(ly) {
  const k = /\\key\s+([a-g](?:is|es)?|ees|aes)\s*\\(major|minor|dorian|mixolydian)/.exec(ly),
    part = /\\partial\s+(\d+)(\.?)(?:\*(\d+))?/.exec(ly);
  return {
    key: k ? LYKEY[k[1]] + { major: "", minor: "m", dorian: "dor", mixolydian: "mix" }[k[2]] : "C",
    pickupQ: part ? (4 / +part[1]) * (part[2] ? 1.5 : 1) * (part[3] ? +part[3] : 1) : 0,
    treble8: /treble_8|"G_8"|transposition\s+c/.test(ly),
  };
}
/* Merge every voice onto one line of "what strikes when". Held notes run to the next strike, so a bass that rings
   under a melody is written shorter than it sounds; the tab and the fingers are unaffected. */
function midiToBars(mid, info, meter) {
  const q = mid.ppq,
    tick = (v) => (v * q) / (4 * T), // twelfths -> MIDI ticks
    shift = info.treble8 || Math.min(...mid.notes.map((n) => n.n)) < 52 ? 12 : 0,
    flats = /^(F|Bb|Eb|Ab|Db|Gb|Dm|Gm|Cm|Fm|Bbm)$/.test(info.key),
    name = (m) => (flats ? SPELL_FLAT : SPELL_SHARP)[m % 12] + (Math.floor(m / 12) - 1),
    keep = mid.notes.filter((n) => n.e - n.s >= q / 8), // grace notes are too short to count
    groups = new Map();
  let off = 0;
  for (const n of keep) {
    const raw = (n.s * (4 * T)) / q, // to twelfths of a sixteenth
      six = Math.round(raw / T) * T, // nearest sixteenth
      tri = Math.round(raw / 16) * 16; // nearest eighth triplet
    const t = Math.abs(raw - six) <= 1.5 ? six : Math.abs(raw - tri) <= 1.5 ? tri : null;
    if (t === null) off++;
    else (groups.get(t) || groups.set(t, new Set()).get(t)).add(n.n + shift);
  }
  if (off > keep.length * 0.01) throw "rhythm finer than the format";
  const ts = [...groups.keys()].sort((a, b) => a - b),
    barLen = meter.bar * T,
    pick = Math.round(info.pickupQ * 4 * T),
    stream = [],
    barEnd = (t) => (t < pick ? pick : pick + (Math.floor((t - pick) / barLen) + 1) * barLen);
  if (ts[0] !== 0) throw "starts with silence";
  let onDown = 0, bars = 0, lastBar = -1;
  ts.forEach((t, i) => {
    const b = t < pick ? -1 : Math.floor((t - pick) / barLen);
    if (b !== lastBar) ((bars++), (lastBar = b), (onDown += t === pick + b * barLen || b < 0 ? 1 : 0));
    const next = i + 1 < ts.length ? ts[i + 1] : barEnd(t),
      ms = [...groups.get(t)].sort((a, b) => a - b);
    let at = t, head = true;
    // the strike takes the longest written length that fits; rests fill what is left up to the next strike
    while (at < next) {
      const room = Math.min(next, barEnd(at)) - at,
        fit = (head ? [...LEGAL.keys()] : LEGAL_DESC).filter((k) => k <= room).sort((a, b) => b - a)[0];
      if (!fit) throw "gap has no written form";
      stream.push({ ps: head ? ms : null, t: fit });
      at += fit;
      head = false;
    }
  });
  if (onDown < bars * 0.8) throw "bars don't line up with the music";
  return { stream, barLen, pick, name };
}

function holdable(ms, name, level) {
  // a chord nobody can hold keeps its melody and bass, then whatever else fits
  const pitch = (m) => ({ midi: m });
  if (grips(ms.map(pitch), 19).length) return ms;
  const top = ms[ms.length - 1], low = ms[0];
  for (const mid of ms.slice(1, -1).reverse()) if (grips([low, mid, top].map(pitch), 19).length) return [low, mid, top];
  if (ms.length > 1 && grips([low, top].map(pitch), 19).length) return [low, top];
  return [top];
}

function parseMidiPiece(p, dir) {
  const mid = readMidi(readFileSync(join(dir, `${p.id}.mid`))),
    info = lyInfo(readFileSync(join(dir, `${p.id}.ly`), "latin1"));
  if (mid.times > 1) throw "meter changes";
  const time = mid.time || "4/4",
    meter = METERS[time];
  if (!meter) throw "unsupported meter " + time;
  const { stream, barLen, pick, name } = midiToBars(mid, info, meter),
    flat = stream.map((n) => ({ t: n.t, ps: n.ps && holdable(n.ps, name).map(name) })),
    r = toBars(flat, barLen, pick);
  if (r.why) throw r.why;
  return {
    title: p.title.replace(/\s+/g, " ").replace(/^Nº\. \d+\.\s*/, "").replace(/^No\. \d+:\s*/, "").replace(/[“”]/g, "").replace(/\.+$/, ""),
    by: p.by.replace(/\s*\(.*$/, ""),
    style: "classical",
    dance: "",
    key: info.key,
    time,
    tempo: Math.max(40, Math.min(120, Math.round(((mid.tempo || 80) * 4) / meter.beat))),
    pickup: pick / T,
    bars: r.bars,
    mutopia: p,
  };
}

/* ---------- grading ---------- */
/* How hard a piece is to get under the fingers. Tempo stays out of it, since the player sets the speed. What counts is
   how busy and irregular the rhythm is, what the hands must do on the actual tab, how much strays from the key, how
   much is held at once, and how much there is to learn: a repeat is not new material, so it adds nothing. */
function hardness(s) {
  const notes = s.sounding,
    n = notes.length,
    tab = tabify(s, 6),
    beats = s.total / 4,
    perBeat = n / beats,
    fine = notes.filter((x) => x.dur <= 1 || !Number.isInteger(x.dur)).length / n,
    kinds = new Set(notes.map((x) => x.dur)).size,
    offBeat = notes.filter((x) => x.dur >= 3 && (x.start - (s.pickup || 0)) % 4 !== 0).length / n,
    accs = notes.filter((x) => x.show).length / n,
    chords = notes.filter((x) => x.pitches.length > 1).length / n,
    midis = notes.map((x) => x.midi),
    leap = midis.slice(1).reduce((a, m, i) => a + Math.abs(m - midis[i]), 0) / Math.max(1, n - 1),
    range = Math.max(...midis) - Math.min(...midis),
    frets = tab.map((c) => c[1]).filter((f) => f > 0),
    hand = frets.length ? frets.reduce((a, f) => a + f, 0) / frets.length : 0,
    shifts = tab.slice(1).filter((c, i) => c[1] > 0 && tab[i][1] > 0 && Math.abs(c[1] - tab[i][1]) >= 4).length / n,
    cross = tab.slice(1).filter((c, i) => c[0] !== tab[i][0]).length / n,
    fresh = chunksOf(s).filter((c) => c.same < 0).reduce((a, c) => a + (c.last - c.first + 1), 0);
  return (perBeat - 1) * 0.9 + fine * 2.5 + (kinds - 1) * 0.16 + offBeat * 2.5 + accs * 8 + leap * 0.22 + range * 0.03 + chords * 1.2 + hand * 0.16 + shifts * 2.5 + cross * 0.9 + Math.max(0, Math.abs(sigOf(s.key)) - 2) * 0.4 + (s.pickup ? 0.15 : 0) + Math.min(1.4, fresh / 220);
}

function gradeOf(s) {
  const tab = tabify(s, 6),
    fresh = chunksOf(s).filter((c) => c.same < 0).reduce((a, c) => a + (c.last - c.first + 1), 0),
    d = demandsOf(s, tab, fresh);
  return { h: hardness(s), d, skills: skillsOf(s, tab), tab, level: Math.max(d.level, levelOfTab(s)) };
}
const sigOf = (k) => (TONIC[k.replace(/(m|dor|phr|lyd|mix|loc)$/, "")] || 0) + (MODE[(/(m|dor|phr|lyd|mix|loc)$/.exec(k) || [""])[0]] || ["", 0])[1];

const DUR = { whole: 192, half: 96, quarter: 48, eighth: 24, "16th": 12, "32nd": 6, "64th": 3, breve: 384 },
  MAJ = { 0: "C", 1: "G", 2: "D", 3: "A", 4: "E", 5: "B", 6: "F#", 7: "C#", "-1": "F", "-2": "Bb", "-3": "Eb", "-4": "Ab", "-5": "Db", "-6": "Gb" },
  MIN = { 0: "Am", 1: "Em", 2: "Bm", 3: "F#m", 4: "C#m", 5: "G#m", "-1": "Dm", "-2": "Gm", "-3": "Cm", "-4": "Fm", "-5": "Bbm", "-6": "Ebm" },
  tag = (x, t) => (new RegExp(`<${t}>([^<]*)</${t}>`).exec(x) || [])[1];
const frac = (v) => { const [n, d] = v.split("/").map(Number); return (n * 192) / d; };

/* ---------- main ---------- */
const raw = process.argv[2];
if (!raw) throw new Error("usage: node tools/import-music.mjs <source folder>");
const lib = [], why = {};
const miss = (w, n = 1) => (why[w] = (why[w] || 0) + n);
for (const coll of ["ryans", "oneills"])
  for (const f of readdirSync(join(raw, coll)).sort()) {
    const text = readFileSync(join(raw, coll, f), "latin1");
    for (const tune of text.split(/\r?\n(?=X:)/)) {
      if (!/^X:/m.test(tune)) continue;
      try {
        lib.push({ ...parseAbcTune(tune.slice(tune.indexOf("X:")), coll, f), coll, no: +(/^X:\s*(\d+)/m.exec(tune) || [])[1] });
      } catch (e) {
        if (typeof e !== "string") throw e;
        miss(e);
      }
    }
  }
const mdir = join(raw, "mutopia");
for (const p of JSON.parse(readFileSync(join(mdir, "pieces.json"), "utf8")))
  try {
    lib.push({ ...parseMidiPiece(p, mdir), coll: "mutopia", no: +p.id });
  } catch (e) {
    if (typeof e !== "string") throw e;
    miss("classical: " + e);
  }

const liedDir = join(raw, "lieder"),
  dead = new Map(),
  liedPiano = [];
for (const b of readFileSync(join(liedDir, "data/composers.yaml"), "utf8").split(/\n(?=\S)/)) {
  const p = /\n\s+path: (.+)/.exec(b), n = /\n\s+name: (.+)/.exec(b), d = /\n\s+died: (\d+)/.exec(b);
  if (p && n && d) dead.set(p[1].trim(), { name: n[1].trim().replace(/^['"]|['"]$/g, ""), died: +d[1] });
}
const walkDir = (d) => readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walkDir(join(d, e.name)) : e.name.endsWith(".mscx") ? [join(d, e.name)] : []));
const pretty = (x) => x.replace(/^\d+[a-z]?[_.]+/, "").replace(/_/g, " ").trim();
let liedNo = 0;
for (const c of readdirSync(join(liedDir, "scores"))) {
  const who = dead.get(c);
  if (!who || who.died >= 1926) { miss("songs: composer too recent or undated", walkDir(join(liedDir, "scores", c)).length); continue; }
  for (const f of walkDir(join(liedDir, "scores", c))) {
    const bits = f.split(/[\\/]/), song = pretty(bits[bits.length - 2]), set = bits[bits.length - 3] === "_" ? "" : pretty(bits[bits.length - 3]);
    try {
      const r = parseLied(f, who.name, song, set);
      lib.push({ ...r.guitar, coll: "lieder", no: ++liedNo });
      if (r.piano) liedPiano.push(r.piano);
    } catch (e) {
      if (typeof e !== "string") throw e;
      miss("songs: " + e);
    }
  }
}

/* Stray colons from the old typesetting, and the capital after an O'. */
const tidyTitle = (t) => t.replace(/(\p{L}):(\p{L})/gu, "$1$2").replace(/^(\p{L}+): (\p{L}+\.?)$/u, "$1 $2").replace(/\.$/, "").replace(/\bO'(\p{Ll})/gu, (_, c) => `O'${c.toUpperCase()}`);
const seen = new Set(),
  slug = (t) => t.toLowerCase().normalize("NFD").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40),
  ids = new Set(),
  hards = [],
  hardOf = new Map(),
  gradeBy = new Map(),
  npsOf = new Map(),
  good = [];
for (const t of lib) {
  const dup = (t.bars.match(/[A-G][#b]?\d/g) || []).join("");
  if (seen.has(dup)) { miss("same notes as another entry"); continue; }
  seen.add(dup);
  let id = `${t.coll[0]}-${slug(t.title)}`;
  for (let n = 2; ids.has(id); n++) id = `${t.coll[0]}-${slug(t.title)}-${n}`;
  const def = { id, title: tidyTitle(t.title), by: /^[^a-z]+$/.test(t.by) ? t.by.replace(/\.$/, "").toLowerCase().replace(/(^|[\s'-])\p{L}/gu, (c) => c.toUpperCase()) : t.by, key: t.key, time: t.time, tempo: t.tempo, bars: t.bars, level: 6, tags: [] };
  if (t.pickup) def.pickup = t.pickup;
  try {
    const s = build(def);
    if (check(s).length) { miss("bars don't add up"); continue; }
    if (s.total % s.beat) { miss("doesn't end on a beat"); continue; }
    if (s.sounding.length < 12) { miss("too short"); continue; }
    if (s.sounding.some((n) => n.midi > 95)) { miss("too high for the guitar"); continue; }
    const shape = musicOf(s, tabify(s, 6));
    if (shape.pitches < 5 || shape.perBar < 1.5 || shape.same > 0.5 || shape.run >= 10) { miss("too little tune to play"); continue; }
    s.style = t.style;
    const g = gradeOf(s);
    hards.push(g.h);
    hardOf.set(id, Math.round(g.h * 100) / 100);
    gradeBy.set(id, g);
    const check2 = build(def);
    if (playability(check2, tabify(check2)).length) { miss("no playable tab"); continue; }
  } catch (e) {
    if (String(e).includes("cannot be played") || String(e).includes("Unknown key")) { miss("no playable tab"); continue; }
    throw e;
  }
  ids.add(id);
  const m = t.mutopia;
  def.style = t.style;
  def.tags = [t.dance, t.style === "classical" ? "chords and melody" : ""].filter(Boolean);
  def.src = t.coll;
  if (t.coll === "lieder") def.tags = ["melody"];
  def.ref = t.coll === "mutopia" ? `Mutopia piece ${m.id}` : t.coll === "oneills" ? `No. ${t.no}` : "";
  if (t.enc) def.enc = t.enc;
  if (m) def.note = [m.opus, m.edition].filter((x) => x && x.trim() && !/^mutopia$/i.test(x.trim())).join(", ");
  good.push(def);
}

/* A piece's level is its hardest demand: see docs/js/songs/demands.js. */
for (const d of good) d.level = gradeBy.get(d.id).level;

/* Speeds: a dance has a speed it is played at, so aim for that many notes a second, eased down at the early levels so a
   beginner's target is reachable, and nudged per tune so the library doesn't all sit at one tempo. */
const PACE = { reel: 7, jig: 6.2, hornpipe: 5.2, "slip jig": 5.5, strathspey: 4.6, clog: 5, "highland fling": 5, march: 4.6, waltz: 3.8, slide: 6, air: 2.6, "": 3.2 },
  EASE = { 1: 0.55, 2: 0.65, 3: 0.8, 4: 0.9, 5: 1, 6: 1.1 },
  CAP = { 1: 2, 2: 2.6, 3: 3.6, 4: 5, 5: 6.5, 6: 8 }, // the most notes a second a target can ask for at each level
  nudge = (id) => 0.88 + ([...id].reduce((a, c) => (a * 31 + c.charCodeAt(0)) % 1009, 7) / 1009) * 0.24;
for (const d of good) {
  const b = build(d),
    beats = b.total / b.beat,
    n = b.sounding.length;
  if (d.src === "ryans" || d.src === "oneills") {
    const dance = d.tags[0] || "",
      want = Math.min(CAP[d.level], (PACE[dance] ?? PACE[""]) * EASE[d.level] * nudge(d.id));
    d.tempo = Math.max(40, Math.min(d.style === "air" ? 116 : 200, Math.round((want / (n / beats)) * 60)));
  }
  npsOf.set(d.id, Math.round((n / (beats * (60 / d.tempo))) * 100) / 100);
}

/* Teaching moments: phrases that show one skill clearly, found by scanning every piece. */
const longRun = (xs, ok) => { let best = 0, run = 0, dir = 0; xs.forEach((x) => { const d = Math.sign(x); if (ok(Math.abs(x)) && (d === dir || !run)) (run++, (dir = d)); else { run = ok(Math.abs(x)) ? 1 : 0; dir = d; } best = Math.max(best, run); }); return best; };
const count = (xs, f) => xs.filter(f).length;
const SKILLS = [
  { id: "scales", name: "Scale runs", blurb: "Long lines moving by step: keep every note even.", course: "G9", test: ({ iv }) => { const r = longRun(iv, (x) => x >= 1 && x <= 2); return r >= 6 ? r : 0; } },
  { id: "arpeggios", name: "Arpeggios", blurb: "Broken chords: the fingers spell the harmony.", course: "G7", test: ({ iv }) => { const r = longRun(iv, (x) => x >= 3 && x <= 5); return r >= 3 ? r * 2 : 0; } },
  { id: "triplets", name: "Triplets", blurb: "Three even notes in the space of two.", course: "G6", test: ({ ns }) => { const c = count(ns, (n) => n.triplet); return c >= 3 ? c : 0; } },
  { id: "dotted", name: "Dotted rhythms", blurb: "Long, short: the lilt behind hornpipes and marches.", course: "G4", test: ({ ns }) => { const c = count(ns.slice(1), (n, i) => (ns[i].dur === 3 && n.dur === 1) || (ns[i].dur === 6 && n.dur === 2)); return c >= 3 ? c : 0; } },
  { id: "syncopation", name: "Syncopation", blurb: "Weight on the off-beat, against the click.", course: "G4", test: ({ ns, s }) => { const c = count(ns, (n) => n.dur >= 4 && (n.start - (s.pickup || 0)) % 4 !== 0); return c >= 2 ? c * 2 : 0; } },
  { id: "crossing", name: "String crossing", blurb: "Clean jumps from string to string.", course: "G5", test: ({ ns, tab }) => { const c = count(tab.slice(1), (x, i) => x[0] !== tab[i][0]) / ns.length; return ns.length >= 8 && c >= 0.65 ? c * 10 : 0; } },
  { id: "shifts", name: "Position shifts", blurb: "Move the whole hand up the neck and land in tune.", course: "G8", test: ({ tab }) => { const c = count(tab.slice(1), (x, i) => x[1] > 0 && tab[i][1] > 0 && Math.abs(x[1] - tab[i][1]) >= 5); return c >= 1 ? c * 3 : 0; } },
  { id: "leaps", name: "Wide leaps", blurb: "Big jumps in pitch, in time.", course: "G8", test: ({ iv }) => { const c = count(iv, (x) => Math.abs(x) >= 7); return c >= 3 ? c : 0; } },
  { id: "chromatic", name: "Chromatic lines", blurb: "One fret at a time, every finger in turn.", course: "G9", test: ({ iv }) => { const r = longRun(iv, (x) => x === 1); return r >= 3 ? r * 2 : 0; } },
  { id: "fast", name: "Sixteenth-note runs", blurb: "Bursts of speed: start slow, stay relaxed.", course: "G9", test: ({ ns }) => { const c = count(ns, (n) => n.dur === 1); return c >= 8 ? c : 0; } },
  { id: "voices", name: "Two voices", blurb: "Bass and melody at once.", course: "G7", test: ({ ns }) => { const c = count(ns, (n) => n.pitches.length > 1) / ns.length; return ns.length >= 6 && c >= 0.4 ? c * 10 : 0; } },
  { id: "pedal", name: "Pedal notes", blurb: "One note keeps returning under a moving line.", course: "G7", test: ({ m }) => { const c = count(m.slice(2), (x, i) => x === m[i]); return c >= 5 ? c : 0; } },
];
{
  const found = SKILLS.map(() => []);
  for (const d of good) {
    const b = build(d),
      full = b.sounding.length > 700 ? null : tabify(b, 6);
    if (!full) continue;
    for (const c of chunksOf(b)) {
      const count_ = c.last - c.first + 1;
      if (c.same >= 0 || c.to - c.from > 5 || count_ < 6 || count_ > 34) continue;
      const ns = b.sounding.slice(c.first, c.last + 1),
        tab = full.slice(c.first, c.last + 1),
        phrase = musicOf({ sounding: ns, barLens: [c.from] }, tab);
      if (phrase.pitches < 4 || phrase.same > 0.4) continue; // a phrase needs some music in it to be worth drilling
      const
        m = ns.map((n) => n.midi),
        iv = m.slice(1).map((x, i) => x - m[i]);
      SKILLS.forEach((sk, i) => {
        const score = sk.test({ ns, tab, iv, m, s: b });
        if (score) found[i].push({ d, from: c.from, to: c.to, score });
      });
    }
  }
  SKILLS.forEach((sk, i) => {
    const seen = new Set(),
      strong = found[i].sort((a, b) => b.score - a.score).slice(0, Math.max(60, found[i].length >> 2)).sort((a, b) => hardOf.get(a.d.id) - hardOf.get(b.d.id)),
      step = Math.max(1, Math.floor(strong.length / 40)),
      items = [];
    for (let k = 0; k < strong.length && items.length < 14; k += step) {
      const x = strong[k];
      if (seen.has(x.d.id)) continue;
      seen.add(x.d.id);
      items.push({ id: `${x.d.id}@${x.from}-${x.to}`, title: x.d.title, by: x.d.by, level: x.d.level, bars: `${x.from + 1}–${x.to + 1}` });
    }
    sk.items = items.sort((a, b) => a.level - b.level);
  });
}

const here = fileURLToPath(new URL("../docs/", import.meta.url)),
  out = join(here, "lib"),
  CHUNK = 120;
rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });
good.sort((a, b) => a.level - b.level || a.title.localeCompare(b.title));
const rows = [];
for (let c = 0; c * CHUNK < good.length; c++) {
  const part = good.slice(c * CHUNK, (c + 1) * CHUNK);
  writeFileSync(join(out, `songs-${c}.json`), JSON.stringify(part));
  part.forEach((d) => rows.push([d.id, d.title, d.by, d.style, d.level, d.key, d.time, d.tempo, c, hardOf.get(d.id), npsOf.get(d.id), gradeBy.get(d.id).d.limit]));
}
writeFileSync(join(out, "index.json"), JSON.stringify(rows));
writeFileSync(join(here, "js/songs/moments-data.js"), `/* Generated by tools/import-music.mjs: phrases from real pieces that teach one skill, easiest first. */\nexport const SKILLS = ${JSON.stringify(SKILLS.map(({ test, ...k }) => k), null, 1)};\n`);
const tally = (f) => good.reduce((a, d) => ((a[f(d)] = (a[f(d)] || 0) + 1), a), {});
console.log({ parsed: lib.length, kept: good.length, levels: tally((d) => d.level), styles: tally((d) => d.style), sources: tally((d) => d.src) });
console.log(Object.entries(why).sort((a, b) => b[1] - a[1]));

/* ---------- the guitar syllabus: stages that sit beside the courses ---------- */
const FAMOUS = /Auld Lang Syne|Last Rose of Summer|Minstrel Boy|Londonderry|Danny Boy|Scarborough|Drunken Sailor|Yankee Doodle|Red River|Home,? Sweet Home|Annie Laurie|Swing Low|Amazing Grace|Shenandoah|Wild Rover|Molly Malone|Foggy Dew|Blue Bells|Arkansas Traveler|Turkey in the Straw|Soldier's Joy|Irish Washerwoman|Sailor's Hornpipe|St\.? Patrick's Day|Fisher's Hornpipe|Rule Britannia|Menuet in G|Sicilienne|Pleyel's Hymn|Lute Suite|Prelude in D Minor|Etude 1$|Etude in A minor|Vals no\. 3/i;
const unit = (def, g, own) => {
  const s = build(def),
    tab = g ? g.tab : tabify(s, 6),
    grade = g || { d: demandsOf(s, tab, chunksOf(s).filter((c) => c.same < 0).reduce((a, c) => a + (c.last - c.first + 1), 0)), skills: skillsOf(s, tab), h: hardness(s) },
    bars = s.barLens.length,
    gone = s.barLens.filter((_, b) => !s.sounding.some((n) => n.bar === b)).length / s.barLens.length,
    out = { id: def.id, title: def.title, by: def.by, level: own ? Math.max(grade.d.level, levelOfTab(s)) : def.level, d: grade.d, skills: grade.skills, h: grade.h, nps: npsOf.get(def.id) ?? +(s.sounding.length / ((s.total / s.beat) * (60 / s.tempo))).toFixed(2), own, known: own || FAMOUS.test(def.title), lied: def.src === "lieder", classical: def.style === "classical", sparse: gone > 0.12 || s.sounding.length / s.barLens.length < 2.5, strings: [...new Set(tab.map((c) => c[0]))], top: Math.max(...tab.flatMap((c) => (c.all || [c]).map((p) => p[1]))), q: musicOf(s, tab), time: s.time, key: s.key, fit: 0 };
  if (grade.d.voices === 1) {
    const open = chartFor(s, "open"),
      barre = chartFor(s, "barre"),
      EASY = /^(Em|Am|E|E7|A|A7|D|Dm|D7|C|G|G7|B7)$/;
    out.fit = open.fit;
    const sizeOf = (chart) => ({ names: chart.names, moves: chart.moves, rate: chart.moves / bars, peak: Math.max(0, ...changesOf(chart).map((m) => m.cost)) });
    out.open = { ...sizeOf(open), easy: open.names.every((n) => EASY.test(n)) };
    out.barre = sizeOf(barre);
    out.pairs = [...new Set(open.spans.slice(1).map((sp, i) => (sp.name === open.spans[i].name ? "" : changeKey(sp.name, open.spans[i].name))).filter(Boolean))];
  }
  return out;
};
const pool = [...SONGS.map((d) => unit(d, null, true)), ...good.map((d) => unit(d, gradeBy.get(d.id), false))];
const GUITAR_PATH = buildSyllabus(pool, console.log);
/* How often real pieces make each chord change, with the easiest few that do. This is what the recommendations lean on. */
const use = {};
for (const x of [...pool].filter((p) => p.pairs && p.fit >= 0.74).sort((a, b) => a.level - b.level || a.h - b.h))
  for (const k of x.pairs) {
    const u = (use[k] ||= { n: 0, songs: [] });
    u.n++;
    if (u.songs.length < 3) u.songs.push({ id: x.id, title: x.title });
  }
writeFileSync(join(here, "js/songs/changes-data.js"), `/* Generated by tools/import-music.mjs: how many pieces make each chord change, in the worked-out chords. */\nexport const CHANGE_USE = ${JSON.stringify(use)};\n`);
writeFileSync(join(here, "js/songs/path-data.js"), `/* Generated by tools/import-music.mjs: the guitar syllabus, one stage beside each course. Each song adds a skill or two to the last: see tools/syllabus.mjs. */\nexport const GUITAR_PATH = ${JSON.stringify(GUITAR_PATH, null, 1)};\n`);

/* ---------- piano: both hands kept apart, written as "right/left:length" ---------- */
function parsePiano(p, dir) {
  const mid = readMidi(readFileSync(join(dir, `${p.id}.mid`))),
    info = lyInfo(readFileSync(join(dir, `${p.id}.ly`), "latin1"));
  if (mid.times > 1) throw "meter changes";
  const time = mid.time || "4/4",
    meter = METERS[time];
  if (!meter) throw "unsupported meter " + time;
  const q = mid.ppq,
    flats = /^(F|Bb|Eb|Ab|Db|Gb|Dm|Gm|Cm|Fm|Bbm)/.test(info.key),
    name = (m) => (flats ? SPELL_FLAT : SPELL_SHARP)[m % 12] + (Math.floor(m / 12) - 1),
    keep = mid.notes.filter((n) => n.e - n.s >= q / 12),
    trks = [...new Set(keep.map((n) => n.trk))],
    mean = (t) => { const ns = keep.filter((n) => n.trk === t); return ns.reduce((a, n) => a + n.n, 0) / ns.length; },
    low = trks.length > 1 ? new Set(trks.filter((t) => mean(t) < 60)) : null,
    isLeft = (n) => (low ? low.has(n.trk) : n.n < 60);
  if (low && (!low.size || low.size === trks.length)) throw "can't tell the hands apart";
  const groups = new Map();
  let off = 0;
  for (const n of keep) {
    const raw = (n.s * (4 * T)) / q,
      six = Math.round(raw / (T / 2)) * (T / 2), // nearest thirty-second
      tri = Math.round(raw / 16) * 16,
      t = Math.abs(raw - six) <= 1 ? six : Math.abs(raw - tri) <= 1.5 ? tri : null;
    if (t === null) { off++; continue; }
    const g = groups.get(t) || groups.set(t, { r: new Set(), l: new Set() }).get(t);
    g[isLeft(n) ? "l" : "r"].add(n.n);
  }
  if (off > keep.length * 0.02) throw "rhythm finer than the format";
  return pianoPiece(groups, { time, meter, pick: Math.round(info.pickupQ * 4 * T), name, key: info.key, tempo: Math.max(40, Math.min(132, Math.round(((mid.tempo || 80) * 4) / meter.beat))), title: p.title.replace(/\s+/g, " "), by: p.by.replace(/\s*\(.*$/, ""), note: [p.opus, p.edition].filter((x) => x && x.trim() && !/^mutopia$/i.test(x.trim())).join(", "), ref: `Mutopia piece ${p.id}` });
}
/* groups = Map of time (twelfths) -> { r: Set, l: Set } of MIDI notes */
function pianoPiece(groups, { time, meter, pick, name, key, tempo, title, by, note, ref, src }) {
  const ts = [...groups.keys()].sort((a, b) => a - b);
  if (ts.length < 16) throw "too short";
  if (ts.length > 1100) throw "too long for one sitting";
  const barLen = meter.bar * T,
    barOf = (t) => (t < pick ? 0 : Math.floor((t - pick) / barLen) + (pick ? 1 : 0)),
    bars = [],
    fmt = (v) => +(v / T).toFixed(3);
  let onDown = 0, seenBars = new Set();
  ts.forEach((t, i) => {
    const g = groups.get(t),
      b = barOf(t),
      side = (s) => [...s].sort((x, y) => x - y).map(name).join("+"),
      next = i + 1 < ts.length ? ts[i + 1] : t + 4 * T;
    if (!seenBars.has(b)) (seenBars.add(b), (onDown += t === pick + (b - (pick ? 1 : 0)) * barLen || t < pick ? 1 : 0));
    (bars[b] ||= []).push(`${side(g.r)}/${side(g.l)}:${fmt(next - t)}`);
  });
  if (onDown < seenBars.size * 0.6) throw "bars don't line up with the music";
  const steps = ts.map((t) => groups.get(t)),
    n = steps.length,
    quarters = (ts[n - 1] - ts[0]) / (4 * T) + 1,
    both = steps.filter((g) => g.r.size && g.l.size).length / n,
    chords = steps.filter((g) => g.r.size > 1 || g.l.size > 1).length / n,
    all = steps.flatMap((g) => [...g.r, ...g.l]),
    blackKeys = all.filter((m) => [1, 3, 6, 8, 10].includes(m % 12)).length / all.length,
    h = (n / quarters) * 1.3 + both * 1 + chords * 6 + blackKeys * 3 + ((Math.max(...all) - Math.min(...all)) / 12) * 0.28 + Math.min(1.5, n / 400);
  return { title, by, key, time, tempo, bars: bars.filter(Boolean).map((b) => b.join(" ")), note, ref, h: Math.round(h * 100) / 100, n, src };
}

/* ---------- OpenScore Lieder (MuseScore files) ---------- */
/* spelled name from MuseScore's tonal pitch class, e.g. tpc 20 = F# */
function spelled(midi, tpc) {
  const k = ((tpc - 13) % 7 + 7) % 7,
    acc = Math.floor((tpc - 13) / 7);
  if (Math.abs(acc) > 1) return null;
  return "FCGDAEB"[k] + (acc > 0 ? "#" : acc < 0 ? "b" : "") + (Math.floor((midi - acc) / 12) - 1);
}
/* one staff: every note struck, by time in twelfths of a sixteenth, with ties joined */
function readStaff(xml, firstVoiceOnly) {
  const sigN = [...xml.matchAll(/<sigN>(\d+)<\/sigN>\s*<sigD>(\d+)<\/sigD>/g)].map((m) => `${m[1]}/${m[2]}`);
  if (new Set(sigN).size !== 1) throw "meter changes";
  const time = sigN[0],
    full = frac(time),
    notes = [];
  let at = 0, first = true, pick = 0;
  for (const m of xml.matchAll(/<Measure([^>]*)>([\s\S]*?)<\/Measure>/g)) {
    const len = /len="([^"]+)"/.exec(m[1]),
      size = len ? frac(len[1]) : full;
    if (first && len && size < full) pick = size;
    first = false;
    const voices = [...m[2].matchAll(/<voice>([\s\S]*?)<\/voice>/g)].map((v) => v[1]);
    (firstVoiceOnly ? voices.slice(0, 1) : voices).forEach((v) => {
      let t = at, tri = false;
      for (const e of v.matchAll(/<(Chord|Rest)>([\s\S]*?)<\/\1>|<Tuplet>([\s\S]*?)<\/Tuplet>|<endTuplet\/>/g)) {
        if (e[0].startsWith("<Tuplet")) {
          if (tag(e[3], "actualNotes") !== "3" || tag(e[3], "normalNotes") !== "2") throw "tuplet other than a triplet";
          tri = true;
          continue;
        }
        if (e[0].startsWith("<endTuplet")) { tri = false; continue; }
        const body = e[2];
        if (/<(acciaccatura|appoggiatura|grace\d+|grace\d+after)\/>/.test(body)) continue;
        const type = tag(body, "durationType");
        let d = type === "measure" ? frac(tag(body, "duration")) : DUR[type];
        if (!d) throw "unknown length";
        const dots = +(tag(body, "dots") || 0);
        if (dots === 1) d *= 1.5;
        if (dots === 2) d *= 1.75;
        if (tri) d = (d * 2) / 3;
        if (e[1] === "Chord")
          for (const n of body.matchAll(/<Note>([\s\S]*?)<\/Note>/g)) {
            const pitch = +tag(n[1], "pitch"), tpc = +tag(n[1], "tpc"),
              tied = /<Spanner type="Tie">\s*<prev>/.test(n[1]);
            notes.push({ t, d, pitch, tpc, tied });
          }
        t += d;
      }
    });
    at += size;
  }
  const keyN = +(/<KeySig>\s*<accidental>(-?\d+)/.exec(xml) || [0, 0])[1],
    tempo = +(/<tempo>([\d.]+)<\/tempo>/.exec(xml) || [0, 0])[1];
  return { time, pick, notes, keyN, tempo, end: at };
}
/* notes into a line the format can write: held notes stop at barlines, rests take up whatever is left */
function lineOf(ns, end, barLen, pick) {
  const barEnd = (t) => (t < pick ? pick : pick + (Math.floor((t - pick) / barLen) + 1) * barLen),
    stream = [];
  const put = (ps, t, len) => {
    let at = t, left = len, head = !!ps;
    while (left > 0) {
      const room = Math.min(left, barEnd(at) - at),
        fit = [...LEGAL.keys()].filter((k) => k <= room).sort((a, b) => b - a)[0];
      if (!fit) throw "note length has no written form";
      stream.push({ ps: head ? ps : null, t: fit });
      at += fit;
      left -= fit;
      head = false;
    }
  };
  ns.forEach((n, i) => {
    const next = i + 1 < ns.length ? ns[i + 1].t : Math.max(n.t + n.d, n.t);
    if (next <= n.t) throw "two notes at once in the melody";
    put([n.name], n.t, next - n.t);
  });
  return stream;
}
function parseLied(file, by, title, set) {
  const xml = readFileSync(file, "utf8"),
    parts = [...xml.matchAll(/<Part>([\s\S]*?)<\/Part>/g)].map((m) => ({ voice: /voice\./.test(tag(m[1], "instrumentId") || ""), staves: [...m[1].matchAll(/<Staff id="(\d+)">/g)].map((x) => x[1]) })),
    vPart = parts.find((p) => p.voice),
    pPart = parts.find((p) => !p.voice && p.staves.length === 2);
  if (!vPart || vPart.staves.length !== 1 || !pPart) throw "not one voice and piano";
  const score = xml.slice(xml.lastIndexOf("</Part>")),
    staff = (id) => {
      const from = score.indexOf(`<Staff id="${id}">`),
        to = score.indexOf("</Staff>", from);
      if (from < 0 || to < 0) throw "missing staff";
      return score.slice(from, to);
    };
  const V = readStaff(staff(vPart.staves[0]), true),
    L = readStaff(staff(pPart.staves[1]), false),
    meter = METERS[V.time];
  if (!meter) throw "unsupported meter";
  const seen = new Map();
  V.notes.forEach((n) => { const o = seen.get(n.t); if (!o || n.pitch > o.pitch) seen.set(n.t, n); }); // the top note of any divided part
  const melody = [];
  for (const n of [...seen.values()].sort((a, b) => a.t - b.t)) {
    if (n.tied && melody.length) melody[melody.length - 1].d += n.d;
    else if (!n.tied) melody.push({ ...n });
  }
  if (melody.length < 16) throw "too short";
  const lo = Math.min(...melody.map((n) => n.pitch)),
    up = lo < 52 ? Math.ceil((52 - lo) / 12) * 12 : 0;
  if (Math.max(...melody.map((n) => n.pitch)) + up > 95) throw "too wide for the guitar";
  melody.forEach((n) => { n.name = spelled(n.pitch + up, n.tpc); if (!n.name) throw "double accidental"; });
  const barLen = meter.bar * T,
    start = melody[0].t,
    offset = ((start - (V.pick % barLen)) % barLen + barLen) % barLen,
    pick = offset ? barLen - offset : 0,
    shifted = melody.map((n) => ({ ...n, t: n.t - start })),
    lastNote = L.notes.filter((n) => !n.tied).sort((a, b) => a.t - b.t || a.pitch - b.pitch).find((n, i, arr) => n.t === arr[arr.length - 1].t),
    minor = lastNote && ((lastNote.pitch % 12) + 12) % 12 === ((({ 0: 9, 1: 4, 2: 11, 3: 6, 4: 1, 5: 8, "-1": 2, "-2": 7, "-3": 0, "-4": 5, "-5": 10, "-6": 3 })[V.keyN]) ?? -1),
    key = (minor ? MIN : MAJ)[V.keyN] || MAJ[V.keyN];
  if (!key) throw "unsupported key";
  const r = toBars(lineOf(shifted, 0, barLen, pick), barLen, pick);
  if (r.why) throw r.why;
  const q = V.tempo ? V.tempo * 60 : 80,
    tempo = Math.max(40, Math.min(120, Math.round((q * 4) / meter.beat))),
    whole = set ? `${title} (${set})` : title;
  // for piano: the tune in the right hand over the song's left hand, from where the voice comes in
  const flats = /^(F|Bb|Eb|Ab|Db|Gb|Dm|Gm|Cm|Fm|Bbm|Ebm)/.test(key),
    name = (m) => (flats ? SPELL_FLAT : SPELL_SHARP)[m % 12] + (Math.floor(m / 12) - 1),
    groups = new Map(),
    at = (t) => groups.get(t) || groups.set(t, { r: new Set(), l: new Set() }).get(t),
    grid = (t) => Math.round(t);
  melody.forEach((n) => at(grid(n.t - start)).r.add(n.pitch));
  L.notes.filter((n) => !n.tied && n.t >= start).forEach((n) => at(grid(n.t - start)).l.add(n.pitch));
  let piano = null;
  try {
    piano = pianoPiece(groups, { time: V.time, meter, pick, name, key, tempo, title: whole, by, note: "", ref: "Melody over the left hand, from OpenScore Lieder", src: "lieder" });
  } catch (e) {
    if (typeof e !== "string") throw e;
  }
  return { guitar: { title: whole, by, style: "song", dance: "", key, time: V.time, tempo, pickup: pick / T, bars: r.bars }, piano };
}
const pdir = join(raw, "piano"),
  piano = [],
  pianoWhy = {};
for (const p of JSON.parse(readFileSync(join(pdir, "pieces.json"), "utf8")))
  try {
    piano.push(parsePiano(p, pdir));
  } catch (e) {
    if (typeof e !== "string") throw e;
    pianoWhy[e] = (pianoWhy[e] || 0) + 1;
  }
const PER_LEVEL = 30; // song arrangements kept for each piano level
piano.push(...liedPiano);
piano.sort((a, b) => a.h - b.h);
{
  const size = piano.length,
    count = {};
  piano.forEach((d, i) => (d.level = 1 + Math.min(5, Math.floor((i / size) * 6))));
  const keep = piano.filter((d) => d.src !== "lieder" || (count[d.level] = (count[d.level] || 0) + 1) <= PER_LEVEL);
  piano.length = 0;
  piano.push(...keep);
}
const ranks = piano.length,
  pslug = new Set();
piano.forEach((d, i) => {
  let id = `p-${slug(`${d.by.split(" ").pop()}-${d.title}`)}`;
  for (let k = 2; pslug.has(id); k++) id = `p-${slug(`${d.by.split(" ").pop()}-${d.title}`)}-${k}`;
  pslug.add(id);
  d.id = id;
});
const prows = [];
for (let c = 0; c * 40 < piano.length; c++) {
  const part = piano.slice(c * 40, (c + 1) * 40);
  writeFileSync(join(out, `piano-${c}.json`), JSON.stringify(part));
  part.forEach((d) => prows.push([d.id, d.title, d.by, d.level, d.key, d.time, d.n, c]));
}
writeFileSync(join(out, "piano-index.json"), JSON.stringify(prows));
const PSTAGES = [["First pieces", "One idea at a time, hands mostly apart."], ["Two hands talking", "Melody over a simple left hand."], ["Studies and dances", "Short studies, minuets and waltzes."], ["Romantic miniatures", "More colour, more of the keyboard."], ["Bigger forms", "Inventions, rags and longer pieces."], ["Concert repertoire", "The real thing, at length."]];
const PIANO_PATH = PSTAGES.map(([title, blurb], i) => ({ title, blurb, songs: piano.filter((d) => d.level === i + 1).sort((a, b) => /Chorale|Ermuntre/.test(a.title) - /Chorale|Ermuntre/.test(b.title)).map((d) => ({ id: d.id, title: d.title, by: d.by })) }));
writeFileSync(join(here, "js/piano/path-data.js"), `/* Generated by tools/import-music.mjs: the piano song path, easiest first. */\nexport const PIANO_PATH = ${JSON.stringify(PIANO_PATH, null, 1)};\n`);
console.log("piano", piano.length, pianoWhy, PIANO_PATH.map((s) => s.title + ": " + s.songs.slice(0, 3).map((x) => x.by.split(" ").pop() + " " + x.title.slice(0, 26)).join("; ")));
console.log("path", GUITAR_PATH.map((s) => `${s.course} ${s.songs.length}: ${s.songs.map((x) => x.title.slice(0, 22)).join(" | ")}`));

hards.sort((a, b) => a - b);
console.log("hardness percentiles", [5, 15, 30, 50, 70, 85, 95, 99].map((p) => `${p}%=${hards[Math.floor((hards.length * p) / 100)].toFixed(2)}`).join(" "));

const tally2 = (f) => good.reduce((a, d) => ((a[f(d)] = (a[f(d)] || 0) + 1), a), {});
console.log("speed", tally2((d) => (npsOf.get(d.id) < 2.5 ? "slow" : npsOf.get(d.id) < 4.5 ? "moderate" : "fast")), "levels", tally2((d) => d.level));
console.log("skills", SKILLS.map((k) => `${k.name} ${k.items.length}`).join(", "));
for (const lv of [1, 3, 6]) console.log("L" + lv, good.filter((d) => d.level === lv).sort((a, b) => hardOf.get(a.id) - hardOf.get(b.id)).filter((_, i, a) => i % Math.ceil(a.length / 5) === 0).map((d) => `${d.title.slice(0, 26)} [${d.style} ${d.tempo}]`).join(" | "));
