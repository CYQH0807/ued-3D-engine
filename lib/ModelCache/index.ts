import IndexedDbTools from './indexedDB';
import { getFileSizeByUrlList, checkModelChange, loadGltfByZip, getJsonByPwwd } from './tools';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader';

// 定义options的接口
interface options {
  cache?: boolean;
  localCache?: boolean;
  THREE?: any;
  GLTFLoader?: any;
  GLTFFileList?: any[];
  loadingColor?: any;
}

class webGLModelCache {
  THREE: any;
  GLTFLoader: any;
  localCache: any;
  cache: boolean;
  loadingColor: any;
  modelsFlag: any;
  fileDownLoadProgress: any;
  indexedDbTools: IndexedDbTools;
  modelBlob: {
    [key: string]: any;
  };
  frameId: null;
  fileDownLoadAllSize: {
    [key: string]: any;
  };
  constructor(options: options = {}) {
    // 默认采用持久存储
    let { cache = true, localCache = false, THREE: THREE_Client, GLTFLoader: GLTFLoader_Client, GLTFFileList = [], loadingColor } = options;
    if (THREE_Client) {
      this.THREE = THREE_Client;
    } else {
      this.THREE = THREE;
    }
    if (GLTFLoader_Client) {
      this.GLTFLoader = GLTFLoader_Client;
    } else {
      this.GLTFLoader = GLTFLoader;
    }
    this.localCache = localCache;
    if (this.localCache) {
      // 如果使用本地存储,那么就不使用持久存储
      this.cache = false;
    } else {
      this.cache = cache;
    }
    this.loadingColor = loadingColor;
    this.modelsFlag = this.reactive();
    // 下载进度
    this.fileDownLoadProgress = {};
    GLTFFileList.forEach((key) => {
      this.modelsFlag[key] = false;
      this.fileDownLoadProgress[key] = this.reactive();
    });
    // 持久缓存为true,本地缓存一定为true
    if (this.cache) {
      this.localCache = true;
      console.log('初始化数据库....');
      // debugger 模式
      // window.indexedDB.deleteDatabase('threeJSCacheModel');
      this.indexedDbTools = new IndexedDbTools();
      this.cacheModelByGLTFList(GLTFFileList);
    } else {
      console.log('模型不使用缓存');
    }
    // 模型的blob对象, 用于记录数据库读出来的blob对象,并在读取之后,用于删除缓存
    this.modelBlob = {};
    // 动画id
    this.frameId = null;
    // 模型总大小
    this.fileDownLoadAllSize = {};
  }
  initLoadingScreen(modelsFlagKey: string | number) {
    return new Promise<void>((resolve) => {
      // !loadingCb && createDom();
      this.fileDownLoadProgress[modelsFlagKey].$watch = () => {
        let allSize = this.fileDownLoadAllSize[modelsFlagKey];
        let fileSizeList = Object.keys(this.fileDownLoadProgress[modelsFlagKey]).map((key) => this.fileDownLoadProgress[modelsFlagKey][key]);
        let currentFileSize = fileSizeList.reduce(function (total, value) {
          if (!isNaN(Number(value))) {
            return total + Number(value);
          } else {
            return total;
          }
        }, 0);
        let progress = currentFileSize / allSize;
        if (isNaN(progress)) {
          progress = 0;
        }
      };
      this.modelsFlag.$watch = ({ key }: any) => {
        if (modelsFlagKey === key) {
          resolve();
        }
      };
    });
  }

  /**
   * @description: 根据本地上传的文件列表,加载本地的模型
   * @param {*} fileList
   * @return {*}
   * @author: 池樱千幻
   */
  async loadModelByLocalFile(fileList: any[]) {
    fileList.forEach((file) => {
      this.modelBlob[file.name] = URL.createObjectURL(file);
    });
    let gltfName = Object.keys(this.modelBlob).find((key) => key.toLowerCase().split('.').pop() === 'gltf');
    let gltf = null;
    if (gltfName) {
      gltf = await this.loadGLTF(this.modelBlob[gltfName], gltfName, true, true);
    }
    Object.keys(this.modelBlob).forEach((str) => {
      URL.revokeObjectURL(this.modelBlob[str]);
    });
    return gltf;
  }

  /**
   * @description: 从缓存中读取gltf信息,并格式化,如果需要解密,使用密码解密
   * @param {*} url
   * @param {*} pwd
   * @return {*}
   * @author: 池樱千幻
   */
  async getGltfResourceFormat(url: any) {
    const gltfResource = await this.indexedDbTools.select('model_gltf', 'url', `${url}`);
    if (gltfResource) {
      return gltfResource;
    } else {
      return undefined;
    }
  }

