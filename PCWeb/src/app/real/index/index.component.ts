import { Component, OnInit, ElementRef, ViewChild, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Station } from '../../models/stations';
import { EsriloadService } from '../../esri-service/esriload.service';
import { CimissResult, CimissHour, CimissPREMinute } from '../../models/cimiss';
import { MinuteData, RainModel } from '../../models/minute';
import { DxDataGridComponent } from 'devextreme-angular';
import { HistoryDay } from '../../models/history';
import * as moment from 'moment';

@Component({
  selector: 'app-index',
  templateUrl: './index.component.html',
  styleUrls: ['./index.component.css']
})

export class IndexComponent implements OnInit, OnDestroy {
  historyDay: HistoryDay;
  historyMinTemp: HistoryDay;
  historyRain2020: HistoryDay;
  timer: any = null;
  option: any;
  echartsIntance: any;
  stations: Station[] = [];
  selStation: String = '57132';
  hourDatas: CimissHour[] = [];
  minuteDatas: RainModel[] = [];
  realDatas: MinuteData[] = [];
  arr_dewtemp = []; // 瞬时温度
  arr_precipitation = []; // 降水量
  arr_instantwindd = []; // 风向
  arr_instantwindv = []; // 风速
  arr_maxtemp = []; // 最高温度
  arr_mintemp = []; // 最小温度
  arr_stationpress = []; // 气压
  arr_relhumidity = []; // 湿度
  arr_time = [];
  selMinuteDate: Date = new Date();
  selHourDate: Date = new Date();
  selReal: Date;
  map: __esri.Map;
  mapView: __esri.MapView;
  @ViewChild('map') mapEl: ElementRef;
  @ViewChild('hGrid') hGrid: DxDataGridComponent;
  @ViewChild('mGrid') mGrid: DxDataGridComponent;
  constructor(private _http: HttpClient, private esriService: EsriloadService) { }

