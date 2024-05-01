// import THREE from '../Utils/three';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
// import IndexedDbTools from '../ModelCache/indexedDB';
// let indexedDbTools = new IndexedDbTools();
// import { manager } from "./helper/manager";
// import { genAnimations, genGroupStruct } from './helper/parseModel';
// import { undergroundsCheck } from "./helper/undergroundCheck";
// import acter from "../../assets/model/acter.glb";
// import plain from "../../assets/model/plain.glb";
// import grove from "../../assets/model/grove.glb";
// import treasureChest from "../../assets/model/treasureChest.glb";

import ModelCache from '../ModelCache';

const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderConfig({ type: 'js' });
dracoLoader.setDecoderPath('../../webgl/'); // 设置public下的解码路径，注意最后面的/
const gltfLoader = new GLTFLoader();
gltfLoader.setDRACOLoader(dracoLoader);

// /**
//  * 监听主线程发来的数信息
//  */
onmessage = function (e) {
  switch (e.data.work_type) {
    case 'test_connect':
      postMessage({
        msg: '连接成功',
        // THREE: new THREE.Vector3(),
      });
      break;
    case 'start':
      postMessage({
        msg: '初始化',
        work_type: 'log',
        undergroundParams: e.data.undergroundParams,
      });
      // undergroundsCheck.update(e.data.undergroundParams);
      break;
    case 'calculate':
      // calculate(e);
      break;
    case 'modelParse':
      // modelLoad(e.data.url);
      loadJson(e.data.name);
      break;
  }
};
async function loadJson(name: string) {
  console.log('name: ', name);

  let modelCache = new ModelCache();
  let gltf = await modelCache.loadModel('./webgl/model/factory/D12345GC.gltf', '');

  gltf.scene.traverse((obj: { updateMatrix: () => void }) => {
    obj.updateMatrix();
  });

  gltf.scene.animations = gltf.animations;
  let json = gltf.scene.toJSON();
  console.log('json: ', json);
  // let data: any = await indexedDbTools.select('model_gltf', 'id', name);
  // console.log('data: ', data);

  // return postMessage({
  //   work_type: 'parseModel',
  //   ...data,
  //   // ...genGroupStruct(gltf.scene),
  //   // sceneAnimations: genAnimations(gltf.animations),
  // });
}

// function modelLoad(modelUrl: string) {
//   gltfLoader.load(
//     `../..${modelUrl}`,
//     (gltf) => {
//       console.log('gltf: ', gltf);

//       gltf.scene.traverse((obj) => {
//         obj.updateMatrix();
//       });

//       gltf.scene.animations = gltf.animations;
//       console.log('gltf.scene: ', gltf.scene);
//       let json = gltf.scene.toJSON();
//       json.images.forEach((item: { url: string }) => {
//         item.url = 'https://gitee.com/static/images/logo-black.svg?t=158106664';
//       });
//       return postMessage({
//         modelUrl,
//         json: json,
//         work_type: 'parseModel',
//         // ...genGroupStruct(gltf.scene),
//         // sceneAnimations: genAnimations(gltf.animations),
//       });
//     },
//     undefined,
//     (err) => {
//       console.log('err: ', err);
//       postMessage({ msg: 'Worker 模型加载错误！' + modelUrl });
//     }
//   );
// }

/**
 * 外部程序控制人物跳跃
 */
export {};
