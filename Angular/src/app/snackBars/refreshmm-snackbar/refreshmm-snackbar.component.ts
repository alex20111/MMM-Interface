import { Component, Inject, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MAT_SNACK_BAR_DATA, MatSnackBar, MatSnackBarRef } from '@angular/material/snack-bar';
import { SpinnerDialog } from 'src/app/dialogs/spinner-dialog/spinner.dialog';
import { MagicMirrorService } from 'src/app/services/magic-mirror.service';

@Component({
  selector: 'app-refreshmm-snackbar',
  templateUrl: './refreshmm-snackbar.component.html'
})
export class RefreshmmSnackbarComponent  {

  message: string = 'Magic mirror needs to be refreshed before the modules change or config changes takes effect.';
  constructor(
    public sbRef: MatSnackBarRef<RefreshmmSnackbarComponent>,
    @Inject(MAT_SNACK_BAR_DATA) public data: any,
    private dialog: MatDialog,
    private mmService: MagicMirrorService,
    private _snackBar: MatSnackBar
  ) { }

  refresh() {
    if (this.data.autoRefresh) {

      let dialogRef = this.dialog.open(SpinnerDialog, {
        width: '300px',
        disableClose: true,
        data: { header: 'Refresh', message: 'Reloading Magic Mirror' }
      });

      dialogRef.afterClosed().subscribe(result => {
        console.log("Dialog closed: ", result);  //Returns yes or no
      });

      this.mmService.refreshBrowser().subscribe({
        next: (result) => {
          console.log("refresh completed: ", result);
          dialogRef.close();
        },
        error: (err) => {
          console.log("Error refreshing browser", err);

          this._snackBar.open("Error when reloading Magic Mirror", "Close");
          dialogRef.close();
        }
      });

    }
    this.sbRef.dismissWithAction();
  }


}






// constructor( private snackBar: MatSnackBar) {}

// showRefreshSnackbar() {
//   const message = "test message";
//   let snackBarRef = this.snackBar.openFromComponent(RefreshmmSnackbarComponent, {
//     data: { message: "any message", autoRefresh: false},
//     verticalPosition: 'top'
//   });

//   snackBarRef.afterDismissed().subscribe((result: any) => {
//     if (result.dismissedByAction) {
//       this.refresh();
//     }
//     // console.log('The snackbar was dismissed: ', this.newPositionMap.size);
//   });
// }
