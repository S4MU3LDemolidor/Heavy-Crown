const canvas = document.getElementById('screen') as HTMLCanvasElement;
canvas.width = 480;
canvas.height = 270;
const ctx = canvas.getContext('2d');
if (ctx) {
  ctx.fillStyle = '#1b1a24';
  ctx.fillRect(0, 0, 480, 270);
}
