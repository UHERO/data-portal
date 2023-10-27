import { Component, Input, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgFor, NgIf } from '@angular/common';
import { SharedModule } from 'primeng/api';
import { TableModule } from 'primeng/table';

@Component({
    selector: 'lib-search-results',
    templateUrl: './search-results.component.html',
    styleUrls: ['./search-results.component.scss'],
    standalone: true,
    imports: [TableModule, SharedModule, NgFor, NgIf, RouterLink]
})
export class SearchResultsComponent implements OnInit {
  @Input() searchData;
  resultsTableCols: Array<any>;
  resultsTableData: Array<any>;

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

  createTableData = (searchResults: Array<any>) => {
    return searchResults.map(seriesData => ({
      series: seriesData.title,
      region: seriesData.geography.shortName,
      frequency: seriesData.frequency,
      seasonality: seriesData.seasonalAdjustment?.split('_').join(' ') || 'Not Applicable',
      id: seriesData.id
    } ));
  }

}