  /**
   * @description: 加载模型
   * @param {*} url
   * @return {*}
   * @author: 池樱千幻
   */
  async loadModel(url: string, pwd: any) {
    // 判断是否有当前模型,如果没有就添加
    if (!this.fileDownLoadProgress[url]) {
      this.modelsFlag[url] = true;
      this.fileDownLoadProgress[url] = this.reactive();
    }

    let gltf: any = {};

    if (!this.cache) {
      gltf = await this.loadGLTF(url, false);
      return gltf;
    }

    this.initLoadingScreen(url);
    const gltfResource = await this.indexedDbTools.select('model_gltf', 'url', `${url}`);
    if (gltfResource) {
      // 判断文件是否是最新的
      let changeModleList = await checkModelChange(this.indexedDbTools);
      if (changeModleList.length > 0) {
        for (let i = 0; i < changeModleList.length; i++) {
          console.log(`模型${changeModleList[i].modelData.id},有更新, 删除模型文件.`);
          await this.deleteModelByGLTF(changeModleList[i].modelData.url);
        }
        // 删除之后,重新缓存
        await this.cacheModelByGLTF(url, pwd);
        // 读取缓存
        const gltfResource = await this.indexedDbTools.select('model_gltf', 'url', `${url}`);
        // 加载
        gltf = await this.loadModelByCache(gltfResource, pwd);
      } else {
        // console.time('加载');
        // gltf = await this.resetOriginByGLTF(gltf, url);
        // // console.log('gltf: ', gltf);

        console.log(`${url}模型,不需要更新`);

        // // 如果是最新的,就直接加载
        gltf = await this.loadModelByCache(gltfResource, pwd);
        // console.timeEnd('加载');
      }
    } else {
      // 如果没有缓存,先删除
      await this.deleteModelByGLTF(url);
      // 下载并缓存
      await this.cacheModelByGLTF(url, pwd);
      // 读取缓存
      const gltfResource = await this.indexedDbTools.select('model_gltf', 'url', `${url}`);
      // 加载
      gltf = await this.loadModelByCache(gltfResource, pwd);
      // // 加载完成之后,将gltf转为json,并存储在model_json表中
      // gltf = await this.resetOriginByGLTF(gltf, url);
    }

    Object.keys(this.modelBlob).forEach((str) => {
      URL.revokeObjectURL(this.modelBlob[str]);
    });
    return gltf;
  }

  // /**
  //  * @description: 根据gltf信息,重置原点,并转为json,存储到数据库中
  //  * @param {any} gltf
  //  * @param {string} id
  //  * @param {string} url
  //  * @return {*}
  //  * @author: 池樱千幻
  //  */
  // async resetOriginByGLTF(gltf: any, url: string): Promise<any> {
  //   // 获取gltf的名字,用于做主键和外键
  //   let id = url.split('/').pop();
  //   if (!id) {
  //     return;
  //   }
  //   console.time('json1');
  //   // 查询数据库中是否有该模型的json信息
  //   const jsonResource = await this.indexedDbTools.select('model_json', 'id', id);
  //   console.timeEnd('json1');
  //   if (jsonResource) {
  //     let { json, animationJson } = jsonResource as any;
  //     console.time('json');
  //     // 将json转换成Object3D对象
  //     const scene = await new THREE.ObjectLoader().parseAsync(json);
  //     // 将animationJson转换成AnimationClip对象
  //     const animations = animationJson.map((item: any) => THREE.AnimationClip.parse(item));
  //     console.timeEnd('json');
  //     return { scene, animations };
  //   } else {
  //     gltf.scene.traverse((obj: { updateMatrix: () => void }) => {
  //       obj.updateMatrix();
  //     });
  //     const json = gltf.scene.toJSON();
  //     const animationJson = gltf.animations.map((item: any) => {
  //       return item.toJSON();
  //     });

  //     await this.indexedDbTools.add('model_json', { id, url, json, animationJson });

  //     // 将json转换成Object3D对象
  //     const scene = await new THREE.ObjectLoader().parseAsync(json);
  //     // 将animationJson转换成AnimationClip对象
  //     const animations = animationJson.map((item: any) => THREE.AnimationClip.parse(item));

  //     return { scene, animations };
  //   }
  // }

