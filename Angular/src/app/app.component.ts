import { Component, OnDestroy, ViewChild } from '@angular/core';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatDialog } from '@angular/material/dialog';
import { SpinnerDialog } from './dialogs/spinner-dialog/spinner.dialog';
import { interval } from 'rxjs';
import { MagicMirrorService } from './services/magic-mirror.service';


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnDestroy {
  title = 'MMInterface';
  showFiller = false;
  showSideNav: boolean = true;
  callTimeout: any;

  constructor(private dialog: MatDialog, private mmService: MagicMirrorService) {
  }
  ngOnDestroy(): void {
    if (this.callTimeout) {
      clearTimeout(this.callTimeout);
    }
  }

  @ViewChild('sidenav') sidenav!: MatSidenavModule;

  showSubmenu: boolean = false;
  isShowing = false;
  showSubSubMenu: boolean = false;

  mouseenter() {
    if (!this.showSideNav) {
      this.isShowing = true;
    }
  }

  mouseleave() {
    if (!this.showSideNav) {
      this.isShowing = false;
    }
  }
  showSideMenu(show: boolean) {
    // this.items.push(newItem);
    this.showSideNav = show;
    console.log(show);
  }
 

}
