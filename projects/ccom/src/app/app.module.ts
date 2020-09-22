import { BrowserModule } from "@angular/platform-browser";
import { NgModule } from "@angular/core";
import { environment } from "../environments/environment";
import { ToolsModule } from "tools";
import { AppRoutingModule } from "./app-routing.module";
import { AppComponent } from "./app.component";
import { CcomHelpComponent } from "./ccom-help/ccom-help.component";

@NgModule({
  declarations: [AppComponent, CcomHelpComponent],
  imports: [BrowserModule, ToolsModule, AppRoutingModule],
  providers: [
    {
      provide: "environment",
      useValue: environment,
    },
    {
      provide: "rootCategory",
      useValue: 9911,
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
        universe: "ccom",
        feedback: true,
        categoryTabs: true, // Display subcategory navigation tabs in category chart/table view
      },
    },
    {
      provide: 'logo',
      useValue: {
        altText: 'Chamber of Commerce Hawaii Logo',
        displayImg: true,
        headerText: '',
        imgSrc: "assets/cochawaii_logo.jpg",
        mobileLogo: true,
      }
    },
    {
      provide: "GoogleAnalyticsId",
      useValue: "UA-18074519-6",
    },
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}