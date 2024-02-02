import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ViewPageComponent } from './components/view-page/view-page.component';
import { SystemPowerComponent } from './components/system-power/system-power.component';
import { AlertComponent } from './components/alert/alert.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { EditConfigComponent } from './components/edit-config/edit-config.component';
import { EditModuleComponent } from './components/edit-module/edit-module.component';
import { UnsavedChangesGuard } from './guards/deactivatable-component.interface';
import { canDeactivateGuard } from './guards/can-deactivate.guard';
import { PackageListComponent } from './components/package-list/package-list.component';


const routes: Routes = [
  { path: '', component: DashboardComponent },
  { path: 'view', component: ViewPageComponent, canDeactivate: [canDeactivateGuard]},
   { path: 'systemPower', component: SystemPowerComponent },
   { path: 'alert', component: AlertComponent },
   { path: 'editConfig', component: EditConfigComponent },
   { path: 'editModule/:id', component: EditModuleComponent, canDeactivate: [canDeactivateGuard] },
   { path: 'packageList', component: PackageListComponent}]; 

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
