<script>
import axios from "axios";
export default {
  data: function () {
    return {
      trips: [],
      currentTrip: {},
      newTripParams: {},
      editTripParams: {},
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
    showTrip: function (trip) {
      console.log(trip);
      document.querySelector("#trip-details").showModal();
      this.currentTrip = trip;
      this.editTripParams = trip;
    },
    updateTrip: function (trip) {
      axios.patch("http://localhost:3000/trips/" + trip.id, this.editTripParams).then((response) => {
        console.log("We dont it!!!", response.data);
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
      <button v-on:click="showTrip(trip)">Edit Name</button>
    </div>
    <hr />
  </div>
  <dialog id="trip-details">
    <form method="dialog">
      <div>
        <label for="editName">Name of Trip:</label>
        <input type="text" v-model="editTripParams.name" id="editName" />
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
