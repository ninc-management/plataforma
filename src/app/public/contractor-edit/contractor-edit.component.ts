import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { combineLatest, skipWhile, Subject, takeUntil } from 'rxjs';

import { ContractorService } from 'app/shared/services/contractor.service';

import { Contractor } from '@models/contractor';

@Component({
  selector: 'contractor-edit',
  templateUrl: './contractor-edit.component.html',
  styleUrls: ['./contractor-edit.component.scss'],
})
export class ContractorEditComponent implements OnInit {
  clientID: string = '';
  destroy$: Subject<void> = new Subject();
  contractorsList: Contractor[] = [];
  contractor: Contractor = new Contractor();
  isDataLoaded: boolean = false;
  //TODO> add spin animation
  constructor(private route: ActivatedRoute, private contractorService: ContractorService) {}

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  ngOnInit(): void {
    combineLatest([this.route.params, this.contractorService.getContractors(), this.contractorService.isDataLoaded$])
      .pipe(
        skipWhile(([params, , isDataLoaded]) => !isDataLoaded && !params),
        takeUntil(this.destroy$)
      )
      .subscribe(([params, contractors, _]) => {
        this.contractorsList = contractors;
        this.clientID = params['clientID'];
        this.contractorsList.forEach((contractor) => {
          if (contractor._id === this.clientID) {
            this.contractor = contractor;
            this.isDataLoaded = true;
          }
        });
      });
  }
}
