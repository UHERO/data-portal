import { Component, Input, Output, EventEmitter, OnDestroy } from '@angular/core';
import { Frequency } from '../tools.models';
import { HelperService } from '../helper.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'lib-freq-selector',
  templateUrl: './freq-selector.component.html',
  styleUrls: ['./freq-selector.component.scss']
})
export class FreqSelectorComponent implements OnDestroy {
  @Input() freqs: Array<Frequency>;
  @Input() analyzerView: boolean;
  selectedFreq: Frequency;
  @Output() selectedFreqChange = new EventEmitter();
  freqSubscription: Subscription;

  constructor(private helperService: HelperService) {
    this.freqSubscription = helperService.currentFreq.subscribe((freq) => {
      this.selectedFreq = freq;
    });
  }

  ngOnDestroy() {
    this.freqSubscription.unsubscribe();
  }

  onChange(newFreq: string) {
    this.selectedFreq = this.freqs.find(freq => freq.freq === newFreq);
    this.selectedFreqChange.emit(this.selectedFreq);
    this.helperService.updateCurrentFrequency(this.selectedFreq);
  }
}
