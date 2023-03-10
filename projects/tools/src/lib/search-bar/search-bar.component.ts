import { Component, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'lib-search-bar',
  templateUrl: './search-bar.component.html',
  styleUrls: ['./search-bar.component.scss']
})
export class SearchBarComponent {
  @Output() search = new EventEmitter();

  constructor() { }

  searchHandler(searchTerm: HTMLInputElement): void {
    if (searchTerm.value) {
      this.search.emit(searchTerm.value);
      searchTerm.value = '';
    }
    if (!searchTerm.value) {
      return;
    }
  }
}
