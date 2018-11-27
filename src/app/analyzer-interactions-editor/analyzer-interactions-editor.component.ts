import { Component, AfterViewInit, ViewChild, ViewContainerRef } from '@angular/core';
import { ICellEditorAngularComp } from 'ag-grid-angular';
declare var $: any;

@Component({
  selector: 'app-analyzer-interactions-editor',
  templateUrl: './analyzer-interactions-editor.component.html',
  styleUrls: ['./analyzer-interactions-editor.component.scss']
})
export class AnalyzerInteractionsEditorComponent implements ICellEditorAngularComp, AfterViewInit {
  private params: any;
  @ViewChild('interaction-select', { read: ViewContainerRef }) public interactionSelect;

  constructor() { }

  ngAfterViewInit() {
    setTimeout(() => {
      $('.dropdown').dropdown('toggle')
    })
  }

  agInit(params: any): void {
    this.params = params;
  }

  invokeParentSwitchChartYAxes() {
    this.params.context.componentParent.switchChartYAxes(this.params.value);
  }

  invokeParentToggleSeriesInChart() {
    console.log('invoke parent toggle', this.params.value);
    this.params.context.componentParent.toggleSeriesInChart(this.params.value);
  }

  invokeParentRemoveFromAnalyzer() {
    this.params.context.componentParent.removeFromAnalyzer(this.params.value);
  }

  getValue(): any {
    return this.params.value;
  }

  isPopup(): boolean {
    return true;
  }
}
