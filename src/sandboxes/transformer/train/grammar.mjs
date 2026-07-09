/* Synthetic grammar for the toy transformer.
   Word-level, ~47 tokens, sentences ≤ 12 including BOS.
   Designed so attention has human-readable jobs:
   - number agreement: "the cat sits" / "the cats sit"
   - agreement across a distractor: "the cat near the dogs sits"
     (the verb must find the SUBJECT, not the nearest noun)
   - possessive agreement across the verb: "the cat licks its paw"
     vs "the dogs lick their paws" */

export const BOS = '<s>';
export const EOS = '.';

const NOUNS = [
  ['cat', 'cats'], ['dog', 'dogs'], ['bird', 'birds'],
  ['fox', 'foxes'], ['mouse', 'mice'],
];
const PLACES = ['mat', 'box', 'tree', 'garden'];
const VERBS_INTR = [
  ['sits', 'sit'], ['runs', 'run'], ['sleeps', 'sleep'],
  ['jumps', 'jump'], ['looks', 'look'],
];
const VERBS_POSS = [['licks', 'lick'], ['finds', 'find']];
const BODY = [['tail', 'tails'], ['paw', 'paws']];
const ADJS = ['big', 'small', 'old'];
const ADVS = ['quietly', 'quickly', 'today'];
const PREPS = ['on', 'near', 'under'];

export const VOCAB = [
  BOS, EOS, 'the', 'a',
  ...ADJS,
  ...NOUNS.flat(),
  ...PLACES,
  ...VERBS_INTR.flat(),
  ...VERBS_POSS.flat(),
  'its', 'their',
  ...BODY.flat(),
  ...PREPS,
  ...ADVS,
];

export const T_MAX = 12;

/* metadata the eval + UI hints need */
export const VERB_PAIRS = [...VERBS_INTR, ...VERBS_POSS]; // [sg, pl]
export const NOUN_SG = new Set(NOUNS.map((n) => n[0]));
export const NOUN_PL = new Set(NOUNS.map((n) => n[1]));

const pick = (rng, arr) => arr[Math.floor(rng() * arr.length)];

/* Returns { words, meta } — meta marks subject/verb positions for eval. */
export function genSentence(rng) {
  const plural = rng() < 0.5;
  const noun = pick(rng, NOUNS)[plural ? 1 : 0];
  const det = plural ? 'the' : (rng() < 0.35 ? 'a' : 'the');
  const words = [BOS, det];
  if (rng() < 0.4) words.push(pick(rng, ADJS));
  const subjPos = words.length;
  words.push(noun);

  const template = rng();
  const meta = { subjPos, plural, verbPos: -1, distractorPos: -1, possPos: -1 };

  if (template < 0.3) {
    // the (adj) N  V  (adv) .
    meta.verbPos = words.length;
    words.push(pick(rng, VERBS_INTR)[plural ? 1 : 0]);
    if (rng() < 0.5) words.push(pick(rng, ADVS));
  } else if (template < 0.55) {
    // the (adj) N  V  prep the place .
    meta.verbPos = words.length;
    words.push(pick(rng, VERBS_INTR)[plural ? 1 : 0]);
    words.push(pick(rng, PREPS), 'the', pick(rng, PLACES));
  } else if (template < 0.8) {
    // the N prep the N'  V .   ← agreement across a distractor of the
    // OPPOSITE number, so the verb can't just copy its neighbour
    const other = pick(rng, NOUNS)[plural ? 0 : 1];
    words.length = subjPos; // drop optional adj to keep it short
    words.push(noun, pick(rng, PREPS), 'the');
    meta.distractorPos = words.length;
    words.push(other);
    meta.verbPos = words.length;
    words.push(pick(rng, VERBS_INTR)[plural ? 1 : 0]);
    meta.subjPos = subjPos;
  } else {
    // the (adj) N  licks its/their  paw/paws .
    meta.verbPos = words.length;
    words.push(pick(rng, VERBS_POSS)[plural ? 1 : 0]);
    meta.possPos = words.length;
    words.push(plural ? 'their' : 'its');
    words.push(pick(rng, BODY)[plural ? 1 : 0]);
  }

  words.push(EOS);
  if (words.length > T_MAX) words.length = T_MAX; // safety (never triggers)
  return { words, meta };
}
