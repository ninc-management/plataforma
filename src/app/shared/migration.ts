import { HttpClient } from '@angular/common/http';
import { ContractExpense } from '@models/contract';
import { skipWhile, take } from 'rxjs/operators';
import { appInjector } from './injector.module';
import { ContractService } from './services/contract.service';
import { InvoiceService } from './services/invoice.service';
import { OneDriveService } from './services/onedrive.service';
import { combineLatest } from 'rxjs';
import { cloneDeep } from 'lodash';

export function migrateExpensesAttachmentsLink(): void {
  const contractService = appInjector.get(ContractService);
  const invoiceService = appInjector.get(InvoiceService);
  const oneDriveService = appInjector.get(OneDriveService);
  const http = appInjector.get(HttpClient);

  combineLatest([
    contractService.getContracts(),
    invoiceService.getInvoices(),
    contractService.isDataLoaded$,
    invoiceService.isDataLoaded$,
  ])
    .pipe(
      skipWhile(([, , isContractDataLoaded, isInvoiceDataLoaded]) => !(isContractDataLoaded && isInvoiceDataLoaded)),
      take(1)
    )
    .subscribe(([contracts, , ,]) => {
      contracts.forEach((contract) => {
        const clonedContract = cloneDeep(contract);
        let hasLinkUpdated = false;

        if (clonedContract.invoice) {
          const invoice = invoiceService.idToInvoice(clonedContract.invoice);
          const listChildrenURL =
            oneDriveService.oneDriveURI() + oneDriveService.generatePath(invoice) + '/Recibos:/children';

          http
            .get(listChildrenURL)
            .pipe(take(1))
            .subscribe((response: any) => {
              let attachments = response['value']; //All attachments inside the current clonedContract 'Recibos' folder
              if (attachments) {
                clonedContract.expenses.forEach((expense: ContractExpense) => {
                  expense.uploadedFiles.forEach((file) => {
                    const matchedAttachment = attachments.find((attachment: any) => attachment.name == file.name);
                    if (matchedAttachment) {
                      attachments = attachments.filter(
                        (attachment: any) => attachment['id'] != matchedAttachment['id']
                      );
                      //If a shared link already exists, a new one isn't created. Instead, the one who already exists is returned
                      http
                        .post(oneDriveService.createLinkURI(matchedAttachment['id']), { type: 'view' })
                        .pipe(take(1))
                        .subscribe((sharedLinkResponse: any) => {
                          file.url = sharedLinkResponse['link']['webUrl'];
                          hasLinkUpdated = true;
                        });
                    }
                  });
                });
              }
            });
        }

        if (hasLinkUpdated) {
          contractService.editContract(clonedContract);
          hasLinkUpdated = false;
        }
      });
    });
}
