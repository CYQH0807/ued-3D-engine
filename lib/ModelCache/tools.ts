import JSZip from 'jszip';
import cryptoJS from './cryptoJS';
/**
 * @description: 根据url获取总文件大小合计
 * @param {*} fileList
 * @return {*}
 * @author: 池樱千幻
 */
export let getFileSizeByUrlList = async (fileList: any[]) => {
  let fileListSize = [];
  try {
    fileListSize = await Promise.all(fileList.map((key) => getFileSizeByUrl(key)));
  } catch (e) {
    return false;
  }
  return fileListSize.reduce(function (total: number, value) {
    return total + Number(value);
  }, 0);
};
/**
 * @description: 根据url获取文件大小,通过HEAD请求
 * @param {*} url
 * @return {*}
 * @author: 池樱千幻
 */
export let getFileSizeByUrl = (url: string | URL) => {
  return new Promise((resolve, reject) => {
    var xhr = new XMLHttpRequest();
    xhr.open('HEAD', url, true); // 也可用POST方式
    xhr.onreadystatechange = () => {
      if (xhr.readyState == 4) {
        if (xhr.status == 200) {
          let fileSize = xhr.getResponseHeader('Content-Length');
          resolve(fileSize);
        } else {
          reject(xhr.status);
        }
      }
    };
    xhr.onerror = (err) => {
      console.log('err: ', err);
    };

    xhr.send();
  });
};

/**
 * @description: 重新请求当前模型的大小, 如果发现大小有变化 ,说明当前模型有更新, 准备重新下载模型
 * @param {*} dbTools
 * @param {*} gltfUrl
 * @return {*}
 * @author: 池樱千幻
 */
export let checkModelChange = async (dbTools: { getAll: (arg0: string) => any; }) => {
  // 逐步校验文件列表, 先校验gltf,如果gltf都变化了, 直接请求新文件.
  let gltfList = await dbTools.getAll('model_gltf');
  let gltfCheckPromiseList = await Promise.all(gltfList.map((item: any) => checkFile(item)));
  let changeModleList = gltfCheckPromiseList.filter((item) => !item.flag);
  return changeModleList;
};

// 校验文件大小或md5
export let checkFile = async (modelData: { fileSize: any; url: string | URL; }) => {
  let oldSize = modelData.fileSize;
  let newSize = oldSize;
  try {
    newSize = await getFileSizeByUrl(modelData.url);
  } catch (error) { }

  if (oldSize == newSize) {
    return { flag: true };
  } else {
    return { flag: false, modelData };
  }
};

/**
 * @description: 根据下载后的zipBlob,解压,并解析zip中的模型文件.
 * @param {*} zipObj
 * @param {*} folderName
 * @param {*} dbTools
 * @return {*}
 * @author: 池樱千幻
 */
export let loadGltfByZip = async (blob: any) => {
  var zip: any = new JSZip();
  let { files: zipFiles } = await zip.loadAsync(blob);
  let modleFiles: any = {};
  let gltf: any = {};
  for (let key in zipFiles) {
    // 排除文件夹,和mac特有的两类文件
    if (key.indexOf('.DS_Store') === -1 && key.indexOf('__MACOSX') === -1 && !zipFiles[key].dir) {
      let content = await zip.file(key).async('arraybuffer');
      if (key.indexOf('.gltf') > -1) {
        gltf.name = key;
        gltf.blob = new Blob([content]);
      } else {
        modleFiles[key] = new Blob([content]);
      }
    }
  }

  return { gltf, modleFiles };
};

/**
 * @description: 解密pwd
 * @param {*} str
 * @param {*} pwd
 * @return {*}
 * @author: 池樱千幻
 */
export let getJsonByPwwd = (str: string, pwd: string) => {
  try {
    // 为了兼容旧版,先判断新的字符串,如果为-1,再判断老的字符.
    let index = str.lastIndexOf('##kyou##');
    if (index === -1) {
      index = str.lastIndexOf('kyou');
    }
    let pwdTxt = str.substring(0, index);
    let pwwdStr = cryptoJS.decrypt(pwdTxt, pwd);
    let end = str.substring(index + 4);
    return JSON.parse(pwwdStr + end);
  } catch (error) {
    console.error('密码错误!!');
  }
};
