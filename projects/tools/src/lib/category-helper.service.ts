import { forkJoin as observableForkJoin, of as observableOf, Observable } from 'rxjs';
// Set up data used in category chart and table displays
import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { HelperService } from './helper.service';
import { CategoryData, DateWrapper } from './tools.models';
import { seriesType } from 'highcharts';

@Injectable({
  providedIn: 'root'
})
export class CategoryHelperService {
  private errorMessage: string;
  // Variables for geo and freq selectors
  private categoryData = {};

  static setCacheId(category, routeGeo, routeFreq, dataList?) {
    let id = `category${category}list${dataList}`;
    if (routeGeo) {
      id = id + routeGeo;
    }
    if (routeFreq) {
      id = id + routeFreq;
    }
    return id;
  }

  constructor(private apiService: ApiService, private helperService: HelperService) { }

  // Called on page load
  // Gets data sublists available for a selected category
  initContent(catId: any, noCache: boolean, dataListId: number, routeGeo: string, routeFreq: string): Observable<any> {
    const cacheId = CategoryHelperService.setCacheId(catId, routeGeo, routeFreq, dataListId);
    if (this.categoryData[cacheId]) {
      this.helperService.updateCurrentFrequency(this.categoryData[cacheId].currentFreq);
      this.helperService.updateCurrentGeography(this.categoryData[cacheId].currentGeo);
      return observableOf([this.categoryData[cacheId]]);
    } else {
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
          if (dataListId === null) {
            this.categoryData[cacheId].defaultDataList = selectedDataList.id;
          }
          this.categoryData[cacheId].selectedCategoryId = cat.id;
          this.categoryData[cacheId].selectedCategory = cat;
          this.categoryData[cacheId].subcategories = categoryDataLists;
          this.getDataListGeos(noCache, selectedDataList, cacheId, routeGeo, routeFreq);
        } else {
          this.categoryData[cacheId].invalid = 'Category does not exist.';
          this.categoryData[cacheId].requestComplete = true;
        }
      });
      console.log('categoryData', this.categoryData[cacheId])
      return observableForkJoin([observableOf(this.categoryData[cacheId])]);
    }
  }

  getDataListGeos(noCache: boolean, dataList: any, cacheId: string, routeGeo: string, routeFreq: string) {
    this.apiService.fetchCategoryGeos(dataList.id).subscribe((geos) => {
      this.categoryData[cacheId].regions = geos || [dataList.defaults.geo];
    },
      (error) => {
        console.log('check category geos error', error);
      },
      () => {
        this.getDataListFreqs(noCache, dataList, cacheId, routeGeo, routeFreq);
      });
  }

  getDataListFreqs(noCache: boolean, dataList: any, cacheId: string, routeGeo: string, routeFreq: string) {
    this.apiService.fetchCategoryFreqs(dataList.id).subscribe((freqs) => {
      this.categoryData[cacheId].frequencies = freqs || [dataList.defaults.freq];
    },
      (error) => {
        console.log('check category freqs error', error);
      },
      () => {
        let routeGeoExists;
        let routeFreqExists;
        if (routeGeo && routeFreq) {
          routeGeoExists = this.categoryData[cacheId].regions.find(region => region.handle === routeGeo);
          routeFreqExists = this.categoryData[cacheId].frequencies.find(frequency => frequency.freq === routeFreq);
        }
        if (routeGeoExists && routeFreqExists) {
          this.getData(noCache, dataList.id, routeGeo, routeFreq, cacheId);
        }
        if (!routeGeoExists || !routeFreqExists) {
          const defaultFreq = (dataList.defaults && dataList.defaults.freq) || this.categoryData[cacheId].frequencies[0];
          const defaultGeo = (dataList.defaults && dataList.defaults.geo) || this.categoryData[cacheId].regions[0];
          this.getData(noCache, dataList.id, defaultGeo.handle, defaultFreq.freq, cacheId);
        }
      });
  }

  getData(noCache: boolean, subId: number, geo: string, freq: string, cacheId: string) {
    this.apiService.fetchExpanded(subId, geo, freq, noCache).subscribe((expandedCategory) => {
      const currentFreq = this.categoryData[cacheId].frequencies.find(frequency => frequency.freq === freq);
      const currentGeo = this.categoryData[cacheId].regions.find(region => region.handle === geo);
      this.helperService.updateCurrentFrequency(currentFreq);
      this.helperService.updateCurrentGeography(currentGeo);
      this.categoryData[cacheId].currentFreq = currentFreq;
      this.categoryData[cacheId].currentGeo = currentGeo;
      if (expandedCategory) {
        const series = expandedCategory;
        const dates = this.setCategoryDates(series, freq);
        this.categoryData[cacheId].sliderDates = this.helperService.getTableDates(dates.categoryDates);
        //this.categoryData[cacheId].categoryDateWrapper = dates.categoryDateWrapper;
        this.categoryData[cacheId].categoryDates = dates.categoryDates;
        const displaySeries = this.filterSeriesResults(series);
        this.categoryData[cacheId].displaySeries = displaySeries.length ? displaySeries : null;
        this.categoryData[cacheId].series = series;
        this.categoryData[cacheId].hasSeasonal = this.findSeasonalSeries(displaySeries);
        this.categoryData[cacheId].requestComplete = true;
      }
      if (!expandedCategory) {
        this.categoryData[cacheId].requestComplete = true;
        this.categoryData[cacheId].noData = true;
      }
    });
  }

  setCategoryDates = (series: Array<any>, currentFreq: string) => {
    const categoryDateWrapper: DateWrapper = { firstDate: '', endDate: '' };
    const categoryDateArray = [];
    // Check series for the earliest/latest start and end dates
    // Used to create array of dates for enitre category
    categoryDateWrapper.firstDate = this.helperService.findDateWrapperStart(series);
    categoryDateWrapper.endDate = this.helperService.fineDateWrapperEnd(series);
    this.helperService.createDateArray(categoryDateWrapper.firstDate, categoryDateWrapper.endDate, currentFreq, categoryDateArray);
    return { categoryDateWrapper, categoryDates: categoryDateArray };
  }

  getUniqueRegionList = (series: Array<any>) => {
    const regionList = [];
    series.forEach((s) => {
      s.geos.forEach((geo) => {
        const regionExists = regionList.find(region => region.handle === geo.handle);
        if (!regionExists) {
          regionList.push(geo);
        }
      });
    });
    return regionList;
  }

  getUniqueFrequencyList = (series: Array<any>) => {
    const freqList = [];
    series.forEach((s) => {
      s.freqs.forEach((freq) => {
        const freqExists = freqList.find(frequency => frequency.freq === freq.freq);
        if (!freqExists) {
          freqList.push(freq);
        }
      });
    });
    return freqList;
  }

  setNoData(subcategory) {
    const series = ['No data available'];
    subcategory.dateWrapper = {} as DateWrapper;
    subcategory.dateRange = [];
    subcategory.datatables = {};
    subcategory.displaySeries = series;
    subcategory.noData = true;
    subcategory.requestComplete = true;
  }

  // Set up search results
  initSearch(search: string, noCache: boolean, routeGeo: string, routeFreq: string): Observable<any> {
    const cacheId = CategoryHelperService.setCacheId(search, routeGeo, routeFreq);
    if (this.categoryData[cacheId]) {
      this.helperService.updateCurrentFrequency(this.categoryData[cacheId].currentFreq);
      this.helperService.updateCurrentGeography(this.categoryData[cacheId].currentGeo);
      return observableOf([this.categoryData[cacheId]]);
    } else {
      this.categoryData[cacheId] = {} as CategoryData;
      if (routeGeo && routeFreq) {
        this.apiService.fetchPackageSearch(search, routeGeo, routeFreq, noCache).subscribe((results) => {
          const routeGeoExists = results.geos.find(geo => geo.handle === routeGeo);
          const routeFreqExists = results.freqs.find(freq => freq.freq === routeFreq);
          if (routeFreqExists && routeGeoExists) {
            this.getSearchData(results, cacheId, search, routeGeo, routeFreq);
          }
          if (!routeFreqExists || !routeGeoExists) {
            this.getSearchWithDefaults(search, noCache, cacheId);
          }
        });
      }
      if (!routeGeo || !routeFreq) {
        this.getSearchWithDefaults(search, noCache, cacheId);
      }
      return observableForkJoin([observableOf(this.categoryData[cacheId])]);
    }
  }

  getSearchWithDefaults(search, noCache: boolean, cacheId) {
    this.apiService.fetchPackageSearch(search, '', '', noCache).subscribe((results) => {
      const geo = results.defaultGeo.handle;
      const freq = results.defaultFreq.freq;
      this.getSearchData(results, cacheId, search, geo, freq);
    });
  }

  getSearchData(results, cacheId, search, geo, freq) {
    if (results.observationStart && results.observationEnd && results.series) {
      const categoryDateWrapper = { firstDate: '', endDate: '' };
      this.categoryData[cacheId].selectedCategory = { id: search, name: 'Search: ' + search };
      this.categoryData[cacheId].regions = results.geos;
      this.categoryData[cacheId].frequencies = results.freqs;
      const currentFreq = this.categoryData[cacheId].frequencies.find(frequency => frequency.freq === freq);
      const currentGeo = this.categoryData[cacheId].regions.find(region => region.handle === geo);
      this.helperService.updateCurrentFrequency(currentFreq);
      this.helperService.updateCurrentGeography(currentGeo);
      this.categoryData[cacheId].currentFreq = currentFreq;
      this.categoryData[cacheId].currentGeo = currentGeo;
      const displaySeries = this.filterSeriesResults(results.series);
      this.categoryData[cacheId].displaySeries = displaySeries.length ? displaySeries : null;
      this.categoryData[cacheId].hasSeasonal = this.findSeasonalSeries(displaySeries);
      const catWrapper = this.getSearchDates(displaySeries);
      const categoryDateArray = [];
      this.helperService.createDateArray(catWrapper.firstDate, catWrapper.endDate, freq, categoryDateArray);
      this.categoryData[cacheId].categoryDateWrapper = categoryDateWrapper;
      this.categoryData[cacheId].categoryDates = categoryDateArray;
      this.categoryData[cacheId].requestComplete = true;
    }
    if (!results.observationStart || !results.observationEnd || !results.series) {
      this.categoryData[cacheId].invalid = search;
    }
  }

  getSearchDates(displaySeries) {
    const categoryDateWrapper: DateWrapper = { firstDate: '', endDate: '' };
    categoryDateWrapper.firstDate = this.helperService.findDateWrapperStart(displaySeries);
    categoryDateWrapper.endDate = this.helperService.fineDateWrapperEnd(displaySeries);
    return categoryDateWrapper;
  }

  filterSeriesResults(results: Array<any>) {
    return results.map((res) => {
      const levelData = res.seriesObservations.transformationResults[0].dates;
      if (levelData) {
        res.saParam = res.seasonalAdjustment === 'seasonally_adjusted';
        res.displayName = res.title;
        return res;
      }
    });
  }

  findSeasonalSeries = (categorySeries: Array<any>) => categorySeries.some(s => s.seasonalAdjustment === 'seasonally_adjusted');

  getDisplaySeries(allSeries) {
    // Check if (non-annual) category has seasonally adjusted data
    // Returns true for annual data
    const displaySeries = [];
    const measurements = new Map();
    allSeries.forEach((series) => {
      if (!series.hasOwnProperty('measurementId')) {
        displaySeries.push(series);
        return;
      }
      const measurementKey = `m${series.measurementId}`;
      if (!measurements.has(measurementKey)) {
        measurements.set(measurementKey, series);
        return;
      }
    });
    measurements.forEach((measurement) => displaySeries.push(measurement));
    // Filter out series that do not have level data
    const filtered = this.filterSeriesResults(displaySeries);
    return filtered.length ? filtered : null;
  }
}
