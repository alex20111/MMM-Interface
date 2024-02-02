import { Component, HostListener, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute,  Router } from '@angular/router';
import { tap } from 'rxjs';
import { ANIMATE_LIST } from 'src/app/_helper/AnimateConst';
import { UnsavedChangesDialog } from 'src/app/dialogs/unsaved-changes/unsaved-changes.dialog';
import { CanComponentDeactivate } from 'src/app/guards/can-deactivate.guard';
import { Cfg, FileService } from 'src/app/services/file.service';
import { MagicMirrorService } from 'src/app/services/magic-mirror.service';
import { ScreenPositionService } from 'src/app/services/screen-position.service';

@Component({
  selector: 'app-edit-module',
  templateUrl: './edit-module.component.html',
  styleUrls: ['./edit-module.component.css']
})
export class EditModuleComponent implements OnInit, CanComponentDeactivate {
  //window flags
  size550px: boolean = false;
  saving: boolean = false;
  message: string = '';
  messageType = 'error'

  form!: FormGroup;
  configMap = new Map();
  configKeys: string[] = [];

  moduleIdentifier: string = '';
  module!: any;
  positionList: string[] = [];

  keyValue: string = "";
  keyInputError: string = '';
  dynFormMap: Map<string, String[]> = new Map();

  animateArray: String[] = ANIMATE_LIST;

  constructor(
    private router: Router,
    private _Activatedroute: ActivatedRoute,
    private mmService: MagicMirrorService,
    private fb: FormBuilder,
    private positionService: ScreenPositionService,
    private fileService: FileService,
    private dialog: MatDialog,
  ) {
    this.form = this.fb.group({
      // name: '',
      position: '',
      cssClass: '',
      header: '',
      animIn: '',
      animOut: '',
      disabled: false,
      config: null
    });

    this.positionList = this.positionService.getPositionNames();
  }
chk(){
  console.log(this.form);
}
  @HostListener('window:resize', ['$event'])
  onResize(event: Event) {
    if ((event.target as Window).innerWidth < 551 && !this.size550px) {
      this.size550px = true;
    } else if ((event.target as Window).innerWidth > 550 && this.size550px) {
      this.size550px = false;
    }
    // this.width = (event.target as Window).innerWidth;
    // this.height = (event.target as Window).innerHeight;
  }

  ngOnInit(): void {
    let ident = this._Activatedroute.snapshot.paramMap.get('id');
    console.log('ident: ', ident);
    if (ident != null) {
      this.moduleIdentifier = ident;
      //load module
      this.mmService.getSingleModule(this.moduleIdentifier).subscribe({
        next: (result) => {
          console.log('Module result: ', result);
          this.module = result.payload;
          this.createForm();
        },
        error: (err) => {
          this.sendMessage("Error loading module", "error");
          console.log(err);
        }
      });
    } else {
      console.log('routing back to view');
      this.router.navigate(['/view']);
    }
  }

  send(formToSave: any) {

    this.saving = true;
    // let clone = Object.assign({}, this.module); //CLONE
    // let cloneUser = JSON.parse(JSON.stringify(this.module));
    console.log('formToSave: ', formToSave);

    let upd = {};
    this.getUpdates(formToSave, upd); //get changed fileld

    const hasKeys = !!Object.keys(upd).length;

    console.log("!!!!!!!!!!!!!upd:  ", upd);

    if (hasKeys){
    this.fileService.loadConfig('config.js').subscribe({
      next: (result) => {
        // console.log('send: ', this.module, clone, cloneUser);
        console.log('Config: ', result);

        if (result.result === 'success') {
          let configModuleList = result.payload.modules; //get the module list from the config.js

          if (configModuleList) {
            let cfgModule = configModuleList[this.module.index]; //get the module index in the config
            // let upd = {};
            // this.getUpdates(formToSave, upd); //get changed filelds
            let cfgDeepmergedodule = deepMergeObject(cfgModule, upd); //merge changes in upd to the config.js file
            configModuleList[this.module.index] = cfgDeepmergedodule;

            let origUpdModule = deepMergeObject(this.module, upd);

            let finalConfig = Object.assign({}, result.payload);

            finalConfig.modules = configModuleList;

            console.log('Final config.js : ', finalConfig);
            console.log('Final Module : ', origUpdModule);
    
            // if (valid) {
            let cfg: Cfg = {
              data: 'SAVE',
              config: finalConfig,
              file: 'config.js',
              module: origUpdModule
            }
            this.fileService.sendConfig(cfg).subscribe({
              next: (result) => {

                console.log("result of save: ", result);
                if (result.result === "success") {
                  
                  this.router.navigate(
                    ['/view'],
                    { queryParams: { moduleName: this.moduleIdentifier, message: 'Saved successfully', result: "success" } }
                  );
                }
              },
              error: (err) => {
                this.saving = false;
                this.sendMessage("Error saving module", "error");
                console.error("error while saving module", err);
              }
            });
            // }
          }
        }
      },
      error: (err) => {
        this.saving = false;
        this.sendMessage("Error loading config for saving", "error");
        console.log("error on save: ", err)
      }
    });
  }
  }

