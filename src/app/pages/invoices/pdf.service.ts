import { Injectable } from '@angular/core';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { PdfMakeWrapper, Img } from 'pdfmake-wrapper';
import { StringUtilService } from 'app/shared/services/string-util.service';
import { Subject, take } from 'rxjs';
import { UserService } from 'app/shared/services/user.service';
import { ContractorService } from 'app/shared/services/contractor.service';
import extenso from 'extenso';
import pdfMake from 'pdfmake/build/pdfmake';
import { ContentTable, TableCell, ContextPageSize } from 'pdfmake/interfaces';
import { Invoice } from '@models/invoice';
import { User } from '@models/user';
import { TeamService } from 'app/shared/services/team.service';
import { UtilsService } from 'app/shared/services/utils.service';
import { ConfigService } from 'app/shared/services/config.service';
import { InvoiceConfig } from '@models/platformConfig';

pdfMake.fonts = {
  Sans: {
    normal:
      'https://firebasestorage.googleapis.com/v0/b/plataforma-nortan.appspot.com/o/fonts%2FOpenSans-Light.ttf?alt=media&token=c372e982-8c7b-4f1c-8b04-a2d3aa52d2d0',
    bold: 'https://firebasestorage.googleapis.com/v0/b/plataforma-nortan.appspot.com/o/fonts%2FOpenSans-Bold.ttf?alt=media&token=91e5ed82-220b-467f-9ff7-a051bb04d873',
    italics:
      'https://firebasestorage.googleapis.com/v0/b/plataforma-nortan.appspot.com/o/fonts%2FOpenSans-LightItalic.ttf?alt=media&token=d7121f34-0c03-4665-8999-b5962b32cbb7',
    bolditalics:
      'https://firebasestorage.googleapis.com/v0/b/plataforma-nortan.appspot.com/o/fonts%2FOpenSans-BoldItalic.ttf?alt=media&token=ec316bb3-c404-4f6e-bd30-c85302c41b87',
  },
};

interface adsContent {
  svg: string;
  text: any;
  metric: any;
}

@Injectable({
  providedIn: 'root',
})
export class PdfService {
  today = format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
  pdfData$ = new Subject<string>();
  teamImageSVG = '';
  config = new InvoiceConfig();

  companyLogoSvg =
    '<svg xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:cc="http://creativecommons.org/ns#" xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#" xmlns:svg="http://www.w3.org/2000/svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 793.76001 175.23999" height="175.23999" width="793.76001" xml:space="preserve" id="svg2" version="1.1"><metadata id="metadata8"><rdf:RDF><cc:Work rdf:about=""><dc:format>image/svg+xml</dc:format><dc:type rdf:resource="http://purl.org/dc/dcmitype/StillImage" /><dc:title></dc:title></cc:Work></rdf:RDF></metadata><defs id="defs6" /><g transform="matrix(1.3333333,0,0,-1.3333333,0,1123)" id="g10"><g id="g2357"><path d="M 0,748.515 H 595.32 V 842.25 H 0 Z" style="fill:#eaeaea;fill-opacity:1;fill-rule:evenodd;stroke:none" id="path20" /><path d="m 318.859,786.201 -1.835,0.009 -12.29,-21.288 14.125,0.238 v -25.671 h -28.871 l 7.268,-12.114 h 21.603 v -15.344 h 12.113 v 15.344 h 7.066 l 7.067,12.114 h -14.133 v 46.721 h -12.113 z" style="fill:#ff8800;fill-opacity:1;fill-rule:evenodd;stroke:none" id="path22" /><path d="m 312.802,786.141 h -35.501 c -7.184,0 -14.073,-2.853 -19.153,-7.933 -5.079,-5.079 -7.933,-11.969 -7.933,-19.152 v -4.595 c 0,-14.959 12.127,-27.086 27.086,-27.086 h 6.025 l 6.662,12.114 h -9.847 c -4.653,0 -9.112,1.865 -12.378,5.179 -3.266,3.314 -5.067,7.799 -5,12.451 0,0 0,0 0,10e-4 0.134,9.256 7.676,16.69 16.934,16.69 h 26.039 z m -22.814,-20.922 h 28.871 l -14.738,-25.73 h -14.133 l 7.47,13.123 h -14.334 z" style="fill:#000000;fill-opacity:1;fill-rule:evenodd;stroke:none" id="path24" /><path d="m 255.106,719.138 h -1.536 v 1.603 c 0,0.2 -0.03,0.331 -0.092,0.392 -0.061,0.061 -0.192,0.092 -0.392,0.092 h -0.851 c -0.2,0 -0.334,-0.031 -0.401,-0.092 -0.066,-0.061 -0.1,-0.192 -0.1,-0.392 v -7.127 c 0,-0.201 0.034,-0.331 0.1,-0.393 0.067,-0.061 0.201,-0.091 0.401,-0.091 h 0.851 c 0.2,0 0.331,0.03 0.392,0.091 0.062,0.062 0.092,0.192 0.092,0.393 v 1.585 h 1.536 v -1.769 c 0,-0.99 -0.523,-1.485 -1.569,-1.485 h -1.769 c -1.035,0 -1.553,0.495 -1.553,1.485 v 7.511 c 0,0.979 0.518,1.469 1.553,1.469 h 1.769 c 1.046,0 1.569,-0.49 1.569,-1.469 z" style="fill:#000000;fill-opacity:1;fill-rule:nonzero;stroke:none" id="path26" /><path d="m 258.077,722.41 h 1.852 c 1.035,0 1.553,-0.49 1.553,-1.469 v -7.511 c 0,-0.979 -0.518,-1.469 -1.553,-1.469 h -1.852 c -1.046,0 -1.569,0.49 -1.569,1.469 v 7.511 c 0,0.979 0.523,1.469 1.569,1.469 z m 1.902,-8.746 v 7.043 c 0,0.201 -0.033,0.331 -0.1,0.393 -0.066,0.061 -0.2,0.091 -0.4,0.091 h -0.968 c -0.201,0 -0.331,-0.03 -0.393,-0.091 -0.061,-0.062 -0.091,-0.192 -0.091,-0.393 v -7.043 c 0,-0.201 0.03,-0.331 0.091,-0.393 0.062,-0.061 0.192,-0.091 0.393,-0.091 h 0.968 c 0.2,0 0.334,0.03 0.4,0.091 0.067,0.062 0.1,0.192 0.1,0.393 z" style="fill:#000000;fill-opacity:1;fill-rule:nonzero;stroke:none" id="path28" /><path d="m 266.873,722.41 h 1.385 v -10.449 h -1.519 l -2.203,7.545 v -7.545 h -1.385 v 10.449 h 1.585 l 2.137,-7.328 z" style="fill:#000000;fill-opacity:1;fill-rule:nonzero;stroke:none" id="path30" /><path d="m 272.998,713.664 v 2.553 c 0,0.201 -0.03,0.331 -0.091,0.393 -0.062,0.061 -0.192,0.091 -0.393,0.091 h -1.235 c -1.012,0 -1.519,0.496 -1.519,1.486 v 2.754 c 0,0.979 0.518,1.469 1.553,1.469 h 1.635 c 1.035,0 1.553,-0.49 1.553,-1.469 v -1.536 h -1.519 v 1.302 c 0,0.201 -0.034,0.331 -0.1,0.393 -0.067,0.061 -0.201,0.091 -0.401,0.091 h -0.701 c -0.2,0 -0.334,-0.03 -0.401,-0.091 -0.066,-0.062 -0.1,-0.192 -0.1,-0.393 v -2.32 c 0,-0.2 0.034,-0.331 0.1,-0.392 0.067,-0.061 0.201,-0.092 0.401,-0.092 h 1.218 c 1.024,0 1.536,-0.489 1.536,-1.469 v -3.004 c 0,-0.979 -0.523,-1.469 -1.569,-1.469 h -1.619 c -1.035,0 -1.552,0.49 -1.552,1.469 v 1.536 h 1.519 v -1.302 c 0,-0.201 0.033,-0.331 0.1,-0.393 0.066,-0.061 0.2,-0.091 0.4,-0.091 h 0.701 c 0.201,0 0.331,0.03 0.393,0.091 0.061,0.062 0.091,0.192 0.091,0.393 z" style="fill:#000000;fill-opacity:1;fill-rule:nonzero;stroke:none" id="path32" /><path d="m 280.242,722.41 v -1.219 h -1.752 v -9.23 h -1.503 v 9.23 h -1.752 v 1.219 z" style="fill:#000000;fill-opacity:1;fill-rule:nonzero;stroke:none" id="path34" /><path d="m 282.696,716.184 v -4.223 h -1.502 v 10.449 h 3.421 c 1.035,0 1.552,-0.49 1.552,-1.469 v -3.271 c 0,-0.846 -0.372,-1.33 -1.118,-1.453 l 1.653,-4.256 h -1.619 l -1.569,4.223 z m 0,5.007 v -3.805 h 1.469 c 0.2,0 0.333,0.03 0.4,0.092 0.067,0.061 0.1,0.192 0.1,0.392 v 2.837 c 0,0.201 -0.033,0.331 -0.1,0.393 -0.067,0.061 -0.2,0.091 -0.4,0.091 z" style="fill:#000000;fill-opacity:1;fill-rule:nonzero;stroke:none" id="path36" /><path d="m 291.225,722.41 h 1.519 v -8.98 c 0,-0.979 -0.523,-1.469 -1.569,-1.469 h -1.853 c -1.046,0 -1.569,0.49 -1.569,1.469 v 8.98 h 1.519 v -8.746 c 0,-0.201 0.033,-0.331 0.1,-0.393 0.067,-0.061 0.2,-0.091 0.401,-0.091 h 0.951 c 0.212,0 0.348,0.03 0.409,0.091 0.061,0.062 0.092,0.192 0.092,0.393 z" style="fill:#000000;fill-opacity:1;fill-rule:nonzero;stroke:none" id="path38" /><path d="m 298.104,711.628 h -2.221 l -0.404,-0.808 h 2.221 z m 1.132,7.51 h -1.535 v 1.603 c 0,0.2 -0.031,0.331 -0.092,0.392 -0.061,0.061 -0.192,0.092 -0.392,0.092 h -0.851 c -0.201,0 -0.334,-0.031 -0.401,-0.092 -0.067,-0.061 -0.1,-0.192 -0.1,-0.392 v -7.127 c 0,-0.201 0.033,-0.331 0.1,-0.393 0.067,-0.061 0.2,-0.091 0.401,-0.091 h 0.851 c 0.2,0 0.331,0.03 0.392,0.091 0.061,0.062 0.092,0.192 0.092,0.393 v 1.585 h 1.535 v -1.769 c 0,-0.99 -0.522,-1.485 -1.568,-1.485 h -1.77 c -1.035,0 -1.552,0.495 -1.552,1.485 v 7.511 c 0,0.979 0.517,1.469 1.552,1.469 h 1.77 c 1.046,0 1.568,-0.49 1.568,-1.469 z" style="fill:#000000;fill-opacity:1;fill-rule:nonzero;stroke:none" id="path40" /><path d="m 302.207,722.41 h 1.853 c 1.035,0 1.552,-0.49 1.552,-1.469 v -7.511 c 0,-0.979 -0.517,-1.469 -1.552,-1.469 h -1.853 c -1.045,0 -1.568,0.49 -1.568,1.469 v 7.511 c 0,0.979 0.523,1.469 1.568,1.469 z m 1.903,-8.746 v 7.043 c 0,0.201 -0.033,0.331 -0.1,0.393 -0.067,0.061 -0.2,0.091 -0.4,0.091 h -0.969 c -0.2,0 -0.331,-0.03 -0.392,-0.091 -0.061,-0.062 -0.092,-0.192 -0.092,-0.393 v -7.043 c 0,-0.201 0.031,-0.331 0.092,-0.393 0.061,-0.061 0.192,-0.091 0.392,-0.091 h 0.969 c 0.2,0 0.333,0.03 0.4,0.091 0.067,0.062 0.1,0.192 0.1,0.393 z m 0.328,9.875 h -2.221 l -0.404,-0.807 h 2.221 z" style="fill:#000000;fill-opacity:1;fill-rule:nonzero;stroke:none" id="path42" /><path d="m 308.8,713.18 h 3.021 v -1.219 h -4.539 v 10.449 h 4.423 v -1.219 H 308.8 v -3.221 h 2.404 v -1.218 H 308.8 Z" style="fill:#000000;fill-opacity:1;fill-rule:nonzero;stroke:none" id="path44" /><path  d="m 316.011,713.664 v 2.553 c 0,0.201 -0.031,0.331 -0.092,0.393 -0.061,0.061 -0.192,0.091 -0.392,0.091 h -1.235 c -1.013,0 -1.519,0.496 -1.519,1.486 v 2.754 c 0,0.979 0.517,1.469 1.552,1.469 h 1.636 c 1.035,0 1.552,-0.49 1.552,-1.469 v -1.536 h -1.519 v 1.302 c 0,0.201 -0.033,0.331 -0.1,0.393 -0.067,0.061 -0.2,0.091 -0.401,0.091 h -0.701 c -0.2,0 -0.333,-0.03 -0.4,-0.091 -0.067,-0.062 -0.1,-0.192 -0.1,-0.393 v -2.32 c 0,-0.2 0.033,-0.331 0.1,-0.392 0.067,-0.061 0.2,-0.092 0.4,-0.092 h 1.219 c 1.024,0 1.535,-0.489 1.535,-1.469 v -3.004 c 0,-0.979 -0.523,-1.469 -1.569,-1.469 h -1.619 c -1.034,0 -1.552,0.49 -1.552,1.469 v 1.536 h 1.519 v -1.302 c 0,-0.201 0.033,-0.331 0.1,-0.393 0.067,-0.061 0.201,-0.091 0.401,-0.091 h 0.701 c 0.2,0 0.331,0.03 0.392,0.091 0.061,0.062 0.092,0.192 0.092,0.393 z" style="fill:#000000;fill-opacity:1;fill-rule:nonzero;stroke:none"   id="path46" /><path   d="M 595.32,739.489 H 352.171 l -7.066,-12.114 H 595.32 Z" style="fill:#ff8800;fill-opacity:1;fill-rule:evenodd;stroke:none" id="path48" /><path  d="m 0,739.489 h 246.793 c 1.557,-6.749 6.21,-10.745 9.422,-12.114 H 0 Z" style="fill:#ff8800;fill-opacity:1;fill-rule:evenodd;stroke:none" id="path50" /></g></g></svg>';

