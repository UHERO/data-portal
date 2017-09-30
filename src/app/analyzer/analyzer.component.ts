import { Component, OnInit } from '@angular/core';
import { AnalyzerService } from '../analyzer.service';
import { HelperService } from '../helper.service';
import { DateWrapper } from '../date-wrapper';

@Component({
  selector: 'app-analyzer',
  templateUrl: './analyzer.component.html',
  styleUrls: ['./analyzer.component.scss']
})
export class AnalyzerComponent implements OnInit {
  private frequencies;
  private currentFreq;
  private analyzerSeries;
  private analyzerTableDates;
  private analyzerChartSeries;
  private chartStart;
  private chartEnd;
  private minDate;
  private maxDate;

  constructor(private _analyzer: AnalyzerService, private _helper: HelperService) { }

  ngOnInit() {
    this.analyzerSeries = this._analyzer.analyzerSeries.allSeries;
    this.analyzerChartSeries = this._analyzer.analyzerSeries.analyzerChart;
    this.frequencies = [];
    const dateWrapper = { firstDate: '', endDate: '' };
    this.analyzerSeries.forEach((series) => {
      const freqExist = this.frequencies.find(freq => freq.freq === series.frequencyShort);
      if (!freqExist) {
        this.frequencies.push({ freq: series.frequencyShort, label: series.frequency });
      }
      // Get earliest start date and latest end date
      this.setDateWrapper(dateWrapper, series.seriesObservations.observationStart, series.seriesObservations.observationEnd);
    });

    if (this.analyzerSeries.length) {
      // Array of full range of dates for series selected in analyzer
      this.analyzerTableDates = this._analyzer.createAnalyzerDates(dateWrapper.firstDate, dateWrapper.endDate, this.frequencies, []);
      this.analyzerSeries.forEach((series) => {
        // Array of observations using full range of dates
        series.analyzerTableData = this._helper.catTable(series.tableData, this.analyzerTableDates, series.decimals);
      });
      this.analyzerChartSeries.push(this.analyzerSeries[0]);
    }
  }

  setDateWrapper(dateWrapper: DateWrapper, seriesStart: string, seriesEnd: string) {
    if (dateWrapper.firstDate === '' || seriesStart < dateWrapper.firstDate) {
      dateWrapper.firstDate = seriesStart;
    }
    if (dateWrapper.endDate === '' || seriesEnd > dateWrapper.endDate) {
      dateWrapper.endDate = seriesEnd;
    }
  }

  updateAnalyzerChart(event) {
    const seriesExist = this.analyzerChartSeries.find(series => series.id === event.id);
    if (seriesExist) {
      const chartSeriesCopy = [];
      const index = this.analyzerChartSeries.indexOf(seriesExist);
      this.analyzerChartSeries.splice(index, 1);
      this.analyzerChartSeries = this.copyChartSeries(this.analyzerChartSeries);
      return
    }
    if (!seriesExist) {
      const chartSeriesCopy = [];
      this.analyzerChartSeries.push(event);
      this.analyzerChartSeries = this.copyChartSeries(this.analyzerChartSeries);
    }
  }

  copyChartSeries(analyzerChartSeries) {
    const chartSeriesCopy = [];
    analyzerChartSeries.forEach((series) => {
      chartSeriesCopy.push(Object.assign({}, series));
    });
    return chartSeriesCopy;
  }

  updateChartExtremes(e) {
    this.chartStart = e.minDate;
    this.chartEnd = e.maxDate;
  }

  // Update table when selecting new ranges in the chart
  setTableDates(e) {
    this.minDate = e.minDate;
    this.maxDate = e.maxDate;
  }

}
