// Component for multi-chart view
import { Component, OnInit, AfterViewInit, Input } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { UheroApiService } from '../uhero-api.service';
import { HelperService } from '../helper.service';
import { Frequency } from '../frequency';
import { Geography } from '../geography';
import { dateWrapper } from '../date-wrapper';

import { error } from 'util';

@Component({
  selector: 'app-landing-page',
  templateUrl: 'landing-page.component.html',
  styleUrls: ['landing-page.component.scss']
})
export class LandingPageComponent implements OnInit, AfterViewInit {
  private selectedCategory;
  private sublist: Array<any> = [];
  private categories;
  private id: number;
  private routeGeo: string;
  private routeFreq: string;
  private routeSearch: string;

  // Check if seasonally adjusted data is displayed, default to true
  private saIsActive: boolean = true;
  private errorMessage: string;

  // seriesData array used as input in highchart.component
  public seriesData = [];
  private expandedResults = [];

  // Variables for geo and freq selectors
  private geoHandle: string;
  private freqHandle: string;
  private defaultFreq: string;
  private defaultGeo: string;
  public regions = [];
  public freqs = [];
  public currentGeo: Geography;
  public currentFreq: Frequency;

  constructor(private _uheroAPIService: UheroApiService, private _helper: HelperService, private route: ActivatedRoute, private _router: Router) {
  }

  ngOnInit() {
    this.currentGeo = {fips: null, name: null, handle: null};
    this.currentFreq = {freq: null, label: null};
  }

  ngAfterViewInit() {
    this.route.params.subscribe(params => {
      this.id = Number.parseInt(params['id']);
      this.routeGeo = params['geo'];
      this.routeFreq = params['freq'];
      this.routeSearch = params['search'];
      console.log('route search', this.routeSearch)
      if (this.routeSearch) {
        if (this.routeGeo && this.routeFreq) {
          this.initSearch(this.routeSearch, this.routeGeo, this.routeFreq);
        } else {
          this.initSearch(this.routeSearch);
        }
      } else {
        if (isNaN(this.id)) {
          this.id = 42;
          this.initContent(42);
        } else if (this.routeGeo === undefined && this.routeFreq === undefined) {
          this.initContent(this.id);
        } else {
          this.initContent(this.id, this.routeGeo, this.routeFreq);
        }
      }
    });
  }

  // Set up search results
  initSearch(search: string, routeGeo?: string, routeFreq?: string) {
    let geoArray = [];
    let freqArray = [];

    this._uheroAPIService.fetchSearchSeries(search).subscribe((series) => {
      let searchSeries = series;
      let dateWrapper = {firstDate: '', endDate: ''};
      this.searchSettings(search, searchSeries, geoArray, freqArray, dateWrapper, routeGeo, routeFreq);
    });
  }

  searchSettings(search: string, searchSeries: Array<any>, regions: Array<any>, freqs: Array<any>, dateWrapper: dateWrapper, routeGeo?: string, routeFreq?: string) {
    let dateArray = [];
    searchSeries.forEach((series, index) => {
      this._helper.uniqueGeos(searchSeries[index].geography, regions);
      this._helper.uniqueFreqs({freq: searchSeries[index].frequencyShort, label: searchSeries[index].frequency}, freqs);
    });
    this.regions = regions;
    this.freqs = freqs;

    // If geo. is available as URL param, use as current geo.
    if (routeGeo) {
      this.regions.forEach((geo, index) => {
        if (routeGeo === this.regions[index].handle) {
          this.currentGeo = this.regions[index];
        }
      });
    } else {
      this.regions.forEach((geo, index) => {
        this.currentGeo = this.regions[0];
      });
    }

    // If freq. is available as URL param, use as current freq.
    if (this.routeFreq) {
      this.freqs.forEach((freq, index) => {
        if (routeFreq === this.freqs[index].freq) {
          this.currentFreq = this.freqs[index];
        }
      });
    } else {
      this.freqs.forEach((freq, index) => {
        this.currentFreq = this.freqs[0];
      })
    }

    let i = 0;
    searchSeries.forEach((series, index) => {
      this._uheroAPIService.fetchObservations(searchSeries[index].id).subscribe((obs) => {
        searchSeries[index].seriesObservations = obs;
        i += 1;
      },
      (error) => {
        error = this.errorMessage = error;
      },
      () => {
        if (i === searchSeries.length) {
          let data = this._helper.searchTransform(searchSeries, dateArray, dateWrapper, this.currentGeo.handle, this.currentFreq.freq);
          this.seriesData.push({dateWrapper: dateWrapper, series: data});
          this.selectedCategory = search;
          console.log(this.seriesData);
        }
      });
    },
    this.seriesData = []);
  }

