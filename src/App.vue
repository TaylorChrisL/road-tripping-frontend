<script>
export default {
  data: function () {
    return {
      isLoggedIn: false,
    };
  },
  methods: {
    getUserId: function () {
      return localStorage.getItem("user_id");
    },
  },
  watch: {
    $route: function () {
      this.isLoggedIn = !!localStorage.jwt;
    },
  },
};
</script>
<template>
  <!-- HEADER -->
  <header class="header" style="padding: 0; margin-bottom: 20px">
    <nav style="padding: 0; margin-bottom: 20px">
      <div class="container-fluid clearfix" style="padding: 0; margin-bottom: 20px">
        <div id="menuzord" class="menuzord menuzord-responsive blue">
          <router-link to="/" class="menuzord-brand"><img src="../public/roadTripping.png" /></router-link>
          <ul class="menuzord-menu menuzord-right">
            <li class="">
              <router-link to="/">
                <i class="fa fa-circle"></i>
                Home
              </router-link>
            </li>
            <li class="">
              <router-link v-if="isLoggedIn" to="/trips">
                <i class="fa fa-circle"></i>
                Trips
              </router-link>
            </li>
            <li class="">
              <router-link v-if="!isLoggedIn" to="/signup">
                <i class="fa fa-circle"></i>
                Sign Up
              </router-link>
            </li>
            <li class="">
              <router-link v-if="!isLoggedIn" to="/login">
                <i class="fa fa-circle"></i>
                Log In
              </router-link>
            </li>
            <li class="">
              <router-link v-if="isLoggedIn" to="/logout">
                <i class="fa fa-circle"></i>
                Log Out
              </router-link>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  </header>
  <router-view />
</template>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
}

nav {
  padding: 30px;
}

nav a {
  font-weight: bold;
  color: #2c3e50;
}

nav a.router-link-exact-active {
  color: #42b983;
}
</style>
