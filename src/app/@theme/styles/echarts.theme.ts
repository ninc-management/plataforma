export class ChartThemeFactory {
  darkMode: boolean;
  contrastColor: string;
  backgroundColor: string;
  colorPalette: string[];
  splitLine: string;
  tooltipBg: string;

  constructor(
    darkMode: boolean,
    pallete: string[],
    contrastColor: string,
    backgroundColor: string,
    splitLine: string,
    tooltipBg: string
  ) {
    this.darkMode = darkMode;
    this.colorPalette = pallete;
    this.contrastColor = contrastColor;
    this.backgroundColor = backgroundColor;
    this.splitLine = splitLine;
    this.tooltipBg = tooltipBg;
  }

  private axisCommon(): any {
    return {
      axisLine: {
        lineStyle: {
          color: this.contrastColor,
        },
      },
      splitLine: {
        show: true,
        lineStyle: {
          color: this.splitLine,
        },
      },
      splitArea: {
        areaStyle: {
          color: ['rgba(255,255,255,0.02)', 'rgba(255,255,255,0.05)'],
        },
      },
      minorSplitLine: {
        lineStyle: {
          color: '#20203B',
        },
      },
    };
  }

  theme(): any {
    const theme = {
      darkMode: this.darkMode,
      color: this.colorPalette,
      backgroundColor: this.backgroundColor,
      axisPointer: {
        lineStyle: {
          color: '#817f91',
        },
        crossStyle: {
          color: '#817f91',
        },
        label: {
          // TODO Contrast of label backgorundColor
          color: '#fff',
        },
      },
      legend: {
        textStyle: {
          color: this.contrastColor,
        },
      },
      textStyle: {
        color: this.contrastColor,
      },
      title: {
        textStyle: {
          color: this.contrastColor,
        },
        subtextStyle: {
          color: '#B9B8CE',
        },
      },
      tooltip: {
        backgroundColor: this.tooltipBg,
        borderColor: this.tooltipBg,
        textStyle: {
          color: this.contrastColor,
        },
      },
      toolbox: {
        iconStyle: {
          borderColor: this.contrastColor,
        },
        emphasis: {
          iconStyle: {
            textFill: this.contrastColor,
          },
        },
      },
      dataZoom: {
        borderColor: this.splitLine,
        textStyle: {
          color: this.contrastColor,
        },
        brushStyle: {
          color: 'rgba(135,163,206,0.3)',
        },
        handleStyle: {
          color: '#353450',
          borderColor: '#C5CBE3',
        },
        moveHandleStyle: {
          color: '#B0B6C3',
          opacity: 0.3,
        },
        fillerColor: 'rgba(135,163,206,0.2)',
        emphasis: {
          handleStyle: {
            borderColor: '#91B7F2',
            color: '#4D587D',
          },
          moveHandleStyle: {
            color: '#636D9A',
            opacity: 0.7,
          },
        },
        dataBackground: {
          lineStyle: {
            color: this.splitLine,
            width: 1,
          },
          areaStyle: {
            color: this.splitLine,
          },
        },
        selectedDataBackground: {
          lineStyle: {
            color: '#87A3CE',
          },
          areaStyle: {
            color: '#87A3CE',
          },
        },
      },
      visualMap: {
        textStyle: {
          color: this.contrastColor,
        },
      },
      timeline: {
        lineStyle: {
          color: this.contrastColor,
        },
        label: {
          color: this.contrastColor,
        },
        controlStyle: {
          color: this.contrastColor,
          borderColor: this.contrastColor,
        },
      },
      calendar: {
        itemStyle: {
          color: this.backgroundColor,
        },
        dayLabel: {
          color: this.contrastColor,
        },
        monthLabel: {
          color: this.contrastColor,
        },
        yearLabel: {
          color: this.contrastColor,
        },
      },
      timeAxis: this.axisCommon(),
      logAxis: this.axisCommon(),
      valueAxis: this.axisCommon(),
      categoryAxis: this.axisCommon(),
      line: {
        symbol: 'circle',
      },
      graph: {
        color: this.colorPalette,
      },
      gauge: {
        title: {
          color: this.contrastColor,
        },
        axisLine: {
          lineStyle: {
            color: [[1, 'rgba(207,212,219,0.2)']],
          },
        },
        axisLabel: {
          color: this.contrastColor,
        },
        detail: {
          color: '#EEF1FA',
        },
      },
      candlestick: {
        itemStyle: {
          color: '#f64e56',
          color0: '#54ea92',
          borderColor: '#f64e56',
          borderColor0: '#54ea92',
          // borderColor: '#ca2824',
          // borderColor0: '#09a443'
        },
      },
    };
    theme.categoryAxis.splitLine.show = false;
    theme.timeAxis.splitLine.show = false;

    return theme;
  }
}
