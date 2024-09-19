'use strict';

let atx = new AudioContext();

let analyser = atx.createAnalyser();
analyser.fftSize = 2048;
analyser.smoothingTimeConstant = 0;
let bufferLength = analyser.frequencyBinCount;
let dataArray = new Float32Array(bufferLength);
let fb = atx.sampleRate / 2 / bufferLength;

console.log(
  `bufferLength: ${bufferLength}, min: ${analyser.minDecibels}db, max: ${analyser.maxDecibels}db`
);

const canvas = document.getElementById('oscilloscope');
const ctx = canvas.getContext('2d');

let w = canvas.width;
let h = canvas.height;

class ISO226 {
  constructor(db) {
    this.db = db;
    this.tbl_f = [
      20, 25, 31.5, 40, 50, 63, 80, 100, 125, 160, 200, 250, 315, 400, 500, 630,
      800, 1000, 1250, 1600, 2000, 2500, 3150, 4000, 5000, 6300, 8000, 10000,
      12500,
    ];
    this.tbl_alpha_f = [
      0.532, 0.506, 0.48, 0.455, 0.432, 0.409, 0.387, 0.367, 0.349, 0.33, 0.315,
      0.301, 0.288, 0.276, 0.267, 0.259, 0.253, 0.25, 0.246, 0.244, 0.243,
      0.243, 0.243, 0.242, 0.242, 0.245, 0.254, 0.271, 0.301,
    ];
    this.tbl_L_U = [
      -31.6, -27.2, -23.0, -19.1, -15.9, -13.0, -10.3, -8.1, -6.2, -4.5, -3.1,
      -2.0, -1.1, -0.4, 0.0, 0.3, 0.5, 0.0, -2.7, -4.1, -1.0, 1.7, 2.5, 1.2,
      -2.1, -7.1, -11.2, -10.7, -3.1,
    ];
    this.tbl_T_f = [
      78.5, 68.7, 59.5, 51.1, 44.0, 37.5, 31.5, 26.5, 22.1, 17.9, 14.4, 11.4,
      8.6, 6.2, 4.4, 3.0, 2.2, 2.4, 3.5, 1.7, -1.3, -4.2, -6.0, -5.4, -1.5, 6.0,
      12.6, 13.9, 12.3,
    ];
    this.spline = this.iso226_spl_itpl(db);
  }

  Spline = class {
    constructor(xs, ys) {
      this.xs = xs;
      this.ys = ys;
      this.ks = this.getNaturalKs(new Float64Array(this.xs.length));
    }

    getNaturalKs(ks) {
      var n = this.xs.length - 1;
      var A = this.zerosMat(n + 1, n + 2);

      for (var i = 1; i < n; i++) {
        A[i][i - 1] = 1 / (this.xs[i] - this.xs[i - 1]);
        A[i][i] =
          2 *
          (1 / (this.xs[i] - this.xs[i - 1]) +
            1 / (this.xs[i + 1] - this.xs[i]));
        A[i][i + 1] = 1 / (this.xs[i + 1] - this.xs[i]);
        A[i][n + 1] =
          3 *
          ((this.ys[i] - this.ys[i - 1]) /
            ((this.xs[i] - this.xs[i - 1]) * (this.xs[i] - this.xs[i - 1])) +
            (this.ys[i + 1] - this.ys[i]) /
              ((this.xs[i + 1] - this.xs[i]) * (this.xs[i + 1] - this.xs[i])));
      }

      A[0][0] = 2 / (this.xs[1] - this.xs[0]);
      A[0][1] = 1 / (this.xs[1] - this.xs[0]);
      A[0][n + 1] =
        (3 * (this.ys[1] - this.ys[0])) /
        ((this.xs[1] - this.xs[0]) * (this.xs[1] - this.xs[0]));

      A[n][n - 1] = 1 / (this.xs[n] - this.xs[n - 1]);
      A[n][n] = 2 / (this.xs[n] - this.xs[n - 1]);
      A[n][n + 1] =
        (3 * (this.ys[n] - this.ys[n - 1])) /
        ((this.xs[n] - this.xs[n - 1]) * (this.xs[n] - this.xs[n - 1]));

      return this.solve(A, ks);
    }

    getIndexBefore(target) {
      let low = 0;
      let high = this.xs.length;
      let mid = 0;
      while (low < high) {
        mid = Math.floor((low + high) / 2);
        if (this.xs[mid] < target && mid !== low) {
          low = mid;
        } else if (this.xs[mid] >= target && mid !== high) {
          high = mid;
        } else {
          high = low;
        }
      }
      return low + 1;
    }

    at(x) {
      let i = this.getIndexBefore(x);
      const t = (x - this.xs[i - 1]) / (this.xs[i] - this.xs[i - 1]);
      const a =
        this.ks[i - 1] * (this.xs[i] - this.xs[i - 1]) -
        (this.ys[i] - this.ys[i - 1]);
      const b =
        -this.ks[i] * (this.xs[i] - this.xs[i - 1]) +
        (this.ys[i] - this.ys[i - 1]);
      const q =
        (1 - t) * this.ys[i - 1] +
        t * this.ys[i] +
        t * (1 - t) * (a * (1 - t) + b * t);
      return q;
    }

    solve(A, ks) {
      const m = A.length;
      let h = 0;
      let k = 0;
      while (h < m && k <= m) {
        let i_max = 0;
        let max = -Infinity;
        for (let i = h; i < m; i++) {
          const v = Math.abs(A[i][k]);
          if (v > max) {
            i_max = i;
            max = v;
          }
        }

        if (A[i_max][k] === 0) {
          k++;
        } else {
          this.swapRows(A, h, i_max);
          for (let i = h + 1; i < m; i++) {
            const f = A[i][k] / A[h][k];
            A[i][k] = 0;
            for (let j = k + 1; j <= m; j++) A[i][j] -= A[h][j] * f;
          }
          h++;
          k++;
        }
      }

      for (
        let i = m - 1;
        i >= 0;
        i-- // rows = columns
      ) {
        var v = 0;
        if (A[i][i]) {
          v = A[i][m] / A[i][i];
        }
        ks[i] = v;
        for (
          let j = i - 1;
          j >= 0;
          j-- // rows
        ) {
          A[j][m] -= A[j][i] * v;
          A[j][i] = 0;
        }
      }
      return ks;
    }

    zerosMat(r, c) {
      const A = [];
      for (let i = 0; i < r; i++) A.push(new Float64Array(c));
      return A;
    }

    swapRows(m, k, l) {
      let p = m[k];
      m[k] = m[l];
      m[l] = p;
    }
  };