  constructor(
    private utils: UtilsService,
    private stringUtil: StringUtilService,
    private userService: UserService,
    private contractorService: ContractorService,
    private teamService: TeamService,
    private configService: ConfigService
  ) {}

  private applyVerticalAlignment(node: ContentTable, rowIndex: number, align: string): void {
    const allCellHeights = node.table.body[rowIndex].map((innerNode, columnIndex) => {
      let width = 0;
      if (node.table.widths != undefined) width = (node.table.widths[columnIndex] as any)._calcWidth;
      return this.findInlineHeight(innerNode, width).height;
    });
    const maxRowHeight = Math.max(...allCellHeights);
    node.table.body[rowIndex].forEach((cell, ci) => {
      if (allCellHeights[ci] && maxRowHeight > allCellHeights[ci]) {
        let topMargin;
        let cellAlign = align;
        if (Array.isArray(align)) {
          cellAlign = align[ci];
        }
        if (align === 'bottom') {
          topMargin = maxRowHeight - allCellHeights[ci];
        } else if (align === 'center') {
          topMargin = (maxRowHeight - allCellHeights[ci]) / 2;
        }
        if (topMargin) {
          if ((cell as any)._margin) {
            (cell as any)._margin[1] = topMargin;
          } else {
            (cell as any)._margin = [0, topMargin, 0, 0];
          }
        }
      }
    });
  }

