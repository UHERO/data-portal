import { forkJoin as observableForkJoin, of as observableOf, Observable } from 'rxjs';
// Set up data used in category chart and table displays
import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { HelperService } from './helper.service';
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

  constructor(private apiService: ApiService, private helperService: HelperService) { }

  // Called on page load
  // Gets data sublists available for a selected category
  initContent(catId: any, noCache: boolean, routeParams)/*: Observable<any>*/ {
    const { dataListId, selectedMeasure } = routeParams;
    const cacheId = this.helperService.setCacheId(catId, routeParams);
    if (this.categoryData[cacheId]) {
      this.helperService.updateCurrentFrequency(this.categoryData[cacheId].currentFreq);
      return observableOf([this.categoryData[cacheId]]);
    }
    if (!this.categoryData[cacheId] && (typeof catId === 'number' || catId === null)) {
      this.getCategory(cacheId, noCache, catId, dataListId, selectedMeasure);
      return observableForkJoin([observableOf(this.categoryData[cacheId])]);
    }
    if (!this.categoryData[cacheId] && typeof catId === 'string') {
      this.getSearch(cacheId, noCache, catId);
      return observableForkJoin([observableOf(this.categoryData[cacheId])]);
    }
  }

  getCategory(cacheId: string, noCache: boolean, catId: any, dataListId, selectedMeasure?: string) {
    this.categoryData[cacheId] = {} as CategoryData;
    this.apiService.fetchCategories().pipe(
      tap(categories => {
        catId = catId || categories[0].id;
        const cat = categories.find(category => category.id === catId);
        if (cat) {
          const categoryDataLists = cat.children;
          const selectedDataList = dataListId ?
            this.helperService.findSelectedDataList(categoryDataLists, dataListId, '') :
            this.helperService.getCategoryDataLists(categoryDataLists[0], '');
          this.categoryData[cacheId].selectedDataList = selectedDataList;
          this.categoryData[cacheId].selectedDataListName = selectedDataList.dataListName;
          this.categoryData[cacheId].selectedCategory = cat;
          this.categoryData[cacheId].categoryId = cat.id;
          this.categoryData[cacheId].currentFreq = { freq: 'A', label: 'Annual' };
          if (dataListId == null) {
            dataListId = cat.children[0].id;
            this.categoryData[cacheId].defaultDataList = dataListId;
          }
          const sublistCopy = [];
          categoryDataLists.forEach((sub) => {
            sub.parentName = cat.name;
            sublistCopy.push(Object.assign({}, sub));
          });
          this.categoryData[cacheId].sublist = sublistCopy;
        } else {
          this.categoryData[cacheId].invalid = 'Category does not exist.';
        }
      }),
      // get measurements
      switchMap(() => {
        return this.apiService.fetchCategoryMeasurements(this.categoryData[cacheId].selectedDataList.id, noCache);
      }),
      tap((measurements) => {
        this.categoryData[cacheId].measurements = measurements;
        this.findSelectedMeasurement(this.categoryData[cacheId], selectedMeasure);
      }),
      // get series for selected measurements
      switchMap(() => {
        return this.apiService.fetchMeasurementSeries(this.categoryData[cacheId].currentMeasurement.id, noCache)
      })
    ).subscribe((data: any) => {
      const categoryDataArray = [];
      this.categoryData[cacheId].dateWrapper = {} as DateWrapper;
      if (data) {
        data.forEach((serie) => {
          serie.observations = this.helperService.formatSeriesForCharts(serie);
          serie.gridDisplay = this.helperService.formatGridDisplay(serie, 'lvl', 'c5ma');
        });
        this.categoryData[cacheId].series = data;
        this.formatCategoryData(this.categoryData[cacheId], categoryDataArray, false);
      }
      if (!data) {
        this.categoryData[cacheId].noData = true;
        this.categoryData[cacheId].requestComplete = true;
      }
    });
  }

  findSelectedMeasurement(sublist, selectedMeasure) {
    sublist.measurements.forEach((measurement) => {
      sublist.currentMeasurement = selectedMeasure ?
        sublist.measurements.find(m => m.name === selectedMeasure) :
        sublist.measurements.find(m => m.name === 'Region');
    });
  }

  getSearch(cacheId, noCache: boolean, search) {
    this.categoryData[cacheId] = {};
    this.apiService.fetchSearchSeries(search, noCache).subscribe((results) => {
      this.categoryData[cacheId].searchResults = results;
      this.categoryData[cacheId].selectedCategory = { id: search, name: `Search ${search}` };
      this.categoryData[cacheId].requestComplete = true;
      this.categoryData[cacheId].noData = !results ? true : false;
      this.categoryData[cacheId].invalid = !results ? `No results found for ${search}` : false;
    });
  }

  // Format series data for chart and table displays
  formatCategoryData(category, subcategoryDateArray: Array<any>, search: boolean) {
    const dateWrapper = category.dateWrapper;
    category.displaySeries = this.filterSeries(category.series, category, search);
    category.dateArray = this.helperService.createDateArray(dateWrapper.firstDate, dateWrapper.endDate, 'A', subcategoryDateArray);
    category.sliderDates = this.helperService.getTableDates(category.dateArray);
    category.findMinMax = true;
    category.requestComplete = true;
  }

  filterSeries(seriesArray: Array<any>, category, search: boolean) {
    return seriesArray.map((res) => {
      const { transformationResults } = res.seriesObservations;
      const levelData = transformationResults[0].observations;
      const newLevelData = transformationResults[0].dates;
      const { observationStart, observationEnd } = res.seriesObservations;
      let seriesDates = [];
      category.dateWrapper.firstDate = this.setStartDate(category.dateWrapper, observationStart);
      category.dateWrapper.endDate = this.setEndDate(category.dateWrapper, observationEnd);
      seriesDates = this.helperService.createDateArray(observationStart, observationEnd, 'A', seriesDates);
      if (levelData || newLevelData) {
        res.saParam = res.seasonalAdjustment !== 'not_seasonally_adjusted';
        res.displayName = search ?
          `${res.title} (${res.geography.name})` : res.geography.name;
        return res;
      }
    });
  }

  setStartDate = (dateWrapper, observationStart) => {
    const { firstDate } = dateWrapper;
    return (!firstDate || observationStart < firstDate) ? observationStart : firstDate;
  }

  setEndDate = (dateWrapper, observationEnd) => {
    const { endDate } = dateWrapper;
    return (!endDate || observationEnd > endDate) ? observationEnd : endDate;
  }
}
