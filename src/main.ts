import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import './style.css'
import router from "./frontEnd/router";
import { createPersistedState } from 'pinia-plugin-persistedstate';
import { useUserStore } from './frontEnd/stores/userStore';

const app = createApp(App);

const pinia = createPinia()
pinia.use(createPersistedState())

app.use(pinia);
app.use(router);

const userStore = useUserStore()
const token = localStorage.getItem('authToken');

if (token) {
  userStore.isLoggedIn = true;
}
app.mount("#app");