import { of as observableOf, Observable } from 'rxjs';
// Set up data used in category chart and table displays
import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { HelperService } from './helper.service';
import { CategoryHelperService } from './category-helper.service';
import { CategoryData } from './tools.models';
import { DateWrapper } from './tools.models';
import { switchMap, tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class NtaHelperService {
  // Variables for geo and freq selectors
  private defaults;
  private categoryData = {};

  constructor(
    private apiService: ApiService,
    private helperService: HelperService,
    private categoryHelper: CategoryHelperService
  ) { }

  // Called on page load
  // Gets data sublists available for a selected category
  initContent(catId: any, noCache: boolean, routeParams): Observable<any> {
    const { dataListId, selectedMeasure } = routeParams;
    const cacheId = this.helperService.setCacheId(catId, routeParams);
    if (this.categoryData[cacheId]) {
      this.helperService.updateCurrentFrequency(this.categoryData[cacheId].currentFreq);
    }
    if (!this.categoryData[cacheId] && (typeof catId === 'number' || catId === null)) {
      this.categoryData[cacheId] = {};
      this.getCategory(this.categoryData[cacheId], noCache, catId, dataListId, selectedMeasure);
    }
    if (!this.categoryData[cacheId] && typeof catId === 'string') {
      this.categoryData[cacheId] = {};
      this.categoryHelper.initSearch(this.categoryData[cacheId], noCache, catId);
    }
    return observableOf([this.categoryData[cacheId]]);
  }

  getCategory(category, noCache: boolean, catId: any, dataListId, selectedMeasure?: string) {
    this.apiService.fetchCategories().pipe(
      tap(categories => {
        category.currentFreq = { freq: 'A', label: 'Annual' };
        this.categoryHelper.findCategoryAndStoreDataLists(categories, catId, dataListId, category);
      }),
      // get measurements
      switchMap(() => {
        return this.apiService.fetchCategoryMeasurements(category.selectedDataList.id, noCache);
      }),
      tap((measurements) => {
        category.measurements = measurements;
        category.currentMeasurement = this.findSelectedMeasurement(category, selectedMeasure)
      }),
      // get series for selected measurements
      switchMap(() => {
        return this.apiService.fetchMeasurementSeries(category.currentMeasurement.id, noCache)
      })
    ).subscribe((data: any) => {
      this.categoryHelper.processSeriesData(data, category, 'c5ma', true);
    });
  }

  findSelectedMeasurement = (sublist, selectedMeasure: string) => {
    const { measurements } = sublist;
    return measurements.find(m => selectedMeasure ? m.name === selectedMeasure : m.name === 'Region');
  }
}
