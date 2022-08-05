import { createRouter, createWebHistory } from "vue-router";
import HomeView from "../views/HomeView.vue";
import TripsIndex from "../views/TripsIndex.vue";
import TripsShow from "../views/TripsShow.vue";
import SignupView from "../views/SignupView.vue";
import LoginView from "../views/LoginView.vue";
import LogoutView from "../views/LogoutView.vue";

const routes = [
  {
    path: "/",
    name: "home",
    component: HomeView,
  },
  {
    path: "/trips",
    name: "trips-index",
    component: TripsIndex,
  },
  {
    path: "/trips/:id",
    name: "trips-show",
    component: TripsShow,
  },
  {
    path: "/signup",
    name: "signup",
    component: SignupView,
  },
  {
    path: "/login",
    name: "login",
    component: LoginView,
  },
  {
    path: "/logout",
    name: "logout",
    component: LogoutView,
  },
];

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes,
});

export default router;
