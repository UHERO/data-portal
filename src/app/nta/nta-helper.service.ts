import { forkJoin as observableForkJoin, of as observableOf, Observable } from 'rxjs';
// Set up data used in category chart and table displays
import { Injectable } from '@angular/core';
import { UheroApiService } from '../uhero-api.service';
import { HelperService } from '../helper.service';
import { CategoryData } from '../category-data';
import { DateWrapper } from '../date-wrapper';

@Injectable()
export class NtaHelperService {
  private errorMessage: string;
  // Variables for geo and freq selectors
  private defaults;
  private requestsRemain;
  private defaultFreq: string;
  private categoryData = {};

  static setCacheId(category, dataListId, selectedMeasure?) {
    let id = '' + category + dataListId;
    if (selectedMeasure) {
      id = id + selectedMeasure;
    }
    return id;
  }

  constructor(private _uheroAPIService: UheroApiService, private _helper: HelperService) { }

  // Called on page load
  // Gets data sublists available for a selected category
  initContent(catId: any, dataListId: number, selectedMeasure?: string): Observable<any> {
    const cacheId = NtaHelperService.setCacheId(catId, dataListId, selectedMeasure);
    if (this.categoryData[cacheId]) {
      return observableOf([this.categoryData[cacheId]]);
    }
    if (!this.categoryData[cacheId] && (typeof catId === 'number' || catId === null)) {
      this.getCategory(cacheId, catId, dataListId, selectedMeasure);
      return observableForkJoin(observableOf(this.categoryData[cacheId]));
    }
    if (!this.categoryData[cacheId] && typeof catId === 'string') {
      this.getSearch(cacheId, catId);
      return observableForkJoin(observableOf(this.categoryData[cacheId]));
    }
  }

  getCategory(cacheId: string, catId: any, dataListId, selectedMeasure?: string) {
    this.categoryData[cacheId] = <CategoryData>{};
    this._uheroAPIService.fetchCategories().subscribe((categories) => {
      if (catId === null) {
        catId = categories[0].id;
      }
      const cat = categories.find(category => category.id === catId);
      console.log('categories', categories)
      if (cat) {
        if (dataListId == null) {
          dataListId = cat.children[0].id;
          this.categoryData[cacheId].defaultDataList = dataListId;
        }
        const categoryDataLists = cat.children;
        console.log('categoryDataLists', categoryDataLists);
        const selectedDataList = dataListId ? this.findSelectedDataList(categoryDataLists, dataListId, '') : this.getCategoryDataLists(categoryDataLists[0], '');
        this.categoryData[cacheId].selectedDataList = selectedDataList.id;
        this.categoryData[cacheId].selectedDataListName = selectedDataList.dataListName;
        this.categoryData[cacheId].selectedCategory = cat.name;
        this.categoryData[cacheId].categoryId = cat.id;
        this.categoryData[cacheId].currentFreq = { freq: 'A', label: 'Annual' };
        const sublistCopy = [];
        categoryDataLists.forEach((sub) => {
          sub.parentName = cat.name;
          sublistCopy.push(Object.assign({}, sub));
        });
        this.categoryData[cacheId].sublist = sublistCopy;
        console.log('categoryData[cacheId]', this.categoryData[cacheId])
        this.getSubcategoryData(this.categoryData[cacheId], selectedMeasure);
      } else {
        this.categoryData[cacheId].invalid = 'Category does not exist.';
      }
    });
  }

  findSelectedDataList = (dataList, dataListId, dataListName) => {
    for (let i = 0; i < dataList.length; i++) {
      let name = dataListName || '';
      if (dataList[i].id === dataListId) {
        dataList[i].dataListName = `${name} ${dataList[i].name}`;
        return dataList[i];
      } else {
        if (dataList[i].children && Array.isArray(dataList[i].children)) {
          name += `${dataList[i].name} > `;
          const selected = this.findSelectedDataList(dataList[i].children, dataListId, name);
          if (selected) {
            return selected;
          }
        }
      }
    }
  }

  getCategoryDataLists = (category, dataListName) => {
    let name = dataListName || '';
    if (!category.children) {
      category.dataListName = `${name} ${category.name}`;
      return category;
    }
    if (category.children && Array.isArray(category.children)) {
      name += `${category.name} > `;
      return this.getCategoryDataLists(category.children[0], name);
    }
  }

  getSubcategoryData(category, selectedMeasure?: string) {
    this._uheroAPIService.fetchCategoryMeasurements(category.selectedDataList).subscribe((measures) => {
      category.measurements = measures;
    },
      (error) => {
        console.log('error fetching category measurements', error);
      },
      () => {
        this.findSelectedMeasurement(category, selectedMeasure);
        this.getSeriesData(category);
      });
    /* let subcategoryCount = category.sublist.length;
    category.sublist.forEach((sub, index) => {
      this._uheroAPIService.fetchCategoryMeasurements(sub.id).subscribe((measures) => {
        sub.measurements = measures;
      },
        (error) => {
          this.errorMessage = error;
        },
        () => {
          subcategoryCount--;
          if (subcategoryCount === 0) {
            category.sublist.forEach((subcategory) => {
              this.findSelectedMeasurement(subcategory, selectedMeasure);
            });
            this.getSeriesData(category);
          }
        });
    }); */
  }

  findSelectedMeasurement(sublist, selectedMeasure) {
    sublist.measurements.forEach((measurement) => {
      sublist.currentMeasurement = selectedMeasure ?
        sublist.measurements.find(m => m.name === selectedMeasure) :
        sublist.measurements.find(m => m.name === 'Region');
    });
  }

