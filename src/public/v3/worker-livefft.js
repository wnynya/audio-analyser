'use strict';

var _createClass = (function () {
  function defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];
      descriptor.enumerable = descriptor.enumerable || false;
      descriptor.configurable = true;
      if ('value' in descriptor) descriptor.writable = true;
      Object.defineProperty(target, descriptor.key, descriptor);
    }
  }
  return function (Constructor, protoProps, staticProps) {
    if (protoProps) defineProperties(Constructor.prototype, protoProps);
    if (staticProps) defineProperties(Constructor, staticProps);
    return Constructor;
  };
})();

function _classCallCheck(instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError('Cannot call a class as a function');
  }
}

var audioData = [0, 0, 0, 0];
var lowAudioData = [0, 0, 0, 0];
var maxFreq = 22050;
var lowFreq = 6000;
var lowFreqIndex = 0;
var maxDecibel = -30;
var minDecibel = -100;
var decibelRange = 70;
var volumeNormalizer = 30;
var canvas = new Array();
var loop;
var pause = true;
var forcount = 0;
var normalizedFreqArray = [0, 0, 0, 0];
var normalizedFreqArray2 = [0, 0, 0, 0];
var normalizedFreqObject = { 0: 0 };

onmessage = function onmessage(event) {
  var data = event.data.data;

  switch (event.data.event) {
    case 'audioData': {
      audioData = data.audioData;
      lowAudioData = data.lowAudioData;
      break;
    }

    case 'play': {
      pause = false;
      requestAnimationFrame(animationFrame);
      break;
    }

    case 'pause': {
      pause = true;
      break;
    }

    case 'init': {
      maxFreq = data.maxFreq;
      lowFreq = data.lowFreq;
      maxDecibel = data.maxDecibel;
      minDecibel = data.minDecibel;
      volumeNormalizer = data.volumeNormalizer;
      decibelRange = maxDecibel - minDecibel;
      break;
    }

    case 'addCanvas': {
      var id = data.id;
      var c = new Object();
      c.type = data.type;
      c.element = data.element;
      c.res = data.res;
      c.element.width = data.offsetWidth * c.res;
      c.element.height = data.offsetHeight * c.res;
      c.context = c.element.getContext('2d');
      canvas.push([id, c]);
      oneFrameCanvas();
      frame();
      break;
    }

    case 'resizeCanvas': {
      var id = data.id;
      var index = null;
      for (var i = 0; i < canvas.length; i++) {
        if (canvas[i][0] == id) {
          var c = canvas[i][1];
          c.element.width = data.offsetWidth * c.res;
          c.element.height = data.offsetHeight * c.res;
          break;
        }
      }
      oneFrameCanvas();
      frame();
      break;
    }

    case 'removeCanvas': {
      var id = data.id;
      var index = null;
      for (var i = 0; i < canvas.length; i++) {
        if (canvas[i][0] == id) {
          index = i;
          break;
        }
      }
      if (index) {
        canvas.splice(index, 1);
      }
      break;
    }

    case 'frame': {
      frame();
      break;
    }

    case 'close': {
      pause = true;
      //clearInterval(loop);
      break;
    }
  }
};

function animationFrame() {
  if (false) {
    if (!pause) {
      setTimeout(function () {
        forcount = 0;
        frame();
        console.log(forcount);
        requestAnimationFrame(animationFrame);
      }, 10);
    }
    return;
  }
  if (!pause) {
    forcount = 0;
    frame();
    //console.log(forcount);
    requestAnimationFrame(animationFrame);
  }
}

function frame() {
  normalizedFreqArray = getNormalizedFreqDecibelArray(decibelRange * 1.0);
  normalizedFreqArray2 = getNormalizedFreqDecibelArray2(decibelRange * 1.0);
  var _iteratorNormalCompletion = true;
  var _didIteratorError = false;
  var _iteratorError = undefined;

  try {
    for (var _iterator = canvas[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
      var c = _step.value;

      switch (c[1].type) {
        case 'freqline': {
          drawFreqLine(c[1]);
          break;
        }

        case 'freqbar': {
          drawFreqBar(c[1]);
          break;
        }

        case 'freqlogline': {
          drawFreqLogLine(c[1]);
          break;
        }

        /*case "freqlogline2": {
          drawFreqLogLine2(c[1]);
          break;
        }*/
      }
    }
  } catch (err) {
    _didIteratorError = true;
    _iteratorError = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion && _iterator.return) {
        _iterator.return();
      }
    } finally {
      if (_didIteratorError) {
        throw _iteratorError;
      }
    }
  }
}

