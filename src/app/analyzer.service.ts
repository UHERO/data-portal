import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { UheroApiService } from './uhero-api.service';
import { HelperService } from './helper.service';
import { Frequency } from './frequency';
import { Geography } from './geography';
import { DateWrapper } from './date-wrapper';
import { notEqual } from 'assert';

@Injectable()
export class AnalyzerService {
  // Keep track of series in the analyzer
  public analyzerSeries = [];

  public analyzerData = {
    analyzerTableDates: [],
    analyzerSeries: [],
    analyzerChartSeries: []
  };

  constructor(private _uheroAPIService: UheroApiService, private _helper: HelperService) { }

  checkAnalyzer(seriesInfo) {
    const analyzeSeries = this.analyzerSeries.find(series => series.id === seriesInfo.id);
    return analyzeSeries ? true : false;
  }

  getAnalyzerData(aSeries) {
    this.analyzerData.analyzerSeries = [];
    const ids = aSeries.map(s => s.id).join();
    this._uheroAPIService.fetchPackageAnalyzer(ids).subscribe((results) => {
      const series = results.series;
      series.forEach((s) => {
        let decimals;
        const aSeriesMatch = aSeries.find(a => a.id === s.id);
        const seriesData = {
          seriesDetail: s,
          currentGeo: <Geography>{},
          currentFreq: <Frequency>{},
          chartData: {},
          displayName: '',
          chartDisplayName: '',
          seriesTableData: [],
          error: null,
          saParam: false,
          noData: '',
          observations: { transformationResults: [], observationStart: '', observationEnd: '' },
          showInChart: aSeriesMatch.showInChart
        };
        const abbreviatedNameDetails = {
          title: s.title,
          geography: s.geography.handle,
          frequency: s.frequencyShort,
          seasonalAdjustment: s.seasonalAdjustment
        };
        const chartNameDetails = {
          title: s.title,
          geography: s.geography.shortName,
          frequency: s.frequency,
          seasonalAdjustment: s.seasonalAdjustment
        };
        seriesData.displayName = this.formatDisplayName(abbreviatedNameDetails);
        seriesData.chartDisplayName = this.formatDisplayName(chartNameDetails);
        seriesData.saParam = s.seasonalAdjustment !== 'not_seasonally_adjusted';
        decimals = s.decimals ? s.decimals : 1;
        seriesData.currentGeo = s.geography;
        seriesData.currentFreq = { freq: s.frequencyShort, label: s.frequency };
        seriesData.observations = s.seriesObservations;
        const levelData = seriesData.observations.transformationResults[0].dates;
        const obsStart = seriesData.observations.observationStart;
        const obsEnd = seriesData.observations.observationEnd;
        const dateArray = [];
        if (levelData) {
          // Use to format dates for table
          this._helper.createDateArray(obsStart, obsEnd, seriesData.currentFreq.freq, dateArray);
          const data = this._helper.dataTransform(seriesData.observations, dateArray, decimals);
          seriesData.chartData = data.chartData;
          seriesData.seriesTableData = data.tableData;
        } else {
          seriesData.noData = 'Data not available';
        }
        this.analyzerData.analyzerSeries.push(seriesData);
        this.analyzerData.analyzerTableDates = this.setAnalyzerDates(this.analyzerData.analyzerSeries);
        this.createAnalyzerTableData();
        this.analyzerData.analyzerChartSeries = this.analyzerData.analyzerSeries.filter(serie => serie.showInChart === true);
        this.checkAnalyzerChartSeries();
      });
    });
    return Observable.forkJoin(Observable.of(this.analyzerData));
  }

  createAnalyzerTableData() {
    this.analyzerData.analyzerSeries.forEach((serie) => {
      // Array of observations using full range of dates
      if (serie.observations) {
        serie.analyzerTableData = this._helper.createSeriesTable(this.analyzerData.analyzerTableDates, serie.observations, serie.seriesDetail.decimals);
      }
    });
  }

  checkAnalyzerChartSeries() {
    // At least 2 series should be drawn in the chart, if more than 1 series has been added to the analyzer
    while (this.analyzerData.analyzerChartSeries.length < 2 && this.analyzerData.analyzerSeries.length > 1 || !this.analyzerData.analyzerChartSeries.length) {
      const notInChart = this.analyzerData.analyzerSeries.find(serie => serie.showInChart !== true);
      this.analyzerSeries.find(serie => serie.id === notInChart.seriesDetail.id).showInChart = true;
      notInChart.showInChart = true;
      this.analyzerData.analyzerChartSeries = this.analyzerData.analyzerSeries.filter(serie => serie.showInChart === true);
    }
  }

  formatDisplayName({ title, geography, frequency, seasonalAdjustment }) {
    let ending = '';
    if (seasonalAdjustment === 'seasonally_adjusted') {
      ending = '; Seasonally Adjusted';
    }
    if (seasonalAdjustment === 'not_seasonall_adjusted') {
      ending = '; Not Seasonally Adjusted';
    }
    return `${title} (${geography}; ${frequency}${ending})`;
  }

  setAnalyzerDates(analyzerSeries) {
    const frequencies = [];
    const dateWrapper = { firstDate: '', endDate: '' };
    analyzerSeries.forEach((series) => {
      const freqExist = frequencies.find(freq => freq.freq === series.seriesDetail.frequencyShort);
      if (!freqExist) {
        frequencies.push({ freq: series.seriesDetail.frequencyShort, label: series.seriesDetail.frequency });
      }
      // Get earliest start date and latest end date
      this.setDateWrapper(dateWrapper, series.observations.observationStart, series.observations.observationEnd);
    });
    // Array of full range of dates for series selected in analyzer
    return this.createAnalyzerDates(dateWrapper.firstDate, dateWrapper.endDate, frequencies, []);
  }

