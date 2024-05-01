
# 模型缓存及加密
为了解决远程加载模型时间长，文件大的问题。采用浏览器indexedDB数据库对模型文件进行缓存，加载一次之后将模型缓存在浏览器中，之后再次读取模型直接从缓存中读取，不再通过网络进行加载。    
同时为了防止其他人通过静态资源连接或直接读取indexedDB数据库将GLTF模型文件直接盗走。在生成GLTF的时候，采用Crypto进行加密。在读取的时候通过密码进行解密。从而防止模型文件被盗用。