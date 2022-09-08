import { Injectable } from '@angular/core';
import { SwUpdate } from '@angular/service-worker';
import { interval } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AppUpdaterService {
  constructor(updates: SwUpdate) {
    const everySixHours$ = interval(6 * 60 * 60 * 1000);
    everySixHours$.subscribe(async () => {
      try {
        const updateFound = await updates.checkForUpdate();
        console.log(updateFound ? 'A new version is available.' : 'Already on the latest version.');
        if (updateFound) {
          const shouldInstallNewVersion = confirm(
            'Uma nova versão da plataforma está disponível. Deseja recarregar a página para instalar a nova versão?'
          );
          if (shouldInstallNewVersion) document.location.reload();
        }
      } catch (err) {
        console.error('Failed to check for updates:', err);
      }
    });

    updates.unrecoverable.subscribe((event) => {
      console.error('An error occurred that we cannot recover from:\n' + event.reason + '\n\nPlease reload the page.');
    });
  }
}
