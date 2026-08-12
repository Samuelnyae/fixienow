// Lightweight notification sound + system notification helpers.
// Uses the Web Audio API so no audio file upload is required.

let audioCtx = null;

function getCtx() {
  if (typeof window === 'undefined') return null;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  if (!audioCtx) audioCtx = new AC();
  if (audioCtx.state === 'suspended') audioCtx.resume();
  return audioCtx;
}

// Play a short two-tone chime.
export function playNotificationSound() {
  const ctx = getCtx();
  if (!ctx) return;
  const now = ctx.currentTime;
  const notes = [880, 1175]; // A5 -> D6, bright ascending pair
  notes.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    const start = now + i * 0.14;
    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(0.25, start + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, start + 0.32);
    osc.connect(gain).connect(ctx.destination);
    osc.start(start);
    osc.stop(start + 0.34);
  });
}

// Request browser notification permission (call from a user gesture).
export function requestNotificationPermission() {
  if (typeof window === 'undefined' || !('Notification' in window)) return Promise.resolve('unsupported');
  if (Notification.permission === 'granted') return Promise.resolve('granted');
  if (Notification.permission === 'denied') return Promise.resolve('denied');
  return Notification.requestPermission();
}

// Show a native notification that appears in the phone / OS notification center.
export function showSystemNotification(title, body) {
  if (typeof window === 'undefined' || !('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;
  try {
    const n = new Notification(title, {
      body,
      icon: 'https://media.base44.com/images/public/695420244ced3f7c551d2538/c32b9fbf9_Gemini_Generated_Image_5ukoir5ukoir5uko.png',
      tag: 'fixie-notification',
    });
    setTimeout(() => n.close(), 6000);
  } catch (e) {
    // Some browsers throw if the page isn't focused; ignore.
  }
}