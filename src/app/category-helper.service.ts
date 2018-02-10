// Set up data used in category chart and table displays
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';

import { UheroApiService } from './uhero-api.service';
import { HelperService } from './helper.service';
import { CategoryData } from './category-data';
import { Frequency } from './frequency';
import { Geography } from './geography';
import { DateWrapper } from './date-wrapper';

@Injectable()
export class CategoryHelperService {
  private errorMessage: string;
  // Variables for geo and freq selectors
  private defaults;
  private defaultFreq;
  private defaultGeo;
  private categoryData = {};
  private categoryDates = [];
  private seriesDates = [];
  private series = [];

  static setCacheId(category, routeGeo, routeFreq) {
    let id = '' + category;
    if (routeGeo) {
      id = id + routeGeo;
    }
    if (routeFreq) {
      id = id + routeFreq;
    }
    return id;
  }

  constructor(private _uheroAPIService: UheroApiService, private _helper: HelperService) { }

  // Called on page load
  // Gets data sublists available for a selected category
  initContent(catId: any, routeGeo?: string, routeFreq?: string): Observable<any> {
    const cacheId = CategoryHelperService.setCacheId(catId, routeGeo, routeFreq);
    if (this.categoryData[cacheId]) {
      return Observable.of([this.categoryData[cacheId]]);
    } else {
      this.categoryData[cacheId] = <CategoryData>{};
      this._uheroAPIService.fetchCategories().subscribe((categories) => {
        if (catId === null) {
          catId = categories[0].id;
        }
        const cat = categories.find(category => category.id === catId);
        if (cat) {
          const selectedCategory = cat.name;
          const sublist = cat.children;
          this.defaultFreq = cat.defaults ? cat.defaults.freq : '';
          this.defaultGeo = cat.defaults ? cat.defaults.geo : '';
          let selectedGeo = routeGeo ? routeGeo : this.defaultGeo.handle;
          let selectedFreq = routeFreq ? routeFreq : this.defaultFreq.freq;
          let data;
          if (routeGeo && routeFreq) {
            this.checkRouteGeoAndFreq(catId, routeGeo, routeFreq, cacheId);
          }
          if (!routeGeo || !routeFreq) {
            this.getData(catId, this.defaultGeo.handle, this.defaultFreq.freq, cacheId);
          }
        } else {
          this.categoryData[cacheId].invalid = 'Category does not exist.';
        }
      });
      return Observable.forkJoin(Observable.of(this.categoryData[cacheId]));
    }
  }

  checkRouteGeoAndFreq(catId, routeGeo, routeFreq, cacheId) {
    let routeGeoExists, routeFreqExists, categoryData;
    this._uheroAPIService.fetchPackageCategory(catId, routeGeo, routeFreq).subscribe((data) => {
      categoryData = data;
      const subcategories = data.categories.slice(0, data.categories.length - 1);
      const regions = this.getUniqueRegionsList(subcategories);
      const frequencies = this.getUniqueFreqsList(subcategories);
      routeGeoExists = regions.find(region => region.handle === routeGeo);
      routeFreqExists = frequencies.find(frequency => frequency.freq === routeFreq);
    },
      (error) => {
        console.log('check route error', error);
      },
      () => {
        if (routeGeoExists && routeFreqExists) {
          console.log('routeGeoFreqExists', categoryData);
          this.getData(catId, routeGeo, routeFreq, cacheId);
        }
        if (!routeGeoExists || !routeFreqExists) {
          // If geo/freq specified in route does not exist in a category, get category data using its default geo/freq
          this.getData(catId, this.defaultGeo.handle, this.defaultFreq.freq, cacheId);
        }
      });
  }

  getData(catId: any, geo: string, freq: string, cacheId: string) {
    this._uheroAPIService.fetchPackageCategory(catId, geo, freq).subscribe((categoryData) => {
      this.categoryData[cacheId].results = categoryData;
      this.categoryData[cacheId].subcategories = categoryData.categories.slice(0, categoryData.categories.length - 1);
      this.categoryData[cacheId].regions = this.getUniqueRegionsList(this.categoryData[cacheId].subcategories);
      this.categoryData[cacheId].frequencies = this.getUniqueFreqsList(this.categoryData[cacheId].subcategories);
      this.categoryData[cacheId].currentGeo = this.categoryData[cacheId].regions.find(region => region.handle === geo);
      this.categoryData[cacheId].currentFreq = this.categoryData[cacheId].frequencies.find(frequency => frequency.freq === freq);
      const dates = this.setCategoryDates(this.categoryData[cacheId].subcategories, this.categoryData[cacheId].currentGeo, this.categoryData[cacheId].currentFreq, cacheId);
      this.categoryData[cacheId].sliderDates = this._helper.getTableDates(dates.categoryDates);
      this.categoryData[cacheId].categoryDateWrapper = dates.categoryDateWrapper;
      this.categoryData[cacheId].categoryDates = dates.categoryDates;
      this.formatSeriesForDisplay(this.categoryData[cacheId].subcategories, cacheId);
    });
  }

