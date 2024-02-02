import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, catchError, map, of} from 'rxjs';


@Injectable({
  providedIn: 'root'
})
export class HttpConnectService {

  constructor(private http: HttpClient) { }


  verifyIfNodeHelperExist(url: string): Observable<any>{ 
    const jsFile = url.substring(url.lastIndexOf("/") + 1);

    console.log(jsFile);



    return this.http.head(`${url}/blob/master/${jsFile}.js`, { observe: 'response' }).
    pipe(
      map( (response: any) => response.status === 200),
       catchError(() => of(false) )
       
      )
    
  }
  
}