function oneFrameCanvas() {
  var _iteratorNormalCompletion2 = true;
  var _didIteratorError2 = false;
  var _iteratorError2 = undefined;

  try {
    for (var _iterator2 = canvas[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
      var c = _step2.value;

      var cc = c[1];
      switch (cc.type) {
        case 'freqloglabel': {
          drawFreqLogLabel(cc);
          break;
        }
      }
    }
  } catch (err) {
    _didIteratorError2 = true;
    _iteratorError2 = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion2 && _iterator2.return) {
        _iterator2.return();
      }
    } finally {
      if (_didIteratorError2) {
        throw _iteratorError2;
      }
    }
  }
}

function getFreqDecibelArray(n) {
  var dataArray = audioData;
  var afb = maxFreq / dataArray.length;

  var freqArray = new Array();

  for (var i = 0; i < dataArray.length; i++) {
    pushFreq(afb * i, (dataArray[i] / 255) * n);
  }

  function pushFreq(f, db) {
    if (f < 20) {
      freqArray.push([f, 0]);
    } else {
      freqArray.push([f, db]);
    }
  }

  return freqArray;
}

function getFreqDecibelArray2(n) {
  var dataArray = audioData;
  var lowDataArray = lowAudioData;
  var afb = maxFreq / dataArray.length;
  var lfb = lowFreq / lowDataArray.length;
  var ais = Math.floor(lowFreq / afb);
  lowFreqIndex = ais;

  var freqArray = new Array();

  for (var i = 0; i < lowDataArray.length; i++) {
    forcount++;
    pushFreq(lfb * i, (lowDataArray[i] / 255) * n);
  }

  for (var i = ais; i < dataArray.length; i++) {
    forcount++;
    if (afb * i > lowFreq) {
      pushFreq(afb * i, (dataArray[i] / 255) * n);
    } else {
      lowFreqIndex = i;
    }
  }

  function pushFreq(f, db) {
    if (f < 20) {
      freqArray.push([f, 0]);
    } else {
      freqArray.push([f, db]);
    }
  }

  /*for (var i = 0; i < dataArray.length; i++) {
    freqArray.push([b * i, dataArray[i] / 255 * n]);
  }*/

  return freqArray;
}

function getFreqDecibel(f, a) {
  if (f <= 0 || 20000 <= f) {
    return 0;
  }
  if (a.length < 8) {
    return 0;
  }
  var fs = Math.floor((a.length / a[a.length - 1][0]) * f);
  for (var i = fs; i < fs + 100; i++) {
    forcount++;
    if (a[i][0] <= f && f <= a[i + 1][0]) {
      var f1 = a[i];
      var f2 = a[i + 1];
      var c1 = f2[0] - f1[0];
      var c2 = f2[1] - f1[1];
      var c3 = f - f1[0];
      var d = (c2 / c1) * c3;
      var r = f1[1] + d;
      return r;
    }
  }
}

function getFreqDecibel2(f, a) {
  if (f <= 0 || maxFreq <= f || 20000 <= f) {
    return 0;
  }
  if (a.length < 8) {
    return 0;
  }
  var fs = 0;
  if (f <= lowFreq) {
    fs = Math.floor((lowFreqIndex / a[lowFreqIndex][0]) * f);
  } else {
    fs = Math.floor(((a.length - lowFreqIndex) / (maxFreq - lowFreq)) * (f - lowFreq));
    fs = fs + lowFreqIndex;
  }
  for (var i = fs; i < fs + 100; i++) {
    forcount++;
    if (a[i][0] <= f && f <= a[i + 1][0]) {
      var f1 = a[i];
      var f2 = a[i + 1];
      var c1 = f2[0] - f1[0];
      var c2 = f2[1] - f1[1];
      var c3 = f - f1[0];
      var d = (c2 / c1) * c3;
      var r = f1[1] + d;
      return r;
    }
  }
}