  createForm() {
    this.form = this.fb.group({
      // name: this.module.name,
      position: this.module.position,
      cssClass: this.module.classes,
      header: this.module.header,
      animIn: this.module.animateIn,
      animOut: this.module.animateOut,
      disabled: this.module.disabled,
      config: addConfig(this.module.config)
    });

    // console.log("Result --> : " ,deepMergeObject2(this.module.config));

    // console.log('Full form results: ', this.form);
  }

  isArray(ele: any): boolean {
    if (ele && ele.value instanceof FormArray) {
      return true;
    }
    return false;
  }

  isFormGroupObj(obj: any) {
    // console.log("formgroup: " , obj);
    if (obj && obj.value instanceof FormGroup) {
      return true;
    }
    return false;
  }

  deleteInput(input: string, inputArr: any[]) {
    // console.log('Input to del: ', input, inputArr, inputArr.length);

    if (inputArr.length > 0 && inputArr.length < 3) {
      // this.form.controls[input].setValue("");
      // this.form.controls[input].markAsDirty();
      (this.form.get(inputArr[0]) as FormGroup).controls[inputArr[1]].setValue('');
      (this.form.get(inputArr[0]) as FormGroup).controls[
        inputArr[1]
      ].markAsDirty();
    } else if (inputArr.length > 2 && inputArr.length < 4) {
      (this.form.get([inputArr[0], inputArr[1]]) as FormGroup).controls[inputArr[2]].setValue('');
      (this.form.get([inputArr[0], inputArr[1]]) as FormGroup).controls[inputArr[2]].markAsDirty();
    } else if (inputArr.length > 3 && inputArr.length < 5) {
      (
        this.form.get([inputArr[0], inputArr[1], inputArr[2]]) as FormGroup
      ).controls[inputArr[3]].setValue('');
      (
        this.form.get([inputArr[0], inputArr[1], inputArr[2]]) as FormGroup
      ).controls[inputArr[3]].markAsDirty();
    } else {
      this.form.controls[input].setValue('');
      this.form.controls[input].markAsDirty();
    }

    // console.log(this.form.value);
  }

  isBoolean(variable: any) {
    if (typeof variable.value == 'boolean') {
      return true;
    }
    return false;
  }
  isString(variable: any) {
    if (typeof variable.value == 'string') {
      return true;
    }
    return false;
  }
  isFormControl(variable: any) {
    if (typeof variable.value == 'string') {
      return true;
    }
    return false;
  }

  private getUpdates(
    formItem: FormGroup | FormArray | FormControl,
    updatedValues: any,
    name?: string
  ) {
    if (formItem instanceof FormControl) {

      if (name && formItem.dirty) {
        if (
          typeof formItem.value != 'boolean' &&
          !isNaN(formItem.value) &&
          typeof formItem.value == 'string' && 
          formItem.value.length > 0
        ) {
          updatedValues[name] = parseInt(formItem.value);
        } else {
          updatedValues[name] = formItem.value;
        }

      }
    } else {
      for (const formControlName in formItem.controls) {

        if (formItem.controls.hasOwnProperty(formControlName)) {
          let formControl = formItem.get([formControlName]);

          if (formControl instanceof FormControl) {
            this.getUpdates(formControl, updatedValues, formControlName);
          } else if (
            formControl instanceof FormArray &&
            formControl.dirty &&
            formControl.controls.length > 0
          ) {
            //check if the
            let objFound = formControl.value.some((value: any) => {
              return typeof value == 'object';
            });

            updatedValues[formControlName] = [];
            if (!objFound) {
              updatedValues[formControlName] = formControl.value
            } else {
              this.getUpdates(formControl, updatedValues[formControlName]);
            }

          } else if (formControl instanceof FormGroup && formControl.dirty) {
            updatedValues[formControlName] = {};
            this.getUpdates(formControl, updatedValues[formControlName]);
          } 
          // else {
            // console.log('ERRRR: ', formControlName);
          // }
        }
      }
    }
  }

