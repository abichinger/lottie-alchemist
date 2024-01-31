import { GIFEncoder, applyPalette, quantize } from 'gifenc';
import { AnimationItem } from "lottie-web";
import { VideoExport } from "./components/export.component";

export function readAsText(file: File): Promise<string> {
  return new Promise<string>((resolve, reject) => {
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

export function canvasToBlob(canvas: HTMLCanvasElement, type?: string, quality?: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        return reject('failed to create image')
      }
      resolve(blob);
    }, type, quality)
  })
}

// https://github.com/mattdesl/gifenc/blob/64842fca317b112a8590f8fef2bf3825da8f6fe3/test/encode_web.html#L42
export async function encodeGif(canvas: HTMLCanvasElement, animation: AnimationItem, fps?: number, transparent?: boolean): Promise<Blob> {
  const context = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;

  transparent = transparent ?? false;
  fps = fps ?? 30;
  const delay = (1 / fps) * 1000;

  const format = transparent ? "rgba4444" : "rgb444";

  const gif = GIFEncoder();

  for (let i = 0; i < animation.totalFrames; i++) {
    animation.goToAndStop(i, true);

    const data = context!.getImageData(0, 0, width, height).data;
    const palette = quantize(data, 256, { format });
    const bitmap = applyPalette(data, palette, format);

    // https://github.com/mattdesl/looom-tools/blob/a9f455eeab3e43af6775e903cfafe6e9568dea4d/site/components/gifworker.js#L60
    let transparentIndex = 0;
    if (transparent) {
      transparentIndex = palette.findIndex((p) => p[3] === 0);
    }

    gif.writeFrame(bitmap, width, height, { palette, delay, transparent, transparentIndex });

    await new Promise(resolve => setTimeout(resolve, 0));
  }

  gif.finish();
  return new Blob([gif.bytesView()], { type: 'image/gif' })
}