  ngOnInit() {
    this.queryStations();
    this.queryHistoryDayMaxTemp();
    this.queryHistoryDayMinTemp();
    this.queryHistoryDayRain2020();
  }
  ngOnDestroy() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }
  queryStations() {
    this._http.get('http://www.lintongqx.com/api/station?id=610125').subscribe(result => {
      this.stations = result as Station[];
      this.option = this.createOption();
      this.queryHour();
      this.queryMRainDatas();
      this.loadMap();
    });
  }
  loadMap() {
    const mapProperties: __esri.MapProperties = {};
    const stnlyProperties: __esri.GraphicsLayerProperties = { id: 'station', opacity: 0.8, visible: true };
    const mapViewProperties: __esri.MapViewProperties = { center: { x: 108.61, y: 34 }, zoom: 10 };
    this.esriService.loadMap(mapProperties, mapViewProperties, this.mapEl).then(mapInfo => {
      this.map = mapInfo.map;
      this.mapView = mapInfo.mapView;
      this.esriService.createGraphicsLayer(stnlyProperties).then(map => {
        this.map = map;
        this.queryRealWeather();
        this.timer = setInterval(() => {
          this.queryRealWeather();
        }, 1000 * 60 * 2);
      });
    });
  }

  queryRealWeather() {
    const now = new Date();
    let minu = moment(now).minutes();
    minu = minu - (minu % 5);
    this.selReal = moment(now).minutes(minu).add(-5, 'minutes').toDate();
    const currentDate = moment(this.selReal).add(-8, 'hours');
    const url = 'http://www.lintongqx.com/api/minute/610125/' + currentDate.format('YYYYMMDDHHmm') + '00';
    this._http.get(url).subscribe(minResult => {
      this.realDatas = minResult as MinuteData[];
      this.esriService.setStationLayerDatas('station', currentDate.format('YYYYMMDDHHmm'), this.stations, this.realDatas);
    }, error => {
      this.esriService.setStationLayerDatas('station', currentDate.format('YYYYMMDDHHmm'), this.stations, []);
    });
  }
  queryFactor() {
    const currentDate = moment().add(-8, 'hours'); // 世界时
    const endTime = currentDate.format('YYYYMMDDHH') + '0000';
    const startTime = currentDate.add(-24, 'hours').format('YYYYMMDDHH') + '0000';
    let parUrl = 'http://10.172.99.15/cimiss?userId=BEXA_XIAN_liuchang';
    parUrl += '&pwd=liu7758521' + '&interfaceId=getSurfEleByTimeRangeAndStaID';
    parUrl += '&dataCode=SURF_CHN_MUL_HOR';
    parUrl += '&elements=Station_ID_C,Station_Name,Lon,Lat,Datetime,PRE_1h,PRS,RHU,';
    parUrl += 'TEM,TEM_Min,TEM_Max,WIN_S_Inst_Max,WIN_D_INST_Max,VIS_Min';
    parUrl += '&staIds=' + this.selStation;
    parUrl += '&dataFormat=json&timeRange=[';
    parUrl += startTime + ',' + endTime + ']';
    this.arr_dewtemp = [];
    this.arr_instantwindd = []; // 风向
    this.arr_precipitation = []; // 降水量
    this.arr_instantwindv = []; // 风速
    this.arr_maxtemp = []; // 最高温度
    this.arr_mintemp = []; // 最小温度
    this.arr_stationpress = []; // 大气压
    this.arr_relhumidity = []; // 相对湿度
    this.arr_time = [];
    this._http.get(parUrl).subscribe(result => {
      const dt = result as CimissResult;
      if (dt && dt.returnCode === '0') {
        const infos = dt.DS as CimissHour[];
        infos.forEach(item => {
          const strTime = moment(item.Datetime.valueOf(), 'YYYY-MM-DD HH:mm:ss').add(8, 'hours').format('DD' + '日' + 'HH' + '时');
          this.arr_dewtemp.push(item.TEM);
          this.arr_precipitation.push(item.PRE_1h > '9999' ? 0 : item.PRE_1h);
          this.arr_instantwindd.push([strTime,
            (item.WIN_S_Inst_Max > '9999' ? 0 : item.WIN_S_Inst_Max),
            (item.WIN_D_INST_Max > '9999' ? 0 : item.WIN_D_INST_Max)]);
          this.arr_instantwindv.push(item.WIN_S_Inst_Max > '9999' ? 0 : item.WIN_S_Inst_Max);
          this.arr_maxtemp.push(item.TEM_Max > '9999' ? 0 : item.TEM_Max);
          this.arr_mintemp.push(item.TEM_Min > '9999' ? 0 : item.TEM_Min);
          this.arr_stationpress.push(item.PRS > '9999' ? 0 : item.PRS);
          this.arr_relhumidity.push(item.RHU > '9999' ? 0 : item.RHU);
          this.arr_time.push(strTime);
        });
        this.echartsIntance.setOption(this.createOption());
      }
    });
  }
  createOption(): any {
    return {
      title: {
        left: 'center',
        top: 0,
        textStyle: {
          color: '#555',
          fontWeight: 'normal',
          fontSize: 20
        }
      },
      tooltip: {
        trigger: 'axis',
        formatter: function (params) {
          let relVal = params[0].name + '<br/>';
          if (params.length === 3) {
            relVal += params[0].seriesName + ' : ' + params[0].value + '℃' + '<br/>';
            relVal += '高温' + params[1].seriesName + ' : ' + params[1].value + '℃' + '<br/>';
            relVal += '低温' + params[2].seriesName + ' : ' + params[2].value + '℃' + '<br/>';
          } else {
            relVal += params[0].seriesName + ' : ' + params[0].value + '<br/>';
          }

          return relVal;
        }
      },
      legend: {
        data: ['温度', '极大风', '相对湿度', '气压', '降水量'],
        x: 'center',
        selectedMode: 'single'
      },
      xAxis: {
        type: 'category',
        axisTick: {
          alignWithLabel: true
        },
        axisLabel: {
          interval: 1,
          rotate: 40,
        },
        data: this.arr_time
      },
      yAxis: [
        {
          type: 'value',
          position: 'left',
          show: true,
          offset: 0,
          axisLine: { show: false },
          axisTick: { show: false },
          scale: true,
          axisLabel: {
            formatter: '{value}%'
          }
        },
        {
          type: 'value',
          position: 'left',
          show: true,
          offset: 0,
          axisLine: { show: false },
          axisTick: { show: false },
          scale: true,
          axisLabel: {
            formatter: '{value}hpa'
          }
        },
        {
          type: 'value',
          position: 'left',
          offset: 0,
          show: true,
          scale: true,
          axisLine: { show: false },
          axisTick: { show: false },
          axisLabel: {
            formatter: '{value}m/s'
          }
        },
        {
          type: 'value',
          position: 'left',
          show: true,
          scale: true,
          offset: 0,
          axisLine: { show: false },
          axisTick: { show: false },
          axisLabel: {
            formatter: '{value}℃'
          }
        },
        {
          type: 'value',
          position: 'right',
          offset: 0,
          axisLine: { show: false },
          axisTick: { show: false },
          scale: true,
          show: true,
          axisLabel: {
            formatter: '{value}mm'
          }
        },

      ],
      series: [
        {
          name: '温度',
          yAxisIndex: 3,
          symbolSize: 6,
          itemStyle: {
            normal: {
              color: '#37b510',
              lineStyle: {
                color: '#37b510'
              }
            }
          },
          type: 'line',
          data: this.arr_dewtemp
        },
        {
          type: 'custom',
          name: '极大风',
          yAxisIndex: 2,
          renderItem: function (params, api) {
            const point = api.coord([
              api.value(0),
              api.value(1)
            ]);
            return {
              type: 'path',
              shape: {
                pathData: 'M508.928 1024L0.512 0l515.072 299.008L1024 2.048 508.928 1024z ',
                x: -8 / 2,
                y: -20 / 2,
                width: 8,
                height: 20
              },
              position: point,
              rotation: api.value(2),
              style: api.style({
                stroke: '#633296',
                lineWidth: 1,
                color: '#633296',
                background: '#633296',
              })
            };
          },
          data: this.arr_instantwindd
        },
        {
          type: 'line',
          name: '极大风',
          itemStyle: {
            normal: {
              color: '#633296',
              lineStyle: {
                color: '#633296'
              }
            }
          },

          yAxisIndex: 2,
          symbol: 'none',
          lineStyle: {
            normal: {
              color: '#f3ed0b',
              type: 'solid'
            }
          },
          data: this.arr_instantwindv,
          z: 1
        },
        {
          name: '温度',
          yAxisIndex: 3,
          symbolSize: 6,
          type: 'line',
          itemStyle: {
            normal: {
              color: '#f15626',
              lineStyle: {
                color: '#f15626'
              }
            }
          },
          data: this.arr_maxtemp
        },
        {
          name: '温度',
          yAxisIndex: 3,
          symbolSize: 6,
          type: 'line',
          itemStyle: {
            normal: {
              color: '#408e84',
              lineStyle: {
                color: '#408e84'
              }
            }
          },
          data: this.arr_mintemp
        },
        {
          name: '相对湿度',
          yAxisIndex: 0,
          symbolSize: 6,
          type: 'line',
          itemStyle: {
            normal: {
              color: '#20a4cc',
              lineStyle: {
                color: '#20a4cc'
              }
            }
          },
          data: this.arr_relhumidity
        },
        {
          name: '气压',
          type: 'line',
          yAxisIndex: 1,
          symbolSize: 6,
          symbol: 'roundRect',

          itemStyle: {
            normal: {
              color: '#e88608',
              lineStyle: {
                color: '#e88608',
              }
            }
          },
          data: this.arr_stationpress
        },
        {
          name: '降水量',
          type: 'bar',
          symbolSize: 6,
          xAxisIndex: 0,
          itemStyle: {
            normal: {
              color: '#20a4cc',
              lineStyle: {
                color: '#20a4cc'
              }
            }
          },
          yAxisIndex: 4,
          data: this.arr_precipitation
        },
      ]
    };
  }
  onChartInit(ec) {
    this.echartsIntance = ec;
  }

  queryHour() {
    this.hourDatas = [];
    const currentDate = moment(this.selHourDate).add(-8, 'hours'); // 世界时
    const url = 'http://www.lintongqx.com/api/hour/610125/' + currentDate.format('YYYYMMDDHH') + '0000';
    this._http.get(url).subscribe(result => {
      this.hourDatas = result as CimissHour[];
      this.hourDatas.forEach(ele => {
        const stn = this.stations.find(s => {
          return s.Station_Id_C === ele.Station_Id_C;
        });
        if (stn) {
          ele.Station_Name = stn.Station_Name;
        }
        ele.TEM = ele.TEM === '999999' ? '' : ele.TEM;
        if (ele.PRE_1h === '999999') {
          ele.PRE_1h = '';
        } else if (ele.PRE_1h === '999998') {
          ele.PRE_1h = '微量';
        }
        ele.WIN_S_Inst_Max = ele.WIN_S_Inst_Max === '999999' ? '' : ele.WIN_S_Inst_Max;
        ele.WIN_D_INST_Max = ele.WIN_D_INST_Max === '999999' ? '' : ele.WIN_D_INST_Max;
        ele.PRS = ele.PRS === '999999' ? '' : ele.PRS;
        ele.RHU = ele.RHU === '999999' ? '' : ele.RHU;
        ele.VIS = ele.VIS === '999999' ? '' : ele.VIS;
      });
      if (this.hGrid) {
        this.hGrid.instance.refresh();
      }
    });
  }
  queryMRainDatas() {
    let rainUrl: String = 'http://10.172.99.15/cimiss?userId=BEXA_XIAN_liuchang&pwd=liu7758521&';
    rainUrl += 'interfaceId=getSurfEleInRectByTime&dataCode=SURF_CHN_PRE_MIN&dataFormat=json&';
    rainUrl += 'elements=Station_Id_C,PRE,Datetime&&minLat=33.42&maxLat=35&minLon=107.4&maxLon=109.7&times=';
    const startDt = moment(this.selMinuteDate).add(-8, 'hours').format('YYYYMMDDHH');
    for (let i = 10; i < 60; i += 10) {
      rainUrl += startDt + i.toString() + '00,';
    }
    rainUrl += moment(this.selMinuteDate).add(-7, 'hours').format('YYYYMMDDHH') + '0000';
    this._http.get(rainUrl.valueOf()).subscribe(result => {
      const cimissDt = result as CimissResult;
      if (cimissDt && cimissDt.returnCode === '0') {
        const rains = cimissDt.DS as CimissPREMinute[];
        this.initRainArray(rains);
      } else {
        this.initRainArray([]);
      }
    });
  }
  initRainArray(data: CimissPREMinute[]) {
    const ary: RainModel[] = [];
    this.stations.forEach(station => {
      const rain = new RainModel();
      rain.station = station;
      const dts = data.filter(s => s.Station_Id_C === station.Station_Id_C).sort(function (a, b) {
        return moment(a.Datetime.valueOf()).toDate().getTime() - moment(b.Datetime.valueOf()).toDate().getTime();
      });
      const dt = moment(this.selMinuteDate).minutes(0).seconds(0);
      for (let i = 1; i < 7; i++) {
        const stime = dt.add(-8, 'hours').add(i * 10, 'minutes').format('YYYY-MM-DD HH:mm:ss');
        const rs = dts.filter(s => {
          return s.Datetime === stime;
        });
        if (rs && rs.length > 0) {
          const r = rs[0];
          if (r.PRE && i === 1) {
            rain.R1 = rain.R2 = rain.R3 = rain.R4 = rain.R5 = rain.R6 = this.calRain(r.PRE);
          } else if (r.PRE && i === 2) {
            rain.R2 = rain.R3 = rain.R4 = rain.R5 = rain.R6 = this.calRain(r.PRE);
          } else if (r.PRE && i === 3) {
            rain.R3 = rain.R4 = rain.R5 = rain.R6 = this.calRain(r.PRE);
          } else if (r.PRE && i === 4) {
            rain.R4 = rain.R5 = rain.R6 = this.calRain(r.PRE);
          } else if (r.PRE && i === 5) {
            rain.R5 = rain.R6 = this.calRain(r.PRE);
          } else if (r.PRE && i === 6) {
            rain.R6 = this.calRain(r.PRE);
          }
        } else {
          rain.R1 = rain.R2 = rain.R3 = rain.R4 = rain.R5 = rain.R6 = 0;
        }
      }
      ary.push(rain);
    });
    this.minuteDatas = ary;
    if (this.mGrid) {
      this.mGrid.instance.refresh();
    }
  }
  calRain(r: String): number {
    if (r > '99990') { return 0; }
    return parseFloat(parseFloat(r.valueOf()).toFixed(2));
  }

  queryHistoryDayMaxTemp() {
    let url: String = 'http://10.172.99.15/cimiss?userId=BEXA_XIAN_liuchang&pwd=liu7758521&';
    url += 'interfaceId=getSurfEleInHistoryBySamePeriodAndStaID&dataCode=SURF_CHN_MUL_DAY&elements=TEM_Max,Datetime&';
    url += 'dataFormat=json&staIds=57132&orderBy=TEM_Max:desc&minYear=1951&maxYear=' + moment().format('YYYY');
    url += '&minMD=' + moment().format('MMDD') + '&maxMD=' + moment().format('MMDD') + '&limitCnt=1';
    this._http.get(url.valueOf()).subscribe(result => {
      const dt = result as CimissResult;
      if (dt && dt.returnCode === '0') {
        const ds = dt.DS as HistoryDay[];
        if (ds && ds.length > 0) {
          this.historyDay = ds[0];
          this.historyDay.Datetime = moment(this.historyDay.Datetime.valueOf()).format('YYYY年MM月DD日');
        }
      }
    });
  }
  queryHistoryDayMinTemp() {
    let url: String = 'http://10.172.99.15/cimiss?userId=BEXA_XIAN_liuchang&pwd=liu7758521&';
    url += 'interfaceId=getSurfEleInHistoryBySamePeriodAndStaID&dataCode=SURF_CHN_MUL_DAY&elements=TEM_Min,Datetime&';
    url += 'dataFormat=json&staIds=57132&orderBy=TEM_Min:asc&minYear=1951&maxYear=' + moment().format('YYYY');
    url += '&minMD=' + moment().format('MMDD') + '&maxMD=' + moment().format('MMDD') + '&limitCnt=1';
    this._http.get(url.valueOf()).subscribe(result => {
      const dt = result as CimissResult;
      if (dt && dt.returnCode === '0') {
        const ds = dt.DS as HistoryDay[];
        if (ds && ds.length > 0) {
          this.historyMinTemp = ds[0];
          this.historyMinTemp.Datetime = moment(this.historyMinTemp.Datetime.valueOf()).format('YYYY年MM月DD日');
        }
      }
    });
  }
  queryHistoryDayRain2020() {
    let url: String = 'http://10.172.99.15/cimiss?userId=BEXA_XIAN_liuchang&pwd=liu7758521&';
    url += 'interfaceId=getSurfEleInHistoryBySamePeriodAndStaID&dataCode=SURF_CHN_MUL_DAY&elements=PRE_Time_2020,Datetime&';
    url += 'dataFormat=json&staIds=57132&orderBy=PRE_Time_2020:desc&minYear=1951&maxYear=' + moment().format('YYYY');
    url += '&minMD=' + moment().format('MMDD') + '&maxMD=' + moment().format('MMDD') + '&limitCnt=1&eleValueRanges=PRE_Time_2020:(,9999)';
    this._http.get(url.valueOf()).subscribe(result => {
      const dt = result as CimissResult;
      if (dt && dt.returnCode === '0') {
        const ds = dt.DS as HistoryDay[];
        if (ds && ds.length > 0) {
          this.historyRain2020 = ds[0];
          this.historyRain2020.Datetime = moment(this.historyRain2020.Datetime.valueOf()).format('YYYY年MM月DD日');
        }
      }
    });
  }
}
