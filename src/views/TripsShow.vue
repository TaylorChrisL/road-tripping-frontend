<script>
import axios from "axios";
import mapboxgl from "mapbox-gl";
import turf from "turf";
import MapboxGeocoder from "@mapbox/mapbox-gl-geocoder";
import "@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css";
import Pusher from "pusher-js";

export default {
  data: function () {
    return {
      trip: {},
      newPlaceParams: {},
      startPlace: {},
      endPlace: {},
      places: [],
      loading: false,
      location: "",
      access_token: process.env.VUE_APP_MY_API_KEY,
      center: [-98.57945, 39.828201],
      map: {},
      query: {},
      response: {},
      nothing: turf.featureCollection([]),
      clickMarker: {},
      markers: [],
      messages: [],
      chatMessage: "",
    };
  },
  created: function () {
    axios.get("/trips/" + this.$route.params.id + ".json").then((response) => {
      this.trip = response.data;
      this.newPlaceParams.trip_id = this.trip.id;
      this.getPlaces(this.trip);
      this.trip.messages.forEach((message) => {
        this.messages.push(message);
      });
    });
  },
  mounted: function () {
    // Enable pusher logging - don't include this in production
    Pusher.logToConsole = true;

    const pusher = new Pusher("587047a0153b31b66c07", {
      cluster: "us3",
    });

    const channel = pusher.subscribe("my-channel");
    channel.bind("my-event", (data) => {
      if (data.trip_id == this.trip.id) {
        this.messages.push(data);
      }
    });
  },
  methods: {
    async createMap() {
      try {
        mapboxgl.accessToken = this.access_token;
        this.map = new mapboxgl.Map({
          container: "map",
          style: "mapbox://styles/mapbox/streets-v11",
          center: this.center,
          zoom: 3,
        });
        let geocoder = new MapboxGeocoder({
          accessToken: this.access_token,
          mapboxgl: mapboxgl,
          marker: false,
        });

        this.map.on("load", async () => {
          this.map.addSource("route", {
            type: "geojson",
            data: this.nothing,
          });

          this.map.addLayer({
            id: "routeline-active",
            type: "line",
            source: "route",
            layout: {
              "line-join": "round",
              "line-cap": "round",
            },
            paint: {
              "line-color": "#3887be",
              "line-width": ["interpolate", ["linear"], ["zoom"], 12, 3, 22, 12],
            },
          });
          this.getOptimization();
        });

        this.map.addControl(geocoder);

        // this.markers.push(
        //   new mapboxgl.Marker()
        //     .setPopup(
        //       new mapboxgl.Popup({ offset: 0, closeButton: false, closeOnClick: false, anchor: "top-left" }).setHTML(
        //         this.startPlace.name
        //       )
        //     )
        //     .setLngLat([this.startPlace.longitude, this.startPlace.latitude])
        //     .addTo(this.map)
        // );
        // this.markers.push(
        //   new mapboxgl.Marker()
        //     .setPopup(
        //       new mapboxgl.Popup({ offset: 0, closeButton: false, closeOnClick: false, anchor: "top-left" }).setHTML(
        //         this.endPlace.name
        //       )
        //     )
        //     .setLngLat([this.endPlace.longitude, this.endPlace.latitude])
        //     .addTo(this.map)
        // );
        this.places.forEach((place) => {
          this.markers.push(
            new mapboxgl.Marker()
              .setPopup(
                new mapboxgl.Popup({ offset: 0, closeButton: false, closeOnClick: false, anchor: "top-left" }).setHTML(
                  place.name
                )
              )
              .setLngLat([place.longitude, place.latitude])
              .addTo(this.map)
          );
        });
        geocoder.on("result", (e) => {
          if (Object.keys(this.clickMarker).length === 0) {
            this.clickMarker = new mapboxgl.Marker({
              color: "#D80739",
            })
              .setLngLat(e.result.center)
              .addTo(this.map);
            this.center[0] = e.result.center[0];
            this.center[1] = e.result.center[1];
          } else {
            this.setMarker(e.result.center[0], e.result.center[1]);
          }
          this.mapClickFn(e.result.center[0], e.result.center[1]);
        });

        this.map.on("click", (e) => {
          if (Object.keys(this.clickMarker).length === 0) {
            this.clickMarker = new mapboxgl.Marker({
              color: "#D80739",
            })
              .setLngLat(e.lngLat)
              .addTo(this.map);
            this.center[0] = e.lngLat.lng;
            this.center[1] = e.lngLat.lat;
          } else {
            this.setMarker(e.lngLat.lng, e.lngLat.lat);
          }
          this.mapClickFn(e.lngLat.lng, e.lngLat.lat);
        });
      } catch (err) {
        console.log("map error", err);
      }
    },
    setMarker(lng, lat) {
      this.clickMarker.setLngLat([lng, lat]);
      this.center[0] = lng;
      this.center[1] = lat;
    },
    copyLocation() {
      if (this.location) {
        navigator.clipboard.writeText(this.location);
        alert("Location Copied");
      }
      return;
    },
    mapClickFn(lng, lat) {
      const url =
        "https://api.mapbox.com/geocoding/v5/mapbox.places/" +
        lng +
        "," +
        lat +
        ".json?access_token=" +
        this.access_token +
        "&types=address";
      axios.get(url).then((response) => {
        var placeData = response.data.features[0].place_name.split(",");
        var zipCode = placeData[2].split(" ")[placeData[2].split(" ").length - 1];
        this.newPlaceParams.address = placeData[0];
        this.newPlaceParams.city = placeData[1];
        this.newPlaceParams.zip_code = zipCode;
        this.newPlaceParams.longitude = lng.toFixed(6);
        this.newPlaceParams.latitude = lat.toFixed(6);
      });
    },
    async getOptimization() {
      if (Object.keys(this.startPlace).length !== 0 && Object.keys(this.endPlace).length !== 0) {
        var locations = [];
        this.places.forEach((place) => {
          locations.push(`${place.longitude},${place.latitude}`);
        });
        var url = `https://api.mapbox.com/optimized-trips/v1/mapbox/driving/${locations.join(
          ";"
        )}?source=first&destination=last&roundtrip=false&geometries=geojson&access_token=${this.access_token}`;

        this.query = await fetch(url, { method: "GET" });
        this.response = await this.query.json();
        // Create a GeoJSON feature collection
        var routeGeoJSON = turf.featureCollection([turf.feature(this.response.trips[0].geometry)]);
        // Update the `route` source by getting the route source
        // and setting the data equal to routeGeoJSON
        this.map.getSource("route").setData(routeGeoJSON);
        this.routeInfo();
      }
    },
    getPlaces: async function (trip) {
      await trip.places.forEach((place) => {
        if (place.start_point) {
          this.startPlace = place;
          this.places.splice(0, 0, place);
        } else if (place.end_point) {
          this.endPlace = place;
        } else {
          this.places.push(place);
        }
      });
      if (Object.keys(this.endPlace).length !== 0) {
        this.places.push(this.endPlace);
      }
      this.createMap();
    },
    createPlace: function () {
      if (this.places.length < 10) {
        this.newPlaceParams.longitude = this.center[0];
        this.newPlaceParams.latitude = this.center[1];
        axios
          .post("http://localhost:3000/places", this.newPlaceParams)
          .then((response) => {
            console.log("place created ", response.data);
            if (Object.keys(this.startPlace).length !== 0 && Object.keys(this.endPlace).length !== 0) {
              this.places.splice(this.places.length - 2, 0, response.data);
            } else {
              this.places.push(response.data);
            }
            this.markers.push(
              new mapboxgl.Marker()
                .setPopup(
                  new mapboxgl.Popup({
                    offset: 0,
                    closeButton: false,
                    closeOnClick: false,
                    anchor: "top-left",
                  }).setHTML(this.newPlaceParams.name)
                )
                .setLngLat([this.newPlaceParams.longitude.toFixed(6), this.newPlaceParams.latitude.toFixed(6)])
                .addTo(this.map)
            );
            for (var member in this.newPlaceParams) delete this.newPlaceParams[member];
            this.newPlaceParams.trip_id = this.trip.id;
            this.getOptimization();
          })
          .catch((error) => (this.errorMessage = error));
      } else {
        console.log("Max number of places is 12, 1 must be assigned to start, and 1 to end ");
      }
    },
    destroyPlace: function (place) {
      axios.delete("http://localhost:3000/places/" + place.id).then((response) => {
        console.log("Success!", response.data);
        var index = this.places.indexOf(place);
        this.places.splice(index, 1);
        var arr = this.markers.map((marker) => marker._lngLat);
        var indexToDelete;
        arr.forEach((lngLat, i) => {
          if (lngLat.lng == place.longitude && lngLat.lat == place.latitude) {
            indexToDelete = i;
          }
        });
        this.markers[indexToDelete].remove();
        this.getOptimization();
      });
    },
    setStartPoint: function (place) {
      if (Object.keys(this.startPlace).length !== 0) {
        axios.patch("http://localhost:3000/places/" + this.startPlace.id, { start_point: "false" }).then((response) => {
          console.log("Previous Start place removed ", response.data);
          this.startPlace = {};
        });
      }
      axios.patch("http://localhost:3000/places/" + place.id, { start_point: "true" }).then((response) => {
        console.log("Start Place updated ", response.data);
        this.startPlace = response.data;
        var index = this.places.indexOf(place);
        this.places.splice(index, 1);
        this.places.splice(0, 0, place);
        this.getOptimization();
      });
    },
    setEndPoint: function (place) {
      if (Object.keys(this.endPlace).length !== 0) {
        axios.patch("http://localhost:3000/places/" + this.endPlace.id, { end_point: "false" }).then((response) => {
          console.log("Previous end place removed ", response.data);
          this.endPlace = {};
        });
      }
      axios.patch("http://localhost:3000/places/" + place.id, { end_point: "true" }).then((response) => {
        console.log("End Place updated ", response.data);
        this.endPlace = response.data;
        var index = this.places.indexOf(place);
        this.places.splice(index, 1);
        this.places.push(place);
        this.getOptimization();
      });
    },
    routeInfo: function () {
      var orderArray = this.response.waypoints.map((waypoint) => waypoint.waypoint_index);
      var newArray = [];
      orderArray.forEach((index) => {
        newArray.push(this.places[index]);
      });
      this.places = newArray;
    },
    submitMessage: async function () {
      await axios
        .post("http://localhost:3000/chat", {
          message: this.chatMessage,
          trip_id: this.trip.id,
        })
        .then(() => {
          this.chatMessage = "";
        });
    },
  },
};
</script>

