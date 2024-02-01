import { NgIf } from "@angular/common";
import { AfterViewInit, Component, ElementRef, EventEmitter, Input, Output, ViewChild } from "@angular/core";
import { MatMiniFabButton } from "@angular/material/button";
import { MatIconModule } from '@angular/material/icon';
import { MatSliderModule } from '@angular/material/slider';
import Lottie, { AnimationItem } from "lottie-web";
import { ColorPickerModule } from 'ngx-color-picker';

export interface AnimationData {
  v: string,
  fr: number,
  w: number,
  h: number,
}

@Component({
  selector: 'lottie-player',
  templateUrl: './lottie-player.component.html',
  standalone: true,
  imports: [MatMiniFabButton, MatIconModule, NgIf, MatSliderModule, ColorPickerModule]
})
export class LottiePlayer implements AfterViewInit {
  @Input() autoplay = true;
  @Input() animationData!: AnimationData;

  backgroundColor: string = 'rgba(255,255,255,0)';

  _speeds = [1, 1.5, 2, 2.5, 0.5];
  _speedIndex = 0;
  get speed() { return this._speeds[this._speedIndex] }

  @Output() animationCreated = new EventEmitter<AnimationItem>();

  @ViewChild('container') container?: ElementRef<HTMLDivElement>;

  private _animation?: AnimationItem;
  get animation() { return this._animation }

  get duration() { return (this._animation?.getDuration() ?? 1) / (this._animation?.playSpeed ?? 1) }
  get totalFrames() { return this._animation?.totalFrames ?? 100 }
  get currentFrame() { return Math.ceil(this._animation?.currentFrame ?? 0) }
  get currentFrameStr() {
    const targetLength = this.totalFrames.toString().length;
    return this.currentFrame.toString().padStart(targetLength, ' ')
  }
  get animationWidth() { return this.animationData.w ?? 1280 }
  get animationHeight() { return this.animationData.h ?? 720 }

  get canvas() {
    return this.container?.nativeElement.getElementsByTagName('canvas')[0];
  }

  ngAfterViewInit(): void {
    this.loadAnimation()
  }

  loadAnimation() {
    this._animation?.destroy()

    this._animation = Lottie.loadAnimation({
      container: this.container!.nativeElement,
      renderer: 'canvas',
      loop: true,
      autoplay: true,
      animationData: this.animationData,
      rendererSettings: {
        preserveAspectRatio: 'xMidYMid meet',
        clearCanvas: false,
      },
      // path: 'https://000035970.codepen.website/data.json'
    });
    this.resize();

    this._animation.addEventListener('enterFrame', (event) => {
      const canvas = this.canvas;
      if (!canvas) {
        return;
      }

      const context = canvas.getContext('2d');
      if (!context) {
        return;
      }

      context.clearRect(0, 0, canvas.width, canvas.height);
      context.fillStyle = this.backgroundColor;
      context.fillRect(0, 0, canvas.width, canvas.height);
    })
  }

  isPaused() {
    return this._animation?.isPaused;
  }

  togglePause() {
    this._animation?.togglePause()
  }

  toggleSpeed() {
    this._speedIndex = (this._speedIndex + 1) % this._speeds.length;
    this._animation?.setSpeed(this._speeds[this._speedIndex])
  }

  onSliderValue(event: Event) {
    let value = parseInt((event.target as HTMLInputElement).value)

    if (!this._animation) {
      return
    }

    if (this.isPaused()) {
      this._animation.goToAndStop(value, true)
    } else {
      this._animation.goToAndPlay(value, true)
    }

  }

  resize(width?: number, height?: number) {
    const resizeWidth = width ?? this.animationWidth;
    const resizeHeight = height ?? this.animationHeight;

    (this._animation as any).resize(resizeWidth, resizeHeight)
  }

  goToAndPlay(frame: number) {
    this._animation?.goToAndPlay(frame, true);
  }

}
