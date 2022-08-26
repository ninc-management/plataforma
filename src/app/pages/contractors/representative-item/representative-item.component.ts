import { AfterViewInit, Component, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { NgForm } from '@angular/forms';
import { cloneDeep, isEqual } from 'lodash';
import { BehaviorSubject } from 'rxjs';

import { RepresentativeTypes } from '../contractor-item/contractor-item.component';
import { StatecityService } from 'app/shared/services/statecity.service';
import { isOfType } from 'app/shared/utils';

import { ComercialRepresentative, Contractor, LegalRepresentative } from '@models/contractor';

import contractor_validation from 'app/shared/validators/contractor-validation.json';

@Component({
  selector: 'ngx-representative-item',
  templateUrl: './representative-item.component.html',
  styleUrls: ['./representative-item.component.scss'],
})
export class RepresentativeItemComponent implements OnInit, AfterViewInit {
  @Input() representative!: LegalRepresentative | ComercialRepresentative;
  @Input() clonedContractor = new Contractor();
  @Input() isFormDirty = new BehaviorSubject<boolean>(false);
  @Output() submit = new EventEmitter<void>();
  @ViewChild('form') ngForm = {} as NgForm;

  clonedRepresentative!: LegalRepresentative | ComercialRepresentative;
  cities: string[] = [];
  states: string[] = [];
  validation = contractor_validation as any;
  representativeTypes = RepresentativeTypes;
  isEditing!: boolean;

  isOfType = isOfType;
  LegalRepresentative = LegalRepresentative;

  constructor(private statecityService: StatecityService) {}

  ngOnInit(): void {
    this.clonedRepresentative = cloneDeep(this.representative);
    this.isEditing = !this.clonedRepresentative.locals.isNew;
    this.states = this.statecityService.buildStateList();
  }

  ngAfterViewInit() {
    this.ngForm.statusChanges?.subscribe(() => {
      if (this.ngForm.dirty) this.isFormDirty.next(true);
    });
  }

  buildCityList(state: string): void {
    this.cities = this.statecityService.buildCityList(state);
  }

  isLegalRepresentative(
    representative: LegalRepresentative | ComercialRepresentative
  ): representative is LegalRepresentative {
    return isOfType(LegalRepresentative, representative);
  }

  registerRepresentative(): void {
    if (!this.isEditing) {
      if (isOfType(LegalRepresentative, this.clonedRepresentative)) {
        this.clonedContractor.legalRepresentatives.push(cloneDeep(this.clonedRepresentative));
      } else {
        this.clonedContractor.comercialRepresentatives.push(cloneDeep(this.clonedRepresentative));
      }
    } else {
      this.applyChanges(this.representative, this.clonedRepresentative);
    }

    this.isFormDirty.next(false);
    this.submit.emit();
  }

  isNotEdited(): boolean {
    return isEqual(this.representative, this.clonedRepresentative);
  }

  private applyChanges<T>(representative: T, newRepresentative: T) {
    Object.keys(newRepresentative).forEach((key) => {
      representative[key as keyof T] = newRepresentative[key as keyof T];
    });
  }
}
