import { NgIf } from "@angular/common";
import { Component, Input } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSliderModule } from '@angular/material/slider';
import { canvasToBlob, download, encodeGif, record } from "../util";
import { LottiePlayer } from "./lottie-player.component";

export class Format {
  text: string;
  value: string;
  ext: string;

  constructor(text: string, value: string, ext: string) {
    this.text = text;
    this.value = value;
    this.ext = ext;
  }
}

interface ExportOptions {
  format: Format,
  width?: number,
  height?: number,
}

export interface VideoExport extends ExportOptions {
  fps: number,
  codecs: string,
  duration: number,
}

export interface ImageExport extends ExportOptions {
  // https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/toBlob#quality
  quality?: number
}

export interface GifExport extends ExportOptions {
  fps: number,
}

const videoExports: VideoExport[] = [
  {
    format: new Format('webm (VP9)', 'video/webm', 'webm'),
    duration: 1,
    fps: 25,
    codecs: 'vp9'
  },
  {
    format: new Format('mkv (H.264)', 'video/x-matroska', 'mkv'),
    duration: 1,
    fps: 25,
    codecs: 'h264'
  },
  // {
  //   format: new Format('mkv (AV1)', 'video/x-matroska', 'mkv'),
  //   duration: 1,
  //   fps: 25,
  //   codecs: 'av1'
  // },
]

const imageExports: ImageExport[] = [
  {
    format: new Format('png', 'image/png', 'png'),
  },
  {
    format: new Format('jpeg', 'image/jpeg', 'jpeg'),
    quality: 0.95
  },
]

const gifExport: GifExport = {
  format: new Format('gif', 'image/gif', 'gif'),
  fps: 30,
}

const exports: ExportOptions[] = [
  ...videoExports,
  gifExport,
  ...imageExports,
];

@Component({
  selector: 'export-form',
  standalone: true,
  imports: [MatInputModule, MatSelectModule, MatFormFieldModule, MatButtonModule, FormsModule, NgIf, MatSliderModule, MatProgressSpinnerModule],
  templateUrl: './export.component.html',
})
export class ExportForm {

  @Input({ required: true }) player!: LottiePlayer;

  exports: ExportOptions[];
  selectedExport: ExportOptions;

  private _exporting: boolean = false;
  get exporting() { return this._exporting }

  constructor() {
    this.exports = JSON.parse(JSON.stringify(exports))
    this.selectedExport = this.exports[0];
  }

  get canvas() {
    return this.player.container?.nativeElement.getElementsByTagName('canvas')[0];
  }
  get animationWidth() {
    return this.player.animationWidth
  }
  get animationHeight() {
    return this.player.animationHeight
  }

  selectFormat(text: string) {
    this.selectedExport = this.exports.find((e) => e.format.text == text) ?? this.selectedExport;
  }

  async submit() {
    this._exporting = true;
    try {
      if (this.isVideoExport(this.selectedExport)) {
        await this.exportVideo(this.selectedExport)
      } else if (this.isImageExport(this.selectedExport)) {
        await this.exportImage(this.selectedExport)
      } else if (this.isGifExport(this.selectedExport)) {
        await this.exportGif(this.selectedExport)
      }
    } catch (err) {
      console.error(err)
    }
    this._exporting = false;
  }

  isVideoExport(e: VideoExport | ImageExport | GifExport): e is VideoExport {
    return (e as any).codecs !== undefined;
  }

  isImageExport(e: VideoExport | ImageExport | GifExport): e is ImageExport {
    return (e as any).fps === undefined;
  }

  isGifExport(e: VideoExport | ImageExport | GifExport): e is GifExport {
    return (e as any).fps !== undefined && (e as any).codecs === undefined;
  }

  async exportVideo(options: VideoExport) {
    if (!this.canvas) {
      return;
    }

    options.duration = this.player.duration;

    this.player.resize(options.width, options.height);
    this.player.goToAndPlay(0)

    const blob = await record(this.canvas, options)
    download(`video.${options.format.ext}`, blob);
  }

  async exportImage(options: ImageExport) {
    if (!this.canvas) {
      return;
    }
    this.player.resize(options.width, options.height);
    const blob = await canvasToBlob(this.canvas, options.format.value, options.quality)
    download(`image.${options.format.ext}`, blob);
  }

  async exportGif(options: GifExport) {
    if (!this.canvas || !this.player.animation) {
      return;
    }
    this.player.resize(options.width, options.height);
    const blob = await encodeGif(this.canvas, this.player.animation, options.fps)
    download(`image.${options.format.ext}`, blob);
  }

  get quality() {
    return (this.selectedExport as ImageExport).quality
  }

  get qualityPercentage() {
    const quality = this.quality ?? 0;
    return (quality * 100).toFixed(0)
  }

  onQuality(event: Event) {
    let value = parseFloat((event.target as HTMLInputElement).value);
    (this.selectedExport as ImageExport).quality = value;
  }
}
