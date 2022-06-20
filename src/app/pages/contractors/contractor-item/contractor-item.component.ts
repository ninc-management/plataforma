import { Component, OnInit, Input, Output, EventEmitter, ViewChild } from '@angular/core';
import { cloneDeep } from 'lodash';
import { ContractorService } from 'app/shared/services/contractor.service';
import { Contractor } from '@models/contractor';
import contractor_validation from 'app/shared/validators/contractor-validation.json';
import { BehaviorSubject } from 'rxjs';
import { NgForm } from '@angular/forms';

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

  constructor(private contractorService: ContractorService) {}

  ngOnInit(): void {
    if (this.iContractor._id !== undefined) {
      this.editing = true;
      this.contractor = cloneDeep(this.iContractor);
    }
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
}
