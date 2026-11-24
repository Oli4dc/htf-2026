/**
 * Prison-break siren, synthesised with the Web Audio API (no audio file needed).
 * Call from a click handler or shortly after one: browsers block sound
 * until the user has interacted with the page.
 *
 * Returns a function that stops the siren early.
 */
export function playAlarm({ seconds = 6, volume = 0.18 } = {}): () => void {
  const AudioCtx =
    typeof window === 'undefined'
      ? undefined
      : (window.AudioContext ??
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext)
  if (!AudioCtx) return () => {}

  const ctx = new AudioCtx()
  void ctx.resume()
  const start = ctx.currentTime + 0.05
  const end = start + seconds

  // Master volume with a short fade in and out, so it never clicks.
  const master = ctx.createGain()
  master.gain.setValueAtTime(0, start)
  master.gain.linearRampToValueAtTime(volume, start + 0.15)
  master.gain.setValueAtTime(volume, end - 0.4)
  master.gain.linearRampToValueAtTime(0, end)
  master.connect(ctx.destination)

  // Soften the harsh edges of the sawtooth.
  const filter = ctx.createBiquadFilter()
  filter.type = 'lowpass'
  filter.frequency.value = 2600
  filter.connect(master)

  // Two slightly detuned voices make it sound bigger, like an old air-raid siren.
  const voices = [0, 7].map((detune) => {
    const osc = ctx.createOscillator()
    osc.type = 'sawtooth'
    osc.detune.value = detune
    osc.connect(filter)
    return osc
  })

  // Wail: sweep up and down, one full cycle every 1.2 s.
  const low = 520
  const high = 1150
  const half = 0.6
  for (const osc of voices) {
    osc.frequency.setValueAtTime(low, start)
    for (let t = start; t < end; t += half * 2) {
      osc.frequency.exponentialRampToValueAtTime(high, Math.min(t + half, end))
      osc.frequency.exponentialRampToValueAtTime(low, Math.min(t + half * 2, end))
    }
    osc.start(start)
    osc.stop(end)
  }

  let stopped = false
  const stop = () => {
    if (stopped) return
    stopped = true
    const now = ctx.currentTime
    master.gain.cancelScheduledValues(now)
    master.gain.setValueAtTime(master.gain.value, now)
    master.gain.linearRampToValueAtTime(0, now + 0.15)
    setTimeout(() => void ctx.close(), 250)
  }
  voices[0].onended = stop
  return stop
}
