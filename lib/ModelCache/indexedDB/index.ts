/*
 * @Description:
 * @Autor: 池樱千幻
 * @Change: 池樱千幻
 * @Date: 2021-11-26 13:22:22
 * @LastEditTime: 2023-04-24 09:51:38
 */
import config from './config';
let DBConnection: IDBFactory;
if (self.window) {
  // 在主线程中
  DBConnection = window.indexedDB;
} else {
  // 在 Worker 线程中
  DBConnection = indexedDB;
}

class IndexedDbTools {
  idbRequest: IDBOpenDBRequest;
  databaseName: string;
  version: number;
  db: any;
  constructor(databaseName = config.databaseName, version = config.version) {
    this.databaseName = databaseName;
    this.version = version;
    this.db = null;
  }
  init() {
    return new Promise<void>((resolve, reject) => {
      this.idbRequest = DBConnection.open(this.databaseName, this.version);
      this.idbRequest.onerror = (event) => {
        reject(event);
      };
      this.idbRequest.onupgradeneeded = this.upgradeneeded;
      this.idbRequest.onsuccess = (event: any) => {
        this.db = event?.target?.result;
        resolve();
      };
    });
  }
  upgradeneeded(event: any) {
    console.log('数据库升级', event, event.oldVersion);
    if (event.oldVersion !== 0) {
      DBConnection.deleteDatabase('threeJSCacheModel');
    }
    this.db = event.target.result;
    config.tables.forEach((item) => {
      let objectStore: any = null;
      // 如果有当前表,就读取表,如果没有就创建
      if (!this.db.objectStoreNames.contains(item.tableName)) {
        objectStore = this.db.createObjectStore(item.tableName, {
          keyPath: item.keyPath,
        });

        item.columns.forEach((columns) => {
          objectStore.createIndex(columns.name, columns.name, {
            unique: columns.unique,
          });
        });
      }
    });
  }
  clearDB() {
    DBConnection.deleteDatabase('threeJSCacheModel');
  }

  loadDBInit() {
    return new Promise<void>((resolve) => {
      if (!this.db) {
        this.init().then(() => {
          resolve();
        });
      } else {
        resolve();
      }
    });
  }

  delete(tableName: any, cb: (arg0: any) => any) {
    return new Promise<void>(async (resolve, reject) => {
      await this.loadDBInit();
      let request = this.db.transaction([tableName], 'readwrite').objectStore(tableName).openCursor();
      request.onsuccess = function (event: any) {
        var cursor = event.target.result;
        if (cursor) {
          if (cb && cb(cursor)) {
            cursor.delete();
          }
          cursor.continue();
        } else {
          resolve();
        }
      };
      request.onerror = function (event: any) {
        reject(event);
      };
    });
  }

  add(tableName: any, data: any) {
    return new Promise(async (resolve, reject) => {
      await this.loadDBInit();
      let request = this.db.transaction([tableName], 'readwrite').objectStore(tableName).add(data);
      request.onsuccess = function (event: any) {
        resolve(event);
      };
      request.onerror = function (event: any) {
        reject(event);
      };
    });
  }

  update(tableName: any, data: any) {
    return new Promise<void>(async (resolve, reject) => {
      await this.loadDBInit();
      var request = this.db.transaction([tableName], 'readwrite').objectStore(tableName).put(data);
      request.onsuccess = function (event: any) {
        console.log('数据更新成功', event);
        resolve();
      };
      request.onerror = function (event: any) {
        console.log('数据更新失败', event);
        reject();
      };
    });
  }

  getAll(tableName: any) {
    return new Promise(async (resolve) => {
      await this.loadDBInit();
      var objectStore = this.db.transaction(tableName).objectStore(tableName);
      let list: any = [];
      objectStore.openCursor().onsuccess = function (event: any) {
        var cursor = event.target.result;
        if (cursor) {
          list.push(cursor.value);
          cursor.continue();
        } else {
          resolve(list);
        }
      };
    });
  }

  select(tableName: any, columnsName: string, condition: any) {
    return new Promise(async (resolve, reject) => {
      await this.loadDBInit();
      var transaction = this.db.transaction([tableName], 'readonly');
      var request = null;
      if (columnsName == 'id') {
        request = transaction.objectStore(tableName).get(condition);
      } else {
        request = transaction.objectStore(tableName).index(columnsName).get(condition);
      }
      request.onsuccess = function (e: any) {
        var result = e.target.result;
        resolve(result);
      };
      request.onerror = function (e: any) {
        reject(e);
      };
    });
  }
}

export default IndexedDbTools;
