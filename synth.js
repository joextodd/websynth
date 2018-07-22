const audioCtx = new (window.AudioContext || window.webkitAudioContext)()

export const oscillators = ['sine', 'square', 'sawtooth', 'triangle']
export const effects = ['frequency', 'pan', 'filter', 'distortion', 'delay', 'reverb']

let analyser = null
const osc = Object.assign(...oscillators.map(o => ({[o]: null})))
const volume = Object.assign(...oscillators.map(o => ({[o]: null})))
const panner = Object.assign(...oscillators.map(o => ({[o]: null})))
const filter = Object.assign(...oscillators.map(o => ({[o]: null})))
const delay = Object.assign(...oscillators.map(o => ({[o]: null})))
const reverb = Object.assign(...oscillators.map(o => ({[o]: null})))

export const synth = {
  create: t => {
    osc[t] = osc[t] ? osc[t] : audioCtx.createOscillator()
    volume[t] = volume[t] ? volume[t] : audioCtx.createGain()
    panner[t] = panner[t] ? panner[t] : audioCtx.createStereoPanner()
    filter[t] = filter[t] ? filter[t] : audioCtx.createBiquadFilter()
    delay[t] = delay[t] ? delay[t] : audioCtx.createDelay(100)
    reverb[t] = reverb[t] ? reverb[t] : audioCtx.createConvolver()
    // if (!analyser) {
    //   analyser = audioCtx.createAnalyser()
    //   analyser.fftSize = 1024
    // }
    osc[t].type = t
    osc[t].frequency.value = 440
    osc[t].connect(panner[t])
    panner[t].connect(filter[t])
    filter[t].connect(delay[t])
    delay[t].connect(volume[t])
    osc[t].start()
  },
  start: t => volume[t].connect(audioCtx.destination),
  stop: t => volume[t].disconnect(audioCtx.destination),
  getSpectrum: () => analyser ? analyser.getFloatFrequencyData() : [],
  setFrequency: (t, f, v) => {
    volume[t].gain.value = v
    osc[t].frequency.value = f
  },
  setPanning: (t, v) => (panner[t].pan.value = v),
  setFilter: (t, f, dt) => {
    filter[t].frequency.value = f
    filter[t].detune.value = dt
  },
  setDelay: (t, v) => (delay[t].delayTime.value = v)
}