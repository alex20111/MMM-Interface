import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { AppConfig } from './app-config';
import { Observable } from 'rxjs';


@Injectable({
  providedIn: 'root'
})
export class FileService {

  private host: string = "";
  private port: string = "";

  constructor(private http: HttpClient, private cfg: AppConfig) {
    this.host = this.cfg.getConfig("host");
    this.port = this.cfg.getConfig("port")
    
   }

   loadConfig(name: string): Observable<any>{
    return this.http.get<any>(`http://${this.host}:${this.port}/configGet?data=LOAD-CONFIG-BY-NAME&file=${name}`);
  }

  sendConfig(cfg: Cfg): Observable<any> {
    return this.http.post<any>(`http://${this.host}:${this.port}/handlePost`, cfg);
  }

  loadConfigFolder(): Observable<any>{
    return  this.http.get<any>(`http://${this.host}:${this.port}/configGet?data=LOAD-CONFIG-FOLDER`); 
  }

  deleteModule(path: string, idx: number, name: string){
    let data: PostReq = {
      data: 'DELETE-MODULE',
      payload: {
        moduleName: name,
        modulePath: path,
        index: idx
      } 
    }
    return this.http.post<any>(`http://${this.host}:${this.port}/handlePost`, data);
  }
}

export interface Cfg{
  data:string,
  config:string
  file?: string
  module?: any
}

export interface PostReq{
  data: string,
  payload: any
}