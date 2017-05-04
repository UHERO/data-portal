// Set up data used in category chart and table displays
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';

import { UheroApiService } from './uhero-api.service';
import { HelperService } from './helper.service';
import { CategoryData } from './category-data';
import { Frequency } from './frequency';
import { Geography } from './geography';
import { DateWrapper } from './date-wrapper';
import { DisplaySeries } from './display-series';

@Injectable()
export class CategoryHelperService {
  private errorMessage: string;
  // Variables for geo and freq selectors
  private defaults;
  private defaultFreq: string;
  private defaultGeo: string;
  private categoryData = [];
  private categoryDates = [];
  private seriesDates = [];
  private series = [];

  constructor(private _uheroAPIService: UheroApiService, private _helper: HelperService) { }

  // Called on page load
  // Gets data sublists available for a selected category
  initContent(catId: number, routeGeo?: string, routeFreq?: string): Observable<any> {
    if (this.categoryData[catId]) {
      return Observable.of([this.categoryData[catId + routeGeo + routeFreq]]);
    } else {
      this.categoryData[catId + routeGeo + routeFreq] = <CategoryData>{};
      this._uheroAPIService.fetchCategories().subscribe((categories) => {
        const cat = categories.find(category => category.id === catId);
        if (cat) {
          const selectedCategory = cat.name;
          const sublist = cat.children;
          if (cat.defaults) {
            this.defaultFreq = cat.defaults.freq;
            this.defaultGeo = cat.defaults.geo;
          } else {
            this.defaultFreq = '';
            this.defaultGeo = '';
          }
          this.categoryData[catId + routeGeo + routeFreq].selectedCategory = selectedCategory;
          this.categoryData[catId + routeGeo + routeFreq].sublist = sublist;
          this.getSubcategoryData(selectedCategory, catId, sublist, routeGeo, routeFreq);
        } else {
          this.categoryData[catId + routeGeo + routeFreq].invalid = 'Category does not exist.';
        }
      });
      return Observable.forkJoin(Observable.of(this.categoryData[catId + routeGeo + routeFreq]));
    }
  }

  getSubcategoryData(catName: string, catId: number, sublist: Array<any>, routeGeo?: string, routeFreq?: string) {
    const geoArray = [], freqArray = [];
    sublist.forEach((sub, index) => {
      // Get all regions available in a given category
      this._uheroAPIService.fetchSelectedCategory(sub.id).subscribe((category) => {
        let freqGeos, geoFreqs;
        freqGeos = category.freqGeos;
        geoFreqs = category.geoFreqs;
        geoFreqs.forEach((geo) => {
          this._helper.uniqueGeos(geo, geoArray);
        });
        freqGeos.forEach((freq) => {
          this._helper.uniqueFreqs(freq, freqArray);
        });
      },
        (error) => {
          error = this.errorMessage = error;
        },
        () => {
          if (index === sublist.length - 1) {
            sublist.forEach((subcat) => {
              const dateWrapper = <DateWrapper>{};
              const selectedFreq = routeFreq ? routeFreq : this.defaultFreq ? this.defaultFreq : freqArray[0].freq;
              const selectedGeo = routeGeo ? routeGeo : this.defaultGeo ? this.defaultGeo : geoArray[0].handle;
              let freqs, regions, currentGeo, currentFreq;
              // Get frequencies available for a selected region
              freqs = geoArray.find(geo => geo.handle === selectedGeo).freqs;
              regions = freqArray.find(freq => freq.freq === selectedFreq).geos;
              currentGeo = regions.find(region => region.handle === selectedGeo);
              currentFreq = freqs.find(freq => freq.freq === selectedFreq);
              this.categoryData[catId + routeGeo + routeFreq].regions = regions;
              this.categoryData[catId + routeGeo + routeFreq].frequencies = freqs;
              this.categoryData[catId + routeGeo + routeFreq].currentGeo = currentGeo;
              this.categoryData[catId + routeGeo + routeFreq].currentFreq = currentFreq;
              subcat.parentName = catName;
              this.getSeriesData(subcat, currentGeo, currentFreq, dateWrapper);
            });
          }
        });
    });
  }

