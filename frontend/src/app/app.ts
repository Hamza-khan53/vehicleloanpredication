import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FEATURES, Feature } from './feature-schema';
import { PredictionService, PredictionResponse } from './prediction.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  readonly fields: Feature[] = FEATURES;
  readonly deployedStatic =
    !['localhost', '127.0.0.1'].includes(window.location.hostname);

  values: Record<string, string | number | null> = {};
  loading = false;
  error = '';
  result: PredictionResponse | null = null;

  private api = inject(PredictionService);

  constructor() {
    for (const field of this.fields) {
      this.values[field.name] = null;
    }
  }

  submit(): void {
    this.error = '';
    this.result = null;

    if (this.deployedStatic) {
      this.error =
        'GitHub Pages is a static demo. Run Flask and Angular locally to request predictions.';
      return;
    }

    const payload: Record<string, number> = {};

    for (const field of this.fields) {
      const value = this.values[field.name];

      if (value === null || value === '') {
        this.error = `Please enter a value for ${field.label}.`;
        return;
      }

      const numeric = Number(value);

      if (!Number.isFinite(numeric)) {
        this.error = `Please enter a valid number for ${field.label}.`;
        return;
      }

      payload[field.name] = numeric;
    }

    this.loading = true;

    this.api.predict(payload).subscribe({
      next: response => {
        this.result = response;
        this.loading = false;
      },
      error: err => {
        this.error =
          err.error?.error ??
          `API request failed (${err.status || 'network error'}). Check Flask and the input values.`;
        this.loading = false;
      }
    });
  }
}