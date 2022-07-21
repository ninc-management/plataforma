import { Injectable } from '@angular/core';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import extenso from 'extenso';
import { Img, PdfMakeWrapper } from 'pdfmake-wrapper';
import pdfMake from 'pdfmake/build/pdfmake';
import { ContentTable, ContextPageSize, TableCell } from 'pdfmake/interfaces';
import { Subject, take } from 'rxjs';

import { ConfigService } from 'app/shared/services/config.service';
import { ContractorService } from 'app/shared/services/contractor.service';
import { StringUtilService } from 'app/shared/services/string-util.service';
import { TeamService } from 'app/shared/services/team.service';
import { UserService } from 'app/shared/services/user.service';
import { idToProperty } from 'app/shared/utils';

import { Invoice } from '@models/invoice';
import { PlatformConfig } from '@models/platformConfig';
import { User } from '@models/user';

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

@Injectable({
  providedIn: 'root',
})
export class PdfService {
  today = format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
  pdfData$ = new Subject<string>();
  config = new PlatformConfig();

  NINCLogoSvg =
    '<svg viewBox="0 0 547.23 198.39" width="962" height="300"><path style="fill:#212322" d="M154.28 78.16h33.4v117.28h-33.4z"/><path d="M126.91 171.99c-5.29 0-7.72-2.93-7.72-9.53v-41.78c0-8.32 0-45.45-42.9-45.45-19.35 0-33.37 9.17-42.94 20.75h-1.94S31.3 77.53 29 75.23l-29 8v112.2h33.4V136.8c0-16.91 9.74-32.25 31.1-32.25s21.35 16.13 21.35 32.25v32.26c.2 9.76 2.44 29.32 27.52 29.32 19 0 29.39-8.37 29.39-8.37l-5-21.9a16 16 0 0 1-10.85 3.88z" style="fill:#212322"/><path d="M334.19 171.99c-5.29 0-7.72-2.93-7.72-9.53v-41.78c0-8.32 0-45.45-42.9-45.45-19.35 0-33.37 9.17-42.94 20.75h-1.94s-.1-18.45-2.41-20.79l-29.05 8v112.24h33.36V136.8c0-16.91 9.74-32.25 31.09-32.25s21.35 16.13 21.35 32.25v32.26c.21 9.76 2.45 29.32 27.53 29.32 19 0 29.39-8.37 29.39-8.37l-5-21.9a16 16 0 0 1-10.76 3.88z" style="fill:#212322"/><path d="M451.97 155.19s-8.54 13.88-32.23 13.88c-23.46 0-32-17.41-32-32.26 0-15.94 7.74-35.18 27.07-35.18 24.13 0 19.48 24.93 19.48 24.93l30.36-5.69c0-28.47-14.28-45.63-49.84-45.63-38.09 0-61.55 26.39-61.55 61.57s27.26 61.58 66.48 61.58c34.88 0 49.31-22.15 49.31-22.15z" style="fill:#212322"/><path d="M429.91 39.09V19.56A19.55 19.55 0 0 1 449.46 0h50.84a46.93 46.93 0 0 1 46.93 46.93v70.33h-39.09V39.09Z" style="fill:#1125a9"/></svg>';

