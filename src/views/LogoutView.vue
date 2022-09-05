<script>
import axios from "axios";
export default {
  created: function () {
    delete axios.defaults.headers.common["Authorization"];
    localStorage.removeItem("jwt");
    localStorage.removeItem("user_id");
    localStorage.removeItem("user_first_name");
    this.$router.push("/");
  },
};
</script>

<template>
  <div class="logout"></div>
</template>
