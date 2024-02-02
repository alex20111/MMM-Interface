import { ActivatedRouteSnapshot, CanDeactivateFn, RouterStateSnapshot, UrlTree } from "@angular/router";
import { Observable } from "rxjs";

export type CanDeactivateType = Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree;


export interface CanComponentDeactivate {
  canDeactivate: (url:string) => CanDeactivateType;
}

export const canDeactivateGuard: CanDeactivateFn<CanComponentDeactivate> = 
(component: CanComponentDeactivate,currentRoute: ActivatedRouteSnapshot, currentState: RouterStateSnapshot,  nextState: RouterStateSnapshot) => {


  return component.canDeactivate ? component.canDeactivate(nextState.url) : true;
};