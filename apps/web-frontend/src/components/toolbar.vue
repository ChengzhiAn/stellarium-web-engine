// Stellarium Web - Copyright (c) 2022 - Stellarium Labs SRL
//
// This program is licensed under the terms of the GNU AGPL v3, or
// alternatively under a commercial licence.
//
// The terms of the AGPL v3 license can be found in the main directory of this
// repository.

<template>
  <div id="toolbar-image">
    <v-toolbar class="transparent" dense>
      <v-app-bar-nav-icon @click="toggleNavigationDrawer"></v-app-bar-nav-icon>
      <img class="tbtitle hidden-xs-only" id="stellarium-web-toolbar-logo" src="@/assets/images/logo.svg" width="30" height="30" alt="Stellarium Web Logo"/>
      <span class="tbtitle hidden-sm-and-down">Stellarium<sup>Web</sup></span>
      <v-spacer></v-spacer>
      <target-search></target-search>
      <v-spacer></v-spacer>
      <div v-if="$store.state.showFPS" class="subheader grey--text hidden-sm-and-down pr-2" style="user-select: none;">FPS {{ $store.state.stel ? $store.state.stel.fps.toFixed(1) : '?' }}</div>
      <div class="subheader grey--text" style="user-select: none; padding-right: max(8px, env(safe-area-inset-right, 0px));">FOV {{ fov }}</div>
    </v-toolbar>
  </div>
</template>

<script>

import TargetSearch from '@/components/target-search'

export default {
  data: function () {
    return {
    }
  },
  computed: {
    fov: function () {
      if (!this.$store.state.stel) return '-'
      const fov = this.$store.state.stel.fov * 180 / Math.PI
      return fov.toPrecision(3) + '°'
    }
  },
  methods: {
    toggleNavigationDrawer: function () {
      this.$store.commit('toggleBool', 'showNavigationDrawer')
    }
  },
  components: { TargetSearch }
}
</script>

<style>
#toolbar-image {
  background: url("../assets/images/header.png") center;
  background-position-x: 55px;
  background-position-y: 0px;
  min-height: 48px;
  padding-top: env(safe-area-inset-top, 0px);
  box-sizing: content-box;
  z-index: 1;
  position: absolute;
  top: 0px;
  left: 0px;
  width: 100%;
}

#stellarium-web-toolbar-logo {
  margin-right: 10px;
  margin-left: 30px;
}

@media (max-width: 600px) {
  #stellarium-web-toolbar-logo {
    margin-left: 8px;
  }
  #toolbar-image {
    background-position-x: 8px;
  }
}

.tbtitle {
  font-size: 20px;
  font-weight: 500;
  user-select: none;
}
</style>
