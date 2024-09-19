class AudioFileAnalyser {
  constructor(audio, element, options = {}) {
    if ('HTMLAudioElement' == !audio.constructor.name) throw new Error('Audio is not HTMLAudioElement');
    this.support = {};
    var AudioContext = window.AudioContext || window.webkitAudioContext || !1;
    AudioContext &&
      ((this.support.AudioContext = !0), new AudioContext().audioWorklet && (this.support.AudioWorklet = !0));
    try {
      var canvas = document.createElement('canvas'),
        offscreen = canvas.transferControlToOffscreen();
    } catch (error) {
      this.support.OffscreenCanvas = !0;
    }
    if (!this.support.AudioContext) throw new Error('Web Audio API: AudioContext not supported');
    if (!this.support.AudioWorklet) throw new Error('Web Audio API: AudioContext.audioWorklet not supported');
    !this.support.OffscreenCanvas;
    var _this = this;
    (this.isPaused = !0),
      (this.isClosed = !1),
      (this.sampleRate = options.maxFreq || 2e4),
      (this.fftSize = options.fftSize || 1024),
      (this.canvasRes = options.canvasRes || 2),
      (this.audio = {}),
      (this.audio.original = {}),
      (this.audio.original.node = audio),
      (this.audio.original.node.volume = 0),
      (this.duration = this.audio.original.node.duration),
      (this.audio.play = {}),
      (this.audio.play.node = this.audio.original.node.cloneNode()),
      (this.audio.play.context = new AudioContext({ sampleRate: this.sampleRate })),
      (this.audio.play.source = this.audio.play.context.createMediaElementSource(this.audio.play.node)),
      this.audio.play.source.connect(this.audio.play.context.destination),
      (this.audio.live = {}),
      (this.audio.live.node = this.audio.original.node.cloneNode()),
      (this.audio.live.context = new AudioContext({ sampleRate: this.sampleRate })),
      (this.audio.live.source = this.audio.live.context.createMediaElementSource(this.audio.live.node)),
      (this.audio.live.worker = new Worker('https://wany.io/resource/amuject/audio-analyser-3/worker-liveanalyser.js')),
      this.audio.live.worker.postMessage({
        event: 'init',
        data: { sampleRate: this.sampleRate, bufferSize: this.fftSize },
      }),
      (this.audio.live.worker.onmessage = (event) => {
        var data = event.data.data;
        switch (event.data.event) {
          case 'process': {
            this.process(data);
            break;
          }
        }
      }),
      (this.audio.live.processData = { audioSpectrum: [], rawAudioData: [], prsAudioData: [], cpuAudioData: {} }),
      this.audio.live.context.audioWorklet
        .addModule('https://wany.io/resource/amuject/audio-analyser-3/worker-liveanalyser-processor.js')
        .then(() => {
          (this.audio.live.processor = new AudioWorkletNode(this.audio.live.context, 'processor')),
            (this.audio.live.processor.port.onmessage = (event) => {
              this.audio.live.worker.postMessage({ event: 'process', data: event.data });
            }),
            (this.audio.live.volume = this.audio.live.context.createGain()),
            (this.audio.live.volume.gain.value = 0),
            this.audio.live.source
              .connect(this.audio.live.processor)
              .connect(this.audio.live.volume)
              .connect(this.audio.live.context.destination);
        }),
      (this.audio.live.canvases = []),
      (this.audio.live.canvas = {}),
      (this.audio.live.canvas.add = (id, type, element, options) => {
        var offscreen = element.transferControlToOffscreen();
        options || (options = {}),
          (options.id = id),
          (options.type = type),
          (options.element = offscreen),
          (options.res = 2),
          (options.offsetWidth = element.offsetWidth),
          (options.offsetHeight = element.offsetHeight),
          this.audio.live.worker.postMessage({ event: 'addCanvas', data: options }, [offscreen]),
          this.audio.live.canvases.push({ id: id, type: type, element: element, offscreen: offscreen });
      }),
      (this.audio.live.canvas.remove = (id) => {
        this.audio.live.worker.postMessage({ event: 'removeCanvas', data: { id: id } });
        for (var i = 0; i < this.audio.live.canvases.length; i++)
          if (this.audio.live.canvases[i].id == id) {
            this.audio.live.canvases.splice(i, 1);
            break;
          }
      }),
      (this.audio.live.canvas.resize = () => {
        for (var canvas of this.audio.live.canvases)
          this.audio.live.worker.postMessage({
            event: 'resizeCanvas',
            data: { id: canvas.id, offsetWidth: canvas.element.offsetWidth, offsetHeight: canvas.element.offsetHeight },
          });
      }),
      (this.audio.live.canvas.process = () => {
        for (var canvas of this.audio.live.canvases)
          switch (canvas.type) {
            case 'cpu-value1': {
              var parent = canvas.element.parentElement,
                dataElement = parent.querySelector('label.data'),
                data = this.audio.live.processData.cpuAudioData.value1.data;
              (data = (Math.round(1e5 * data) / 1e5).toFixed(5)), dataElement && data && (dataElement.innerHTML = data);
              break;
            }
            case 'cpu-value2': {
              var parent = canvas.element.parentElement,
                dataElement = parent.querySelector('label.data'),
                data = this.audio.live.processData.cpuAudioData.value2.data;
              (data = (Math.round(1e5 * data) / 1e5).toFixed(5)), dataElement && data && (dataElement.innerHTML = data);
              break;
            }
            case 'cpu-memory1': {
              var parent = canvas.element.parentElement,
                dataElement = parent.querySelector('label.data'),
                data = this.audio.live.processData.cpuAudioData.memory1.data;
              (data = (Math.round(1e5 * data) / 1e5).toFixed(5)), dataElement && data && (dataElement.innerHTML = data);
              break;
            }
            case 'cpu-memory2': {
              var parent = canvas.element.parentElement,
                dataElement = parent.querySelector('label.data'),
                data = this.audio.live.processData.cpuAudioData.memory2.data;
              (data = (Math.round(1e5 * data) / 1e5).toFixed(5)), dataElement && data && (dataElement.innerHTML = data);
              break;
            }
            case 'cpu-emotion1': {
              var parent = canvas.element.parentElement,
                dataElement = parent.querySelector('label.data'),
                data = this.audio.live.processData.cpuAudioData.emotion1.data;
              (data = (Math.round(1e5 * data) / 1e5).toFixed(5)), dataElement && data && (dataElement.innerHTML = data);
              var avaElement = parent.querySelector('label.ava'),
                ava =
                  this.audio.live.processData.cpuAudioData.emotion1.sum /
                  this.audio.live.processData.cpuAudioData.sumloop;
              (ava = (Math.round(1e5 * ava) / 1e5).toFixed(5)), avaElement && ava && (avaElement.innerHTML = ava);
              break;
            }
            case 'cpu-emotion2': {
              var parent = canvas.element.parentElement,
                dataElement = parent.querySelector('label.data'),
                data = this.audio.live.processData.cpuAudioData.emotion2.data;
              (data = (Math.round(1e5 * data) / 1e5).toFixed(5)), dataElement && data && (dataElement.innerHTML = data);
              var avaElement = parent.querySelector('label.ava'),
                ava =
                  this.audio.live.processData.cpuAudioData.emotion2.sum /
                  this.audio.live.processData.cpuAudioData.sumloop;
              (ava = (Math.round(1e5 * ava) / 1e5).toFixed(5)), avaElement && ava && (avaElement.innerHTML = ava);
              break;
            }
          }
      }),
      (this.audio.full = {}),
      (this.audio.full.notmain = !0),
      (this.audio.full.node = this.audio.original.node.cloneNode()),
      (this.audio.full.context = new AudioContext({ sampleRate: this.sampleRate })),
      (this.audio.full.source = this.audio.full.context.createMediaElementSource(this.audio.full.node)),
      (this.audio.full.analyser = this.audio.full.context.createAnalyser()),
      (this.audio.full.volume = this.audio.full.context.createGain()),
      (this.audio.full.volume.gain.value = 0),
      this.audio.full.source
        .connect(this.audio.full.analyser)
        .connect(this.audio.full.volume)
        .connect(this.audio.full.context.destination),
      (this.audio.full.analyserSpectrum = new Uint8Array(this.fftSize)),
      (this.audio.full.processData = []),
      (this.audio.full.process = () => {
        var time = this.audio.full.node.currentTime;
        this.audio.full.analyser.getByteFrequencyData(this.audio.full.analyserSpectrum);
        var analyserSpectrum = this.audio.full.analyserSpectrum,
          sum = 0;
        for (var a of analyserSpectrum) sum += a;
        this.audio.full.processData.push([time, sum / analyserSpectrum.length, analyserSpectrum]);
      }),
      (this.audio.full.analyseEngine = () => {
        var loopcount = -1,
          speed = [16, 8, 4, 2, 1],
          loop = setInterval(() => {
            if (!this.isClosed) {
              if (this.audio.full.node.paused) {
                if (4 == loopcount) return void clearInterval(loop);
                loopcount++,
                  console.log('loop ' + loopcount + ' ' + speed[loopcount]),
                  (this.audio.full.node.playbackRate = speed[loopcount]),
                  this.audio.full.node.play();
              }
              this.audio.full.process();
            }
          }, 10);
      }),
      this.audio.full.analyseEngine(),
      (this.element = element),
      this.insertHTML(),
      (this.e = {}),
      (this.e.currentTime = this.element.querySelector('.info .currenttime')),
      (this.e.playbtn = this.element.querySelector('.info .playbtn')),
      (this.e.playpausebtn = this.element.querySelector('.seek .control .btns .playpausebtn')),
      (this.e.stopbtn = this.element.querySelector('.seek .control .btns .stopbtn')),
      (this.e.playspeeddownbtn = this.element.querySelector('.seek .control .btns .playspeeddown')),
      (this.e.playspeedupbtn = this.element.querySelector('.seek .control .btns .playspeedup')),
      (this.e.seekbar = this.element.querySelector('#input-seekbar')),
      (this.e.canvasSeekLevel = this.element.querySelector('#canvas-seek-level')),
      (this.e.canvasSeekFreq = this.element.querySelector('#canvas-seek-freq')),
      this.audio.live.canvas.add('fr1', 'freq-regfftraw-line', this.element.querySelector('#canvas-regfft-line')),
      this.audio.live.canvas.add('fr2', 'freq-regfftraw-bar', this.element.querySelector('#canvas-regfft-bar')),
      this.audio.live.canvas.add('fr3', 'freq-regfft-label', this.element.querySelector('#canvas-regfft-label'), {
        color: 'rgba(155, 0, 255, 0.5)',
      }),
      this.audio.live.canvas.add('fl1', 'freq-logdft226-line', this.element.querySelector('#canvas-logdft226')),
      this.audio.live.canvas.add('fl2', 'freq-logdft-label', this.element.querySelector('#canvas-logdft226-label'), {
        color: 'rgba(155, 0, 255, 0.5)',
      }),
      this.audio.live.canvas.add('p1', 'cpu-value1', this.element.querySelector('#canvas-cpu-value1')),
      this.audio.live.canvas.add('p2', 'cpu-value2', this.element.querySelector('#canvas-cpu-value2')),
      this.audio.live.canvas.add('p3', 'cpu-memory1', this.element.querySelector('#canvas-cpu-memory1')),
      this.audio.live.canvas.add('p4', 'cpu-memory2', this.element.querySelector('#canvas-cpu-memory2')),
      this.audio.live.canvas.add('p5', 'cpu-emotion1', this.element.querySelector('#canvas-cpu-emotion1')),
      this.audio.live.canvas.add('p6', 'cpu-emotion2', this.element.querySelector('#canvas-cpu-emotion2')),
      this.audio.live.canvas.add('p13', 'cpu-emotion-xy', this.element.querySelector('#canvas-cpu-emotion-xy')),
      this.audio.live.canvas.add(
        'p14',
        'cpu-emotion-xy-label',
        this.element.querySelector('#canvas-cpu-emotion-xy-label'),
        { color: 'rgba(155, 0, 255, 0.5)' }
      ),
      this.audio.live.canvas.add('p9', 'cpu-memory1-label', this.element.querySelector('#canvas-cpu-memory1-label'), {
        color: 'rgba(155, 0, 255, 0.5)',
      }),
      this.audio.live.canvas.add('p10', 'cpu-memory2-label', this.element.querySelector('#canvas-cpu-memory2-label'), {
        color: 'rgba(155, 0, 255, 0.5)',
      }),
      this.audio.live.canvas.add(
        'p11',
        'cpu-emotion1-label',
        this.element.querySelector('#canvas-cpu-emotion1-label'),
        { color: 'rgba(155, 0, 255, 0.5)' }
      ),
      this.audio.live.canvas.add(
        'p12',
        'cpu-emotion2-label',
        this.element.querySelector('#canvas-cpu-emotion2-label'),
        { color: 'rgba(155, 0, 255, 0.5)' }
      ),
      (this.audio.full.levelCanvas = this.element.querySelector('#canvas-seek-level')),
      (this.audio.full.levelCanvas.width = this.audio.full.levelCanvas.offsetWidth),
      (this.audio.full.levelCanvas.height = this.audio.full.levelCanvas.offsetHeight),
      (this.audio.full.levelContext = this.audio.full.levelCanvas.getContext('2d')),
      (this.audio.full.freqCanvas = this.element.querySelector('#canvas-seek-freq')),
      (this.audio.full.freqCanvas.width = this.audio.full.freqCanvas.offsetWidth),
      (this.audio.full.freqCanvas.height = this.audio.full.freqCanvas.offsetHeight),
      (this.audio.full.freqContext = this.audio.full.freqCanvas.getContext('2d'));
    for (var dragbar of this.element.querySelectorAll('.dragbar')) this.addDragbar(dragbar);
    (this.e.seekbar.max = Math.floor(1e3 * this.duration)),
      this.e.seekbar.addEventListener('change', () => {
        this.audio && (this.goto(this.e.seekbar.value / 1e3), this.e.seekbar.blur(), this.audio.paused);
      }),
      this.e.seekbar.addEventListener('mouseup', () => {
        this.audio && (this.goto(this.e.seekbar.value / 1e3), this.e.seekbar.blur(), this.audio.paused);
      }),
      this.e.playbtn.addEventListener('click', () => {
        this.toggle();
      }),
      this.e.playpausebtn.addEventListener('click', () => {
        this.toggle();
      }),
      this.e.stopbtn.addEventListener('click', () => {
        this.pause(), this.goto(0);
      }),
      this.e.playspeeddownbtn.addEventListener('click', () => {
        this.speed(this.playbackRate / 2);
      }),
      this.e.playspeedupbtn.addEventListener('click', () => {
        this.speed(2 * this.playbackRate);
      }),
      document.addEventListener('keydown', function (event) {
        ' ' == event.key && (event.preventDefault(), _this.toggle());
      }),
      window.addEventListener('resize', () => {
        clearTimeout(window.resizedFinished),
          (window.resizedFinished = setTimeout(function () {
            _this.resize();
          }, 250));
      }),
      this.audio.live.worker.postMessage({
        event: 'setcpuag',
        data: {
          alpha: document.querySelector('#input-cpu-alpha').value,
          emo1gamma: document.querySelector('#input-cpu-emo1gamma').value,
          emo2gamma: document.querySelector('#input-cpu-emo2gamma').value,
        },
      }),
      document.querySelector('#input-cpu-alpha').addEventListener('change', () => {
        this.audio.live.worker.postMessage({
          event: 'setcpuag',
          data: {
            alpha: document.querySelector('#input-cpu-alpha').value,
            emo1gamma: document.querySelector('#input-cpu-emo1gamma').value,
            emo2gamma: document.querySelector('#input-cpu-emo2gamma').value,
          },
        });
      }),
      document.querySelector('#input-cpu-emo1gamma').addEventListener('change', () => {
        this.audio.live.worker.postMessage({
          event: 'setcpuag',
          data: {
            alpha: document.querySelector('#input-cpu-alpha').value,
            emo1gamma: document.querySelector('#input-cpu-emo1gamma').value,
            emo2gamma: document.querySelector('#input-cpu-emo2gamma').value,
          },
        });
      }),
      document.querySelector('#input-cpu-emo2gamma').addEventListener('change', () => {
        this.audio.live.worker.postMessage({
          event: 'setcpuag',
          data: {
            alpha: document.querySelector('#input-cpu-alpha').value,
            emo1gamma: document.querySelector('#input-cpu-emo1gamma').value,
            emo2gamma: document.querySelector('#input-cpu-emo2gamma').value,
          },
        });
      }),
      document.querySelector('#input-cpu-resetemosum').addEventListener('click', () => {
        this.audio.live.worker.postMessage({ event: 'resetemosum', data: {} });
      }),
      this.pause(),
      (this.playbackRate = 1),
      this.speed(this.playbackRate),
      this.volume(0.5),
      (this.currentTime = this.audio.play.node.currentTime),
      (this.animationFrame = () => {
        this.isClosed || (!this.isPaused, this.frameElement(), requestAnimationFrame(this.animationFrame));
      }),
      requestAnimationFrame(this.animationFrame);
  }
  frameElement() {
    (this.currentTime = this.audio.play.node.currentTime),
      this.isPaused != this.audio.play.node.paused &&
        ((this.isPaused = this.audio.play.node.paused), this.isPaused ? this.pause() : this.play());
    var mm = Math.floor(this.currentTime / 60),
      ss = Math.floor(this.currentTime - 60 * mm),
      cc = Math.floor(1e3 * (this.currentTime - ss)) % 1e3;
    (ss = (10 > ss ? '0' : '') + ss),
      (cc = ([, , ,].join('0') + cc).substr(-3)),
      (this.e.currentTime.innerHTML = mm + ':' + ss + '.' + cc);
    var seekbarwidthslice = this.element.querySelector('.seek .line').offsetWidth / Math.floor(1e3 * this.duration);
    (this.element.querySelector('.seek .line .currentline').style.left =
      Math.min(
        this.element.querySelector('.seek .line').offsetWidth - 1.5,
        seekbarwidthslice * Math.floor(1e3 * this.currentTime)
      ) + 'px'),
      (this.element.querySelector('.seek .line .seekbarline').style.left =
        document.activeElement == this.element.querySelector('#input-seekbar')
          ? Math.min(
              this.element.querySelector('.seek .line').offsetWidth - 1.5,
              seekbarwidthslice * this.element.querySelector('#input-seekbar').value
            ) + 'px'
          : this.element.querySelector('.seek .line .currentline').style.left);
    var volume = this.element.querySelector('#input-volume').value,
      volumeLeft = Math.min(
        this.element.querySelector('.seek .control .volume .slider .line').offsetWidth - 0.5,
        (this.element.querySelector('.seek .control .volume .slider .line').offsetWidth / 100) * volume
      );
    (this.element.querySelector('.seek .control .volume .slider .line .currentline').style.left = volumeLeft + 'px'),
      (this.element.querySelector('.audioanalyser .seek .control .volume .number').innerHTML = volume),
      this.volume(volume / 100);
  }
  insertHTML() {
    var html = "<div class='audioanalyser audiofileanalyser'>";
    (html += "  <div class='main'>"),
      (html += "  <div class='wrapper left right'>"),
      (html += "    <div class='info'>"),
      (html += "      <div class='currenttime'>0:00.000</div>"),
      (html += "      <div class='playbtn btn'>play</div>"),
      (html += '    </div>'),
      (html += "    <div class='seek'>"),
      (html += "    <div class='dragbar bottom'></div>"),
      (html += "    <div class='wrapper bottom'>"),
      (html += "      <div class='bar'>"),
      (html += "        <div class='seekbar layer'>"),
      (html += "          <input id='input-seekbar' type='range' min='0' max='0'>"),
      (html += '        </div>'),
      (html += "        <div class='graphic layer'>"),
      (html += "          <div class='level'>"),
      (html += "            <div class='canvas layer'>"),
      (html += "              <canvas id='canvas-seek-level' class='layer'></canvas>"),
      (html += '            </div>'),
      (html += "            <div class='elem layer'>"),
      (html += "              <div class='centerline'></div>"),
      (html += '            </div>'),
      (html += '          </div>'),
      (html += "          <div class='freq'>"),
      (html += "            <div class='canvas layer'>"),
      (html += "              <canvas id='canvas-seek-freq' class='layer'></canvas>"),
      (html += '            </div>'),
      (html += '          </div>'),
      (html += '        </div>'),
      (html += "        <div class='line layer'>"),
      (html += "          <div class='seekbarline'>"),
      (html += "            <div class='ltop'></div><div class='lbottom'></div>"),
      (html += '          </div>'),
      (html += "          <div class='currentline'>"),
      (html += "            <div class='ltop'></div><div class='lbottom'></div>"),
      (html += "            <div class='top'></div><div class='bottom'></div>"),
      (html += '          </div>'),
      (html += '        </div>'),
      (html += '      </div>'),
      (html += "      <div class='control'>"),
      (html += "        <div class='btns'>"),
      (html += "          <div class='playpause'>"),
      (html += "            <div class='playpausebtn btn'>"),
      (html += '            </div>'),
      (html +=
        "            <div class='stopbtn btn'><svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect class='cls-1' width='100' height='100'/></svg></div>"),
      (html += '          </div>'),
      (html += "          <div class='playspeed'>"),
      (html += "            <div class='playspeeddown btn'>\xF72"),
      (html += '            </div>'),
      (html += "            <div class='playspeedcurrent'>1"),
      (html += '            </div>'),
      (html += "            <div class='playspeedup btn'>\xD72"),
      (html += '            </div>'),
      (html += '          </div>'),
      (html += '        </div>'),
      (html += "        <div class='volume'>"),
      (html += "          <div class='number'>100</div>"),
      (html += "          <div class='slider'>"),
      (html += "            <div class='input layer'>"),
      (html += "              <input id='input-volume' type='range' min='0' max='100' value='50' step='1'>"),
      (html += '            </div>'),
      (html += "            <div class='cbar layer'>"),
      (html += "              <div class='centerline'></div>"),
      (html += '            </div>'),
      (html += "            <div class='line layer'>"),
      (html += "              <div class='currentline'></div>"),
      (html += '            </div>'),
      (html += '          </div>'),
      (html += '        </div>'),
      (html += '      </div>'),
      (html += '    </div></div>'),
      (html += "        <div class='exycanvas'>"),
      (html += "          <canvas id='canvas-cpu-emotion-xy' class='layer'></canvas>"),
      (html += "          <canvas id='canvas-cpu-emotion-xy-label' class='layer'></canvas>"),
      (html += '        </div>'),
      (html += '  </div></div>'),
      (html += "  <div class='rightside'>"),
      (html += "  <div class='dragbar left'></div>"),
      (html += "  <div class='wrapper left right'>"),
      (html += "    <div class='freqreg'>"),
      (html += "    <div class='dragbar bottom'></div>"),
      (html += "    <div class='wrapper bottom'>"),
      (html += "      <div class='canvas layer regfft'>"),
      (html += "        <canvas id='canvas-regfft-bar' class='layer'></canvas>"),
      (html += "        <canvas id='canvas-regfft-label' class='layer'></canvas>"),
      (html += "        <canvas id='canvas-regfft-line' class='layer'></canvas>"),
      (html += '      </div>'),
      (html += '    </div></div>'),
      (html += "    <div class='freq226'>"),
      (html += "    <div class='dragbar bottom'></div>"),
      (html += "    <div class='wrapper bottom top'>"),
      (html += "      <div class='canvas layer regfft226 none'>"),
      (html += "        <canvas id='canvas-regfft226-label' class='layer'></canvas>"),
      (html += "        <canvas id='canvas-regfft226' class='layer'></canvas>"),
      (html += '      </div>'),
      (html += "      <div class='canvas layer logdft226'>"),
      (html += "        <canvas id='canvas-logdft226-label' class='layer'></canvas>"),
      (html += "        <canvas id='canvas-logdft226' class='layer'></canvas>"),
      (html += '      </div>'),
      (html += "      <div class='label layer none'>"),
      (html += "        <div scale='log' class='btn logscalebtn' id='btn-toggle-freq-logscalex'>Log Scale X</div>"),
      (html += '      </div>'),
      (html += '    </div></div>'),
      (html += "    <div class='cpu'>"),
      (html += "    <div class='dragbar bottom'></div>"),
      (html += "    <div class='wrapper bottom top'>"),
      (html += "      <div class='colset'>"),
      (html += "        <div class='canvas'>"),
      (html += "          <canvas id='canvas-cpu-value1-label' class='layer'></canvas>"),
      (html += "          <canvas id='canvas-cpu-value1' class='layer'></canvas>"),
      (html += "          <div class='labels layer'>"),
      (html += "            <label class='name'>Value 1</label>"),
      (html += "            <label class='data' id='label-cpu-value1-d'>0</label>"),
      (html += '          </div>'),
      (html += '        </div>'),
      (html += "        <div class='canvas'>"),
      (html += "          <canvas id='canvas-cpu-value2-label' class='layer'></canvas>"),
      (html += "          <canvas id='canvas-cpu-value2' class='layer'></canvas>"),
      (html += "          <div class='labels layer'>"),
      (html += "            <label class='name'>Value 2</label>"),
      (html += "            <label class='data' id='label-cpu-value2-d'>0</label>"),
      (html += '          </div>'),
      (html += '        </div>'),
      (html += '      </div>'),
      (html += "      <div class='divbar'></div>"),
      (html += "      <div class='colset'>"),
      (html += "        <div class='canvas'>"),
      (html += "          <canvas id='canvas-cpu-memory1-label' class='layer'></canvas>"),
      (html += "          <canvas id='canvas-cpu-memory1' class='layer'></canvas>"),
      (html += "          <div class='labels layer'>"),
      (html += "            <label class='name'>Memory 1</label>"),
      (html += "            <label class='data' id='label-cpu-memory1-d'>0</label>"),
      (html += '          </div>'),
      (html += '        </div>'),
      (html += "        <div class='canvas'>"),
      (html += "          <canvas id='canvas-cpu-memory2-label' class='layer'></canvas>"),
      (html += "          <canvas id='canvas-cpu-memory2' class='layer'></canvas>"),
      (html += "          <div class='labels layer'>"),
      (html += "            <label class='name'>Memory 2</label>"),
      (html += "            <label class='data' id='label-cpu-memory2-d'>0</label>"),
      (html += '          </div>'),
      (html += '        </div>'),
      (html += '      </div>'),
      (html += "      <div class='divbar'></div>"),
      (html += "      <div class='colset'>"),
      (html += "        <div class='canvas'>"),
      (html += "          <canvas id='canvas-cpu-emotion1-label' class='layer'></canvas>"),
      (html += "          <canvas id='canvas-cpu-emotion1' class='layer'></canvas>"),
      (html += "          <div class='labels layer'>"),
      (html += "            <label class='name'>Emotion 1</label>"),
      (html += "            <label class='data' id='label-cpu-emotion1-d'>0</label>"),
      (html += "            <label class='ava' id='label-cpu-emotion1-a'>0</label>"),
      (html += '          </div>'),
      (html += '        </div>'),
      (html += "        <div class='canvas'>"),
      (html += "          <canvas id='canvas-cpu-emotion2-label' class='layer'></canvas>"),
      (html += "          <canvas id='canvas-cpu-emotion2' class='layer'></canvas>"),
      (html += "          <div class='labels layer'>"),
      (html += "            <label class='name'>Emotion 2</label>"),
      (html += "            <label class='data' id='label-cpu-emotion2-d'>0</label>"),
      (html += "            <label class='ava' id='label-cpu-emotion1-a'>0</label>"),
      (html += '          </div>'),
      (html += '        </div>'),
      (html += '      </div>'),
      (html += '    </div></div>'),
      (html += '  </div></div>'),
      (html += "  <div class='control'>"),
      (html += '  </div>'),
      (html += '</div>'),
      (this.element.innerHTML = html);
  }
  play() {
    for (var audio in ((this.isPaused = !1), this.audio)) this.audio[audio].notmain || this.audio[audio].node.play();
    this.audio.live.worker.postMessage({ event: 'play', data: {} }),
      (this.e.playbtn.innerHTML = 'PLAYING'),
      (this.e.playpausebtn.innerHTML =
        "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 75 100'><rect class='cls-1' width='25' height='100'/><rect class='cls-1' x='50' width='25' height='100'/></svg>");
  }
  pause() {
    for (var audio in ((this.isPaused = !0), this.audio)) this.audio[audio].notmain || this.audio[audio].node.pause();
    this.audio.live.worker.postMessage({ event: 'pause', data: {} }),
      (this.e.playbtn.innerHTML = 'PAUSED'),
      (this.e.playpausebtn.innerHTML =
        "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 87.5 100'><polygon class='cls-1' points='0 0 87.5 50 0 100 0 0'/></svg>");
  }
  toggle() {
    this.isPaused ? this.play() : this.pause();
  }
  goto(time) {
    for (var audio in ((this.currentTime = time), this.audio))
      this.audio[audio].notmain || (this.audio[audio].node.currentTime = this.currentTime);
  }
  volume(v) {
    this.audio.play.node.volume = v;
  }
  speed(s) {
    for (var audio in ((s = Math.min(16, s)), (s = Math.max(0.125, s)), (this.playbackRate = s), this.audio))
      this.audio[audio].notmain || (this.audio[audio].node.playbackRate = this.playbackRate);
    this.element.querySelector('.seek .control .btns .playspeedcurrent').innerHTML = this.playbackRate;
  }
  resize() {
    this.audio.live.canvas.resize();
  }
  process(data) {
    (this.audio.live.processData = data), this.audio.live.canvas.process();
  }
  close() {
    (this.isClosed = !0),
      this.audio.live.processor.port.close(),
      this.audio.live.worker.terminate(),
      this.pause(),
      this.volume(0),
      (this.audio = null),
      (this.element.innerHTML = '');
  }
  addDragbar(element) {
    var _this = this,
      type = element.classList[1];
    switch (
      (element.addEventListener('mousedown', function (event) {
        element.classList.add('dragging'), event.preventDefault();
      }),
      element.addEventListener('mouseup', function () {
        element.classList.remove('dragging'), _this.resize();
      }),
      type)
    ) {
      case 'left': {
        document.addEventListener('mousemove', function (event) {
          if (element.classList.contains('dragging')) {
            var x = event.clientX + window.pageXOffset,
              parent = element.parentElement,
              rect = parent.getBoundingClientRect(),
              parentWidth = rect.right - rect.left,
              mouseadd = rect.left - x,
              pparent = parent.parentElement,
              prect = pparent.getBoundingClientRect(),
              pparentWidth = prect.right - prect.left,
              w = 100 * ((parentWidth + mouseadd) / pparentWidth);
            return (w = Math.min(100, w)), void (parent.style.width = w + '%');
          }
        });
        break;
      }
      case 'right': {
        document.addEventListener('mousemove', function (event) {
          if (element.classList.contains('dragging')) {
            var x = event.clientX + window.pageXOffset,
              parent = element.parentElement,
              rect = parent.getBoundingClientRect(),
              parentWidth = rect.right - rect.left,
              mouseadd = x - rect.right,
              pparent = parent.parentElement,
              prect = pparent.getBoundingClientRect(),
              pparentWidth = prect.right - prect.left,
              w = 100 * ((parentWidth + mouseadd) / pparentWidth);
            return (w = Math.min(100, w)), void (parent.style.width = w + '%');
          }
        });
        break;
      }
      case 'bottom': {
        document.addEventListener('mousemove', function (event) {
          if (element.classList.contains('dragging')) {
            var y = event.clientY + window.pageYOffset,
              parent = element.parentElement,
              rect = parent.getBoundingClientRect(),
              parentHeight = rect.bottom - rect.top,
              mouseadd = y - rect.bottom - window.scrollY,
              pparent = parent.parentElement,
              prect = pparent.getBoundingClientRect(),
              pparentHeight = prect.bottom - prect.top,
              h = 100 * ((parentHeight + mouseadd) / pparentHeight);
            return (h = Math.min(100, h)), void (parent.style.height = h + '%');
          }
        });
        break;
      }
      case 'top': {
        document.addEventListener('mousemove', function (event) {
          if (element.classList.contains('dragging')) {
            var y = event.clientY + window.pageYOffset,
              parent = element.parentElement,
              rect = parent.getBoundingClientRect(),
              parentHeight = rect.bottom - rect.top,
              mouseadd = rect.top - y - window.scrollY,
              pparent = parent.parentElement,
              prect = pparent.getBoundingClientRect(),
              pparentHeight = prect.bottom - prect.top,
              h = 100 * ((parentHeight + mouseadd) / pparentHeight);
            return (h = Math.min(100, h)), void (parent.style.height = h + '%');
          }
        });
        break;
      }
    }
  }
  getCurrentAudioData() {
    var audioNode = this.audio.cloneNode();
    (audioNode.currentTime = this.audio.currentTime),
      (audioNode.oncanplay = () => {
        var context = new AudioContext(),
          src = context.createMediaElementSource(audioNode),
          analyser = context.createAnalyser(),
          volume = context.createGain();
        (volume.gain.value = 0),
          src.connect(analyser),
          analyser.connect(volume),
          volume.connect(context.destination),
          (analyser.fftSize = this.fftSize),
          (analyser.smoothingTimeConstant = this.smoothingTime / 1e3);
        var bufferLength = analyser.frequencyBinCount;
        (this.audioData = new Uint8Array(bufferLength)),
          (audioNode.volume = this.audio.volume),
          audioNode.play(),
          setTimeout(() => {
            analyser.getByteFrequencyData(this.audioData);
          }, this.smoothingTime),
          setTimeout(() => {
            audioNode.pause(), this.frameDraw();
          }, this.smoothingTime + 50);
      });
  }
  fullDecibelGraph() {
    function drawgraph() {
      analyser.getByteFrequencyData(dataArray);
      for (
        var timestamp = 100 * audioNode.currentTime,
          widthBlock = canvaslevel.width / (100 * audioNode.duration),
          heightBlock = canvaslevel.height / dataArray.length,
          x = widthBlock * timestamp,
          all = 0,
          i = 0;
        i < dataArray.length;
        i++
      ) {
        var d = dataArray[i],
          dh = Math.max(cr, d * h),
          r = d,
          g = 0,
          b = 0;
        128 <= d && ((g = 2 * (d - 128)), (b = d / 4)),
          128 > d && (b = d),
          (ctxfreq.fillStyle = 'rgb(' + r + ', ' + g + ', ' + b + ')'),
          ctxfreq.fillRect(x, canvaslevel.height - heightBlock * i, widthBlock + cr, heightBlock),
          (all += dataArray[i]);
      }
      var h = canvaslevel.height / 256,
        decibel = Math.max(1, (all / dataArray.length) * h);
      ctxlevel.fillRect(x, canvaslevel.height / 2, widthBlock + cr, decibel),
        ctxlevel.fillRect(x, canvaslevel.height / 2, widthBlock + cr, -1 * decibel);
    }
    return;
    var loop,
      audioNode = this.audio.cloneNode(),
      analyser = null,
      dataArray = [],
      canvaslevel = this.e.canvasSeekLevel;
    canvaslevel.setAttribute('width', canvaslevel.offsetWidth * this.canvasRes),
      canvaslevel.setAttribute('height', canvaslevel.offsetHeight * this.canvasRes);
    var ctxlevel = canvaslevel.getContext('2d'),
      canvasfreq = this.e.canvasSeekFreq;
    canvasfreq.setAttribute('width', canvasfreq.offsetWidth * this.canvasRes),
      canvasfreq.setAttribute('height', canvasfreq.offsetHeight * this.canvasRes);
    var ctxfreq = canvasfreq.getContext('2d');
    ctxlevel.fillStyle = 'rgb(155, 0, 255)';
    var s = 0;
    (audioNode.oncanplay = () => {
      var context = new AudioContext(),
        src = context.createMediaElementSource(audioNode),
        volume = context.createGain();
      (volume.gain.value = 0),
        volume.connect(context.destination),
        (analyser = context.createAnalyser()),
        src.connect(analyser),
        analyser.connect(volume),
        (analyser.fftSize = 256),
        (analyser.smoothingTimeConstant = 0.01),
        (dataArray = new Uint8Array(analyser.frequencyBinCount)),
        (audioNode.volume = 0.5),
        (audioNode.playbackRate = 5),
        (s = canvaslevel.width / (100 * audioNode.duration)),
        audioNode.play();
    }),
      (audioNode.onended = () => {
        clearInterval(loop);
      });
    var cr = this.canvasRes;
    loop = setInterval(() => {
      audioNode.paused || drawgraph();
    }, 10);
  }
  getkey() {
    for (
      var scale = ['C_', 'C#', 'D_', 'D#', 'E_', 'F_', 'F#', 'G_', 'G#', 'A_', 'A#', 'B_'],
        data = { C_: 0, 'C#': 0, D_: 0, 'D#': 0, E_: 0, F_: 0, 'F#': 0, G_: 0, 'G#': 0, A_: 0, 'A#': 0, B_: 0 },
        list = [],
        o = 3;
      8 >= o;
      o++
    )
      for (var f, s = 1; 12 >= s; s++)
        (f = 55 * 2 ** (o - 1) * 2 ** ((s - 10) / 12)), (data[scale[s - 1]] += this.getFreqDecibel(f));
    for (var data2 = [], s = 1; 12 >= s; s++) data2.push({ name: scale[s - 1], size: data[scale[s - 1]] });
    data2.sort(function (a, b) {
      return parseFloat(b.size) - parseFloat(a.size);
    }),
      (data2 = data2.sort());
    for (var s = 1; 12 >= s; s++) list.push(data2[s - 1].name);
    return list;
  }
}
class AudioStreamAnalyser {
  constructor(element, audio, options) {
    var _this = this;
    if ('MediaStream' != !audio.constructor.name) {
      (this.element = element),
        options || (options = {}),
        (this.mode = options.mode || 'audio'),
        (this.sampleRate = options.maxFreq || 2e4),
        (this.fftSize = options.fftSize || 1024),
        (this.canvasRes = options.canvasRes || 2),
        (this.isPaused = !0),
        (this.isClosed = !1),
        (this.audio = {}),
        (this.worker = {}),
        (this.audio.original = {}),
        (this.audio.original.node = audio),
        (this.audio.original.context = new AudioContext({ sampleRate: this.sampleRate })),
        (this.audio.original.source = this.audio.original.context.createMediaStreamSource(this.audio.original.node)),
        (this.audio.live = {}),
        (this.audio.live.processData = { audioSpectrum: [], rawAudioData: [], prsAudioData: [], cpuAudioData: {} }),
        (this.audio.live.worker = new Worker('https://wany.io/resource/amuject/audio-analyser/worker-liveanalyser.js')),
        this.audio.live.worker.postMessage({
          event: 'init',
          data: { sampleRate: this.sampleRate, bufferSize: this.fftSize, isStream: !0 },
        }),
        (this.audio.live.worker.onmessage = (event) => {
          const data = event.data.data;
          switch (event.data.event) {
            case 'process': {
              this.process(data);
              break;
            }
          }
        });
      var processorSrc = 'https://wany.io/resource/amuject/audio-analyser/worker-liveanalyser-processor.js';
      this.audio.original.context.audioWorklet.addModule(processorSrc).then(() => {
        (this.processor = new AudioWorkletNode(this.audio.original.context, 'processor')),
          (this.processor.port.onmessage = (event) => {
            this.audio.live.worker.postMessage({ event: 'process', data: event.data });
          });
        var audioVolume = this.audio.original.context.createGain();
        (audioVolume.gain.value = 0),
          this.audio.original.source
            .connect(this.processor)
            .connect(audioVolume)
            .connect(this.audio.original.context.destination);
      }),
        this.insertHTML(),
        (this.e = {}),
        (this.e.canvasLogDFT226 = this.element.querySelector('#canvas-logdft226')),
        (this.e.canvasLogDFT226Label = this.element.querySelector('#canvas-logdft226-label')),
        (this.e.canvasRegFFT226 = this.element.querySelector('#canvas-regfft226')),
        (this.e.canvasRegFFT226Label = this.element.querySelector('#canvas-regfft226-label')),
        (this.e.canvasCpuValue1 = this.element.querySelector('#canvas-cpu-value1')),
        (this.e.canvasCpuValue2 = this.element.querySelector('#canvas-cpu-value2')),
        (this.e.canvasCpuMemory1 = this.element.querySelector('#canvas-cpu-memory1')),
        (this.e.canvasCpuMemory2 = this.element.querySelector('#canvas-cpu-memory2')),
        (this.e.canvasCpuEmotion1 = this.element.querySelector('#canvas-cpu-emotion1')),
        (this.e.canvasCpuEmotion2 = this.element.querySelector('#canvas-cpu-emotion2')),
        (this.e.scaleToggleBtn = this.element.querySelector('#btn-toggle-freq-logscalex')),
        (this.live_canvases = []),
        this.live_addCanvas('LogDFT226', this.e.canvasLogDFT226, 'freq-logdft226-line'),
        this.live_addCanvas('LogDFT226Label', this.e.canvasLogDFT226Label, 'freq-logdft226-label', {
          color: 'rgba(155, 0, 255, 0.5)',
        }),
        this.live_addCanvas('cpu1', this.e.canvasCpuValue1, 'cpu-value1'),
        this.live_addCanvas('cpu2', this.e.canvasCpuValue2, 'cpu-value2'),
        this.live_addCanvas('cpu3', this.e.canvasCpuMemory1, 'cpu-memory1'),
        this.live_addCanvas('cpu4', this.e.canvasCpuMemory2, 'cpu-memory2'),
        this.live_addCanvas('cpu5', this.e.canvasCpuEmotion1, 'cpu-emotion1'),
        this.live_addCanvas('cpu6', this.e.canvasCpuEmotion2, 'cpu-emotion2');
      for (var dragbar of this.element.querySelectorAll('.dragbar')) this.addDragbar(dragbar);
      window.addEventListener('resize', (event) => {
        clearTimeout(window.resizedFinished),
          (window.resizedFinished = setTimeout(function () {
            _this.live_resizeCanvas();
          }, 250));
      }),
        this.audio.live.worker.postMessage({
          event: 'setcpuag',
          data: {
            alpha: document.querySelector('#input-cpu-alpha').value,
            emo1gamma: document.querySelector('#input-cpu-emo1gamma').value,
            emo2gamma: document.querySelector('#input-cpu-emo2gamma').value,
          },
        }),
        document.querySelector('#input-cpu-alpha').addEventListener('change', () => {
          this.audio.live.worker.postMessage({
            event: 'setcpuag',
            data: {
              alpha: document.querySelector('#input-cpu-alpha').value,
              emo1gamma: document.querySelector('#input-cpu-emo1gamma').value,
              emo2gamma: document.querySelector('#input-cpu-emo2gamma').value,
            },
          });
        }),
        document.querySelector('#input-cpu-emo1gamma').addEventListener('change', () => {
          this.audio.live.worker.postMessage({
            event: 'setcpuag',
            data: {
              alpha: document.querySelector('#input-cpu-alpha').value,
              emo1gamma: document.querySelector('#input-cpu-emo1gamma').value,
              emo2gamma: document.querySelector('#input-cpu-emo2gamma').value,
            },
          });
        }),
        document.querySelector('#input-cpu-emo2gamma').addEventListener('change', () => {
          this.audio.live.worker.postMessage({
            event: 'setcpuag',
            data: {
              alpha: document.querySelector('#input-cpu-alpha').value,
              emo1gamma: document.querySelector('#input-cpu-emo1gamma').value,
              emo2gamma: document.querySelector('#input-cpu-emo2gamma').value,
            },
          });
        }),
        document.querySelector('#input-cpu-resetemosum').addEventListener('click', () => {
          this.audio.live.worker.postMessage({ event: 'resetemosum', data: {} });
        }),
        this.audio.live.worker.postMessage({ event: 'play', data: {} });
    }
  }
  insertHTML() {
    var html = "<div class='audioanalyser audiostreamanalyser'>";
    (html += "  <div class='main'>"),
      (html += "  <div class='wrapper left right'>"),
      (html += "    <div class='info'>"),
      (html += "      <div class='name'>Live Audio Stream</div>"),
      (html += '    </div>'),
      (html += "    <div class='freq'>"),
      (html += "    <div class='dragbar bottom'></div>"),
      (html += "    <div class='wrapper bottom'>"),
      (html += "      <div class='canvas layer regfft226 none'>"),
      (html += "        <canvas id='canvas-regfft226-label' class='layer'></canvas>"),
      (html += "        <canvas id='canvas-regfft226' class='layer'></canvas>"),
      (html += '      </div>'),
      (html += "      <div class='canvas layer logdft226'>"),
      (html += "        <canvas id='canvas-logdft226-label' class='layer'></canvas>"),
      (html += "        <canvas id='canvas-logdft226' class='layer'></canvas>"),
      (html += '      </div>'),
      (html += "      <div class='label layer none'>"),
      (html += "        <div scale='log' class='btn logscalebtn' id='btn-toggle-freq-logscalex'>Log Scale X</div>"),
      (html += '      </div>'),
      (html += '    </div></div>'),
      (html += "    <div class='cpu'>"),
      (html += "    <div class='dragbar bottom'></div>"),
      (html += "    <div class='wrapper top'>"),
      (html += "      <div class='colset'>"),
      (html += "        <div class='canvas'>"),
      (html += "          <canvas id='canvas-cpu-value1' class='layer'></canvas>"),
      (html += "          <div class='labels layer'>"),
      (html += "            <label class='name'>Value 1</label>"),
      (html += "            <label class='data' id='label-cpu-value1-d'>0</label>"),
      (html += '          </div>'),
      (html += '        </div>'),
      (html += "        <div class='canvas'>"),
      (html += "          <canvas id='canvas-cpu-value2' class='layer'></canvas>"),
      (html += "          <div class='labels layer'>"),
      (html += "            <label class='name'>Value 2</label>"),
      (html += "            <label class='data' id='label-cpu-value2-d'>0</label>"),
      (html += '          </div>'),
      (html += '        </div>'),
      (html += '      </div>'),
      (html += "      <div class='divbar'></div>"),
      (html += "      <div class='colset'>"),
      (html += "        <div class='canvas'>"),
      (html += "          <canvas id='canvas-cpu-memory1' class='layer'></canvas>"),
      (html += "          <div class='labels layer'>"),
      (html += "            <label class='name'>Memory 1</label>"),
      (html += "            <label class='data' id='label-cpu-memory1-d'>0</label>"),
      (html += '          </div>'),
      (html += '        </div>'),
      (html += "        <div class='canvas'>"),
      (html += "          <canvas id='canvas-cpu-memory2' class='layer'></canvas>"),
      (html += "          <div class='labels layer'>"),
      (html += "            <label class='name'>Memory 2</label>"),
      (html += "            <label class='data' id='label-cpu-memory2-d'>0</label>"),
      (html += '          </div>'),
      (html += '        </div>'),
      (html += '      </div>'),
      (html += "      <div class='divbar'></div>"),
      (html += "      <div class='colset'>"),
      (html += "        <div class='canvas'>"),
      (html += "          <canvas id='canvas-cpu-emotion1' class='layer'></canvas>"),
      (html += "          <div class='labels layer'>"),
      (html += "            <label class='name'>Emotion 1</label>"),
      (html += "            <label class='data' id='label-cpu-emotion1-d'>0</label>"),
      (html += "            <label class='ava' id='label-cpu-emotion1-a'>0</label>"),
      (html += '          </div>'),
      (html += '        </div>'),
      (html += "        <div class='canvas'>"),
      (html += "          <canvas id='canvas-cpu-emotion2' class='layer'></canvas>"),
      (html += "          <div class='labels layer'>"),
      (html += "            <label class='name'>Emotion 2</label>"),
      (html += "            <label class='data' id='label-cpu-emotion2-d'>0</label>"),
      (html += "            <label class='ava' id='label-cpu-emotion1-a'>0</label>"),
      (html += '          </div>'),
      (html += '        </div>'),
      (html += '      </div>'),
      (html += '    </div></div>'),
      (html += '  </div></div>'),
      (html += '</div>'),
      (this.element.innerHTML = html);
  }
  resize() {
    this.live_resizeCanvas();
  }
  close() {
    (this.isClosed = !0),
      this.audio.original.source.disconnect(this.processor),
      this.processor.port.close(),
      this.audio.live.worker.terminate(),
      this.audio.original.node.getTracks().forEach(function (track) {
        track.stop();
      }),
      (this.audio = null),
      (this.element.innerHTML = '');
  }
  process(data) {
    (this.audio.live.processData = data), this.live_canvasLoop();
  }
  live_addCanvas(id, element, type, option) {
    var offscreen = element.transferControlToOffscreen();
    option || (option = {}),
      (option.id = id),
      (option.type = type),
      (option.element = offscreen),
      (option.res = 2),
      (option.offsetWidth = element.offsetWidth),
      (option.offsetHeight = element.offsetHeight),
      this.audio.live.worker.postMessage({ event: 'addCanvas', data: option }, [offscreen]),
      this.live_canvases.push({ id: id, element: element, type: type, offscreen: offscreen });
  }
  live_resizeCanvas() {
    for (var canvas of this.live_canvases)
      this.audio.live.worker.postMessage({
        event: 'resizeCanvas',
        data: { id: canvas.id, offsetWidth: canvas.element.offsetWidth, offsetHeight: canvas.element.offsetHeight },
      });
  }
  live_removeCanvas(id) {
    this.audio.live.worker.postMessage({ event: 'removeCanvas', data: { id: id } });
    for (var i = 0; i < this.live_canvases.length; i++)
      if (this.live_canvases[i].id == id) {
        this.live_canvases.splice(i, 1);
        break;
      }
  }
  live_canvasLoop() {
    for (var canvas of this.live_canvases)
      switch (canvas.type) {
        case 'cpu-value1': {
          var parent = canvas.element.parentElement,
            dataElement = parent.querySelector('label.data'),
            data = this.audio.live.processData.cpuAudioData.value1.data;
          (data = (Math.round(1e5 * data) / 1e5).toFixed(5)), dataElement && data && (dataElement.innerHTML = data);
          break;
        }
        case 'cpu-value2': {
          var parent = canvas.element.parentElement,
            dataElement = parent.querySelector('label.data'),
            data = this.audio.live.processData.cpuAudioData.value2.data;
          (data = (Math.round(1e5 * data) / 1e5).toFixed(5)), dataElement && data && (dataElement.innerHTML = data);
          break;
        }
        case 'cpu-memory1': {
          var parent = canvas.element.parentElement,
            dataElement = parent.querySelector('label.data'),
            data = this.audio.live.processData.cpuAudioData.memory1.data;
          (data = (Math.round(1e5 * data) / 1e5).toFixed(5)), dataElement && data && (dataElement.innerHTML = data);
          break;
        }
        case 'cpu-memory2': {
          var parent = canvas.element.parentElement,
            dataElement = parent.querySelector('label.data'),
            data = this.audio.live.processData.cpuAudioData.memory2.data;
          (data = (Math.round(1e5 * data) / 1e5).toFixed(5)), dataElement && data && (dataElement.innerHTML = data);
          break;
        }
        case 'cpu-emotion1': {
          var parent = canvas.element.parentElement,
            dataElement = parent.querySelector('label.data'),
            data = this.audio.live.processData.cpuAudioData.emotion1.data;
          (data = (Math.round(1e5 * data) / 1e5).toFixed(5)), dataElement && data && (dataElement.innerHTML = data);
          var avaElement = parent.querySelector('label.ava'),
            ava =
              this.audio.live.processData.cpuAudioData.emotion1.sum / this.audio.live.processData.cpuAudioData.sumloop;
          (ava = (Math.round(1e5 * ava) / 1e5).toFixed(5)), avaElement && ava && (avaElement.innerHTML = ava);
          break;
        }
        case 'cpu-emotion2': {
          var parent = canvas.element.parentElement,
            dataElement = parent.querySelector('label.data'),
            data = this.audio.live.processData.cpuAudioData.emotion2.data;
          (data = (Math.round(1e5 * data) / 1e5).toFixed(5)), dataElement && data && (dataElement.innerHTML = data);
          var avaElement = parent.querySelector('label.ava'),
            ava =
              this.audio.live.processData.cpuAudioData.emotion2.sum / this.audio.live.processData.cpuAudioData.sumloop;
          (ava = (Math.round(1e5 * ava) / 1e5).toFixed(5)), avaElement && ava && (avaElement.innerHTML = ava);
          break;
        }
      }
  }
  addDragbar(element) {
    var _this = this,
      type = element.classList[1];
    switch (
      (element.addEventListener('mousedown', function (event) {
        element.classList.add('dragging'), event.preventDefault();
      }),
      element.addEventListener('mouseup', function (event) {
        element.classList.remove('dragging'), _this.live_resizeCanvas();
      }),
      type)
    ) {
      case 'left': {
        document.addEventListener('mousemove', function (event) {
          if (element.classList.contains('dragging')) {
            var x = event.clientX + window.pageXOffset,
              parent = element.parentElement,
              rect = parent.getBoundingClientRect(),
              parentWidth = rect.right - rect.left,
              mouseadd = rect.left - x,
              pparent = parent.parentElement,
              prect = pparent.getBoundingClientRect(),
              pparentWidth = prect.right - prect.left,
              w = 100 * ((parentWidth + mouseadd) / pparentWidth);
            return (w = Math.min(100, w)), void (parent.style.width = w + '%');
          }
        });
        break;
      }
      case 'right': {
        document.addEventListener('mousemove', function (event) {
          if (element.classList.contains('dragging')) {
            var x = event.clientX + window.pageXOffset,
              parent = element.parentElement,
              rect = parent.getBoundingClientRect(),
              parentWidth = rect.right - rect.left,
              mouseadd = x - rect.right,
              pparent = parent.parentElement,
              prect = pparent.getBoundingClientRect(),
              pparentWidth = prect.right - prect.left,
              w = 100 * ((parentWidth + mouseadd) / pparentWidth);
            return (w = Math.min(100, w)), void (parent.style.width = w + '%');
          }
        });
        break;
      }
      case 'bottom': {
        document.addEventListener('mousemove', function (event) {
          if (element.classList.contains('dragging')) {
            var y = event.clientY + window.pageYOffset,
              parent = element.parentElement,
              rect = parent.getBoundingClientRect(),
              parentHeight = rect.bottom - rect.top,
              mouseadd = y - rect.bottom - window.scrollY,
              pparent = parent.parentElement,
              prect = pparent.getBoundingClientRect(),
              pparentHeight = prect.bottom - prect.top,
              h = 100 * ((parentHeight + mouseadd) / pparentHeight);
            return (h = Math.min(100, h)), void (parent.style.height = h + '%');
          }
        });
        break;
      }
      case 'top': {
        document.addEventListener('mousemove', function (event) {
          if (element.classList.contains('dragging')) {
            var y = event.clientY + window.pageYOffset,
              parent = element.parentElement,
              rect = parent.getBoundingClientRect(),
              parentHeight = rect.bottom - rect.top,
              mouseadd = rect.top - y - window.scrollY,
              pparent = parent.parentElement,
              prect = pparent.getBoundingClientRect(),
              pparentHeight = prect.bottom - prect.top,
              h = 100 * ((parentHeight + mouseadd) / pparentHeight);
            return (h = Math.min(100, h)), void (parent.style.height = h + '%');
          }
        });
        break;
      }
    }
  }
}
class AnalyserApp {
  constructor() {
    (this.analyserElement = document.querySelector('#analyser .main')),
      (this.audioAnalyser = null),
      (this.audioData = {}),
      (this.opened = null);
    var _this = this;
    (this.fileOpenInput = document.createElement('input')),
      (this.fileOpenInput.type = 'file'),
      (this.fileOpenInput.accept = 'audio/mp3, audio/wav, audio/ogg, audio/flac, audio/aac, video/mp4'),
      (this.fileOpenInput.multiple = !0),
      this.fileOpenInput.addEventListener('change', (event) => {
        if (this.fileOpenInput.files && 0 != this.fileOpenInput.files.length) {
          var files = this.fileOpenInput.files,
            blob = window.URL || window.webkitURL,
            first = !0;
          for (var file of files)
            (file.src = blob.createObjectURL(file)),
              first ? (_this.open(file.src, file), (first = !1)) : _this.open(file.src, file, !0);
        }
      }),
      (this.fileOpenBtn = document.querySelector('#file-open')),
      this.fileOpenBtn.addEventListener('click', () => {
        this.fileOpenInput.click();
      }),
      document.addEventListener(
        'dragenter',
        function (event) {
          event.preventDefault(), event.stopPropagation();
        },
        !1
      ),
      document.addEventListener(
        'dragleave',
        function (event) {
          event.preventDefault(), event.stopPropagation();
        },
        !1
      ),
      document.addEventListener(
        'dragover',
        function (event) {
          event.preventDefault(), event.stopPropagation();
        },
        !1
      ),
      document.addEventListener(
        'drop',
        function (event) {
          event.preventDefault(), event.stopPropagation();
          var blob = window.URL || window.webkitURL,
            dt = event.dataTransfer,
            files = dt.files,
            blob = window.URL || window.webkitURL,
            first = !0;
          for (var file of files)
            (file.src = blob.createObjectURL(file)),
              first
                ? (null == _this.opened ? _this.open(file.src, file) : _this.open(file.src, file, !0), (first = !1))
                : _this.open(file.src, file, !0);
        },
        !1
      );
    var id = 'LIVEAUDIO000',
      element = document.createElement('div');
    element.setAttribute('audio-id', id), element.classList.add('audio');
    var html = "<div class='name'>Live Audio</div>";
    element.innerHTML = html;
    var data = { id: id, file: { name: 'Live Audio' }, audio: null, element: element };
    this.audioData[id] = data;
    var _this = this;
    element.addEventListener('dblclick', (event) => {
      for (var target = event.target; !target.classList.contains('audio'); ) target = target.parentElement;
      var i = target.getAttribute('audio-id');
      _this.openAnalyser(i);
    }),
      element.addEventListener('click', (event) => {
        for (var target = event.target; !target.classList.contains('audio'); ) target = target.parentElement;
        var i = target.getAttribute('audio-id');
        _this.select(i);
      }),
      document.querySelector('#files .list').appendChild(element);
  }
  openAnalyser(id) {
    this.audioAnalyser && (this.audioAnalyser.close(), (this.audioAnalyser = null)), (this.opened = id);
    var audioData = this.audioData[id];
    if (audioData) {
      for (var e of document.querySelectorAll('#files .list .audio')) e.classList.remove('opened');
      audioData.element.classList.add('opened');
      var options = { fftSize: document.querySelector('#input-fftSize').value };
      if ('LIVEAUDIO000' == id)
        return void navigator.mediaDevices.getUserMedia({ audio: !0 }).then((stream) => {
          var mediaRecorder = new MediaRecorder(stream);
          this.audioAnalyser = new AudioStreamAnalyser(this.analyserElement, stream, options);
        });
      var audio = audioData.audio.cloneNode();
      audio.oncanplay = () => {
        this.audioAnalyser || (this.audioAnalyser = new AudioFileAnalyser(audio, this.analyserElement, options));
      };
    }
  }
  open(src, file, onlyload) {
    var acceptedType = [
      'audio/mpeg',
      'video/mpeg',
      'audio/x-flac',
      'audio/ogg',
      'audio/aac',
      'audio/webm',
      'video/webm',
      'audio/wav',
    ];
    if (acceptedType.includes(file.type)) {
      var id = (1 * (Math.max(13200, Math.round(1e5 * Math.random())) + '' + new Date().getTime()))
          .toString(36)
          .toUpperCase(),
        element = document.createElement('div');
      element.setAttribute('audio-id', id), element.classList.add('audio');
      var html = "<div class='name'>" + file.name + '</div>';
      (html +=
        "<div class='close btn'><svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 108.48 108.49'><polygon points='108.48 8.48 100 0 54.24 45.76 8.48 0 0 8.48 45.76 54.24 0 100 8.48 108.48 54.24 62.73 100 108.48 108.48 100 62.73 54.24 108.48 8.48'/></svg></div>"),
        (element.innerHTML = html);
      var audio = document.createElement('audio');
      audio.src = src;
      var data = { id: id, file: file, audio: audio, element: element };
      this.audioData[id] = data;
      var _this = this;
      element.addEventListener('dblclick', (event) => {
        for (var target = event.target; !target.classList.contains('audio'); ) target = target.parentElement;
        var i = target.getAttribute('audio-id');
        _this.openAnalyser(i);
      }),
        element.addEventListener('click', (event) => {
          for (var target = event.target; !target.classList.contains('audio'); ) target = target.parentElement;
          var i = target.getAttribute('audio-id');
          _this.select(i);
        }),
        element.querySelector('.close').addEventListener('click', () => {
          for (var target = event.target; !target.classList.contains('audio'); ) target = target.parentElement;
          var i = target.getAttribute('audio-id');
          _this.close(i);
        }),
        document.querySelector('#files .list').appendChild(element),
        onlyload ||
          (audio.oncanplay = () => {
            (this.opened = id), this.openAnalyser(id), this.select(id);
          });
    }
  }
  select(id) {
    var audioData = this.audioData[id];
    if (audioData) {
      for (var e of document.querySelectorAll('#files .list .audio')) e.classList.remove('selected');
      if ((audioData.element.classList.add('selected'), 'LIVEAUDIO000' == id))
        return (
          (document.querySelector('#files .info .name').innerHTML = audioData.file.name),
          (document.querySelector('#files .info .time').innerHTML = '0:00.000'),
          void (document.querySelector('#files .info .id').innerHTML = audioData.id)
        );
      var mm = Math.floor(audioData.audio.duration / 60),
        ss = Math.floor(audioData.audio.duration - 60 * mm),
        cc = Math.floor(1e3 * (audioData.audio.duration - ss)) % 1e3;
      (ss = (10 > ss ? '0' : '') + ss),
        (cc = ([, , ,].join('0') + cc).substr(-3)),
        (document.querySelector('#files .info .name').innerHTML = audioData.file.name),
        (document.querySelector('#files .info .time').innerHTML = mm + ':' + ss + '.' + cc),
        (document.querySelector('#files .info .id').innerHTML = audioData.id);
    }
  }
  load(file) {
    console.log(file.toString());
  }
  close(id) {
    this.opened == id &&
      (this.audioAnalyser && (this.audioAnalyser.close(), (this.audioAnalyser = null)),
      (document.querySelector('#files .info .name').innerHTML = '&nbsp;'),
      (document.querySelector('#files .info .time').innerHTML = '0:00.000'),
      (document.querySelector('#files .info .id').innerHTML = '&nbsp;'),
      (this.opened = null)),
      delete this.audioData[id];
    for (var e of document.querySelectorAll('#files .list .audio'))
      e.getAttribute('audio-id') == id && document.querySelector('#files .list').removeChild(e);
  }
}
var analyserApp = new AnalyserApp();
function init() {
  var filedragbar = document.querySelector('#files .dragbar');
  filedragbar.addEventListener('mousedown', function (event) {
    filedragbar.classList.add('dragging'), event.preventDefault();
  }),
    filedragbar.addEventListener('mouseup', function (event) {
      filedragbar.classList.remove('dragging'),
        analyserApp && analyserApp.audioAnalyser && analyserApp.audioAnalyser.resize();
    }),
    document.addEventListener('mousemove', function (event) {
      if (filedragbar.classList.contains('dragging')) {
        var x = event.clientX + window.pageXOffset,
          parent = filedragbar.parentElement,
          rect = parent.getBoundingClientRect(),
          parentWidth = rect.right - rect.left,
          mouseadd = x - rect.right,
          pparent = parent.parentElement,
          prect = pparent.getBoundingClientRect(),
          pparentWidth = prect.right - prect.left,
          w = 100 * ((parentWidth + mouseadd) / pparentWidth);
        return (w = Math.min(100, w)), void (parent.style.width = w + '%');
      }
    });
}
init();
var ttt = !1;
document.addEventListener('click', () => {
  ttt || (ttt = !0);
});
