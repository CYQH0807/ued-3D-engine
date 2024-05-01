/**
 * @description: 引擎初始化的option
 * @return {*}
 * @author: 池樱千幻
 */
export interface EngineOption {
  /**
   * @description: 场景的根节点
   * @return {*}
   * @author: 池樱千幻
   */
  targetElement: HTMLElement | null | undefined;
  /**
   * @description: 小地图的根节点
   * @return {*}
   * @author: 池樱千幻
   */
  miniTargetElement?: HTMLElement | null | undefined;
  /**
   * @description: 场景的配置文件
   * @return {*}
   * @author: 池樱千幻
   */
  configKey: string;
  /**
   * @description: 小地图的配置文件
   * @return {*}
   * @author: 池樱千幻
   */
  miniMapConfigKey?: string;
  /**
   * @description: 是否开启调试模式
   * @return {*}
   * @author: 池樱千幻
   */
  isDebug?: boolean;
  /**
   * @description: 当前场景的类型
   * @return {*}
   * @author: 池樱千幻
   */
  type?: string;
  /**
   * @description: 当前项目的总配置文件
   * @return {*}
   * @author: 池樱千幻
   */
  config: any;
  /**
   * @description: 当前项目的资源文件
   * @return {*}
   * @author: 池樱千幻
   */
  assets: any;

  /**
   * @description: 是否通过请求获取配置文件
   * @return {*}
   * @author: 池樱千幻
   */
  isQueryConfig?: boolean;
}


// 主场景的配置
/**
 * @description: 
 * @return {*}
 * @author: 池樱千幻
 */
export interface MainConfig {
  /**
   * @description: 场景的根节点
   * @return {*}
   * @author: 池樱千幻
   */
  targetElement: HTMLElement | null | undefined;
  /**
   * @description: 场景的配置文件
   * @return {*}
   * @author: 池樱千幻
   */
  configKey: string;
  /**
   * @description: 是否开启调试模式
   * @return {*}
   * @author: 池樱千幻
   */
  isDebug: boolean;
  /**
   * @description: 当前场景的类型
   * @return {*}
   * @author: 池樱千幻
   */
  type: string;

}
