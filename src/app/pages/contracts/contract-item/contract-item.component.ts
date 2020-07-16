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
  year = new Date().getFullYear();
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
      });
  }

  registerContract(): void {
    this.submitted = true;
    this.contractService.saveContract(this.contract);
    this.submit.emit();
  }
}
