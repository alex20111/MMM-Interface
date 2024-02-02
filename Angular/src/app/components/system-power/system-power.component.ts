import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { throwError } from 'rxjs';
import { SpinnerDialog } from 'src/app/dialogs/spinner-dialog/spinner.dialog';
import { MagicMirrorService } from 'src/app/services/magic-mirror.service';


export interface Section {
  name: string;
  updated: Date;
}
@Component({
  selector: 'app-system-power',
  templateUrl: './system-power.component.html',
  styleUrls: ['./system-power.component.css']
})

export class SystemPowerComponent implements OnInit {
  message: string = "";
  shutdownMessage: string = "";
  restartPiMessage: string = "";
  refresh: string = "";
  restartMMMessage: string = "";

  monStatMsg: string = "";
  monitorOn: boolean = false;
  monitorLoading: boolean = false;
  isFullScreen: boolean = false;

  constructor(private mmService: MagicMirrorService, private dialog: MatDialog) { }
  ngOnInit(): void {
    this.monitorLoading = true;
    this.mmService.monitorStatus().subscribe({
      next: (result) => {
        this.monitorLoading = false;
        // console.log("monitor: ", result);
        if (result.result === 'success') {
            if (result.data.monitor === 'on'){
              // this.monStatMsg = " Monitor On"
               this.monitorOn = true;
            }else{
              // this.monStatMsg = " Monitor Off"
              this.monitorOn = false;
            }
         
        } else {
          this.monStatMsg = "Error getting monitor status";
          console.error("Monitor Error!: ", result);
          this.monitorOn = false;
        }
      },
      error: (err) => {
        this.monitorLoading = false;
        this.monStatMsg = "Error getting monitor status";
        console.error("monitor: ", err);
        this.monitorOn = false;
      }
    });
  }


  shutdown() {
    this.mmService.shutdown();
    this.shutdownMessage = "Shutting down. Bye!!";
  }

  restartPi() {
    this.mmService.restartPi();
    this.restartPiMessage = "Waiting for re-conection: 2min";
  }

  restartMagicMirror() {
    this.restartMMMessage = "Restarting magic mirror, please wait";
    this.mmService.restartMagicMirror().subscribe({
      next: (data) => {
        console.log("RR ", data);
        if (data.result === 'error'){
          this.restartMMMessage = `Error: ${data.error}`;
        }else{
          this.restartMMMessage = "Restarting complete";
        }
        
      },
      error: (err) => {
        console.log("ERR ", err);
        this.restartMMMessage = "Error restarting magic mirror";
      }
    })
  }

  refreshBrowser() {
    this.refresh = "Refreshing browser";

    let dialogRef = this.dialog.open(SpinnerDialog, {
      width: '300px',
      disableClose: true,
      data: { header: 'Refresh', message: 'Reloading Magic Mirror', function: 'refresh' }
    });

    dialogRef.afterClosed().subscribe(success => {
      console.log("Dialog success: ", success);  //Returns yes or no
      if (success) {
        this.refresh = "Reloading completed";
      } else {
        this.message = "Error Reloading browser";
      }
     
    });
  }

  toggleMonitor(){ 
    let monitorAction = !this.monitorOn;
    this.monitorLoading = true;
    this.mmService.monitor(monitorAction).subscribe({
      next:(result) =>{
        this.monitorLoading = false;
        if(result.result === 'success'){
        this.monitorOn = result.data.monitor;
        }else{
          this.monStatMsg = "Error getting monitor status";
          this.monitorOn = false;
        }
      },
      error: (err) =>{
        this.monitorLoading = false;
        this.monStatMsg = "Error getting monitor status";
        console.error("Monitor toggle error: " , err);
        this.monitorOn = false;
      }
    });
  }

  resizeScreen(){

    this.mmService.toggleScreen().subscribe({
      next: (result) => {
        if (result.result === "success"){
          this.isFullScreen = result.isFullScreen;
        }
      },
      error: (err) => {
        console.log("error: " , err);
      }
    })

  }
  devTools(){
    this.mmService.openCloseDevTools().subscribe({
      next:(result) => {
        console.info("openCloseDevTools: " , result);
      },
      error: (err) => {
        console.error("openCloseDevTools: " , err);
      }
    })
  }

}
