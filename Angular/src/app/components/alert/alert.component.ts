import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AlertMessage, MagicMirrorService } from 'src/app/services/magic-mirror.service';

@Component({
  selector: 'app-alert',
  templateUrl: './alert.component.html',
  styleUrls: ['./alert.component.css']
})
export class AlertComponent implements OnInit{
  form!: FormGroup;
  durationInSeconds: number = 5;
  message: string = "";

constructor(private fb: FormBuilder, private _snackBar: MatSnackBar, private mmService: MagicMirrorService){
  
}
  ngOnInit(): void {
    this.form = this.fb.group ({
      alertTitle: [null, [Validators.required]],
      alertType: [null, [Validators.required]],
      alertDescription: [null, [Validators.required]],
      alertTimeToLive: [5, [Validators.required,Validators.pattern ("^[0-9]+$")]]
      });
  }
  saveDetails(){
    if (this.form.valid){
      let msg: AlertMessage = {
        title: this.form.value.alertTitle,
        message: this.form.value.alertDescription,
        type: this.form.value.alertType,
        timer: this.form.value.alertTimeToLive
      }

      this.mmService.showAlert(msg).subscribe({
        next: (result) => {
          console.log(result);
          this.openSnackBar("Alert sent");
        },
        error: (err) =>{
          this.message = "Error sending alert";
          console.log("alert error: " , err);
        }
      })
    }    
  }

  openSnackBar(msg: string) {    
    this._snackBar.open(msg, 'close', {
      horizontalPosition: "center",
      verticalPosition: "top",
    });
  }

}
