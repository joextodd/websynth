const h = window.hyperapp.h;
const app = window.hyperapp.app;
const { withLogger } = window.hyperappLogger
const audioContext = new (window.AudioContext || window.webkitAudioContext)();

const oscillators = ['sine', 'square', 'sawtooth', 'triangle']
const effects = ['frequency', 'pan', 'phase', 'distortion', 'delay']

const state = {}
state.trail = Array(12).fill({ x: 0, y: 0 })
state.osc = Object.assign(...oscillators.map((o) => ({[o]: {
  playing: false,
  volume: 1.0,
  freq: 440,
  pan: 0.5,
  phase: 1.0,
  distortion: 0.0,
  delay: 0.0,
}})))
const osc = Object.assign(...oscillators.map((o) => ({[o]: audioContext.createOscillator()})))

const actions = {
  create: t => {
    osc[t].type = t
    osc[t].frequency.setValueAtTime(state.osc[t].freq, audioContext.currentTime)
    osc[t].start()
    return state.osc[t]
  },
  start: t => {
    osc[t].connect(audioContext.destination)
    osc[t].playing = true
    return state.osc[t]
  },
  stop: t => {
    osc[t].disconnect(audioContext.destination)
    state.osc[t].playing = false
    return state.osc[t]
  },
  updateTrail: (i, x, y) => {
    state.trail[i].x = x
    state.trail[i].y = y
    // return state.trail
  }
}

const view = (s, a) =>
  h('main', {
    onmousemove: (e) => {
      let x = e.pageX, y = e.pageY
      state.trail.forEach((dot, index, dots) => {
        let nextDot = dots[index + 1] || dots[0]
        a.updateTrail(index, x, y)
        x += (nextDot.x - dot.x) * .6
        y += (nextDot.y - dot.y) * .6
      })
    }
  }, [
    h('div', { class: 'panel' }, oscillators.map((t) =>
      h('button', {
        class: `osc ${t}`,
        oncreate: (e) => a.create(t),
        onclick: (e) => s.osc[t].playing ? a.stop(t) : a.start(t)
      }, t)
    )),
    h('div', { class: 'panel' }, effects.map((t) =>
      h('button', {
        class: `fx ${t}`,
      }, t)
    ))
  ].concat(state.trail.map((d) => h('div', {
    class: 'trail',
    style: {
      left: `${d.x}px`,
      top: `${d.y}px`
    }
  }, []))))


app(state, actions, view, document.body)


// const Dot = function() {
//   this.x = 0;
//   this.y = 0;
//   this.node = (function(){
//     const n = document.createElement('div');
//     n.className = 'trail';
//     document.body.appendChild(n);
//     return n;
//   }());
// };

// Dot.prototype.draw = function() {
//   this.node.style.left = this.x + 'px'
//   this.node.style.top = this.y + 'px'
// };

// This is the screen redraw function
// function draw() {
//   // Make sure the mouse position is set everytime
//     // draw() is called.
//   var x = mouse.x,
//       y = mouse.y;

//   // This loop is where all the 90s magic happens
//   dots.forEach(function(dot, index, dots) {
//     var nextDot = dots[index + 1] || dots[0];

//     dot.x = x;
//     dot.y = y;
//     dot.draw();
//     x += (nextDot.x - dot.x) * .6;
//     y += (nextDot.y - dot.y) * .6;

//   });
// }

// for (var i = 0; i < 12; i++) {
//   state.trail.dots.push(new Dot());
// }

// addEventListener('mousemove', function(event) {
//   state.trail.mouse.x = event.pageX;
//   state.trail.mouse.y = event.pageY;
//   // draw()
// })

