import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class DataPortalSettingsService {
  public dataPortalSettings = {
    nta: {
      catTable: {
        portalSource: 'National Transfer Accounts (NTA) Dataportal: https://data.uhero.hawaii.edu/nta \n ',
        portalLink: 'https://data.uhero.hawaii.edu/nta/#/category?id='
      },
      highcharts: {
        seriesTotal: 1,
        series0Name: 'level',
        series0Type: 'line',
        series0Data: true,
        series1Name: 'c5ma',
        series1Type: 'column',
        series1Data: false,
        setYAxes: true
      },
      highstock: {
        credits: 'data.uhero.hawaii.edu/nta',
        labels: {
          seriesLink: 'https://data.uhero.hawaii.edu/nta/#/series?id=',
          portal: 'National Transfer Accounts (NTA)',
          portalLink: 'NTA Dataportal: https://data.uhero.hawaii.edu/nta'
        },
        series0Name: 'level',
        series0Type: 'line',
        series1Name: 'c5ma',
        series1Type: 'column',
        series2Name: 'none',
        series2Type: '',
        buttons: []
      },
      seriesTable: {
        columns: 3,
        series1: 'formattedValue',
        series1Label: 'Level',
        series2: 'formattedC5ma',
        series2Label: 'Annual % Chg',
        series2PercLabel: 'Annual Chg'
      },
      transformations: {
        yoy: false,
        ytd: false,
        c5ma: true
      },
      sliderInteraction: false,
      otherDashboardLinks: []
    },
    uhero: {
      catTable: {
        portalSource: 'The University of Hawaii Economic Research Organization (UHERO) Dataportal: https://data.uhero.hawaii.edu/ \n ',
        portalLink: 'https://data.uhero.hawaii.edu/#/category?id='
      },
      highcharts: {
        seriesTotal: 2,
        series0Name: 'level',
        series0Type: 'line',
        series0Data: true,
        series1Name: 'ytd',
        series1Type: 'column',
        series1Data: true,
        setYAxes: false
      },
      highstock: {
        credits: 'data.uhero.hawaii.edu',
        labels: {
          seriesLink: 'https://data.uhero.hawaii.edu/#/series?id=',
          portal: 'The University of Hawaii Economic Research Organization (UHERO)',
          portalLink: 'Data Portal: https://data.uhero.hawaii.edu/'
        },
        series0Name: 'level',
        series0Type: 'line',
        series1Name: 'yoy',
        series1Type: 'column',
        series2Name: 'ytd',
        series2Type: 'column',
        buttons: [1, 5, 10, 'all']
      },
      seriesTable: {
        columns: 4,
        series1: 'formattedValue',
        series1Label: 'Level',
        series2: 'formattedYoy',
        series2Label: 'Year/Year % Chg',
        series2PercLabel: 'Year/Year Chg',
        series3: 'formattedYtd',
        series3Label: 'Year-to-Date % Chg',
        series3PercLabel: 'Year-to-Date Chg'
      },
      transformations: {
        yoy: true,
        ytd: true,
        c5ma: false
      },
      sliderInteraction: true,
      otherDashboardLinks: [
        {
          name: `UHERO Dashboard Project`,
          url: `https://uhero.hawaii.edu/analytics-dashboards/`
        }
      ]
    },
    ccom: {
      catTable: {
        portalSource: 'Chamber of Commerce Hawaii Dataportal: https://data.uhero.hawaii.edu/ccom \n ',
        portalLink: 'https://data.uhero.hawaii.edu/ccom/#/category?id='
      },
      highcharts: {
        seriesTotal: 2,
        series0Name: 'level',
        series0Type: 'line',
        series0Data: true,
        series1Name: 'ytd',
        series1Type: 'column',
        series1Data: true,
        setYAxes: false
      },
      highstock: {
        credits: 'data.uhero.hawaii.edu/ccom',
        labels: {
          seriesLink: 'https://data.uhero.hawaii.edu/ccom/#/series?id=',
          portal: 'Chamber of Commerce Hawaii Dataportal',
          portalLink: 'Data Portal: https://data.uhero.hawaii.edu/ccom'
        },
        series0Name: 'level',
        series0Type: 'line',
        series1Name: 'yoy',
        series1Type: 'column',
        series2Name: 'ytd',
        series2Type: 'column',
        buttons: [1, 5, 10, 'all']
      },
      seriesTable: {
        columns: 4,
        series1: 'formattedValue',
        series1Label: 'Level',
        series2: 'formattedYoy',
        series2Label: 'Year/Year % Chg',
        series2PercLabel: 'Year/Year Chg',
        series3: 'formattedYtd',
        series3Label: 'Year-to-Date % Chg',
        series3PercLabel: 'Year-to-Date Chg'
      },
      transformations: {
        yoy: true,
        ytd: true,
        c5ma: false
      },
      sliderInteraction: true,
      otherDashboardLinks: []
    },
    coh: {
      catTable: {
        portalSource: 'County of Hawaii: https://data.uhero.hawaii.edu/coh \n ',
        portalLink: 'https://data.uhero.hawaii.edu/coh/#/category?id='
      },
      highcharts: {
        seriesTotal: 2,
        series0Name: 'level',
        series0Type: 'line',
        series0Data: true,
        series1Name: 'ytd',
        series1Type: 'column',
        series1Data: true,
        setYAxes: false
      },
      highstock: {
        credits: 'data.uhero.hawaii.edu',
        labels: {
          seriesLink: 'https://data.uhero.hawaii.edu/coh/#/series?id=',
          portal: 'County of Hawaii',
          portalLink: 'County of Hawaii Data Portal: https://data.uhero.hawaii.edu/coh'
        },
        series0Name: 'level',
        series0Type: 'line',
        series1Name: 'yoy',
        series1Type: 'column',
        series2Name: 'ytd',
        series2Type: 'column',
        buttons: [1, 5, 10, 'all']
      },
      seriesTable: {
        columns: 4,
        series1: 'formattedValue',
        series1Label: 'Level',
        series2: 'formattedYoy',
        series2Label: 'Year/Year % Chg',
        series2PercLabel: 'Year/Year Chg',
        series3: 'formattedYtd',
        series3Label: 'Year-to-Date % Chg',
        series3PercLabel: 'Year-to-Date Chg'
      },
      transformations: {
        yoy: true,
        ytd: true,
        c5ma: false
      },
      sliderInteraction: true,
      otherDashboardLinks: []
    }
  };
}
