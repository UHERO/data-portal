import { Component, ViewEncapsulation } from '@angular/core';
import { MatTabsModule } from '@angular/material/tabs';
import { MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'lib-analyzer-help-dialog',
  templateUrl: './analyzer-help-dialog.component.html',
  styleUrls: ['./analyzer-help-dialog.component.scss'],
  encapsulation: ViewEncapsulation.None,
  imports: [MatTabsModule, MatDialogModule, MatButtonModule]
})
export class AnalyzerHelpDialogComponent {}