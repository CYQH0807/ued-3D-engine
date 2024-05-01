// let CryptoJS = require('crypto-js');
import CryptoJS from "crypto-js";

/**
 * iv 是密钥偏移量，这个一般是接口返回的，或者前后端协定一致。
 *由于对称解密使用的算法是 AES-128-CBC算法，数据采用 PKCS#7 填充 ， 因此这里的 key 需要为16位
 */
//16位16进制数作为密钥
const KEY = CryptoJS.enc.Utf8.parse('1234123412ABCDEF');
const IV = CryptoJS.enc.Utf8.parse('ABCDEF1234123412');

export default {
  /**
   * AES加密 ：字符串 key iv  返回base64
   */
  encrypt(word: any, keyStr: string) {
    let key = KEY;
    let iv = IV;

    if (keyStr) {
      key = CryptoJS.enc.Utf8.parse(keyStr);
      iv = CryptoJS.enc.Utf8.parse(keyStr.split('').reverse().join(""));
    }

    const srcs = CryptoJS.enc.Utf8.parse(word);
    var encrypted = CryptoJS.AES.encrypt(srcs, key, {
      iv: iv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.ZeroPadding,
    });
    // console.log("-=-=-=-", encrypted.ciphertext)
    return CryptoJS.enc.Base64.stringify(encrypted.ciphertext);
  },
  /**
   * AES 解密 ：字符串 key iv  返回base64
   *
   */
  decrypt(word: string, keyStr: string) {
    word = (word + '').replace(/\s+/g, '') //增加这一行，将换行符替换为空
    let key = KEY;
    let iv = IV;

    if (keyStr) {
      key = CryptoJS.enc.Utf8.parse(keyStr);
      iv = CryptoJS.enc.Utf8.parse(keyStr.split('').reverse().join(""));
    }

    const base64 = CryptoJS.enc.Base64.parse(word);
    const src = CryptoJS.enc.Base64.stringify(base64);

    var decrypt = CryptoJS.AES.decrypt(src, key, {
      iv: iv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.ZeroPadding,
    });

    var decryptedStr = decrypt.toString(CryptoJS.enc.Utf8);
    return decryptedStr.toString();
  },
};
