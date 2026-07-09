/* Browser-side forward pass for the toy transformer.
   Mirrors train/train.mjs exactly (pre-LN GPT, tied unembedding) but keeps
   every intermediate so the stations can show real numbers. T ≤ 12 and
   d = 32, so recomputing on every interaction is free. */
import W from './weights.json';

export const CFG = W.config;           // { V, D, HEADS, DH, LAYERS, DMLP, T_MAX }
export const VOCAB = W.vocab;
export const BOS = VOCAB[0];
export const EOS = '.';
export const tokId = new Map(VOCAB.map((w, i) => [w, i]));

const { V, D, HEADS, DH, LAYERS, DMLP } = CFG;

/* row helpers over flat row-major arrays */
const row = (flat, i, c) => flat.slice(i * c, (i + 1) * c);

function matmul(A, r, k, B, c) {
  const O = new Float64Array(r * c);
  for (let i = 0; i < r; i++) for (let p = 0; p < k; p++) {
    const a = A[i * k + p];
    if (a === 0) continue;
    for (let j = 0; j < c; j++) O[i * c + j] += a * B[p * c + j];
  }
  return O;
}

function layernorm(A, r, c, g, b) {
  const O = new Float64Array(r * c);
  for (let i = 0; i < r; i++) {
    let m = 0;
    for (let j = 0; j < c; j++) m += A[i * c + j];
    m /= c;
    let v = 0;
    for (let j = 0; j < c; j++) { const d = A[i * c + j] - m; v += d * d; }
    const iv = 1 / Math.sqrt(v / c + 1e-5);
    for (let j = 0; j < c; j++) O[i * c + j] = (A[i * c + j] - m) * iv * g[j] + b[j];
  }
  return O;
}

const geluF = (x) => 0.5 * x * (1 + Math.tanh(0.7978845608 * (x + 0.044715 * x * x * x)));

export function softmax(arr, temp = 1) {
  const sc = arr.map((v) => v / temp);
  const mx = Math.max(...sc);
  const e = sc.map((v) => Math.exp(v - mx));
  const s = e.reduce((a, b) => a + b, 0);
  return e.map((v) => v / s);
}

export const encode = (words) => words.map((w) => tokId.get(w));

/* Full forward pass with intermediates.
   opts.causal=false disables the mask (for the station-2 toggle). */
export function forward(ids, opts = {}) {
  const causal = opts.causal !== false;
  const T = ids.length;

  const emb = new Float64Array(T * D);
  const posE = new Float64Array(T * D);
  for (let i = 0; i < T; i++) {
    for (let j = 0; j < D; j++) {
      emb[i * D + j] = W.tok[ids[i] * D + j];
      posE[i * D + j] = W.pos[i * D + j];
    }
  }
  let x = new Float64Array(T * D);
  for (let i = 0; i < x.length; i++) x[i] = emb[i] + posE[i];
  const x0 = x.slice();

  const layers = [];
  for (let l = 0; l < LAYERS; l++) {
    const Lw = W.layers[l];
    const h1 = layernorm(x, T, D, Lw.ln1g, Lw.ln1b);
    const Q = matmul(h1, T, D, Lw.wq, D);
    const K = matmul(h1, T, D, Lw.wk, D);
    const Vv = matmul(h1, T, D, Lw.wv, D);

    const heads = [];
    const attnOut = new Float64Array(T * D);
    for (let h = 0; h < HEADS; h++) {
      const off = h * DH;
      // scores (scaled dot products), pre-mask
      const scores = new Float64Array(T * T);
      for (let i = 0; i < T; i++) for (let j = 0; j < T; j++) {
        let s = 0;
        for (let p = 0; p < DH; p++) s += Q[i * D + off + p] * K[j * D + off + p];
        scores[i * T + j] = s / Math.sqrt(DH);
      }
      // softmax (causal or full)
      const weights = new Float64Array(T * T);
      for (let i = 0; i < T; i++) {
        const lim = causal ? i : T - 1;
        let mx = -Infinity;
        for (let j = 0; j <= lim; j++) mx = Math.max(mx, scores[i * T + j]);
        let s = 0;
        for (let j = 0; j <= lim; j++) { const e = Math.exp(scores[i * T + j] - mx); weights[i * T + j] = e; s += e; }
        for (let j = 0; j <= lim; j++) weights[i * T + j] /= s;
      }
      // head output = weights @ Vh, projected through its slice of Wo
      const headOut = new Float64Array(T * DH);
      for (let i = 0; i < T; i++) for (let j = 0; j < T; j++) {
        const w = weights[i * T + j];
        if (w === 0) continue;
        for (let p = 0; p < DH; p++) headOut[i * DH + p] += w * Vv[j * D + off + p];
      }
      for (let i = 0; i < T; i++) for (let p = 0; p < DH; p++) {
        const ho = headOut[i * DH + p];
        for (let j = 0; j < D; j++) attnOut[i * D + j] += ho * Lw.wo[(off + p) * D + j];
      }
      heads.push({ scores, weights, headOut, off });
    }

    const x1 = new Float64Array(T * D);
    for (let i = 0; i < x.length; i++) x1[i] = x[i] + attnOut[i];

    const h2 = layernorm(x1, T, D, Lw.ln2g, Lw.ln2b);
    const pre = matmul(h2, T, D, Lw.w1, DMLP);
    for (let i = 0; i < T; i++) for (let j = 0; j < DMLP; j++) pre[i * DMLP + j] += Lw.b1[j];
    const act = new Float64Array(T * DMLP);
    for (let i = 0; i < pre.length; i++) act[i] = geluF(pre[i]);
    const mlpOut = matmul(act, T, DMLP, Lw.w2, D);
    for (let i = 0; i < T; i++) for (let j = 0; j < D; j++) mlpOut[i * D + j] += Lw.b2[j];

    const x2 = new Float64Array(T * D);
    for (let i = 0; i < x.length; i++) x2[i] = x1[i] + mlpOut[i];

    layers.push({ h1, Q, K, V: Vv, heads, attnOut, x1, mlpPre: pre, mlpAct: act, mlpOut, x2 });
    x = x2;
  }

  const xf = layernorm(x, T, D, W.lnfg, W.lnfb);
  const logits = new Float64Array(T * V);
  for (let i = 0; i < T; i++) for (let j = 0; j < V; j++) {
    let s = 0;
    for (let p = 0; p < D; p++) s += xf[i * D + p] * W.tok[j * D + p];
    logits[i * V + j] = s;
  }

  return { T, ids, emb, posE, x0, layers, xf, logits };
}

/* next-token distribution for the last position */
export function nextDistribution(ids, temp = 1) {
  const { logits, T } = forward(ids);
  const arr = Array.from(row(logits, T - 1, V));
  return softmax(arr, temp);
}

export function sampleNext(ids, { temp = 1, greedy = false, rand = Math.random() } = {}) {
  const probs = nextDistribution(ids, greedy ? 1 : temp);
  if (greedy) {
    let best = 0;
    for (let j = 1; j < V; j++) if (probs[j] > probs[best]) best = j;
    return { id: best, probs };
  }
  let acc = 0;
  for (let j = 0; j < V; j++) { acc += probs[j]; if (rand < acc) return { id: j, probs }; }
  return { id: V - 1, probs };
}

export const rowOf = row;