  private findInlineHeight(cell: TableCell, maxWidth: number, usedWidth = 0): any {
    const calcLines = (inlines: { height: number; width: number; lineEnd: any }[]) => {
      if (inlines == undefined)
        return {
          height: 0,
          width: 0,
        };
      let currentMaxHeight = 0;
      let lastHadLineEnd = false;
      for (const currentNode of inlines) {
        usedWidth += currentNode.width;
        if (usedWidth > maxWidth || lastHadLineEnd) {
          currentMaxHeight += currentNode.height;
          usedWidth = currentNode.width;
        } else {
          currentMaxHeight = Math.max(currentNode.height, currentMaxHeight);
        }
        lastHadLineEnd = !!currentNode.lineEnd;
      }
      return {
        height: currentMaxHeight,
        width: usedWidth,
      };
    };
    if ((cell as any)._offsets) {
      usedWidth += (cell as any)._offsets.total;
    }
    if ((cell as any)._inlines && (cell as any)._inlines.length) {
      return calcLines((cell as any)._inlines);
    } else if ((cell as any).stack && (cell as any).stack[0]) {
      return (cell as any).stack
        .map((item: TableCell) => {
          return this.findInlineHeight(item, maxWidth);
        })
        .reduce((prev: ContextPageSize, next: ContextPageSize) => {
          return {
            height: prev.height + next.height,
            width: Math.max(prev.width + next.width),
          };
        });
    } else if ((cell as any).table) {
      let currentMaxHeight = 0;
      for (const currentTableBodies of (cell as any).table.body) {
        const innerTableHeights = currentTableBodies.map((innerTableCell: TableCell) => {
          const findInlineHeight = this.findInlineHeight(innerTableCell, maxWidth, usedWidth);

          usedWidth = findInlineHeight.width;
          return findInlineHeight.height;
        });
        currentMaxHeight = Math.max(...innerTableHeights, currentMaxHeight);
      }
      return {
        height: currentMaxHeight,
        width: usedWidth,
      };
    } else if ((cell as any)._height) {
      usedWidth += (cell as any)._width;
      return {
        height: (cell as any)._height,
        width: usedWidth,
      };
    }

    return {
      height: null,
      width: usedWidth,
    };
  }

  noBorderTable(color: string): any {
    return {
      hLineWidth: function (i: number, node: ContentTable) {
        return 0;
      },
      vLineWidth: function (i: number, node: ContentTable) {
        return 0;
      },
      // hLineColor: function (i: number, node: ContentTable) {
      //   return i === 0 || i === node.table.body.length ? 'black' : 'gray';
      // },
      // vLineColor: function (i: number, node: ContentTable) {
      //   return i === 0 || i === node.table.widths.length ? 'black' : 'gray';
      // },
      // hLineStyle: function (i: number, node: ContentTable) {
      //   return { dash: { length: 10, space: 4 } };
      // },
      // vLineStyle: function (i: number, node: ContentTable) {
      //   return { dash: { length: 10, space: 4 } };
      // },
      paddingLeft: function (i: number, node: ContentTable) {
        return 10;
      },
      paddingRight: function (i: number, node: ContentTable) {
        return 10;
      },
      paddingTop: (i: number, node: ContentTable) => {
        this.applyVerticalAlignment(node, i, 'center');
        return i == 0 ? 10 : 0;
      },
      paddingBottom: function (i: number, node: ContentTable) {
        return i == node.table.body.length - 1 ? 10 : 0;
      },
      fillColor: function (rowIndex: number, node: ContentTable, columnIndex: number) {
        return color;
      },
    };
  }

  noSideBorderTable(tableColor: string, lineColor: string = 'black'): any {
    return {
      paddingLeft: function (i: number, node: ContentTable) {
        return 10;
      },
      paddingRight: function (i: number, node: ContentTable) {
        return 10;
      },
      paddingTop: (i: number, node: ContentTable) => {
        this.applyVerticalAlignment(node, i, 'center');
        return 3;
      },
      paddingBottom: function (i: number, node: ContentTable) {
        return 3;
      },
      hLineColor: function (i: number, node: ContentTable) {
        return lineColor;
      },
      vLineColor: function (i: number, node: ContentTable) {
        return lineColor;
      },
      fillColor: function (rowIndex: number, node: ContentTable, columnIndex: number) {
        return tableColor;
      },
    };
  }

