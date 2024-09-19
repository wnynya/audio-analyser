/*navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
  var mediaRecorder = new MediaRecorder(stream);
});*/

const leftCanvas = document.querySelector('#left');
const rightCanvas = document.querySelector('#right');
const xyCanvas = document.querySelector('#xy');

function resize(canvas) {
  canvas.width = canvas.offsetWidth * 2;
  canvas.height = canvas.offsetHeight * 2;
}

window.onresize = () => {
  resize(leftCanvas);
  resize(rightCanvas);
  resize(xyCanvas);
};
resize(leftCanvas);
resize(rightCanvas);
resize(xyCanvas);

function drawX(canvas, data) {
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;
  const s = w / data.length;

  ctx.clearRect(0, 0, w, h);
  ctx.lineWidth = 2;
  ctx.strokeStyle = 'rgb(0, 255, 0)';
  ctx.beginPath();

  for (let i = 0; i < data.length; i++) {
    let v = data[i] / 128.0;
    ctx.lineTo(i * s, h - (v * h) / 2);
  }

  ctx.stroke();
}

function drawXY(canvas, dataX, dataY) {
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;

  ctx.clearRect(0, 0, w, h);
  ctx.lineWidth = 2;
  ctx.strokeStyle = 'rgb(0, 255, 0)';
  ctx.beginPath();

  for (let i = 0; i < dataX.length; i++) {
    let v1 = dataX[i] / 128.0;
    let v2 = dataY[i] / 128.0;
    ctx.lineTo((v1 * w) / 2, h - (v2 * h) / 2);
  }

  ctx.stroke();
}

let atx, source, splitter, left, right;

let fftSize = 2048;
let smooth = 1.0;

function run() {
  atx = new AudioContext();
  source = atx.createMediaElementSource(document.querySelector('#audio'));
  left = atx.createGain();
  right = atx.createGain();
  splitter = atx.createChannelSplitter(2);
  source.connect(splitter, 0, 0);
  splitter.connect(left, 0);
  splitter.connect(right, 1);
  left.connect(atx.destination, 0);
  right.connect(atx.destination, 0);

  const leftAnalyser = atx.createAnalyser();
  leftAnalyser.fftSize = fftSize;
  leftAnalyser.smoothingTimeConstant = smooth;
  left.connect(leftAnalyser);

  const rightAnalyser = atx.createAnalyser();
  rightAnalyser.fftSize = fftSize;
  rightAnalyser.smoothingTimeConstant = smooth;
  right.connect(rightAnalyser);

  function draw() {
    const leftData = new Uint8Array(leftAnalyser.frequencyBinCount);
    leftAnalyser.getByteTimeDomainData(leftData);
    const rightData = new Uint8Array(rightAnalyser.frequencyBinCount);
    rightAnalyser.getByteTimeDomainData(rightData);

    drawX(leftCanvas, leftData);
    drawX(rightCanvas, rightData);
    drawXY(xyCanvas, leftData, rightData);

    window.requestAnimationFrame(draw);
  }
  window.requestAnimationFrame(draw);

  source.mediaElement.play();
}

document.querySelector('#run').addEventListener('click', () => {
  run();
  document.querySelector('#run').disabled = true;
});
