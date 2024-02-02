import { AfterViewInit, Component, OnDestroy } from '@angular/core';
import { MagicMirrorService } from 'src/app/services/magic-mirror.service';


@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements AfterViewInit, OnDestroy {
  pageDestroyed: boolean = false;
  message: string  = "";
  messageType: string = "";
  // gaugeValue = 28.3;
  // gaugeLabel = "Speed";
  // gaugeAppendText = "km/hr";


 
  tresh = {
    "0": {
      "color": "green",
      "bgOpacity": 0.2
    },
    "60": {
      "color": "orange",
      "bgOpacity": 0.2
    },
    "85": {
      "color": "red",
      "bgOpacity": 0.2
    }
  };

  systemTimeout: any;
  systemInfo: any;
  percenta: number = 50

  dashBoardInfo = {
    sysLoad: '0',
    cpuCore: 0,
    cpuTemp: 0,
    freq: 0,
    memUsed: '0',
    memAvai: '0',
    memTotal: '0',
    memFree: '0',
    diskAvai: '0',
    diskUsedPerc: '0',
    diskUsed: '0',
    diskTotal: '0',
    platform: '',
    hostName: '',
    npmVersion: '',
    nodeVersion: '',
    mmVersion: '',
    uptime: ''
  }

  constructor(private mmService: MagicMirrorService) { }
  ngOnDestroy(): void {
    if (this.systemTimeout) {
      clearTimeout(this.systemTimeout);
    }
    this.pageDestroyed = true;
  }
  ngAfterViewInit(): void {
    this.pageDestroyed = false;
    this.fetchSystemInformation();
  }

  fetchSystemInformation() {
    if (!this.pageDestroyed) { //to prevent the interval to continue when user change page mid-timeout.

      this.mmService.systemStatus(true).subscribe({
        next: (data) => {
          // console.log(data);
          if (data.status === 'success') {
            // this.systemInfo = data.system;

            this.dashBoardInfo.sysLoad = parseFloat(data.system.currentLoad.currentLoad).toFixed(2);
            this.dashBoardInfo.cpuCore = data.system.cpu.cores;
            this.dashBoardInfo.cpuTemp = data.system.cpuTemperature.main;
            this.dashBoardInfo.freq = data.system.cpuCurrentSpeed.avg;
            this.dashBoardInfo.memUsed = (data.system.mem.used / data.system.mem.total * 100).toFixed(2);
            this.dashBoardInfo.memAvai = this.formatBytes(data.system.mem.available);
            this.dashBoardInfo.memTotal = this.formatBytes(data.system.mem.total);
            this.dashBoardInfo.memFree = this.formatBytes(data.system.mem.free);
            this.dashBoardInfo.diskUsed = this.formatBytes(data.system.fsSize[0].used);
            this.dashBoardInfo.diskAvai = this.formatBytes(data.system.fsSize[0].available);
            this.dashBoardInfo.diskTotal = this.formatBytes(data.system.fsSize[0].size);
            this.dashBoardInfo.diskUsedPerc = (data.system.fsSize[0].used / data.system.fsSize[0].size * 100).toFixed(2);
            this.dashBoardInfo.platform = data.system.osInfo.platform;
            this.dashBoardInfo.hostName = data.system.osInfo.hostname;
            this.dashBoardInfo.npmVersion = data.system.versions.npm;
            this.dashBoardInfo.nodeVersion = data.system.versions.node;
            this.dashBoardInfo.mmVersion =  data.mmVersion;
            // console.log("this.systemInfo.currentLoad.currentLoad  " , this.systemInfo.currentLoad.currentLoad );
            this.dashBoardInfo.uptime = this.secondsToDhms(data.system.time.uptime)
            // console.log(this.secondsToDhms(data.system.time.uptime));


            this.systemTimeout = setTimeout(() => this.fetchSystemInformation(), 2000);
          } else {
            console.log("Error: ", data);
          }
        },
        error: (err) =>{
          console.error("Error in dashboard: " , err);
          this.message = err.message;
          this.messageType = "error";
      }

      })
    }else if (this.systemTimeout){
      clearTimeout(this.systemTimeout);
    }

  }
  formatBytes(bytes: number, decimals = 2) {
    if (!+bytes) return '0 Bytes'

    const k = 1024
    const dm = decimals < 0 ? 0 : decimals
    const sizes = ['Bytes', 'KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB', 'ZiB', 'YiB']

    const i = Math.floor(Math.log(bytes) / Math.log(k))

    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`
  }

   secondsToDhms(seconds: any) {
    seconds = Number(seconds);
    var d = Math.floor(seconds / (3600*24));
    var h = Math.floor(seconds % (3600*24) / 3600);
    var m = Math.floor(seconds % 3600 / 60);
    var s = Math.floor(seconds % 60);
    
    var dDisplay = d > 0 ? d + (d == 1 ? " day, " : " days, ") : "";
    var hDisplay = h > 0 ? h + (h == 1 ? " hour, " : " hours, ") : "";
    var mDisplay = m > 0 ? m + (m == 1 ? " minute, " : " minutes, ") : "";
    var sDisplay = s > 0 ? s + (s == 1 ? " second" : " seconds") : "";
    return dDisplay + hDisplay + mDisplay + sDisplay;
    }
}
