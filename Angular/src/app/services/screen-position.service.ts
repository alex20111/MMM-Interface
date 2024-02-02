import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ScreenPositionService {

  private positionMap!: Map<string, string>;


  constructor() {
    //build map
    this.positionMap = new Map<string, string>([
      ['top_bar', '.region.top.bar'],
      ['top_left', '.region.top.left'],
      ['top_center', '.region.top.center'],
      ['top_right', '.region.top.right'],
      ['upper_third', '.region.upper.third'],
      ['middle_center', '.region.middle.center'],
      ['lower_third', '.region.lower.third'],
      ['bottom_left', '.region.bottom.left'],
      ['bottom_center', '.region.bottom.center'],
      ['bottom_right', '.region.bottom.right'],
      ['bottom_bar', '.region.bottom.bar'],
      ['fullscreen_above', '.region.fullscreen.above'],
      ['fullscreen_below', '.region.fullscreen.below'],
      // ['invisible', 'invisible']
    ]);
  }

  getPositionNames(): string[] {
    let postion = [];

    for (let key of this.positionMap.keys()) {
      postion.push(key);
    }

    return postion;
  }

  getPositionValue(key: any): string{
    let value = '';
    if(this.positionMap){
      value = this.positionMap.get(key)!;
    }
    return value;
  }
}

export interface Position{
  region: string,
  moduleName: string,
  position: string,
  prevInvisible: boolean
}
