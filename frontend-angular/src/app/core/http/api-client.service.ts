import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ApiClient {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl.replace(/\/$/, '');

  get<T>(path: string): Observable<T> {
    return this.http.get<T>(this.toUrl(path), { withCredentials: true });
  }

  getBlob(path: string): Observable<Blob> {
    return this.http.get(this.toUrl(path), { responseType: 'blob', withCredentials: true });
  }

  post<T>(path: string, body?: unknown): Observable<T> {
    return this.http.post<T>(this.toUrl(path), body, { withCredentials: true });
  }

  postForm<T>(path: string, body: FormData): Observable<T> {
    return this.http.post<T>(this.toUrl(path), body, { withCredentials: true });
  }

  patch<T>(path: string, body?: unknown): Observable<T> {
    return this.http.patch<T>(this.toUrl(path), body, { withCredentials: true });
  }

  delete<T>(path: string): Observable<T> {
    return this.http.delete<T>(this.toUrl(path), { withCredentials: true });
  }

  private toUrl(path: string): string {
    return `${this.baseUrl}/${path.replace(/^\//, '')}`;
  }
}
