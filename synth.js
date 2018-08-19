const audioCtx = new (window.AudioContext || window.webkitAudioContext)()

export const oscillators = ['sine', 'square', 'sawtooth', 'triangle']
export const effects = ['frequency', 'pan', 'filter', 'distortion', 'delay', 'reverb']

let analyser = null
const osc = Object.assign(...oscillators.map(o => ({[o]: null})))
const volume = Object.assign(...oscillators.map(o => ({[o]: null})))
const panner = Object.assign(...oscillators.map(o => ({[o]: null})))
const filter = Object.assign(...oscillators.map(o => ({[o]: null})))
const distortion = Object.assign(...oscillators.map(o => ({[o]: null})))
const delay = Object.assign(...oscillators.map(o => ({[o]: null})))
const reverb = Object.assign(...oscillators.map(o => ({[o]: null})))

function makeDistortionCurve(amount) {
  var k = amount,
    n_samples = typeof sampleRate === 'number' ? sampleRate : 44100,
    curve = new Float32Array(n_samples),
    deg = Math.PI / 180,
    i = 0,
    x;
  for ( ; i < n_samples; ++i ) {
    x = i * 2 / n_samples - 1;
    curve[i] = (3 + k) * Math.atan(Math.sinh(x * 0.25) * 5) / (Math.PI + k * Math.abs(x));
  }
  return curve;
}

function impulseResponse(duration, decay, reverse) {
  var sampleRate = audioCtx.sampleRate;
  var length = sampleRate * duration;
  var impulse = audioCtx.createBuffer(1, length, sampleRate);
  var impulseData = impulse.getChannelData(0);

  if (!decay)
    decay = 2.0;
  for (var i = 0; i < length; i++) {
    var n = reverse ? length - i : i;
    impulseData[i] = (Math.random() * 2 - 1) * Math.pow(1 - n / length, decay);
  }
  return impulse;
}

export const synth = {
  create: t => {
    osc[t] = osc[t] ? osc[t] : audioCtx.createOscillator()
    volume[t] = volume[t] ? volume[t] : audioCtx.createGain()
    panner[t] = panner[t] ? panner[t] : audioCtx.createStereoPanner()
    filter[t] = filter[t] ? filter[t] : audioCtx.createBiquadFilter()
    distortion[t] = distortion[t] ? distortion [t] : audioCtx.createWaveShaper()
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
    filter[t].connect(distortion[t])
    distortion[t].connect(delay[t])
    delay[t].connect(volume[t])
    // reverb[t].connect(volume[t])
    osc[t].start()
  },
  start: t => volume[t].connect(audioCtx.destination),
  stop: t => volume[t].disconnect(audioCtx.destination),
  getSpectrum: () => analyser ? analyser.getFloatFrequencyData() : [],
  setFrequency: (t, f, v) => {
    // volume[t].gain.value = v
    osc[t].frequency.value = f
  },
  setPanning: (t, v) => (panner[t].pan.value = v),
  setFilter: (t, f, dt) => {
    filter[t].frequency.value = f
    filter[t].detune.value = dt
  },
  setDistortion: (t, v) => {
    distortion[t].curve = makeDistortionCurve(v)
    distortion[t].oversample = '4x'
  },
  setDelay: (t, v) => (delay[t].delayTime.value = v),
  setReverb: (t, v) => {
    reverb[t].buffer = impulseResponse(1.0, true, false)
  }
}