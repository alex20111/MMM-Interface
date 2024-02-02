import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { JsonEditorComponent, JsonEditorOptions } from 'ang-jsoneditor';
import { SpinnerDialog } from 'src/app/dialogs/spinner-dialog/spinner.dialog';
import { Cfg, FileService } from 'src/app/services/file.service';
import { MagicMirrorService } from 'src/app/services/magic-mirror.service';
import { RefreshmmSnackbarComponent } from 'src/app/snackBars/refreshmm-snackbar/refreshmm-snackbar.component';

@Component({
  selector: 'app-edit-config',
  templateUrl: './edit-config.component.html',
  styleUrls: ['./edit-config.component.css']
})
export class EditConfigComponent implements OnInit {

  message: string = "";
  validateMessage: string = "";
  validateType: string = "success";
  textRows: number = 10;
  public editorOptions!: JsonEditorOptions;
  @ViewChild('editor') editor!: JsonEditorComponent;
  form!: FormGroup;

  loading: boolean = true;
  configFileList: any[] = []; //list of config files or env files or template
  configFileName: string = "";
  fileName: string = "";

  textFieldSize: number = 0;
  displayRefresh: boolean = false;

  constructor(private fb: FormBuilder, private dialog: MatDialog, private fileService: FileService, private mmService: MagicMirrorService, private snackBar: MatSnackBar) {
    this.editorOptions = new JsonEditorOptions()
    this.editorOptions.mode = 'code';
    this.editorOptions.modes = ['code', 'text', 'view']; // set all allowed modes
    this.form = this.fb.group({
      myinput: []
    });

  }
  ngOnInit(): void {
    this.fileService.loadConfigFolder().subscribe({
      next: (result) => {
        console.log(result);
        this.loading = false;
        if (result.result === 'success') {
          this.configFileList = result.payload;
        } else {
          this.message = result.error;
        }
      },
      error: (err) => {
        this.loading = false;
        console.log(err);
        if (err instanceof HttpErrorResponse) {
          this.message = err.message;
        }
      }
    })

    this.mmService.verifyIfMMneedsToBeRefreshed().subscribe({
      next: (res) => {
        // console.log("unRefreshedModules " , res);
        if (res.result === "success") {
          this.displayRefresh = res.mmNeedsRefresh;
          // if (res.mmNeedsRefresh) {
          //   this.showRefreshSnackbar();
          // }
        }
      },
      error: (err) => {
        console.log("errors while fetching unRefreshedModuleChanges ", err);
      }
    });

  }
  submit(button: any) {
    console.log("button: ", button);
    let valid = true;
    this.loading = true;
    this.message = "";

    let cfg: Cfg = {
      data: "",
      config: this.form.value.myinput

    }

    if (button === 'validate') {
      cfg.data = 'VALIDATE';
      cfg.file = this.configFileName;
    } else if (this.configFileName) {
      cfg.data = 'SAVE';
      cfg.file = this.configFileName;
      const jsonEditor = this.editor.getEditor();
      if (jsonEditor.lastSchemaErrors.length > 0) {
        console.log(jsonEditor.lastSchemaErrors);
        this.message = jsonEditor.lastSchemaErrors[0].message;
        valid = false;
        this.loading = false;
      }
    } else {
      cfg.data = 'SAVE';
      cfg.file = this.fileName;
    }
    // console.log("cfg: " , cfg);

    if (valid) {
      this.fileService.sendConfig(cfg).subscribe({
        next: (x) => {
          this.loading = false;
          if (x.result === 'success' && x.query === 'VALIDATE') {
            this.validateMessage = "File valid";
            this.validateType = "notice";
          } else if (x.result === 'success' && x.query === 'SAVE') {
            this.validateMessage = "File Saved";
            this.validateType = "success";
            this.displayRefresh = true;
            this.showRefreshSnackbar();
          } else {
            this.validateMessage = x.error;
            this.validateType = "error";
          }
          console.log("c: ", x);
        },
        error: (err) => {
          this.loading = false;
          console.log(err);
          if (err instanceof HttpErrorResponse) {
            this.message = err.message;
          }
        }
      });
    }
  }

  numSequence(n: number): Array<number> {
    return Array(n);
  }

  editConfigFile(name: string) {

    this.loading = true;
    this.fileService.loadConfig(name).subscribe({
      next: (result) => {
        console.log(result);
        this.loading = false;
        if (result.result === 'success' && result.file === 'config.js') {
          this.configFileName = name;

          this.form.controls['myinput'].setValue(result.payload);

        } else if (result.result === 'success') {
          this.fileName = name;
          this.textRows = result.payload.split('\n').length;
          this.form.controls['myinput'].setValue(result.payload);
          this.textFieldSize = result.payload.length;
        }
        else {

        }

      },
      error: (err) => {
        this.loading = false;
        console.log(err);
      }
    })

  }
  textAreaChange() {
    let length = this.form.value.myinput.length;
    console.log("text changed: ", length);
    if (length > this.textFieldSize || length < this.textFieldSize) {
      console.log("text changed");
    }
  }
  returnBack($event: any) {
    $event.preventDefault();
    this.configFileName = "";
    this.validateMessage = "";
    this.loading = false;
    this.fileName = "";
    this.message = "";
  }

  refreshBrowser() {
    let dialogRef = this.dialog.open(SpinnerDialog, {
      width: '300px',
      disableClose: true,
      data: { header: 'Refresh', message: 'Reloading Magic Mirror', function: 'refresh' }
    });

    this.loading = true;

    dialogRef.afterClosed().subscribe(success => {
      console.log("Dialog success: ", success);  //Returns yes or no
      if (success) {
        this.displayRefresh = false;
        this.loading = false;
      } else {
        this.message = "Error refreshing browser";
      }
      this.snackBar.dismiss();
    });
  }

  showRefreshSnackbar() {
    console.log("showRefreshSnackbar");
    let snackBarRef = this.snackBar.openFromComponent(RefreshmmSnackbarComponent, {
      data: { message: "any message", autoRefresh: false },
      verticalPosition: 'bottom',
      horizontalPosition: 'right'

    });
   
    snackBarRef.afterDismissed().subscribe((result: any) => {

      if (result.dismissedByAction) {

        this.refreshBrowser();
      }
    });
  }
}
