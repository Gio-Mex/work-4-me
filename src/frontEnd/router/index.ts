import { createRouter, createWebHistory } from "vue-router";
import HomeView from "../views/HomeView.vue";
import LoginView from "../views/LoginView.vue";
import SignUpView from "../views/SignUpView.vue";
import UserView from "../views/UserView.vue";
import EditUserView from "../views/EditUserView.vue";
import EditReqView from "../views/EditReqView.vue";
import ReqsListView from "../views/ReqsListView.vue";
import ReqView from "../views/ReqView.vue";
import NotFoundView from "../views/NotFoundView.vue";

// Router configuration
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/",
      name: "home",
      component: HomeView,
    },
    {
      path: "/user/login",
      name: "login",
      component: LoginView,
    },
    {
      path: "/user/signup",
      name: "signup",
      component: SignUpView,
    },
    {
      path: "/user",
      name: "user",
      component: UserView,
    },
    {
      path: "/user/:id",
      name: "userEdit",
      component: EditUserView,
    },
    {
      path: "/jobs",
      name: "jobs",
      component: ReqsListView,
    },
    {
      path: "/jobs/new",
      name: "addRequest",
      component: EditReqView,
    },
    {
      path: "/jobs/:id",
      name: "reqDetail",
      component: ReqView,
    },
    {
      path: "/jobs/edit/:id",
      name: "editRequest",
      component: EditReqView,
    },
    {
      path: "/jobs/archived",
      name: "archivedJobs",
      component: ReqsListView,
    },
    {
      path: "/:pathMatch(.*)*",
      name: "notFound",
      component: NotFoundView,
    },
  ],
  scrollBehavior() {
    return { top: 0 };
  },
});
// Router guard
router.beforeEach((to, _, next) => {
  if (
    !localStorage.getItem("authToken") &&
    to.name !== "home" &&
    to.name !== "login" &&
    to.name !== "signup" &&
    to.name !== "notFound"
  ) {
    next({ name: "home" });
  } else {
    next();
  }
});

export default router;
