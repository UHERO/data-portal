import { of as observableOf, Observable, forkJoin, of } from 'rxjs';
// Set up data used in category chart and table displays
import { Injectable, Inject } from '@angular/core';
import { ApiService } from './api.service';
import { HelperService } from './helper.service';
import { CategoryData } from '../models/CategoryData';
import { DateWrapper } from '../models/DateWrapper';
import { Geography } from '../models/Geography';
import { Frequency } from '../models/Frequency';
import { DateRange } from '../models/DateRange';
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
  initContent = (catId: any, noCache: boolean, routeParams: any): Observable<any> => {
    const cacheId = this.helperService.setCacheId(catId, routeParams);
    if (this.categoryData.hasOwnProperty(cacheId)) {
      this.updateSelectors(this.categoryData[cacheId], this.portal.universe);
    }
    if (!this.categoryData.hasOwnProperty(cacheId)) {
      this.categoryData[cacheId] = {};
      (typeof catId === 'number' || catId === null) ?
        this.getCategoryData(this.categoryData[cacheId], noCache, catId, routeParams) :
        this.initSearch(this.categoryData[cacheId], noCache, catId);
    }
    return observableOf([this.categoryData[cacheId]]);
  }

  getCategoryData(cachedCategoryData: any, noCache: boolean, catId: any, routeParams: any) {
    this.apiService.fetchCategories().pipe(
      tap(categories => {
        const { dataListIdParam } = routeParams;
        this.findCategoryAndStoreDataLists(categories, catId, dataListIdParam, cachedCategoryData);
      }),
      switchMap(() => {
        const { id: selectedDataListId } = cachedCategoryData.selectedDataList;
        const { universe } = this.portal;
        return forkJoin([
          universe !== 'nta' ? this.apiService.fetchCategoryGeos(selectedDataListId) : of(null),
          universe !== 'nta' ? this.apiService.fetchCategoryFreqs(selectedDataListId) : of(null),
          universe === 'fc' ? this.apiService.fetchCategoryForecasts(selectedDataListId) : of(null),
          universe === 'nta' ? this.apiService.fetchCategoryMeasurements(selectedDataListId, noCache) : of(null)
        ]);
      }),
      switchMap(([geos, freqs, forecasts, measurements]) => {
        if (this.portal.universe !== 'nta') {
          this.setCategorySelectorData(cachedCategoryData, routeParams, geos, freqs, forecasts);
          const { currentGeo: categoryGeo, currentFreq: categoryFreq } = cachedCategoryData;
          // For UHERO Forecast portals
          if (this.portalSettings.selectors.includes('forecast')) {
            cachedCategoryData.forecasts = forecasts || [];
            const defaultFc = (cachedCategoryData.selectedDataList.defaults?.fc) || (cachedCategoryData.forecasts && cachedCategoryData.forecasts[0]);
            let routeFcExists;
            if (routeParams.fc) {
              routeFcExists = cachedCategoryData.forecasts.find(fc => fc === routeParams.fc);
            }
            const categoryFc = routeFcExists ? routeParams.fc : defaultFc;
            cachedCategoryData.currentForecast = forecasts.find(fc => fc === categoryFc);
            this.helperService.updateCurrentForecast(cachedCategoryData.currentForecast);
            return this.apiService.fetchExpanded(cachedCategoryData.selectedDataList.id, categoryGeo.handle, categoryFreq.freq, noCache, categoryFc);
          }
          return this.apiService.fetchExpanded(cachedCategoryData.selectedDataList.id, categoryGeo.handle, categoryFreq.freq, noCache);  
        }
        if (measurements) {
          const { selectedMeasure } = routeParams;
          cachedCategoryData.currentFreq = { freq: 'A', label: 'Annual' };
          cachedCategoryData.measurements = measurements;
          cachedCategoryData.currentMeasurement = this.findSelectedMeasurement(cachedCategoryData, selectedMeasure);
          return this.apiService.fetchMeasurementSeries(cachedCategoryData.currentMeasurement.id, noCache);
        }
      }),
    ).subscribe((data: any) => {
      this.portal.universe === 'nta' ?
        this.processSeriesData(data, cachedCategoryData, 'c5ma', true) :
        this.processSeriesData(data, cachedCategoryData, 'ytd', false);
    });
  }

  updateSelectors(cachedCategoryData: any, portal: string) {
    const {
      updateCurrentFrequency,
      updateCurrentForecast,
      updateCurrentGeography,
    } = this.helperService;
    if (portal !== 'nta') {
      updateCurrentGeography(cachedCategoryData.currentGeo);
    }
    if (portal === 'forecast') {
      updateCurrentForecast(cachedCategoryData.currentForecast);
    }
    updateCurrentFrequency(cachedCategoryData.currentFreq);
  }

  setNoCategoryData(cachedCategoryData: any) {
    cachedCategoryData.noData = true;
    cachedCategoryData.requestComplete = true;
  }

  setCategorySeriesAndDates(seriesData: Array<any>, cachedCategoryData: any, transformationForGrid: string, findMinMax: boolean) {
    const { universe } = this.portal;
    const displaySeries = this.filterSeriesResults(seriesData, universe);
    const dateWrapper = this.helperService.setDateWrapper(displaySeries);
    const { firstDate, endDate } = dateWrapper;
    const categoryDates = this.helperService.createDateArray(firstDate, endDate, cachedCategoryData.currentFreq.freq, []);
    const displayedMeasurements = {}
    displaySeries.forEach((series) => {
      series.observations = this.helperService.formatSeriesForCharts(series);
      series.gridDisplay = this.helperService.formatGridDisplay(series, 'lvl', transformationForGrid);
      if (displayedMeasurements[series.measurementName]) {
        displayedMeasurements[series.measurementName].push(series);
      }
      if (!displayedMeasurements[series.measurementName]) {
        displayedMeasurements[series.measurementName] = [series];
      }
    });
    const measurementOrder = [...new Set(displaySeries.map(series => series.measurementName))];
    cachedCategoryData.measurementOrder = measurementOrder;
    cachedCategoryData.displayedMeasurements = Object.keys(displayedMeasurements).length ? displayedMeasurements : null;
    cachedCategoryData.dateWrapper = dateWrapper;
    cachedCategoryData.displayDateSlider = firstDate !== '1-01-01' && endDate !== '1-01-01';
    cachedCategoryData.categoryDates = categoryDates;
    cachedCategoryData.hasSeasonal = this.findSeasonalSeries(displaySeries);
    cachedCategoryData.findMinMax = findMinMax;
    cachedCategoryData.requestComplete = true;
  }

  processSeriesData(seriesData: Array<any>, cachedCategoryData: any, transformation: string, findMinMax: boolean) {
   /* const seriesHasNoValues = seriesData.every((series) => {
      const { seriesObservations } = series;
      const { observationEnd, observationStart } = seriesObservations;
      return observationEnd === '1-01-01' || observationStart === '1-01-01';
    }); */
    if (seriesData?.length /*&& !seriesHasNoValues*/) {
      this.setCategorySeriesAndDates(seriesData, cachedCategoryData, transformation, findMinMax);
    }
    if (!seriesData || !seriesData.length /*|| seriesHasNoValues*/) {
      this.setNoCategoryData(cachedCategoryData);
    }
  }

  checkRouteGeoAndFreqExist = (regions: Array<Geography>, freqs: Array<Frequency>, routeGeo: string, routeFreq: string) => {
    return regions.find(region => region.handle === routeGeo) && freqs.find(frequency => frequency.freq === routeFreq) ? true : false;
  }

  findCategoryAndStoreDataLists(portalCategories: Array<any>, selectedCatId: number, datalistId: number, cachedCategoryData: any) {
    // default to first category if one isn't selected
    selectedCatId = selectedCatId || portalCategories[0].id;
    const category = portalCategories.find(c => c.id === selectedCatId);  
    if (category) {
      const { children: categoryDataLists } = category;
      const selectedDataList = datalistId ?
        this.helperService.findSelectedDataList(categoryDataLists, datalistId, '') :
        this.helperService.getCategoryDataLists(categoryDataLists[0], '');
      cachedCategoryData.selectedDataList = selectedDataList;
      cachedCategoryData.selectedCategory = category;
      cachedCategoryData.subcategories = categoryDataLists;
    }
    if (!category) {
      cachedCategoryData.invalid = 'Category does not exist.';
      cachedCategoryData.requestComplete = true;
    }
  }

  setCategorySelectorData(cachedCategoryData, routeParams, geos, freqs, forecasts) {
    // fallback if defaults are not specified in Udaman
    const defaults = cachedCategoryData.selectedDataList.defaults || { geo: '', freq: '' };
    let { geo: defaultGeo, freq: defaultFreq } = defaults;
    const { geo: routeGeo, freq: routeFreq } = routeParams;
    cachedCategoryData.regions = geos || [defaultGeo];
    cachedCategoryData.frequencies = freqs || [defaultFreq];
    const { regions, frequencies } = cachedCategoryData;
    const useRouteGeoAndFreq = this.checkRouteGeoAndFreqExist(regions, frequencies, routeGeo, routeFreq);
    // If no default set in Udaman, fall back to first geo/freq available
    defaultFreq = defaultFreq || frequencies[0];
    defaultGeo = defaultGeo || regions[0];
    const categoryFreq = useRouteGeoAndFreq ? routeFreq : defaultFreq.freq;
    const categoryGeo = useRouteGeoAndFreq ? routeGeo : defaultGeo.handle;
    // Fall back if the default geo/freq set in Udaman is not available for the selected category
    cachedCategoryData.currentFreq = frequencies.find(f => f.freq === categoryFreq) || frequencies[0];
    cachedCategoryData.currentGeo = regions.find(r => r.handle === categoryGeo) || regions[0];
    this.helperService.updateCurrentFrequency(cachedCategoryData.currentFreq);
    this.helperService.updateCurrentGeography(cachedCategoryData.currentGeo);
  }

  // Set up search results
  initSearch(cachedCategoryData, noCache: boolean, search: string) {
    this.apiService.fetchSearchSeries(search, noCache).subscribe((results) => {
      cachedCategoryData.searchResults = results;
      cachedCategoryData.selectedCategory = { id: search, name: `Search ${search}` };
      cachedCategoryData.requestComplete = true;
      cachedCategoryData.noData = !results;// ? true : false;
      cachedCategoryData.invalid = !results ? `No results found for ${search}` : false;
    });
  }

  filterSeriesResults = (results: Array<any>, universe: string) => {
    return results.map((res) => {
      const { dates: levelDates } = res.seriesObservations?.transformationResults[0];
      if (levelDates) {
        res.saParam = res.seasonalAdjustment === 'seasonally_adjusted';
        res.displayName = universe === 'nta' ? res.geography.name : res.title;
        return res;
      }
    });
  }

  findSeasonalSeries = (categorySeries: Array<any>) => categorySeries.some(s => s.seasonalAdjustment === 'seasonally_adjusted');

  findSelectedMeasurement = (cachedCategoryData, selectedMeasure: string) => {
    const { measurements } = cachedCategoryData;
    return measurements.find(m => selectedMeasure ? m.name === selectedMeasure : m.name === 'Region');
  }
}
