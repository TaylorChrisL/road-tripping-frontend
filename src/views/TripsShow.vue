<script>
import axios from "axios";
import mapboxgl from "mapbox-gl";
import turf from "turf";
import MapboxGeocoder from "@mapbox/mapbox-gl-geocoder";
import "@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css";
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
    };
  },
  created: function () {
    axios.get("/trips/" + this.$route.params.id + ".json").then((response) => {
      this.trip = response.data;
      this.newPlaceParams.trip_id = this.trip.id;
      this.getPlaces(this.trip);
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
            this.mapClickFn();
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
        console.log(this.response);
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
      this.places.push(this.endPlace);
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
            this.places.push(response.data);
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
        // console.log(this.markers.map((marker) => marker._lngLat).map((lngLat) => [lngLat.lng, lngLat.lat]));
        // console.log([parseFloat(place.longitude), parseFloat(place.latitude)]);
        console.log(indexToDelete);
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
        <button v-on:click="createPlace()">Create</button>
      </div>
      <div class="main">
        <div class="flex">
          <!-- Map Display here -->
          <div class="map-holder">
            <div id="map"></div>
          </div>
          <!-- Coordinates Display here -->
          <div class="dislpay-arena">
            <div class="coordinates-header">
              <h3>Current Coordinates</h3>
              <p>Longitude: {{ center[0] }}</p>
              <p>Latitude: {{ center[1] }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div v-for="place in places" v-bind:key="place.id">
      <h5>{{ place.name }}</h5>
      <h6>Longitude: {{ place.longitude }}</h6>
      <h6>latitude: {{ place.latitude }}</h6>
      <button v-on:click="destroyPlace(place)">Delete this Place</button>
      <div class="temp-button">
        <button v-on:click="setStartPoint(place)">Set this as Start Point</button>
        <button v-on:click="setEndPoint(place)">Set this as End Point</button>
      </div>
    </div>
    <router-link to="/trips">Return to All trips</router-link>
    <div class="temp-button">
      <button v-on:click="getOptimization()">Optimize Route</button>
    </div>
  </div>
</template>

<style>
.main {
  padding: 45px 50px;
}
.flex {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
}
.map-holder {
  width: 65%;
}
#map {
  height: 70vh;
}
.dislpay-arena {
  background: #ffffff;
  box-shadow: 0px -3px 10px rgba(0, 58, 78, 0.1);
  border-radius: 5px;
  padding: 20px 30px;
  width: 25%;
}
.coordinates-header {
  margin-bottom: 50px;
}
.coordinates-header h3 {
  color: #1f2a53;
  font-weight: 600;
}
.coordinates-header p {
  color: rgba(13, 16, 27, 0.75);
  font-weight: 600;
  font-size: 0.875rem;
}
.form-group {
  position: relative;
}
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
.copy-btn {
  background: #f4f6f8 0% 0% no-repeat padding-box;
  border: 1px solid #f4f6f8;
  border-radius: 0px 3px 3px 0px;
  position: absolute;
  color: #5171ef;
  font-size: 0.875rem;
  font-weight: 500;
  height: 30px;
  padding: 0px 10px;
  cursor: pointer;
  right: 3.5%;
  top: 5%;
}
.copy-btn:focus {
  outline: none;
}
.temp-button {
  margin-top: 15px;
}
</style>