function getNormalizedFreqDecibelArray(n) {
  var dataArray = audioData;
  var lowDataArray = lowAudioData;
  var afb = maxFreq / dataArray.length;
  var lfb = lowFreq / lowDataArray.length;
  var ais = Math.floor(lowFreq / afb);

  var freqArray = new Array();

  for (var i = 0; i < lowDataArray.length; i += 1) {
    forcount++;
    pushFreq(lfb * i, (lowDataArray[i] / 255) * n);
  }

  lowFreqIndex = freqArray.length - 1;

  for (var i = ais; i < dataArray.length; i += 1) {
    forcount++;
    if (afb * i > lowFreq) {
      pushFreq(afb * i, (dataArray[i] / 255) * n);
    }
  }

  function pushFreq(f, db) {
    if (f < 20) {
      freqArray.push([f, 0]);
    } else {
      db = normalizeDecibel(f, db);
      freqArray.push([f, db * 1.0]);
    }
  }

  return freqArray;
}

function getNormalizedFreqDecibelArray2(n) {
  var dataArray = audioData;
  var lowDataArray = lowAudioData;
  var afb = maxFreq / dataArray.length;
  var lfb = lowFreq / lowDataArray.length;
  var ais = Math.floor(lowFreq / afb);

  var freqArray = new Array();

  for (var i = 0; i < lowDataArray.length; i += 1) {
    forcount++;
    pushFreq(lfb * i, (lowDataArray[i] / 255) * n);
  }

  lowFreqIndex = freqArray.length - 1;

  for (var i = ais; i < dataArray.length; i += 1) {
    forcount++;
    if (afb * i > lowFreq) {
      pushFreq(afb * i, (dataArray[i] / 255) * n);
    }
  }

  function pushFreq(f, db) {
    if (f < 20) {
      freqArray.push([f, 0]);
    } else {
      db = normalizeDecibel2(f, db);
      freqArray.push([f, db * 1.0]);
    }
  }

  return freqArray;
}

var Spline = (function () {
  function Spline(xs, ys) {
    _classCallCheck(this, Spline);

    this.xs = xs;
    this.ys = ys;
    this.ks = this.getNaturalKs(new Float64Array(this.xs.length));
  }

  _createClass(Spline, [
    {
      key: 'getNaturalKs',
      value: function getNaturalKs(ks) {
        var n = this.xs.length - 1;
        var A = this.zerosMat(n + 1, n + 2);

        for (
          var i = 1;
          i < n;
          i++ // rows
        ) {
          A[i][i - 1] = 1 / (this.xs[i] - this.xs[i - 1]);
          A[i][i] = 2 * (1 / (this.xs[i] - this.xs[i - 1]) + 1 / (this.xs[i + 1] - this.xs[i]));
          A[i][i + 1] = 1 / (this.xs[i + 1] - this.xs[i]);
          A[i][n + 1] = 3 * ((this.ys[i] - this.ys[i - 1]) / ((this.xs[i] - this.xs[i - 1]) * (this.xs[i] - this.xs[i - 1])) + (this.ys[i + 1] - this.ys[i]) / ((this.xs[i + 1] - this.xs[i]) * (this.xs[i + 1] - this.xs[i])));
        }

        A[0][0] = 2 / (this.xs[1] - this.xs[0]);
        A[0][1] = 1 / (this.xs[1] - this.xs[0]);
        A[0][n + 1] = (3 * (this.ys[1] - this.ys[0])) / ((this.xs[1] - this.xs[0]) * (this.xs[1] - this.xs[0]));

        A[n][n - 1] = 1 / (this.xs[n] - this.xs[n - 1]);
        A[n][n] = 2 / (this.xs[n] - this.xs[n - 1]);
        A[n][n + 1] = (3 * (this.ys[n] - this.ys[n - 1])) / ((this.xs[n] - this.xs[n - 1]) * (this.xs[n] - this.xs[n - 1]));

        return this.solve(A, ks);
      },

      /**
       * inspired by https://stackoverflow.com/a/40850313/4417327
       */
    },
    {
      key: 'getIndexBefore',
      value: function getIndexBefore(target) {
        var low = 0;
        var high = this.xs.length;
        var mid = 0;
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
      },
    },
    {
      key: 'at',
      value: function at(x) {
        var i = this.getIndexBefore(x);
        var t = (x - this.xs[i - 1]) / (this.xs[i] - this.xs[i - 1]);
        var a = this.ks[i - 1] * (this.xs[i] - this.xs[i - 1]) - (this.ys[i] - this.ys[i - 1]);
        var b = -this.ks[i] * (this.xs[i] - this.xs[i - 1]) + (this.ys[i] - this.ys[i - 1]);
        var q = (1 - t) * this.ys[i - 1] + t * this.ys[i] + t * (1 - t) * (a * (1 - t) + b * t);
        return q;
      },
    },
    {
      key: 'solve',
      value: function solve(A, ks) {
        var m = A.length;
        var h = 0;
        var k = 0;
        while (h < m && k <= m) {
          var i_max = 0;
          var max = -Infinity;
          for (var i = h; i < m; i++) {
            var _v = Math.abs(A[i][k]);
            if (_v > max) {
              i_max = i;
              max = _v;
            }
          }

          if (A[i_max][k] === 0) {
            k++;
          } else {
            this.swapRows(A, h, i_max);
            for (var _i = h + 1; _i < m; _i++) {
              var f = A[_i][k] / A[h][k];
              A[_i][k] = 0;
              for (var j = k + 1; j <= m; j++) {
                A[_i][j] -= A[h][j] * f;
              }
            }
            h++;
            k++;
          }
        }

        for (
          var _i2 = m - 1;
          _i2 >= 0;
          _i2-- // rows = columns
        ) {
          var v = 0;
          if (A[_i2][_i2]) {
            v = A[_i2][m] / A[_i2][_i2];
          }
          ks[_i2] = v;
          for (
            var _j = _i2 - 1;
            _j >= 0;
            _j-- // rows
          ) {
            A[_j][m] -= A[_j][_i2] * v;
            A[_j][_i2] = 0;
          }
        }
        return ks;
      },
    },
    {
      key: 'zerosMat',
      value: function zerosMat(r, c) {
        var A = [];
        for (var i = 0; i < r; i++) {
          A.push(new Float64Array(c));
        }
        return A;
      },
    },
    {
      key: 'swapRows',
      value: function swapRows(m, k, l) {
        var p = m[k];
        m[k] = m[l];
        m[l] = p;
      },
    },
  ]);

  return Spline;
})();

