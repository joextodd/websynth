const audioCtx = new (window.AudioContext || window.webkitAudioContext)()

export const oscillators = ['sine', 'square', 'sawtooth', 'triangle']
export const effects = ['frequency', 'pan', 'filter', 'distortion', 'delay', 'reverb']

let analyser = null
const init = () => Object.assign(...oscillators.map(o => ({[o]: null})))
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
  create: t => {
    osc[t] = osc[t] ? osc[t] : audioCtx.createOscillator()
    volume[t] = volume[t] ? volume[t] : audioCtx.createGain()
    panner[t] = panner[t] ? panner[t] : audioCtx.createStereoPanner()
    filter[t] = filter[t] ? filter[t] : audioCtx.createBiquadFilter()
    distortion[t] = distortion[t] ? distortion[t] : audioCtx.createWaveShaper()
    delay[t] = delay[t] ? delay[t] : audioCtx.createDelay(1)
    delayGain[t] = delayGain[t] ? delayGain[t] : audioCtx.createGain()
    reverb[t] = reverb[t] ? reverb[t] : audioCtx.createConvolver()
    reverbGain[t] = reverbGain[t] ? reverbGain[t] : audioCtx.createGain()
    reverb[t].buffer = impulseResponse(1.0, true, false)

    osc[t].type = t
    osc[t].frequency.value = 440
    osc[t].connect(panner[t])
    panner[t].connect(filter[t])
    filter[t].type = 'bandpass'
    filter[t].connect(distortion[t])
    distortion[t].oversample = '4x'
    distortion[t].connect(volume[t])

    osc[t].connect(delay[t])
    delay[t].connect(delayGain[t])
    delayGain[t].value = 0
    delayGain[t].connect(volume[t])

    osc[t].connect(reverb[t])
    reverb[t].connect(reverbGain[t])
    reverbGain[t].value = 0
    reverbGain[t].connect(volume[t])
    osc[t].start()
  },
  start: t => volume[t].connect(audioCtx.destination),
  stop: t => volume[t].disconnect(audioCtx.destination),
  getSpectrum: () => analyser ? analyser.getFloatFrequencyData() : [],
  setFrequency: (t, f, v) => (osc[t].frequency.value = f),
  setPanning: (t, v) => (panner[t].pan.value = v),
  setFilter: (t, f, dt) => (filter[t].frequency.value = f),
  setDistortion: (t, v) => (distortion[t].curve = makeDistortionCurve(v)),
  setDelay: (t, v) => (delay[t].delayTime.value = v),
  setReverb: (t, v) => (reverbGain[t].gain.value = v),
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