  addValue(eleId: string) {
    // console.log("Key Value: ", this.keyValue, eleId);


    if (this.keyValue.length > 0) {
      const formGrp = this.form.get('config') as FormGroup;
      // console.log("formGrp: " , formGrp.value, formGrp)
      formGrp.addControl(this.keyValue, new FormControl(''));

      let string = [this.keyValue];
      this.dynFormMap.set('configFormObj', string); 
    } else {
      this.keyInputError = "Enter a unique field value";
    }
    this.keyValue = "";

  }

  canDeactivate(url: string) {
    // console.log("Can deactivate?? ", url);

    if (url.indexOf('view') != -1 || !this.form.dirty) {
      return true;
    } else {
      return this.dialog.open(UnsavedChangesDialog, {
        data: { edit: true } 
      }).afterClosed().pipe(
        tap(discardChanges => discardChanges ? this.discardModuleChanges() : null)
      );
    }

    return false;
  }
  discardModuleChanges() {
    // console.log("discardModuleChanges");
    this.mmService.dscardModulesChanges().subscribe({
      next: (result) => {
        // console.log("refresh completed: ", result);
      },
      error: (err) => {
        console.log("Error refreshing browser", err);
      }
    })
  }
  private sendMessage(message: string, messageType: string) {
    this.message = message;
    this.messageType = messageType;
  }
}

function deepMergeObject(targetObject = {}, sourceObject = {}) {
  // clone the source and target objects to avoid the mutation
  // console.log('StartMerge: ', sourceObject, targetObject);
  const copyTargetObject = JSON.parse(JSON.stringify(targetObject));
  const copySourceObject = JSON.parse(JSON.stringify(sourceObject));
  // Iterating through all the keys of source object
  Object.keys(copySourceObject).forEach((key) => {

    if (
      typeof copySourceObject[key] === 'object' &&
      !Array.isArray(copySourceObject[key])
    ) {
      // If property has nested object, call the function recursively
      copyTargetObject[key] = deepMergeObject(
        copyTargetObject[key],
        copySourceObject[key]
      );
    } else if (Array.isArray(copySourceObject[key])) {


      let arr: any[] = [];
      Object.keys(copySourceObject[key]).forEach((arrKey) => {
        let k = copySourceObject[key];

        copyTargetObject[key] = deepMergeObject(
          copyTargetObject[key],
          copySourceObject[key]
        );
      });
    } else {
      copyTargetObject[key] = copySourceObject[key];
    }
  });

  return copyTargetObject;
}
function addConfig(module: any = {}): FormGroup {
  // clone the source and target objects to avoid the mutation

  let master = new FormGroup({});

  // Iterating through all the keys of source object
  Object.keys(module).forEach((key) => {

    if (
      typeof module[key] === 'object' &&
      !Array.isArray(module[key]) &&
      module[key] != null
    ) {
      master.addControl(key, addConfig(module[key]));
    } else if (Array.isArray(module[key])) {
      let arr = new FormArray<any>([]);
      Object.keys(module[key]).forEach((arrKey) => {
        let k = module[key];
        if (typeof k[arrKey] === 'string') {
          arr.push(new FormControl(k[arrKey]));
        } else {
          arr.push(addConfig(k[arrKey]));
        }
      });
      master.addControl(key, arr);
    } else {
      // else merge the object source to target
      if (module[key] == null || module[key] == undefined) {
        master.addControl(key, new FormControl(''));
      } else {
        master.addControl(key, new FormControl(module[key]));
      }
    }
  });

  return master;
}
