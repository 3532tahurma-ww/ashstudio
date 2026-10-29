// Stem separation: harmonic/percussive median filtering (HPSS) + stereo-center + frequency bands, on an STFT.
// Masks sum to 1, so "other" is the residual and stems sum back to the original.
const N = 2048, HOP = 512, B = N / 2 + 1, HT = 6, KT = 2 * HT + 1, HF = 6, KF = 2 * HF + 1;

const rev = new Uint32Array(N);
for (let i = 0, bits = Math.log2(N); i < N; i++) {
  let r = 0;
  for (let b = 0; b < bits; b++) r |= ((i >> b) & 1) << (bits - 1 - b);
  rev[i] = r;
}
const cosT = new Float64Array(N / 2), sinT = new Float64Array(N / 2);
for (let k = 0; k < N / 2; k++) { cosT[k] = Math.cos((2 * Math.PI * k) / N); sinT[k] = Math.sin((2 * Math.PI * k) / N); }
const win = new Float64Array(N);
for (let i = 0; i < N; i++) win[i] = Math.sqrt(0.5 - 0.5 * Math.cos((2 * Math.PI * i) / N));

function fft(re, im, inv) {
  for (let i = 0; i < N; i++) {
    const j = rev[i];
    if (j > i) { let t = re[i]; re[i] = re[j]; re[j] = t; t = im[i]; im[i] = im[j]; im[j] = t; }
  }
  for (let size = 2; size <= N; size <<= 1) {
    const half = size >> 1, step = N / size;
    for (let i = 0; i < N; i += size) {
      for (let j = 0, k = 0; j < half; j++, k += step) {
        const wr = cosT[k], wi = inv ? sinT[k] : -sinT[k];
        const a = i + j, b = a + half;
        const tr = re[b] * wr - im[b] * wi, ti = re[b] * wi + im[b] * wr;
        re[b] = re[a] - tr; im[b] = im[a] - ti;
        re[a] += tr; im[a] += ti;
      }
    }
  }
}

function median(a, n) {
  for (let i = 1; i < n; i++) {
    const v = a[i];
    let j = i - 1;
    while (j >= 0 && a[j] > v) { a[j + 1] = a[j]; j--; }
    a[j + 1] = v;
  }
  return a[n >> 1];
}

function separate(L, R, sr, progress) {
  const len = L.length;
  const F = Math.ceil(len / HOP) + 3;
  const out = [0, 1, 2].map(() => [new Float32Array(len), new Float32Array(len)]);
  const ring = Array.from({ length: KT }, () => ({
    zr: new Float64Array(N), zi: new Float64Array(N),
    mag: new Float32Array(B), perc: new Float32Array(B), cen: new Float32Array(B),
  }));
  const re = new Float64Array(N), im = new Float64Array(N), col = new Float32Array(Math.max(KT, KF));
  const masks = [new Float32Array(B), new Float32Array(B), new Float32Array(B)];
  const wBass = new Float32Array(B), wVoc = new Float32Array(B);
  for (let k = 0; k < B; k++) {
    const f = (k * sr) / N;
    wBass[k] = f <= 100 ? 1 : f >= 220 ? 0 : (220 - f) / 120;
    wVoc[k] = f < 150 ? 0 : f < 300 ? (f - 150) / 150 : f < 6000 ? 1 : f < 10000 ? (10000 - f) / 4000 : 0;
  }
  const scale = 1 / (N * 2);

  for (let f = 0; f < F + HT; f++) {
    const slot = ring[f % KT];
    if (f < F) {
      const start = (f - 3) * HOP;
      for (let i = 0; i < N; i++) {
        const n = start + i;
        const inside = n >= 0 && n < len;
        slot.zr[i] = inside ? L[n] * win[i] : 0;
        slot.zi[i] = inside ? R[n] * win[i] : 0;
      }
      fft(slot.zr, slot.zi, false);
      for (let k = 0; k < B; k++) {
        const nk = (N - k) & (N - 1);
        const zr = slot.zr[k], zi = slot.zi[k], wr = slot.zr[nk], wi = -slot.zi[nk];
        const lr = (zr + wr) / 2, li = (zi + wi) / 2, rr = (zi - wi) / 2, ri = -(zr - wr) / 2;
        const pl = lr * lr + li * li, pr = rr * rr + ri * ri;
        slot.mag[k] = (Math.sqrt(pl) + Math.sqrt(pr)) / 2;
        const c = (2 * (lr * rr + li * ri)) / (pl + pr + 1e-12);
        slot.cen[k] = c > 0 ? c : 0;
      }
      for (let k = 0; k < B; k++) {
        let m = 0;
        for (let j = k - HF; j <= k + HF; j++) col[m++] = j >= 0 && j < B ? slot.mag[j] : 0;
        slot.perc[k] = median(col, KF);
      }
    }

    const i = f - HT;
    if (i < 0 || i >= F) continue;
    const cur = ring[i % KT];
    for (let k = 0; k < B; k++) {
      let m = 0;
      for (let j = i - HT; j <= i + HT; j++) col[m++] = j >= 0 && j < F ? ring[j % KT].mag[k] : 0;
      const H = median(col, KT), P = cur.perc[k];
      const H2 = H * H, P2 = P * P;
      const mh = H2 / (H2 + P2 + 1e-20);
      const mb = mh * wBass[k];
      const c = cur.cen[k];
      masks[0][k] = 1 - mh;
      masks[1][k] = mb;
      masks[2][k] = (mh - mb) * c * c * wVoc[k];
    }
    const start = (i - 3) * HOP;
    for (let s = 0; s < 3; s++) {
      const m = masks[s];
      for (let k = 0; k < N; k++) {
        const mk = m[k <= N / 2 ? k : N - k];
        re[k] = cur.zr[k] * mk;
        im[k] = cur.zi[k] * mk;
      }
      fft(re, im, true);
      const [ol, or] = out[s];
      for (let t = 0; t < N; t++) {
        const n = start + t;
        if (n < 0 || n >= len) continue;
        const w = win[t] * scale;
        ol[n] += re[t] * w;
        or[n] += im[t] * w;
      }
    }
    if ((i & 127) === 0) progress(i / F);
  }

  for (let n = 0; n < len; n++) {
    L[n] -= out[0][0][n] + out[1][0][n] + out[2][0][n];
    R[n] -= out[0][1][n] + out[1][1][n] + out[2][1][n];
  }
  return { drums: out[0], bass: out[1], vocals: out[2], other: [L, R] };
}

self.onmessage = (e) => {
  const { L, R, sr } = e.data;
  try {
    const stems = separate(L, R, sr, (p) => self.postMessage({ type: 'progress', p }));
    const transfer = Object.values(stems).flatMap(([l, r]) => [l.buffer, r.buffer]);
    self.postMessage({ type: 'done', stems }, transfer);
  } catch (err) {
    self.postMessage({ type: 'error', message: String(err && err.message || err) });
  }
};
