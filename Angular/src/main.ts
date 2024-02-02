import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import { AppModule } from './app/app.module';
import { InjectionToken, enableProdMode } from '@angular/core';
import { AppConfig } from './app/_model/AppConfig';
import { APP_CONFIG } from './app/_helper/Constants';




fetch('./assets/env.json')
  .then(response => response.json())
  .then((config: AppConfig) => {
    // if (environment.production) {
    //   enableProdMode();
    // }
    console.log("Main : " , config)
    platformBrowserDynamic([
      { provide: APP_CONFIG, useValue: config },
    ])
      .bootstrapModule(AppModule)
      .catch(err => console.error(err));
  });




// platformBrowserDynamic().bootstrapModule(AppModule)
//   .catch(err => console.error(err));
