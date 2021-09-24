import { forkJoin as observableForkJoin, of as observableOf, Observable, forkJoin, of, EMPTY } from 'rxjs';
// Set up data used in category chart and table displays
import { Injectable, Inject } from '@angular/core';
import { ApiService } from './api.service';
import { HelperService } from './helper.service';
import { CategoryData, DateWrapper, Geography, Frequency } from './tools.models';
import { switchMap, tap } from 'rxjs/operators';
import { DataPortalSettingsService } from './data-portal-settings.service';

@Injectable({
  providedIn: 'root'
})
export class CategoryHelperService {
  // Variables for geo and freq selectors
  private categoryData = {};
  private portalSettings;

  constructor(
    @Inject('portal') public portal,
    private apiService: ApiService,
    private helperService: HelperService,
    private portalSettingsService: DataPortalSettingsService
  ) {
    this.portalSettings = this.portalSettingsService.dataPortalSettings[this.portal.universe];
  }
  
  // Called on page load
  // Gets data sublists available for a selected category
  initContent = (catId: any, noCache: boolean, routeParams): Observable<any> => {
    const cacheId = this.helperService.setCacheId(catId, routeParams);
    if (this.categoryData[cacheId]) {
      this.helperService.updateCurrentFrequency(this.categoryData[cacheId].currentFreq);
      this.helperService.updateCurrentGeography(this.categoryData[cacheId].currentGeo);
      if (this.portalSettings.selectors.includes('forecast')) {
        this.helperService.updateCurrentForecast(this.categoryData[cacheId].currentForecast);
      }
    }
    if (!this.categoryData[cacheId] && typeof catId === 'number' || catId === null) {
      this.getCategoryData(cacheId, catId, noCache, routeParams);
    }
    if (!this.categoryData[cacheId] && typeof catId === 'string') {
      this.initSearch(cacheId, noCache, catId);
    }
    return observableOf([this.categoryData[cacheId]]);
  }

  getCategoryData(cacheId: string, catId: number, noCache: boolean, routeParams) {
    this.categoryData[cacheId] = {} as CategoryData;
    this.apiService.fetchCategories().pipe(
      tap(categories => {
        catId = catId || categories[0].id;
        const cat = categories.find(category => category.id === catId);
        if (cat) {
          const { dataListId } = routeParams;
          this.setCategoryDataList(cat, dataListId, cacheId);
        } else {
          this.categoryData[cacheId].invalid = 'Category does not exist.';
          this.categoryData[cacheId].requestComplete = true;
        }
      }),
      switchMap(() => {
        return forkJoin([
          this.apiService.fetchCategoryGeos(this.categoryData[cacheId].selectedDataList.id),
          this.apiService.fetchCategoryFreqs(this.categoryData[cacheId].selectedDataList.id),
          this.portalSettings.selectors.includes('forecast') ? this.apiService.fetchCategoryForecasts(this.categoryData[cacheId].selectedDataList.id) : of(null)
        ]);
      }),
      switchMap(([geos, freqs, forecasts]) => {
        const { defaults } = this.categoryData[cacheId].selectedDataList;
        const { geo, freq } = routeParams;
        this.categoryData[cacheId].regions = geos || [defaults.geo];
        this.categoryData[cacheId].frequencies = freqs || [defaults.freq];
        const { regions, frequencies } = this.categoryData[cacheId];
        const useRouteGeoAndFreq = this.checkRouteGeoAndFreqExist(regions, frequencies, geo, freq);
        const defaultFreq = defaults?.freq || frequencies[0];
        const defaultGeo = defaults?.geo || regions[0];
        const categoryGeo = useRouteGeoAndFreq ? geo : defaultGeo.handle;
        const categoryFreq = useRouteGeoAndFreq ? freq : defaultFreq.freq;
        this.categoryData[cacheId].currentFreq = frequencies.find(frequency => frequency.freq === categoryFreq);
        this.categoryData[cacheId].currentGeo = regions.find(region => region.handle === categoryGeo);
        this.helperService.updateCurrentFrequency(this.categoryData[cacheId].currentFreq);
        this.helperService.updateCurrentGeography(this.categoryData[cacheId].currentGeo);
        // For UHERO Forecast portals
        if (this.portalSettings.selectors.includes('forecast')) {
          this.categoryData[cacheId].forecasts = forecasts || [];
          const defaultFc = (this.categoryData[cacheId].selectedDataList.defaults?.fc) || (this.categoryData[cacheId].forecasts && this.categoryData[cacheId].forecasts[0]);
          let routeFcExists
          if (routeParams.fc) {
            routeFcExists = this.categoryData[cacheId].forecasts.find(fc => fc === routeParams.fc);
          }
          const categoryFc = routeFcExists ? routeParams.fc : defaultFc;
          this.categoryData[cacheId].currentForecast = forecasts.find(fc => fc === categoryFc);
          this.helperService.updateCurrentForecast(this.categoryData[cacheId].currentForecast);
          return this.apiService.fetchExpanded(this.categoryData[cacheId].selectedDataList.id, categoryGeo, categoryFreq, noCache, categoryFc);
        }
        return this.apiService.fetchExpanded(this.categoryData[cacheId].selectedDataList.id, categoryGeo, categoryFreq, noCache);
      }),
    ).subscribe((data: any) => {
      if (data) {
        const series = data;
        const dates = this.setCategoryDates(series, this.categoryData[cacheId].currentFreq.freq);
        const { categoryDates, categoryDateWrapper } = dates;
        this.categoryData[cacheId].sliderDates = this.helperService.getTableDates(categoryDates);
        this.categoryData[cacheId].categoryDateWrapper = categoryDateWrapper;
        this.categoryData[cacheId].categoryDates = categoryDates;
        series.forEach((serie) => {
          serie.observations = this.helperService.formatSeriesForCharts(serie);
          serie.gridDisplay = this.helperService.formatGridDisplay(serie, 'lvl', 'pc1');
        });
        const displaySeries = this.filterSeriesResults(series);
        this.categoryData[cacheId].displaySeries = displaySeries.length ? displaySeries : null;
        this.categoryData[cacheId].series = series;
        this.categoryData[cacheId].hasSeasonal = this.findSeasonalSeries(displaySeries);
        this.categoryData[cacheId].requestComplete = true;
        console.log(this.categoryData[cacheId])
      }
      if (!data || !data.length) {
        this.categoryData[cacheId].requestComplete = true;
        this.categoryData[cacheId].noData = true;
      }
    });
  }

