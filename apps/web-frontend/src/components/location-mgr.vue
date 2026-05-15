// Stellarium Web - Copyright (c) 2022 - Stellarium Labs SRL
//
// This program is licensed under the terms of the GNU AGPL v3, or
// alternatively under a commercial licence.
//
// The terms of the AGPL v3 license can be found in the main directory of this
// repository.

<template>
  <div>
    <v-row justify="space-around">
      <v-col cols="4" v-if="doShowMyLocation">
        <v-list two-line subheader>
          <v-subheader>{{ $t('My Locations') }}</v-subheader>
          <v-list-item href="javascript:;" v-for="item in knownLocations" v-bind:key="item.id" @click.native.stop="selectKnownLocation(item)" :style="(item && knownLocationMode && selectedKnownLocation && item.id === selectedKnownLocation.id) ? 'background-color: #455a64' : ''">
            <v-list-item-icon>
              <v-icon>mdi-map-marker</v-icon>
            </v-list-item-icon>
            <v-list-item-content>
              <v-list-item-title>{{ item.short_name }}</v-list-item-title>
              <v-list-item-subtitle>{{ item.country }}</v-list-item-subtitle>
            </v-list-item-content>
          </v-list-item>
        </v-list>
      </v-col>
      <v-col cols="doShowMyLocation ? 8 : 12" >
        <v-card class="blue-grey darken-2 white--text">
          <v-card-title primary-title>
            <v-container fluid>
              <v-row>
                <v-col>
                  <div>
                    <div class="text-h5" style="overflow: hidden; white-space: nowrap; text-overflow: ellipsis;">{{ locationForDetail ? locationForDetail.short_name + ', ' + locationForDetail.country :  '-' }}</div>
                    <v-btn @click.native.stop="useLocation()" style="position: absolute; right: 20px"><v-icon>mdi-chevron-right</v-icon> {{ $t('Use this location') }}</v-btn>
                    <div class="grey--text text-subtitle-2" v-if="locationForDetail.street_address">{{ locationForDetail ? (locationForDetail.street_address ? locationForDetail.street_address : $t('Unknown Address')) : '-' }}</div>
                    <div class="grey--text text-subtitle-2">{{ locationForDetail ? locationForDetail.lat.toFixed(5) + ' ' + locationForDetail.lng.toFixed(5) : '-' }}</div>
                  </div>
                </v-col>
              </v-row>
            </v-container>
          </v-card-title>
          <div style="height: 375px; position: relative;">
            <div class="mainland-location-search">
              <v-text-field
                v-model="searchQuery"
                :placeholder="$t('Search...')"
                dense
                solo
                hide-details
                clearable
                append-icon="mdi-magnify"
                :loading="isSearchingLocation"
                @click:append="searchLocation"
                @keydown.enter="searchLocation"
              ></v-text-field>
              <v-list v-if="searchResults.length" dense class="mainland-location-search-results">
                <v-list-item v-for="loc in searchResults" :key="loc.id" @click="selectSearchLocation(loc)">
                  <v-list-item-content>
                    <v-list-item-title>{{ loc.short_name }}</v-list-item-title>
                    <v-list-item-subtitle>{{ loc.street_address || loc.country }}</v-list-item-subtitle>
                  </v-list-item-content>
                </v-list-item>
              </v-list>
              <div v-else-if="searchMessage" class="mainland-location-search-message">{{ searchMessage }}</div>
            </div>
              <v-btn light fab class="mx-0 pa-0" @click.native.stop="centerOnRealPosition()" style="position: absolute; z-index: 10000; bottom: 16px; right: 12px;">
                <v-icon>mdi-crosshairs-gps</v-icon>
              </v-btn>
            <l-map class="black--text" ref="myMap" :center="mapCenter" :zoom="10" style="width: 100%; height: 375px;" :options="{zoomControl: false}">
              <l-control-zoom position="topright"></l-control-zoom>
              <l-tile-layer :url="url" :attribution="attribution"></l-tile-layer>
              <l-marker :key="loc.id"
                  v-for="loc in knownLocations"
                  :lat-lng="locationToMapLatLng(loc)"
                  :clickable="true"
                  :opacity="(!pickLocationMode && selectedKnownLocation && selectedKnownLocation === loc ? 1.0 : 0.25)"
                  @click="selectKnownLocation(loc)"
                  :draggable="!pickLocationMode && selectedKnownLocation && selectedKnownLocation === loc" @dragend="dragEnd"
                ></l-marker>
              <l-circle v-if="startLocation"
                :lat-lng="locationToMapLatLng(startLocation)"
                :radius="startLocation.accuracy"
                :options="{
                  strokeColor: '#0000FF',
                  strokeOpacity: 0.5,
                  strokeWeight: 1,
                  fillColor: '#0000FF',
                  fillOpacity: 0.08}"></l-circle>
              <l-marker v-if="pickLocationMode && pickLocation" :lat-lng="locationToMapLatLng(pickLocation)"
                :draggable="true" @dragend="dragEnd"><l-tooltip><div class="black--text">Drag to adjust</div></l-tooltip></l-marker>
            </l-map>
          </div>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>

