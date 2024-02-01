import { DIALOG_DATA, Dialog, DialogRef } from '@angular/cdk/dialog';
import { NgClass, NgIf } from '@angular/common';
import { Component, ElementRef, Inject, ViewChild } from '@angular/core';
import { MatButton, MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { MatToolbarModule } from '@angular/material/toolbar';
import { RouterOutlet } from '@angular/router';
import { ExportForm } from '../components/export.component';
import { AnimationData, LottiePlayer } from '../components/lottie-player.component';
import { readAsText } from '../util';

class ExportDialogData {
  constructor(public player: LottiePlayer) { }
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, MatButton, LottiePlayer, MatIconModule, MatButtonModule, MatToolbarModule, NgClass, MatCardModule, NgIf],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'Lottie Alchemist';
  animationData?: AnimationData;

  @ViewChild('fileInput') fileInput?: ElementRef<HTMLInputElement>;
  @ViewChild('player') player?: LottiePlayer;

  constructor(public dialog: Dialog) { }

  get animationLoaded() { return !!this.animationData }

  onInput() {
    let input = this.fileInput?.nativeElement;
    if (!input) {
      return;
    }

    this.loadAnimationData(input.files ?? undefined);
  }

  async loadAnimationData(files?: FileList) {
    if (!files || files.length == 0) {
      return;
    }
    let file = files[0];

    const text = await readAsText(file);
    this.animationData = JSON.parse(text)
  }

  openExportDialog() {
    const dialogRef = this.dialog.open<string>(ExportDialog, {
      width: '800px',
      data: new ExportDialogData(this.player!),
    });

    dialogRef.closed.subscribe(result => {
      console.log('The dialog was closed');
    });
  }

  reset() {
    this.animationData = undefined;
    const input = this.fileInput?.nativeElement;
    if (input) {
      input.value = '';
    }
  }

  // https://developer.mozilla.org/en-US/docs/Web/API/HTML_Drag_and_Drop_API/File_drag_and_drop
  onDrop(event: DragEvent) {
    console.log('drop')
    event.preventDefault();

    this.loadAnimationData(event.dataTransfer?.files)
  }

  onDragOver(event: DragEvent) {
    event.stopPropagation();
    event.preventDefault();
  }
}
@Component({
  selector: 'export-dialog',
  template: `
  <mat-card>
    <mat-card-content>
      <h2 class="mb-5">Export as</h2>
      <export-form #exporter [player]="data.player" />

      <span class="flex">
        <div class="flex-auto"></div>
        <button mat-raised-button (click)="close()" class="mr-3">Close</button>
        <button *ngIf="!exporter.exporting" mat-raised-button color="primary" (click)="exporter.submit()">Export</button>
        <mat-spinner *ngIf="exporter.exporting" diameter="30" class="mx-5"></mat-spinner>
      </span>
    </mat-card-content>
  </mat-card>
  `,
  standalone: true,
  imports: [ExportForm, MatCardModule, NgIf, MatProgressSpinner, MatButtonModule],
})
export class ExportDialog {
  @ViewChild('exporter') player!: ExportForm;

  constructor(
    public dialogRef: DialogRef<string>,
    @Inject(DIALOG_DATA) public data: ExportDialogData,
  ) { }

  close() {
    this.dialogRef.close();
  }
}
