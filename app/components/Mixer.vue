<template>
<div @contextmenu="handleRightClick">
  <div class="studio-controls-top">
    <h4
      class="studio-controls__label"
      v-tooltip.bottom="mixerTooltip">
      {{ $t('Mixer') }}
    </h4>
    <div>
      <i
        class="icon-settings icon-btn"
        @click="showAdvancedSettings()"
        v-tooltip.bottom="advancedSettingsTooltip"/>
    </div>
  </div>
  <div class="studio-controls-selector mixer-panel">
    <MixerItem v-for="audioSource in audioSources" :audioSource="audioSource" :key="audioSource.sourceId"/>
  </div>
</div>
</template>

<script lang="ts" src="./Mixer.vue.ts"></script>
