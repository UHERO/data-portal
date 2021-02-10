import { Component, Input, Output, EventEmitter, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { HelperService } from '../helper.service';

import { Geography } from '../tools.models';

@Component({
  selector: 'lib-geo-selector',
  templateUrl: './geo-selector.component.html',
  styleUrls: ['./geo-selector.component.scss']
})
export class GeoSelectorComponent implements OnDestroy {
  @Input() regions: Array<Geography>;
  selectedGeo: Geography;
  geoSubscription: Subscription;
  @Output() selectedGeoChange = new EventEmitter();

  constructor(private helperService: HelperService) {
    this.geoSubscription = helperService.currentGeo.subscribe((geo) => {
      this.selectedGeo = geo;
    });
  }

  ngOnDestroy() {
    this.geoSubscription.unsubscribe();
  }

  onChange(newGeo) {
    this.selectedGeo = this.regions.find(region => region.handle === newGeo);
    this.selectedGeoChange.emit(this.selectedGeo);
    this.helperService.updateCurrentGeography(this.selectedGeo);
  }
}
