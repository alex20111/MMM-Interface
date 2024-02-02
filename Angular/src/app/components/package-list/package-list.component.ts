import { AfterContentInit, AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { AddModuleDialogComponent } from 'src/app/dialogs/add-module-dialog/add-module-dialog.component';
import { MagicMirrorService } from 'src/app/services/magic-mirror.service';
import { RefreshmmSnackbarComponent } from 'src/app/snackBars/refreshmm-snackbar/refreshmm-snackbar.component';

export interface ThirdPartyData {
  Title: string,
  Author: string,
  Description: string,
  installed?: boolean
}

const CATEGORIES: string[] = [
  'Development / Core MagicMirror',
  'Finance',
  'News / Information',
  'Transport / Travel',
  'Voice Control',
  'Weather',
  'Religion',
  'Sports',
  'Utility / IOT / 3rd Party / Integration',
  'Entertainment / Misc',
  'Health',
  'Education'
]

@Component({
  selector: 'app-package-list',
  templateUrl: './package-list.component.html',
  styleUrls: ['./package-list.component.css']
})
export class PackageListComponent implements OnInit {

  categories = CATEGORIES;
  selectedCategory: string = CATEGORIES[0];
  displayedColumns: string[] = ['Title', 'Author', 'Description', 'Actions'];
  dataSource!: MatTableDataSource<ThirdPartyData>;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  tableMap: Map<string, ThirdPartyData[]> = new Map<string, ThirdPartyData[]>;
  tableList: ThirdPartyData[] = [];

  checked: boolean = false;

  message: string = '';
  messageType: string = '';
  loading: boolean = false;

  constructor(private mmService: MagicMirrorService,
    public dialog: MatDialog,
    private _snackBar: MatSnackBar) {
  }

  ngOnInit(): void {
    this.loading = true;
    this.mmService.thirdPartyModuleList().subscribe({
      next: (packageList) => {
        //  this.tableList =  packageList.payload;
        packageList.payload.pop();
        packageList.payload.forEach((parent: any, parentIdx: number) => {

          // this.tableMap.set(parentIdx)
          let childList: ThirdPartyData[] = [];
          parent.forEach((child: any) => {
            const test: ThirdPartyData = child;
            childList.push(test);
          });

          this.tableMap.set(CATEGORIES[parentIdx], childList);
        });

        // console.log("tableList ", this.tableMap);
        let initCategories = this.tableMap.get(CATEGORIES[0]);
        if (initCategories) {
          this.tableList = initCategories;
        }
        this.dataSource = new MatTableDataSource(this.tableList);

        this.dataSource.paginator = this.paginator;
        this.loading = false;
      },
      error: (err) => {
        console.log("error loading: ", err);
        this.displayMessage(`Error loading: ${err.message} `, 'error');
        this.loading = false;
      }
    });
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }
  onChangeCat() {
    console.log("change: ", this.selectedCategory);
    this.checked = false;
    let initCategories: ThirdPartyData[] = [];
    if (this.selectedCategory === 'All') {

      this.tableMap.forEach((value: ThirdPartyData[], key: string) => {
        //  console.log(value)
        initCategories.push(...value);
      })
    } else {
      initCategories = this.tableMap.get(this.selectedCategory) as ThirdPartyData[];
    }

    if (initCategories) {
      this.tableList = initCategories;
      this.dataSource = new MatTableDataSource(this.tableList);
      this.dataSource.paginator = this.paginator;
    }
  }

  addModule(row: any, idx: number) { //myString.replace(/<[^>]*>?/gm, '');
    console.log(row, idx);
    let content = String(row.Title);


    let plainText = content.replace(/<[^>]*>/g, '');
    let moduleGitUrl = content.match(/href="([^"]*)/);

    const dialogRef = this.dialog.open(AddModuleDialogComponent, {
      width: '400px',
      disableClose: true,
      data: { name: plainText, gitUrl: moduleGitUrl ? `${moduleGitUrl[1]}` : "NoUrl" },
    });

    dialogRef.afterClosed().subscribe(result => {
      console.log('The dialog was closed. Result: ', result);
      if (result === "success") {
        this.dataSource.filteredData[idx].installed = true;

        this.showRefreshSnackbar();
        //update list to add APP installed to the table
      }
    });
  }
  showRefreshSnackbar() {
    console.log("showRefreshSnackbar");
    let snackBarRef = this._snackBar.openFromComponent(RefreshmmSnackbarComponent, {
      data: { message: "any message", autoRefresh: true },
      verticalPosition: 'bottom',
      horizontalPosition: 'right'

    });

    snackBarRef.afterDismissed().subscribe((result: any) => {

      if (result.dismissedByAction) {

      }

    });
  }
  checkCheckBoxvalue(event: any) {
    // console.log(event, this.checked);

    if (event.checked) {
      this.checked = true;
      let installedModules: ThirdPartyData[] = [];
      this.tableMap.forEach((value: ThirdPartyData[], key: string) => {
        value.forEach(mod => {
          if (mod.installed) {
            installedModules.push(mod);
          }
        })
        // initCategories.push(...value);
        if (installedModules) {
          this.dataSource = new MatTableDataSource(installedModules);
          this.dataSource.paginator = this.paginator;
        }
      })
    } else {
      this.checked = false;
      console.log("onchange then false");
      this.onChangeCat();
    }

  }

  private displayMessage(msg: string, msgType: string){
    this.message = msg;
    this.messageType = msgType;
  }

  deleteModule(row: any) {

  }
 
}



