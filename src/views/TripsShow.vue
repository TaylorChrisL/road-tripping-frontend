<script>
import axios from "axios";
export default {
  data: function () {
    return {
      trip: {},
      newPlaceParams: {},
      places: [],
    };
  },
  created: function () {
    axios.get("/trips/" + this.$route.params.id + ".json").then((response) => {
      this.trip = response.data;
      this.newPlaceParams.trip_id = this.trip.id;
      this.trip.places.forEach((place) => {
        this.places.push(place);
      });
    });
  },
  methods: {
    createPlace: function () {
      axios
        .post("http://localhost:3000/places", this.newPlaceParams)
        .then((response) => {
          console.log("place created ", response.data);
          this.places.push(response.data);
          this.newplaceParams = {};
          this.newPlaceParams.trip_id = this.trip.id;
        })
        .catch((error) => (this.errorMessage = error));
    },
    destroyPlace: function (place) {
      axios.delete("http://localhost:3000/places/" + place.id).then((response) => {
        console.log("Success!", response.data);
        var index = this.places.indexOf(place);
        this.places.splice(index, 1);
      });
    },
  },
};
</script>

<template>
  <div class="places-show">
    <div class="container">
      <h1>{{ trip.name }}</h1>
      <h3>Add New Place to Trip</h3>
      <div>
        <label for="name">Name of Place:</label>
        <input type="text" v-model="newPlaceParams.name" id="name" placeholder="name of place" />
      </div>
      <div>
        <label for="address">address of Place:</label>
        <input type="text" v-model="newPlaceParams.address" id="address" placeholder="address of place" />
      </div>
      <div>
        <label for="city">city of Place:</label>
        <input type="text" v-model="newPlaceParams.city" id="city" placeholder="city of place" />
      </div>
      <div>
        <label for="zip_code">zip_code of Place:</label>
        <input type="text" v-model="newPlaceParams.zip_code" id="zip_code" placeholder="zip_code of place" />
      </div>
      <div>
        <label for="longitude">longitude of Place:</label>
        <input type="text" v-model="newPlaceParams.longitude" id="longitude" placeholder="longitude of place" />
      </div>
      <div>
        <label for="latitude">latitude of Place:</label>
        <input type="text" v-model="newPlaceParams.latitude" id="latitude" placeholder="latitude of place" />
      </div>
      <div>
        <button v-on:click="createPlace()">Create</button>
      </div>
      <div v-for="place in places" v-bind:key="place.id">
        <h5>{{ place.name }}</h5>
        <p>{{ place.name }}</p>
        <button v-on:click="destroyPlace(place)">Delete this Place</button>
      </div>
      <router-link to="/trips">Return to All trips</router-link>
    </div>
  </div>
</template>

<style>
img {
  max-width: 200px;
  max-height: 300px;
}
</style>
