import { Component } from '@angular/core';
import {  MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-dialog-unsaved-pos',
  templateUrl: './unsaved-position.dialog.html',
  styleUrls: ['./unsaved-position.dialog.css']
})
export class UnsavedPositionDialog {
  constructor(private dialogRef: MatDialogRef<UnsavedPositionDialog, boolean>) {}
  // constructor( 
    // public dialogRef: MatDialogRef<DialogQuestionComponent>, @Inject(MAT_DIALOG_DATA) public data: any) { }
  save() {
      this.dialogRef.close(true)
  }
  cancel() {
      return this.dialogRef.close(false)
  }
}





//this is how to call the above dialog
// constructor( private dialog: MatDialog) {
  //
// openDialog(): void { 
//   let dialogRef = this.dialog.open(DialogQuestionComponent, { 
//     width: '250px', 
//     data: { header: 'Refresh', text: 'Do you want to refresh Magic mirror?' } 
//   }); 

//   dialogRef.afterClosed().subscribe(result => { 
//     console.log("Dialog closed: ", result);  //Returns yes or no
//   }); 
// } 
