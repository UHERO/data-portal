import { Injectable } from '@angular/core';
import 'jquery';
declare var $: any;

@Injectable({
  providedIn: 'root'
})
export class TableHelperService {

  constructor() { }

  showPopover(seriesInfo, subcatIndex?) {
    $('[data-toggle="tooltip"]').tooltip('hide');
    const popoverId = subcatIndex ? `#${subcatIndex}${seriesInfo.id}` : `#${seriesInfo.id}`;
    const popover = $(popoverId).popover({
      trigger: 'manual',
      html: true,
      placement: 'left',
      title() {
        let title = seriesInfo.title;
        title += ` (${seriesInfo.geography.shortName}; ${seriesInfo.frequency})`;
        title += ` (${seriesInfo.unitsLabel || seriesInfo.unitsLabelShort})`;
        return title;
      },
      content() {
        let info = '';
        if (seriesInfo.seasonalAdjustment === 'seasonally_adjusted') {
          info += 'Seasonally Adjusted<br>';
        }
        if (seriesInfo.sourceDescription) {
          info += `Source: ${seriesInfo.sourceDescription}<br />`;
        }
        if (seriesInfo.sourceLink) {
          info += `<a target="_blank" href="${seriesInfo.sourceLink}">${seriesInfo.sourceLink}</a><br />`;
        }
        if (seriesInfo.sourceDetails) {
          info += seriesInfo.sourceDetails;
        }
        return info;
      }
    }).on('show.bs.popover', (e) => {
      // Display only one popover at a time
      $('.popover').not(e.target).popover('dispose');
      setTimeout(() => {
        // Close popover on next click (source link in popover is still clickable)
        $('body').one('click', () => {
          popover.popover('dispose');
        });
      }, 1);
    });
    popover.popover('toggle');
  }
}
