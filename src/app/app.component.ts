import { Component, ElementRef, ViewChild } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AppModule } from './app.module';
import { MatButton } from '@angular/material/button';
import Lottie, { AnimationItem } from 'lottie-web';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, MatButton],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'lottie-alchemist';
  animation?: AnimationItem;
  sizeIndex = 0;

  @ViewChild('fileInput') fileInput?: ElementRef<HTMLInputElement>;
  @ViewChild('player') player?: ElementRef<HTMLDivElement>;

  constructor() {}

  resize() {
    // https://github.com/airbnb/lottie-web/pull/2792

    let sizes = [
      { width: 150, height: 150 },
      { width: 500, height: 500 },
      { width: 1000, height: 1000 },
    ];

    let size = sizes[this.sizeIndex];
    this.sizeIndex = (this.sizeIndex+1) % sizes.length;

    // type declaration is wrong
    (this.animation as any).resize(size.width, size.height)
  }

  previewLottie() {
    let files = this.fileInput?.nativeElement.files;
    if(!files || files.length == 0) {
      return;
    }


    let file = files[0];
    if (!file) {
      return;
    }

    var reader = new FileReader();
    reader.onload = (e) => {
      let json = e.target?.result;
      if (!json || typeof json != 'string') {
        return;
      }

      Lottie.destroy();
      this.animation = Lottie.loadAnimation({
        container: this.player!.nativeElement,
        renderer: 'canvas',
        loop: true,
        autoplay: true,
        animationData: JSON.parse(json),
        rendererSettings: {
          preserveAspectRatio: 'xMidYMid meet',
        }
        // path: 'https://000035970.codepen.website/data.json'
      })
    }
    reader.readAsText(file);


  }
}
