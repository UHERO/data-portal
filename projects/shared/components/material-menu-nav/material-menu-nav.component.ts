import { Component, Inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router, NavigationEnd, RouterLink, RouterLinkActive } from '@angular/router';
import { MatTreeModule } from '@angular/material/tree';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { AnalyzerService } from 'projects/shared/services/analyzer.service';
import { ApiService } from 'projects/shared/services/api.service';
import { DataPortalSettingsService } from 'projects/shared/services/data-portal-settings.service';
import { SearchBarComponent } from '../search-bar/search-bar.component';
import { Category } from '../../models/Category';
import { Portal, PortalSettings } from 'projects/shared/models/DataPortalSettings';
import { AppLogo } from 'projects/shared/models/logo';

interface CategoryNode {
  id: string;
  label: string;
  routerLink?: string;
  queryParams?: Record<string, any>;
  children?: CategoryNode[];
}

@Component({
  selector: 'lib-material-menu-nav',
  templateUrl: './material-menu-nav.component.html',
  styleUrls: ['./material-menu-nav.component.scss'],
  imports: [
    RouterLink,
    RouterLinkActive,
    SearchBarComponent,
    MatTreeModule,
    MatIconModule,
    MatButtonModule
  ]
})
export class MaterialMenuNavComponent implements OnInit {
  public categories: Category[] = [];
  public reveal = false;
  public overlay = false;
  public selectedCategory: number | string | null | undefined;
  private id?: number;
  private defaultCategory?: number;
  private loading?: boolean;
  public headerLogo!: AppLogo;
  public uheroLogo: boolean = true;
  public portalSettings: PortalSettings;

  dataSource: CategoryNode[] = [];
  childrenAccessor = (node: CategoryNode) => node.children ?? [];
  hasChild = (_: number, node: CategoryNode) => !!node.children?.length;

  constructor(
    @Inject('logo') private logo: AppLogo,
    private apiService: ApiService,
    private dataPortalSettingsServ: DataPortalSettingsService,
    @Inject('portal') private portal: Portal,
    public analyzerService: AnalyzerService,
    private activatedRoute: ActivatedRoute,
    private router: Router,
  ) {
    this.portalSettings = this.dataPortalSettingsServ.dataPortalSettings[this.portal.universe];
  }

  ngOnInit() {
    this.apiService.fetchCategories().subscribe(
      (categories) => {
        this.categories = categories;
        this.dataSource = categories.map((category) => this.buildNode(category, `${category.id}`));
      },
      (error) => {
        console.log('error', error);
      },
      () => {
        this.defaultCategory = this.categories[0].id;
        this.activatedRoute.queryParams.subscribe((params) => {
          const rawId = params['id'];
          this.id = rawId !== undefined ? +rawId : undefined;
          this.selectedCategory = this.id
            ? this.findSelectedCategory(this.id)
            : this.checkRoute(this.id, this.router.url);
        });
      }
    );

    this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        this.selectedCategory = this.checkRoute(this.id, event.url);
      }
    });

    this.headerLogo = this.logo;
    this.uheroLogo = this.logo.altText.includes('UHERO');
  }

  // Leaf nodes get a real navigation target.
  // Branch nodes are pure expand/collapse toggles now — no navigation.
  private buildNode(category: Category, topCategoryId: string): CategoryNode {
    const node: CategoryNode = {
      id: `${category.id}`,
      label: category.name,
    };

    if (category.children?.length) {
      node.children = category.children.map((sub) => this.buildNode(sub, topCategoryId));
    } else {
      node.routerLink = '/category';
      node.queryParams = this.setQueryParams(topCategoryId, category.id);
    }

    return node;
  }

  setQueryParams = (categoryId: string, subcategoryId: number) => ({
    id: categoryId,
    data_list_id: subcategoryId,
    analyzerSeries: null,
    chartSeries: null,
    name: null,
    units: null,
  });

  findSelectedCategory(id: number | undefined): number | null | undefined {
    if (id === undefined) return this.defaultCategory;
    return isNaN(id) ? null : +id;
  }

  checkRoute(id: number | undefined, url: string): number | string | null | undefined {
    if (url.includes('/help')) return 'help';
    if (url.includes('/analyzer')) return 'analyzer';
    return this.findSelectedCategory(id);
  }

  menuClickHandler() {
    const popover = document.querySelector('.popover');
    if (popover) popover.remove();
    this.loading = true;
  }

  onSearch(searchTerm: string) {
    const searchQParams = {
      id: searchTerm,
      analyzerSeries: null,
      chartSeries: null,
      start: null,
      end: null,
      name: null,
      units: null,
      geography: null
    };
    this.router.navigate(['/search'], { queryParams: searchQParams, queryParamsHandling: 'merge' });
  }

  mobileMenuToggle(): void {
    this.reveal = !this.reveal;
    this.overlay = !this.overlay;
  }
}