  // /**
  //  * @description: 由于该文件会在workder中使用,所以需要判断当前环境
  //  * @param {Blob} blob
  //  * @return {*}
  //  * @author: 池樱千幻
  //  */
  // createObjectURL(blob: Blob | MediaSource) {
  //   if (self.window) {
  //     // 在主线程中
  //     return window.URL.createObjectURL(blob);
  //   } else {
  //     // 在 Worker 线程中
  //     return self.URL.createObjectURL(blob);
  //   }
  // }

  // /**
  //  * @description:  由于该文件会在workder中使用,所以需要判断当前环境
  //  * @param {string} url
  //  * @return {*}
  //  * @author: 池樱千幻
  //  */
  // revokeObjectURL(url: string) {
  //   if (self.window) {
  //     // 在主线程中
  //     return window.URL.revokeObjectURL(url);
  //   } else {
  //     // 在 Worker 线程中
  //     return self.URL.revokeObjectURL(url);
  //   }
  // }

  /**
   * @description: 初始化数据库
   * @return {*} 返回Promise对象
   * @author: 池樱千幻
   */
  dbInit() {
    return this.indexedDbTools.init();
  }

  /**
   * @description: 根据数据库查询到的gltfResource对象信息,加载数据
   * @param {*} gltfResource
   * @return {*}
   * @author: 池樱千幻
   */
  async loadModelByCache(gltfResource: any, pwd: string) {
    const modelBlob: any = {};
    let gltf: any = {};
    let blob = gltfResource.blob;

    // 解析blob对象中的字符串,转换json,如果成功,说明不需要解密,如果失败就解密
    let str = await gltfResource.blob.text();
    try {
      JSON.parse(str);
    } catch (error) {
      try {
        let json = getJsonByPwwd(str, pwd);
        var jsonStr = JSON.stringify(json, null, 2);
        // 字符串转换为blob对象
        blob = new Blob([jsonStr], { type: 'text/plain' });
      } catch (error) {
        console.error('密码错误!!');
      }
    }

    let gltfUrl = URL.createObjectURL(blob);
    modelBlob[gltfResource.id] = gltfUrl;
    const modelResource: any = await this.indexedDbTools.getAll('model');
    modelResource.forEach((item: { id: string | number; blob: BlobPart }) => {
      modelBlob[item.id] = URL.createObjectURL(new Blob([item.blob]));
    });
    this.modelBlob = modelBlob;
    gltf = await this.loadGLTF(gltfUrl, gltfResource.id, true);
    return gltf;
  }

  /**
   * @description: 加载gltf文件,返回解析后的对象
   * @param {*} gltfUrl gltf的url,可以是url路径,也可以是blob路径
   * @param {*} gltfId gltf的名字,用作id的读取
   * @param {*} isCache 是否使用缓存,false就不使用缓存
   * @param {*} isLocal 是否本地上传的文件
   * @return {*}
   * @author: 池樱千幻
   */
  loadGLTF(gltfUrl: string, gltfId: string | boolean, isCache?: boolean | undefined, isLocal?: boolean | undefined) {
    return new Promise((resolve) => {
      // 构建加载管理器
      const manager = new this.THREE.LoadingManager();
      if (isCache) {
        // 加载构造器中可以重新对下载的url进行修改.
        manager.setURLModifier((url: string) => {
          if (url.startsWith('data:') || url.startsWith('blob:')) {
            let uri = url.split('/').pop();
            let blobUrl = this.modelBlob[isLocal ? `${uri}` : `${gltfId}@-@${uri}`];
            if (blobUrl) {
              return blobUrl;
            } else {
              return url;
            }
          }
          return url;
        });
      }
      const loader = new this.GLTFLoader(manager);
      let dracoLoader = new DRACOLoader();

      // 判断当前是否是worker环境
      let decoderPath = './webgl/';
      if (self.window) {
        decoderPath = './webgl/';
      } else {
        decoderPath = '../../webgl/';
      }
      dracoLoader.setDecoderPath(decoderPath); // 设置public下的解码路径，注意最后面的/
      dracoLoader.setDecoderConfig({ type: 'js' }); //使用兼容性强的draco_decoder.js解码器
      dracoLoader.preload();
      loader.setDRACOLoader(dracoLoader);
      loader.load(gltfUrl, async (gltf: any) => {
        dracoLoader.dispose();
        resolve(gltf);
      });
    });
  }

