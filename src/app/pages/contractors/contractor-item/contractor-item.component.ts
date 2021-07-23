import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { cloneDeep } from 'lodash';
import { ContractorService } from 'app/shared/services/contractor.service';
import { Contractor } from '@models/contractor';
import * as contractor_validation from 'app/shared/contractor-validation.json';

@Component({
  selector: 'ngx-contractor-item',
  templateUrl: './contractor-item.component.html',
  styleUrls: ['./contractor-item.component.scss'],
})
export class ContractorItemComponent implements OnInit {
  @Input() iContractor?: Contractor;
  @Output() submit = new EventEmitter<void>();
  contractor = new Contractor();
  editing = false;
  submitted = false;
  validation = (contractor_validation as any).default;

  constructor(private contractorService: ContractorService) {}

  ngOnInit(): void {
    if (this.iContractor) {
      this.editing = true;
      this.contractor = cloneDeep(this.iContractor);
    }
  }

  registerContractor(): void {
    this.submitted = true;
    if (this.contractor) {
      if (this.editing)
        this.contractorService.editContractor(this.contractor);
      else
        this.contractorService.saveContractor(this.contractor);
    }
    this.submit.emit();
  }
}
