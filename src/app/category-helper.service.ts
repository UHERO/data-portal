import { forkJoin as observableForkJoin, of as observableOf, Observable } from 'rxjs';
// Set up data used in category chart and table displays
import { Injectable } from '@angular/core';

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

  static setCacheId(category, routeGeo, routeFreq, dataList?) {
    let id = '' + category + dataList;
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
  initContent(catId: any, dataListId?: number, routeGeo?: string, routeFreq?: string): Observable<any> {
    const cacheId = CategoryHelperService.setCacheId(catId, routeGeo, routeFreq, dataListId);
    console.log('cacheId', cacheId)
    if (this.categoryData[cacheId]) {
      return observableOf([this.categoryData[cacheId]]);
    } else {
      this.categoryData[cacheId] = <CategoryData>{};
      this._uheroAPIService.fetchCategories().subscribe((categories) => {
        if (catId === null) {
          catId = categories[0].id;
        }
        const cat = categories.find(category => category.id === catId);
        if (cat) {
          if (dataListId == null) {
            dataListId = cat.children[0].id;
            this.categoryData[cacheId].defaultDataList = dataListId;
          }
          const selectedSubcategory = cat.children.find(sub => sub.id === dataListId);
          const selectedCategory = cat.name;
          const sublist = cat.children;
          this.defaultFreq = cat.defaults ? cat.defaults.freq : '';
          this.defaultGeo = cat.defaults ? cat.defaults.geo : '';
          this.categoryData[cacheId].selectedCategory = selectedCategory;
          const sublistCopy = [];
          sublist.forEach((sub) => {
            sublistCopy.push(Object.assign({}, sub));
          });
          this.categoryData[cacheId].subcategories = sublistCopy;
          if (routeGeo && routeFreq) {
            this.checkRouteGeoAndFreq(catId, dataListId, routeGeo, routeFreq, cacheId);
          }
          if (!routeGeo || !routeFreq) {
            this.getData(catId, dataListId, this.defaultGeo.handle, this.defaultFreq.freq, cacheId);
          }
        } else {
          this.categoryData[cacheId].invalid = 'Category does not exist.';
        }
      });
      return observableForkJoin(observableOf(this.categoryData[cacheId]));
    }
  }

  checkRouteGeoAndFreq(catId, subId, routeGeo, routeFreq, cacheId) {
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
          this.getData(catId, subId, routeGeo, routeFreq, cacheId);
        }
        if (!routeGeoExists || !routeFreqExists) {
          // If geo/freq specified in route does not exist in a category, get category data using its default geo/freq
          this.getData(catId, subId, this.defaultGeo.handle, this.defaultFreq.freq, cacheId);
        }
      });
  }

  getData(catId: any, subId: number, geo: string, freq: string, cacheId: string) {
    /* this._uheroAPIService.fetchExpanded(subId, geo, freq).subscribe((expandedCategory) => {
      console.log('expanded category', expandedCategory)
    }); */
    this._uheroAPIService.fetchPackageCategory(catId, geo, freq).subscribe((categoryData) => {
      console.log(categoryData)
      this.categoryData[cacheId].results = categoryData;
      const subcats = categoryData.categories.slice(0, categoryData.categories.length - 1);
      // Merge subcats with original list of categories from /category response
      const sublistCopy = [];
      subcats.forEach((sub) => {
        const subMatch = this.categoryData[cacheId].subcategories.find(s => s.id === sub.id);
        sublistCopy.push(Object.assign({}, sub, subMatch));
      });
      this.categoryData[cacheId].subcategories = sublistCopy;
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
    subcategories.forEach((sub) => {
      sub.requestComplete = false;
      // sublist id used as anchor fragments in landing-page component, fragment expects a string
      sub.id = sub.id.toString();
      // At most, display 12 series at a time in the multiple chart view
      sub.scrollSeries = [];
      // Default to the first set of (12) series to display
      sub.scrollIndex = 0;
      if (sub.series) {
        const displaySeries = this.getDisplaySeries(sub.series, this.categoryData[cacheId].currentFreq.freq);
        if (displaySeries) {
          sub.displaySeries = displaySeries;
          sub.noData = false;
          let seriesGroup = [];
          sub.paginatedSeriesStartIndex = 0;
          sub.paginatedSeriesEndIndex = 8;
          sub.totalSeries = sub.displaySeries.length;
          sub.displaySeries.forEach((series, s) => {
            seriesGroup.push(series);
            if (seriesGroup.length === 8 || s === sub.displaySeries.length - 1) {
              sub.scrollSeries.push(seriesGroup);
              seriesGroup = [];
            }
            const decimals = series.decimals ? series.decimals : 1;
            series['categoryDisplay'] = this._helper.dataTransform(series.seriesInfo.seriesObservations, sub.dateArray, decimals);
            if (s === sub.displaySeries.length - 1) {
              sub.requestComplete = true;
            }
          });
          //sub.requestComplete = true;
        }
        if (!displaySeries) {
          this.setNoData(sub);
        }
      }
      if (!sub.series && !sub.isHeader) {
        this.setNoData(sub);
      }
      if (sub.isHeader) {
        sub.requestComplete = true;
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
        let start, end;
        if (sub.current.geo === currentGeo.hanlde && sub.current.freq === currentFreq.freq) {
          start = sub.current.observationStart.substr(0, 10);
          end = sub.current.observationEnd.substr(0, 10);
        }
        const freq = sub.freqs.find(f => f.freq === currentFreq.freq);
        start = freq ? freq.observationStart.substr(0, 10) : sub.freqs[0].observationStart.substr(0, 10);
        end = freq ? freq.observationEnd.substr(0, 10) : sub.freqs[0].observationEnd.substr(0, 10);
        if (start < categoryDateWrapper.firstDate || categoryDateWrapper.firstDate === '') {
          categoryDateWrapper.firstDate = start;
        }
        if (end > categoryDateWrapper.endDate || categoryDateWrapper.endDate === '') {
          categoryDateWrapper.endDate = end;
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
      return observableOf([this.categoryData[cacheId]]);
    } else {
      let obsEnd, obsStart;
      this.categoryData[cacheId] = <CategoryData>{};
      if (routeGeo && routeFreq) {
        this._uheroAPIService.fetchPackageSearch(search, routeGeo, routeFreq).subscribe((results) => {
          const routeGeoExists = results.geos.find(geo => geo.handle === routeGeo);
          const routeFreqExists = results.freqs.find(freq => freq.freq === routeFreq);
          const defaultGeo = results.defaultGeo.handle;
          const defaultFreq = results.defaultFreq.freq;
          obsStart = results.observationStart;
          obsEnd = results.observationEnd;
          if (routeFreqExists && routeGeoExists) {
            this.getSearchData(results, cacheId, search, routeGeo, routeFreq);
          }
          if (!routeFreqExists || !routeGeoExists) {
            this.getSearchWithDefaults(search, cacheId);
          }
        });
      }
      if (!routeGeo || !routeFreq) {
        this.getSearchWithDefaults(search, cacheId);
      }
      return observableForkJoin(observableOf(this.categoryData[cacheId]));
    }
  }

  getSearchWithDefaults(search, cacheId) {
    this._uheroAPIService.fetchPackageSearch(search, '', '').subscribe((results) => {
      const geo = results.defaultGeo.handle;
      const freq = results.defaultFreq.freq;
      this.getSearchData(results, cacheId, search, geo, freq);
    });
  }

  getSearchData(results, cacheId, search, geo, freq) {
    if (results.observationStart && results.observationEnd) {
      const categoryDateWrapper = { firstDate: '', endDate: '' };
      this.categoryData[cacheId].selectedCategory = 'Search: ' + search;
      this.categoryData[cacheId].regions = results.geos;
      this.categoryData[cacheId].currentGeo = results.geos.find(g => g.handle === geo);
      this.categoryData[cacheId].frequencies = results.freqs;
      this.categoryData[cacheId].currentFreq = results.freqs.find(f => f.freq === freq);
      const displaySeries = this.getDisplaySeries(results.series, freq);
      const sublist = {
        id: 'search',
        parentName: 'Search',
        name: search,
        displaySeries: displaySeries,
        requestComplete: false
      };
      const catWrapper = this.getSearchDates(displaySeries);
      const categoryDateArray = [];
      this._helper.createDateArray(catWrapper.firstDate, catWrapper.endDate, freq, categoryDateArray);
      this.formatCategoryData(displaySeries, categoryDateArray, catWrapper);
      this.categoryData[cacheId].subcategories = [sublist];
      this.categoryData[cacheId].categoryDateWrapper = categoryDateWrapper;
      this.categoryData[cacheId].categoryDates = categoryDateArray;
      this.categoryData[cacheId].requestComplete = true;
      sublist.requestComplete = true;
    }
    if (!results.observationStart || !results.observationEnd) {
      this.categoryData[cacheId].invalid = search;
    }
  }

  getSearchDates(displaySeries) {
    const categoryDateWrapper = { firstDate: '', endDate: '' };
    displaySeries.forEach((series) => {
      if (series.seriesInfo.seriesObservations.observationStart < categoryDateWrapper.firstDate || categoryDateWrapper.firstDate === '') {
        categoryDateWrapper.firstDate = series.seriesInfo.seriesObservations.observationStart;
      }
      if (series.seriesInfo.seriesObservations.observationEnd > categoryDateWrapper.endDate || categoryDateWrapper.endDate === '') {
        categoryDateWrapper.endDate = series.seriesInfo.seriesObservations.observationEnd;
      }
    });
    return categoryDateWrapper;
  }

  filterSeriesResults(results: Array<any>, freq: string) {
    const filtered = [];
    results.forEach((res) => {
      const levelData = res.seriesObservations.transformationResults[0].dates;
      if (levelData) {
        let series = { seriesInfo: { displayName: '' } };
        res.saParam = res.seasonalAdjustment !== 'not_seasonally_adjusted';
        series.seriesInfo = res;
        series.seriesInfo.displayName = res.title;
        filtered.push(series);
      }
    });
    return filtered
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
    return filtered.length ? filtered : null;
  }

  formatCategoryData(displaySeries: Array<any>, dateArray: Array<any>, dateWrapper: DateWrapper) {
    displaySeries.forEach((series) => {
      if (series.seriesInfo !== 'No data available') {
        const decimals = series.decimals ? series.decimals : 1;
      }
    });
  }
}