  // Get regions and frequencies available for a selected category
  getSeriesData(sublist, currentGeo: Geography, currentFreq: Frequency, dateWrapper) {
    const saDateArray = [], nsaDateArray = [];
    let expandedResults;
    this._uheroAPIService.fetchExpanded(sublist['id'], currentGeo.handle, currentFreq.freq).subscribe((expanded) => {
      expandedResults = expanded;
    },
      (error) => {
        console.log('error', error);
        error = this.errorMessage = error;
      },
      () => {
        if (expandedResults) {
          // Get array of all series that have level data available
          const categorySeries = this.filterSeriesResults(expandedResults, currentFreq.freq);
          const splitSeries = this.getDisplaySeries(categorySeries, dateWrapper, currentFreq.freq);
          sublist.dateRange = splitSeries.catTable.tableDates;
          sublist.datatables = splitSeries.catTable.datatables;
          sublist.displaySeries = splitSeries.displaySeries;
          sublist.allSeries = categorySeries;
          sublist.hasSeaonsallyAdjusted = splitSeries.hasSeasonallyAdjusted;
          sublist.dateWrapper = splitSeries.dateWrapper;
          sublist.noData = false;
        } else {
          // No series exist for a subcateogry
          const series = [{ seriesInfo: 'No data available' }];
          sublist.dateWrapper = <DateWrapper>{};
          sublist.dateRange = [];
          sublist.datatables = {};
          sublist.displaySeries = series;
          sublist.noData = true;
        }
      });
  }

  // Set up search results
  initSearch(search: string, routeGeo?: string, routeFreq?: string): Observable<any> {
    if (this.categoryData[search + routeGeo + routeFreq]) {
      return Observable.of([this.categoryData[search + routeGeo + routeFreq]]);
    } else {
      let obsEnd, obsStart, freqGeos, geoFreqs;
      this.categoryData[search + routeGeo + routeFreq] = <CategoryData>{};
      this._uheroAPIService.fetchSearch(search).subscribe((results) => {
        this.defaults = results.defaults;
        freqGeos = results.freqGeos;
        geoFreqs = results.geoFreqs;
        obsEnd = results.observationEnd;
        obsStart = results.observationStart;
      },
        (error) => {
          error = this.errorMessage = error;
        },
        () => {
          if (obsEnd && obsStart) {
            const dateWrapper = <DateWrapper>{};
            this.searchSettings(search, dateWrapper, geoFreqs, freqGeos, routeGeo, routeFreq);
            this.categoryData[search + routeGeo + routeFreq].selectedCategory = 'Search: ' + search;
          } else {
            this.categoryData[search + routeGeo + routeFreq].invalid = search;
          }
        });
      return Observable.forkJoin(Observable.of(this.categoryData[search + routeGeo + routeFreq]));
    }
  }

  searchSettings(search: string, dateWrapper: DateWrapper, geoFreqs, freqGeos, routeGeo?: string, routeFreq?: string) {
    const dateArray = [];
    const selectedFreq = routeFreq ? routeFreq : this.defaults.freq.freq;
    const selectedGeo = routeGeo ? routeGeo : this.defaults.geo.handle;
    let freqs, regions, currentFreq, currentGeo;
    freqs = geoFreqs.find(geo => geo.handle === selectedGeo).freqs;
    regions = freqGeos.find(freq => freq.freq === selectedFreq).geos;

    if (selectedGeo) {
      currentGeo = regions.find(region => region.handle === selectedGeo);
    } else {
      currentGeo = regions[0];
    }

    if (selectedFreq) {
      currentFreq = freqs.find(freq => freq.freq === selectedFreq);
    } else {
      currentFreq = freqs[0];
    }
    this.categoryData[search + routeGeo + routeFreq].regions = regions;
    this.categoryData[search + routeGeo + routeFreq].currentGeo = currentGeo;
    this.categoryData[search + routeGeo + routeFreq].frequencies = freqs;
    this.categoryData[search + routeGeo + routeFreq].currentFreq = currentFreq;
    this.getSearchData(search, currentGeo.handle, currentFreq.freq, dateWrapper, routeGeo, routeFreq);
  }