  setDateWrapper(dateWrapper: DateWrapper, seriesStart: string, seriesEnd: string) {
    if (dateWrapper.firstDate === '' || seriesStart < dateWrapper.firstDate) {
      dateWrapper.firstDate = seriesStart;
    }
    if (dateWrapper.endDate === '' || seriesEnd > dateWrapper.endDate) {
      dateWrapper.endDate = seriesEnd;
    }
  }

  findLongestSeriesIndex(series) {
    let longestSeries, seriesLength = 0;
    series.forEach((serie, index) => {
      if (!longestSeries || seriesLength < serie.chartData.level.length) {
        seriesLength = serie.chartData.level.length;
        longestSeries = index;
      }
    });
    return longestSeries;
  }

  updateAnalyzer(seriesId, tableData?, chartData?) {
    const seriesExist = this.analyzerSeries.findIndex(series => series.id === seriesId);
    if (seriesExist >= 0) {
      this.analyzerSeries.splice(seriesExist, 1);
      this.analyzerData.analyzerSeries.splice(this.analyzerData.analyzerSeries.findIndex(series => series.seriesDetail.id === seriesId), 1);
    }
    if (seriesExist < 0) {
      this.analyzerSeries.push({ id: seriesId });
    }
  }

  createAnalyzerDates(dateStart: string, dateEnd: string, frequencies: Array<any>, dateArray: Array<any>) {
    let startYear = +dateStart.substr(0, 4);
    const endYear = +dateEnd.substr(0, 4);
    let startMonth = +dateStart.substr(5, 2);
    const endMonth = +dateEnd.substr(5, 2);
    const m = { 1: '01', 2: '02', 3: '03', 4: '04', 5: '05', 6: '06', 7: '07', 8: '08', 9: '09', 10: '10', 11: '11', 12: '12' };
    const q = { 1: 'Q1', 4: 'Q2', 7: 'Q3', 10: 'Q4' };
    // Annual frequency
    const aSelected = frequencies.indexOf(frequencies.find(freq => freq.freq === 'A')) > -1;
    // Quarterly frequency
    const qSelected = frequencies.indexOf(frequencies.find(freq => freq.freq === 'Q')) > -1;
    // Semi-annual frequency
    const sSelected = frequencies.indexOf(frequencies.find(freq => freq.freq === 'S')) > -1;
    // Monthly frequency
    const mSelected = frequencies.indexOf(frequencies.find(freq => freq.freq === 'M')) > -1;
    while (startYear + '-' + m[startMonth] + '-01' <= endYear + '-' + m[endMonth] + '-01') {
      if (mSelected) {
        dateArray.push({
          date: startYear.toString() + '-' + m[startMonth] + '-01',
          tableDate: startYear.toString() + '-' + m[startMonth]
        });
      }
      // If series with a semi-annual frequency have been selected but not monthly, add months '01' & '07' to the date array
      if (sSelected && !mSelected && (startMonth === 1 || startMonth === 7)) {
        dateArray.push({
          date: startYear.toString() + '-' + m[startMonth] + '-01',
          tableDate: startYear.toString() + '-' + m[startMonth]
        });
      }
      if (qSelected) {
        const addQuarter = this.addQuarterObs(startMonth, mSelected);
        if (addQuarter) {
          dateArray.push({
            date: startYear.toString() + '-' + m[addQuarter] + '-01',
            tableDate: startYear.toString() + ' ' + q[addQuarter]
          });
        }
      }
      if (aSelected) {
        const addAnnual = this.addAnnualObs(startMonth, mSelected, qSelected);
        if (addAnnual) {
          dateArray.push({
            date: startYear.toString() + '-01-01',
            tableDate: startYear.toString()
          });
        }
      }
      startYear = startMonth === 12 ? startYear += 1 : startYear;
      startMonth = startMonth === 12 ? 1 : startMonth += 1;
    }
    return dateArray;
  }

  addQuarterObs(startMonth, monthSelected) {
    // If a monthly series is not selected, add Q at months 1, 4, 7, 10 (i.e. startMonth === 1, 4, 7, 10)
    // If a monthly series is selected, add Q after months 3, 6, 9, 12 (i.e. startMonth === 3, 6, 9, 12)
    const qMonth = monthSelected ? startMonth - 2 : startMonth;
    const addQ = monthSelected ? this.checkStartMonth(startMonth) : this.checkStartMonth(startMonth + 2);
    return addQ ? qMonth : null;
  }

  addAnnualObs(startMonth, monthSelected, quarterSelected) {
    // If a monthly series is selected, add annual date after month 12
    if (monthSelected && startMonth === 12) {
      return true;
    }
    // If a quarterly series is selected (w/o monthly), add annueal date after 4th quarter
    if (quarterSelected && !monthSelected && startMonth === 10) {
      return true;
    }
    // If only annual is selected, add to date array
    if (!quarterSelected && !monthSelected && startMonth === 1) {
      return true;
    }
    return false;
  }

  checkStartMonth(month) {
    if (month === 3 || month === 6 || month === 9 || month === 12) {
      return true;
    }
    return false;
  }
}
