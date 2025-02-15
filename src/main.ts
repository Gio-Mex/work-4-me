import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import router from "./frontEnd/router";
import { createPinia } from 'pinia'
import { createPersistedState } from 'pinia-plugin-persistedstate';
import { useUserStore } from './frontEnd/stores/userStore';

const app = createApp(App);

const pinia = createPinia()
pinia.use(createPersistedState())

app.use(router);
app.use(pinia);

const userStore = useUserStore()
const token = localStorage.getItem('authToken');

if (token) {
  userStore.isLoggedIn = true;
}
app.mount("#app");