  getUniqueRegionsList(subcategories: Array<any>) {
    const geoArray = [];
    subcategories.forEach((sub) => {
      if (sub.geos) {
        sub.geos.forEach((geo) => {
          const geoExist = geoArray.find(g => g.handle === geo.handle);
          if (!geoExist) {
            geoArray.push(geo);
          }
        });
      }
    });
    return geoArray;
  }

  getUniqueFreqsList(subcategories: Array<any>) {
    const freqArray = [];
    subcategories.forEach((sub) => {
      if (sub.freqs) {
        sub.freqs.forEach((freq) => {
          const freqExist = freqArray.find(f => f.freq === freq.freq);
          if (!freqExist) {
            freqArray.push(freq);
          }
        });
      }
    });
    return freqArray;
  }

  formatSeriesForDisplay(subcategories: Array<any>, cacheId) {
    this.categoryData[cacheId].subcategories.forEach((sub) => {
      sub.requestComplete = false;
      // sublist id used as anchor fragments in landing-page component, fragment expects a string
      sub.id = sub.id.toString();
      if (sub.series) {
        const splitSeries = this.getDisplaySeries(sub.series, this.categoryData[cacheId].currentFreq.freq);
        if (splitSeries) {
          sub.displaySeries = splitSeries.displaySeries;
          sub.noData = false;
          this.formatCategoryData(splitSeries.displaySeries, this.categoryData[cacheId].categoryDates, this.categoryData[cacheId].categoryDateWrapper);
          sub.requestComplete = true;
        }
      }
      if (!sub.series) {
        this.setNoData(sub);
      }
    });
  }

  setCategoryDates(sublist, currentGeo, currentFreq, cacheId) {
    const categoryDateWrapper = { firstDate: '', endDate: '' };
    const categoryDateArray = [];
    // Check subcategories for the earliest/latest start and end dates
    // Used to create array of dates for enitre category
    sublist.forEach((sub) => {
      if (!sub.geoFreqs && sub.current) {
        const freq = sub.freqs.find(f => f.freq === currentFreq.freq);
        const freqStart = freq ? freq.observationStart.substr(0, 10) : sub.freqs[0].observationStart.substr(0, 10);
        const freqEnd = freq ? freq.observationEnd.substr(0, 10) : sub.freqs[0].observationEnd.substr(0, 10);
        const startDate = sub.current.observationStart.substr(0, 10);
        const endDate = sub.current.observationEnd.substr(0, 10);
        if (freqStart < categoryDateWrapper.firstDate || categoryDateWrapper.firstDate === '') {
          categoryDateWrapper.firstDate = freqStart;
        }
        if (freqEnd > categoryDateWrapper.endDate || categoryDateWrapper.endDate === '') {
          categoryDateWrapper.endDate = freqEnd;
        }
      }
    });
    this._helper.createDateArray(categoryDateWrapper.firstDate, categoryDateWrapper.endDate, currentFreq.freq, categoryDateArray);
    return { categoryDateWrapper: categoryDateWrapper, categoryDates: categoryDateArray };
  }

  setNoData(subcategory) {
    const series = [{ seriesInfo: 'No data available' }];
    subcategory.dateWrapper = <DateWrapper>{};
    subcategory.dateRange = [];
    subcategory.datatables = {};
    subcategory.displaySeries = series;
    subcategory.noData = true;
    subcategory.requestComplete = true;
  }

