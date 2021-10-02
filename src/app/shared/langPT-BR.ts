/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

/**
 * Language: Brazilian Portuguese.
 */

export default {
  time: {
    month: [
      'Janeiro',
      'Fevereiro',
      'Março',
      'Abril',
      'Maio',
      'Junho',
      'Julho',
      'Agosto',
      'Setembro',
      'Outubro',
      'Novembro',
      'Dezembro',
    ],
    monthAbbr: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'],
    dayOfWeek: ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'],
    dayOfWeekAbbr: ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'],
  },
  legend: {
    selector: {
      all: 'Todos',
      inverse: 'Inv',
    },
  },
  toolbox: {
    brush: {
      title: {
        rect: 'Seleção Retangular',
        polygon: 'Seleção em Laço',
        lineX: 'Seleção Horizontal',
        lineY: 'Seleção Vertical',
        keep: 'Manter Seleção',
        clear: 'Limpar Seleção',
      },
    },
    dataView: {
      title: 'Visualização dos Dados',
      lang: ['Visualização dos Dados', 'Fechar', 'Atualizar'],
    },
    dataZoom: {
      title: {
        zoom: 'Zoom',
        back: 'Resetar Zoom',
      },
    },
    magicType: {
      title: {
        line: 'Trocar para Gráfico em Linha',
        bar: 'Trocar para Gráfico em Barra',
        stack: 'Empilhado',
        tiled: 'Lado a Lado',
      },
    },
    restore: {
      title: 'Restaurar',
    },
    saveAsImage: {
      title: 'Salvar como Imagem',
      lang: ['Clique com o botão direito para salvar a imagem'],
    },
  },
  series: {
    typeNames: {
      pie: 'Gráfico em pizza',
      bar: 'Gráfico em barras',
      line: 'Gráfico em linha',
      scatter: 'Gráfico em pontos',
      effectScatter: 'Ripple scatter plot',
      radar: 'Gráfico em radar',
      tree: 'Árvore',
      treemap: 'Mapa de árvore',
      boxplot: 'Boxplot',
      candlestick: 'Candlestick',
      k: 'Gráfico de linha K',
      heatmap: 'Mapa de calor',
      map: 'Mapa',
      parallel: 'Mapa de coordenadas paralela',
      lines: 'Grafo em linha',
      graph: 'Grado de relacionamento',
      sankey: 'Diagrama Sankey',
      funnel: 'Gráfico Funnel',
      gauge: 'Velocimetro',
      pictorialBar: 'Pictorial bar',
      themeRiver: 'Theme River Map',
      sunburst: 'Sunburst',
    },
  },
  aria: {
    general: {
      withTitle: 'Este gráfico é sobre "{title}"',
      withoutTitle: 'Isso é um gráfico',
    },
    series: {
      single: {
        prefix: '',
        withName: ' com o tipo {seriesType} chamado {seriesName}.',
        withoutName: ' com o tipo {seriesType}.',
      },
      multiple: {
        prefix: '. It consists of {seriesCount} series count.',
        withName: ' The {seriesId} series is a {seriesType} representing {seriesName}.',
        withoutName: ' The {seriesId} series is a {seriesType}.',
        separator: {
          middle: '',
          end: '',
        },
      },
    },
    data: {
      allData: 'The data is as follows: ',
      partialData: 'The first {displayCnt} items are: ',
      withName: 'the data for {name} is {value}',
      withoutName: '{value}',
      separator: {
        middle: ', ',
        end: '. ',
      },
    },
  },
};
