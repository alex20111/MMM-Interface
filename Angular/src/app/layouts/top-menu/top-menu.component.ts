import { DOCUMENT } from '@angular/common';
import { Component, Output, EventEmitter, OnInit, HostListener, Inject, ViewChild, ElementRef } from '@angular/core';
import { MatRadioChange } from '@angular/material/radio';
import { LocalStorageService } from 'src/app/services/local-storage.service';


@Component({
  selector: 'app-top-menu',
  templateUrl: './top-menu.component.html',
  styleUrls: ['./top-menu.component.css']
})
export class TopMenuComponent implements OnInit {

  phoneSize = false;
  selected: any;

  theme = [{
    name: 'Deep Purple & Amber (Light)',
    value: 'deepPurpleAmber.css',
    checked: false
  },
  {
    name: 'Indigo & Pink (Light)',
    value: 'indigoPink.css',
    checked: false
  },
  {
    name: 'Pink & Blue-grey (Dark)',
    value: 'pinkBlueGrey.css',
    checked: false
  },
  {
    name: 'Purple & Green (Dark)',
    value: 'purpleGreen.css',
    checked: false
  }
]

@ViewChild('mainThemes') mainThemesEle!: ElementRef; 


  ngOnInit(): void {

    let themeVal = this.lstorage.getData("theme");
    console.log("themesVar: " , themeVal);

    if (themeVal){
      (document.getElementById('mainThemesId') as HTMLLinkElement).setAttribute('href',themeVal);
      for(let t of this.theme){
        if (t.value === themeVal){
          t.checked = true;
        }
      }
    }else{
      this.theme[0].checked = true;
    }
   

    this.phoneSize = (window.innerWidth <= 400) ? true : false;


    if (this.phoneSize) {
      this.sideMenu(false);
    }else{
      this.sideMenu(true);
    }
  }

  @Output() newItemEvent = new EventEmitter<boolean>();
  sideMenuVisible: boolean = true;

  constructor(private lstorage: LocalStorageService, @Inject(DOCUMENT) document: Document){}

  toggleSideMenu() {
    this.sideMenu(!this.sideMenuVisible);
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: Event) {
    if ((event.target as Window).innerWidth < 400 && this.sideMenuVisible) {
      this.sideMenu(false);
    } else if ((event.target as Window).innerWidth > 400 && !this.sideMenuVisible) {
      this.sideMenu(true);
    }
    // this.width = (event.target as Window).innerWidth;
    // this.height = (event.target as Window).innerHeight;
  }

  sideMenu(visible: boolean) {
    this.sideMenuVisible = visible;
    this.newItemEvent.emit(this.sideMenuVisible);
  }

  selectedValue(evnt:MatRadioChange){

    (document.getElementById('mainThemesId') as HTMLLinkElement).setAttribute('href',evnt.value);

    this.lstorage.saveData("theme", evnt.value);

  }

}
