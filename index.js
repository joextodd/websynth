const h = window.hyperapp.h
const app = window.hyperapp.app
const audioContext = new (window.AudioContext || window.webkitAudioContext)()

const oscillators = ['sine', 'square', 'sawtooth', 'triangle']
const effects = ['frequency', 'pan', 'phase', 'distortion', 'delay']

const state = { fx: null }
const initialState = {
  playing: false, volume: 1.0, frequency: 440,
  pan: 0.5, phase: 1.0, distortion: 0.0, delay: 0.0
}
state.osc = Object.assign(...oscillators.map((o) => ({[o]: initialState})))
const osc = Object.assign(...oscillators.map(o => ({[o]: audioContext.createOscillator()})))
const waves = {
  create: t => {
    osc[t].type = t
    osc[t].frequency.setValueAtTime(state.osc[t].frequency, audioContext.currentTime)
    osc[t].start()
  },
  start: t => osc[t].connect(audioContext.destination),
  stop: t => osc[t].disconnect(audioContext.destination),
  setFrequency: (t, f) => { osc[t].frequency.value = f },
}

const actions = { setFx: fx => ({ fx }) }
actions.osc = Object.assign(...oscillators.map(o => ({[o]: {
  setPlaying: playing => ({ playing }),
  setVolume: volume => ({ volume }),
  setFrequency: frequency => ({ frequency }),
}})))

const view = (s, a) =>
  h('main', {
    onmousemove: (e) => {
      let x = e.pageX / window.innerWidth, y = e.pageY / window.innerHeight
      if (s.fx === 'frequency') {
        oscillators.forEach(o => {
          a.osc[o].setVolume(y)
          a.osc[o].setFrequency(x * 3000)
          waves.setFrequency(o, x * 3000)
        })
      }
    }
  }, [
    h('div', { class: 'panel' }, oscillators.map((t) =>
      h('button', {
        class: s.osc[t].playing ? `osc ${t} active` : `osc ${t}`,
        oncreate: (e) => waves.create(t),
        onclick: (e) => s.osc[t].playing ?
          a.osc[t].setPlaying(false) && waves.stop(t) :
          a.osc[t].setPlaying(true) && waves.start(t)
      }, t)
    )),
    h('div', { class: 'panel' }, effects.map((t) =>
      h('button', {
        class: s.fx === t ? `fx ${t} active` : `fx ${t}`,
        onclick: (e) => a.setFx(t),
      }, t)
    ))
  ])

app(state, actions, view, document.body)