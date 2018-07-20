const h = window.hyperapp.h;
const app = window.hyperapp.app;
const audioContext = new (window.AudioContext || window.webkitAudioContext)();

// sine, square, sawtooth, triangle
// ------------------------------------
// volume/freq, pan, phase, distortion, delay

const initialState = {
  osc: null,
  started: false,
  volume: 0.0,
  freq: 440,
  pan: 0.5,
  phase: 1.0,
  distortion: 0.0,
  delay: 0.0,
}

const oscillators = ['sine', 'square', 'sawtooth', 'triangle']
const state = Object.assign(...oscillators.map((k) => ({[k]: initialState})))

const actions = {
  create: (type) => {
    state[type].osc = audioContext.createOscillator()
    state[type].osc.type = type
    state[type].osc.frequency.setValueAtTime(state[type].freq, audioContext.currentTime)
    state[type].osc.start()
  },
  start: (type) => {
    state[type].osc.connect(audioContext.destination)
    state[type].started = true
  },
  stop: (type) => {
    state[type].osc.disconnect(audioContext.destination)
    state[type].started = false
  },
}

const view = (state, actions) =>
  h('main', {}, [
    h('div', { class: 'panel' }, oscillators.map((type) => h('button', {
      class: `osc ${type}`,
      oncreate: (e) => actions.create(type),
      onclick: (e) => state[type].started ? actions.stop(type) : actions.start(type)
    }, type)).concat([

    ]))
  ]) 

app(state, actions, view, document.body)