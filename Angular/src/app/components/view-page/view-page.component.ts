import { Component, HostListener, OnDestroy, ViewChild } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatAccordion } from '@angular/material/expansion';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute } from '@angular/router';
import { ViewModule } from 'src/app/_model/ViewModule';
import { UnsavedChangesDialog } from 'src/app/dialogs/unsaved-changes/unsaved-changes.dialog';
import { CanComponentDeactivate, CanDeactivateType } from 'src/app/guards/can-deactivate.guard';
import { MagicMirrorService } from 'src/app/services/magic-mirror.service';
import { Position, ScreenPositionService } from 'src/app/services/screen-position.service';
import { RefreshmmSnackbarComponent } from 'src/app/snackBars/refreshmm-snackbar/refreshmm-snackbar.component';
import { UnsavedPositionDialog } from 'src/app/dialogs/unsaved-position/unsaved-position.dialog';
import { Cfg, FileService } from 'src/app/services/file.service';
import { tap } from 'rxjs';
import { DialogQuestionComponent } from 'src/app/dialogs/dialog-question/dialog-question.component';
import { SpinnerDialog } from 'src/app/dialogs/spinner-dialog/spinner.dialog';

@Component({
  selector: 'app-view-page',
  templateUrl: './view-page.component.html',
  styleUrls: ['./view-page.component.css']
})
// export class ViewPageComponent implements DeactivatableComponent{
export class ViewPageComponent implements CanComponentDeactivate, OnDestroy {
  @ViewChild(MatAccordion) accordion!: MatAccordion;

  visible: boolean = true;
  deleting: boolean = false;
  refreshTimeout: any;

  viewModuleList: any[] = [];
  positionList!: any;
  loading: boolean = true;
  message: string = '';
  messageType = 'error'
  moduleButtonLoading: boolean = false;

  moduleSavedName: string = '';
  mmNeedsToBeRefresh: boolean = false; // if modules are not refreshed

  newPositionMap: Map<number, string> = new Map; //if the user select new positions.
  origPositionMap: Map<number, string> = new Map; //if the user decide to cancel.
  prevPositionMap: Map<number, string> = new Map;

  phoneSize: boolean = false;
  // mybreakpoint: number = 6;
  constructor(private mmService: MagicMirrorService,
    private positionService: ScreenPositionService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private activatedroute: ActivatedRoute,
    private fileService: FileService) { }


  ngOnDestroy(): void {
    if (this.refreshTimeout) {
      clearTimeout(this.refreshTimeout);
    }
  }

  ngOnInit() {
    window.scroll({
      top: 0,
      left: 0,
      behavior: 'smooth'
    });

    this.mmService.verifyIfMMneedsToBeRefreshed().subscribe({
      next: (res) => {
        // if we have unsaved modules , then show refresh.. 
        // console.log("verifyIfMMneedsToBeRefreshed: ", res)
        if (res.result === "success" && res.mmNeedsRefresh) {
          this.mmNeedsToBeRefresh = res.unsavedModule;
          if (res.mmNeedsRefresh) {
            this.showRefreshSnackbar();
          }
        }
      },
      error: (err) => {
        console.log("errors while fetching unRefreshedModuleChanges ", err);
      }
    });

    let ident = this.activatedroute.snapshot.queryParamMap;
    // console.log("Ident : ", ident);

    if (ident.has('moduleName')) {
      this.moduleSavedName = ident.get('moduleName')!;
      this.message = ident.get('message')!;
      this.messageType = 'success'
      // this.showRefreshSnackbar();
    }

    this.phoneSize = (window.innerWidth <= 400) ? true : false;
    this.positionList = this.positionService.getPositionNames();
    this.refreshModules();
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: Event) {
    if ((event.target as Window).innerWidth < 400) {
      this.phoneSize = true;
    } else if ((event.target as Window).innerWidth > 400) {
      this.phoneSize = false;
    }
  }

  toggleOnchange(evnt: any, id: string) {
    this.resetMessages();
    this.loading = true;
    let checked: boolean = evnt.checked;

    // console.log("Checked ", checked, id);
    if (id === 'all') {
      this.visible = checked;
    }

    this.mmService.showHideModule(checked, id).subscribe({
      next: (data) => {
        // console.log('toggle data: ', data); //
        if (!data.success) {
          this.message = data;
          this.messageType = "error";
          this.loading = false;
        } else {
          this.refreshModules();
        }


      },
      error: (err) => {
        this.message = 'System error.';
        this.messageType = "error";
        this.loading = false;
        console.log(err);
      }
    });
  }
  /** Display position */
  getPosition(module: ViewModule): string {
    let position: string = 'Position: Not visible';

    //search for the position
    if (module.position !== 'invisible') {
      position = 'Position: ' + module.position;
    }
    return position;
  }

