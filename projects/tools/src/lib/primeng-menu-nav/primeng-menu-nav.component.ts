import { Component, Inject, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router, NavigationEnd } from '@angular/router';
import { AnalyzerService } from '../analyzer.service';
import { ApiService } from '../api.service';
import { MenuItem } from 'primeng/api';
import { DataPortalSettingsService } from '../data-portal-settings.service';

@Component({
  selector: 'lib-primeng-menu-nav',
  templateUrl: './primeng-menu-nav.component.html',
  styleUrls: ['./primeng-menu-nav.component.scss'],
})
export class PrimengMenuNavComponent implements OnInit, OnDestroy {
  public categories;
  public reveal = false;
  public overlay = false;
  public selectedCategory: any;
  private id: string;
  private view: string;
  private yoy: string;
  private ytd: string;
  private loading;
  public headerLogo;
  analyzerSeries;
  private defaultCategory;
  private packageCatData;
  private expand = true;
  analyzerSeriesCount;
  portalSettings;
  navMenuItems: MenuItem[];
  uheroLogo: boolean;

  constructor(
    @Inject('logo') private logo,
    private apiService: ApiService,
    private dataPortalSettingsServ: DataPortalSettingsService,
    @Inject('portal') private portal,
    public analyzerService: AnalyzerService,
    private activatedRoute: ActivatedRoute,
    private router: Router
  ) {
    this.analyzerSeriesCount = this.analyzerService.analyzerSeriesCount$.subscribe((data: any) => {
      this.analyzerSeries = data;
    });
    this.portalSettings = this.dataPortalSettingsServ.dataPortalSettings[this.portal.universe];
  }

  ngOnInit() {
    this.apiService.fetchCategories().subscribe((categories) => {
      this.categories = categories;
      this.navMenuItems = [];
      categories.forEach((category) => {
        this.addMenuItem(this.navMenuItems, category);
      });
    },
      (error) => {
        console.log('error', error);
      },
      () => {
        this.defaultCategory = this.categories[0].id;
        this.activatedRoute.queryParams.subscribe((params) => {
          this.id = params[`id`];
          this.view = params[`view`] || 'chart';
          this.yoy = params[`yoy`] || 'false';
          this.ytd = params[`ytd`] || 'false';
          this.selectedCategory = this.id ? this.findSelectedCategory(this.id) : this.checkRoute(this.id, this.router.url);
          this.navMenuItems.forEach((item) => {
            if (this.id) {
              item.expanded = item.id === this.id ? true : false;
            }
            if (!this.id && this.selectedCategory !== 'analyzer' && this.selectedCategory !== 'help') {
              item.expanded = +item.id === this.defaultCategory ? true : false;
            }
          });
        });
      });
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        this.selectedCategory = this.checkRoute(this.id, event.url);
      }
    });
    this.headerLogo = this.logo;
    this.uheroLogo = this.logo.altText.includes('UHERO');
  }

  ngOnDestroy() {
    this.analyzerSeriesCount.unsubscribe();
  }

  addMenuItem = (navMenuItems: Array<any>, category: any) => {
    const menuItem = {
      id: `${category.id}`,
      label: category.name,
      icon: 'pi pi-pw',
      ...(category.children && { items: this.createSubmenuItems(category.children, category.id) }),
      command: (event) => {
        this.navToFirstDataList(event.item, category.id);
      }
    }
    navMenuItems.push(menuItem);
  }

  // navigate to Summary or first data list when clicking on a category
  navToFirstDataList(menuItem, categoryId) {
    if (!menuItem.items) {
      this.navigate(categoryId, menuItem.id);
    }
    if (menuItem.items) {
      return this.navToFirstDataList(menuItem.items[0], categoryId);
    }
  }

  createSubmenuItems(subcategories, categoryId) {
    const subMenu = [];
    subcategories.forEach((sub) => {
      const subMenuItem: MenuItem = {};
      subMenuItem.label = sub.name;
      subMenuItem.icon = sub.children ? 'pi pi-pw' : '';
      subMenuItem.id = sub.id;
      if (sub.children) {
        subMenuItem.command = (event) => {
          this.navToFirstDataList(event.item, categoryId);
        };
        subMenuItem.items = this.createSubmenuItems(sub.children, categoryId);
      }
      if (!sub.children) {
        subMenuItem.command = (event) => {
          this.navigate(categoryId, sub.id);
        };
      }
      subMenu.push(subMenuItem);
    });
    return subMenu;
  }


  findSelectedCategory(id) {
    if (id === undefined) {
      return this.defaultCategory;
    }
    if (id && isNaN(id)) {
      return null;
    }
    if (id && +id) {
      return +id;
    }
  }

  checkRoute(id, url) {
    if (url.includes('/help')) {
      return 'help';
    }
    if (url.includes('/analyzer')) {
      return 'analyzer';
    }
    return this.findSelectedCategory(id);
  }

  navigate(catId, subId?) {
    // If a popover from the category tables is open, remove when navigating to another category
    const popover = $('.popover');
    if (popover) {
      popover.remove();
    }
    this.loading = true;
    this.selectedCategory = catId;
    setTimeout(() => {
      const catQParams = {
        id: catId,
        data_list_id: subId,
        analyzerSeries: null,
        chartSeries: null,
        start: null,
        end: null,
        name: null,
        units: null,
        geography: null
      };
        this.router.navigate(['/category'], { queryParams: catQParams, queryParamsHandling: 'merge' });

      this.loading = false;
    }, 15);
  }

  onSearch(event) {
    const searchQParams = {
      id: event,
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
    this.reveal = this.reveal === false ? true : false;
    this.overlay = this.overlay === false ? true : false;
  }
}
