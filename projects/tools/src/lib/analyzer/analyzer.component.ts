import { Component, OnInit, Inject } from '@angular/core';
import { AnalyzerService } from '../analyzer.service';
import { ActivatedRoute, Router } from '@angular/router';
import { DataPortalSettingsService } from '../data-portal-settings.service';

@Component({
  selector: 'lib-analyzer',
  templateUrl: './analyzer.component.html',
  styleUrls: ['./analyzer.component.scss']
})
export class AnalyzerComponent implements OnInit {
  minDate;
  maxDate;
  portalSettings;
  tableYoy;
  tableYtd;
  tableC5ma;
  startDate;
  endDate;
  private noCache: boolean;
  tooltipName;
  tooltipUnits;
  tooltipGeo;
  analyzerData;

  constructor(
    @Inject('portal') private portal,
    private _analyzer: AnalyzerService,
    private _dataPortalSettings: DataPortalSettingsService,
    private route: ActivatedRoute,
  ) { }

  ngOnInit() {
    if (this.route) {
      this.route.queryParams.subscribe(params => {
        if (params['analyzerSeries']) {
          this.storeUrlSeries(params);
        }
        if (params['chartSeries']) {
          this.storeUrlChartSeries(params);
        }
        if (params['start']) {
          this.startDate = params['start'];
        }
        if (params['end']) {
          this.endDate = params['end'];
        }
        if (params['name']) {
          this.tooltipName = (params['name'] === 'true');
        }
        if (params['units']) {
          this.tooltipUnits = (params['units'] === 'true');
        }
        if (params['geography']) {
          this.tooltipGeo = (params['geography'] === 'true');
        }
        if (params['yoy']) {
          this.tableYoy = (params['yoy'] === 'true');
        }
        if (params['ytd']) {
          this.tableYtd = (params['ytd'] === 'true');
        }
        if (params['c5ma']) {
          this.tableC5ma = (params['c5ma'] === 'true');
        }
        if(params['nocache']) {
          this.noCache = params['nocache'] === 'true';
        }
      });
    }
    this.portalSettings = this._dataPortalSettings.dataPortalSettings[this.portal.universe];
    if (this._analyzer.analyzerSeries.length) {
      this.analyzerData = this._analyzer.getAnalyzerData(this._analyzer.analyzerSeries, this.noCache);
    }
  }

  storeUrlSeries(params) {
    const urlASeries = params['analyzerSeries'].split('-').map(Number);
    urlASeries.forEach((uSeries) => {
      const seriesExists = this._analyzer.analyzerSeries.find(s => s.id === uSeries);
      if (!seriesExists) {
        this._analyzer.analyzerSeries.push({ id: uSeries, showInChart: false });
      }
    });
  }

  storeUrlChartSeries(params) {
    const urlCSeries = params['chartSeries'].split('-').map(Number);
    urlCSeries.forEach((cSeries) => {
      const aSeries = this._analyzer.analyzerSeries.find(analyzer => analyzer.id === cSeries);
      aSeries.showInChart = true;
    });
  }

  // Update table when selecting new ranges in the chart
  setTableDates(e) {
    this.minDate = e.minDate;
    this.maxDate = e.maxDate;
  }

  checkTooltip(e) {
    if (e.label === 'name') {
      this.tooltipName = e.value;
    }
    if (e.label === 'units') {
      this.tooltipUnits = e.value;
    }
    if (e.label === 'geo') {
      this.tooltipGeo = e.value;
    }
  }

  checkTransforms(e) {
    if (e.label === 'yoy') {
      this.tableYoy = e.value;
    }
    if (e.label === 'ytd') {
      this.tableYtd = e.value;
    }
    if (e.label === 'c5ma') {
      this.tableC5ma = e.value;
    }
  }
}