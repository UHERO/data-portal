import { Injectable } from '@angular/core';
import { Http, Response, Headers, RequestOptionsArgs } from '@angular/http';
import { Observable } from 'rxjs/Observable';
import 'rxjs/Rx';

import { CategoryTree } from './category-tree';
import { Series } from './series';
import { Observations } from './observations';
import { ObservationResults } from './observation-results';

@Injectable()
export class UheroApiService {
  private baseUrl: string;
  private requestOptionsArgs: RequestOptionsArgs;
  private headers: Headers;

  constructor(private http: Http) {
     this.baseUrl = 'http://localhost:8080/v1';
     this.headers = new Headers();
     //this.headers.append('Authorization', 'Bearer OppnaVj5QtxnQOZqHjtziqdw564hUXmMzq9igMRAjFs=');
     //this.headers.append('Authorization', 'Bearer m-5JuaZ7oNT9WfT1g0l9pQcXV9JIdaDxFyZTOnQmdUo=');
     this.headers.append('Authorization', 'Bearer veJyc_Dn5trXxoCeYkQylrpFbxOP4TjbOcmkI9ZDGHI=');
     this.requestOptionsArgs = {headers: this.headers};
  }

  //  Get data from API
  fetchCategories(): Observable<CategoryTree> {
    let categories$ = this.http.get(`${this.baseUrl}/category`, this.requestOptionsArgs)
      .map(mapCategories);
    return categories$;
  }

  fetchSeries(id: number): Observable<Series> {
    let series$ = this.http.get(`${this.baseUrl}/category/series?id=` + id, this.requestOptionsArgs)
      .map(mapSeries);
    return series$;
  }

  fetchGeographies(): Observable<any> {
     return this.http.get(`${this.baseUrl}/geo`, this.requestOptionsArgs)
         .map(response => response.json());
  }

  fetchObservations(id: number): Observable<ObservationResults> {
    let observations$ = this.http.get(`${this.baseUrl}/series/observations?id=` + id, this.requestOptionsArgs)
      .map(mapObservations);
    return observations$;
  }

  // End get data from API
}

// Create a nested JSON of parent and child categories
// Used for landing-page.component
// And side bar navigation on single-series & table views
function mapCategories(response: Response): CategoryTree {
  let categories = response.json().data;
  let dataMap = categories.reduce((map, value) => (map[value.id] = value, map), {});
  let categoryTree = [];
  categories.forEach((value) => {
    let parent = dataMap[value.parentId];
    if(parent) {
      (parent.children || (parent.children = [])).push(value);
    } else {
      categoryTree.push(value);
    }
  });
  console.log(categoryTree);
  return categoryTree;
}

function mapSeries(response: Response): Series {
  let series = response.json().data;
  //console.log(series);
  return series;
}

function mapObservations(response: Response): ObservationResults {
  let observations = response.json().data.transformationResults;
  let level = observations[0].observations;
  let perc = observations[1].observations;

  let tableData = [];
  let levelValue = [];
  let percValue = [];

  level.forEach((entry, index) => {
    //Create [date, value] pairs for charts
    levelValue.push([Date.parse(level[index].date), +level[index].value]);
    percValue.push([Date.parse(level[index].date), +perc[index].value]);

    tableData.push({
      date: level[index].date,
      level: +level[index].value,
      perc: +perc[index].value
    });
  });

  // sort data from earliest to most recent, needed for HighStock Chart
  levelValue
  percValue

  let chartData = {level: levelValue, perc: percValue};
  let data = {'chart data': chartData, 'table data': tableData};

  return data;
}
