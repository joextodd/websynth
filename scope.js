import { waveform } from './synth.js'

export const draw = () => {
  const canvas = document.getElementById('canvas')
  if (canvas) {
    const ctx = canvas.getContext('2d')
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.beginPath()

    ctx.strokeStyle = '#00caff'
    for (let x = 0; x < waveform.length; x++) {
      const y = (0.5 + waveform[x] / 4) * canvas.height;
      x == 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
    }
    ctx.stroke()
  }
}