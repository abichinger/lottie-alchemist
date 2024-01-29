import { DIALOG_DATA, Dialog, DialogRef } from '@angular/cdk/dialog';
import { NgClass } from '@angular/common';
import { Component, ElementRef, Inject, ViewChild } from '@angular/core';
import { MatButton, MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { RouterOutlet } from '@angular/router';
import { ExportForm } from '../components/export.component';
import { LottiePlayer } from '../components/lottie-player.component';
import { readAsText } from '../util';

class ExportDialogData {
  constructor(public player: LottiePlayer) { }
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, MatButton, LottiePlayer, MatIconModule, MatButtonModule, MatToolbarModule, NgClass],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'lottie-alchemist';
  animationData?: string;

  @ViewChild('fileInput') fileInput?: ElementRef<HTMLInputElement>;
  @ViewChild('player') player?: LottiePlayer;

  constructor(public dialog: Dialog) { }

  get animationLoaded() { return !!this.animationData }

  async loadAnimationData() {
    let input = this.fileInput?.nativeElement;
    if (!input) {
      return;
    }

    this.animationData = await readAsText(input);
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
}
@Component({
  selector: 'export-dialog',
  template: `
  <mat-card>
    <mat-card-header><h2>Export As</h2></mat-card-header>
    <mat-card-content><export-form [player]="data.player" /></mat-card-content>
  </mat-card>
  `,
  standalone: true,
  imports: [ExportForm, MatCardModule],
})
export class ExportDialog {
  constructor(
    public dialogRef: DialogRef<string>,
    @Inject(DIALOG_DATA) public data: ExportDialogData,
  ) { }
}
