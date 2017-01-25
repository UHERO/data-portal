import { Component, OnInit, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-search-bar',
  templateUrl: './search-bar.component.html',
  styleUrls: ['./search-bar.component.scss']
})
export class SearchBarComponent implements OnInit {
  @Output() onSearch = new EventEmitter();

  constructor() { }

  ngOnInit() {
  }

  search(searchTerm: HTMLInputElement): void {
    this.onSearch.emit(searchTerm.value);
    // searchTerm.value = ''
  }
}