  getSearchData(search: string, geo: string, freq: string, dateWrapper: DateWrapper, routeGeo?: string, routeFreq?: string) {
    let searchResults;
    // Get expanded search results for a selected region & frequency
    this._uheroAPIService.fetchSearchSeriesExpand(search, geo, freq).subscribe((searchRes) => {
      searchResults = searchRes;
    },
      (error) => {
        error = this.errorMessage = error;
      },
      () => {
        if (searchResults) {
          // Get array of all series that have level data available
          const searchSeries = this.filterSeriesResults(searchResults, freq);
          const splitSeries = this.getDisplaySeries(searchSeries, dateWrapper, freq);
          const sublist = {
            name: search,
            dateWrapper: splitSeries.dateWrapper,
            dateRange: splitSeries.catTable.tableDates,
            datatables: splitSeries.catTable.datatables,
            hasSeaonsallyAdjusted: splitSeries.hasSeasonallyAdjusted,
            displaySeries: splitSeries.displaySeries
          };
          this.categoryData[search + routeGeo + routeFreq].sublist = [sublist];
        };
      });
  }

  filterSeriesResults(results: Array<any>, freq: string) {
    const filtered = [];
    results.forEach((res) => {
      let seriesDates = [], series;
      const seriesObsStart = res.seriesObservations.observationStart;
      const seriesObsEnd = res.seriesObservations.observationEnd;
      const levelData = res.seriesObservations.transformationResults[0].observations;
      // Add series if level data is available
      if (levelData) {
        seriesDates = this._helper.calculateDateArray(seriesObsStart, seriesObsEnd, freq, seriesDates);
        series = this._helper.dataTransform(res.seriesObservations, seriesDates);
        series.seriesInfo = res;
        series.seriesInfo.saParam = res.seasonalAdjustment === 'seasonally_adjusted' ? true : false;
        filtered.push(series);
      }
    });
    return filtered;
  }

  checkSA(seriesArray) {
    const saSeries = seriesArray.find(series => series.seriesInfo.seasonalAdjustment === 'seasonally_adjusted');
    return saSeries ? true : false;
  }

  getDisplaySeries(allSeries, dateWrapper: DateWrapper, freq) {
    const dateArray = [];
    // Check if (non-annual) category has seasonally adjusted data
    // Returns true for annual data
    const hasSeasonallyAdjusted = this.checkSA(allSeries);
    const displaySeries = [];
    allSeries.forEach((series) => {
      if (series.seriesInfo.seasonalAdjustment !== 'not_seasonally_adjusted' || hasSeasonallyAdjusted === false) {
        // only include series with seasonal adjustment or where seasonality is not applicable
        displaySeries.push(series);
      }
    });
    this._helper.setDateWrapper(displaySeries, dateWrapper);
    this._helper.calculateDateArray(dateWrapper.firstDate, dateWrapper.endDate, freq, dateArray);
    const catTable = this.formatCatTableData(displaySeries, dateArray, dateWrapper);

    return {
      displaySeries: displaySeries,
      dateWrapper: dateWrapper,
      catTable: catTable,
      hasSeasonallyAdjusted: hasSeasonallyAdjusted
    };
  }

  formatCatTableData(displaySeries: Array<any>, dateArray: Array<any>, dateWrapper: DateWrapper) {
    displaySeries.forEach((series) => {
      series['categoryTable'] = this._helper.catTable(series.tableData, dateArray, dateWrapper);
    });
    const tableHeaderDates = [];
    const dateStart = dateWrapper.firstDate;
    const dateEnd = dateWrapper.endDate;
    dateArray.forEach((date) => {
      tableHeaderDates.push(date.tableDate);
    });
    // Using datatables library for exporting functionality
    const datatables = this._helper.sublistTable(displaySeries, dateWrapper, tableHeaderDates);
    return { tableDates: tableHeaderDates, datatables: datatables };
  }
}
