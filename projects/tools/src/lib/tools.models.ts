export interface Frequency {
  freq: string;
  label: string;
}

export interface Geography {
  fips: number;
  name: string;
  shortName: string;
  handle: string;
}

export interface CategoryData {
  selectedCategory: string;
  sublist: Array<any>;
  regions: Array<any>;
  currentGeo: Geography;
  frequencies: Array<any>;
  currentFreq: Frequency;
  seriesData: Array<any>;
  invalid: string;
}

export class DateWrapper {
  firstDate: string;
  endDate: string;
}

export interface HighchartsObject {
  chart: {
    spacingTop: number,
    className: string,
    events: {
      render: () => void,
      redraw?: () => void,
      load?: () => void
    },
    styledMode: true,
    margin?: any
  };
  exporting: {
    enabled: boolean,
  };
  time?: {
    timezone: string
  };
  title: {
    text: string,
    useHTML: boolean,
    align: string,
    widthAdjust: number,
    x: number,
    y: number,
    style: {
      margin: number
    }
  };
  tooltip: {
    positioner: () => {},
    shadow: boolean,
    borderWidth: number,
    shared: boolean,
    formatter: () => string,
    useHTML: boolean,
  };
  legend: {
    enabled: boolean,
  };
  credits: {
    enabled: boolean,
  };
  xAxis: {
    type: string,
    labels: {
      enabled: boolean
    },
    lineWidth: number,
    tickLength: number
  };
  yAxis: Array<any>;
  plotOptions: {
    line: {
      marker: {
        enabled: boolean,
        radius: number
      }
    }
  };
  series: Array<any>;
  lang: {
    noData: string
  };
}

export interface HighchartChartData {
  dates: Array<any>;
  level: Array<any>;
  pseudoZones: Array<any>;
  // growth rates
  yoy: Array<any>;
  ytd: Array<any>;
  c5ma: Array<any>;
}

export interface HighstockObject {
  accessibility: {
    description: string
  },
  chart: {
    alignTicks: boolean,
    animation?: boolean,
    events?: {
      render?: () => void,
      redraw?: () => void,
      load?: () => void
    },
    className?: string,
    zoomType: string,
    styledMode: boolean,
    description: string, // used in xAxis label formatter
  };
  labels: {
    items: Array<any>,
    style: {
      display: string
    }
  };
  rangeSelector: {
    selected: number,
    buttons: Array<any>,
    buttonPosition?: {
      x: number,
      y: number
    },
    labelStyle: {
      visibility: string
    },
    inputEnabled: boolean,
    inputDateFormat?: string,
    inputEditDateFormat?: string,
    inputDateParser?: (args: any) => any,
    inputPosition?: {
      x: number,
      y: number
    }
  };
  lang: {
    exportKey: string
  };
  legend?: {
    enabled: boolean,
    useHTML?: boolean,
    labelFormatter: () => string
  };
  navigator: {
    enabled?: boolean,
    series?: {
      includeInDataExport: boolean
    }
  };
  scrollbar?: {
    enabled: boolean
  };
  exporting: {
    allowHTML: boolean,
    buttons?: {
      contextButton: {
        enabled: boolean
      },
      exportButton: {
        text: string,
        _titleKey: string,
        menuItems: Array<any>
      },
      lvlButton?: {
        text: string,
        onclick: () => void
      },
      yoyButton?: {
        text: string,
        onclick: () => void
      }
    },
    csv: {
      dateFormat: string
    },
    filename: string,
    chartOptions: {
      legend?: {
        labelFormatter: () => string
      },
      events: any,
      chart: any,
      navigator: {
        enabled: boolean
      },
      scrollbar: {
        enabled: boolean
      },
      rangeSelector: {
        enabled: boolean
      },
      credits: {
        enabled: boolean,
        text: string,
        position: {
          align: string,
          x: number,
          y: number
        }
      },
      title: {
        text: string,
        align: string,
      },
      subtitle?: {
        text: ''
      },
      series?: Array<any>
    }
  };
  tooltip: {
    borderWidth: number,
    shadow: false,
    followPointer: boolean,
    shared?: boolean,
    split?: boolean,
    formatter?: (args: any) => any,
    pointFormatter?: () => any,
  };
  credits: {
    enabled: boolean
  };
  xAxis: {
    events: {
      afterSetExtremes?: () => void,
      setExtremes?: (e) => void
    },
    minRange?: number,
    min: number,
    max: number,
    ordinal: boolean,
    labels?: {
      formatter: () => string
    }
  };
  yAxis: Array<any>;
  plotOptions: {
    series: {
      cropThreshold: number,
      turboThreshold?: number,
    }
  };
  series: Array<any>;
  title?: {
    text: string,
    align: string
  }
}

// Series data accepted by highstock component
export interface Series {
  analyze: boolean,
  decimals: number,
  freqs: Array<any>,
  frequency: string,
  frequencyShort: string,
  geography: Geography,
  geos: Array<any>,
  id: number,
  measurementId: number,
  measurementName: string,
  name: string,
  percent: boolean,
  real: boolean,
  saParam: boolean,
  seasonalAdjustment: string,
  seriesObservations: {
    observationEnd: string,
    observationStart: string,
    orderBy: string,
    sortOrder: string,
    transformationResults: Array<any>
  },
  sourceDescription: string,
  sourceLink: string,
  sourceDetails: string,
  title: string,
  unitsLabel: string,
  unitsLabelShort: string,
  universe: string
}

