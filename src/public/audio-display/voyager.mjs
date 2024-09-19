/*navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
  var mediaRecorder = new MediaRecorder(stream);
});*/

const leftCanvas = document.querySelector('#left');
const rightCanvas = document.querySelector('#right');
const xyCanvas = document.querySelector('#xy');
const leftImageCanvas = document.querySelector('#li');
const rightImageCanvas = document.querySelector('#ri');

function resize(canvas) {
  canvas.width = canvas.offsetWidth * 2;
  canvas.height = canvas.offsetHeight * 2;
}

window.onresize = () => {
  resize(leftCanvas);
  resize(rightCanvas);
  resize(xyCanvas);
  resize(leftImageCanvas);
  resize(rightImageCanvas);
};
resize(leftCanvas);
resize(rightCanvas);
resize(xyCanvas);
resize(leftImageCanvas);
resize(rightImageCanvas);

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
    let v = data[i];
    ctx.lineTo(i * s, h - v);
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

let ili = 0;

function il(canvas, data) {
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;
  const s = w / data.length;

  //ctx.clearRect(0, 0, w, h);
  //ctx.lineWidth = 2;
  //ctx.strokeStyle = 'rgb(0, 255, 0)';
  ctx.beginPath();

  for (let i = 0; i < data.length; i++) {
    ctx.fillStyle = 'rgb(32, ' + Math.floor(data[i]) + ', 32)';
    ctx.fillRect(s * i, ili, s, 2);
  }
  ctx.clearRect(0, ili + 2, w, 10);

  ili += 2;
  if (ili > canvas.height) {
    ili = 0;
  }
}

let atx, source, splitter, left, right;

let fftSize = 512;
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
  const leftGain = atx.createGain();
  left.connect(leftAnalyser);
  leftGain.gain.value = 5.0;

  const rightAnalyser = atx.createAnalyser();
  rightAnalyser.fftSize = fftSize;
  const rightGain = atx.createGain();
  right.connect(rightAnalyser);
  rightGain.gain.value = 5.0;

  function draw() {
    const leftData = new Uint8Array(leftAnalyser.frequencyBinCount);
    leftAnalyser.getByteFrequencyData(leftData);

    const rightData = new Uint8Array(rightAnalyser.frequencyBinCount);
    rightAnalyser.getByteFrequencyData(rightData);

    drawX(leftCanvas, leftData);
    drawX(rightCanvas, rightData);
    drawXY(xyCanvas, leftData, rightData);

    il(leftImageCanvas, leftData);

    window.requestAnimationFrame(draw);
  }
  window.requestAnimationFrame(draw);

  source.mediaElement.play();
}

document.querySelector('#run').addEventListener('click', () => {
  run();
  document.querySelector('#run').disabled = true;
});