var ISO226 = (function () {
  function ISO226(db) {
    _classCallCheck(this, ISO226);

    this.db = db;
    this.tbl_f = [20, 25, 31.5, 40, 50, 63, 80, 100, 125, 160, 200, 250, 315, 400, 500, 630, 800, 1000, 1250, 1600, 2000, 2500, 3150, 4000, 5000, 6300, 8000, 10000, 12500];
    this.tbl_alpha_f = [0.532, 0.506, 0.48, 0.455, 0.432, 0.409, 0.387, 0.367, 0.349, 0.33, 0.315, 0.301, 0.288, 0.276, 0.267, 0.259, 0.253, 0.25, 0.246, 0.244, 0.243, 0.243, 0.243, 0.242, 0.242, 0.245, 0.254, 0.271, 0.301];
    this.tbl_L_U = [-31.6, -27.2, -23.0, -19.1, -15.9, -13.0, -10.3, -8.1, -6.2, -4.5, -3.1, -2.0, -1.1, -0.4, 0.0, 0.3, 0.5, 0.0, -2.7, -4.1, -1.0, 1.7, 2.5, 1.2, -2.1, -7.1, -11.2, -10.7, -3.1];
    this.tbl_T_f = [78.5, 68.7, 59.5, 51.1, 44.0, 37.5, 31.5, 26.5, 22.1, 17.9, 14.4, 11.4, 8.6, 6.2, 4.4, 3.0, 2.2, 2.4, 3.5, 1.7, -1.3, -4.2, -6.0, -5.4, -1.5, 6.0, 12.6, 13.9, 12.3];
    this.spline = this.iso226_spl_itpl(db);
  }

  _createClass(ISO226, [
    {
      key: 'freq',
      value: function freq(f) {
        return this.spline.at(f);
      },
    },
    {
      key: 'tabled_f',
      value: function tabled_f() {
        return this.tbl_f.concat(20e3);
      },
    },
    {
      key: 'tabled_L_p',
      value: function tabled_L_p(L_N) {
        var L_p = new Array();
        var tbf = this.tabled_B_f(L_N);

        for (var i = 0; i < tbf.length; i++) {
          L_p.push(40 * Math.log10(tbf[i]) + 94.0);
        }

        return L_p.concat(L_p[0]);
      },
    },
    {
      key: 'tabled_B_f',
      value: function tabled_B_f(L_p) {
        var B_f = new Array();

        for (var i = 0; i < this.tbl_T_f.length; i++) {
          B_f.push(4.47e-3 * (Math.pow(10.0, 0.025 * L_p) - 1.15) + Math.pow(0.4 * Math.pow(10.0, (this.tbl_T_f[i] + this.tbl_L_U[i]) / 10.0 - 9.0), this.tbl_alpha_f[i]));
        }

        return B_f.concat(B_f[0]);
      },
    },
    {
      key: 'iso226_spl_contour',
      value: function iso226_spl_contour(L_N) {
        if (L_N < 0 || L_N > 90) {
          throw new Error('Parameter L_N out of bounds [0-90].');
        }
        return [this.tabled_f(), this.tabled_L_p(L_N)];
      },
    },
    {
      key: 'iso226_spl_itpl',
      value: function iso226_spl_itpl(L_N) {
        var i = this.iso226_spl_contour(L_N);
        return new Spline(i[0], i[1]);
      },
    },
  ]);

  return ISO226;
})();

