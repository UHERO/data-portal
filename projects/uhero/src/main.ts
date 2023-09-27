import { enableProdMode, importProvidersFrom } from "@angular/core";
import { provideRouter, withComponentInputBinding, withHashLocation, withRouterConfig } from "@angular/router";
import { environment } from "./environments/environment";
import { AppComponent } from "./app/app.component";
import { ServiceWorkerModule } from "@angular/service-worker";
import { HTTP_INTERCEPTORS, provideHttpClient, withInterceptorsFromDi } from "@angular/common/http";
import { BrowserModule, bootstrapApplication } from "@angular/platform-browser";
import { uheroRoutes } from "./app/app-routing.module";
import { RequestCache } from "projects/shared/services/request-cache";
import { CacheInterceptor } from "projects/shared/services/cache.interceptor";
import { BrowserAnimationsModule, provideAnimations, provideNoopAnimations } from "@angular/platform-browser/animations";
if (environment.production) {
  enableProdMode();
}

bootstrapApplication(AppComponent, {
  providers: [
    provideAnimations(),
    provideNoopAnimations(),
    provideHttpClient(
        withInterceptorsFromDi()
    ),
    { provide: RequestCache, useClass: RequestCache },
    {
        provide: HTTP_INTERCEPTORS,
        useClass: CacheInterceptor,
        multi: true
    },
    provideRouter(uheroRoutes,
        withComponentInputBinding(),
        withHashLocation(),
        withRouterConfig({
            onSameUrlNavigation: 'reload'
        })
    ),
    importProvidersFrom(
      BrowserModule,
      BrowserAnimationsModule,
      ServiceWorkerModule.register("./ngsw-worker.js", {
        enabled: environment.production,
      })
    ),
    {
      provide: "environment",
      useValue: environment,
    },
    {
      provide: "rootCategory",
      useValue: 59,
    },
    {
      provide: "defaultRange",
      useValue: [
        { freq: "A", range: 10, start: "", end: "" },
        { freq: "Q", range: 10, start: "", end: "" },
        { freq: "S", range: 10, start: "", end: "" },
        { freq: "M", range: 10, start: "", end: "" },
        { freq: "W", range: 2, start: "", end: "" },
        { freq: "D", range: 1, start: "", end: "" },
      ],
    },
    {
      provide: "portal",
      useValue: {
        universe: "uhero",
        feedback: true,
        categoryTabs: true, // Display subcategory navigation tabs in category chart/table view
      },
    },
    {
      provide: "logo",
      useValue: {
        altText: "UHERO Data Portal Logo",
        analyticsLogoSrc: "assets/Analytics_Logo.svg",
        displayImg: true,
        headerText: "",
        imgSrc: "assets/UHEROdata-Logo-color.svg",
        mobileLogo: true,
      },
    },
    {
      provide: "GoogleAnalyticsId",
      useValue: "UA-18074519-3",
    },
  ],
}).catch((err) => console.error(err));
