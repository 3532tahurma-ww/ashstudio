import { getCtx } from './engine.js';

const MAX_SECONDS = 600;

export async function separate(file, onProgress) {
  const ctx = getCtx();
  const buf = await ctx.decodeAudioData(await file.arrayBuffer());
  if (buf.duration > MAX_SECONDS) throw new Error('Parça çok uzun (en fazla 10 dk)');
  const L = buf.getChannelData(0).slice();
  const R = (buf.numberOfChannels > 1 ? buf.getChannelData(1) : buf.getChannelData(0)).slice();
  const worker = new Worker(new URL('./stems-worker.js', import.meta.url));
  return new Promise((resolve, reject) => {
    worker.onmessage = (e) => {
      const m = e.data;
      if (m.type === 'progress') return onProgress(m.p);
      worker.terminate();
      if (m.type === 'error') return reject(new Error(m.message));
      const out = {};
      for (const [k, [l, r]] of Object.entries(m.stems)) {
        const b = ctx.createBuffer(2, l.length, buf.sampleRate);
        b.copyToChannel(l, 0);
        b.copyToChannel(r, 1);
        out[k] = b;
      }
      resolve(out);
    };
    worker.onerror = (e) => { worker.terminate(); reject(new Error(e.message || 'Worker hatası')); };
    worker.postMessage({ L, R, sr: buf.sampleRate }, [L.buffer, R.buffer]);
  });
}
