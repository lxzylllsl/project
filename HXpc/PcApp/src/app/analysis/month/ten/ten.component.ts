import { Component, OnInit, ViewChild } from '@angular/core';
import { CimissResult, CimissTen, CimissStation } from '../../../models/cimiss';
import { Element } from '../../../models/element';
import { HttpClient } from '@angular/common/http';
import { AgGridNg2 } from 'ag-grid-angular';
import * as moment from 'moment';
@Component({
  selector: 'app-ten',
  templateUrl: './ten.component.html',
  styleUrls: ['./ten.component.css']
})
export class TenComponent implements OnInit {
  stations: CimissStation[] = [];
  stationList: CimissStation[] = [];
  selStation: String = '57132';
  cityList: String[] = [];
  selCity: String = '西安市';
  selUrl: String = '';
  sDate: String = moment().add(-2, 'months').format('YYYY-MM');
  eDate: String = moment().add(-1, 'days').format('YYYY-MM');
  monDatas: CimissTen[] = [];
  elements: Element[] = [];
  @ViewChild('monGrid') monGrid: AgGridNg2;
  minuteConfig = { format: 'YYYY-MM', locale: moment.locale('zh-CN') };
  constructor(private _http: HttpClient) {
    this.elements = [
      { label: '平均气温', value: 'TEM_Avg', checked: true },
      { label: '最高气温', value: 'TEM_Max', checked: true },
      { label: '极端最高气温出现日数', value: 'TEM_Max_Days', checked: true },
      { label: '极端最高气温出现日(字符型)', value: 'TEM_Max_ODay_C', checked: false },
      { label: '最低气温', value: 'TEM_Min', checked: true },
      // { label: '极端最低气温出现日数', value: 'TEM_Min_Days', checked: true },
      // { label: '最低气温出现日(字符型)', value: 'TEM_Min_ODay_C', checked: false },
      { label: '平均地面温度', value: 'GST_Avg', checked: false },
      { label: '最高地面温度', value: 'GST_Max', checked: false },
      { label: '极端最高地面气温出现日数	', value: 'EGST_Max_Days', checked: false },
      { label: '极端最高地面气温出现日（字符型）', value: 'EGST_Max_ODay_C', checked: false },
      { label: '最低地面温度', value: 'GST_Min', checked: false },
      // { label: '极端最低地面气温出现日数	', value: 'EGST_Min_Days', checked: false },
      // { label: '极端最低地面气温出现日（字符型）', value: 'EGST_Min_ODay_C', checked: false },
      { label: '平均水气压', value: 'VAP_Avg', checked: false },
      { label: '平均相对湿度', value: 'RHU_Avg', checked: false },
      { label: '平均5cm地温', value: 'GST_Avg_5cm', checked: false },
      { label: '平均10cm地温', value: 'GST_Avg_10cm', checked: false },
      { label: '平均15cm地温', value: 'GST_Avg_15cm', checked: false },
      { label: '平均20cm地温', value: 'GST_Avg_20cm', checked: false },
      { label: '平均40cm地温', value: 'GST_Avg_40cm', checked: false },
      { label: '平均80cm地温', value: 'GST_Avg_80cm', checked: false },
      { label: '平均160cm地温', value: 'GST_Avg_160cm', checked: false },
      { label: '平均320cm地温', value: 'GST_Avg_320cm', checked: false },
      { label: '平均2分钟风速', value: 'WIN_S_2mi_Avg', checked: false },
      { label: '平均10分钟风速', value: 'WIN_S_10mi_Avg', checked: false },
      { label: '大风日数', value: 'GaWIN_Days', checked: false },
      { label: '最大积雪深度', value: 'Snow_Depth_Max', checked: false },
      { label: '最大积雪深度日数', value: 'V13334_040', checked: false },
      { label: '最大积雪深度出现日', value: 'V13334_060_C', checked: false },
      { label: '蒸发', value: 'EVP', checked: true },
      { label: '蒸发（大型）', value: 'EVP_Big', checked: false },
      { label: '日照时数', value: 'SSH', checked: true },
      { label: '月日照百分率', value: 'SSP_Mon', checked: true },
      { label: '20-20时降水量', value: 'PRE_Time_2020', checked: true },
      { label: '08-08时降水量', value: 'PRE_Time_0808', checked: true },
      { label: '日降水量≥0.1mm日数', value: 'PRE_A0p1mm_Days', checked: false },
      { label: '日降水量≥25mm日数', value: 'PRE_A25mm_Days', checked: false },
      { label: '日降水量≥50mm日数', value: 'PRE_A50mm_Days', checked: false },
    ];
  }