  // Get list of series belonging to each measurement
  getSeriesData(category) {
    const categoryDataArray = [];
    category.dateWrapper = { firstDate: '', endDate: '' };
    this._uheroAPIService.fetchMeasurementSeries(category.currentMeasurement.id).subscribe((series) => {
      if (series) {
        category.series = series;
        this.formatCategoryData(category, categoryDataArray, false);
      }
      if (!series) {
        category.noData = true;
      }
    },
      (error) => {
        console.log('error fetching measurement series', error);
      });
    /* category.sublist.forEach((sub, index) => {
      const sublistDateArray = [];
      sub.dateWrapper = { firstDate: '', endDate: '' };
      this._uheroAPIService.fetchMeasurementSeries(sub.currentMeasurement.id).subscribe((series) => {
        if (series) {
          sub.series = series;
          this.formatCategoryData(category, sub, sublistDateArray, false);
        }
        sub.id = sub.id.toString();
        if (!series) {
          sub.noData = true;
        }
      },
        (error) => {
          this.errorMessage = error;
        });
    }); */
  }

  getSearch(cacheId, catId) {
    this.categoryData[cacheId] = <CategoryData>{};
    let freqGeos, freqs, obsEnd, obsStart;
    this._uheroAPIService.fetchSearch(catId).subscribe((results) => {
      console.log('results', results)
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
          const dateWrapper = <DateWrapper>{};
          this.getSearchData(catId, cacheId, dateWrapper);
          this.categoryData[cacheId].currentFreq = freqGeos ? freqGeos[0] : freqs[0];
          this.categoryData[cacheId].selectedCategory = 'Search: ' + catId;
        } else {
          this.categoryData[cacheId].invalid = catId;
        }
      });
  }

  getSearchData(search: string, cacheId, dateWrapper: DateWrapper) {
    let searchResults;
    // Get series for a requested search term
    this._uheroAPIService.fetchSearchSeries(search).subscribe((searchRes) => {
      searchResults = searchRes;
    },
      (error) => {
        this.errorMessage = error;
      },
      () => {
        if (searchResults) {
          const searchSeries = [];
          this.getSearchObservations(searchResults, search, this.categoryData[cacheId]);
        }
      });
  }

  // Get observations for series in search results
  getSearchObservations(searchSeries, search, category) {
    let seriesTotal = searchSeries.length;
    searchSeries.forEach((series) => {
      this._uheroAPIService.fetchObservations(series.id).subscribe((obs) => {
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
            category.series = searchSeries
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
          id: series.measurementId ? series.measurementId : 'null',
          name: series.measurementName ? series.measurementName : ' ',
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
  formatCategoryData(category, subcategoryDateArray: Array<any>, search: Boolean) {
    const dateWrapper = category.dateWrapper;
    category.displaySeries = this.filterSeries(category.series, category, search);
    category.dateArray = this._helper.createDateArray(dateWrapper.firstDate, dateWrapper.endDate, 'A', subcategoryDateArray);
    category.sliderDates = this._helper.getTableDates(category.dateArray);
    category.findMinMax = true;
    console.log(category)
    category.requestComplete = true;
    /* subcategory.displaySeries.forEach((series, s) => {
      //series['categoryDisplay'] = this._helper.dataTransform(series.seriesInfo.seriesObservations);
      if (s === subcategory.displaySeries.length - 1) {
        subcategory.requestComplete = true;
        console.log(category)
        category.requestComplete = true;
      }
    }); */
    if (category.sublist) {
      category.sublist.forEach((sub) => {
        this.initContent(sub.parentId, sub.id, category.currentMeasurement.name);
      });  
    }
    console.log('categoryData', this.categoryData)
  }

  getGeoName(series, geoHandle: string) {
    let geographies;
    this._uheroAPIService.fetchGeographies().subscribe((geos) => {
      geographies = geos;
    },
      (error) => {
        this.errorMessage = error;
      },
      () => {
        const geo = geographies.find(geos => geos.handle === geoHandle);
        series.title = geo ? geo.name : geoHandle;
      });
  }

  filterSeries(seriesArray: Array<any>, category, search: Boolean) {
    const filtered = [];
    seriesArray.forEach((res) => {
      let seriesDates = [], series;
      const levelData = res.seriesObservations.transformationResults[0].observations;
      const newLevelData = res.seriesObservations.transformationResults[0].dates;
      const decimals = res.decimals ? res.decimals : 1;
      // Add series if level data is available
      if (levelData || newLevelData) {
        const seriesObsStart = res.seriesObservations.observationStart;
        const seriesObsEnd = res.seriesObservations.observationEnd;
        category.dateWrapper.firstDate = this.setStartDate(category.dateWrapper, seriesObsStart);
        category.dateWrapper.endDate = this.setEndDate(category.dateWrapper, seriesObsEnd);
        seriesDates = this._helper.createDateArray(seriesObsStart, seriesObsEnd, 'A', seriesDates);
        series = this._helper.dataTransform(res.seriesObservations);
        res.saParam = res.seasonalAdjustment === 'seasonally_adjusted';
        series.seriesInfo = res;
        series.seriesInfo.title;
        series.seriesInfo.displayName = search ? series.seriesInfo.title + ' (' + series.seriesInfo.geography.name + ')' : series.seriesInfo.geography.name;
        filtered.push(series);
      }
    });
    return filtered;
  }

  setStartDate(dateWrapper, observationStart) {
    if (dateWrapper.firstDate === '') {
      return observationStart;
    }
    if (observationStart < dateWrapper.firstDate) {
      return observationStart;
    }
    return dateWrapper.firstDate;
  }

  setEndDate(dateWrapper, observationEnd) {
    if (dateWrapper.endDate === '') {
      return observationEnd;
    }
    if (observationEnd > dateWrapper.endDate) {
      return observationEnd;
    }
    return dateWrapper.endDate;
  }
}
