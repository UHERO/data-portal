import { Component, Input, Output, EventEmitter } from '@angular/core';
import { NgFor } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
    selector: 'lib-measurement-selector',
    templateUrl: './measurement-selector.component.html',
    styleUrls: ['./measurement-selector.component.scss'],
    standalone: true,
    imports: [FormsModule, NgFor]
})
export class MeasurementSelectorComponent {
  @Input() measurements;
  @Input() selectedMeasurement;
  @Output() selectedMeasurementChange = new EventEmitter();

  constructor() { }

  onChange(newMeasure) {
    this.selectedMeasurement = this.measurements.find(measurment => measurment.name === newMeasure);
    this.selectedMeasurementChange.emit(this.selectedMeasurement);
  }
}