  // Set up search results
  initSearch(search: string, routeGeo?: string, routeFreq?: string): Observable<any> {
    const cacheId = CategoryHelperService.setCacheId(search, routeGeo, routeFreq);
    if (this.categoryData[cacheId]) {
      return Observable.of([this.categoryData[cacheId]]);
    } else {
      let obsEnd, obsStart, freqGeos, geoFreqs, freqs, geos;
      this.categoryData[cacheId] = <CategoryData>{};
      this._uheroAPIService.fetchPackageSearch(search, routeGeo, routeFreq).subscribe((results) => {
        this.defaultGeo = results.defaultGeo;
        this.defaultGeo = results.defaultFreq;
        geos = results.geos;
        freqs = results.freqs;
        obsEnd = results.observationEnd;
        obsStart = results.observationStart;
        if (obsStart && obsEnd) {
          const categoryDateWrapper = { firstDate: '', endDate: '' };
          let selectedGeo = routeGeo ? routeGeo : results.defaultGeo.handle;
          let selectedFreq = routeFreq ? routeFreq : results.defaultFreq.freq;
          const routeGeoExists = routeGeo ? geos.find(geo => geo.handle === routeGeo) : false;
          const routeFreqExists = routeFreq ? freqs.find(freq => freq.freq === routeFreq) : false;
          const dateWrapper = <DateWrapper>{};
          this.categoryData[cacheId].selectedCategory = 'Search: ' + search;
          this.categoryData[cacheId].regions = geos;
          this.categoryData[cacheId].currentGeo = routeGeoExists ? routeGeoExists : geos.find(geo => geo.handle === results.defaultGeo.handle);
          this.categoryData[cacheId].frequencies = freqs;
          this.categoryData[cacheId].currentFreq = routeFreqExists ? routeFreqExists : freqs.find(freq => freq.freq === results.defaultFreq.freq);
          const splitSeries = this.getDisplaySeries(results.series, selectedFreq);
          const sublist = {
            id: 'search',
            parentName: 'Search',
            name: search,
            displaySeries: splitSeries.displaySeries,
            requestComplete: false
          };
          const catWrapper = this.getSearchDates(splitSeries.displaySeries);
          const categoryDateArray = [];
          this._helper.createDateArray(catWrapper.firstDate, catWrapper.endDate, selectedFreq, categoryDateArray);
          this.formatCategoryData(splitSeries.displaySeries, categoryDateArray, catWrapper);
          this.categoryData[cacheId].subcategories = [sublist];
          this.categoryData[cacheId].categoryDateWrapper = categoryDateWrapper;
          this.categoryData[cacheId].categoryDates = categoryDateArray;
          this.categoryData[cacheId].sliderDates = this._helper.getTableDates(categoryDateArray);
          this.categoryData[cacheId].requestComplete = true;
          sublist.requestComplete = true;
        }
        if (!obsStart || !obsEnd) {
          this.categoryData[cacheId].invalid = search;
        }
      });
      return Observable.forkJoin(Observable.of(this.categoryData[cacheId]));
    }
  }

  getSearchDates(displaySeries) {
    const categoryDateWrapper = { firstDate: '', endDate: '' };
    displaySeries.forEach((series) => {
      if (series.start < categoryDateWrapper.firstDate || categoryDateWrapper.firstDate === '') {
        categoryDateWrapper.firstDate = series.start;
      }
      if (series.end > categoryDateWrapper.endDate || categoryDateWrapper.endDate === '') {
        categoryDateWrapper.endDate = series.end;
      }
    });
    return categoryDateWrapper;
  }

  filterSeriesResults(results: Array<any>, freq: string) {
    const filtered = [];
    results.forEach((res) => {
      let seriesDates = [], series;
      const seriesObsStart = res.seriesObservations.observationStart;
      const seriesObsEnd = res.seriesObservations.observationEnd;
      const levelData = res.seriesObservations.transformationResults[0].dates;
      const decimals = res.decimals ? res.decimals : 1;
      // Add series if level data is available
      if (levelData) {
        seriesDates = this._helper.createDateArray(seriesObsStart, seriesObsEnd, freq, seriesDates);
        series = this._helper.dataTransform(res.seriesObservations, seriesDates, decimals);
        res.saParam = res.seasonalAdjustment !== 'not_seasonally_adjusted';
        series.seriesInfo = res;
        series.seriesInfo.displayName = res.title;
        filtered.push(series);
      }
    });
    return filtered;
  }

  getDisplaySeries(allSeries, freq: string) {
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
      if (series.seasonalAdjustment !== 'not_seasonally_adjusted') {
        measurements.set(measurementKey, series);
      }
    });
    measurements.forEach((measurement) => displaySeries.push(measurement));
    // Filter out series that do not have level data
    const filtered = this.filterSeriesResults(displaySeries, freq);
    return filtered.length ? { displaySeries: filtered } : null;
  }

  formatCategoryData(displaySeries: Array<any>, dateArray: Array<any>, dateWrapper: DateWrapper) {
    displaySeries.forEach((series) => {
      if (series.seriesInfo !== 'No data available') {
        const decimals = series.decimals ? series.decimals : 1;
        series['categoryTable'] = this._helper.seriesTable(series.tableData, dateArray, decimals);
        series['categoryChart'] = this._helper.dataTransform(series.seriesInfo.seriesObservations, dateArray, decimals);
      }
    });
  }
}
