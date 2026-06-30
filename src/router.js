import { createRouter, createWebHistory } from 'vue-router'
import { useAuth } from './stores/auth'

const routes = [
    { path: '/', redirect: '/dashboard' },
    { path: '/login', component: () => import('./views/Login.vue'), meta: { guest: true } },
    { path: '/dashboard', component: () => import('./views/Dashboard.vue'), meta: { requiresAuth: true } },
    { path: '/patients', component: () => import('./views/Patients.vue'), meta: { requiresAuth: true } },
    { path: '/patients/:id', name: 'patient-detail', component: () => import('./views/PatientDetail.vue'), meta: { requiresAuth: true } },
    { path: '/procedures', component: () => import('./views/Procedures.vue'), meta: { requiresAuth: true } },
    { path: '/inquiries', component: () => import('./views/Inquiries.vue'), meta: { requiresAuth: true } },
    { path: '/analytics', component: () => import('./views/Analytics.vue'), meta: { requiresAuth: true } }
]

const router = createRouter({
    history: createWebHistory(),
    routes
})

router.beforeEach(async (to, from, next) => {
    const { user, authReady } = useAuth()
    await authReady

    if (to.meta.requiresAuth && !user.value) {
        next('/login')
    } else if (to.meta.guest && user.value) {
        next('/dashboard')
    } else {
        next()
    }
})

export default router