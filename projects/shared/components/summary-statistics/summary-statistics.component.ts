import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { HelperService } from 'projects/shared/services/helper.service';
import { SeriesHelperService } from 'projects/shared/services/series-helper.service';
import { DateRange } from 'projects/shared/models/DateRange';
import { Subscription } from 'rxjs';
import { NgIf } from '@angular/common';

@Component({
    selector: 'lib-summary-statistics',
    templateUrl: './summary-statistics.component.html',
    styleUrls: ['./summary-statistics.component.scss'],
    standalone: true,
    imports: [NgIf]
})
export class SummaryStatisticsComponent implements OnInit, OnDestroy {
  @Input() seriesData;
  selectedDateRange: DateRange;
  dateRangeSub: Subscription;
  summaryStats;

  constructor(
    private helperService: HelperService,
    private seriesHelper: SeriesHelperService,
  ) {
      
  }

  ngOnInit() {
    this.dateRangeSub = this.helperService.currentDateRange.subscribe((dateRange) => {
      this.selectedDateRange = dateRange;
      const { seriesDetail, chartData } = this.seriesData;
      const { startDate, endDate } = dateRange;
      this.summaryStats = this.seriesHelper.calculateSeriesSummaryStats(seriesDetail, chartData, startDate, endDate, false, null);
    });  
  }

  ngOnDestroy() {
    this.dateRangeSub.unsubscribe();
  }
}
