import { Injectable } from '@angular/core';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { PdfMakeWrapper, Img } from 'pdfmake-wrapper';
import { StringUtilService } from 'app/shared/services/string-util.service';
import { Subject } from 'rxjs';
import { UserService } from 'app/shared/services/user.service';
import { ContractorService } from 'app/shared/services/contractor.service';
import extenso from 'extenso';
import pdfMake from 'pdfmake/build/pdfmake';
import { ContentTable, TableCell, ContextPageSize } from 'pdfmake/interfaces';
import { Invoice } from '@models/invoice';
import { User } from '@models/user';
import { TeamService } from 'app/shared/services/team.service';

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

  constructor(
    private stringUtil: StringUtilService,
    private userService: UserService,
    private contractorService: ContractorService,
    private teamService: TeamService
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

  async generate(invoice: Invoice, preview = false, openPdf = false): Promise<void> {
    const pdf = new PdfMakeWrapper();

    // Metadata definition
    pdf.info({
      title: 'Proposta de Orçamento Nortan Projetos',
      author: this.userService.idToName(invoice.author),
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
    pdf.add({
      columns: [
        {
          svg: '<svg xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:cc="http://creativecommons.org/ns#" xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#" xmlns:svg="http://www.w3.org/2000/svg" xmlns="http://www.w3.org/2000/svg" xmlns:sodipodi="http://sodipodi.sourceforge.net/DTD/sodipodi-0.dtd" xmlns:inkscape="http://www.inkscape.org/namespaces/inkscape" viewBox="0 0 254.52909 58.472917" version="1.1" id="svg8" sodipodi:docname="logo.svg" width="962" height="221" inkscape:version="0.92.4 (5da689c313, 2019-01-14)"> <defs id="defs2"> <clipPath id="clipPath4534" clipPathUnits="userSpaceOnUse"> <path inkscape:connector-curvature="0" id="path4532" d="M 0,1000 H 1000 V 0 H 0 Z" /> </clipPath> <clipPath id="clipPath4785" clipPathUnits="userSpaceOnUse"> <path inkscape:connector-curvature="0" id="path4783" d="M 0,1000 H 1000 V 0 H 0 Z" /> </clipPath> <clipPath id="clipPath901" clipPathUnits="userSpaceOnUse"> <path inkscape:connector-curvature="0" id="path899" d="M 0,1080 H 1920 V 0 H 0 Z" /> </clipPath> <clipPath id="clipPath1073" clipPathUnits="userSpaceOnUse"> <path inkscape:connector-curvature="0" id="path1071" d="M 0,1080 H 1920 V 0 H 0 Z" /> </clipPath> <clipPath id="clipPath1097" clipPathUnits="userSpaceOnUse"> <path inkscape:connector-curvature="0" id="path1095" d="M 0,1080 H 1920 V 0 H 0 Z" /> </clipPath> </defs> <sodipodi:namedview id="base" pagecolor="#ffffff" bordercolor="#666666" borderopacity="1.0" inkscape:pageopacity="0.0" inkscape:pageshadow="2" inkscape:zoom="0.90509668" inkscape:cx="255.28546" inkscape:cy="38.377045" inkscape:document-units="mm" inkscape:current-layer="g2129" showgrid="false" fit-margin-top="0" fit-margin-left="0" fit-margin-right="0" fit-margin-bottom="0" inkscape:window-width="1920" inkscape:window-height="1012" inkscape:window-x="-8" inkscape:window-y="37" inkscape:window-maximized="1" /> <metadata id="metadata5"> <rdf:rdf> <cc:work rdf:about=""> <dc:format>image/svg+xml</dc:format> <dc:type rdf:resource="http://purl.org/dc/dcmitype/StillImage" /> <dc:title /> </cc:work> </rdf:rdf> <rdf:RDF> <cc:Work rdf:about=""> <dc:format>image/svg+xml</dc:format> <dc:type rdf:resource="http://purl.org/dc/dcmitype/StillImage" /> <dc:title></dc:title> </cc:Work> </rdf:RDF> </metadata> <g inkscape:label="Layer 1" inkscape:groupmode="layer" id="layer1" transform="translate(-12.097486,-29.430537)"> <g id="g2129" transform="matrix(0.51846912,0,0,0.51846912,185.82106,25.793009)"> <g id="g2155" transform="matrix(0.4125963,0,0,0.41361208,-197.80175,0.55721242)"> <g id="g903" transform="matrix(1.3333333,0,0,-1.3333333,-48.194534,36.9971)"> <path d="m 0,0 123.065,-130.951 v 84.115 c 0,6.769 -0.08,12.683 -0.239,17.742 -0.16,5.058 -0.399,9.439 -0.717,13.143 -0.319,3.704 -0.698,6.79 -1.134,9.26 -0.44,2.468 -0.897,4.54 -1.374,6.213 V 0 h 21.267 v -0.478 c -0.478,-1.673 -0.917,-3.745 -1.315,-6.213 -0.399,-2.47 -0.758,-5.556 -1.075,-9.26 -0.319,-3.704 -0.558,-8.085 -0.717,-13.143 -0.16,-5.059 -0.239,-10.973 -0.239,-17.742 V -173.725 H 133.34 L 10.275,-42.894 v -81.724 c 0,-6.772 0.079,-12.686 0.24,-17.743 0.158,-5.059 0.397,-9.42 0.716,-13.083 0.318,-3.665 0.675,-6.732 1.076,-9.2 0.397,-2.47 0.836,-4.541 1.314,-6.213 v -0.478 H -7.647 v 0.478 c 0.478,1.672 0.936,3.743 1.375,6.213 0.436,2.468 0.815,5.535 1.134,9.2 0.318,3.663 0.557,8.024 0.717,13.083 0.158,5.057 0.239,10.971 0.239,17.743 v 77.782 c 0,6.769 -0.081,12.683 -0.239,17.742 -0.16,5.058 -0.399,9.439 -0.717,13.143 -0.319,3.704 -0.698,6.79 -1.134,9.26 -0.439,2.468 -0.897,4.54 -1.375,6.213 V 0 Z" style="fill:#002f41;fill-opacity:1;fill-rule:nonzero;stroke:none" id="path905" inkscape:connector-curvature="0" /> </g> <g id="g907" transform="matrix(1.3333333,0,0,-1.3333333,246.62839,256.68243)"> <path d="m 0,0 c 5.654,0 10.852,1.115 15.592,3.345 4.738,2.23 8.82,5.456 12.247,9.678 3.424,4.222 6.093,9.359 8.005,15.414 1.911,6.052 2.867,12.904 2.867,20.55 0,8.603 -0.917,16.587 -2.748,23.956 -1.833,7.367 -4.561,13.74 -8.185,19.117 -3.625,5.377 -8.183,9.577 -13.68,12.605 -5.495,3.026 -11.91,4.541 -19.237,4.541 -5.656,0 -10.833,-1.096 -15.532,-3.286 -4.7,-2.192 -8.781,-5.358 -12.246,-9.499 -3.466,-4.143 -6.153,-9.221 -8.065,-15.234 -1.912,-6.015 -2.868,-12.844 -2.868,-20.491 0,-8.602 0.936,-16.608 2.808,-24.015 1.87,-7.408 4.639,-13.841 8.304,-19.296 3.662,-5.458 8.223,-9.719 13.68,-12.785 C -13.603,1.533 -7.249,0 0,0 m -67.746,54.842 c 0,9 1.673,17.343 5.018,25.031 3.345,7.686 7.946,14.356 13.8,20.013 5.855,5.655 12.764,10.075 20.73,13.262 7.964,3.185 16.528,4.779 25.688,4.779 9,0 17.463,-1.493 25.39,-4.48 7.925,-2.987 14.834,-7.228 20.73,-12.725 5.893,-5.496 10.533,-12.187 13.919,-20.072 3.385,-7.886 5.078,-16.728 5.078,-26.525 0,-8.205 -1.434,-16.091 -4.301,-23.657 C 55.438,22.899 51.215,16.208 45.641,10.395 40.064,4.58 33.233,-0.06 25.15,-3.524 17.064,-6.99 7.766,-8.722 -2.748,-8.722 c -8.922,0 -17.325,1.475 -25.211,4.421 -7.886,2.946 -14.776,7.169 -20.671,12.665 -5.894,5.496 -10.555,12.166 -13.978,20.013 -3.426,7.844 -5.138,16.667 -5.138,26.465" style="fill:#002f41;fill-opacity:1;fill-rule:nonzero;stroke:none" id="path909" inkscape:connector-curvature="0" /> </g> <g id="g911" transform="matrix(1.3333333,0,0,-1.3333333,349.80292,164.6023)"> <path d="m 0,0 c 0,6.769 -0.101,12.684 -0.299,17.743 -0.2,5.057 -0.438,9.418 -0.717,13.083 -0.28,3.663 -0.638,6.73 -1.075,9.2 -0.438,2.468 -0.896,4.54 -1.374,6.213 v 0.478 h 27.601 v -0.478 c -0.64,-1.833 -1.177,-4.062 -1.614,-6.691 -0.439,-2.629 -0.777,-6.015 -1.015,-10.156 2.945,2.468 6.013,4.899 9.199,7.288 3.185,2.39 6.452,4.5 9.798,6.333 3.345,1.831 6.75,3.304 10.215,4.421 3.465,1.114 6.949,1.672 10.455,1.672 2.15,0 4.021,-0.1 5.615,-0.298 1.593,-0.2 3.027,-0.478 4.302,-0.837 1.273,-0.358 2.429,-0.758 3.465,-1.194 1.034,-0.439 2.031,-0.857 2.986,-1.255 l -5.854,-22.821 -2.032,0.478 c -0.956,3.504 -2.748,6.312 -5.376,8.424 -2.629,2.109 -6.214,3.166 -10.754,3.166 -2.468,0 -5.058,-0.439 -7.765,-1.314 C 43.052,32.577 40.305,31.364 37.517,29.81 34.727,28.257 31.94,26.465 29.153,24.434 26.364,22.403 23.657,20.271 21.028,18.042 20.868,15.73 20.79,13.221 20.79,10.514 V 1.912 -28.915 c 0,-6.771 0.078,-12.685 0.238,-17.742 0.159,-5.06 0.399,-9.421 0.717,-13.083 0.317,-3.665 0.676,-6.732 1.075,-9.2 0.399,-2.47 0.837,-4.541 1.316,-6.214 v -0.477 H -3.465 v 0.477 c 0.478,1.673 0.936,3.744 1.374,6.214 0.437,2.468 0.795,5.535 1.075,9.2 0.279,3.662 0.517,8.023 0.717,13.083 C -0.101,-41.6 0,-35.686 0,-28.915 Z" style="fill:#002f41;fill-opacity:1;fill-rule:nonzero;stroke:none" id="path913" inkscape:connector-curvature="0" /> </g> <g id="g915" transform="matrix(1.3333333,0,0,-1.3333333,658.32505,172.0899)"> <path d="m 0,0 c -7.249,-0.08 -14.218,-0.498 -20.909,-1.255 -6.691,-0.757 -12.606,-2.329 -17.742,-4.719 -5.138,-2.39 -9.243,-5.795 -12.307,-10.216 -3.068,-4.421 -4.6,-10.296 -4.6,-17.623 0,-9.4 2.348,-16.569 7.049,-21.507 4.699,-4.939 11.19,-7.407 19.475,-7.407 3.824,0 7.307,0.537 10.455,1.613 3.146,1.075 5.933,2.428 8.363,4.062 2.429,1.632 4.481,3.424 6.154,5.376 1.672,1.951 2.946,3.843 3.824,5.676 C -0.08,-42.974 0,-39.608 0,-35.904 v 12.605 z m -79.216,-34.769 c 0,6.292 1.294,11.748 3.884,16.369 2.588,4.619 6.033,8.561 10.335,11.829 4.301,3.265 9.199,5.914 14.696,7.945 5.496,2.031 11.19,3.624 17.086,4.779 5.893,1.154 11.709,1.951 17.444,2.39 C -10.036,8.98 -4.778,9.239 0,9.32 v 6.093 c 0,5.257 -0.678,9.797 -2.03,13.621 -1.357,3.823 -3.268,6.989 -5.737,9.498 -2.469,2.51 -5.435,4.38 -8.901,5.616 -3.465,1.234 -7.269,1.852 -11.41,1.852 -2.867,0 -5.695,-0.239 -8.483,-0.717 -2.789,-0.478 -5.675,-1.275 -8.663,-2.389 -2.986,-1.117 -6.134,-2.629 -9.438,-4.541 -3.307,-1.911 -6.87,-4.342 -10.693,-7.288 l -1.196,0.717 8.124,16.847 c 2.629,1.194 5.217,2.169 7.767,2.927 2.549,0.756 5.139,1.374 7.766,1.852 2.629,0.478 5.318,0.816 8.066,1.015 2.748,0.198 5.634,0.299 8.662,0.299 8.363,0 15.512,-1.015 21.447,-3.046 5.932,-2.032 10.792,-4.821 14.576,-8.364 3.783,-3.546 6.551,-7.688 8.304,-12.426 1.751,-4.74 2.629,-9.818 2.629,-15.234 v -38.951 c 0,-6.771 0.099,-12.685 0.299,-17.743 0.197,-5.059 0.436,-9.42 0.716,-13.083 0.279,-3.665 0.636,-6.732 1.076,-9.2 0.436,-2.47 0.896,-4.54 1.374,-6.213 v -0.478 H -2.151 v 0.478 c 0.398,1.273 0.697,2.707 0.896,4.301 0.198,1.593 0.378,3.505 0.538,5.736 -1.673,-1.434 -3.644,-2.909 -5.915,-4.421 -2.269,-1.514 -4.858,-2.888 -7.765,-4.122 -2.909,-1.236 -6.135,-2.229 -9.678,-2.987 -3.545,-0.756 -7.428,-1.136 -11.65,-1.136 -13.86,0 -24.574,3.245 -32.139,9.738 -7.569,6.491 -11.352,15.712 -11.352,27.66" style="fill:#002f41;fill-opacity:1;fill-rule:nonzero;stroke:none" id="path917" inkscape:connector-curvature="0" /> </g> <g id="g919" transform="matrix(1.3333333,0,0,-1.3333333,823.26904,158.0707)"> <path d="m 0,0 c 0,10.514 -2.111,18.239 -6.333,23.179 -4.222,4.938 -9.877,7.408 -16.966,7.408 -2.55,0 -5.418,-0.538 -8.601,-1.613 -3.188,-1.075 -6.454,-2.509 -9.798,-4.301 -3.346,-1.793 -6.692,-3.883 -10.036,-6.273 -3.346,-2.39 -6.495,-4.94 -9.44,-7.647 l -0.238,-15.652 v -28.914 c 0,-6.771 0.078,-12.686 0.238,-17.743 0.158,-5.059 0.398,-9.42 0.717,-13.083 0.317,-3.665 0.676,-6.732 1.075,-9.2 0.398,-2.47 0.837,-4.54 1.315,-6.213 v -0.478 h -27.601 v 0.478 c 0.479,1.673 0.937,3.743 1.375,6.213 0.437,2.468 0.795,5.535 1.074,9.2 0.28,3.663 0.518,8.024 0.718,13.083 0.197,5.057 0.298,10.972 0.298,17.743 v 28.914 c 0,6.77 -0.101,12.684 -0.298,17.743 -0.2,5.058 -0.438,9.418 -0.718,13.083 -0.279,3.663 -0.637,6.73 -1.074,9.2 -0.438,2.468 -0.896,4.54 -1.375,6.213 v 0.478 h 27.601 V 41.34 c -0.639,-1.992 -1.135,-4.521 -1.494,-7.587 -0.359,-3.067 -0.737,-7.07 -1.135,-12.008 3.265,2.707 6.79,5.416 10.574,8.125 3.783,2.707 7.707,5.117 11.768,7.229 4.063,2.109 8.205,3.823 12.426,5.137 4.222,1.315 8.365,1.972 12.426,1.972 6.214,0 11.489,-1.076 15.832,-3.226 4.341,-2.151 7.886,-4.979 10.634,-8.483 2.748,-3.506 4.737,-7.509 5.974,-12.008 C 20.172,15.99 20.79,11.429 20.79,6.81 v -40.623 c 0,-6.771 0.078,-12.686 0.238,-17.743 0.159,-5.059 0.399,-9.42 0.718,-13.083 0.316,-3.665 0.676,-6.732 1.075,-9.2 0.398,-2.47 0.836,-4.54 1.315,-6.213 v -0.478 h -27.6 v 0.478 c 0.477,1.673 0.935,3.743 1.373,6.213 0.438,2.468 0.795,5.535 1.075,9.2 0.279,3.663 0.518,8.024 0.717,13.083 C -0.102,-46.499 0,-40.584 0,-33.813 Z" style="fill:#002f41;fill-opacity:1;fill-rule:nonzero;stroke:none" id="path921" inkscape:connector-curvature="0" /> </g> <g id="g923" transform="matrix(1.3333333,0,0,-1.3333333,519.40839,256.04496)"> <path d="m 0,0 c -2.311,0 -4.561,0.318 -6.75,0.956 -2.192,0.637 -4.143,1.831 -5.854,3.584 -1.714,1.751 -3.107,4.162 -4.182,7.229 -1.076,3.065 -1.613,7.068 -1.613,12.008 v 82.202 c 5.257,-0.08 10.353,-0.16 15.294,-0.239 4.937,-0.08 9.318,-0.199 13.142,-0.358 4.46,-0.161 8.722,-0.28 12.784,-0.359 l 2.151,12.187 c -0.878,-0.16 -2.689,-0.339 -5.437,-0.537 -2.748,-0.2 -6.094,-0.4 -10.036,-0.598 -3.942,-0.199 -8.324,-0.358 -13.143,-0.478 -4.82,-0.119 -9.738,-0.22 -14.755,-0.298 0.078,5.735 0.218,10.772 0.418,15.114 0.198,4.341 0.437,8.104 0.716,11.291 0.279,3.185 0.617,5.894 1.016,8.125 0.398,2.229 0.837,4.101 1.315,5.615 v 0.478 h -27.6 v -0.478 c 0.397,-1.514 0.795,-3.386 1.194,-5.615 0.399,-2.231 0.736,-4.959 1.016,-8.185 0.279,-3.226 0.517,-7.01 0.717,-11.35 0.198,-4.343 0.418,-14.995 0.418,-14.995 v -9.32 -79.693 c 0,-12.267 2.966,-21.288 8.901,-27.063 5.934,-5.776 14.236,-8.662 24.912,-8.662 1.426,0 2.772,0.036 4.048,0.106 L 3.245,0.276 C 2.168,0.095 1.086,0 0,0" style="fill:#002f41;fill-opacity:1;fill-rule:nonzero;stroke:none" id="path925" inkscape:connector-curvature="0" /> </g> <g id="g927" transform="matrix(1.3333333,0,0,-1.3333333,517.63759,268.48896)"> <path d="M 0,0 -0.051,-0.106" style="fill:#002f41;fill-opacity:1;fill-rule:nonzero;stroke:none" id="path929" inkscape:connector-curvature="0" /> </g> <g id="g931" transform="matrix(1.3333333,0,0,-1.3333333,523.73519,255.67749)"> <path d="M 0,0 -4.573,-9.609" style="fill:#002f41;fill-opacity:1;fill-rule:nonzero;stroke:none" id="path933" inkscape:connector-curvature="0" /> </g> <g id="g935" transform="matrix(1.3333333,0,0,-1.3333333,-186.07466,96.900432)"> <path d="m 0,0 -41.396,62.095 -40.243,-120.73 c 0.576,-1.844 1.238,-3.666 1.996,-5.459 3.027,-7.155 7.361,-13.583 12.883,-19.105 2.537,-2.538 5.269,-4.821 8.171,-6.846 L -33,-13.256 -13.932,-41.853 Z" style="fill:#085c5c;fill-opacity:1;fill-rule:nonzero;stroke:none" id="path937" inkscape:connector-curvature="0" /> </g> <g id="g939" transform="matrix(1.3333333,0,0,-1.3333333,-144.58386,119.98216)"> <path d="m 0,0 c -3.026,7.156 -7.361,13.584 -12.884,19.106 -2.542,2.542 -5.278,4.83 -8.187,6.857 l -25.569,-76.777 -19.067,28.6 -13.975,-41.826 41.433,-62.148 L 1.988,-5.42 C 1.414,-3.589 0.753,-1.781 0,0" style="fill:#7ab99d;fill-opacity:1;fill-rule:nonzero;stroke:none" id="path941" inkscape:connector-curvature="0" /> </g> <g id="g943" transform="matrix(1.3333333,0,0,-1.3333333,-266.4132,228.93856)"> <path d="M 0,0 -13.801,-11.378 -7.586,5.431 C -22.826,18 -32.541,37.029 -32.541,58.326 c 0,13.179 3.724,25.487 10.171,35.935 l -11.36,13.838 16.798,-6.23 c 3.78,4.588 8.144,8.674 12.978,12.148 l 7.93,23.789 c -31.453,-12.681 -53.65,-43.487 -53.65,-79.48 0,-46.502 37.053,-84.349 83.245,-85.63 L 21.087,-8.576 C 13.51,-6.895 6.404,-3.96 0,0" style="fill:#002f41;fill-opacity:1;fill-rule:nonzero;stroke:none" id="path945" inkscape:connector-curvature="0" /> </g> <g id="g947" transform="matrix(1.3333333,0,0,-1.3333333,-215.20093,36.9971)"> <path d="m 0,0 12.485,-18.727 c 7.575,-1.682 14.678,-4.614 21.081,-8.573 l 13.799,11.377 -6.19,-16.8 -0.262,0.186 c 15.38,-12.568 25.2,-31.682 25.2,-53.093 0,-13.179 -3.723,-25.487 -10.171,-35.935 l 11.361,-13.838 -16.8,6.23 v 0 c -3.781,-4.59 -8.149,-8.679 -12.986,-12.155 l -7.925,-23.784 c 31.454,12.68 53.654,43.488 53.654,79.482 C 83.246,-39.128 46.192,-1.281 0,0" style="fill:#002f41;fill-opacity:1;fill-rule:nonzero;stroke:none" id="path949" inkscape:connector-curvature="0" /> </g> </g> </g> </g> </svg>',
          width: 200,
        },
        [
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
        ],
      ],
      margin: [5, 20, 5, 5],
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
    }

    // Body - Teams - Support
    pdf.add({
      columns: [
        {
          width: 70,
          columns: [
            await new Img(
              'https://firebasestorage.googleapis.com/v0/b/plataforma-nortan.appspot.com/o/profileImages%2Fsupport.png?alt=media&token=1d319acb-b655-457c-81dd-62a22d9ae836'
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
      pageBreak: invoice.team ? (invoice.team.length == 5 ? 'after' : 'none') : 'none',
      style: 'insideText',
    });

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
          color: '#79BA9E',
          bold: true,
          alignment: 'right',
        },
      ],
      style: 'insideText',
    });

    pdf.add(pdf.ln(1));

    /* eslint-disable indent*/
    pdf.add({
      text:
        invoice.contractorFullName != undefined
          ? invoice.contractorFullName
          : invoice.contractor
          ? this.contractorService.idToName(invoice.contractor)
          : '',
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

    // Body - Invoice Info Early Stage - Page 2
    pdf.add({
      text: 'Descrição do serviço:',
      bold: true,
      style: 'insideText',
    });

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

    // Body - Invoice Info Mid Stage - Page 2
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
    });

    // Body - Invoice Info Final Stage - Page 2
    if (
      (invoice.peec && invoice.peec?.length > 0) ||
      (invoice.laec && invoice.laec.length > 0) ||
      (invoice.dec && invoice.dec?.length > 0)
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
      });
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
                  text: 'VALOR DO ' + invoice.invoiceType.toUpperCase() + ': R$ ' + invoice.value,
                  bold: true,
                },
                '  (' + extensoValue + ')',
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
            fontSize: 8,
          },
          {
            text: 'VALOR',
            bold: true,
            alignment: 'center',
            border: [true, true, false, true],
            fontSize: 8,
          },
        ];
      return [
        {
          text: invoice.invoiceType.toUpperCase(),
          bold: true,
          alignment: 'center',
          border: [false, true, true, true],
          fontSize: 8,
        },
        {
          text: 'QUANTIDADE',
          bold: true,
          alignment: 'center',
          border: [true, true, true, true],
          fontSize: 8,
        },
        {
          text: 'UNIDADE',
          bold: true,
          alignment: 'center',
          border: [true, true, true, true],
          fontSize: 8,
        },
        {
          text: 'VALOR',
          bold: true,
          alignment: 'center',
          border: [true, true, true, true],
          fontSize: 8,
        },
        {
          text: 'TOTAL',
          bold: true,
          alignment: 'center',
          border: [true, true, false, true],
          fontSize: 8,
        },
      ];
    };

    const products = invoice.products.map((product) => {
      const name: any[] = [
        {
          fontSize: 8,
          text: product.name,
        },
      ];
      if (product.subproducts.length > 0)
        name.push({
          stack: product.subproducts.map((subproduct) => subproduct),
          alignment: 'left',
          fontSize: 6,
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
            fontSize: 8,
          },
        ];
      return [
        {
          stack: name,
          alignment: 'left',
          border: [false, true, true, true],
          fontSize: 8,
        },
        {
          text: product.amount,
          alignment: 'center',
          border: [true, true, true, true],
          fontSize: 8,
        },
        {
          text: product.unit,
          alignment: 'center',
          border: [true, true, true, true],
          fontSize: 8,
        },
        {
          text: product.value,
          alignment: 'center',
          border: [true, true, true, true],
          fontSize: 8,
        },
        {
          text: 'R$ ' + product.total,
          alignment: 'center',
          border: [true, true, false, true],
          fontSize: 8,
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
            fontSize: 8,
            bold: true,
          },
          {
            text: 'R$ ' + invoice.discount,
            alignment: 'center',
            border: [true, true, false, true],
            fontSize: 8,
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
      const productTotal: any[] = [
        {
          text: 'TOTAL',
          alignment: 'right',
          border: [false, true, true, true],
          colSpan: invoice.productListType == '1' ? 1 : 3,
          fontSize: 8,
          bold: true,
        },
        {
          text: 'R$ ' + total,
          alignment: 'center',
          border: [true, true, false, true],
          fontSize: 8,
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

    pdf.add({
      style: 'insideText',
      table: {
        widths: ['*'],
        dontBreakRows: true,
        body: [
          [
            {
              text: 'PARCELAMENTO DE HONORÁRIOS PELAS ETAPAS DO ' + invoice.invoiceType.toUpperCase() + ':',
              bold: true,
            },
          ],
        ],
      },
      layout: this.noBorderTable('#BFBFBF'),
    });

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

    if (invoice.materials.length > 0) {
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
              fontSize: 10,
            },
          ],
        ],
      },
      layout: this.noBorderTable('#82ADAD'),
    });

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
      pageBreak: 'after',
    });

    pdf.add({
      stack: [
        { text: 'Mais informações:', bold: true, color: '#79BA9E' },
        {
          text: author.emailNortan + ' • ' + author.phone,
          fontSize: 10,
          bold: true,
        },
        {
          text: 'Av. Comendador Gustavo Paiva, 2789, Sala 28, Mezanino, Norcon Empresarial. Mangabeiras. Maceió-AL. CEP 57037-532.',
          fontSize: 10,
          bold: true,
        },
        {
          text: 'CNPJ: 35.571.700/0001-10',
          fontSize: 10,
        },
      ],
      style: 'insideText',
      absolutePosition: { x: 250, y: 841.89 - 102 },
    });

    // Nortan symbol
    pdf.add({
      svg: '<svg xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:cc="http://creativecommons.org/ns#" xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#" xmlns:svg="http://www.w3.org/2000/svg" xmlns="http://www.w3.org/2000/svg" id="svg851" version="1.1" viewBox="0 0 77.694969 88.261543" height="88.261543mm" width="77.694969mm"> <defs id="defs845" /> <g transform="translate(7.1704346e-8,-3.3160678e-6)" id="layer1"> <g transform="matrix(0.79657927,0,0,0.79657927,14.123673,-317.86634)" id="g921"> <path id="path913" d="M -6.9679679,508.16648 C -6.8457109,507.74876 1.99182,481.2244 2.13823,481.2244 c 0.0867,0 3.58706,5.12254 7.77868,11.38341 4.19162,6.26089 7.65074,11.35081 7.68695,11.31094 0.0362,-0.0399 4.67002,-13.88373 10.29736,-30.76414 5.62733,-16.88042 10.322,-30.78357 10.43261,-30.89591 0.2784,-0.28273 3.42394,2.14479 6.08283,4.69433 5.13291,4.9218 9.32186,11.28845 11.76718,17.88453 l 0.93825,2.53087 -7.06884,21.14934 -7.142225,21.29613 -25.167022,0.01 c -13.8580102,0.0371 -22.8251741,-0.002 -25.1963802,-0.002 z" style="fill:#78bea0;fill-opacity:0.2;stroke-width:0.26458335" /> <path id="path911" d="m -17.72709,475.84908 v -33.95033 l 7.13658,-21.38451 c 3.92512,-11.76148 7.17725,-21.42518 7.22696,-21.47489 0.0497,-0.0497 7.60761,11.18855 16.79535,24.9739 l 16.70498,25.06428 -5.59461,16.7349 c -3.07704,9.20419 -5.66086,16.73154 -5.74183,16.72744 -0.081,-0.004 -3.51088,-5.06426 -7.62202,-11.24479 -4.11114,-6.18054 -7.5766,-11.23734 -7.70102,-11.23734 -0.12441,0 -3.96403,11.19188 -8.53249,24.87083 l -8.30627,24.89652 h -2.215838 l -2.146122,0.004 z" style="fill:#0f5a5f;fill-opacity:0.2;stroke-width:0.26458335" /> <path id="path909" d="m 58.903158,509.82422 c 0.448762,-0.92673 0.811382,-1.71375 1.682172,-3.47742 1.89309,-3.83422 2.66359,-5.90391 3.84319,-10.32342 1.35084,-5.06109 1.76267,-8.36754 1.7609,-14.13751 -0.002,-5.61475 -0.36511,-8.65206 -1.59995,-13.3728 -2.75522,-10.53309 -7.22283,-18.30827 -14.98066,-26.0715 l -3.555869,-3.46097 1.371233,-3.72031 c 0.77202,-2.17105 1.240485,-3.59095 1.437485,-4.02751 0.197,-0.43656 0.899742,-2.44077 1.244482,-3.42304 0.34474,-0.98226 0.7052,-2.04543 0.80104,-2.04543 0.30793,0 2.970329,2.10761 5.694429,4.49787 6.75064,5.92333 12.88416,14.08222 16.62159,22.11027 1.82954,3.92988 2.62691,6.07236 3.91441,10.51773 2.97549,10.27355 3.47969,21.82965 1.42331,32.62173 -0.58042,3.04611 -2.75577,10.19953 -3.88218,12.76615 l -0.740328,1.54211 h -7.203479 c -4.12747,0 -5.814591,0.0215 -7.831774,0.006 z M 35.58646,432.38326 c -2.62908,-1.37257 -4.93284,-2.32653 -7.9375,-3.28681 -2.32834,-0.74413 -4.43952,-1.43437 -4.69153,-1.53386 -0.252,-0.0995 -2.60541,-3.39558 -5.22979,-7.32464 l -4.77159,-7.14375 1.37383,-0.0816 c 1.66999,-0.0992 7.37488,0.57362 10.80553,1.27433 3.81352,0.77892 10.44451,3.00256 14.35783,4.81476 3.4391,1.5926 10.797005,5.92589 11.381505,6.63018 -1.904307,1.51755 -1.42175,1.0004 -4.42619,3.49763 -5.02272,4.17477 -6.318427,5.43101 -6.617887,5.38511 -0.13646,-0.0209 -2.206918,-1.16774 -4.244208,-2.23136 z m -53.316865,-11.50474 c 0.0045,-2.04289 0.01391,-1.67436 0.0016,-2.41416 0.4137,-0.21353 1.550224,-0.6026 2.702608,-1.05573 -0.751298,2.18451 -0.80546,2.26602 -1.249267,3.54489 l -1.452428,3.82799 z" style="fill:#052d41;fill-opacity:0.2;stroke-width:0.26458335" /> </g> </g> </svg>',
      width: 180,
      absolutePosition: { x: 0, y: 841.89 - 224.5 },
    });

    // QR code
    pdf.add({
      absolutePosition: { x: 190, y: 841.89 - 100 },
      qr: 'https://linktr.ee/nortanprojetos',
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
