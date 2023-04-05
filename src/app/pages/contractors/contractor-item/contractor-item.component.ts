import { Component, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { NgForm } from '@angular/forms';
import { NbDialogService } from '@nebular/theme';
import { cloneDeep, isEqual } from 'lodash';
import { BehaviorSubject, take } from 'rxjs';

import { ContractorDialogComponent } from '../contractor-dialog/contractor-dialog.component';
import { ConfirmationDialogComponent } from 'app/shared/components/confirmation-dialog/confirmation-dialog.component';
import { ContractorService } from 'app/shared/services/contractor.service';
import { StatecityService } from 'app/shared/services/statecity.service';
import { trackByIndex } from 'app/shared/utils';

import { ComercialRepresentative, Contractor, LegalRepresentative } from '@models/contractor';

import contractor_validation from 'app/shared/validators/contractor-validation.json';

enum TypesOfPerson {
  PESSOA_FISICA = 'pessoa física',
  PESSOA_JURIDICA = 'pessoa jurídica',
}

export enum RepresentativeTypes {
  COMERCIAL = 'Comercial',
  LEGAL = 'Legal',
}

@Component({
  selector: 'ngx-contractor-item',
  templateUrl: './contractor-item.component.html',
  styleUrls: ['./contractor-item.component.scss'],
})
export class ContractorItemComponent implements OnInit {
  @ViewChild('form') ngForm = {} as NgForm;
  @Input() iContractor = new Contractor();
  @Input() isFormDirty = new BehaviorSubject<boolean>(false);
  @Input() isDialogBlocked = new BehaviorSubject<boolean>(false);
  @Input() contractors?: Contractor[];
  @Output() submit = new EventEmitter<void>();

  editing = false;
  submitted = false;
  cities: string[] = [];
  states: string[] = [];
  trackByIndex = trackByIndex;
  contractor = new Contractor();
  typesOfPerson = TypesOfPerson;
  representativeTypes = RepresentativeTypes;
  validation = contractor_validation as any;
  selectedOption = TypesOfPerson.PESSOA_FISICA;
  personType = { hasChanged: false, type: this.typesOfPerson.PESSOA_FISICA };

  constructor(
    private contractorService: ContractorService,
    private dialogService: NbDialogService,
    private statecityService: StatecityService
  ) {}

  ngOnInit(): void {
    if (this.iContractor._id !== undefined) {
      this.editing = true;
      this.contractor = cloneDeep(this.iContractor);
      this.selectedOption =
        this.contractor.document.length == this.validation.cpf.maxLength
          ? TypesOfPerson.PESSOA_FISICA
          : TypesOfPerson.PESSOA_JURIDICA;
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

  openRepresentativeDialog(
    representativeType: string,
    representative?: LegalRepresentative | ComercialRepresentative
  ): void {
    this.isDialogBlocked.next(true);
    if (representative) representative.locals = { isNew: false };
    this.dialogService
      .open(ContractorDialogComponent, {
        context: {
          title: (representative ? 'Editar' : 'Adicionar') + ' Representante ' + representativeType,
          contractor: this.contractor,
          representative: representative
            ? representative
            : representativeType == RepresentativeTypes.LEGAL
            ? new LegalRepresentative()
            : new ComercialRepresentative(),
        },
        dialogClass: 'my-dialog',
        closeOnBackdropClick: false,
        closeOnEsc: false,
        autoFocus: false,
      })
      .onClose.pipe(take(1))
      .subscribe(() => {
        this.isDialogBlocked.next(false);
      });
  }

  confirmationDialog(representativeType: string, index: number): void {
    this.isDialogBlocked.next(true);
    this.dialogService
      .open(ConfirmationDialogComponent, {
        context: {
          question: 'Você tem certeza que deseja remover?',
        },
        dialogClass: 'my-dialog',
        closeOnBackdropClick: false,
        closeOnEsc: false,
        autoFocus: false,
      })
      .onClose.pipe(take(1))
      .subscribe((response) => {
        if (response) {
          representativeType == RepresentativeTypes.LEGAL
            ? this.contractor.legalRepresentatives.splice(index, 1)
            : this.contractor.comercialRepresentatives.splice(index, 1);
        }

        this.isDialogBlocked.next(false);
      });
  }

  changeValues(option: string): void {
    if (option === this.personType.type) return;
    this.contractor.document = '';
    this.personType.hasChanged = true;
    this.personType.type = this.selectedOption;
  }

  isNotEdited(): boolean {
    return isEqual(this.contractor, this.iContractor);
  }

  isSameDocument(fieldValue: string): Contractor[] {
    if (!this.contractors) return [];
    return this.contractors.filter((contractor) => contractor.document === fieldValue);
  }
}