function normalizeDecibel2(f, db) {
  var f1 = Math.log10(f);
  var db1 = 0;
  if (f1 < 1) {
    db1 = -70.55 * f1 + 94.87;
  } else if (1 <= f1 && f1 < 1.52) {
    db1 = -28.7 * f1 + 53.22;
  } else if (1.52 <= f1 && f1 < 2) {
    db1 = -11.11 * f1 + 26.52;
  } else if (2 <= f1 && f1 < 2.28) {
    db1 = 4.34;
  } else if (2.28 <= f1 && f1 < 2.58) {
    db1 = -21.59 * f1 && f1 + 53.6;
  } else if (2.58 <= f1 && f1 < 3) {
    db1 = 46.84 * f1 - 123.25;
  } else if (3 <= f1 && f1 < 3.14) {
    db1 = -61.67 * f1 + 202.01;
  } else if (3.14 <= f1) {
    db1 = 75.76 * f1 - 229.88;
  }
  db = db - db1 + volumeNormalizer * 1;
  return db;
}

function normalizeDecibel(f, db) {
  return new ISO226(db).freq(f) + volumeNormalizer;
}

function equalLoudnessFilter(f, db) {
  var f1 = Math.log10(f);
  var db1 = 0;
  if (f1 < 1) {
    db1 = -70.55 * f1 + 94.87;
  } else if (1 <= f1 && f1 < 1.52) {
    db1 = -28.7 * f1 + 53.22;
  } else if (1.52 <= f1 && f1 < 2) {
    db1 = -11.11 * f1 + 26.52;
  } else if (2 <= f1 && f1 < 2.28) {
    db1 = 4.34;
  } else if (2.28 <= f1 && f1 < 2.58) {
    db1 = -21.59 * f1 && f1 + 53.6;
  } else if (2.58 <= f1 && f1 < 3) {
    db1 = 46.84 * f1 - 123.25;
  } else if (3 <= f1 && f1 < 3.14) {
    db1 = -61.67 * f1 + 202.01;
  } else if (3.14 <= f1) {
    db1 = 75.76 * f1 - 229.88;
  }
  db = db - db1 + volumeNormalizer * 1;
  return db;
}

function a(x) {
  var r = 0.0020994611424 * Math.pow(x, 8) - 0.0362952080169 * Math.pow(x, 7) + 0.265096822271 * Math.pow(x, 6) - 1.0675959388964 * Math.pow(x, 5) + 2.5879406359649 * Math.pow(x, 4) - 3.8425718410657 * Math.pow(x, 3) + 3.4214537302841 * Math.pow(x, 2) - 1.9646624592248 * x + 1.2496293809655;
  return r;
}

function drawFreqLine(c) {
  var canvas = c.element;
  var context = c.context;
  var res = c.res;
  var dataArray = audioData;

  context.clearRect(0, 0, canvas.width, canvas.height);

  context.lineWidth = res;
  context.strokeStyle = 'rgb(0, 255, 200)';
  context.beginPath();
  context.moveTo(0, canvas.height);

  var w = canvas.width / dataArray.length;
  var h = canvas.height / 255;

  for (var i = 0; i < dataArray.length; i++) {
    var d = dataArray[i];
    var dh = Math.max(res, d * h);

    context.lineTo(w * i, canvas.height - dh);
  }
  context.lineTo(w * dataArray.length, canvas.height);
  context.stroke();
}

