import { APP_INITIALIZER, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ViewPageComponent } from './components/view-page/view-page.component';
import { TopMenuComponent } from './layouts/top-menu/top-menu.component';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatToolbarModule } from '@angular/material/toolbar';
import {  HttpClientModule } from '@angular/common/http';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatCardModule } from '@angular/material/card';
import { SidebarComponent } from './layouts/sidebar/sidebar.component';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatSelectModule } from '@angular/material/select'
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { SystemPowerComponent } from './components/system-power/system-power.component';
import { AlertComponent } from './components/alert/alert.component';
import { ReactiveFormsModule } from '@angular/forms';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { NgxGaugeModule } from 'ngx-gauge';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { AppConfig } from './services/app-config';
import { EditConfigComponent } from './components/edit-config/edit-config.component';
import { NgJsonEditorModule } from 'ang-jsoneditor';
import {MatTooltipModule} from '@angular/material/tooltip';
import { DialogQuestionComponent } from './dialogs/dialog-question/dialog-question.component'; 
import {MatDialogModule} from '@angular/material/dialog';
import { EditModuleComponent } from './components/edit-module/edit-module.component'; 
import {MatCheckboxModule} from '@angular/material/checkbox';
import { RefreshmmSnackbarComponent } from './snackBars/refreshmm-snackbar/refreshmm-snackbar.component'; 
import { UnsavedChangesDialog } from './dialogs/unsaved-changes/unsaved-changes.dialog';
import { UnsavedPositionDialog } from './dialogs/unsaved-position/unsaved-position.dialog';
import { PackageListComponent } from './components/package-list/package-list.component';
import {MatTableModule} from '@angular/material/table';
import {MatPaginatorModule} from '@angular/material/paginator'; 
import {MatSortModule} from '@angular/material/sort'; 
import { SafeHtmlPipe } from './_helper/SafeHtmlPipe';
import { AddModuleDialogComponent } from './dialogs/add-module-dialog/add-module-dialog.component';
import { SpinnerDialog } from './dialogs/spinner-dialog/spinner.dialog';
import {MatMenuModule} from '@angular/material/menu';
import {MatRadioModule} from '@angular/material/radio';



@NgModule({
  declarations: [
    AppComponent,
    ViewPageComponent,
    TopMenuComponent,
    SidebarComponent,
    SystemPowerComponent,
    AlertComponent,
    DashboardComponent,
    UnsavedChangesDialog,
    EditConfigComponent,
    DialogQuestionComponent,
    EditModuleComponent,
    RefreshmmSnackbarComponent,
    UnsavedPositionDialog,
    PackageListComponent,
    SafeHtmlPipe,
    AddModuleDialogComponent,
    SpinnerDialog
    
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    MatIconModule,
    MatButtonModule,
    MatToolbarModule,
    HttpClientModule,
    MatProgressSpinnerModule,
    MatGridListModule,
    MatCardModule,
    MatSidenavModule,
    MatListModule,
    MatSelectModule,
    MatSlideToggleModule,
    MatExpansionModule,
    MatInputModule,
    MatFormFieldModule,
    ReactiveFormsModule,
    MatSnackBarModule,
    NgxGaugeModule,
    NgJsonEditorModule,
    MatTooltipModule,
    MatDialogModule,
    MatCheckboxModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatMenuModule,
    MatRadioModule
  ],
  providers: [

    AppConfig,
    {
      provide: APP_INITIALIZER,
      useFactory: () => () => {
        return new Promise<void>(resolve => {
          resolve();
        });
      },
      deps: [ AppConfig ],
      multi: true,
    }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
