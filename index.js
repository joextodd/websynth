const h = window.hyperapp.h
const app = window.hyperapp.app
const { withFx, action, frame } = window.hyperappFx
import { oscillators, effects, synth, keys, notes, waveform } from './synth.js'
import { draw } from './scope.js'

const isSafari = () => navigator.vendor.toLowerCase() === 'apple computer, inc.'
const initialState = { playing: null }
const state = {
  selected: null, pressed: false,
  x: 0, y: 0, time: 0, delta: 0,
  fx: effects[0]
}
state.osc = Object.assign(...oscillators.map((o) => ({[o]: initialState})))

const move = (s, a) => e => {
  let x = e.pageX / window.innerWidth, y = e.pageY / window.innerHeight
  if (s.selected && s.pressed) {
    switch (s.fx) {
      case 'frequency': synth.setFrequency(x * 1000, 1.0 - y); break;
      case 'filter': synth.setFilter(x * 3000, y * 100); break;
      case 'distortion': synth.setDistortion(x * 250); break;
      case 'delay': synth.setDelay(x * 10, 1.0 - y); break;
      case 'reverb': synth.setReverb(x); break;
    }
  }
  a.setX(e.pageX) && a.setY(e.pageY)
}

const actions = {
  init: () => frame('update'),
  update: time => isSafari() ? [] : [
    action('incTime', 0.1),
    action('drawCanvas'),
    frame('update')
  ],
  incTime: time => ({ time: lastTime, delta: lastDelta }) => ({
    time,
    delta: time && lastTime ? time - lastTime : lastDelta
  }),
  drawCanvas: () => synth.getSpectrum() || draw(),
  setX: x => ({ x }),
  setY: y => ({ y }),
  setPressed: pressed => ({ pressed }),
  setOsc: selected => ({ selected }),
  setFx: fx => ({ fx }),
}
actions.osc = Object.assign(...oscillators.map(o => ({[o]: {
  setPlaying: playing => ({ playing })
}})))

const view = (s, a) =>
  h('main', {
    ontouchstart: e => a.setPressed(true),
    ontouchend: e => a.setPressed(false),
    ontouchmove: move(s, a),
    onmousedown: e => a.setPressed(true),
    onmouseup: e => a.setPressed(false),
    onmousemove: move(s, a),
    oncreate: e => {
      window.onkeypress = e => {
        keys.indexOf(e.key) >= 0 &&
          synth.setFrequency(notes[keys.indexOf(e.key)])
      }
    }
  }, [
    h('div', { class: 'panel' }, oscillators.map(t =>
      h('button', {
        class: s.osc[t].playing ? `osc ${t} active` : `osc ${t}`,
        oncreate: e => a.setFx(effects[0]) && synth.create(t),
        onclick: e => {
          synth.resume()
          a.setOsc(t)
          synth.setType(t)
          s.osc[t].playing ?
            a.osc[t].setPlaying(false) && synth.stop(t) :
            a.osc[t].setPlaying(true) && synth.start(t)
        }
      }, t)
    )),
    h('canvas', {
      id: 'canvas',
      width: waveform.length,
      height: window.innerHeight
    }, []),
    h('div', { class: 'panel' }, effects.map(t =>
      h('button', {
        class: s.fx === t ? `fx ${t} active` : `fx ${t}`,
        onclick: e => a.setFx(t),
      }, t)
    )),
    h('div', {
      class: s.pressed ? 'press' : 'unpress',
      style: { top: `${s.y - 20}px`, left: `${s.x - 20}px` }
    }, [])
  ])

withFx(app)(state, actions, view, document.body).init()
