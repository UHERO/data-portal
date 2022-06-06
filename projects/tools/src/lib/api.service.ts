import { Observable } from 'rxjs';
import { tap, map } from 'rxjs/operators';
import { Injectable, Inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Category } from './category';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private baseUrl: string;
  private httpOptions;

  constructor(
    @Inject('environment') private environment,
    @Inject('rootCategory') private rootCategory,
    @Inject('portal') private portal,
    private http: HttpClient
  ){
    this.baseUrl = this.environment.apiUrl;
  }

  // Get data from API
  // Gets all available categories. Used for navigation & displaying sublists
  fetchCategories(): Observable<Category[]> {
    let categories$ = this.http.get(`${this.baseUrl}/category?u=${this.portal.universe}`).pipe(
      map(mapCategories, this),
      tap(val => {
        categories$ = null;
      }), );
    return categories$;
  }

  retrieveAPIData = (apiEndpoint: string): Observable<any> => {
    let data$ = this.http.get(apiEndpoint, this.httpOptions).pipe(
      map(mapData),
      tap(val => {
        data$ = null;
      }), );
    return data$;
  }

  fetchCategoryGeos(id: number): Observable<any> {
    return this.retrieveAPIData(`${this.baseUrl}/category/geo?id=${id}`);
  }

  fetchCategoryFreqs(id: number): Observable<any> {
    return this.retrieveAPIData(`${this.baseUrl}/category/freq?id=${id}`);
  }

  fetchCategoryForecasts(id: number): Observable<any> {
    return this.retrieveAPIData(`${this.baseUrl}/category/fc?id=${id}`);
  }

  // Gets observations for series in a (sub) category
  fetchExpanded(id: number, geo: string, freq: string, noCache: boolean, fc: string = ''): Observable<any> {
    const caching = noCache ? '&nocache' : '';
    const forecast = fc ? `&fc=${fc}` : '';
    const url = `${this.baseUrl}/category/series?id=${id}&geo=${geo}&freq=${freq}${forecast}&u=${this.portal.universe}&expand=true${caching}`;
    return this.retrieveAPIData(url);
  }

  fetchPackageSeries(id: number, noCache: boolean, catId?: number) {
    const caching = noCache ? '&nocache' : '';
    const url = `${this.baseUrl}/package/series?id=${id}&u=${this.portal.universe}&cat=${catId}${caching}`;
    return this.retrieveAPIData(url);
  }

  fetchCategoryMeasurements(id: number, noCache: boolean) {
    const caching = noCache ? '&nocache' : '';
    return this.retrieveAPIData(`${this.baseUrl}/category/measurements?id=${id}${caching}`);
  }

  fetchMeasurementSeries(id: number, noCache: boolean) {
    const caching = noCache ? '&nocache' : '';
    return this.retrieveAPIData(`${this.baseUrl}/measurement/series?id=${id}&expand=true${caching}`);
  }

  fetchSiblingSeriesByIdAndGeo(id: number, geo: string, seasonal: string, freq: string) {
    const cacheId = seasonal ? `${id + geo + freq}SA` : id + geo + freq;
    return this.retrieveAPIData(`${this.baseUrl}/series/siblings?id=${id}&geo=${geo}&u=${this.portal.universe}`);
  }

  fetchSearch(search: string, noCache: boolean) {
    const caching = noCache ? '&nocache' : '';
    return this.retrieveAPIData(`${this.baseUrl}/search?q=${search}&u=${this.portal.universe}${caching}`);
  }

  fetchSearchSeries(search: string, noCache: boolean): Observable<any> {
    const caching = noCache ? '&nocache' : '';
    return this.retrieveAPIData(`${this.baseUrl}/search/series?q=${search}&u=${this.portal.universe}${caching}`);
  }

  fetchPackageSearch(search: string, geo: string, freq: string, noCache: boolean) {
    const caching = noCache ? '&nocache' : '';
    const url = `${this.baseUrl}/package/search?q=${search}&u=${this.portal.universe}&geo=${geo}&freq=${freq}${caching}`;
    return this.retrieveAPIData(url);
  }

  fetchPackageAnalyzer(ids: string, noCache: boolean) {
    const caching = noCache ? '&nocache' : '';
    const url = `${this.baseUrl}/package/analyzer?ids=${ids}&u=${this.portal.universe}${caching}`;
    return this.retrieveAPIData(url);
  }

  fetchPackageMomTransformation(ids: string, noCache: boolean) {
    const caching = noCache ? '&nocache' : '';
    const url = `${this.baseUrl}/package/analyzermom?ids=${ids}&u=${this.portal.universe}${caching}`;
    return this.retrieveAPIData(url);
  }

  // Gets observation data for a series
  fetchObservations(id: number, noCache: boolean) {
    const caching = noCache ? '&nocache' : '';
    return this.retrieveAPIData(`${this.baseUrl}/series/observations?id=${id}${caching}`);
  }
}

// Create a nested JSON of parent and child categories
// Used for landing-page.component
// And side bar navigation on single-series & table views
function mapCategories(response): Array<Category> {
  const categories = response.data;
  const dataMap = categories.reduce((m, value) => (m[value.id] = value, m), {});
  const categoryTree = [];
  categories.forEach((value) => {
    const parent = dataMap[value.parentId];
    if (parent) {
      (parent.children || (parent.children = [])).push(value);
    } else {
      categoryTree.push(value);
    }
  });
  let result = categoryTree;
  categoryTree.forEach((category) => {
    if (category.id === this.rootCategory) {
      result = category.children;
    }
  });
  return result;
}

function mapData(response): any {
  return response.data;
}
