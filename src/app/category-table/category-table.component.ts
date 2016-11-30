import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { UheroApiService } from '../uhero-api.service';
import { Frequency } from '../frequency';
import { Geography } from '../geography';

import { error } from 'util';


@Component({
  selector: 'app-category-table',
  templateUrl: './category-table.component.html',
  styleUrls: ['./category-table.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class CategoryTableComponent implements OnInit {
  private selectedCategory;
  private sublist;
  private categories;
  private id: number;
  private errorMessage: string;

  private seriesData = [];
  private categoryData = [];

  // Variables for geo and freq selectors
  private geoHandle: string;
  private freqHandle: string;
  private defaultFreq: string;
  private defaultGeo: string;
  public regions = [];
  public freqs = [];
  public currentGeo: Geography;
  public currentFreq: Frequency;

  constructor(private _uheroAPIService: UheroApiService, private route: ActivatedRoute) { }

  ngOnInit() {
    this.currentGeo = {fips: null, name: null, handle: null};
    this.currentFreq = {freq: null, label: null};
  }

  ngAfterViewInit() {
    this.route.params.subscribe(params => {
      this.id = Number.parseInt(params['id']);
      if (isNaN(this.id)) {
        this.id = 42;
        this.drawSeriesTable(42);
      } else {
        this.drawSeriesTable(this.id);
      }
    });
  }

  drawSeriesTable(catId: number) {
    let geoArray = [];
    let freqArray = [];

    // this.currentFreq = this.freqs[0];
    this._uheroAPIService.fetchCategories().subscribe((category) => {
      let categories = category;

      categories.forEach((category, index) => {
        // Look for selected category in list of available categories
        if (categories[index]['id'] === catId) {
          this.selectedCategory = categories[index]['name'];
          this.sublist = categories[index]['children'];

          // Get a category's default geo and freq if available
          if (categories[index]['defaults']) {
            this.defaultFreq = categories[index]['defaults']['freq'];
            this.defaultGeo = categories[index]['defaults']['geo'];
          } else {
            this.defaultFreq = '';
            this.defaultGeo = '';
          }

          this.sublist.forEach((sub, index) => {
            this._uheroAPIService.fetchGeographies(this.sublist[index]['id']).subscribe((geos) => {
              geos.forEach((geo, index) => {
                this.uniqueGeos(geos[index], geoArray);
              });
              this.regions = geoArray;

              // If a default geo is available, export as current geography on page load
              this.regions.forEach((geo, index) => {
                if (this.defaultGeo === this.regions[index]['handle']) {
                  this.currentGeo = this.regions[index];
                } else {
                  this.currentGeo = this.regions[0];
                }
              })

              this._uheroAPIService.fetchFrequencies(this.sublist[index]['id']).subscribe((frequencies) => {
                frequencies.forEach((frequency, index) => {
                  this.uniqueFreqs(frequencies[index], freqArray);
                });
                this.freqs = freqArray;

                // If a default freq. is available, export as current frequency on page load
                this.freqs.forEach((freq, index) => {
                  if (this.defaultFreq === this.freqs[index]['label']) {
                    this.currentFreq = this.freqs[index];
                  } else {
                    this.currentFreq = this.freqs[0];
                  }
                });

                this._uheroAPIService.fetchMultiChartData(this.sublist[index]['id'], this.currentGeo.handle, this.currentFreq.freq).subscribe((results) => {
                  this.sublist[index]['series'] = results[0];
                  this.seriesData.push({'sublist': this.sublist[index]});
                  console.log('series data', this.seriesData);

                  this.seriesData.forEach((sub, index) => {
                    let tableData = [];
                    let series$ = this.seriesData[index];
                    console.log('sublist', this.seriesData[index]);
                    /* series$['series'].forEach((serie, index) => {
                      this.categoryData.push({'sublist': series$['sublist'], 'observations': series$['series'][index]['observations']});
                    }); */
                  });

                  console.log('category table', this.categoryData);
                });
              });
            });
          });
        } else {
          return;
        }
      },
      this.seriesData = []);
    },
    error => this.errorMessage = error);
  }

  // Update table data when a new region/frequency is selected
  redrawTableGeo(event) {
    this.geoHandle = event.handle;
    this._uheroAPIService.fetchCategories().subscribe((category) => {
      let categories = category;

      categories.forEach((category, index) => {
        if (categories[index]['id'] === this.id) {
          this.sublist = categories[index]['children'];
          this.sublist.forEach((sub, index) => {
              this._uheroAPIService.fetchMultiChartData(this.sublist[index]['id'], event.handle, this.currentFreq.freq).subscribe((results) => {
                this.seriesData.push({'sublist': this.sublist[index], 'series': results[0]});
              });
          });
        } else {
          return;
        }
      },
      this.seriesData = []);
    },
    error => this.errorMessage = error);
  }

  redrawTableFreq(event) {
    this.freqHandle = event.freq;
    this._uheroAPIService.fetchCategories().subscribe((category) => {
      let categories = category;

      categories.forEach((category, index) => {
        if (categories[index]['id'] === this.id) {
          this.sublist = categories[index]['children'];
          this.sublist.forEach((sub, index) => {
              this._uheroAPIService.fetchMultiChartData(this.sublist[index]['id'], this.currentGeo.handle, event.freq).subscribe((results) => {
                this.seriesData.push({'sublist': this.sublist[index], 'series': results[0]});
              });
          });
        } else {
          return;
        }
      },
      this.seriesData = []);
    },
    error => this.errorMessage = error);
  }

  // Get a unique array of available regions for a category
  uniqueGeos(geo, geoList) {
    let exist = false;
    for (let i in geoList) {
      if (geo.name === geoList[i].name) {
        exist = true;
      }
    }

    if (!exist) {
      geoList.push(geo);
    }
  }

  // Get a unique array of available frequencies for a category
  uniqueFreqs(freq, freqList) {
    let exist = false;
    for (let i in freqList) {
      if (freq.label === freqList[i].label) {
        exist = true;
      }
    }

    if (!exist && (freq.freq === 'A' || freq.freq === 'M' || freq.freq === 'Q')) {
      freqList.push(freq);
    }
  }


  scrollTo(location: string): void {
    window.location.hash = location;
  }


}