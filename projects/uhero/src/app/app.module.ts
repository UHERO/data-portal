import { BrowserModule } from "@angular/platform-browser";
import { NgModule } from "@angular/core";
import { environment } from "../environments/environment";
import { ToolsModule } from "tools";
import { AppRoutingModule } from "./app-routing.module";
import { AppComponent } from "./app.component";
import { ServiceWorkerModule } from '@angular/service-worker';

@NgModule({
  declarations: [AppComponent],
  imports: [BrowserModule, ToolsModule, AppRoutingModule, ServiceWorkerModule.register('./ngsw-worker.js', { enabled: environment.production })],
  providers: [
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
  bootstrap: [AppComponent],
})
export class AppModule {}
