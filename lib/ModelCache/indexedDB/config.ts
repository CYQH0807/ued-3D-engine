/*
 * @Description:
 * @Autor: 池樱千幻
 * @Change: 池樱千幻
 * @Date: 2021-11-26 13:22:30
 * @LastEditTime: 2023-04-23 20:50:45
 */
export default {
  databaseName: "threeJSCacheModel",
  version: 3,
  tables: [
    // 模型内容表
    {
      tableName: "model",
      keyPath: "id",
      columns: [
        // gltf的id
        {
          name: "gltfId",
          unique: false,
        },
        {
          name: "url",
          unique: false,
        },
        {
          name: "fileSize",
          unique: false,
        },
        {
          name: "blob",
          unique: false,
        }
      ],
    },
    // 模型信息表
    {
      tableName: "model_gltf",
      keyPath: "id",
      columns: [
        // gltf的url
        {
          name: "url",
          unique: false,
        },
        // gltf转json生成的blob
        {
          name: "blob",
          unique: false,
        },
        {
          name: "fileSize",
          unique: false,
        },
        {
          name: "type",
          unique: false,
        }
      ],
    },
  ],
};