  checkRouteGeoAndFreqExist = (regions: Array<Geography>, freqs: Array<Frequency>, routeGeo: string, routeFreq: string) => {
    return regions.find(region => region.handle === routeGeo) && freqs.find(frequency => frequency.freq === routeFreq) ? true : false;
  }

  setCategoryDataList (category: any, dataListId: number, cacheId: string) {
    const categoryDataLists = category.children;
    const selectedDataList = dataListId ?
      this.helperService.findSelectedDataList(categoryDataLists, dataListId, '') :
      this.helperService.getCategoryDataLists(categoryDataLists[0], ''); 
    this.categoryData[cacheId].selectedDataList = selectedDataList;
    this.categoryData[cacheId].selectedDataListName = selectedDataList.dataListName;
    this.categoryData[cacheId].selectedCategoryId = category.id;
    this.categoryData[cacheId].selectedCategory = category;
    this.categoryData[cacheId].subcategories = categoryDataLists;
    if (dataListId === null) {
      this.categoryData[cacheId].defaultDataList = selectedDataList.id;
    }
  }

  setCategoryDates = (series: Array<any>, currentFreq: string) => {
    const categoryDateWrapper = {} as DateWrapper;
    const categoryDateArray = [];
    // Check series for the earliest/latest start and end dates
    // Used to create array of dates for enitre category
    categoryDateWrapper.firstDate = this.helperService.findDateWrapperStart(series);
    categoryDateWrapper.endDate = this.helperService.fineDateWrapperEnd(series);
    this.helperService.createDateArray(categoryDateWrapper.firstDate, categoryDateWrapper.endDate, currentFreq, categoryDateArray);
    return { categoryDateWrapper, categoryDates: categoryDateArray };
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
  initSearch(cacheId: string, noCache: boolean, search: string) {
    this.categoryData[cacheId] = {};
    this.apiService.fetchSearchSeries(search, noCache).subscribe((results) => {
      this.categoryData[cacheId].searchResults = results;
      this.categoryData[cacheId].selectedCategory = { id: search, name: `Search ${search}` };
      this.categoryData[cacheId].requestComplete = true;
      this.categoryData[cacheId].noData = !results ? true : false;
      this.categoryData[cacheId].invalid = !results ? `No results found for ${search}` : false;
    });
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
