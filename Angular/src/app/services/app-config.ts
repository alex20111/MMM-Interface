import { HttpClient, HttpErrorResponse } from "@angular/common/http";
import { Inject, Injectable } from "@angular/core";
import { APP_CONFIG } from "../_helper/Constants";

@Injectable()
export class AppConfig {

  config: any;

  constructor(private http: HttpClient, @Inject(APP_CONFIG) private  appConfig: AppConfig) {
    this.config = appConfig;
   }

  // displayAppConfig(): any{
  //   console.log("config: " , this.appConfig)
  //   return this.appConfig;
  // }
  getConfig(key: string) {

    let keyValue: any;

    keyValue = this.config[key];

    return keyValue;
  }

}