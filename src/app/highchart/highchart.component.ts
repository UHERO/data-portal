import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'app-highchart',
  templateUrl: './highchart.component.html',
  styleUrls: ['./highchart.component.scss']
})
export class HighchartComponent implements OnInit {
  @Input() seriesData;
  private options: Object;
  constructor() { }

  ngOnInit() {
    console.log('highcharts', this.seriesData);
    if(this.seriesData['serie'] === 'No data available') {
      this.options = {
        chart: {
          backgroundColor: '#E5E5E5'
        },
        title: {
          text: 'No Data Available',
          verticalAlign: 'middle',
          style: {
            color: '#505050',
            fontSize: '1em',
            letterSpacing: '0.05em'
          }
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
          noData: "No Data Available"
        },
        noData: {
          style: {
            color: '#505050',
            fontSize: '0.85em'
          }
        }
      }
    } else {
      this.options = {
        chart: {
          // height: 200,
          // width: 200,
          // backgroundColor: '#3E3E40'
          backgroundColor: '#E5E5E5'
        },
        title: {
          text: this.seriesData['serie']['title'],
          style: {
            // color: '#FFFFFF',
            color: '#505050',
            fontSize: '0.85em',
            letterSpacing: '0.05em'
          }
        },
        tooltip: {
          enabled: false
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
          name: this.seriesData['serie']['title'],
          type: 'line',
          yAxis: 1,
          color: '#2B908F',
          data: this.seriesData['observations']['chart data']['level'],
        }],
        labels: {
          items: [{
            html: 'Last Observation:<br>' + this.seriesData['observations']['chart data']['level'][this.seriesData['observations']['chart data']['level'].length - 1][1] + ' (' + this.seriesData['serie']['unitsLabelShort'] + ') <br>' + this.seriesData['observations']['table data'][this.seriesData['observations']['table data'].length - 1]['date'],
            style: {
              left: '0px',
              top: '0px',
              color: '#505050'
            }
          }],
          style: {
            'zIndex': 100
          }
        }
      };
    }
  }
}
