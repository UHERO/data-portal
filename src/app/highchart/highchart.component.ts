import { Component, OnInit, Input } from '@angular/core';

import * as Highcharts from 'highcharts';

Highcharts.setOptions({
  lang: {
    thousandsSep: ','
  }
});

@Component({
  selector: 'app-highchart',
  templateUrl: './highchart.component.html',
  styleUrls: ['./highchart.component.scss']
})
export class HighchartComponent implements OnInit {
  @Input() seriesData;
  @Input() currentFreq;
  private options: Object;
  private chart;
  private SA: boolean;
  private dataAvail: boolean;
  constructor() { }

  ngOnInit() {
    const level = this.seriesData.chartData.level;
    const pseudoZones = this.seriesData.chartData.pseudoZones;
    const ytd = this.seriesData.chartData.ytd;
    const decimals = this.seriesData.seriesInfo.decimals ? this.seriesData.seriesInfo.decimals : 1;
    let title = this.seriesData.seriesInfo.title === undefined ? this.seriesData.seriesInfo.name : this.seriesData.seriesInfo.title;
    title += this.seriesData.seriesInfo.seasonalAdjustment === 'seasonally_adjusted' ? ' (SA)' : '';
    const dataFreq = this.currentFreq;
    this.dataAvail = this.seriesData.seriesInfo === 'No data available' ? false : true;
    const unitsShort = this.seriesData.seriesInfo.unitsLabelShort;
    if (this.seriesData.seriesInfo === 'No data available' || level.length === 0) {
      this.noDataChart(title);
    } else {
      this.drawChart(title, level, pseudoZones, ytd, dataFreq, unitsShort, decimals);
    }
  }

  drawChart(title: string, level: Array<any>, pseudoZones, ytd: Array<any>, dataFreq, unitsShort, decimals) {
    this.options = {
      chart: {
        backgroundColor: '#F7F7F7',
        spacingTop: 20 /* Add spacing to draw plot below fixed tooltip */
      },
      exporting: {
        enabled: false
      },
      title: {
        text: '<br>',
        useHTML: true,
        align: 'left',
        widthAdjust: 0,
        style: {
          margin: 75
        }
      },
      tooltip: {
        positioner: function() {
          return {x: 0, y: 0};
        },
        shadow: false,
        borderWidth: 0,
        valueDecimals: decimals,
        shared: true,
        backgroundColor: 'transparent',
        formatter: function () {
          const pseudo = 'Pseudo History ';
          let s = '<b>' + title + '</b><br>';
          if (dataFreq === 'Q' && Highcharts.dateFormat('%b', this.x) === 'Jan') {
            s = s + 'Q1 ';
          };
          if (dataFreq === 'Q' && Highcharts.dateFormat('%b', this.x) === 'Apr') {
            s = s + 'Q2 ';
          };
          if (dataFreq === 'Q' && Highcharts.dateFormat('%b', this.x) === 'Jul') {
            s = s + 'Q3 ';
          };
          if (dataFreq === 'Q' && Highcharts.dateFormat('%b', this.x) === 'Oct') {
            s = s + 'Q4 ';
          };
          if (dataFreq === 'M' || dataFreq === 'S') {
            s = s + Highcharts.dateFormat('%b', this.x) + ' ';
          };
          s = s + Highcharts.dateFormat('%Y', this.x) + '';
          this.points.forEach((point) => {
            let label = '<br>' + point.series.name + ': ' + Highcharts.numberFormat(point.y);
            if (point.series.name === 'Level') {
              label += ' (' + unitsShort + ')';
            }
            if (pseudoZones.length > 0) {
              pseudoZones.forEach((zone, index) => {
                if (point.x < pseudoZones[index].value) {
                  s += '<br>' + pseudo + point.series.name + ': ' + Highcharts.numberFormat(point.y) + '<br>';
                  if (point.series.name === 'Level') {
                    s += ' (' + unitsShort + ')';
                  }
                } else {
                  s += label;
                }
              });
            } else {
              s += label;
            }
          });
          return s;
        },
        style: {
          color: '#505050',
          fontSize: '0.9em',
          letterSpacing: '0.05em',
          width: '190px',
          marginBottom: '5px',
        }
      },
      legend: {
        enabled: false
      },
      credits: {
        enabled: false
      },
      xAxis: {
        type: 'datetime',
        labels: {
          enabled: false
        },
        lineWidth: 0,
        tickLength: 0
      },
      yAxis: [{
        labels: {
          enabled: false
        },
        title: {
          text: ''
        },
        gridLineColor: 'transparent'
      }, {
        title: {
          text: ''
        },
        labels: {
          enabled: false
        },
        gridLineColor: 'transparent',
        opposite: true
      }],
      plotOptions: {
        line: {
          marker: {
            enabled: false
          }
        }
      },
      series: [{
        name: 'Level',
        type: 'line',
        yAxis: 1,
        color: '#1D667F',
        data: level,
        states: {
          hover: {
            lineWidth: 2
          }
        },
        dataGrouping: {
          enabled: false
        },
        zoneAxis: 'x',
        zones: pseudoZones
      }, {
        name: 'YTD',
        type: 'column',
        color: 'transparent',
        borderColor: 'transparent',
        data: ytd,
        dataGrouping: {
          enabled: false
        },
      }],
    };
  }

  noDataChart(title) {
    this.options = {
      chart: {
        backgroundColor: '#F9F9F9'
      },
      title: {
        text: '<b>' + title + '</b><br>' + 'No Data Available',
        align: 'left',
        widthAdjust: 0,
        style: {
          color: '#505050',
          fontSize: '0.9em',
          letterSpacing: '0.05em'
        }
      },
      exporting: {
        enabled: false
      },
      legend: {
        enabled: false
      },
      credits: {
        enabled: false
      },
      yAxis: [{
        title: {
          text: ''
        }
      }],
      xAxis: {
        lineWidth: 0
      },
      series: [{
        data: []
      }],
      lang: {
        noData: 'No Data Available'
      },
      noData: {
        style: {
          color: '#505050',
          fontSize: '0.85em'
        }
      }
    };
  }

  render(event) {
    this.chart = event;
    const level = this.chart.series[0];
    const ytd = this.chart.series[1];
    const latestLevel = (level !== undefined) ? level.points.length - 1 : null;
    const latestYtd = (ytd !== undefined) ? ytd.points.length - 1 : null;

    // Prevent tooltip from being hidden on mouseleave
    // Reset toolip value and marker to most recent observation
    this.chart.tooltip.hide = function() {
      if (latestLevel > 0 && latestYtd > 0) {
        this.chart.tooltip.refresh([level.points[latestLevel], ytd.points[latestYtd]]);
        level.points[latestLevel].setState('hover');
      }
    };

    // Display tooltip when chart loads
    if (latestLevel > 0 && latestYtd > 0) {
      this.chart.tooltip.refresh([level.points[latestLevel], ytd.points[latestYtd]]);
    }
  }
}
