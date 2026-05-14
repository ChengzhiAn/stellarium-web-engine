// Stellarium Web - Copyright (c) 2022 - Stellarium Labs SRL
//
// This program is licensed under the terms of the GNU AGPL v3, or
// alternatively under a commercial licence.
//
// The terms of the AGPL v3 license can be found in the main directory of this
// repository.

<template>

<div class="click-through" style="position:absolute; width: 100%; height: 100%; display:flex; align-items: flex-end;">
  <toolbar v-if="$store.state.showMainToolBar" class="get-click"></toolbar>
  <observing-panel></observing-panel>
  <template v-for="(item, i) in pluginsGuiComponents">
    <component :is="item" :key="i"></component>
  </template>
  <template v-for="(item, i) in dialogs">
    <component :is="item" :key="i + pluginsGuiComponents.length"></component>
  </template>
  <selected-object-info
    class="get-click sw-selected-info"
    style="position: absolute; left: 0px; width: 380px; max-width: calc(100vw - 12px); margin: 6px"
  ></selected-object-info>
  <progress-bars class="sw-progress-bars" style="position: absolute; right: 12px;"></progress-bars>
  <bottom-bar class="get-click sw-bottom-bar"></bottom-bar>
</div>

</template>

<script>
import Toolbar from '@/components/toolbar.vue'
import BottomBar from '@/components/bottom-bar.vue'
import SelectedObjectInfo from '@/components/selected-object-info.vue'
import ProgressBars from '@/components/progress-bars'

import DataCreditsDialog from '@/components/data-credits-dialog.vue'
import ViewSettingsDialog from '@/components/view-settings-dialog.vue'
import PlanetsVisibility from '@/components/planets-visibility.vue'
import LocationDialog from '@/components/location-dialog.vue'
import ObservingPanel from '@/components/observing-panel.vue'

export default {
  data: function () {
    return {
    }
  },
  methods: {
  },
  computed: {
    pluginsGuiComponents: function () {
      let res = []
      for (const i in this.$stellariumWebPlugins()) {
        const plugin = this.$stellariumWebPlugins()[i]
        if (plugin.guiComponents) {
          res = res.concat(plugin.guiComponents)
        }
      }
      return res
    },
    dialogs: function () {
      let res = [
        'data-credits-dialog',
        'view-settings-dialog',
        'planets-visibility',
        'location-dialog'
      ]
      for (const i in this.$stellariumWebPlugins()) {
        const plugin = this.$stellariumWebPlugins()[i]
        if (plugin.dialogs) {
          res = res.concat(plugin.dialogs.map(d => d.name))
        }
      }
      return res
    }
  },
  components: { Toolbar, BottomBar, DataCreditsDialog, ViewSettingsDialog, PlanetsVisibility, SelectedObjectInfo, LocationDialog, ProgressBars, ObservingPanel }
}
</script>

<style>
.sw-selected-info {
  top: calc(48px + env(safe-area-inset-top, 0px));
}
.sw-progress-bars {
  bottom: calc(54px + env(safe-area-inset-bottom, 0px));
}
@media (max-width: 600px) {
  .sw-selected-info {
    width: calc(100vw - 16px) !important;
    max-width: calc(100vw - 16px) !important;
  }
}
.sw-bottom-bar {
  position: absolute;
  width: 100%;
  justify-content: center;
  bottom: 0;
  display: flex;
  margin-bottom: 0;
}
</style>
