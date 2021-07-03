<template>
  <div id="nav" class="nav">
    <router-link to="/" class="brand"> C°nverter</router-link>
    <div class="nav">
      <router-link :to="{ name: 'home' }"> # all units</router-link>
    </div>
  </div>
</template>

<script>
export default {
  name: 'NavBar',
}
</script>

<style lang="scss" scoped>
#nav {
  padding: 30px;

  a {
    text-decoration: none;
    font-weight: bold;
    text-shadow: 0 0 0rem white;
    -webkit-background-clip: text;
    -webkit-text-fill-color: rgb(92 105 109 / 90%);
    transition: 0.5s ease;

    &.router-link-exact-active {
      color: var(--custom-blue-light);
    }
    &:hover {
      transform: translate(0px, -3px);
      border-top: 1px dotted var(--custom-blue-light);
    }
  }
}
.nav {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 60px;
}
.nav > .brand {
  font-family: 'Montserrat', sans-serif;
  font-weight: 700;
  font-size: 1.5em;
  //color: var(--custom-blue-light);
  text-decoration: none;
  margin-right: 1%;
}
.nav .nav-item {
  box-sizing: border-box;
  margin: 0 5px;
  //color: rgba(0, 0, 0, 0.5);
  text-decoration: none;
}
.nav .nav-item.router-link-exact-active {
  color: var(--custom-blue-light);
  border-bottom: solid 2px #99bcc2;
}
</style>
