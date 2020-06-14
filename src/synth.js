const audioCtx = new (window.AudioContext || window.webkitAudioContext)()

export const oscillators = ['sine', 'square', 'sawtooth', 'triangle']
export const effects = ['frequency', 'filter', 'distortion', 'delay', 'reverb']

let s = null
const c = 523.25
const a = 2 ** (1 / 12.0)
export const keys = ['a', 'w', 's', 'e', 'd', 'f', 't', 'g', 'y', 'h', 'u', 'j', 'k']
export const notes = Array(keys.length).fill().map((_, i) => c * (a ** i))

let analyser = audioCtx.createAnalyser()
export const waveform = new Float32Array(analyser.frequencyBinCount)

const init = () => Object.assign(...oscillators.map(o => ({ [o]: null })))
const osc = init(),
      volume = init(),
      filter = init(),
      distortion = init(),
      distortionGain = init(),
      delay = init(),
      delayGain = init(),
      reverb = init(),
      reverbGain = init();

export const synth = {
  create: s => {
    osc[s] = osc[s] ? osc[s] : audioCtx.createOscillator()
    volume[s] = volume[s] ? volume[s] : audioCtx.createGain()
    filter[s] = filter[s] ? filter[s] : audioCtx.createBiquadFilter()
    distortion[s] = distortion[s] ? distortion[s] : audioCtx.createWaveShaper()
    distortionGain[s] = distortionGain[s] ? distortionGain[s] : audioCtx.createGain()
    delay[s] = delay[s] ? delay[s] : audioCtx.createDelay(3)
    delayGain[s] = delayGain[s] ? delayGain[s] : audioCtx.createGain()
    reverb[s] = reverb[s] ? reverb[s] : audioCtx.createConvolver()
    reverbGain[s] = reverbGain[s] ? reverbGain[s] : audioCtx.createGain()
    reverb[s].buffer = impulseResponse(1.0, 1.0, false, audioCtx.sampleRate)

    osc[s].type = s
    osc[s].frequency.value = 440
    osc[s].connect(filter[s])
    filter[s].type = 'bandpass'
    filter[s].connect(volume[s])

    osc[s].connect(distortion[s])
    distortion[s].curve = makeDistortionCurve(400)
    distortion[s].oversample = '4x'
    distortion[s].connect(distortionGain[s])
    distortionGain[s].gain.value = 0
    distortionGain[s].connect(volume[s])

    osc[s].connect(delay[s])
    delay[s].connect(delayGain[s])
    delayGain[s].connect(volume[s])

    osc[s].connect(reverb[s])
    reverb[s].connect(reverbGain[s])
    reverbGain[s].gain.value = 0
    reverbGain[s].connect(volume[s])

    osc[s].start()
  },
  resume: () => audioCtx.state === 'suspended' ? audioCtx.resume() : null,
  setType: ns => (s = ns),
  start: s => {
    volume[s].gain.value = 0.5
    volume[s].connect(audioCtx.destination)
    volume[s].connect(analyser)
  },
  stop: s => {
    volume[s].gain.value = 0
    volume[s].disconnect(audioCtx.destination)
    volume[s].disconnect(analyser)
  },
  setFrequency: (f, v) => {
    osc[s].frequency.value = f
    volume[s].gain.value = v ? v : volume[s].gain.value
  },
  setFilter: (f, v) => {
    filter[s].frequency.setValueAtTime(f, audioCtx.currentTime)
    filter[s].Q.setValueAtTime(v, audioCtx.currentTime)
  },
  setDistortion: v => (distortionGain[s].gain.value = v),
  setDelay: (t, v) => {
    delay[s].delayTime.setValueAtTime(t, audioCtx.currentTime)
    delayGain[s].gain.value = v
  },
  setReverb: (t, v) => {
    reverb[s].buffer = impulseResponse(1.0, 10 - t, false, audioCtx.sampleRate)
    reverbGain[s].gain.value = v
  },
  getSpectrum: () => {
    analyser.getFloatTimeDomainData(waveform)
  }
}

/**
 * Create sigmoid distortion curve
 * https://developer.mozilla.org/en-US/docs/Web/API/WaveShaperNode
 */
export function makeDistortionCurve(amount, sampleRate = 44100) {
  var k = amount,
    n_samples = sampleRate,
    curve = new Float32Array(n_samples),
    deg = Math.PI / 180,
    i = 0,
    x;
  for ( ; i < n_samples; ++i ) {
    x = i * 2 / n_samples - 1
    curve[i] = (3 + k) * Math.atan(Math.sinh(x * 0.25) * 5) / (Math.PI + k * Math.abs(x))
  }
  return curve;
}

/**
 * Create a random impulse response, decaying at the set rate.
 */
export function impulseResponse(duration, decay = 2.0, reverse = false, sampleRate = 44100) {
  var length = sampleRate * duration
  var impulse = audioCtx.createBuffer(1, length, sampleRate)
  var impulseData = impulse.getChannelData(0)

  for (var i = 0; i < length; i++) {
    var n = reverse ? length - i : i
    impulseData[i] = Math.random() * Math.pow(1 - n / length, decay)
  }
  return impulse;
}
