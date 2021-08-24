import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'lib-search-results',
  templateUrl: './search-results.component.html',
  styleUrls: ['./search-results.component.scss']
})
export class SearchResultsComponent implements OnInit {
  @Input() searchData;
  resultsTableCols;
  resultsTableData;

  constructor() { }

  ngOnInit(): void {
    this.resultsTableCols = this.createTableColumns();
    this.resultsTableData = this.createTableData(this.searchData.searchResults);  
  }

  createTableColumns = () => {
    return [
      { field: 'series', header: 'Series' },
      { field: 'region', header: 'Region' },
      { field: 'frequency', header: 'Frequency' },
      { field: 'seasonality', header: 'Seasonally Adjusted' }
    ];
  }

  createTableData = (searchResults) => {
    return searchResults.map(seriesData => ({
      series: seriesData.title,
      region: seriesData.geography.shortName,
      frequency: seriesData.frequency,
      seasonality: seriesData.seasonalAdjustment?.split('_').join(' ') || 'Not Applicable',
      id: seriesData.id
    } ));
  }

}