  refreshModules() {
    this.resetMessages();
    this.mmService.getModuleList().subscribe({
      next: (data) => {
        this.loading = false;
        this.viewModuleList = data.payload;
        // console.log("getModuleList: ", data);
        this.viewModuleList.forEach((m, idx) => {

          if (!m.hidden) {
            this.visible = true;
          }
          // console.log("POSITION: " , m.position)
          if (m.position === undefined) {
            m.position = 'invisible';
          }
          this.prevPositionMap.set(idx, m.position != null ? m.position : 'invisible');
          this.origPositionMap.set(idx, m.position != null ? m.position : 'invisible');
        });
      },
      error: (err) => {
        this.loading = false;
        this.message = 'Error while connecting to Magic Mirror modules  ';
        this.messageType = "error";
        console.log("refreshModules Error: ", err);
      }
    });
  }

  /*Drop down for position change event */
  onChangePosition(event: any, module: any, idx: number, oldval: string) {
    this.resetMessages();
    this.loading = true;
    document.body.style.cursor = "wait";
    let region = this.positionService.getPositionValue(event.value);

    this.message = '';
    this.messageType = "";

    let newPos: Position[] = [{
      moduleName: module,
      position: event.value,
      region: region,
      prevInvisible: this.prevPositionMap.get(idx) === 'invisible' ? true : false
    }]

    this.mmService.moveModuleScreenPosition(newPos).subscribe({
      next: (res) => {
        // console.log("res: ", res);
        this.newPositionMap.set(idx, event.value);
        this.prevPositionMap.set(idx, event.value);
        this.loading = false;
        document.body.style.cursor = "initial";
      },
      error: (err) => {
        this.message = 'Cannot change positions, see errors ';
        this.messageType = "error";
        console.log(err);
        this.loading = false;
        document.body.style.cursor = "initial";
      }
    });

  }

  showRefreshSnackbar() {
    const message = "test message";
    let snackBarRef = this.snackBar.openFromComponent(RefreshmmSnackbarComponent, {
      data: { message: "any message", autoRefresh: false },
      verticalPosition: 'bottom',
      horizontalPosition: 'right'
    });

    snackBarRef.afterDismissed().subscribe((result: any) => {
      if (result.dismissedByAction) {
        this.refresh();
      }
    });
  }

  /**
 * If changes are not saved, a dialog is opened to confirm with the user
 * that they want to proceed without saving
 */
  canDeactivate(url: string): CanDeactivateType {
    this.resetMessages();
    // console.log("View Page Can deactivate - URL:  ", url);


    if (this.newPositionMap.size > 0) {
      return this.dialog.open(UnsavedPositionDialog, {
        data: { view: true }
      })
        .afterClosed().pipe(
          tap(discardChanges => discardChanges ? this.cancel() : null)
        );
    } else if (!this.mmNeedsToBeRefresh || url.indexOf('editModule') != -1) {
      return true;
    } else {
      return this.dialog.open(UnsavedChangesDialog, {
        data: { view: true }
      }).afterClosed().pipe(
        tap(discardChanges => discardChanges ? this.discardModuleChanges() : null)
      );
    }

  }
  /**Discarde changes done to modules */
  discardModuleChanges() {
    // console.log("discardModuleChanges");
    this.mmService.dscardModulesChanges().subscribe({
      next: (result) => {
        console.log("refresh completed: ", result);
      },
      error: (err) => {
        console.log("Error refreshing browser", err);
      }
    })
  }