<script>
import swh from '@/assets/sw_helpers.js'
import { LMap, LTileLayer, LMarker, LCircle, LTooltip, LControlZoom } from 'vue2-leaflet'

export default {
  data: function () {
    return {
      mode: 'pick',
      pickLocation: undefined,
      selectedKnownLocation: undefined,
      mapCenter: [38.26, 93.9],
      url: 'https://webrd01.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=7&x={x}&y={y}&z={z}',
      attribution: '&copy; AutoNavi',
      searchQuery: '',
      searchResults: [],
      searchMessage: '',
      isSearchingLocation: false
    }
  },
  props: ['showMyLocation', 'knownLocations', 'startLocation', 'realLocation'],
  computed: {
    doShowMyLocation: function () {
      return this.showMyLocation === undefined ? false : this.showMyLocation
    },
    pickLocationMode: function () {
      return this.mode === 'pick'
    },
    knownLocationMode: function () {
      return this.mode === 'known'
    },
    locationForDetail: function () {
      if (this.pickLocationMode && this.pickLocation === undefined) {
        return this.startLocation
      }
      return this.pickLocationMode ? this.pickLocation : this.selectedKnownLocation
    }
  },
  watch: {
    startLocation: function () {
      this.setPickLocation(this.startLocation)
    }
  },
  mounted: function () {
    this.setPickLocation(this.startLocation)
    this.$nextTick(() => {
      const map = this.$refs.myMap.mapObject
      map._onResize()
    })
  },
  methods: {
    locationToMapLatLng: function (loc) {
      return swh.locationToMapLatLng(loc)
    },
    selectKnownLocation: function (loc) {
      this.selectedKnownLocation = loc
      this.setKnownLocationMode()
      this.mapCenter = swh.locationToMapLatLng(loc)
    },
    selectSearchLocation: function (loc) {
      this.searchQuery = loc.short_name
      this.searchResults = []
      this.searchMessage = ''
      this.setPickLocation(loc)
    },
    searchLocation: function () {
      if (!this.searchQuery || !this.searchQuery.trim()) return
      this.isSearchingLocation = true
      this.searchMessage = ''
      swh.searchLocations(this.searchQuery).then((locations) => {
        this.searchResults = locations
        if (!locations.length) {
          this.searchMessage = swh.getMainlandMapKey() ? 'No location found' : 'Set VUE_APP_AMAP_WEB_SERVICE_KEY to enable mainland search'
        }
      }).finally(() => {
        this.isSearchingLocation = false
      })
    },
    useLocation: function () {
      this.$emit('locationSelected', this.locationForDetail)
    },
    setPickLocationMode: function () {
      this.mode = 'pick'
    },
    setKnownLocationMode: function () {
      this.mode = 'known'
    },
    setPickLocation: function (loc) {
      if (loc.accuracy < 100) {
        for (const l of this.knownLocations) {
          const d = swh.getDistanceFromLatLonInM(l.lat, l.lng, loc.lat, loc.lng)
          if (d < 100) {
            this.selectKnownLocation(l)
            return
          }
        }
      }
      var pos = { lat: loc.lat, lng: loc.lng }
      this.mapCenter = swh.locationToMapLatLng(pos)
      this.pickLocation = loc
      this.setPickLocationMode()
    },
    // Called when the user clicks on the small cross button
    centerOnRealPosition: function () {
      this.setPickLocation(this.realLocation)
    },
    dragEnd: function (event) {
      var that = this
      const wgs = swh.mapLatLngToWgs84(event.target._latlng.lat, event.target._latlng.lng)
      var pos = { lat: wgs.lat, lng: wgs.lng, accuracy: 0 }
      swh.geoCodePosition(pos, that).then((p) => { that.pickLocation = p; that.setPickLocationMode() })
    }
  },
  components: { LMap, LTileLayer, LMarker, LCircle, LTooltip, LControlZoom }
}
</script>

<style>
.mainland-location-search {
  left: 12px;
  max-width: calc(100% - 84px);
  position: absolute;
  top: 12px;
  width: 280px;
  z-index: 10000;
}

.mainland-location-search-results,
.mainland-location-search-message {
  margin-top: 4px;
}

.mainland-location-search-message {
  background: #fff;
  border-radius: 4px;
  color: #333;
  padding: 8px 12px;
}

.leaflet-control-geocoder-form input {
  caret-color:#000 !important;
  color: #000 !important;
}
</style>
