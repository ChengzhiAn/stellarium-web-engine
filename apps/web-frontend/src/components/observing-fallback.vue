// Built-in Observe panel when optional src/plugins/* observing packages are not installed.
<template>
  <v-container fluid class="fill-height" style="background:#212121;color:#fff;padding:16px;">
    <v-card dark flat color="transparent" max-width="520">
      <v-card-title class="text-h6">{{ $t('Observe') }}</v-card-title>
      <v-card-text class="text-body-2 grey--text text--lighten-2">
        <p>
          This checkout does not include the optional observing plugins under
          <code>src/plugins/</code> (npm workspaces). Add those packages to enable the full calendar and tools.
        </p>
        <p>You can still open the planet rise/set chart from the side menu.</p>
      </v-card-text>
      <v-card-actions>
        <v-btn text color="primary" @click="openPlanets">{{ $t('Planets Tonight') }}</v-btn>
        <v-btn text @click="goSky">Back to sky</v-btn>
      </v-card-actions>
    </v-card>
  </v-container>
</template>

<script>
export default {
  name: 'ObservingFallback',
  methods: {
    openPlanets () {
      this.$store.commit('setValue', { varName: 'showPlanetsVisibilityDialog', newValue: true })
    },
    goSky () {
      this.$router.push('/')
    }
  }
}
</script>
