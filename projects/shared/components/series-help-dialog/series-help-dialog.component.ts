import { Component, ViewEncapsulation } from '@angular/core';
import { MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'lib-series-help-dialog',
  templateUrl: './series-help-dialog.component.html',
  styleUrls: ['./series-help-dialog.component.scss'],
  encapsulation: ViewEncapsulation.None,
  imports: [MatDialogModule, MatButtonModule]
})
export class SeriesHelpDialogComponent {}