import { Component, OnInit } from '@angular/core';
import { MetricsService } from 'app/shared/services/metrics.service';
import { Observable, of } from 'rxjs';
import { UserService } from 'app/shared/services/user.service';
import { take, map } from 'rxjs/operators';

interface metricItem {
  title: string;
  value: Observable<number>;
  // activeProgress: Observable<number>;
  description: Observable<string>;
  loading: Observable<boolean>;
}

@Component({
  selector: 'progress-section',
  templateUrl: './progress-section.component.html',
  styleUrls: ['./progress-section.component.scss'],
})
export class ProgressSectionComponent implements OnInit {
  METRICS: metricItem[] = new Array(2).fill({});

  constructor(
    private metricsService: MetricsService,
    private userService: UserService
  ) {}

  ngOnInit(): void {
    this.userService.currentUser$.pipe(take(2)).subscribe((user) => {
      this.METRICS[0] = {
        title: 'Contratos como gestor',
        value: this.metricsService.contractsAsManger(user._id),
        description: this.metricsService.contractsAsMangerLast(user._id, 'Mês'),
        loading: this.metricsService
          .contractsAsManger(user._id)
          .pipe(map((x) => x == undefined)),
      };
      this.METRICS[1] = {
        title: 'Contratos como membro',
        value: this.metricsService.contractsAsMember(user._id),
        description: this.metricsService.contractsAsMemberLast(user._id, 'Mês'),
        loading: this.metricsService
          .contractsAsMember(user._id)
          .pipe(map((x) => x == undefined)),
      };
    });
  }
}
