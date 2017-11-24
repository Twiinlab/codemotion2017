import { Injectable } from '@angular/core';
import { Http, Response } from '@angular/http';
import { Observable } from 'rxjs/Rx';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/catch';

import { environment } from '../../environments/environment';

@Injectable()
export class ImagesService {

  private endpointUrl = 'images/';

  constructor(
    private http: Http
  ) { }

  sendImage(imageData): Observable<any> {
    const formData = new FormData();
    formData.append('imageBase64', imageData);
    return this.http.post(environment.apiUrl + '/predict', formData)
      .map(res => this.extractData(res) )
      .catch(this.handleError);
  }

  private extractData(res: Response) {
    if (res.status < 200 || res.status >= 300) {
      throw new Error('Bad response status: ' + res.status);
    }
    return res.json() || {};
  }

  private handleError(error: any) {
    const errMsg = error.message || 'Server error';
    return Promise.reject(errMsg);
  }
}