  freq(f) {
    return this.spline.at(f);
  }

  tabled_f() {
    return this.tbl_f.concat(20e3);
  }

  tabled_L_p(L_N) {
    var L_p = new Array();
    var tbf = this.tabled_B_f(L_N);

    for (var i = 0; i < tbf.length; i++) {
      L_p.push(40 * Math.log10(tbf[i]) + 94.0);
    }

    return L_p.concat(L_p[0]);
  }

  tabled_B_f(L_p) {
    var B_f = new Array();

    for (var i = 0; i < this.tbl_T_f.length; i++) {
      B_f.push(
        4.47e-3 * (10.0 ** (0.025 * L_p) - 1.15) +
          (0.4 * 10.0 ** ((this.tbl_T_f[i] + this.tbl_L_U[i]) / 10.0 - 9.0)) **
            this.tbl_alpha_f[i]
      );
    }

    return B_f.concat(B_f[0]);
  }

  iso226_spl_contour(L_N) {
    if (L_N < 0 || L_N > 90) {
      //throw new Error('Parameter L_N out of bounds [0-90].');
    }
    L_N = Math.max(0, L_N);
    L_N = Math.min(90, L_N);
    return [this.tabled_f(), this.tabled_L_p(L_N)];
  }

  iso226_spl_itpl(L_N) {
    var i = this.iso226_spl_contour(L_N);
    return new this.Spline(i[0], i[1]);
  }
}

function normalizeDecibel(f, db) {
  return new ISO226(db).freq(f);
}

function draw() {
  requestAnimationFrame(draw);

  analyser.getFloatFrequencyData(dataArray);

  ctx.fillStyle = 'rgb(0 0 0)';
  ctx.fillRect(0, 0, w, h);

  const bw = w / bufferLength;
  let bh = h / 256;
  let xxx = 1;

  let a = document.querySelector('#a').value * 1;
  document.querySelector('#a-v').innerHTML = a;

  for (let i = 0; i < bufferLength; i++) {
    let f = i * fb;
    let db = dataArray[i] + 100;
    //let db = 10 ** ((2 * dataArray[i]) / 10 + a) / Math.log(f);
    //console.log(db);
    let ndb = normalizeDecibel(f, db);
    ndb = ndb ** 0.5 * 10 ** a;
    //let hh = ndb;

    let c = ndb;
    let r = (128 / h) * c + 128;
    let g = (256 / h) * c;
    let b = 128 - (256 / h) * c - 32;
    if (g > 192) {
      b = (256 / h) * c;
    }
    ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;

    ctx.fillRect(bw * (i * xxx), h, bw * xxx + 1, -ndb);

    if (i % 50 == 0) {
      ctx.fillStyle = 'white';
      ctx.font = '20px sans-serif';
      ctx.fillText(Math.floor(f), bw * (i * xxx), 20);
    }
  }
}

function mediaStart(stream) {
  let source = atx.createMediaStreamSource(stream);
  let gainNode = atx.createGain();
  gainNode.gain.setValueAtTime(2.0, atx.currentTime);
  // gainNode.gain.value = 2.0;
  source.connect(gainNode);
  //gainNode.connect(atx.destination);
  gainNode.connect(analyser);
  atx.resume();
}

navigator.mediaDevices
  .getUserMedia({ video: false, audio: true })
  .then((stream) => {
    let audioTracks = stream.getAudioTracks();
    mediaStart(stream);
    draw();
  })
  .catch((err) => {
    console.error(`you got an error: ${err}`);
  });
