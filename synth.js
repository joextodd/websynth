const audioCtx = new (window.AudioContext || window.webkitAudioContext)()

export const oscillators = ['sine', 'square', 'sawtooth', 'triangle']
export const effects = ['frequency', 'pan', 'filter', 'distortion', 'delay', 'reverb']

let s = null
const c = 523.25
const a = 2 ** (1 / 12.0)
export const keys = ['a', 'w', 's', 'e', 'd', 'f', 't', 'g', 'y', 'h', 'u', 'j', 'k']
export const notes = Array(keys.length).fill().map((_, i) => c * (a ** i))

let analyser = null
const init = () => Object.assign(...oscillators.map(o => ({ [o]: null })))
const osc = init(),
      volume = init(),
      panner = init(),
      filter = init(),
      distortion = init(),
      delay = init(),
      delayGain = init(),
      reverb = init(),
      reverbGain = init();

export const synth = {
  create: s => {
    osc[s] = osc[s] ? osc[s] : audioCtx.createOscillator()
    volume[s] = volume[s] ? volume[s] : audioCtx.createGain()
    panner[s] = panner[s] ? panner[s] : audioCtx.createStereoPanner()
    filter[s] = filter[s] ? filter[s] : audioCtx.createBiquadFilter()
    distortion[s] = distortion[s] ? distortion[s] : audioCtx.createWaveShaper()
    delay[s] = delay[s] ? delay[s] : audioCtx.createDelay(1)
    delayGain[s] = delayGain[s] ? delayGain[s] : audioCtx.createGain()
    reverb[s] = reverb[s] ? reverb[s] : audioCtx.createConvolver()
    reverbGain[s] = reverbGain[s] ? reverbGain[s] : audioCtx.createGain()
    reverb[s].buffer = impulseResponse(1.0, true, false)

    osc[s].type = s
    osc[s].frequency.value = 440
    osc[s].connect(panner[s])
    panner[s].connect(filter[s])
    filter[s].type = 'bandpass'
    filter[s].connect(distortion[s])
    distortion[s].oversample = '4x'
    distortion[s].connect(volume[s])

    osc[s].connect(delay[s])
    delay[s].connect(delayGain[s])
    delayGain[s].connect(volume[s])

    osc[s].connect(reverb[s])
    reverb[s].connect(reverbGain[s])
    reverbGain[s].gain.value = 0
    reverbGain[s].connect(volume[s])
    osc[s].start()
  },
  setType: ns => (s = ns),
  start: s => volume[s].connect(audioCtx.destination),
  stop: s => volume[s].disconnect(audioCtx.destination),
  getSpectrum: () => analyser ? analyser.getFloatFrequencyData() : [],
  setFrequency: f => (osc[s].frequency.value = f),
  setPanning: v => (panner[s].pan.value = v),
  setFilter: f => (filter[s].frequency.value = f),
  setDistortion: v => (distortion[s].curve = makeDistortionCurve(v)),
  setDelay: v => (delay[s].delayTime.value = v),
  setReverb: v => (reverbGain[s].gain.value = v),
}

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
