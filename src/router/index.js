import Vue from 'vue'
import VueRouter from 'vue-router'
import Home from '../views/Home.vue'
import Converter from '../views/Converter.vue'
/* import LengthConverter from '../views/LengthConverter.vue'
import VolumeConverter from '../views/VolumeConverter.vue'
import TemperatureConverter from '../views/TemperatureConverter.vue' */
import NotFound from '@/views/NotFound.vue'

Vue.use(VueRouter)

const routes = [
  {
    path: '/',
    name: 'home',
    component: Home,
  },
  {
    path: '/converter/:unit_name',
    name: 'converter',
    component: Converter,
    props: true,
  },
  {
    path: '*',
    component: NotFound,
  },
]

const router = new VueRouter({
  mode: 'history',
  routes,
})

export default router
