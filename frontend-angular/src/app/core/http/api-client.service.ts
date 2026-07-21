import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ApiClient {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl.replace(/\/$/, '');

  get<T>(path: string): Observable<T> {
    return this.http.get<T>(this.toUrl(path));
  }

  getBlob(path: string): Observable<Blob> {
    return this.http.get(this.toUrl(path), { responseType: 'blob' });
  }

  post<T>(path: string, body?: unknown): Observable<T> {
    return this.http.post<T>(this.toUrl(path), body);
  }

  postForm<T>(path: string, body: FormData): Observable<T> {
    return this.http.post<T>(this.toUrl(path), body);
  }

  patch<T>(path: string, body?: unknown): Observable<T> {
    return this.http.patch<T>(this.toUrl(path), body);
  }

  delete<T>(path: string): Observable<T> {
    return this.http.delete<T>(this.toUrl(path));
  }

  private toUrl(path: string): string {
    return `${this.baseUrl}/${path.replace(/^\//, '')}`;
  }
}
