import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-dialog-question',
  templateUrl: './dialog-question.component.html',
  styleUrls: ['./dialog-question.component.css']
})
export class DialogQuestionComponent {
  constructor( 
    public dialogRef: MatDialogRef<DialogQuestionComponent>, 
    @Inject(MAT_DIALOG_DATA) public data: any) { } 
  
  onCancel(): void { 
    this.dialogRef.close('no'); 
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
