import { registerLocaleData } from '@angular/common';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import localeEsAr from '@angular/common/locales/es-AR';
import {
  ApplicationConfig,
  LOCALE_ID,
  provideBrowserGlobalErrorListeners,
  provideZoneChangeDetection,
} from '@angular/core';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { MatPaginatorIntl } from '@angular/material/paginator';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideRouter, withInMemoryScrolling } from '@angular/router';

import { routes } from './app.routes';
import { tokenInterceptor } from './core/interceptors/token.interceptor';
import { AdaptadorFecha, FORMATOS_FECHA } from './shared/utils/adaptador-fecha';
import { PaginadorEs } from './shared/utils/paginador-es';

registerLocaleData(localeEsAr);

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes, withInMemoryScrolling({ scrollPositionRestoration: 'top' })),
    provideHttpClient(withInterceptors([tokenInterceptor])),
    provideAnimationsAsync(),
    // Fechas en formato local (día/mes/año) en toda la aplicación.
    { provide: LOCALE_ID, useValue: 'es-AR' },
    { provide: MAT_DATE_LOCALE, useValue: 'es-AR' },
    { provide: DateAdapter, useClass: AdaptadorFecha },
    { provide: MAT_DATE_FORMATS, useValue: FORMATOS_FECHA },
    { provide: MatPaginatorIntl, useClass: PaginadorEs },
  ],
};
