import { DecimalPipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTableModule } from '@angular/material/table';
import { ChartConfiguration } from 'chart.js';
import { debounceTime } from 'rxjs';
import { BaseChartDirective, provideCharts, withDefaultRegisterables } from 'ng2-charts';

import { Reportes as DatosReportes } from '../../../core/models/reporte.model';
import { mensajeDeError } from '../../../core/services/errores';
import { ReporteService } from '../../../core/services/reporte.service';
import { Aviso } from '../../../shared/components/aviso/aviso';
import { Cargando } from '../../../shared/components/cargando/cargando';
import { FechaPipe } from '../../../shared/pipes/fecha.pipe';
import { aFechaIso } from '../../../shared/utils/fechas';

const COLORES = [
  '#1565c0',
  '#2e7d32',
  '#ef6c00',
  '#6a1b9a',
  '#00838f',
  '#c62828',
  '#5d4037',
  '#455a64',
];

/**
 * Dashboard de indicadores. Un único filtro de fechas actualiza los cuatro a la vez.
 * Gráficos: Chart.js a través de ng2-charts.
 */
@Component({
  selector: 'app-reportes',
  // Chart.js se registra solo en esta pantalla, para no sumarlo a la carga inicial.
  providers: [provideCharts(withDefaultRegisterables())],
  imports: [
    ReactiveFormsModule,
    DecimalPipe,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatProgressBarModule,
    BaseChartDirective,
    FechaPipe,
    Aviso,
    Cargando,
  ],
  templateUrl: './reportes.html',
  styleUrl: './reportes.scss',
})
export class Reportes {
  private readonly reportes = inject(ReporteService);

  readonly rango = inject(FormBuilder).group({
    desde: null as Date | null,
    hasta: null as Date | null,
  });

  readonly datos = signal<DatosReportes | null>(null);
  readonly cargando = signal(true);
  readonly error = signal('');

  readonly columnasRanking = ['posicion', 'medico', 'atendidos'];

  readonly graficoEspecialidades = computed<ChartConfiguration<'bar'>['data']>(() => {
    const filas = this.datos()?.porEspecialidad.especialidades ?? [];
    return {
      labels: filas.map((f) => f.descripcion),
      datasets: [
        {
          label: 'Turnos',
          data: filas.map((f) => Number(f.cantidad)),
          backgroundColor: filas.map((_, i) => COLORES[i % COLORES.length]),
          borderRadius: 6,
        },
      ],
    };
  });

  readonly graficoSedes = computed<ChartConfiguration<'doughnut'>['data']>(() => {
    const filas = this.datos()?.porSede.sedes ?? [];
    return {
      labels: filas.map((f) => f.nombre),
      datasets: [
        {
          data: filas.map((f) => Number(f.cantidad)),
          backgroundColor: filas.map((_, i) => COLORES[i % COLORES.length]),
        },
      ],
    };
  });

  readonly graficoCancelacion = computed<ChartConfiguration<'pie'>['data']>(() => {
    const tasa = this.datos()?.cancelacion;
    const cancelados = tasa?.cancelados ?? 0;
    return {
      labels: ['Cancelados', 'No cancelados'],
      datasets: [
        {
          data: [cancelados, (tasa?.total ?? 0) - cancelados],
          backgroundColor: ['#c62828', '#90caf9'],
        },
      ],
    };
  });

  readonly opcionesBarras: ChartConfiguration<'bar'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: { y: { beginAtZero: true, ticks: { precision: 0 } } },
  };

  readonly opcionesTorta: ChartConfiguration<'doughnut' | 'pie'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: 'bottom' } },
  };

  constructor() {
    // Al cambiar el rango se recalculan los cuatro indicadores a la vez.
    this.rango.valueChanges
      .pipe(debounceTime(400), takeUntilDestroyed())
      .subscribe(() => this.cargar());
    this.cargar();
  }

  cargar(): void {
    if (this.rango.invalid) return;
    const { desde, hasta } = this.rango.getRawValue();
    this.cargando.set(true);
    this.error.set('');
    this.reportes
      .todos(desde ? aFechaIso(desde) : null, hasta ? aFechaIso(hasta) : null)
      .subscribe({
        next: (datos) => {
          this.datos.set(datos);
          this.cargando.set(false);
        },
        error: (error) => {
          this.error.set(mensajeDeError(error));
          this.cargando.set(false);
        },
      });
  }

  limpiar(): void {
    this.rango.reset();
  }
}
