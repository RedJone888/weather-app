<template>
  <div id="app">
    <WeatherForecast />
  </div>
</template>

<script>
import WeatherForecast from './components/WeatherForecast.vue'

export default {
  name: 'App',
  components: {
    WeatherForecast
  }
}
</script>

<style>
body {
  margin: 0;
  padding: 20px;
  background-color: #f0f2f5;
  font-family: Arial, sans-serif;
}

#app {
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
</style>