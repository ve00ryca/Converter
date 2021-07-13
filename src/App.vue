<template>
  <div id="app">
    <NavBar />
    <router-view />
  </div>
</template>

<script>
// export default {}
import NavBar from '@/components/NavBar.vue'
export default {
  components: {
    NavBar,
  },
}
</script>

<style lang="scss">
/**Basic reset */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
  border: none;
}
/**Custom properties and variables */
:root {
  --custom-white: #f0f0f0;
  --custom-blue: #2c3e50;
  --custom-blue-light: #75d0e4;
  --custom-gray-light: #a7afb3;
  --custom-gray-dark: darkslategray;
  --custom-green: #42b983;
  --custom-yellow: #b9b042;
}
html {
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
body {
  font-family: 'Open Sans', sans-serif;
  font-size: 16px;
  line-height: 1.5;
  color: var(--custom-white);
  background-color: #000;
}
html,
body {
  min-height: 100vh !important;
  scroll-behavior: smooth;
  overflow-x: hidden;
}

#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
}

/* SCROLLBAR */
::-webkit-scrollbar {
  width: 15px;
}
/* Track */
::-webkit-scrollbar-track {
  box-shadow: inset 0 0 5px var(--custom-gray-light);
}
/* Handle */
::-webkit-scrollbar-thumb {
  background: var(--custom-gray-light);
  transition: 0.5s ease;
}
/* Handle on hover */
::-webkit-scrollbar-thumb:hover {
  background: var(--custom-blue-light);
}
/* /SCROLLBAR */
</style>
