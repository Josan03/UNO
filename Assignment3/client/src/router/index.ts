import { createRouter, createWebHistory } from 'vue-router'
import Lobby from '@/views/Lobby-view.vue'
import Login from '@/views/Login-view.vue'
import Game from '@/views/Game-view.vue'
import Pending from '@/views/Pending.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'lobby',
      component: Lobby,
    },
    {
      path: '/login',
      name: 'login',
      component: Login,
    },
    {
      path: '/game/:id',
      name: 'game',
      component: Game,
    },
    {
      path: '/pending/:id',
      name: 'pending',
      component: Pending,
    },
  ],
})

export default router
