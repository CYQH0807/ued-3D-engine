/*
 * @Description: 创建面板工具,用于调试.
 * @Autor: 池樱千幻
 * @Change: 池樱千幻
 * @Date: 2023-03-17 17:45:53
 * @LastEditTime: 2023-04-21 09:56:49
 */

import { Pane } from 'tweakpane';
import UED3DEngine from '../main';
import EnvTab from './EnvTab';
import MeshTab from './MeshTab';
import SpotlightTab from './SpotlightTab';
import * as TweakpaneImagePlugin from 'tweakpane-image-plugin';
import * as TextareaPlugin from '@pangenerator/tweakpane-textarea-plugin';

import './index.css';

export default class Tweak {
  tweakpane: any;
  envTab: EnvTab;
  meshTab: any;
  spotlightTab: any;
  assetLibTab: any;
  aanimationTab: any;
  baseExperience: UED3DEngine;

  constructor() {
    this.baseExperience = new UED3DEngine();

    let container = document.createElement('div');

    container.setAttribute('id', 'ued-tweakpane');
    this.dragEvent(container);
    document.body.appendChild(container);
    this.tweakpane = new Pane({
      container,
    });
    this.tweakpane.registerPlugin(TweakpaneImagePlugin);
    this.tweakpane.registerPlugin(TextareaPlugin);

    this.baseExperience.main.setStats();

    // 销毁双击事件
    this.baseExperience.off('dbClickModel');

    this.createTab();
  }

  dragEvent(box: HTMLDivElement) {
    let isDown = false;
    let mouseX = 0;
    let mouseY = 0;

    box.addEventListener('mousedown', function (e: any) {
      if (['tp-lblv', 'tp-lblv_l'].includes(e?.target?.className)) {
        isDown = true;
        mouseX = e.clientX - box.offsetLeft;
        mouseY = e.clientY - box.offsetTop;
      }
    });

    box.addEventListener('mousemove', function (e: { clientX: number; clientY: number }) {
      if (!isDown) return;
      let newX = e.clientX - mouseX;
      let newY = e.clientY - mouseY;
      box.style.left = newX + 'px';
      box.style.top = newY + 'px';
    });

    box.addEventListener('mouseup', function () {
      isDown = false;
    });
  }

  // 创建tab
  createTab() {
    const tab = this.tweakpane.addTab({
      pages: [{ title: '环境' }, { title: '物体' }, { title: '聚光灯' }, { title: '资产' }, { title: '动画' }],
    });
    this.envTab = new EnvTab(tab.pages[0], this.tweakpane);
    this.meshTab = new MeshTab(tab.pages[1]);
    this.spotlightTab = new SpotlightTab(tab.pages[2]);
    this.assetLibTab = tab.pages[3];
    this.aanimationTab = tab.pages[4];
  }

  /**
   * @description: 销毁
   * @return {*}
   * @author: 池樱千幻
   */
  destroy() {
    this.baseExperience.main._stats && document.body.removeChild(this.baseExperience.main._stats.domElement);
    this.envTab.destroy();
    this.spotlightTab.destroy();
    this.tweakpane.dispose();
  }

  /**
   * @description: 重新加载
   * @param {any} config
   * @return {*}
   * @author: 池樱千幻
   */
  reload(config: any) {
    this.destroy();
    window.tweakPane = null;
    window.tweakPane = new Tweak();
    Object.keys(config).forEach((key) => {
      let obj = config[key];
      if (obj.isColor) {
        config[key] = {
          r: obj.r,
          g: obj.g,
          b: obj.b,
        };
      }
    });
    window.tweakPane.tweakpane.importPreset(config, true);
  }
}
