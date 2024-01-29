import { NgIf } from "@angular/common";
import { Component, Input } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSliderModule } from '@angular/material/slider';
import { canvasToBlob, download, record } from "../util";
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
  width: number,
  height: number,
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

const videoExports: VideoExport[] = [
  {
    format: new Format('webm', 'video/webm', 'webm'),
    width: 500,
    height: 500,
    duration: 1,
    fps: 25,
    codecs: 'vp9'
  },
  {
    format: new Format('mp4 (H.264)', 'video/mp4', 'mp4'),
    width: 600,
    height: 600,
    duration: 1,
    fps: 25,
    codecs: 'avc1.4d002a'
  },
]

const imageExports: ImageExport[] = [
  {
    format: new Format('png', 'image/png', 'png'),
    width: 200,
    height: 200,
  },
  {
    format: new Format('jpeg', 'image/jpeg', 'jpeg'),
    width: 200,
    height: 200,
    quality: 0.95
  },
]

@Component({
  selector: 'export-form',
  standalone: true,
  imports: [MatInputModule, MatSelectModule, MatFormFieldModule, MatButtonModule, FormsModule, NgIf, MatSliderModule],
  templateUrl: './export.component.html',
})
export class ExportForm {

  @Input({ required: true }) player!: LottiePlayer;

  exports: ExportOptions[] = [
    ...videoExports,
    ...imageExports
  ];
  selectedExport: ExportOptions;

  constructor() {
    this.selectedExport = this.exports[0];
  }

  get canvas() {
    return this.player?.container?.nativeElement.getElementsByTagName('canvas')[0];
  }

  selectFormat(value: string) {
    this.selectedExport = this.exports.find((e) => e.format.value == value) ?? this.selectedExport;
  }

  submit() {
    if (this.isVideoExport(this.selectedExport)) {
      this.exportVideo(this.selectedExport)
    } else {
      this.exportImage(this.selectedExport)
    }
  }

  isVideoExport(e: VideoExport | ImageExport): e is VideoExport {
    return (e as VideoExport).fps !== undefined;
  }

  isImageExport(e: VideoExport | ImageExport): e is ImageExport {
    return (e as VideoExport).fps == undefined;
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

  onQuality(event: Event) {
    let value = parseFloat((event.target as HTMLInputElement).value);
    console.log(value);
    (this.selectedExport as ImageExport).quality = value;
  }
}
