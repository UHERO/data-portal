import { Component, ViewEncapsulation } from '@angular/core';
import { MatTabsModule } from '@angular/material/tabs';
import { MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'lib-category-help-dialog',
  templateUrl: './category-help-dialog.component.html',
  styleUrls: ['./category-help-dialog.component.scss'],
  encapsulation: ViewEncapsulation.None,
  imports: [MatTabsModule, MatDialogModule, MatButtonModule]
})
export class CategoryHelpDialogComponent {}