import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import * as contract_validation from '../../../shared/contract-validation.json';
import { ContractService } from '../../../shared/services/contract.service';
import { take } from 'rxjs/operators';

@Component({
  selector: 'ngx-contract-item',
  templateUrl: './contract-item.component.html',
  styleUrls: ['./contract-item.component.scss'],
})
export class ContractItemComponent implements OnInit {
  @Output() submit = new EventEmitter<void>();
  submitted = false;
  contractNumber: number;
  contract: any = {};
  validation = (contract_validation as any).default;
  DEPARTMENTS = ['DPC', 'DAQ', 'DEC', 'DRM'];
  COORDINATIONS = [
    'Gerenciamento de Obras',
    'Instalações',
    'Impermeabilização',
    'Projetos Arquitetônicos',
    'Design de Interiores',
    'Sistemas Elétricos',
    'Sistemas Hidrosanitários',
    'Sistemas Estruturais',
    'Recursos Hidricos',
    'Meio Ambiente',
  ];

  constructor(private contractService: ContractService) {}

  ngOnInit(): void {
    this.contractService
      .contractsSize()
      .pipe(take(2))
      .subscribe((size: number) => {
        this.contractNumber = size;
        this.updateCode();
      });
  }

  registerContract(): void {
    this.submitted = true;
    this.contractService.saveContract(this.contract);
    this.submit.emit();
  }

  updateCode(): void {
    this.contract.code =
      'ORC-' +
      this.contractNumber +
      '/' +
      new Date().getFullYear() +
      '-NRT/' +
      (this.contract.department ? this.contract.department : '') +
      '-00';
  }
}