<template>
  <section class="main-contentiner map-half-content grid-two-items">
    <div class="container-fluid">
      <div class="row" style="margin-top: 20px">
        <div class="col-lg-8 order-lg-2 ps-lg-0">
          <div class="inner-container">
            <div class="map-lg-fixed">
              <div class="map-container">
                <div id="map" class="map-half"></div>
              </div>
            </div>
          </div>
        </div>
        <div class="col-lg-4 px-xl-4">
          <div class="row">
            <div class="col-12">
              <div class="section-title">
                <h2>{{ trip.name }}</h2>
              </div>
              <!-- Search Box 2 -->
              <div class="search-box-2 bg-light pb-3 pb-md-1">
                <form class="row" @submit.prevent>
                  <div class="form-group col-md-6 col-lg-12 col-xl-6">
                    <div class="input-group mb-2">
                      <div class="input-group-text">Name</div>
                      <input
                        type="text"
                        v-model="newPlaceParams.name"
                        class="form-control"
                        placeholder="Name this place"
                      />
                    </div>
                  </div>

                  <div class="form-group prepend-append col-md-6 col-lg-12 col-xl-6">
                    <div class="input-group mb-2">
                      <div class="input-group-text">Address</div>
                      <input
                        type="text"
                        v-model="newPlaceParams.address"
                        class="form-control"
                        placeholder="Address"
                        required
                      />
                    </div>
                  </div>
                  <div class="form-group col-md-6 col-lg-12 col-xl-6">
                    <div class="input-group mb-2">
                      <div class="input-group-text">City</div>
                      <input type="text" v-model="newPlaceParams.city" class="form-control" placeholder="City" />
                    </div>
                  </div>

                  <div class="form-group prepend-append col-md-6 col-lg-12 col-xl-6">
                    <div class="input-group mb-2">
                      <div class="input-group-text">Zip Code</div>
                      <input
                        type="text"
                        v-model="newPlaceParams.zip_code"
                        class="form-control"
                        placeholder="Zip Code"
                        required
                      />
                    </div>
                  </div>
                  <div class="form-group col-md-6 col-lg-12 col-xl-6">
                    <div class="input-group mb-2">
                      <div class="input-group-text">Longitude</div>
                      <input
                        type="text"
                        v-model="newPlaceParams.longitude"
                        class="form-control"
                        placeholder="Longitude"
                      />
                    </div>
                  </div>

                  <div class="form-group prepend-append col-md-6 col-lg-12 col-xl-6">
                    <div class="input-group mb-2">
                      <div class="input-group-text">Latitude</div>
                      <input
                        type="text"
                        v-model="newPlaceParams.latitude"
                        class="form-control"
                        placeholder="Latitude"
                        required
                      />
                    </div>
                  </div>
                  <div class="form-group col-md-6 col-lg-12 col-xl-3">
                    <button v-on:click="createPlace()" class="btn btn-primary w-100">Add to Trip</button>
                  </div>
                </form>
              </div>
            </div>
          </div>

          <!-- List items goes here -->
          <div class="card card-list card-listing" v-for="place in places" v-bind:key="place.id">
            <div class="row">
              <!-- <div class="col-sm-5 col-xl-4">
                <div class="card-list-img">
                  <span class="badge badge-primary">Verified</span>
                </div>
              </div> -->

              <div class="col-sm-12 col-xl-12">
                <div class="card-body p-0">
                  <div class="d-flex justify-content-between align-items-center mb-1">
                    <h3 class="card-title listing-title mb-0">{{ place.name }}</h3>
                    <button class="btn-like px-2" v-on:click="destroyPlace(place)">
                      <i class="fa fa-solid fa-trash text-primary" aria-hidden="true"></i>
                    </button>
                  </div>
                </div>

                <span class="d-block mb-4 listing-address">ADDRESS: {{ place.address }}</span>
                <span class="d-block mb-4 listing-address">CITY: {{ place.city }}</span>
                <span class="d-block mb-4 listing-address">ZIP CODE: {{ place.zip_code }}</span>
                <div class="temp-button">
                  <button v-on:click="setStartPoint(place)">Set this as Start Point</button>
                  <button v-on:click="setEndPoint(place)">Set this as End Point</button>
                </div>
              </div>
            </div>
          </div>
          <router-link to="/trips">Return to All trips</router-link>
          <div class="container" style="padding-bottom: 20px">
            <div class="d-flex flex-column align-items-stretch flex-shrink-0 bg-white">
              <div
                class="d-flex align-items-center flex-shrink-0 p-3 link-dark text-decoration-none border-bottom"
                style="background-color: lightblue"
              >
                <span class="fs-5 fw-semibold">Trip Chat</span>
              </div>
              <div class="list-group list-group-flush border-bottom scrollarea">
                <div
                  class="list-group-item list-group-item-action py-3 lh-sm"
                  v-for="message in messages"
                  :key="message"
                  style="background-color: whitesmoke"
                >
                  <div class="d-flex w-100 align-items-center justify-content-between">
                    <strong class="mb-1">{{ message.sender }}</strong>
                    <small class="text-muted">{{ message.updated_at }}</small>
                  </div>
                  <div class="col-10 mb-1 small">{{ message.message }}</div>
                </div>
              </div>
            </div>
            <form @submit.prevent="submitMessage()">
              <input class="form-control" placeholder="Type Message Here" v-model="chatMessage" />
            </form>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style>
.location-control {
  height: 30px;
  background: #ffffff;
  border: 1px solid rgba(31, 42, 83, 0.25);
  box-shadow: 0px 0px 10px rgba(73, 165, 198, 0.1);
  border-radius: 4px;
  padding: 0px 10px;
  width: 90%;
}
.location-control:focus {
  outline: none;
}
.location-btn {
  margin-top: 15px;
  padding: 10px 15px;
  background: #d80739;
  box-shadow: 0px 4px 10px rgba(73, 165, 198, 0.1);
  border-radius: 5px;
  border: 0;
  cursor: pointer;
  color: #ffffff;
  font-size: 0.875rem;
  font-weight: 600;
}
.location-btn:focus {
  outline: none;
}
.disabled {
  background: #db7990;
  cursor: not-allowed;
}
.map-half {
  position: fixed;
  width: 65vw;
  height: 75vh;
}
</style>
