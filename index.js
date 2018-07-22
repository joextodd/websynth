const h = window.hyperapp.h
const app = window.hyperapp.app
const audioCtx = new (window.AudioContext || window.webkitAudioContext)()

const oscillators = ['sine', 'square', 'sawtooth', 'triangle']
const effects = ['frequency', 'pan', 'filter', 'distortion', 'delay', 'reverb']

const initialState = { playing: false }
const state = { selected: null, pressed: false, fx: effects[0], x: 0, y: 0}
state.osc = Object.assign(...oscillators.map((o) => ({[o]: initialState})))

const osc = Object.assign(...oscillators.map(o => ({[o]: audioCtx.createOscillator()})))
const volume = Object.assign(...oscillators.map(o => ({[o]: audioCtx.createGain()})))
const panner = Object.assign(...oscillators.map(o => ({[o]: audioCtx.createStereoPanner()})))
const filter = Object.assign(...oscillators.map(o => ({[o]: audioCtx.createBiquadFilter()})))
const delay = Object.assign(...oscillators.map(o => ({[o]: audioCtx.createDelay(100)})))
const reverb = Object.assign(...oscillators.map(o => ({[o]: audioCtx.createConvolver()})))
const waves = {
  create: t => {
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

const actions = {
  setX: x => ({ x }),
  setY: y => ({ y }),
  setPressed: pressed => ({ pressed }),
  setSelected: selected => ({ selected }),
  setFx: fx => ({ fx }),
}
actions.osc = Object.assign(...oscillators.map(o => ({[o]: {
  setPlaying: playing => ({ playing })
}})))

const view = (s, a) =>
  h('main', {
    ontouchstart: (e) => a.setPressed(true),
    ontouchend: (e) => a.setPressed(false),
    onmousedown: (e) => a.setPressed(true),
    onmouseup: (e) => a.setPressed(false),
    onmousemove: (e) => {
      let x = e.pageX / window.innerWidth, y = e.pageY / window.innerHeight
      if (s.pressed) {
        switch (s.fx) {
          case 'frequency': waves.setFrequency(s.selected, x * 3000, 1.0 - y); break;
          case 'pan': waves.setPanning(s.selected, x * 2 - 1); break;
          case 'filter': waves.setFilter(s.selected, x * 3000, y * 100); break;
          case 'delay': waves.setDelay(s.selected, x * 100); break;
        }
      }
      a.setX(e.pageX) && a.setY(e.pageY)
    }
  }, [
    h('div', { class: 'panel' }, oscillators.map((t) =>
      h('button', {
        class: s.osc[t].playing ? `osc ${t} active` : `osc ${t}`,
        oncreate: (e) => waves.create(t),
        onclick: (e) => a.setSelected(t) && (s.osc[t].playing ?
          a.osc[t].setPlaying(false) && waves.stop(t) :
          a.osc[t].setPlaying(true) && waves.start(t))
      }, t)
    )),
    h('div', { class: 'panel' }, effects.map((t) =>
      h('button', {
        class: s.fx === t ? `fx ${t} active` : `fx ${t}`,
        onclick: (e) => a.setFx(t),
      }, t)
    )),
    h('div', {
      class: s.pressed ? 'press' : 'unpress',
      style: { top: `${s.y - 20}px`, left: `${s.x - 20}px` }
    }, [])
  ])

app(state, actions, view, document.body)