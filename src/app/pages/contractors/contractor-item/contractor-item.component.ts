import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { ContractorService } from '../../../shared/services/contractor.service';
import * as contractor_validation from '../../../shared/contractor-validation.json';

@Component({
  selector: 'ngx-contractor-item',
  templateUrl: './contractor-item.component.html',
  styleUrls: ['./contractor-item.component.scss'],
})
export class ContractorItemComponent implements OnInit {
  @Input() contractor: any;
  @Output() submit = new EventEmitter<void>();
  editing = false;
  submitted = false;
  validation = (contractor_validation as any).default;

  constructor(private contractorService: ContractorService) {}

  ngOnInit(): void {
    if (this.contractor) {
      this.editing = true;
    } else {
      this.contractor = {};
    }
  }

  registerContractor(): void {
    this.submitted = true;
    if (this.editing) {
      this.contractorService.editContractor(this.contractor);
    } else {
      this.contractorService.saveContractor(this.contractor);
    }
    this.submit.emit();
  }
}
