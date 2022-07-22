import { HttpClient } from '@angular/common/http';
import { cloneDeep } from 'lodash';
import { combineLatest, forkJoin } from 'rxjs';
import { skipWhile, take } from 'rxjs/operators';

import { appInjector } from './injector.module';
import { ContractService } from './services/contract.service';
import { InvoiceService } from './services/invoice.service';
import { OneDriveService } from './services/onedrive.service';

import { ContractExpense } from '@models/contract';
import { UploadedFile } from '@models/shared';

interface FileToOverride {
  uploadedFile: UploadedFile;
  matchedAttachment: any;
}

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

        if (clonedContract.invoice) {
          const invoice = invoiceService.idToInvoice(clonedContract.invoice);
          const listChildrenURL =
            oneDriveService.oneDriveURI() + oneDriveService.generatePath(invoice) + '/Recibos:/children';

          http
            .get(listChildrenURL)
            .pipe(take(1))
            .subscribe((response: any) => {
              const attachments = response['value']; //All attachments inside the current clonedContract 'Recibos' folder
              if (attachments) {
                const allFilesToOverride = clonedContract.expenses.reduce(
                  (allFilesToOverride: FileToOverride[], expense: ContractExpense) => {
                    const currentExpenseFilesToOverride = getExpenseFilesToOverride(expense, attachments);
                    allFilesToOverride.push(...currentExpenseFilesToOverride);
                    return allFilesToOverride;
                  },
                  []
                );

                if (allFilesToOverride) {
                  forkJoin([
                    allFilesToOverride.map((data) => {
                      //If a shared link already exists, a new one isn't created. Instead, the one who already exists is returned
                      http
                        .post(oneDriveService.createLinkURI(data.matchedAttachment['id']), { type: 'view' })
                        .pipe(take(1))
                        .subscribe((sharedLinkResponse: any) => {
                          data.uploadedFile.url = sharedLinkResponse['link']['webUrl'];
                        });
                    }),
                  ]).subscribe(() => {
                    contractService.editContract(clonedContract);
                  });
                }
              }
            });
        }
      });
    });
}

function getExpenseFilesToOverride(expense: ContractExpense, attachments: any): FileToOverride[] {
  return expense.uploadedFiles.reduce((filesToOverride: FileToOverride[], file) => {
    const matchedAttachment = attachments.find((attachment: any) => attachment.name == file.name);

    if (matchedAttachment) {
      attachments = attachments.filter((attachment: any) => attachment['id'] != matchedAttachment['id']);
      filesToOverride.push({ uploadedFile: file, matchedAttachment: matchedAttachment });
    }

    return filesToOverride;
  }, []);
}
