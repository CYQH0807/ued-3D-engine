export default {
  plugins: {
    '@vuepress/medium-zoom': {
      selector: 'img.zoom-custom-imgs',
      // medium-zoom options here
      // See: https://github.com/francoischalifour/medium-zoom#options
      options: {
        margin: 16,
      },
    },
  },

  // 网站标题
  title: 'UED-3D-ENGINE',
  // 网站描述
  description: 'UED三维引擎',
  // 打包目录
  dest: './ued-3D-engine-docs',
  head: [
    // 添加图标
    ['link', { rel: 'icon', href: '/vite.svg' }],
  ],
  themeConfig: {
    // 获取每个文件最后一次 git 提交的 UNIX 时间戳(ms)，同时它将以合适的日期格式显示在每一页的底部
    // lastUpdated: 'Last Updated', // string | boolean
    // 启动页面丝滑滚动
    smoothScroll: true,
    // 导航栏配置
    nav: [
      // { text: '我的个人网站', link: 'https://www.cooldream.fun/home' },
      // { text: '掘金', link: 'https://juejin.cn/user/1855631359481847/posts' },
      // { text: 'Github', link: 'https://github.com/Jack-Star-T' },
    ],
    sidebar: {
      '/': getSidebar(),
    },
  },
};

function getSidebar() {
  return [
    {
      text: 'UED三维引擎',
      collapsed: false,
      items: [
        { text: '介绍', link: '/' },
        { text: '基础场景创建', link: '/basicScene' },
        { text: '配置功能加载', link: '/configureFeatureLoad' },
        { text: '动画类扩展', link: '/animation' },
        { text: '模型缓存及加密', link: '/modelCache' },
        { text: '巡游', link: '/cruise' },
        { text: '小地图创建', link: '/miniMap' },
        { text: '计划与后续', link: '/planningAndFollowUp' },
      ],
    },

    {
      text: 'API文档',
      collapsed: false,
      items: [
        { text: '结构与目录', link: '/API/' },
      ],
    },
  ];
}
