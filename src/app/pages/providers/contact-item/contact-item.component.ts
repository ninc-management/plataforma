import { Component, Input } from '@angular/core';
import { cloneDeep } from 'lodash';

import { ProviderService } from 'app/shared/services/provider.service';

import { Contact, Provider } from '@models/provider';

import provider_validation from 'app/shared/validators/provider-validation.json';

@Component({
  selector: 'ngx-contact-item',
  templateUrl: './contact-item.component.html',
  styleUrls: ['./contact-item.component.scss'],
})
export class ContactItemComponent {
  @Input() clonedProvider = new Provider();
  contact = new Contact();
  validation = provider_validation as any;

  constructor(public providerService: ProviderService) {}

  addContact(): void {
    this.clonedProvider.contacts.push(cloneDeep(this.contact));
    this.providerService.editProvider(this.clonedProvider);
  }
}
