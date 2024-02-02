import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MagicMirrorService } from 'src/app/services/magic-mirror.service';

@Component({
  selector: 'app-spinner-dialog-pos',
  templateUrl: './spinner.dialog.html',
  styleUrls: ['./spinner.dialog.css']
})
export class SpinnerDialog implements OnInit {

  message: string = "";
  showResult: boolean = false;
  error: boolean  = false;

  constructor(private dialogRef: MatDialogRef<SpinnerDialog, boolean>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private mmService: MagicMirrorService) { }


  ngOnInit(): void {

    if (this.data.function === 'update') {
      this.mmService.updateModule(this.data.modName).subscribe({
        next: (response) => {
          this.showResult = true;
          if (response.result === 'success'){
            this.error = false;
          }else{
            this.error = true;
          }
          console.log("Update result : ", response);
          // dialogRef.close();
        },
        error: (err) => {
          this.showResult = true;
          this.error = true;
          console.log("Update error: ", err);
          // dialogRef.close();
        }
      });
    }else if(this.data.function === 'refresh'){
      this.mmService.refreshBrowser().subscribe({
        next: (result) => {
          console.log("refresh completed: ", result);
          this.showResult = true;
          this.error = false;
        },
        error: (err) => {
          this.showResult = true;
          this.error = true;
          console.log("Error refreshing browser", err);
        }
      });
    }


  }

  btnOk(){
    if (!this.error){
      this.dialogRef.close(true); 
      // this.[mat-dialog-close]="'success'"
    }else{
      this.dialogRef.close(false); 
    }
  }
}





//this is how to call the above dialog
// constructor( private dialog: MatDialog) {
//
// let dialogRef = this.dialog.open(SpinnerDialog, {
//   width: '300px',
//   disableClose: true,
//   data: { header: 'Refresh', autoRefresh: false }
// });

//   dialogRef.afterClosed().subscribe(result => { 
//     console.log("Dialog closed: ", result);  //Returns yes or no
//   }); 
// } 
