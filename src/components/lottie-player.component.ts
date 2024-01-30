import { NgIf } from "@angular/common";
import { Component, ElementRef, EventEmitter, Input, OnInit, Output, ViewChild } from "@angular/core";
import { MatFabButton } from "@angular/material/button";
import { MatIconModule } from '@angular/material/icon';
import { MatSliderModule } from '@angular/material/slider';
import Lottie, { AnimationItem } from "lottie-web";

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
  imports: [MatFabButton, MatIconModule, NgIf, MatSliderModule]
})
export class LottiePlayer implements OnInit {
  @Input() autoplay = true;

  _speeds = [1, 1.5, 2, 2.5, 0.5];
  _speedIndex = 0;
  get speed() { return this._speeds[this._speedIndex] }

  private _animationData?: AnimationData
  get animationData() { return this._animationData };
  @Input() set animationData(value: AnimationData | undefined) {
    this._animationData = value;
    this.loadAnimation()
  }

  @Output() animationCreated = new EventEmitter<AnimationItem>();

  @ViewChild('container') container?: ElementRef<HTMLDivElement>;

  private _animation?: AnimationItem;
  get animation() { return this._animation }

  get duration() { return (this._animation?.getDuration() ?? 1) / (this._animation?.playSpeed ?? 1) }
  get totalFrames() { return this._animation?.totalFrames ?? 100 }
  get currentFrame() { return this._animation?.currentFrame ?? 0 }
  get animationWidth() { return this.animationData?.w ?? 1280 }
  get animationHeight() { return this.animationData?.h ?? 720 }

  ngOnInit(): void {
    this.loadAnimation()
  }

  loadAnimation() {
    this._animation?.destroy()

    if (!this.animationData) {
      return;
    }

    this._animation = Lottie.loadAnimation({
      container: this.container!.nativeElement,
      renderer: 'canvas',
      loop: true,
      autoplay: true,
      animationData: this._animationData,
      rendererSettings: {
        preserveAspectRatio: 'xMidYMid meet',
      },
      // path: 'https://000035970.codepen.website/data.json'
    });
    this.resize();
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
