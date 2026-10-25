/* Runs on the audio thread: hands the microphone's samples to the page in blocks of 1024, each with the frame
   number of its first sample (frame / sampleRate is the audio-clock time). Loaded by listen-io.js. */
class Capture extends AudioWorkletProcessor {
  constructor() {
    super();
    this.buf = new Float32Array(1024);
    this.n = 0;
    this.frame = 0;
  }
  process(inputs) {
    const ch = inputs[0] && inputs[0][0];
    if (!ch) return true;
    for (let i = 0; i < ch.length; i++) {
      if (this.n === 0) this.frame = currentFrame + i;
      this.buf[this.n++] = ch[i];
      if (this.n === this.buf.length) {
        this.port.postMessage({ frame: this.frame, data: this.buf }, [this.buf.buffer]);
        this.buf = new Float32Array(1024);
        this.n = 0;
      }
    }
    return true;
  }
}
registerProcessor("fg-capture", Capture);
