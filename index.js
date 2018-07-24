const h = window.hyperapp.h
const app = window.hyperapp.app
import { oscillators, effects, synth } from './synth.js'

const initialState = { playing: null }
const state = { selected: null, pressed: false, fx: effects[0], x: 0, y: 0}
state.osc = Object.assign(...oscillators.map((o) => ({[o]: initialState})))

const actions = {
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
    onmousedown: (e) => a.setPressed(true),
    onmouseup: (e) => a.setPressed(false),
    onmousemove: (e) => {
      let x = e.pageX / window.innerWidth, y = e.pageY / window.innerHeight
      if (s.pressed) {
        switch (s.fx) {
          case 'frequency': synth.setFrequency(s.selected, x * 3000, 1.0 - y); break;
          case 'pan': synth.setPanning(s.selected, x * 2 - 1); break;
          case 'filter': synth.setFilter(s.selected, x * 3000, y * 100); break;
          case 'distortion': synth.setDistortion(s.selected, x * 500); break;
          case 'delay': synth.setDelay(s.selected, x, 1.0 - y); break;
        }
      }
      a.setX(e.pageX) && a.setY(e.pageY)
    }
  }, [
    h('div', { class: 'panel' }, oscillators.map((t) =>
      h('button', {
        class: s.osc[t].playing ? `osc ${t} active` : `osc ${t}`,
        oncreate: (e) => a.setFx(effects[0]) && synth.create(t),
        onclick: (e) => {
          a.setOsc(t)
          s.osc[t].playing ?
            a.osc[t].setPlaying(false) && synth.stop(t) :
            a.osc[t].setPlaying(true) && synth.start(t)
        }
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