  /**
   * @description: 根据路径列表,批量缓存模型
   * @param {*} list
   * @return {*}
   * @author: 池樱千幻
   */
  async cacheModelByGLTFList(list: string | any[]) {
    let promiseList = [];
    for (let i = 0; i < list.length; i++) {
      const url = list[i];
      promiseList.push(this.cacheModelByGLTF(url));
    }
    await Promise.all(promiseList);
  }

  /**
   * @description: 根据gltf 删除某一个模型的缓存
   * @param {*} gltfUrl
   * @return {*}
   * @author: 池樱千幻
   */
  async deleteModelByGLTF(gltfUrl: string) {
    let gltfName = gltfUrl.split('/').pop();
    // 删除gltf表
    await this.indexedDbTools.delete('model_gltf', (item) => {
      if (item.key === gltfName) {
        return true;
      }
      return false;
    });
    // 删除对应的model表
    await this.indexedDbTools.delete('model', (item) => {
      if (item.value.gltfId === gltfName) {
        return true;
      }
      return false;
    });
    return '删除成功!';
  }

  /**
   * @description: 清除缓存
   * @return {*}
   * @author: 池樱千幻
   */
  clearCache() {
    this.indexedDbTools.clearDB();
  }

  /**
   * @description: 下载gltf,并解析其中的json信息,找出需要下载的文件(bin,图片等),下载之后,存到indexeddb中
   * @param {*} url
   * @param {*} pwd 用于解密的密码
   * @return {*}
   * @author: 池樱千幻
   */
  async cacheModelByGLTF(url: string, pwd?: string): Promise<any> {
    if (!this.cache) {
      return;
    }

    // 判断是否有当前模型,如果没有就添加
    if (!this.fileDownLoadProgress[url]) {
      this.modelsFlag[url] = false;
      this.fileDownLoadProgress[url] = this.reactive();
    }

    // 获取gltf的名字,用于做主键和外键
    let gltfName = url.split('/').pop();
    if (!gltfName) {
      return;
    }
    // 判断文件是否缓存,如果缓存,判断文件是否是最新的.
    const gltfResource = await this.indexedDbTools.select('model_gltf', 'url', `${url}`);
    if (gltfResource) {
      let changeModleList = await checkModelChange(this.indexedDbTools);
      if (changeModleList.length > 0) {
        for (let i = 0; i < changeModleList.length; i++) {
          console.log(`模型${changeModleList[i].modelData.id},有更新, 删除模型文件1.`);
          await this.deleteModelByGLTF(changeModleList[i].modelData.url);
        }
      } else {
        // 当前模型是最新的,不需要重新请求.
        console.log(`${url}模型,不需要更新`);
        this.modelsFlag[url] = true;
        return gltfResource;
      }
    }
    let fileType = url.split('.').pop();
    if (fileType === 'zip') {
      let zipSize = await getFileSizeByUrlList([url]);
      this.fileDownLoadAllSize[url] = zipSize;
      // 下载zip
      let zipObj: any = await this.loadAsBlob(url, 'blob', url);

      let domSpan = document.getElementById('cache-loading-span');
      if (domSpan) domSpan.innerHTML = `模型下载完成,解压中...`;
      // 解压
      let zipModleFileBlob = await loadGltfByZip(zipObj.blob);
      let gltfModel = zipModleFileBlob.gltf; // window.URL.createObjectURL(zipModleFileBlob.gltf.blob);
      let modleFiles = zipModleFileBlob.modleFiles;
      await this.indexedDbTools.add('model_gltf', {
        id: gltfName,
        url,
        blob: gltfModel.blob,
        fileSize: zipSize, // 这里记录了zip的大小,而不是gltf的大小
        type: 'zip',
      });
      for (let key in modleFiles) {
        let blob = modleFiles[key];
        let file: any = key.split('/').pop();
        await this.indexedDbTools.add('model', { blob, url: key, fileSize: blob.size, gltfId: gltfName, id: `${gltfName}@-@${encodeURIComponent(file)}` });
      }

      this.modelsFlag[url] = true;
    } else {
      // 获取gltf的json信息
      let { blob: gltfJson, fileSize: gltfSize }: any = await this.loadAsBlob(url, 'text');
      let gltfpwdStr;
      // 给结果转换成json,如果成功,说明一切正常,不成功说明有加密
      try {
        gltfJson = JSON.parse(gltfJson);
      } catch (error) {
        if (pwd) {
          gltfpwdStr = gltfJson;
          gltfJson = getJsonByPwwd(gltfJson, pwd);
        }
      }

      let urlPrefix = url.replace(gltfName, '');
      // 找到所有需要下载的文件
      let fileList: any = {};
      if (gltfJson.hasOwnProperty('buffers')) {
        // bin文件
        gltfJson.buffers.forEach((item: { uri: string | number }) => {
          fileList[item.uri] = {
            id: `${gltfName}@-@${item.uri}`,
            gltfId: gltfName,
          };
        });
      }
      if (gltfJson.hasOwnProperty('images')) {
        // images文件
        gltfJson.images.forEach((item: { uri: string | number }) => {
          fileList[item.uri] = {
            id: `${gltfName}@-@${item.uri}`,
            gltfId: gltfName,
          };
        });
      }
      let fileDownLoadPromiseList = [];
      let fileUrlList = [];
      // 循环文件列表,下载并存储 forEach 中返回的async ,是假的,只要第一个返回了,就算完成了,会有bug,这里必须用for
      for (let i = 0; i < Object.keys(fileList).length; i++) {
        const key = Object.keys(fileList)[i];
        let fileDownLoadPromise = new Promise<void>((resolve, reject) => {
          this.loadAsBlob(`${urlPrefix}${key}`, 'blob', url)
            .then(({ blob, fileSize }: any) => {
              return this.indexedDbTools.add('model', Object.assign({}, fileList[key], { blob, url: `${urlPrefix}${key}`, fileSize }));
            })
            .then(() => {
              resolve();
            })
            .catch((err) => {
              reject(err);
            });
        });
        fileUrlList.push(`${urlPrefix}${key}`);
        fileDownLoadPromiseList.push(fileDownLoadPromise);
      }
      this.fileDownLoadAllSize[url] = await getFileSizeByUrlList(fileUrlList);
      await Promise.all(fileDownLoadPromiseList);
      // 将gltf的json文件转为字符串
      var gltfJsonContent = gltfpwdStr || JSON.stringify(gltfJson, null, 2);
      // 字符串转换为blob对象
      var gltfJsonBlob = new Blob([gltfJsonContent], { type: 'text/plain' });
      await this.indexedDbTools.add('model_gltf', {
        id: gltfName,
        url,
        blob: gltfJsonBlob,
        fileSize: gltfSize,
        type: 'gltf',
      });
      this.modelsFlag[url] = true;
    }
  }