  savePositions() {
    this.resetMessages();
    this.loading = true;

    if (this.newPositionMap.size > 0) {
      //1st load the config.js
      //then save the config.js
      //then display refresh -- no since changes are already comitted and done. 
      this.fileService.loadConfig('config.js').subscribe({
        next: (result) => {

          if (result.result === 'success') {

            let configModuleList = result.payload.modules; //get the module list from the config.js

            for (let key of this.newPositionMap.keys()) {
              let module = configModuleList[key];
              let pos = this.newPositionMap.get(key)

              if (pos === 'invisible') {
                module.position = undefined;
              } else {
                module.position = this.newPositionMap.get(key);
              }
            }
            result.payload.modules = configModuleList;
            let cfg: Cfg = {
              data: 'SAVE',
              config: result.payload,
              file: 'config.js',
            }
            this.fileService.sendConfig(cfg).subscribe({
              next: (result) => {
                this.loading = false;
                if (result.result === "success") {
                  this.newPositionMap = new Map();
                } else {
                  // console.log("result of save: ", result);
                  this.sendMessage("Error while saving", "error");
                }
              },
              error: (err) => {
                this.loading = false;
                console.error("error while saving module", err)
                this.sendMessage("Error while saving", "error");
              }
            });
            // console.log("new config with positions: ", configModuleList);
          } else {
            this.loading = false;
          }
        },
        error: (err) => {
          this.loading = false;
          console.error("error while saving ", err);
          this.sendMessage("Error while saving", "error");
        }
      });
    }
  }
  /** Revert changes to original  */
  cancel() {
    this.resetMessages();
    this.loading = true;
    let positionArr: Position[] = [];

    for (let key of this.newPositionMap.keys()) {

      let oldRegion = this.positionService.getPositionValue(this.origPositionMap.get(key));

      if (this.origPositionMap.has(key)) {
        let pos: Position = {
          moduleName: this.viewModuleList[key].identifier,
          position: this.origPositionMap.get(key)!,
          region: oldRegion,
          prevInvisible: false
        }
        positionArr.push(pos);
      }
    }
    this.mmService.moveModuleScreenPosition(positionArr).subscribe({
      next: (res) => {
        // console.log("cancel res: ", res);
        this.newPositionMap.clear();
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        this.sendMessage("Error Reverting changes", "error");
        console.log(err);
      }
    })

  }
  deleteModule(event: any, idx: any) {
    event.stopPropagation();
    this.resetMessages();
    // console.log("Delete: ", this.viewModuleList[idx]);

    let dialogRef = this.dialog.open(DialogQuestionComponent, {
      width: '250px',
      data: { header: 'Delete', text: `Do you want to delete ${this.viewModuleList[idx].name} ?` }
    });


    dialogRef.afterClosed().subscribe(result => {
      if (result === 'yes') {
        this.loading = true;
        this.viewModuleList[idx].toDel = true;
        this.fileService.deleteModule(this.viewModuleList[idx].path, idx, this.viewModuleList[idx].name).subscribe({
          next: (result) => {
            // console.log(result);
            if (result.result === 'success') {
              this.fileService.loadConfig('config.js').subscribe({
                next: (result) => {
                  if (result.result === 'success') {

                    result.payload.modules.splice(idx, 1);
                    let cfg: Cfg = {
                      data: 'SAVE',
                      config: result.payload,
                      file: 'config.js',
                    }
                    this.fileService.sendConfig(cfg).subscribe({
                      next: (result) => {

                        // console.log("result of save: ", result);
                        this.loading = false;
                        if (result.result === "success") {
                          this.sendMessage("Module Deleted", "success");
                          this.viewModuleList.splice(idx, 1);
                          this.showRefreshSnackbar();
                        } else {
                          console.error("error while saving module", result);
                          this.sendMessage("Error deleting module", "error");
                          this.viewModuleList[idx].toDel = undefined;
                        }
                      },
                      error: (err) => {
                        console.error("error while saving module", err);
                        this.sendMessage("Error deleting module", "error");
                        this.viewModuleList[idx].toDel = undefined;
                        this.loading = false;
                      }
                    });
                  } else {
                    console.error("error while saving module", result);
                    this.sendMessage("Error deleting module", "error");
                    this.viewModuleList[idx].toDel = undefined;
                    this.loading = false;
                  }
                },
                error: (err) => {
                  console.log("error: ", err);
                  this.sendMessage("Error deleting module", "error");
                  this.viewModuleList[idx].toDel = undefined;
                  this.loading = false;
                }
              });
            } else {
              console.log("Failure: ", result)
              this.sendMessage("Error deleting module", "error");
              this.viewModuleList[idx].toDel = undefined;
              this.loading = false;
            }
          },
          error: (err) => {
            this.viewModuleList[idx].toDel = undefined;
            this.loading = false;
            console.log("Error: ", err);
            this.sendMessage("Error deleting module", "error");
          }
        })
      }
    });
  }
  updateModule(idx: number) {
    this.loading = true;
    this.resetMessages();
    // console.log(" aa ", this.viewModuleList[idx]);

    let moduleName = this.viewModuleList[idx].name;

    if (moduleName) {

      let dialogRef = this.dialog.open(SpinnerDialog, {
        width: '300px',
        disableClose: true,
        data: { header: 'Update', message: `Updating module ${moduleName}`, function: 'update', modName: moduleName }
      });

      dialogRef.afterClosed().subscribe(result => {
        // console.log("Result of update: ", result)
        if (result) {
          this.showRefreshSnackbar();
        }
        this.loading = false;
      });


    }
  }
  refresh() { //todo add call back from server with kinda of timer to let the user know when it's been refreshed and how long it will take. 
    this.loading = true;
    this.resetMessages();

    let dialogRef = this.dialog.open(SpinnerDialog, {
      width: '300px',
      disableClose: true,
      data: { header: 'Refresh', message: 'Reloading Magic Mirror' ,  function: 'refresh' }
    });


    dialogRef.afterClosed().subscribe(success => {
      // console.log("Dialog success: ", success);  //Returns yes or no
      this.loading = false;
      if (success) {
        this.refreshModules();
        this.mmNeedsToBeRefresh = false;
      } else {
        this.sendMessage("Error refreshing browser", "error");
      }
      this.snackBar.dismiss();
    });
   
  }
  private sendMessage(message: string, messageType: string) {
    this.message = message;
    this.messageType = messageType;
  }

   private resetMessages(){
    this.message = "";
    this.messageType = "";
   }

}