  constructor(
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
        if (configs[0]) this.config = configs[0];
      });

    // Metadata definition
    pdf.info({
      title: 'Proposta de Orçamento Nortan Projetos',
      author: idToProperty(invoice.author, this.userService.idToUser.bind(this.userService), 'fullName'),
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
              color: '#79BA9E',
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
              color: '#E0E0E0',
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
      columns: [
        {
          svg: this.NINCLogoSvg,
          width: 200,
        },
      ] as any,
      margin: [5, 20, 5, 5],
    };

    if (this.config.invoiceConfig.hasHeader) {
      header.columns.push([
        {
          text: 'proposta de orçamento\n',
          fontSize: 14,
          alignment: 'right',
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
          alignment: 'right',
          color: '#052E41',
        },
      ]);
    }

    pdf.add(header);
    pdf.add({
      canvas: [
        {
          type: 'line',
          x1: 0,
          y1: 5,
          x2: 595 - 2 * 30,
          y2: 5,
          lineWidth: 1,
          color: '#79BA9E',
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
        'Nós da Nortan Engenharia nos importamos com a individualidade de cada cliente e os ajudamos entendendo as suas necessidades entregando soluções personalizadas. Por isso, ' +
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
                ? 'https://firebasestorage.googleapis.com/v0/b/plataforma-nortan.appspot.com/o/profileImages%2Fsupport_ninc.png?alt=media&token=45e1494a-95e4-40bb-ae37-7f391f7d7c79'
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
    if (this.config.invoiceConfig.hasTeam) {
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
                      ? 'https://firebasestorage.googleapis.com/v0/b/plataforma-nortan.appspot.com/o/profileImages%2Fsupport_ninc.png?alt=media&token=45e1494a-95e4-40bb-ae37-7f391f7d7c79'
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
      }

      // Body - Teams - Support
      pdf.add({
        columns: [
          {
            width: 70,
            columns: [
              await new Img(
                'https://firebasestorage.googleapis.com/v0/b/plataforma-nortan.appspot.com/o/profileImages%2Fsupport_ninc.png?alt=media&token=45e1494a-95e4-40bb-ae37-7f391f7d7c79'
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
            text: 'Equipe de Suporte.\nNossos Consultores Técnicos não estão sozinhos, a Nortan Engenharia proporciona uma estrutura administrativa em um ambiente colaborativo de profissionais que permite que o consultor foque no que realmente importa, você.',
            alignment: 'left',
            fontSize: 8,
          },
        ],
        style: 'insideText',
      });
    }

    // Body - Invoice Info
    pdf.add(pdf.ln(1));

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
          color: '#79BA9E',
        },
      ],
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
          color: '#79BA9E',
          bold: true,
          alignment: 'right',
        },
      ],
      style: 'insideText',
      pageBreak: invoice.hasPageBreak.contractor ? 'before' : '',
    });

    pdf.add(pdf.ln(1));

    /* eslint-disable indent*/
    pdf.add({
      text: idToProperty(
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
      pageBreak: invoice.hasPageBreak.subject ? 'before' : '',
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
    });

    pdf.add(pdf.ln(1));

    // Body - Invoice Info Early Stage - Page 2
    if (
      this.config.invoiceConfig.hasPreliminary ||
      this.config.invoiceConfig.hasExecutive ||
      this.config.invoiceConfig.hasComplementary
    ) {
      pdf.add({
        text: 'Descrição do serviço:',
        bold: true,
        style: 'insideText',
        pageBreak:
          invoice.hasPageBreak.preliminaryStage ||
          (!this.config.invoiceConfig.hasPreliminary && invoice.hasPageBreak.executiveStage) ||
          (!this.config.invoiceConfig.hasPreliminary &&
            !this.config.invoiceConfig.hasExecutive &&
            invoice.hasPageBreak.complementaryStage)
            ? 'before'
            : '', // ver se usa o preliminary ou os outros
      });
      if (this.config.invoiceConfig.hasPreliminary) {
        pdf.add(pdf.ln(1));

        const leapLength = invoice.laep ? invoice.laep.length : 0;
        /* eslint-disable indent*/
        const laep = invoice.laep
          ? invoice.laep.map((activity, index) => {
              return activity.isVisible ? activity.text + (index == leapLength - 1 ? '.' : ';') : '';
            })
          : [];
        /* eslint-enable indent*/
        pdf.add({
          style: 'insideText',
          table: {
            widths: ['*'],
            dontBreakRows: true,
            body: [
              [{ text: 'ETAPA PRELIMINAR' }],
              [
                {
                  text: invoice.peep ? (invoice.peep.length > 0 ? '(' + invoice.peep + ')' : '') : '',
                  fontSize: 8,
                  alignment: 'justify',
                },
              ],
              [
                {
                  ul: laep,
                  fontSize: 10,
                  alignment: 'justify',
                },
              ],
              [
                {
                  text: invoice.dep,
                  alignment: 'justify',
                },
              ],
            ],
          },
          layout: this.noBorderTable('#BCDCCE'),
        });
      }

      // Body - Invoice Info Mid Stage - Page 2
      if (this.config.invoiceConfig.hasExecutive) {
        pdf.add(pdf.ln(1));

        const laeeLength = invoice.laee ? invoice.laee.length : 0;
        /* eslint-disable indent*/
        const laee = invoice.laee
          ? invoice.laee.map((activity, index) => {
              return activity.isVisible ? activity.text + (index == laeeLength - 1 ? '.' : ';') : '';
            })
          : [];
        /* eslint-enable indent*/
        pdf.add({
          style: 'insideText',
          table: {
            widths: ['*'],
            dontBreakRows: true,
            body: [
              [{ text: 'ETAPA EXECUTIVA' }],
              [
                {
                  text: invoice.peee ? (invoice.peee?.length > 0 ? '(' + invoice.peee + ')' : '') : '',
                  fontSize: 8,
                  alignment: 'justify',
                },
              ],
              [
                {
                  ul: laee,
                  fontSize: 10,
                  alignment: 'justify',
                },
              ],
              [
                {
                  text: invoice.dee,
                  alignment: 'justify',
                },
              ],
            ],
          },
          layout: this.noBorderTable('#BCDCCE'),
          pageBreak: this.config.invoiceConfig.hasPreliminary && invoice.hasPageBreak.executiveStage ? 'before' : '',
        });
      }

      // Body - Invoice Info Final Stage - Page 2
      if (
        this.config.invoiceConfig.hasComplementary &&
        ((invoice.peec && invoice.peec?.length > 0) ||
          (invoice.laec && invoice.laec.length > 0) ||
          (invoice.dec && invoice.dec?.length > 0))
      ) {
        pdf.add(pdf.ln(1));

        const laecLength = invoice.laec ? invoice.laec.length : 0;
        /* eslint-disable indent*/
        const laec = invoice.laec
          ? invoice.laec.map((activity, index) => {
              return activity.isVisible ? activity.text + (index == laecLength - 1 ? '.' : ';') : '';
            })
          : [];
        /* eslint-enable indent*/
        pdf.add({
          style: 'insideText',
          table: {
            widths: ['*'],
            dontBreakRows: true,
            body: [
              [{ text: 'ETAPA COMPLEMENTAR' }],
              [
                {
                  text: invoice.peec ? (invoice.peec?.length > 0 ? '(' + invoice.peec + ')' : '') : '',
                  fontSize: 8,
                  alignment: 'justify',
                },
              ],
              [
                {
                  ul: laec,
                  fontSize: 10,
                  alignment: 'justify',
                },
              ],
              [
                {
                  text: invoice.dec,
                  alignment: 'justify',
                },
              ],
            ],
          },
          layout: this.noBorderTable('#BCDCCE'),
          pageBreak:
            (this.config.invoiceConfig.hasPreliminary || this.config.invoiceConfig.hasExecutive) &&
            invoice.hasPageBreak.complementaryStage
              ? 'before'
              : '',
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
          color: '#79BA9E',
        },
      ],
    });

    pdf.add(pdf.ln(1));

    pdf.add({
      text: 'Valores:',
      bold: true,
      style: 'insideText',
      pageBreak: invoice.hasPageBreak.valuesTable ? 'before' : '',
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
          text: 'VALOR UNITÁRIO',
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
          text: 'R$ ' + product.value,
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

    if (this.config.invoiceConfig.hasStageName) {
      pdf.add({
        text: 'Parcelamento de honorários pelas etapas do ' + invoice.invoiceType + ':',
        bold: true,
        style: 'insideText',
        pageBreak: invoice.hasPageBreak.stagesTable ? 'before' : '',
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

    if (this.config.invoiceConfig.hasMaterialList && invoice.materials.length > 0) {
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
        pageBreak: invoice.hasPageBreak.materialTable ? 'before' : '',
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

    if (this.config.invoiceConfig.hasImportants) {
      // Body - Importante Notes - Page 3
      pdf.add(pdf.ln(1));

      pdf.add({
        text: 'Importante:',
        bold: true,
        style: 'insideText',
        pageBreak: invoice.hasPageBreak.importants ? 'before' : '',
      });

      pdf.add(pdf.ln(1));

      const importants = invoice.importants.map((important, index) => {
        return important.isVisible ? important.text + (index == invoice.importants.length - 1 ? '.' : ';') : '';
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
                fontSize: 10,
              },
            ],
          ],
        },
        layout: this.noBorderTable('#82ADAD'),
      });
    }

    pdf.add(pdf.ln(2));

    pdf.add({
      text: 'Estamos disponíveis para negociação a qualquer momento, afim de que possamos fechar negócio e empreender juntos.',
      style: 'insideText',
    });

    pdf.add(pdf.ln(2));

    pdf.add({
      text: 'Maceió/Alagoas, ' + this.today + '.',
      style: 'insideText',
    });

    pdf.add(pdf.ln(2));

    pdf.add({
      text: [{ text: 'Nortan Engenharia', bold: true }, ', Solução Integrada em Projetos.'],
      style: 'insideText',
    });

    pdf.add({
      stack: [
        { text: 'Mais informações:', bold: true, color: '#79BA9E' },
        {
          text: author.professionalEmail + ' • ' + author.phone,
          fontSize: 10,
          bold: true,
        },
        {
          text: this.config.socialConfig.address,
          fontSize: 10,
          bold: true,
        },
        {
          text: this.config.socialConfig.cnpj ? 'CNPJ: ' + this.config.socialConfig.cnpj : '',
          fontSize: 10,
        },
      ],
      style: 'insideText',
      absolutePosition: { x: 250, y: 841.89 - 102 },
    });

    // QR code
    if (this.config.socialConfig.qrcodeURL)
      pdf.add({
        absolutePosition: { x: 190, y: 841.89 - 100 },
        qr: this.config.socialConfig.qrcodeURL,
        fit: '70',
        foreground: '#052E41',
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
