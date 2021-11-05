import { Component, Input, Output, EventEmitter, OnDestroy } from '@angular/core';
import { HelperService } from '../helper.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'lib-forecast-selector',
  templateUrl: './forecast-selector.component.html',
  styleUrls: ['./forecast-selector.component.scss']
})
export class ForecastSelectorComponent implements OnDestroy {
  @Input() forecasts: Array<string>;
  //@Input() analyzerView: boolean;
  selectedForecast: string;
  @Output() selectedFcChange = new EventEmitter();
  fcSubscription: Subscription;

  constructor(private helperService: HelperService) {
    this.fcSubscription = helperService.currentFc.subscribe((fc) => {
      this.selectedForecast = fc;
    });
  }

  ngOnDestroy() {
    this.fcSubscription.unsubscribe();
  }

  onChange(newFc: string) {
    this.selectedForecast = this.forecasts.find(fc => fc === newFc);
    this.selectedFcChange.emit(this.selectedForecast);
    this.helperService.updateCurrentForecast(this.selectedForecast);
  }
}
