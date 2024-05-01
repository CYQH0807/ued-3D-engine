/*
 * @Author: hongbin
 * @Date: 2022-08-29 15:21:50
 * @LastEditors: Please set LastEditors
 * @LastEditTime: 2023-04-23 19:02:57
 * @Description:
 */
import { LoadingManager } from 'three/src/loaders/LoadingManager';

export const manager = new LoadingManager();

manager.onStart = function () {
  // console.log("开始加载文件: " + url + ".\nLoaded " + itemsLoaded + " of " + itemsTotal + " files.");
  postMessage({ msg: '开始加载', work_type: 'model_load_start' });
};

manager.onLoad = function () {
  postMessage({ msg: '加载完成!', work_type: 'model_load_complete' });
  // window.loadFinish();
};

manager.onProgress = function (url, itemsLoaded, itemsTotal) {
  postMessage({
    work_type: 'model_load',
    progress: Math.floor((itemsLoaded / itemsTotal) * 100),
    msg: '加载中文件: ' + url + '.\nLoaded ' + itemsLoaded + ' of ' + itemsTotal + ' files.',
  });
  // console.log("加载中文件: " + url + ".\nLoaded " + itemsLoaded + " of " + itemsTotal + " files.");
  // window.updateProgress(Math.floor((itemsLoaded / itemsTotal) * 100));
};

manager.onError = function (url) {
  postMessage({ meg: '加载出错：' + url });
};
