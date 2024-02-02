import { InjectionToken } from "@angular/core";
import { AppConfig } from "../_model/AppConfig";

export const APP_CONFIG: InjectionToken<AppConfig>
= new InjectionToken<AppConfig>('Application Configuration');