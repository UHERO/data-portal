import { forkJoin as observableForkJoin, of as observableOf, Observable } from 'rxjs';
// Set up data used in category chart and table displays
import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { HelperService } from './helper.service';
import { CategoryData } from './tools.models';
import { DateWrapper } from './tools.models';

@Injectable({
  providedIn: 'root'
})
export class NtaHelperService {
  private errorMessage: string;
  // Variables for geo and freq selectors
  private defaults;
  private categoryData = {};

  constructor(private apiService: ApiService, private helperService: HelperService) { }

  // Called on page load
  // Gets data sublists available for a selected category
  initContent(catId: any, noCache: boolean, routeParams): Observable<any> {
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
    this.apiService.fetchCategories().subscribe((categories) => {
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
        this.getSubcategoryData(this.categoryData[cacheId], noCache, selectedMeasure);
      } else {
        this.categoryData[cacheId].invalid = 'Category does not exist.';
      }
    });
  }

  getSubcategoryData(category, noCache: boolean, selectedMeasure?: string) {
    this.apiService.fetchCategoryMeasurements(category.selectedDataList.id, noCache).subscribe((measures) => {
      category.measurements = measures;
    },
      (error) => {
        console.log('error fetching category measurements', error);
      },
      () => {
        this.findSelectedMeasurement(category, selectedMeasure);
        this.getSeriesData(category, noCache);
      });
  }

  findSelectedMeasurement(sublist, selectedMeasure) {
    sublist.measurements.forEach((measurement) => {
      sublist.currentMeasurement = selectedMeasure ?
        sublist.measurements.find(m => m.name === selectedMeasure) :
        sublist.measurements.find(m => m.name === 'Region');
    });
  }

  // Get list of series belonging to each measurement
  getSeriesData(category, noCache: boolean) {
    const categoryDataArray = [];
    category.dateWrapper = { firstDate: '', endDate: '' };
    this.apiService.fetchMeasurementSeries(category.currentMeasurement.id, noCache).subscribe((series) => {
      if (series) {
        series.forEach((serie) => {
          serie.observations = this.helperService.formatSeriesForCharts(serie);
          serie.gridDisplay = this.helperService.formatGridDisplay(serie, 'lvl', 'pc1');
        });
        category.series = series;
        this.formatCategoryData(category, categoryDataArray, false);
      }
      if (!series) {
        category.noData = true;
        category.requestComplete = true;
      }
    },
      (error) => {
        console.log('error fetching measurement series', error);
      });
  }

  getSearch(cacheId, noCache: boolean, catId) {
    this.categoryData[cacheId] = {} as CategoryData;
    let freqGeos;
    let freqs;
    let obsEnd;
    let obsStart;
    this.apiService.fetchSearch(catId, noCache).subscribe((results) => {
      this.defaults = results.defaults;
      freqGeos = results.freqGeos;
      freqs = results.freqs;
      obsEnd = results.observationEnd;
      obsStart = results.observationStart;
    },
      (error) => {
        this.errorMessage = error;
      },
      () => {
        if (obsEnd && obsStart) {
          const dateWrapper = {} as DateWrapper;
          this.getSearchData(catId, noCache, cacheId, dateWrapper);
          this.categoryData[cacheId].currentFreq = freqGeos ? freqGeos[0] : freqs[0];
          this.categoryData[cacheId].selectedCategory = { id: catId, name: 'Search: ' + catId };
        } else {
          this.categoryData[cacheId].invalid = catId;
        }
      });
  }

  getSearchData(search: string, noCache: boolean, cacheId, dateWrapper: DateWrapper) {
    let searchResults;
    // Get series for a requested search term
    this.apiService.fetchSearchSeries(search, noCache).subscribe((searchRes) => {
      searchResults = searchRes;
    },
      (error) => {
        this.errorMessage = error;
      },
      () => {
        if (searchResults) {
          this.getSearchObservations(searchResults, noCache, this.categoryData[cacheId]);
        }
      });
  }

  // Get observations for series in search results
  getSearchObservations(searchSeries, noCache: boolean, category) {
    let seriesTotal = searchSeries.length;
    searchSeries.forEach((series) => {
      this.apiService.fetchObservations(series.id, noCache).subscribe((obs) => {
        series.seriesObservations = obs;
      },
        (error) => {
          this.errorMessage = error;
        },
        () => {
          seriesTotal--;
          if (seriesTotal === 0) {
            const sublist = {
              dateWrapper: { firstDate: '', endDate: '' },
              id: 'search',
              series: searchSeries
            };
            category.dateWrapper = { firstDate: '', endDate: '' };
            category.id = 'search';
            category.series = searchSeries;
            this.formatCategoryData(category, [], true);
            category.sublist = [sublist];
          }
        });
    });
  }

  groupSearchMeasurements(searchSeries: Array<any>) {
    const measurements = [];
    searchSeries.forEach((series) => {
      const measurementExists = measurements.find(measurement => measurement.id === series.measurementId);
      if (!measurementExists && series.frequencyShort === 'A') {
        measurements.push({
          dateWrapper: { firstDate: '', endDate: '' },
          id: series.measurementId || 'null',
          name: series.measurementName || ' ',
          series: [series]
        });
      }
      if (measurementExists && series.frequencyShort === 'A') {
        measurementExists.series.push(series);
      }
    });
    return measurements;
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
      const levelData = res.seriesObservations.transformationResults[0].observations;
      const newLevelData = res.seriesObservations.transformationResults[0].dates;
      const seriesObsStart = res.seriesObservations.observationStart;
      const seriesObsEnd = res.seriesObservations.observationEnd;
      let seriesDates = [];
      category.dateWrapper.firstDate = this.setStartDate(category.dateWrapper, seriesObsStart);
      category.dateWrapper.endDate = this.setEndDate(category.dateWrapper, seriesObsEnd);
      seriesDates = this.helperService.createDateArray(seriesObsStart, seriesObsEnd, 'A', seriesDates);
      if (levelData || newLevelData) {
        res.saParam = res.seasonalAdjustment !== 'not_seasonally_adjusted';
        res.displayName = search ?
          `${res.title} (${res.geography.name})` : res.geography.name;
        return res;
      }
    });
  }

  setStartDate = (dateWrapper, observationStart) => {
    return (!dateWrapper.firstDate || observationStart < dateWrapper.firstDate) ? observationStart : dateWrapper.firstDate;
  }

  setEndDate = (dateWrapper, observationEnd) => {
    return (!dateWrapper.endDate || observationEnd > dateWrapper.endDate) ? observationEnd : dateWrapper.endDate;
  }
}
