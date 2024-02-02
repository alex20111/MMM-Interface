import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { HttpConnectService } from 'src/app/services/http-connect.service';
import { MagicMirrorService } from 'src/app/services/magic-mirror.service';
import { Position, ScreenPositionService } from 'src/app/services/screen-position.service';

export interface NewModule {
  data: string,
  moduleName: string,
  moduleUrl: string,
  moduleConfig: string
}

@Component({
  selector: 'app-add-module-dialog',
  templateUrl: './add-module-dialog.component.html',
  styleUrls: ['./add-module-dialog.component.css']
})
export class AddModuleDialogComponent implements OnInit, OnDestroy {

  addForm!: FormGroup;
  keyValue: string = "";
  keyInputError: string = '';
  configNewFieldList: string[] = [];
  positionList: string[] = [];
  installProgress: string = '';
  callTimeout:any;

  initDone: boolean = false;
  installSuccess: boolean = false;
  installing: boolean = false;

  message: string = '';
  messageType: string = '';

  constructor(
    public dialogRef: MatDialogRef<AddModuleDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private pos: ScreenPositionService,
    private fb: FormBuilder,
    private mmService: MagicMirrorService,
    private httpConnect: HttpConnectService
  ) {
    this.addForm = this.fb.group({
      // name: this.data.name,
      position: ['', [Validators.required]],
      config: this.fb.group({})
    });

  }
  ngOnDestroy(): void {
    if (this.callTimeout){
      clearTimeout(this.callTimeout);
    }
  }
  ngOnInit(): void {
    this.positionList = this.pos.getPositionNames();
    //verify if node_js exist on the git hub.
    this.httpConnect.verifyIfNodeHelperExist( this.data.gitUrl)
    .subscribe({
      next: (exist: any) =>{
        // console.log("exist: " , exist);
        if (!exist){
        this.message = `This project may not be a MMM module. It will not install properly`;//Can't find project ${this.data.name}.js file. `;
        this.messageType = "warning";
        }
        this.initDone = true;
      },
      error: (err) => {
        console.log("Can't connect to the GIT project : " , err);
        // this.isMMMproject = false;
        this.initDone = true;
      }
    }
    );
  }

  onNoClick(): void {
    this.dialogRef.close();
  }
  onInstallSuccess(){
    this.dialogRef.close("success");
  }
  install(frm: FormGroup) {
    console.log("install: ", frm.value);
    this.installSuccess = false;
    this.message = "";
            this.messageType = "";
            this.installProgress = "";

  if (frm.valid){

      this.installing = true;
      let moduleToInstall: NewModule = {
        data: 'INSTALL-MODULE',
        moduleName: this.data.name,
        moduleConfig: frm.value,
        moduleUrl: this.data.gitUrl
      }

      this.mmService.installNewModule(moduleToInstall).subscribe({
        next: (result) => {
         
          if (result.result === 'success' ){  
            console.log("Success result: ", result);          
            this.installSuccess = true;
          }else{
            console.error("Install error: ", result);
            this.message = "Error while installing. Check server logs";
            this.messageType = "error";
          }
          this.installing = false;
        },
        error: (err) => {
          console.error("error : ", err);
          this.message = "Error while installing. Check server logs";
            this.messageType = "error";
          this.installing = false;
        }
      });

      this.callInstallProgressApi();

    }
    
  }
  addValue(eleId: string) {
    console.log("Key Value: ", this.keyValue, eleId);


    if (this.keyValue.length > 0) {

      if (this.configNewFieldList.includes(this.keyValue)) {
        this.keyInputError = "Config key already exist";
      } else {
        this.keyInputError = "";
        const formGrp = this.addForm.get('config') as FormGroup;
        console.log("formGrp: ", formGrp.value, formGrp)
        formGrp.addControl(this.keyValue, new FormControl(''));

        let newField = [this.keyValue];
        this.configNewFieldList.push(this.keyValue);
      }
    } else {
      this.keyInputError = "Enter a unique field value";
    }
    this.keyValue = "";

  }
  deleteField(cfgKey: any) {
    console.log("field: ", cfgKey);

    const formGrp = this.addForm.get('config') as FormGroup;
    formGrp.removeControl('cfgKey');

    const index = this.configNewFieldList.indexOf(cfgKey);
    if (index > -1) { // only splice array when item is found
      this.configNewFieldList.splice(index, 1); // 2nd parameter means remove one item only
    }

  }
  callInstallProgressApi() {
    this.mmService.installProgress().subscribe({
      next: (response) => {
        console.log("Resp: " , response);
        if (!response.status.finished){
          this.callTimeout = setTimeout(() => this.callInstallProgressApi(), 800);
        }
        this.installProgress = "Git Status   : " + response.status.gitStatus + "<br/>";
        if (response.status.gitStage.length > 0){
          this.installProgress =  this.installProgress.concat("Git Stage    : "  + response.status.gitStage + "<br/>");
        }
        if (response.status.gitStage.length > 0){
          this.installProgress =  this.installProgress.concat("Git Progress : "  + response.status.gitProgress + "<br/>");
           
        }
        if (response.status.npmStatus.length > 0){
          this.installProgress =  this.installProgress.concat("NPM Status   : "  + response.status.npmStatus + "<br/>" );
           
        }
         if (response.status.npmMessage.length > 0){
          this.installProgress =  this.installProgress.concat("NPM Message  : <br/>"  + response.status.npmMessage );
           
        }
         if (response.status.finished){
          this.installProgress =  this.installProgress.concat("Finished     : "  + response.status.finished);
           
        }

     


      },
      error: (err) => {
        if (this.callTimeout){
        clearTimeout(this.callTimeout);
        }
      }
  });
  }
}

// gitStatus : '',
// gitStage: '',
// gitProgress: 0,
// npmStatus: '',
// npmMessage: '',
// finished: false