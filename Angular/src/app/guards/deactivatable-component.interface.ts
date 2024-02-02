import { Injectable } from '@angular/core'
import {
    ActivatedRouteSnapshot,
    CanDeactivate,
    CanDeactivateFn,
} from '@angular/router'
import { Observable } from 'rxjs'

/** Our Route Guard as a Function */
// export const canDeactivateFormComponent: CanDeactivateFn<DeactivatableComponent> = (component: DeactivatableComponent) => {
//     if (component.canDeactivate) {
//         return component.canDeactivate()
//     }
//     return true
// }

/* Our Route Guard as an Injectable Class */
@Injectable({
    providedIn: 'root',
})
export class UnsavedChangesGuard implements CanDeactivate<DeactivatableComponent> {
constructor(private currentRoute: ActivatedRouteSnapshot){}

    canDeactivate: CanDeactivateFn<DeactivatableComponent> = (component: DeactivatableComponent) => {

        console.log("UnsavedChangesGuard : " , this.currentRoute);
        if (component.canDeactivate) {
            return component.canDeactivate()
        }
        return true
    }
}

export interface DeactivatableComponent {
    canDeactivate: () => boolean | Observable<boolean>
}