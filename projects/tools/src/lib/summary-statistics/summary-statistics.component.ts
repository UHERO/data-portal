import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { HelperService } from '../helper.service';
import { SeriesHelperService } from '../series-helper.service';
import { Frequency, Geography, DateRange } from '../tools.models';
import { Subscription } from 'rxjs';

@Component({
  selector: 'lib-summary-statistics',
  templateUrl: './summary-statistics.component.html',
  styleUrls: ['./summary-statistics.component.scss']
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
