import { makeDistortionCurve, impulseResponse } from '../src/synth.js'

// PLOT DISTORTION CURVE
// const bufferSize = 1024
// let data = makeDistortionCurve(400, bufferSize)

// PLOT IMPULSE RESPONSE
const bufferSize = 3000
let data = impulseResponse(1.0, 5.0, false, bufferSize).getChannelData(0)

console.log(data)
var ctx = document.getElementById('chart').getContext('2d');
new Chart(ctx, {
  type: 'line',
  data: {
    labels: Array.from(Array(bufferSize).keys()),
    datasets: [{
        data: data,
        fill: false
    }]
  }
});