  /**
   * @description: 根据url下载对应类型的文件
   * @param {*} url 需要下载的url
   * @param {*} responseType 下载后的类型
   * @param {*} gltfUrl
   * @return {*}
   * @author: 池樱千幻
   */
  loadAsBlob(url: string, responseType: any = 'blob', gltfUrl?: string) {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      if (responseType === 'blob' && gltfUrl) {
        this.fileDownLoadProgress[gltfUrl][url] = 0;
      }
      xhr.open('GET', url);
      xhr.responseType = responseType;
      xhr.onerror = function () {
        reject('Network error.');
      };
      xhr.onload = function () {
        if (xhr.status === 200) {
          let fileSize = xhr.getResponseHeader('Content-Length');
          resolve({ blob: xhr.response, fileSize });
        } else {
          reject('Loading error:' + xhr.statusText);
        }
      };
      xhr.onprogress = (event) => {
        // gltf是个json,不需要计算下载量
        if (responseType === 'blob') {
          if (event.lengthComputable && gltfUrl) {
            this.fileDownLoadProgress[gltfUrl][url] = event.loaded;
          }
        }
      };
      xhr.send();
    });
  }

  reactive(target = {}) {
    // 不是对象、数组直接返回
    if (typeof target !== 'object' || target == null) {
      return target;
    }
    const proxyConfig = {
      set(target: any, key: string | symbol, val: any, receiver: any) {
        if (val === target[key]) {
          return true;
        }
        /* 可监听到新增的key */
        const ownKeys = Reflect.ownKeys(target);
        if (ownKeys.includes(key)) {
          // 已有的可以
          // console.log('修改val: ', val, key, JSON.stringify(target));
        } else {
          // 新增的key
          // console.log('新增的key', key);
        }
        // watch 返回三个参数, 改变的key,改变的值,改变前值
        const result = Reflect.set(target, key, val, receiver);
        if (observed.$watch && key !== '$watch') {
          observed.$watch({
            key,
            value: val,
            oldTarget: target,
          });
        }
        return result;
      },
    };
    // 生成代理对象
    const observed = new Proxy(target, proxyConfig);
    return observed;
  }
}

export default webGLModelCache;