  // Called on page load
  // Gets data sublists available for a selected category
  initContent(catId: number, routeGeo?:string, routeFreq?:string) {
    let geoArray = [];
    let freqArray = [];

    this._uheroAPIService.fetchCategories().subscribe((category) => {
      let categories = category;

      categories.forEach((category, index) => {
        if (categories[index]['id'] === catId) {
          this.selectedCategory = categories[index]['name'];
          this.sublist = categories[index]['children'];

          // Get a sublist's default geo/freq if available
          if (categories[index]['defaults']) {
            this.defaultFreq = categories[index]['defaults']['freq'];
            this.defaultGeo  = categories[index]['defaults']['geo'];
          } else {
            this.defaultFreq = '';
            this.defaultGeo = '';
          }

          // this.firstDateWrapper = {firstDate: ''};
          this.sublist.forEach((sub, index) => {
            let dateWrapper = {firstDate: '', endDate: ''};
            this.initSettings(this.sublist[index], geoArray, freqArray, dateWrapper, routeGeo, routeFreq);
          });
        } else {
          return
        }
      },
      this.seriesData = []);
    });
  }

  // Get regions and frequencies available for a selected category
  initSettings(sublistIndex, regions: Array<any>, freqs: Array<any>, dateWrapper: dateWrapper, routeGeo?: string, routeFreq?: string) {
    let dateArray = [];

    this._uheroAPIService.fetchGeographies(sublistIndex['id']).subscribe((geos) => {
      geos.forEach((geo, index) => {
        this._helper.uniqueGeos(geos[index], regions);
      });
      this.regions = regions;
      // If geo. available as URL param, use as current geo
      if (routeGeo) {
        this.regions.forEach((geo, index) => {
          if (routeGeo === this.regions[index]['handle']) {
            this.currentGeo = this.regions[index];
          }
        });
      } else {
        // If a default region is available, export as current geo on page load
        this.regions.forEach((geo, index) => {
          if (this.defaultGeo === this.regions[index]['handle']) {
            this.currentGeo = this.regions[index];
          } else {
            this.currentGeo = this.regions[0];
          }
        });
      }

      this._uheroAPIService.fetchFrequencies(sublistIndex['id']).subscribe((frequencies) => {
        frequencies.forEach((frequency, index) => {
          this._helper.uniqueFreqs(frequencies[index], freqs);
        });
        this.freqs = freqs;
        // If freq. available as URL param, use as current frequency
        if (routeFreq) {
          this.freqs.forEach((freq, index) => {
            if (routeFreq === this.freqs[index]['freq']) {
              this.currentFreq = this.freqs[index];
            }
          });
        } else {
          // If a default freq. is available, export as current frequency on page load
          this.freqs.forEach((freq, index) => {
            if (this.defaultFreq === this.freqs[index]['label']) {
              this.currentFreq = this.freqs[index];
            } else {
              this.currentFreq = this.freqs[0];
            }
          });
        }

        // Get array of dates for a sublist
        this._uheroAPIService.fetchSelectedCategory(sublistIndex['id']).subscribe((cat) => {
          this._helper.calculateDateArray(cat['observationStart'], cat['observationEnd'], this.currentFreq.freq, dateArray);
        },
        (error) => {
         error = this.errorMessage = error
        },
        // When date array is completed, call sublistData()
        () => {
          // Fetch data for current region/frequency settings
          this._uheroAPIService.fetchExpanded(sublistIndex['id'], this.currentGeo.handle, this.currentFreq.freq).subscribe((expanded) => {
            this.expandedResults = expanded;
            console.log('expanded results', this.expandedResults);
          },
          (error) => {
            error = this.errorMessage = error;
          },
          () => {
            let series = this._helper.dataTransform(this.expandedResults, dateArray, dateWrapper);
            sublistIndex.dateRange = dateArray;
            this.seriesData.push({dateWrapper: dateWrapper, sublist: sublistIndex, series: series});
            console.log('seriesData', this.seriesData)
          });
        });
      });
    });
  }

  // Redraw series when a new region is selected
  redrawSeriesGeo(event) {
    this.geoHandle = event.handle;
    if (this.routeSearch) {
      this._router.navigate(['/category/search/' + this.routeSearch + '/' + this.geoHandle + '/' + this.currentFreq.freq]);
    } else {
      this._router.navigate(['/category/' + this.id + '/' + this.geoHandle + '/' + this.currentFreq.freq]);
    }
  }

  redrawSeriesFreq(event) {
    this.freqHandle = event.freq;
    if (this.routeSearch) {
      this._router.navigate(['/category/search/' + this.routeSearch + '/' + this.currentGeo.handle + '/' + this.freqHandle]);
    } else {
      this._router.navigate(['/category/' + this.id + '/' + this.currentGeo.handle + '/' + this.freqHandle]);
    }
  }

  onSearch(event) {
    console.log('search results', event);
    this._router.navigate(['/category/search/' + event])
  }


  saActive(e) {
    // console.log('checkbox', e)
    this.saIsActive = e.target.checked;
    console.log('SA On', this.saIsActive)
  }

  scrollTo(location: string): void {
    window.location.hash = location;
  }
}
