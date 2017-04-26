import { Component, OnInit, Input } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { UheroApiService } from '../uhero-api.service';

@Component({
  selector: 'app-sidebar-nav',
  templateUrl: './sidebar-nav.component.html',
  styleUrls: ['./sidebar-nav.component.scss']
})
export class SidebarNavComponent implements OnInit, Input {
  private categories;
  private errorMessage: string;
  public expand: string = null;
  private reveal = false;
  private overlay = false;
  private selectedCategory: number;
  private id: number;

  constructor(private _uheroAPIService: UheroApiService, private route: ActivatedRoute, private _router: Router) { }

  ngOnInit() {
    this._uheroAPIService.fetchCategories().subscribe(
      categories => this.categories = categories,
      error => this.errorMessage = error);

    this.route.queryParams.subscribe((params) => {
      this.id = +params['id'];
      const search = params['search'];
      if (this.id) {
        this.selectedCategory = this.id;
      } else if (search) {
        this.selectedCategory = null;
      } else {
        this.selectedCategory = 42;
      }
    });
  }

  mobileMenuToggle(): void {
    this.reveal = this.reveal === false ? true : false;
    this.overlay = this.overlay === false ? true : false;
  }

  onSearch(event) {
    this._router.navigate(['/category/search'], { queryParams: {search: event}} );
  }

}
