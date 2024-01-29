import { VideoExport } from "./components/export.component";

export function readAsText(input: HTMLInputElement): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    let files = input.files;
    if (!files || files.length == 0) {
      return reject('no files found');
    }
    let file = files[0];

    var reader = new FileReader();
    reader.onload = (e) => {
      let text = e.target?.result;
      if (!text || typeof text != 'string') {
        reject('file is empty')
      }

      resolve(text as string);
    }
    reader.readAsText(file);
  });
}

// https://developer.mozilla.org/en-US/docs/Web/API/MediaStream_Recording_API
export function record(canvas: HTMLCanvasElement, options: VideoExport): Promise<Blob> {
  return new Promise<Blob>((resolve, reject) => {
    const stream = canvas.captureStream(options.fps)
    const recordedChunks: BlobPart[] = [];

    const recorderOptions = { mimeType: `${options.format.value}; codecs="${options.codecs}"` };
    const recorder = new MediaRecorder(stream, recorderOptions);

    function handleDataAvailable(event: BlobEvent) {
      console.log("data-available");
      if (event.data.size > 0) {
        recordedChunks.push(event.data);
        const blob = new Blob(recordedChunks, { type: options.format.value });
        resolve(blob)
      } else {
        reject('recording is empty')
      }
    }

    recorder.ondataavailable = handleDataAvailable;
    recorder.start();

    setTimeout(() => {
      recorder.stop()
    }, options.duration * 1000)
  });
}


export function download(filename: string, blob: Blob) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  document.body.appendChild(a);
  a.style.display = 'none';
  a.href = url;
  a.download = filename;
  a.click();
  window.URL.revokeObjectURL(url);
}
