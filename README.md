

# 三维引擎开发
目前的三维引擎是基于threejs-145版本，进行的优化与开发。对源码进行了改动以便于优化性能以及丰富功能。   
- [三维引擎开发](#三维引擎开发)
	- [基础场景创建](#基础场景创建)
		- [场景、渲染器](#场景渲染器)
		- [相机](#相机)
		- [控制器](#控制器)
		- [事件监听](#事件监听)
		- [资源加载器](#资源加载器)
		- [世界场景构建器](#世界场景构建器)
		- [辅助对象](#辅助对象)
		- [辉光工具类](#辉光工具类)
	- [配置功能加载](#配置功能加载)
	- [动画类扩展](#动画类扩展)
	- [模型缓存及加密](#模型缓存及加密)
	- [巡游](#巡游)
		- [旧版功能（轨道交通项目）](#旧版功能轨道交通项目)
		- [新版功能](#新版功能)
		- [对比新老功能](#对比新老功能)
	- [小地图创建](#小地图创建)
- [计划与后续](#计划与后续)
## 基础场景创建
包括场景、相机、渲染器、控制器、事件监听、资源加载器、世界场景构建器、辅助对象、辉光工具类。   
### 场景、渲染器
基础场景与渲染器的创建，采用threejs的场景与渲染器。修改threejs渲染器的源码，删除了原本的透明物体双倍渲染的代码，提高了性能
### 相机
通过扩展创建动态相机，使相机可以在巡游相机与主相机之间进行自由的切换。
### 控制器
采用threejs的轨道控制器，扩展了一个聚焦到当前物体的方法。

### 事件监听
针对场景以及小地图，分别监听了单击，双击，鼠标移动，鼠标按下，鼠标抬起，键盘按下，窗口变化以及当前窗口是否可见。   
`单击，双击`采用了300ms的时间间隔进行了区分。   
`窗口变化`用于动态适配各种分辨率。   
`当前窗口是否可见` 可以在用户切换到其他页面，以及缩小浏览器的时候，对场景不进行渲染，提高性能。
 
 ### 资源加载器
 用于加载多个GLTF模型文件，可以根据需要，进行多个模型的组装和拆分，从而更加灵活的配置当前场景。

### 世界场景构建器
将资源，动画，辅助类在此构建与合并。

### 辅助对象
用于编辑部分材质、物体与灯光的辅助对象的加载，用于配置功能的加载，辅助开发与建模。在实际生产引用中不会加载此类对象。

### 辉光工具类
通过threejs提供的后期渲染功能，对当前场景进行重新渲染，使得某些物体拥有辉光效果。   
`注：辉光会对当前场景进行5次渲染，会使得性能急剧下降。`


## 配置功能加载
通过页面加载GLTF模型，可以通过可视化的方式对模型、场景以及通用功能进行配置。采用json进行加载，可以让模型的整体效果以更加直观的方式进行配置。  
目前可配置的信息如下：  
```
[
  'dirLightColor', // 平行光颜色
  'dirLightIntensity', // 平行光强度
  'dirLightPosition', // 平行光位置
  'dirLightTargtPosition', // 平行光目标位置
  'hemiLightColor', // 半球光地面颜色
  'hemiLightGroundColor', // 半球光天空颜色
  'hemiLightIntensity', // 半球光强度
  'hemiLightPosition', // 半球光位置
  'ambientLightColor', // 环境光颜色
  'ambientLightIntensity', // 环境光强度
  'isBkgColor', // canvas容器是否使用背景色
  'bkgColor', // canvas容器背景颜色
  'physicallyCorrectLights', // 物理灯
  'environmentLight', // 环境贴图光
  'isShadow', // 阴影
  'cameraFov', // 摄像机视锥体垂直视野角度
  'cameraPosition', // 相机位置
  'cameraTargetPosition', // 相机看向的位置
  'modelTriggerType', // 模型触发的方式, 双击或单击
  'animationOn', // 是否开启动画
  'controlsEnablePan', // 是否允许平移
  'controlsEnableRotate', // 是否允许旋转,
  'controlsEnableZoom', // 是否允许缩放
  'controlsMinDistance', // 相机向内移动的距离
  'controlsMaxDistance', // 相机向外移动的距离
  'controlsMaxPolarAngle', // 垂直旋转角度的上限
  'controlsMinPolarAngle', // 垂直旋转角度的下限
  'isMiniMapLinkage', // 小地图是否联动
]
```

## 动画类扩展
根据GLTF内的动画信息，重新扩展了threejs的动画方法与属性。  
属性支持：`开始`、`暂停`、`停止`、`倍速`和`百分比进度`。

以下的7类动画方法可以满足目前的需求。
- `启动动画循环  `
- `启动动画一次不循环`
- `启动动画一次后复位`
- `活套百分比`
- `模型隐藏`（待开发）
- `模型闪烁`（待开发）
- `模型动画倒放`


## 模型缓存及加密
为了解决远程加载模型时间长，文件大的问题。采用浏览器indexedDB数据库对模型文件进行缓存，加载一次之后将模型缓存在浏览器中，之后再次读取模型直接从缓存中读取，不再通过网络进行加载。    
同时为了防止其他人通过静态资源连接或直接读取indexedDB数据库将GLTF模型文件直接盗走。在生成GLTF的时候，采用Crypto进行加密。在读取的时候通过密码进行解密。从而防止模型文件被盗用。



## 巡游
此功能相比之前的巡游模式，线路和相机更加灵活，视觉效果更加直观。   
### 旧版功能（轨道交通项目） 
采用点位的方式，在blender中使用动画的方式先创建一条线路，再通过blender脚本将动画的点位导出，再将点位进行贝塞尔化。在threejs中创建一条曲线，根据曲线上的点，移动相机的位置，每次移动，让相机看向下一个点，从而实现一个巡游的线路以及功能。

### 新版功能
在blender中创建一个相机，并且对相机进行动画，将其导出为GLTF信息，在引擎中加载。需要巡游时，切换到动画相机，采用动画的扩展方法，进行动画的播放。


### 对比新老功能   
`旧版功能`：既需要blender动画的创建，点位的导出，又需要在threejs中进行二次开发。并且无法自由控制进度。为了使巡游线路转弯更加平滑，采用了每次移动看向下一个点位的方式，造成了无法灵活控制相机在关注的点位看向某些固定或移动的位置。   
`新版功能`：采用相机动画，既能重复利用动画的扩展功能实现巡游的倍速，百分比播放，又可以不受线路平滑的影响，更加灵活的控制相机看向的目标位置。   
举例说明：   
旧版只能看向巡游线路，新版可以边走边扭头。

## 小地图创建
采用与基础场景一样的模式，在某一块区域内创建另一个场景。用于加载大型场景内的小地图，或者更精细的设备级模型。


# 计划与后续
目前计划持续优化模型加载与渲染，扩展资产库等。需要有计算机图形学的知识，三维世界中最为重要的是`着色器`，目前我们拥有的只能抄别人写好的功能，修改一些颜色等。对于改造甚至自行实现着色器效果，仍然无法实现。   

- [ ] 1. 针对模型的加载，想要采用多线程的方式，充分利用CPU，实现模型快速加载。但是目前尝试过，还未成功。
- [ ] 2.将常见的、使用过的一些着色器材质进行收集，形成自有的资产库，积累素材。
- [ ] 3.将引擎类库化，充分保护源码。（目前缓存和加密已经完成了类库的上传）
- [ ] 4.加强对计算机图形学的学习，学习着色器的实现与思路。
- [ ] 5.引擎api文档，让更多的开发人员可以自由的调用，学习与开发数字孪生。
- [ ] 6.更多...