  async generate(invoice: Invoice, metrics: any, preview = false, openPdf = false): Promise<void> {
    const pdf = new PdfMakeWrapper();

    this.configService
      .getConfig()
      .pipe(take(1))
      .subscribe((configs) => {
        if (configs[0]) this.config = configs[0].invoiceConfig;
      });

    // Metadata definition
    pdf.info({
      title: 'Proposta de Orçamento G4 Construções',
      author: this.utils.idToProperty(invoice.author, this.userService.idToUser.bind(this.userService), 'fullName'),
      subject: 'Orçamento ' + invoice.code,
      keywords: 'orçamento',
    });

    // Page settings definition
    pdf.pageSize('A4');
    pdf.pageOrientation('portrait');
    pdf.pageMargins([30, 30, 30, 30]);

    // background definition
    pdf.background(function (currentPage: number, pageSize: ContextPageSize) {
      return [
        {
          canvas: [
            {
              type: 'rect',
              x: 0,
              y: 0,
              w: pageSize.width,
              h: 20,
              color: '#FF8800',
            },
          ],
          absolutePosition: { x: 0, y: 0 },
        },
        {
          canvas: [
            {
              type: 'rect',
              x: 0,
              y: 0,
              w: pageSize.width,
              h: 20,
              color: '#FF8800',
            },
          ],
          absolutePosition: { x: 0, y: pageSize.height - 20 },
        },
      ];
    });

    // styles definition
    pdf.defaultStyle({
      fontSize: 11,
      font: 'Sans',
      color: '#052E41',
    });
    pdf.styles({
      insideText: {
        margin: [5, 0, 5, 0],
      },
    });

    // Header
    const header = {
      svg: this.companyLogoSvg,
      width: 595,
      absolutePosition: { x: 0, y: 0 },
    };
    pdf.add(header);
    pdf.add(pdf.ln(8));
    if (this.config.hasHeader) {
      pdf.add([
        {
          text: 'Proposta de Orçamento\n',
          fontSize: 14,
          alignment: 'center',
          color: '#052E41',
          bold: true,
          margin: [0, 5, 0, 0],
        },
        {
          text:
            (invoice.subtitle1 == undefined ? '' : invoice.subtitle1.toLowerCase()) +
            '\n' +
            (invoice.subtitle2 == undefined ? '' : invoice.subtitle2.toLowerCase()),
          fontSize: 12,
          alignment: 'center',
          color: '#052E41',
        },
      ]);
    }

    pdf.add({
      canvas: [
        {
          type: 'line',
          x1: 0,
          y1: 5,
          x2: 595 - 2 * 30,
          y2: 5,
          lineWidth: 1,
          color: '#FF8800',
        },
      ],
    });

    // Body - Greetings
    pdf.add(pdf.ln(1));

    pdf.add({
      text: 'Oi ' + invoice.contactName + ', tudo bem?',
      alignment: 'center',
      style: 'insideText',
    });

    pdf.add(pdf.ln(1));

    const author = invoice.author ? this.userService.idToUser(invoice.author) : new User();

    /* eslint-disable indent*/
    pdf.add({
      text:
        'Nós da G4 Construções nos importamos com a individualidade de cada cliente e os ajudamos entendendo as suas necessidades entregando soluções personalizadas. Por isso, ' +
        author.article +
        ' associad' +
        author.article +
        ' ' +
        author.fullName +
        ', ' +
        (author.expertise
          ? author.expertise[
              author.expertise.findIndex((el) => this.teamService.isSectorEqual(el.sector, invoice.sector))
            ]?.shortExpertise
          : '') +
        ', será ' +
        (author.article == 'a' ? 'sua' : 'seu') +
        ' Consulto' +
        (author.article == 'a' ? 'ra' : 'r') +
        ' Técnic' +
        (author.article == 'a' ? 'a' : 'o') +
        ' Exclusiv' +
        (author.article == 'a' ? 'a' : 'o') +
        ' e gesto' +
        (author.article == 'a' ? 'ra' : 'r') +
        ' do contrato, te guiando para solução mais eficiente.',
      alignment: 'center',
      style: 'insideText',
    });
    /* eslint-enable indent*/

    // Body - Author
    pdf.add(pdf.ln(1));

    /* eslint-disable indent*/
    pdf.add({
      columns: [
        {
          width: 70,
          columns: [
            await new Img(
              author.profilePicture == undefined
                ? 'https://firebasestorage.googleapis.com/v0/b/plataforma-nortan.appspot.com/o/profileImages%2Fsupport.png?alt=media&token=1d319acb-b655-457c-81dd-62a22d9ae836'
                : author.profilePicture
            )
              .width(60)
              .height(60)
              .build(),
            {
              svg: '<svg xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:cc="http://creativecommons.org/ns#" xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#" xmlns:svg="http://www.w3.org/2000/svg" xmlns="http://www.w3.org/2000/svg" xmlns:sodipodi="http://sodipodi.sourceforge.net/DTD/sodipodi-0.dtd" xmlns:inkscape="http://www.inkscape.org/namespaces/inkscape" width="176mm" height="176mm" viewBox="0 0 176 176" version="1.1" id="svg8" inkscape:version="0.92.4 (5da689c313, 2019-01-14)" sodipodi:docname="frame.svg"> <defs id="defs2" /> <sodipodi:namedview id="base" pagecolor="#ffffff" bordercolor="#666666" borderopacity="1.0" inkscape:pageopacity="0.0" inkscape:pageshadow="2" inkscape:zoom="0.5" inkscape:cx="-552.88697" inkscape:cy="349.09231" inkscape:document-units="mm" inkscape:current-layer="layer1" showgrid="false" inkscape:window-width="1920" inkscape:window-height="1012" inkscape:window-x="-8" inkscape:window-y="37" inkscape:window-maximized="1" /> <metadata id="metadata5"> <rdf:RDF> <cc:Work rdf:about=""> <dc:format>image/svg+xml</dc:format> <dc:type rdf:resource="http://purl.org/dc/dcmitype/StillImage" /> <dc:title></dc:title> </cc:Work> </rdf:RDF> </metadata> <g inkscape:label="Layer 1" inkscape:groupmode="layer" id="layer1" transform="translate(0,-121)"> <g id="g864" transform="translate(-28.877305,79.67757)"> <path inkscape:connector-curvature="0" id="rect821" d="M 28.877305,41.185902 V 217.32243 H 205.01436 V 41.185902 Z m 87.690775,2.344557 a 85.345885,85.345885 0 0 1 85.34569,85.345691 85.345885,85.345885 0 0 1 -85.34569,85.3457 85.345885,85.345885 0 0 1 -85.346214,-85.3457 85.345885,85.345885 0 0 1 85.346214,-85.345691 z" style="fill:#ffffff;fill-opacity:1;stroke:none;stroke-width:1.5;stroke-linecap:round;stroke-linejoin:round;stroke-miterlimit:4;stroke-dasharray:none;stroke-dashoffset:0;stroke-opacity:1" /> <circle r="85.345886" cy="129.25417" cx="116.94583" id="path823" style="fill:none;fill-opacity:1;stroke:#bfbfbf;stroke-width:3.16537809;stroke-linecap:round;stroke-linejoin:round;stroke-miterlimit:4;stroke-dasharray:none;stroke-dashoffset:0;stroke-opacity:1" /> </g> </g> </svg>',
              fit: [62, 62],
              relativePosition: { x: -61, y: -1 },
            },
          ],
        },
        {
          width: '*',
          text:
            this.userService.idToShortName(author) +
            ', ' +
            (author.expertise
              ? author.expertise[
                  author.expertise.findIndex((el) => this.teamService.isSectorEqual(el.sector, invoice.sector))
                ]?.text
              : ''),
          alignment: 'left',
          fontSize: 8,
        },
      ],
      style: 'insideText',
    });
    /* eslint-enable indent*/

    // Body - Team
    if (this.config.hasTeam) {
      pdf.add(pdf.ln(1));

      pdf.add({
        text: 'Conheça também a equipe que vai trabalhar nesse contrato:',
        alignment: 'center',
        style: 'insideText',
      });

      pdf.add(pdf.ln(1));

      if (invoice.team.length > 1) {
        const team = invoice.team.slice(1);
        for (const [index, member] of team.entries()) {
          const user = member.user ? this.userService.idToUser(member.user) : new User();
          /* eslint-disable indent*/
          pdf.add({
            columns: [
              {
                width: 70,
                columns: [
                  await new Img(
                    user.profilePicture == undefined
                      ? 'https://firebasestorage.googleapis.com/v0/b/plataforma-nortan.appspot.com/o/profileImages%2Fsupport.png?alt=media&token=1d319acb-b655-457c-81dd-62a22d9ae836'
                      : user.profilePicture
                  )
                    .width(60)
                    .height(60)
                    .build(),
                  {
                    svg: '<svg xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:cc="http://creativecommons.org/ns#" xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#" xmlns:svg="http://www.w3.org/2000/svg" xmlns="http://www.w3.org/2000/svg" xmlns:sodipodi="http://sodipodi.sourceforge.net/DTD/sodipodi-0.dtd" xmlns:inkscape="http://www.inkscape.org/namespaces/inkscape" width="176mm" height="176mm" viewBox="0 0 176 176" version="1.1" id="svg8" inkscape:version="0.92.4 (5da689c313, 2019-01-14)" sodipodi:docname="frame.svg"> <defs id="defs2" /> <sodipodi:namedview id="base" pagecolor="#ffffff" bordercolor="#666666" borderopacity="1.0" inkscape:pageopacity="0.0" inkscape:pageshadow="2" inkscape:zoom="0.5" inkscape:cx="-552.88697" inkscape:cy="349.09231" inkscape:document-units="mm" inkscape:current-layer="layer1" showgrid="false" inkscape:window-width="1920" inkscape:window-height="1012" inkscape:window-x="-8" inkscape:window-y="37" inkscape:window-maximized="1" /> <metadata id="metadata5"> <rdf:RDF> <cc:Work rdf:about=""> <dc:format>image/svg+xml</dc:format> <dc:type rdf:resource="http://purl.org/dc/dcmitype/StillImage" /> <dc:title></dc:title> </cc:Work> </rdf:RDF> </metadata> <g inkscape:label="Layer 1" inkscape:groupmode="layer" id="layer1" transform="translate(0,-121)"> <g id="g864" transform="translate(-28.877305,79.67757)"> <path inkscape:connector-curvature="0" id="rect821" d="M 28.877305,41.185902 V 217.32243 H 205.01436 V 41.185902 Z m 87.690775,2.344557 a 85.345885,85.345885 0 0 1 85.34569,85.345691 85.345885,85.345885 0 0 1 -85.34569,85.3457 85.345885,85.345885 0 0 1 -85.346214,-85.3457 85.345885,85.345885 0 0 1 85.346214,-85.345691 z" style="fill:#ffffff;fill-opacity:1;stroke:none;stroke-width:1.5;stroke-linecap:round;stroke-linejoin:round;stroke-miterlimit:4;stroke-dasharray:none;stroke-dashoffset:0;stroke-opacity:1" /> <circle r="85.345886" cy="129.25417" cx="116.94583" id="path823" style="fill:none;fill-opacity:1;stroke:#bfbfbf;stroke-width:3.16537809;stroke-linecap:round;stroke-linejoin:round;stroke-miterlimit:4;stroke-dasharray:none;stroke-dashoffset:0;stroke-opacity:1" /> </g> </g> </svg>',
                    fit: [62, 62],
                    relativePosition: { x: -61, y: -1 },
                  },
                ],
              },
              {
                width: '*',
                text:
                  user.exibitionName +
                  ', ' +
                  (user.expertise
                    ? user.expertise[
                        user.expertise.findIndex((el) => this.teamService.isSectorEqual(el.sector, member.sector))
                      ]?.text
                    : ''),
                alignment: 'left',
                fontSize: 8,
              },
            ],
            pageBreak: index == 5 ? 'after' : 'none',
            style: 'insideText',
          });
          /* eslint-enable indent*/

          pdf.add(pdf.ln(1));
        }
        // Body - Teams - Support
        pdf.add({
          columns: [
            {
              width: 70,
              columns: [
                {
                  svg: '<svg xmlns:dc="http://purl.org/dc/elements/1.1/"    xmlns:cc="http://creativecommons.org/ns#"    xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"    xmlns:svg="http://www.w3.org/2000/svg"    xmlns="http://www.w3.org/2000/svg"    width="83.994057mm"    height="83.994057mm"    viewBox="0 0 83.994056 83.994058"    version="1.1"    id="svg113">   <defs      id="defs107" />   <metadata      id="metadata110">     <rdf:RDF>       <cc:Work          rdf:about="">         <dc:format>image/svg+xml</dc:format>         <dc:type            rdf:resource="http://purl.org/dc/dcmitype/StillImage" />         <dc:title></dc:title>       </cc:Work>     </rdf:RDF>   </metadata>   <g      id="layer1"      transform="translate(-40.248451,-91.717265)">     <g        transform="matrix(0.35277777,0,0,-0.35277777,41.970498,179.43431)"        id="g105">       <path          d="m 175.895,211.9 -4.006,0.02 -26.84,-46.489 30.846,0.519 v -56.062 h -63.049 l 15.872,-26.454 h 47.177 V 49.925 h 26.454 v 33.509 h 15.431 l 15.432,26.454 H 202.349 V 211.92 h -26.454 v -0.02"          style="fill:#ff8700;fill-opacity:1;fill-rule:evenodd;stroke:none;stroke-width:0.1"          id="path14" />       <path          d="m 162.668,211.77 c 0,0 -40.589,0 -77.5289,0 -15.6879,0 -30.7332,-6.232 -41.8262,-17.325 -11.093,-11.093 -17.325,-26.138 -17.325,-41.826 0,-3.338 0,-6.696 0,-10.035 0,-32.667 26.4832,-59.15 59.1512,-59.15 7.7988,0 13.157,0 13.157,0 l 14.5499,26.454 c 0,0 -9.815,0 -21.5062,0 -10.1609,0 -19.8968,4.074 -27.0296,11.311 -7.1332,7.237 -11.0661,17.031 -10.9192,27.191 v 0.001 c 0.2918,20.216 16.7629,36.45 36.9801,36.45 26.1789,0 56.8649,0 56.8649,0 z m -49.822,-45.69 h 63.049 l -32.186,-56.192 h -30.863 l 16.313,28.659 H 97.8551 l 14.9909,27.533"          style="fill:#000000;fill-opacity:1;fill-rule:evenodd;stroke:none;stroke-width:0.1"          id="path16" />       <path          d="m 36.668,65.4461 h -3.3532 v 3.4988 c 0,0.4379 -0.0668,0.7231 -0.2007,0.8571 -0.1332,0.1332 -0.4192,0.2 -0.8563,0.2 h -1.859 c -0.4379,0 -0.7289,-0.0668 -0.875,-0.2 -0.1457,-0.134 -0.2187,-0.4192 -0.2187,-0.8571 v -15.564 c 0,-0.4379 0.073,-0.7231 0.2187,-0.8571 0.1461,-0.1328 0.4371,-0.2 0.875,-0.2 h 1.859 c 0.4371,0 0.7231,0.0672 0.8563,0.2 0.1339,0.134 0.2007,0.4192 0.2007,0.8571 v 3.4632 h 3.3532 v -3.864 c 0,-2.1629 -1.1418,-3.2442 -3.4258,-3.2442 h -3.8641 c -2.2601,0 -3.3902,1.0813 -3.3902,3.2442 v 16.4027 c 0,2.1383 1.1301,3.207 3.3902,3.207 h 3.8641 c 2.284,0 3.4258,-1.0687 3.4258,-3.207 v -3.9367"          style="fill:#000000;fill-opacity:1;fill-rule:nonzero;stroke:none;stroke-width:0.1"          id="path18" />       <path          d="m 43.1559,72.5898 h 4.0461 c 2.2601,0 3.3902,-1.0687 3.3902,-3.207 V 52.9801 c 0,-2.1379 -1.1301,-3.2082 -3.3902,-3.2082 h -4.0461 c -2.284,0 -3.4258,1.0703 -3.4258,3.2082 v 16.4027 c 0,2.1383 1.1418,3.207 3.4258,3.207 z m 4.1562,-19.1 v 15.3821 c 0,0.4383 -0.073,0.723 -0.2191,0.857 -0.1461,0.134 -0.4379,0.2 -0.875,0.2 h -2.1141 c -0.4367,0 -0.723,-0.066 -0.857,-0.2 -0.1328,-0.134 -0.2,-0.4187 -0.2,-0.857 V 53.4898 c 0,-0.4367 0.0672,-0.7226 0.2,-0.8558 0.134,-0.134 0.4203,-0.2012 0.857,-0.2012 h 2.1141 c 0.4371,0 0.7289,0.0672 0.875,0.2012 0.1461,0.1332 0.2191,0.4191 0.2191,0.8558"          style="fill:#000000;fill-opacity:1;fill-rule:nonzero;stroke:none;stroke-width:0.1"          id="path20" />       <path          d="m 62.366,72.5898 h 3.025 V 49.7719 H 62.0738 L 57.2629,66.248 V 49.7719 H 54.2371 V 72.5898 H 57.7 l 4.666,-16.0007 v 16.0007"          style="fill:#000000;fill-opacity:1;fill-rule:nonzero;stroke:none;stroke-width:0.1"          id="path22" />       <path          d="m 75.743,53.4898 v 5.5774 c 0,0.4379 -0.0668,0.7226 -0.2008,0.8566 -0.1332,0.1332 -0.4192,0.2 -0.8563,0.2 h -2.698 c -2.2109,0 -3.3168,1.0821 -3.3168,3.2442 v 6.0148 c 0,2.1383 1.1301,3.207 3.3898,3.207 h 3.5719 c 2.2602,0 3.3902,-1.0687 3.3902,-3.207 v -3.3539 h -3.3171 v 2.843 c 0,0.4383 -0.0731,0.723 -0.218,0.857 -0.1457,0.134 -0.4379,0.2 -0.875,0.2 H 73.082 c -0.4371,0 -0.7289,-0.066 -0.875,-0.2 -0.1461,-0.134 -0.2191,-0.4187 -0.2191,-0.857 v -5.066 c 0,-0.4379 0.073,-0.7231 0.2191,-0.8571 0.1461,-0.134 0.4379,-0.2 0.875,-0.2 h 2.661 c 2.2351,0 3.3531,-1.0699 3.3531,-3.2078 v -6.5609 c 0,-2.1379 -1.1422,-3.2082 -3.4262,-3.2082 H 72.134 c -2.2602,0 -3.3899,1.0703 -3.3899,3.2082 v 3.3527 h 3.3168 v -2.843 c 0,-0.4367 0.0731,-0.7226 0.2192,-0.8558 0.1461,-0.134 0.4371,-0.2012 0.875,-0.2012 h 1.5308 c 0.4371,0 0.7231,0.0672 0.8563,0.2012 0.134,0.1332 0.2008,0.4191 0.2008,0.8558"          style="fill:#000000;fill-opacity:1;fill-rule:nonzero;stroke:none;stroke-width:0.1"          id="path24" />       <path          d="m 91.5621,72.5898 v -2.6609 h -3.8269 v -20.157 h -3.2813 v 20.157 H 80.627 v 2.6609 h 10.9351"          style="fill:#000000;fill-opacity:1;fill-rule:nonzero;stroke:none;stroke-width:0.1"          id="path26" />       <path          d="m 96.9199,58.9941 v -9.2222 h -3.2801 v 22.8179 h 7.4722 c 2.26,0 3.39,-1.0687 3.39,-3.207 v -7.1449 c 0,-1.8469 -0.814,-2.9039 -2.442,-3.1707 l 3.609,-9.2953 h -3.536 l -3.426,9.2222 z m 0,10.9348 v -8.3098 h 3.2081 c 0.438,0 0.729,0.0661 0.875,0.2 0.146,0.134 0.219,0.4188 0.219,0.8571 v 6.1957 c 0,0.4383 -0.073,0.723 -0.219,0.857 -0.146,0.134 -0.437,0.2 -0.875,0.2 h -3.2081"          style="fill:#000000;fill-opacity:1;fill-rule:nonzero;stroke:none;stroke-width:0.1"          id="path28" />       <path          d="m 115.547,72.5898 h 3.317 V 52.9801 c 0,-2.1379 -1.143,-3.2082 -3.427,-3.2082 h -4.046 c -2.284,0 -3.426,1.0703 -3.426,3.2082 v 19.6097 h 3.317 v -19.1 c 0,-0.4367 0.073,-0.7226 0.219,-0.8558 0.145,-0.134 0.437,-0.2012 0.874,-0.2012 h 2.078 c 0.462,0 0.759,0.0672 0.893,0.2012 0.134,0.1332 0.201,0.4191 0.201,0.8558 v 19.1"          style="fill:#000000;fill-opacity:1;fill-rule:nonzero;stroke:none;stroke-width:0.1"          id="path30" />       <path          d="m 130.569,49.0441 h -4.85 l -0.882,-1.764 h 4.85 z m 2.474,16.402 h -3.354 v 3.4988 c 0,0.4379 -0.066,0.7231 -0.2,0.8571 -0.134,0.1332 -0.419,0.2 -0.857,0.2 h -1.859 c -0.437,0 -0.729,-0.0668 -0.874,-0.2 -0.146,-0.134 -0.219,-0.4192 -0.219,-0.8571 v -15.564 c 0,-0.4379 0.073,-0.7231 0.219,-0.8571 0.145,-0.1328 0.437,-0.2 0.874,-0.2 h 1.859 c 0.438,0 0.723,0.0672 0.857,0.2 0.134,0.134 0.2,0.4192 0.2,0.8571 v 3.4632 h 3.354 v -3.864 c 0,-2.1629 -1.142,-3.2442 -3.427,-3.2442 h -3.863 c -2.26,0 -3.39,1.0813 -3.39,3.2442 v 16.4027 c 0,2.1383 1.13,3.207 3.39,3.207 h 3.863 c 2.285,0 3.427,-1.0687 3.427,-3.207 v -3.9367"          style="fill:#000000;fill-opacity:1;fill-rule:nonzero;stroke:none;stroke-width:0.1"          id="path32" />       <path          d="m 139.531,72.5898 h 4.046 c 2.26,0 3.39,-1.0687 3.39,-3.207 V 52.9801 c 0,-2.1379 -1.13,-3.2082 -3.39,-3.2082 h -4.046 c -2.284,0 -3.426,1.0703 -3.426,3.2082 v 16.4027 c 0,2.1383 1.142,3.207 3.426,3.207 z m 4.155,-19.1 v 15.3821 c 0,0.4383 -0.073,0.723 -0.218,0.857 -0.146,0.134 -0.438,0.2 -0.875,0.2 h -2.114 c -0.438,0 -0.723,-0.066 -0.857,-0.2 -0.134,-0.134 -0.2,-0.4187 -0.2,-0.857 V 53.4898 c 0,-0.4367 0.066,-0.7226 0.2,-0.8558 0.134,-0.134 0.419,-0.2012 0.857,-0.2012 h 2.114 c 0.437,0 0.729,0.0672 0.875,0.2012 0.145,0.1332 0.218,0.4191 0.218,0.8558 z m 0.716,21.5672 h -4.85 l -0.882,-1.764 h 4.85 l 0.882,1.764"          style="fill:#000000;fill-opacity:1;fill-rule:nonzero;stroke:none;stroke-width:0.1"          id="path34" />       <path          d="m 153.929,52.4328 h 6.597 v -2.6609 h -9.914 v 22.8179 h 9.659 v -2.6609 h -6.342 v -7.0348 h 5.249 V 60.234 h -5.249 v -7.8012"          style="fill:#000000;fill-opacity:1;fill-rule:nonzero;stroke:none;stroke-width:0.1"          id="path36" />       <path          d="m 169.675,53.4898 v 5.5774 c 0,0.4379 -0.066,0.7226 -0.2,0.8566 -0.134,0.1332 -0.419,0.2 -0.857,0.2 h -2.697 c -2.211,0 -3.317,1.0821 -3.317,3.2442 v 6.0148 c 0,2.1383 1.13,3.207 3.39,3.207 h 3.572 c 2.26,0 3.39,-1.0687 3.39,-3.207 v -3.3539 h -3.317 v 2.843 c 0,0.4383 -0.073,0.723 -0.219,0.857 -0.146,0.134 -0.437,0.2 -0.875,0.2 h -1.53 c -0.438,0 -0.73,-0.066 -0.875,-0.2 -0.146,-0.134 -0.219,-0.4187 -0.219,-0.857 v -5.066 c 0,-0.4379 0.073,-0.7231 0.219,-0.8571 0.145,-0.134 0.437,-0.2 0.875,-0.2 h 2.66 c 2.236,0 3.354,-1.0699 3.354,-3.2078 v -6.5609 c 0,-2.1379 -1.142,-3.2082 -3.427,-3.2082 h -3.535 c -2.26,0 -3.39,1.0703 -3.39,3.2082 v 3.3527 h 3.317 v -2.843 c 0,-0.4367 0.073,-0.7226 0.219,-0.8558 0.145,-0.134 0.437,-0.2012 0.874,-0.2012 h 1.531 c 0.438,0 0.723,0.0672 0.857,0.2012 0.134,0.1332 0.2,0.4191 0.2,0.8558"          style="fill:#000000;fill-opacity:1;fill-rule:nonzero;stroke:none;stroke-width:0.1"          id="path38" />     </g>   </g> </svg>',
                  fit: [60, 60],
                },
                {
                  svg: '<svg xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:cc="http://creativecommons.org/ns#" xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#" xmlns:svg="http://www.w3.org/2000/svg" xmlns="http://www.w3.org/2000/svg" xmlns:sodipodi="http://sodipodi.sourceforge.net/DTD/sodipodi-0.dtd" xmlns:inkscape="http://www.inkscape.org/namespaces/inkscape" width="176mm" height="176mm" viewBox="0 0 176 176" version="1.1" id="svg8" inkscape:version="0.92.4 (5da689c313, 2019-01-14)" sodipodi:docname="frame.svg"> <defs id="defs2" /> <sodipodi:namedview id="base" pagecolor="#ffffff" bordercolor="#666666" borderopacity="1.0" inkscape:pageopacity="0.0" inkscape:pageshadow="2" inkscape:zoom="0.5" inkscape:cx="-552.88697" inkscape:cy="349.09231" inkscape:document-units="mm" inkscape:current-layer="layer1" showgrid="false" inkscape:window-width="1920" inkscape:window-height="1012" inkscape:window-x="-8" inkscape:window-y="37" inkscape:window-maximized="1" /> <metadata id="metadata5"> <rdf:RDF> <cc:Work rdf:about=""> <dc:format>image/svg+xml</dc:format> <dc:type rdf:resource="http://purl.org/dc/dcmitype/StillImage" /> <dc:title></dc:title> </cc:Work> </rdf:RDF> </metadata> <g inkscape:label="Layer 1" inkscape:groupmode="layer" id="layer1" transform="translate(0,-121)"> <g id="g864" transform="translate(-28.877305,79.67757)"> <path inkscape:connector-curvature="0" id="rect821" d="M 28.877305,41.185902 V 217.32243 H 205.01436 V 41.185902 Z m 87.690775,2.344557 a 85.345885,85.345885 0 0 1 85.34569,85.345691 85.345885,85.345885 0 0 1 -85.34569,85.3457 85.345885,85.345885 0 0 1 -85.346214,-85.3457 85.345885,85.345885 0 0 1 85.346214,-85.345691 z" style="fill:#ffffff;fill-opacity:1;stroke:none;stroke-width:1.5;stroke-linecap:round;stroke-linejoin:round;stroke-miterlimit:4;stroke-dasharray:none;stroke-dashoffset:0;stroke-opacity:1" /> <circle r="85.345886" cy="129.25417" cx="116.94583" id="path823" style="fill:none;fill-opacity:1;stroke:#bfbfbf;stroke-width:3.16537809;stroke-linecap:round;stroke-linejoin:round;stroke-miterlimit:4;stroke-dasharray:none;stroke-dashoffset:0;stroke-opacity:1" /> </g> </g> </svg>',
                  fit: [62, 62],
                  relativePosition: { x: -61, y: -1 },
                },
              ],
            },
            {
              width: '*',
              text: 'Equipe de Suporte.\nNossos Consultores Técnicos não estão sozinhos, a G4 Construções proporciona uma estrutura administrativa em um ambiente colaborativo de profissionais que permite que o consultor foque no que realmente importa, você.',
              alignment: 'left',
              fontSize: 8,
            },
          ],
          pageBreak: invoice.team ? (invoice.team.length == 5 ? 'after' : 'none') : 'none',
          style: 'insideText',
        });
      }
    }

    // Body - Invoice Info
    pdf.add(pdf.ln(2));

    pdf.add({
      text:
        'Nesse arquivo voc' +
        (invoice.contactPlural ? 'ês' : 'ê') +
        ' encontrar' +
        (invoice.contactPlural ? 'ão' : 'á') +
        ' a descrição do serviço com as etapas do ' +
        invoice.invoiceType +
        ', os prazos, os valores e tudo o que foi pedido por voc' +
        (invoice.contactPlural ? 'ês' : 'ê') +
        ' no nosso primeiro contato.',
      alignment: 'center',
      style: 'insideText',
    });

    pdf.add(pdf.ln(1));

    pdf.add({
      canvas: [
        {
          type: 'line',
          x1: 0,
          y1: 5,
          x2: 595 - 2 * 30,
          y2: 5,
          lineWidth: 1,
          color: '#FF8800',
        },
      ],
      pageBreak: invoice.team ? (invoice.team.length == 3 || invoice.team.length == 4 ? 'before' : 'none') : 'none',
    });

    pdf.add(pdf.ln(1));

    pdf.add({
      columns: [
        {
          text: 'Contratante:',
          bold: true,
        },
        {
          text: invoice.code.slice(0, -3),
          color: '#FF8800',
          bold: true,
          alignment: 'right',
        },
      ],
      style: 'insideText',
    });

    pdf.add(pdf.ln(1));

    /* eslint-disable indent*/
    pdf.add({
      text: this.utils.idToProperty(
        invoice.contractor,
        this.contractorService.idToContractor.bind(this.contractorService),
        'fullName'
      ),
      style: 'insideText',
    });
    /* eslint-enable indent*/

    pdf.add(pdf.ln(1));

    pdf.add({
      text: 'Assunto:',
      bold: true,
      style: 'insideText',
    });

    pdf.add(pdf.ln(1));

    const subject = [];
    if (invoice.subject != undefined) {
      for (let t of invoice.subject.split('*')) {
        const bold = t.charAt(0) == '!';
        if (bold) t = t.slice(1);
        subject.push({
          text: t,
          bold: bold,
        });
      }
    }
    pdf.add({
      text: subject,
      style: 'insideText',
      alignment: 'justify',
      pageBreak: invoice.team ? (invoice.team.length > 2 ? 'none' : 'after') : 'after',
    });

    pdf.add({
      canvas: [
        {
          type: 'line',
          x1: 0,
          y1: 5,
          x2: 595 - 2 * 30,
          y2: 5,
          lineWidth: 1,
          color: '#FF8800',
        },
      ],
    });

    // Body - Invoice Info Early Stage - Page 2
    if (this.config.hasPreliminary || this.config.hasExecutive || this.config.hasComplementary) {
      pdf.add({
        text: 'Descrição do serviço:',
        bold: true,
        style: 'insideText',
      });
      if (this.config.hasPreliminary) {
        pdf.add(pdf.ln(1));

        const leapLength = invoice.laep ? invoice.laep.length : 0;
        /* eslint-disable indent*/
        const laep = invoice.laep
          ? invoice.laep.map((activity, index) => {
              return activity + (index == leapLength - 1 ? '.' : ';');
            })
          : [];
        /* eslint-enable indent*/
        pdf.add({
          style: 'insideText',
          table: {
            widths: ['*'],
            dontBreakRows: true,
            body: [
              [{ text: 'ETAPA PRELIMINAR', color: 'white', bold: true }],
              [
                {
                  text: invoice.peep ? (invoice.peep.length > 0 ? '(' + invoice.peep + ')' : '') : '',
                  color: 'white',
                  bold: true,
                  fontSize: 8,
                  alignment: 'justify',
                },
              ],
              [
                {
                  ul: laep,
                  color: 'white',
                  bold: true,
                  fontSize: 10,
                  alignment: 'justify',
                },
              ],
              [
                {
                  text: invoice.dep,
                  color: 'white',
                  bold: true,
                  alignment: 'justify',
                },
              ],
            ],
          },
          layout: this.noBorderTable('#FF8F07'),
        });
      }

      // Body - Invoice Info Mid Stage - Page 2
      if (this.config.hasExecutive) {
        pdf.add(pdf.ln(1));

        const laeeLength = invoice.laee ? invoice.laee.length : 0;
        /* eslint-disable indent*/
        const laee = invoice.laee
          ? invoice.laee.map((activity, index) => {
              return activity + (index == laeeLength - 1 ? '.' : ';');
            })
          : [];
        /* eslint-enable indent*/
        pdf.add({
          style: 'insideText',
          table: {
            widths: ['*'],
            dontBreakRows: true,
            body: [
              [{ text: 'ETAPA EXECUTIVA', color: 'white', bold: true }],
              [
                {
                  text: invoice.peee ? (invoice.peee?.length > 0 ? '(' + invoice.peee + ')' : '') : '',
                  color: 'white',
                  bold: true,
                  fontSize: 8,
                  alignment: 'justify',
                },
              ],
              [
                {
                  ul: laee,
                  color: 'white',
                  bold: true,
                  fontSize: 10,
                  alignment: 'justify',
                },
              ],
              [
                {
                  text: invoice.dee,
                  color: 'white',
                  bold: true,
                  alignment: 'justify',
                },
              ],
            ],
          },
          layout: this.noBorderTable('#FF8F07'),
        });
      }

      // Body - Invoice Info Final Stage - Page 2
      if (
        this.config.hasComplementary &&
        ((invoice.peec && invoice.peec?.length > 0) ||
          (invoice.laec && invoice.laec.length > 0) ||
          (invoice.dec && invoice.dec?.length > 0))
      ) {
        pdf.add(pdf.ln(1));

        const laecLength = invoice.laec ? invoice.laec.length : 0;
        /* eslint-disable indent*/
        const laec = invoice.laec
          ? invoice.laec.map((activity, index) => {
              return activity + (index == laecLength - 1 ? '.' : ';');
            })
          : [];
        /* eslint-enable indent*/
        pdf.add({
          style: 'insideText',
          table: {
            widths: ['*'],
            dontBreakRows: true,
            body: [
              [{ text: 'ETAPA COMPLEMENTAR', color: 'white', bold: true }],
              [
                {
                  text: invoice.peec ? (invoice.peec?.length > 0 ? '(' + invoice.peec + ')' : '') : '',
                  color: 'white',
                  bold: true,
                  fontSize: 8,
                  alignment: 'justify',
                },
              ],
              [
                {
                  ul: laec,
                  color: 'white',
                  bold: true,
                  fontSize: 10,
                  alignment: 'justify',
                },
              ],
              [
                {
                  text: invoice.dec,
                  color: 'white',
                  bold: true,
                  alignment: 'justify',
                },
              ],
            ],
          },
          layout: this.noBorderTable('#FF8F07'),
        });
      }
    }

    // Body - Invoice Values - Page 2
    pdf.add(pdf.ln(1));

    pdf.add({
      canvas: [
        {
          type: 'line',
          x1: 0,
          y1: 5,
          x2: 595 - 2 * 30,
          y2: 5,
          lineWidth: 1,
          color: '#FF8800',
        },
      ],
    });

    pdf.add(pdf.ln(1));

    pdf.add({
      text: 'Valores:',
      bold: true,
      style: 'insideText',
      pageBreak: invoice.valuesTablePageBreak ? 'before' : '',
    });

    pdf.add(pdf.ln(1));

    let extensoValue = extenso(invoice.value, { mode: 'currency' });
    if (extensoValue.split(' ')[0] == 'mil') extensoValue = 'um ' + extensoValue;
    pdf.add({
      style: 'insideText',
      table: {
        widths: ['*'],
        dontBreakRows: true,
        body: [
          [
            {
              text: [
                {
                  text: 'Após ler as etapas de execução proposta, conheça os produtos e nossa proposta de valor.',
                  bold: true,
                },
              ],
            },
          ],
        ],
      },
      layout: this.noBorderTable('#BFBFBF'),
    });

    const productHeader = () => {
      if (invoice.productListType == '1')
        return [
          {
            text: invoice.invoiceType.toUpperCase(),
            bold: true,
            alignment: 'center',
            border: [false, true, true, true],
          },
          {
            text: 'VALOR',
            bold: true,
            alignment: 'center',
            border: [true, true, false, true],
          },
        ];
      return [
        {
          text: invoice.invoiceType.toUpperCase(),
          bold: true,
          alignment: 'center',
          border: [false, true, true, true],
        },
        {
          text: 'QUANTIDADE',
          bold: true,
          alignment: 'center',
          border: [true, true, true, true],
        },
        {
          text: 'UNIDADE',
          bold: true,
          alignment: 'center',
          border: [true, true, true, true],
        },
        {
          text: 'VALOR',
          bold: true,
          alignment: 'center',
          border: [true, true, true, true],
        },
        {
          text: 'TOTAL',
          bold: true,
          alignment: 'center',
          border: [true, true, false, true],
        },
      ];
    };

    const products = invoice.products.map((product) => {
      const name: any[] = [
        {
          text: product.name,
          bold: true,
        },
      ];
      if (product.subproducts.length > 0)
        name.push({
          stack: product.subproducts.map((subproduct) => subproduct),
          alignment: 'left',
          fontSize: 9,
        });
      if (invoice.productListType == '1')
        return [
          {
            stack: name,
            alignment: 'left',
            border: [false, true, true, true],
          },
          {
            text: 'R$ ' + product.value,
            alignment: 'center',
            border: [true, true, false, true],
          },
        ];
      return [
        {
          stack: name,
          alignment: 'left',
          border: [false, true, true, true],
        },
        {
          text: product.amount,
          alignment: 'center',
          border: [true, true, true, true],
        },
        {
          text: product.unit,
          alignment: 'center',
          border: [true, true, true, true],
        },
        {
          text: product.value,
          alignment: 'center',
          border: [true, true, true, true],
        },
        {
          text: 'R$ ' + product.total,
          alignment: 'center',
          border: [true, true, false, true],
        },
      ];
    });
    // if (invoice.discount) products.push('Desconto: R$ ' + invoice.discount);
    const footer = () => {
      const result: any[] = [];
      if (invoice.discount && invoice.discount != '0,00') {
        const discount: any[] = [
          {
            text: 'DESCONTO',
            alignment: 'right',
            border: [false, true, true, true],
            colSpan: invoice.productListType == '1' ? 1 : 3,
            bold: true,
          },
          {
            text: 'R$ ' + invoice.discount,
            alignment: 'center',
            border: [true, true, false, true],
            bold: true,
          },
        ];
        if (invoice.productListType == '2') discount.splice(1, 0, ...[{}, {}, {}]);
        result.push(discount);
      }
      const total = this.stringUtil.numberToMoney(
        invoice.products.reduce(
          (accumulator: number, product: any) =>
            accumulator + this.stringUtil.moneyToNumber(invoice.productListType == '1' ? product.value : product.total),
          0
        ) - this.stringUtil.moneyToNumber(invoice.discount)
      );
      const extensoTotal = extenso(total, { mode: 'currency' });
      const productTotal: any[] = [
        {
          text: [
            {
              text: 'TOTAL:',
            },
            '  (' + extensoTotal + ')',
          ],
          alignment: 'right',
          border: [false, true, true, true],
          colSpan: invoice.productListType == '1' ? 1 : 3,
          bold: true,
        },
        {
          text: 'R$ ' + total,
          alignment: 'center',
          border: [true, true, false, true],
          bold: true,
        },
      ];
      if (invoice.productListType == '2') productTotal.splice(1, 0, ...[{}, {}, {}]);
      result.push(productTotal);
      return result;
    };

    pdf.add({
      style: 'insideText',
      table: {
        widths: invoice.productListType == '1' ? ['*', 50] : ['*', 'auto', 'auto', 'auto', 50],
        dontBreakRows: true,
        body: [productHeader(), ...products, ...footer()],
      },
      layout: this.noSideBorderTable('#BFBFBF', '#476471'),
    });

    pdf.add(pdf.ln(1));

    if (this.config.hasStageName) {
      pdf.add({
        text: 'Parcelamento de honorários pelas etapas do ' + invoice.invoiceType + ':',
        bold: true,
        style: 'insideText',
      });

      pdf.add(pdf.ln(1));

      const stages = invoice.stages.map((stage) => {
        return [
          {
            text: stage.name,
            alignment: 'center',
            border: [false, true, true, true],
          },
          {
            text: this.stringUtil.toPercentage(stage.value, invoice.value),
            alignment: 'center',
            border: [true, true, true, true],
          },
          {
            text: 'R$ ' + stage.value,
            alignment: 'center',
            border: [true, true, false, true],
          },
        ];
      });
      const total = this.stringUtil.numberToMoney(
        invoice.stages.reduce(
          (accumulator: number, stage: any) => accumulator + this.stringUtil.moneyToNumber(stage.value),
          0
        )
      );
      pdf.add({
        style: 'insideText',
        table: {
          widths: ['*', '*', '*'],
          dontBreakRows: true,
          body: [
            [
              {
                text: 'ETAPAS',
                bold: true,
                alignment: 'center',
                border: [false, true, true, true],
              },
              {
                text: 'PORCENTAGEM',
                bold: true,
                alignment: 'center',
                border: [true, true, true, true],
              },
              {
                text: 'VALOR',
                bold: true,
                alignment: 'center',
                border: [true, true, false, true],
              },
            ],
            ...stages,
            [
              {
                text: 'TOTAL',
                bold: true,
                alignment: 'center',
                border: [false, true, true, true],
              },
              {
                text: this.stringUtil.toPercentage(total, invoice.value),
                bold: true,
                alignment: 'center',
                border: [true, true, true, true],
              },
              {
                text: 'R$ ' + total,
                bold: true,
                alignment: 'center',
                border: [true, true, false, true],
              },
            ],
          ],
        },
        layout: this.noSideBorderTable('#BFBFBF', '#476471'),
      });
    }

    if (this.config.hasMaterialList && invoice.materials.length > 0) {
      const materials = invoice.materials.map((material) => {
        if (invoice.materialListType == '1')
          return [
            {
              text: material.name,
              bold: false,
              alignment: 'center',
              border: [false, true, true, true],
            },
            {
              text: material.amount,
              bold: false,
              alignment: 'center',
              border: [true, true, false, true],
            },
          ];
        return [
          {
            text: material.name,
            bold: false,
            alignment: 'center',
            border: [false, true, true, true],
          },
          {
            text: material.amount,
            bold: false,
            alignment: 'center',
            border: [true, true, true, true],
          },
          {
            text: material.value,
            bold: false,
            alignment: 'center',
            border: [true, true, true, true],
          },
          {
            text: 'R$ ' + material.total,
            bold: false,
            alignment: 'center',
            border: [true, true, false, true],
          },
        ];
      });
      const header = () => {
        if (invoice.materialListType == '1')
          return [
            {
              text: 'MATERIAL',
              bold: true,
              alignment: 'center',
              border: [false, true, true, true],
            },
            {
              text: 'QUANTIDADE',
              bold: true,
              alignment: 'center',
              border: [true, true, false, true],
            },
          ];
        return [
          {
            text: 'MATERIAL',
            bold: true,
            alignment: 'center',
            border: [false, true, true, true],
          },
          {
            text: 'QUANTIDADE',
            bold: true,
            alignment: 'center',
            border: [true, true, true, true],
          },
          {
            text: 'VALOR',
            bold: true,
            alignment: 'center',
            border: [true, true, true, true],
          },
          {
            text: 'TOTAL',
            bold: true,
            alignment: 'center',
            border: [true, true, false, true],
          },
        ];
      };
      const total = this.stringUtil.numberToMoney(
        invoice.materials.reduce(
          (accumulator: number, material: any) => accumulator + this.stringUtil.moneyToNumber(material.total),
          0
        )
      );
      if (invoice.materialListType == '2')
        materials.push([
          {
            text: '',
            bold: true,
            alignment: 'center',
            border: [false, true, true, true],
          },
          {
            text: '',
            bold: true,
            alignment: 'center',
            border: [true, true, true, true],
          },
          {
            text: 'TOTAL',
            bold: true,
            alignment: 'center',
            border: [true, true, true, true],
          },
          {
            text: 'R$ ' + total,
            bold: true,
            alignment: 'center',
            border: [true, true, false, true],
          },
        ]);
      // Body - Materials List - Page 3
      pdf.add(pdf.ln(1));

      pdf.add({
        text: 'Lista de materias:',
        bold: true,
        style: 'insideText',
      });

      pdf.add(pdf.ln(1));

      pdf.add({
        style: 'insideText',
        table: {
          widths: invoice.materialListType == '1' ? ['*', '*'] : ['*', '*', '*', '*'],
          dontBreakRows: true,
          body: [header(), ...materials],
        },
        layout: this.noSideBorderTable('#BFBFBF', '#476471'),
      });
    }

    if (this.config.hasImportants) {
      // Body - Importante Notes - Page 3
      pdf.add(pdf.ln(1));

      pdf.add({
        text: 'Importante:',
        bold: true,
        style: 'insideText',
      });

      pdf.add(pdf.ln(1));

      const importants = invoice.importants.map((important, index) => {
        return important + (index == invoice.importants.length - 1 ? '.' : ';');
      });
      pdf.add({
        style: 'insideText',
        table: {
          widths: ['*'],
          dontBreakRows: true,
          body: [
            [
              {
                ul: importants,
                color: 'white',
                bold: true,
                fontSize: 10,
              },
            ],
          ],
        },
        layout: this.noBorderTable('#FF8F07'),
      });
    }

    pdf.add(pdf.ln(2));

    pdf.add({
      text: 'Estamos disponíveis para negociação a qualquer momento, afim de que possamos fechar negócio e empreender juntos.',
      style: 'insideText',
    });

    pdf.add(pdf.ln(4));

    pdf.add({
      text: 'Maceió/Alagoas, ' + this.today + '.',
      style: 'insideText',
      alignment: 'center',
    });

    if (preview) {
      pdf.create().getDataUrl((dataURL: any) => {
        this.pdfData$.next(dataURL);
      });
    } else {
      if (openPdf) {
        pdf.create().open();
      } else pdf.create().download(invoice.code.replace(/\//g, '_').slice(0, -3) + '.pdf');
    }
  }
}