  ngOnInit() {
    let sUrl = 'http://10.172.99.15/cimiss?userId=BEXA_XIAN_liuchang&pwd=liu7758521&';
    sUrl += 'interfaceId=getStaInfoByRegionCode&dataCode=STA_INFO_SURF_CHN&dataFormat=json&adminCodes=610000&';
    sUrl += 'staLevels=011,012,013,015&elements=Station_Id_C,Station_Name,City,Cnty,Town';
    this._http.get(sUrl).subscribe(result => {
      const cimissDt = result as CimissResult;
      if (cimissDt && cimissDt.returnCode === '0') {
        this.stations = cimissDt.DS as CimissStation[];
        this.stations.forEach(stn => {
          const city = this.cityList.find(s => {
            return s === stn.City;
          });
          if (!city) { this.cityList.push(stn.City); }
        });
        this.changeCity();
        this.selStation = '57132';
      }
    });
  }
  changeCity() {
    this.stationList = this.stations.filter(s => {
      return s.City === this.selCity;
    });
    if (this.stationList.length > 0) {
      this.selStation = this.stationList[0].Station_Id_C;
    }
  }
  setUrl() {
    this.selUrl = '';
    this.elements.forEach(ele => {
      if (ele.checked) {
        if (this.selUrl === '') {
          this.selUrl = ele.value;
        } else {
          this.selUrl += ',' + ele.value;
        }
      }
    });
  }
  queryTen() {
    this.setUrl();
    let sUrl = 'http://10.172.99.15/cimiss?userId=BEXA_XIAN_liuchang&pwd=liu7758521&';
    sUrl += 'interfaceId=getSurfEleByTimeRangeAndStaID&dataCode=SURF_CHN_MUL_TEN&dataFormat=json&staIds=' + this.selStation;
    sUrl += '&elements=Station_Id_C,Station_Name,Datetime,' + this.selUrl + '&timeRange=[';
    sUrl += moment(this.sDate.valueOf(), 'YYYY-MM').format('YYYYMM') + '01000000,';
    sUrl += moment(this.eDate.valueOf(), 'YYYY-MM').format('YYYYMM') + '03000000]';
    this._http.get(sUrl).subscribe(result => {
      const cimissDt = result as CimissResult;
      if (cimissDt && cimissDt.returnCode === '0') {
        this.monDatas = cimissDt.DS as CimissTen[];
        if (this.monGrid.api) {
          this.monGrid.api.setRowData([]);
          this.monGrid.api.updateRowData({ add: this.monDatas });
        }
      }
    });
  }
  formatTime(t: String) {
    let tenDays = '';
    if (t) {
      const DD = moment(t.valueOf()).format('DD');
      switch (DD) {
        case '01': tenDays = '上旬'; break;
        case '02': tenDays = '中旬'; break;
        case '03': tenDays = '下旬'; break;
      }
      return moment(t.valueOf()).format('YYYY年MM月') + tenDays;
    }
    return '';
  }
  initGrid() {
    if (!this.monGrid.api) { return; }
    const ary = [
      { headerName: '站名', field: 'Station_Name', width: 80 },
      {
        headerName: '日期', field: 'Datetime', width: 140, valueFormatter: function (params) {
          let tenDays = '';
          if (params.value) {
            const DD = moment(params.value.valueOf()).format('DD');
            switch (DD) {
              case '01': tenDays = '上旬'; break;
              case '02': tenDays = '中旬'; break;
              case '03': tenDays = '下旬'; break;
            }
            return moment(params.value.valueOf()).format('YYYY年MM月') + tenDays;
          }
          return '';
        }
      }
    ];
    this.elements.forEach(ele => {
      if (ele.checked === true) {
        ary.push({ headerName: ele.label.valueOf(), field: ele.value.valueOf(), width: 110 });
      }
    });
    this.monGrid.api.setColumnDefs(ary);
    this.queryTen();
  }
}
