import { Component, OnInit, AfterViewInit, OnChanges } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { UheroApiService } from '../uhero-api.service';
import { HelperService } from '../helper.service';
import { Frequency } from '../frequency';

@Component({
  selector: 'app-single-series',
  templateUrl: './single-series.component.html',
  styleUrls: ['./single-series.component.scss']
})
export class SingleSeriesComponent implements OnInit {
  private errorMessage: string;
  private seriesSiblings;
  private options: Object;
  private seriesTableData = [];
  private newTableData = [];
  
  // Vars used in highstock component
  public chartData;
  public seriesDetail;

  // Vars used in selectors
  public freqs;
  public currentFreq;
  public regions = [];
  public currentGeo;

  constructor(private _uheroAPIService: UheroApiService, private _helper: HelperService, private route: ActivatedRoute) {}

  ngOnInit() {
    this.currentGeo = {fips: null, name: null, handle: null};
    this.currentFreq = {freq: null, label: null};
  }

  ngAfterViewInit() {
   this.route.params.subscribe(params => {
      let seriesId = Number.parseInt(params['id']);
      this.drawChart(seriesId);
    });
  }

  // Draws chart & table on load
  drawChart(id: number) {
    let freqArray = [];
    let dateArray = [];

    this._uheroAPIService.fetchSeriesDetail(id).subscribe((series) => {
      this.seriesDetail = series;
      this.currentFreq = {'freq': this.seriesDetail['frequencyShort'], 'label': this.seriesDetail['frequency']};

      this._uheroAPIService.fetchSeriesSiblings(id).subscribe((siblings) => {
        this.seriesSiblings = siblings;
      })

      this._uheroAPIService.fetchSiblingFreqs(id).subscribe((frequencies) => {
        this.freqs = frequencies;
      });

      this._uheroAPIService.fetchSiblingGeos(id).subscribe((geos) => {
        this.regions = geos;
        this.currentGeo = this.seriesDetail['geography'];
      });
      
      this.getSeriesObservations(id, dateArray);
    });
  }

  getSeriesObservations(id: number, dateArray: Array<any>) {
    this._uheroAPIService.fetchObservations(id).subscribe((observations) => {
      let seriesObservations = observations;
      let start = seriesObservations['start'];
      let end = seriesObservations['end'];

      // Use to format dates for table
      this._helper.calculateDateArray(start, end, this.currentFreq.freq, dateArray);
      this.chartData = seriesObservations['chart data'];
      let tableData = seriesObservations['table data'];

      // Create table with formatted dates and slice table to starting & ending observation dates
      this.seriesTableData = this._helper.seriesTable(tableData, dateArray);
        let beginTable, endTable;
        for (let i = 0; i < this.seriesTableData.length; i++) {
          if (this.seriesTableData[i].date === start) {
            beginTable = i;
          }
          if (this.seriesTableData[i].date === end) {
            endTable = i;
          }
        }
      this.seriesTableData = this.seriesTableData.slice(beginTable, endTable + 1);
    });
  }

  // Redraw chart when selecting a new region
  redrawGeo(event) {
    // Reset chart and table data
    this.chartData = [];
    this.seriesTableData = [];
    this.newTableData = [];
    let dateArray = [];
    this.seriesSiblings.forEach((sibling, index) => {
      if (event.handle === this.seriesSiblings[index]['geography']['handle'] && this.currentFreq.freq === this.seriesSiblings[index]['frequencyShort']) {
        let id = this.seriesSiblings[index]['id'];
        this._uheroAPIService.fetchSeriesDetail(id).subscribe((series) => {
          this.seriesDetail = series;
        });
        this.getSeriesObservations(id, dateArray);
      } else {
        return;
      }
    },
    error => this.errorMessage = error);
  }

  // Redraw chart when selecting a new frequency
  redrawFreq(event) {
    // Reset Chart and Table data
    this.chartData = [];
    this.seriesTableData = [];
    this.newTableData = [];
    let dateArray = [];
    this.seriesSiblings.forEach((sibling, index) => {
      if (this.currentGeo.handle === this.seriesSiblings[index]['geography']['handle'] && event.freq === this.seriesSiblings[index]['frequencyShort']) {
        let id = this.seriesSiblings[index]['id'];
        this._uheroAPIService.fetchSeriesDetail(id).subscribe((series) => {
          this.seriesDetail = series;
        });
        this.getSeriesObservations(id, dateArray);
      } else {
        return;
      }
    },
    error => this.errorMessage = error);
  }

  // Update table when selecting new ranges in the chart
  redrawTable(e) {
    let minDate, maxDate, tableStart, tableEnd;
    minDate = e['min date'];
    maxDate = e['max date'];

    for (let i = 0; i < this.seriesTableData.length; i++) {
      if (this.seriesTableData[i].date === minDate) {
        tableStart = i;
      }
      if (this.seriesTableData[i].date === maxDate) {
        tableEnd = i;
      }
    }

    this.newTableData = this.seriesTableData.slice(tableStart, tableEnd + 1);
  }
}
