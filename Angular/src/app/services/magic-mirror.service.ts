import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, catchError, map, throwError } from 'rxjs';
import { AppConfig } from './app-config';
import { Position } from './screen-position.service';
import { PostReq } from './file.service';
import { NewModule } from '../dialogs/add-module-dialog/add-module-dialog.component';

@Injectable({
  providedIn: 'root'
})
export class MagicMirrorService {
  private host: string = '';
  private port: string = '';

  constructor(private http: HttpClient, private cfg: AppConfig) {
    this.host = this.cfg.getConfig('host');
    this.port = this.cfg.getConfig('port');
  }
  
  sendPageChange(): Observable<any>{
    return this.http.get<any>(`http://${this.host}:${this.port}/commandGet?cmd=CHANGE-PAGE`);
  }
  getModuleList(): Observable<any> {
    return this.http.get<any>(
      `http://${this.host}:${this.port}/commandGet?cmd=LOAD-MODULE-LIST`
    );
  }

  getSingleModule(mod: string): Observable<any> {
    return this.http.get<any>(`http://${this.host}:${this.port}/commandGet?cmd=MODULE&module=${mod}`)   
  }

  showAlert(msg: AlertMessage): Observable<any> {
    return this.http.get<any>(
      `http://${this.host}:${this.port}/commandGet?cmd=SHOW_ALERT&type=${msg.type}&title=${msg.title}&message=${msg.message}&timer=${msg.timer}`
    );
  }

  showHideModule(show: boolean, moduleId: string): Observable<any> {
    let visibility: string = show ? 'SHOW' : 'HIDE';
    return this.http.get<any>(
      `http://${this.host}:${this.port}/commandGet?cmd=${visibility}&module=${moduleId}`
    );
  }

  moveModuleScreenPosition(position: Position[]): Observable<any> {
    let postReq: PostReq = {
      data: 'MOVE-POS',
      payload: position
    }

    return this.http.post<any>(`http://${this.host}:${this.port}/handlePost`, postReq);
  }

  shutdown() {
    this.http
      .get<any>(`http://${this.host}:${this.port}/commandGet?cmd=SHUTDOWN`)
      .subscribe();
  }

  restartPi() {
    this.http
      .get<any>(`http://${this.host}:${this.port}/commandGet?cmd=REBOOT`)
      .subscribe();
  }

  restartMagicMirror(): Observable<any> {
    return this.http.get<any>(
      `http://${this.host}:${this.port}/commandGet?cmd=RESTART`
    );
  }
  refreshBrowser(): Observable<any> {
    return this.http.get<any>(
      `http://${this.host}:${this.port}/commandGet?cmd=REFRESH-MM`
    );
  }

  monitor(on: boolean): Observable<any> {
    return this.http.get<any>(
      `http://${this.host}:${this.port}/commandGet?cmd=${on ? 'MONITORON' : 'MONITOROFF'
      }`
    );
  }
  monitorStatus(): Observable<any> {
    return this.http
      .get<any>(`http://${this.host}:${this.port}/commandGet?cmd=MONITORSTATUS`)
      .pipe(catchError(this.handleError));
  }


  dscardModulesChanges(): Observable<any> {
    return this.http
      .get<any>(`http://${this.host}:${this.port}/commandGet?cmd=DISCARD-MODULE-SAVE-CHANGES`)
      .pipe(catchError(this.handleError));
  }

  /* verify if there is any unrefreshed changes to the MM */
  verifyIfMMneedsToBeRefreshed(): Observable<any> {
    return this.http
      .get<any>(`http://${this.host}:${this.port}/commandGet?cmd=UNREFRESHED-MODULE-CHANGES`)
      .pipe(catchError(this.handleError));
  }

  thirdPartyModuleList(): Observable<any> {
    return this.http
      .get<any>(`http://${this.host}:${this.port}/commandGet?cmd=THRID-PARTY`)
    
  }

  installNewModule(module: NewModule): Observable<any> {
    return this.http.post<any>(`http://${this.host}:${this.port}/handlePost`, module);

  }

  installProgress(): Observable<any>{
    return this.http.get<any>(`http://${this.host}:${this.port}/commandGet?cmd=INSTALL-STATUS`);
  }

  updateModule(moduleName: string): Observable<any>{
    return this.http.get<any>(`http://${this.host}:${this.port}/commandGet?cmd=UPDATE-MODULE&moduleName=${moduleName}`);
  }


  checkIfReacheable() {
    this.http
      .get('http://localhost:8080/', { responseType: 'text' })
      .subscribe({
        next: (result) => {
          console.log(result);
        },
        error: (err) => {
          console.log(err);
        }
      });
  }
  openCloseDevTools():Observable<any>{ 
    return this.http.get<any>(
      `http://${this.host}:${this.port}/commandGet?cmd=BROWSER-CONSOLE`
    );
    
  }
  toggleScreen():Observable<any>{ 
    return this.http.get<any>(
      `http://${this.host}:${this.port}/commandGet?cmd=TOGGLE-SCREEN`
    );
    
  }

  systemStatus(start: boolean):Observable<any>{
    let startStop = '';
    if (start){
      startStop = 'start';
    }else{
      startStop = 'stop';
    }

    
    return this.http.get<any>(
      `http://${this.host}:${this.port}/commandGet?cmd=SYSTEM-STATUS&request=${startStop}`
    );
    
  }

  private handleError(error: HttpErrorResponse) {
    // console.log(error);
    if (error.status === 0) {
      // A client-side or network error occurred. Handle it accordingly.
      console.error('An error occurred:', error);
    } else {
      // The backend returned an unsuccessful response code.
      // The response body may contain clues as to what went wrong.
      console.error(
        `Backend returned code ${error.status}, body was: `,
        error.error
      );
    }
    // Return an observable with a user-facing error message.
    return throwError(
      () => new Error(`Something bad happened; please try again later. Message: ${error.message}`)
    );
  }



}







// let position[] = {   .region.top.left
//  
export interface AlertMessage {
  title: string;
  message: string;
  type: string;
  timer: number;
}
