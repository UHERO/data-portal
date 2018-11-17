import { Component, AfterViewInit, ViewChild, ViewContainerRef } from '@angular/core';
import { ICellEditorAngularComp } from 'ag-grid-angular';

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
      this.interactionSelect.element.nativeElement.focus();
    })
  }

  agInit(params: any): void {
    this.params = params;
    console.log('this.params', this.params)
  }

  getValue(): any {
    return true;
  }

  isPopup(): boolean {
    return true;
  }
}
