<script>
import axios from "axios";
export default {
  data: function () {
    return {
      trips: [],
      currentTrip: {},
      newTripParams: {},
      editTripParams: {},
      newUserTripParams: {},
    };
  },
  created: function () {
    this.indexTrips();
  },
  methods: {
    indexTrips: function () {
      axios.get("/trips").then((response) => {
        this.trips = response.data;
        console.log("All Trips:", this.trips);
      });
    },
    createTrip: function () {
      axios
        .post("http://localhost:3000/trips", this.newTripParams)
        .then((response) => {
          console.log("Trip created ", response.data);
          this.trips.push(response.data);
          this.newTripParams = {};
          this.showErrorMessage = false;
        })
        .catch((error) => (this.errorMessage = error))
        .then((this.showErrorMessage = true));
    },
    addUser: function () {
      this.newUserTripParams.trip_id = this.currentTrip.id;
      axios.post("http://localhost:3000/user_trips", this.newUserTripParams).then((response) => {
        console.log("User added ", response.data);
        this.newUserTripParams = {};
      });
    },
    showTrip: function (trip) {
      console.log(trip);
      document.querySelector("#trip-details").showModal();
      this.currentTrip = trip;
      this.editTripParams = trip;
    },
    updateTrip: function (trip) {
      axios.patch("http://localhost:3000/trips/" + trip.id, this.editTripParams).then((response) => {
        console.log("We done it!!!", response.data);
      });
    },
  },
};
</script>

<template>
  <h3>Add New Trip</h3>
  <div>
    <label for="name">Name of Trip:</label>
    <input type="text" v-model="newTripParams.name" id="name" placeholder="name of trip" />
  </div>
  <div>
    <button v-on:click="createTrip()">Create</button>
  </div>
  <div v-for="trip in trips" v-bind:key="trip.id">
    <router-link :to="`/trips/${trip.id}`">
      <h1>{{ trip.name }}</h1>
    </router-link>
    <div>
      <button v-on:click="showTrip(trip)">Edit Trip</button>
    </div>
    <hr />
  </div>
  <dialog id="trip-details">
    <form method="dialog">
      <div>
        <label for="editName">Name of Trip:</label>
        <input type="text" v-model="editTripParams.name" id="editName" />
      </div>
      <div v-if="currentTrip.owner == this.$root.getUserId()">
        <label for="addUser">Add User to this Trip:</label>
        <input type="text" v-model="newUserTripParams.email" id="addUser" />
        <button v-on:click="addUser()">Submit</button>
      </div>
      <div v-for="user in currentTrip.users" :key="user">
        <h3>{{ user.first_name + " : " + user.email }}</h3>
      </div>
      <button v-on:click="updateTrip(currentTrip)">Save Change</button>
      <button>Close</button>
    </form>
  </dialog>
</template>

<style>
img {
  max-width: 200px;
  max-height: 300px;
}
.selected {
  color: white;
  background-color: maroon;
  transition: background-color 2s ease;
}
</style>
