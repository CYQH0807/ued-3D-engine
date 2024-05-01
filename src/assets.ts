/*
 * @Description: 资源库
 * @Autor: 池樱千幻
 * @Change: 池樱千幻
 * @Date: 2023-03-15 17:21:38
 * @LastEditTime: 2023-07-31 09:27:10
 * @Description: 资源库中的数据以mainModel为主模型
 *
 */
export default {
  topography: [],
  tree: [{ name: 'mainModel', source: './webgl/model/tree/tree.gltf', type: 'model', password: 'uedpwwdD12345GC1' }],
  main: [
    { name: 'mainModel', source: './webgl/model/factory/D12345GC.gltf', type: 'model', password: 'uedpwwdD12345GC1' },
    // // { name: 'background', source: './blouberg_sunrise_2_1k.hdr', type: 'HDR' }, // 通过类型为HDR来加载环境贴图
    // // { name: 'environment', source: './blouberg_sunrise_2_1k.hdr', type: 'HDR' },
    { name: 'QTModel', source: './webgl/model/factory/D12345GCQT.gltf', type: 'model', password: 'uedpwwdD12345GC1', hidden: true },

    // { name: 'mainModel', source: './webgl/model/factory/D1GC.gltf', type: 'model', password: 'uedpwwdD1GC12345' },
    // { name: 'mainModel', source: './webgl/model/factory/D2GC.gltf', type: 'model', password: 'uedpwwdD2GC12345' }
  ],

  // main: [
  //   { name: 'toolsModel', source: './webgl/model/tools/tools.gltf', type: 'model', password: 'uedpwwdD5GC12345' },
  //   { name: 'mainModel', source: './webgl/model/minMap/xiaoditu.gltf', type: 'model', password: 'uedpwwdD12345GC2' },
  //   { name: 'spotLight', source: './webgl/model/minMap/lightInfo.gltf', type: 'light' },
  //   // { name: 'mainModel', source: './webgl/model/ttt/D5GC.gltf', type: 'model', password: 'uedpwwdD5GC12345' },
  // ],
  miniMap: [
    { name: 'miniMap', source: './webgl/model/minMap/xiaoditu.gltf', type: 'model', password: 'uedpwwdD12345GC2' },
    { name: 'spotLight', source: './webgl/model/minMap/lightInfo.gltf', type: 'light' },
  ],
  D1GC: [{ name: 'mainModel', source: './webgl/model/factory/D1GC.gltf', type: 'model', password: 'uedpwwdD1GC12345' }],
  D2GC: [{ name: 'mainModel', source: './webgl/model/factory/D2GC.gltf', type: 'model', password: 'uedpwwdD2GC12345' }],
  D3GC: [{ name: 'mainModel', source: './webgl/model/factory/D3GC.gltf', type: 'model', password: 'uedpwwdD3GC12345' }],
  D4GC: [{ name: 'mainModel', source: './webgl/model/factory/D4GC.gltf', type: 'model', password: 'uedpwwdD4GC12345' }],
  D5GC: [{ name: 'mainModel', source: './webgl/model/factory/D5GC.gltf', type: 'model', password: 'uedpwwdD5GC12345' }],
};
