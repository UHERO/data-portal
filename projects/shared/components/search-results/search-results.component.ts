import { Component, Input, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatSortModule, MatSort } from '@angular/material/sort';

interface SearchResultColumn {
  field: string;
  header: string;
}

interface SearchResultRow {
  series: string;
  region: string;
  frequency: string;
  seasonality: string;
  id: number;
}

@Component({
  selector: 'lib-search-results',
  templateUrl: './search-results.component.html',
  styleUrls: ['./search-results.component.scss'],
  imports: [MatTableModule, MatSortModule, RouterLink]
})
export class SearchResultsComponent implements OnInit, AfterViewInit {
  @Input() searchData: any;
  @ViewChild(MatSort) sort!: MatSort;

  resultsTableCols: SearchResultColumn[];
  displayedColumns: string[];
  dataSource = new MatTableDataSource<SearchResultRow>([]);

  ngOnInit(): void {
    this.resultsTableCols = this.createTableColumns();
    this.displayedColumns = this.resultsTableCols.map(col => col.field);
    this.dataSource.data = this.createTableData(this.searchData.searchResults);
  }

  ngAfterViewInit() {
    this.dataSource.sort = this.sort;
  }

  createTableColumns = (): SearchResultColumn[] => {
    return [
      { field: 'series', header: 'Series' },
      { field: 'region', header: 'Region' },
      { field: 'frequency', header: 'Frequency' },
      { field: 'seasonality', header: 'Seasonally Adjusted' }
    ];
  };

  createTableData = (searchResults: any[]): SearchResultRow[] => {
    return searchResults.map(seriesData => ({
      series: seriesData.title,
      region: seriesData.geography.shortName,
      frequency: seriesData.frequency,
      seasonality: seriesData.seasonalAdjustment?.split('_').join(' ') || 'Not Applicable',
      id: seriesData.id
    }));
  };
}
