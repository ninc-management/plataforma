import { Component, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { NgForm } from '@angular/forms';
import { cloneDeep } from 'lodash';
import { BehaviorSubject } from 'rxjs';

import { ContractorService } from 'app/shared/services/contractor.service';
import { StatecityService } from 'app/shared/services/statecity.service';

import { Contractor } from '@models/contractor';

import contractor_validation from 'app/shared/validators/contractor-validation.json';

enum TypesOfPerson {
  PESSOA_FISICA = 'pessoa física',
  PESSOA_JURIDICA = 'pessoa jurídica',
}

@Component({
  selector: 'ngx-contractor-item',
  templateUrl: './contractor-item.component.html',
  styleUrls: ['./contractor-item.component.scss'],
})
export class ContractorItemComponent implements OnInit {
  @Input() iContractor = new Contractor();
  @Input() isFormDirty = new BehaviorSubject<boolean>(false);
  @Output() submit = new EventEmitter<void>();
  @ViewChild('form') ngForm = {} as NgForm;
  contractor = new Contractor();
  editing = false;
  submitted = false;
  validation = contractor_validation as any;
  typeOfPerson = TypesOfPerson;
  selectedOption = TypesOfPerson.PESSOA_FISICA;
  cities: string[] = [];
  states: string[] = [];

  constructor(private contractorService: ContractorService, private statecityService: StatecityService) {}

  ngOnInit(): void {
    if (this.iContractor._id !== undefined) {
      this.editing = true;
      this.contractor = cloneDeep(this.iContractor);
    }
    this.states = this.statecityService.buildStateList();
    if (this.contractor.address.state) this.cities = this.statecityService.buildCityList(this.contractor.address.state);
  }

  ngAfterViewInit() {
    this.ngForm.statusChanges?.subscribe(() => {
      if (this.ngForm.dirty) this.isFormDirty.next(true);
    });
  }

  registerContractor(): void {
    this.submitted = true;
    if (this.editing) this.contractorService.editContractor(this.contractor);
    else this.contractorService.saveContractor(this.contractor);
    this.isFormDirty.next(false);
    this.submit.emit();
  }

  buildCityList(state: string): void {
    this.cities = this.statecityService.buildCityList(state);
  }
}