function drawFreqBar(c) {
  var canvas = c.element;
  var context = c.context;
  var res = c.res;
  var dataArray = audioData;

  context.clearRect(0, 0, canvas.width, canvas.height);

  var w = canvas.width / dataArray.length;

  for (var i = 0; i < dataArray.length; i++) {
    var d = dataArray[i];

    var r = d;
    var g = 0;
    var b = d;
    if (d >= 128) {
      g = (d - 128) * 2;
      b = d / 4;
    }

    /*var r = Math.min(255, d * 1.21);
    var g = 0;
    var b = Math.min(255, d * 2);
    if (d >= 128) {
      g = (d - 128) * 2;
      b = Math.min(255, d * 1.5);
    }*/

    context.fillStyle = 'rgb(' + r + ', ' + g + ', ' + b + ')';

    context.fillRect(w * i, 0, w + res / 2, canvas.height);
  }
}

function drawFreqLogLine(c) {
  var canvas = c.element;
  var context = c.context;
  var res = c.res;

  context.clearRect(0, 0, canvas.width, canvas.height);

  context.lineWidth = res;
  context.strokeStyle = 'rgba(0, 255, 200, 0.5)';
  context.beginPath();
  context.moveTo(0, canvas.height);

  var dam = -500;
  var dax = 500;
  var dal = dax - dam + 1;

  var w = canvas.width / dal;
  var h = canvas.height / Math.pow(10, decibelRange / 10);

  for (var i = dam; i <= dax; i += 1) {
    forcount++;
    var f = 600 * Math.pow(2, i / 100);
    var d = getFreqDecibel2(f, normalizedFreqArray);
    var dd = Math.pow(10, d / 10);
    var dh = Math.max(res, dd * h);

    context.lineTo(w * (i - dam), canvas.height - dh);
  }

  context.lineTo(w * dal, canvas.height);
  context.stroke();
}

function drawFreqLogLine2(c) {
  var canvas = c.element;
  var context = c.context;
  var res = c.res;

  context.clearRect(0, 0, canvas.width, canvas.height);

  context.lineWidth = res;
  context.strokeStyle = 'rgba(255, 0, 85, 0.5)';
  context.beginPath();
  context.moveTo(0, canvas.height);

  var dam = -500;
  var dax = 500;
  var dal = dax - dam + 1;

  var w = canvas.width / dal;
  var h = canvas.height / Math.pow(10, decibelRange / 10);

  for (var i = dam; i <= dax; i += 1) {
    forcount++;
    var f = 600 * Math.pow(2, i / 100);
    var d = getFreqDecibel2(f, normalizedFreqArray2);
    var dd = Math.pow(10, d / 10);
    var dh = Math.max(res, dd * h);

    context.lineTo(w * (i - dam), canvas.height - dh);
  }

  context.lineTo(w * dal, canvas.height);
  context.stroke();
}

function drawFreqLogLabel(c) {
  var canvas = c.element;
  var context = c.context;
  var res = c.res;

  context.clearRect(0, 0, canvas.width, canvas.height);

  context.lineWidth = res;
  context.strokeStyle = 'rgb(77, 0, 128)';
  context.fillStyle = context.strokeStyle;
  context.font = 12 * res + "px 'DM Mono', Consolas";
  context.beginPath();
  context.moveTo(0, canvas.height);

  var dam = -500;
  var dax = 500;
  var dal = dax - dam + 1;

  var w = canvas.width / dal;

  var s = 100;
  if (canvas.width < 800) {
    s = 200;
  }
  if (800 <= canvas.width && canvas.width < 1600) {
    s = 100;
  }
  if (1600 <= canvas.width) {
    s = 50;
  }

  for (var i = dam; i <= dax; i += 1) {
    forcount++;
    var di = i - dam;
    var f = 600 * Math.pow(2, i / 100);

    if (di % s == 0 || i + 1 == dal) {
      context.fillText(Math.floor(f), w * di + res * 2, res * 10);
      context.moveTo(w * di, 0);
      context.lineTo(w * di, canvas.height);
    }
  }

  context.lineTo(w * dal, canvas.height);
  context.stroke();
}
