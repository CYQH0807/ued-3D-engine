import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router';

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    name: 'Home',
    component: () => import('./views/home.vue'),
  },
  {
    path: '/demo',
    name: 'demo',
    component: () => import('./views/demo.vue'),
  },
  {
    path: '/miniMap',
    name: 'miniMap',
    component: () => import('./views/miniMap.vue'),
  },

  {
    path: '/topography',
    name: 'topography',
    component: () => import('./views/topography.vue'),
  },
  {
    path: '/tree',
    name: 'tree',
    component: () => import('./views/tree.vue'),
  },

  // 添加更多路由
];

const router = createRouter({
  history: createWebHistory('/'),
  routes,
});

export default router;
