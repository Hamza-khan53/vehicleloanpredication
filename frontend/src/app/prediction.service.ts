
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface PredictionResponse {
  prediction: string | number;
  label?: string;
  probabilities?: number[];
  status?: string;
  disclaimer?: string;
}

@Injectable({
  providedIn: 'root'
})
export class PredictionService {
  private http = inject(HttpClient);

  predict(
    payload: Record<string, string | number | null>
  ): Observable<PredictionResponse> {
    return this.http.post<PredictionResponse>(
      '/api/predict',
      payload
    );
  }
}
