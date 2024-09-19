class WorkletProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
  }
  process(input, output, parameters) {
    this.port.postMessage(input);
    for (let pi = 0; pi < input.length; pi++) {
      for (let ci = 0; ci < input[pi].length; ci++) {
        for (let si = 0; si < input[pi][ci].length; si++) {
          output[0][ci][si] = input[0][ci][si];
        }
      }
    }
    return true;
  }
}
registerProcessor('processor', WorkletProcessor);
