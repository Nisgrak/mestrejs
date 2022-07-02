import { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
	{
		path: '/',
		component: () => import('layouts/MainLayout.vue'),
		children: [
			{ path: '', redirect: { name: 'Canvas' }, component: () => import('pages/CanvasPage.vue') },
			{ path: 'canvas', name:'Canvas', component: () => import('pages/CanvasPage.vue') },
			{ path: 'login', name:'LoginPage', component: () => import('pages/LoginPage.vue') },
			{ path: 'partitures', name:'ListPartituresPage', component: () => import('pages/ListPartituresPage.vue') },
		],
	},

	// Always leave this as last one,
	// but you can also remove it
	{
		path: '/:catchAll(.*)*',
		component: () => import('pages/ErrorNotFound.vue'),
	},
];

export default routes;
