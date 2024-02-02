import { Component, Inject } from '@angular/core';
import {  MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-dialog-unsaved',
  templateUrl: './unsaved-changes.dialog.html',
  styleUrls: ['./unsaved-changes.dialog.css']
})
export class UnsavedChangesDialog {

 dialogMessage: string[] = [];

  constructor(private dialogRef: MatDialogRef<UnsavedChangesDialog, boolean>
    , @Inject(MAT_DIALOG_DATA) public data: any) {
      if (this.data.view){
        this.dialogMessage.push('Looks like the modules were saved but Magic mirror was not refreshed.');
        this.dialogMessage.push('If you leave the current modules configuration will be lost.');
        this.dialogMessage.push('You will need to refresh or restart to restore it.');
      }else if (this.data.edit){
        this.dialogMessage.push('If you leave you will loose your changes.');
        // this.dialogMessage.push('Do you want to leave? ');
      }
 

    }
  // constructor( 
    // public dialogRef: MatDialogRef<DialogQuestionComponent>, @Inject(MAT_DIALOG_DATA) public data: any) { }
  save() {
      this.dialogRef.close(true)
  }
  cancel() {
      return this.dialogRef.close(false)
  }
}