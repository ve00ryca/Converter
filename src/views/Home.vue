<template>
  <div class="home">
    <img
      alt="Converter logo"
      src="../assets/—Pngtree—square blue abstract gradient business_5376662.png"
      style="width: 200px; height: 200px"
    />
    <div class="container-converter-cards">
      <ConverterCard v-for="unit in units" :key="unit.id" :unit="unit" />
    </div>
  </div>
</template>

<script>
import ConverterService from '@/services/ConverterService.js'
import ConverterCard from '@/components/ConverterCard.vue'

export default {
  name: 'Home',
  components: {
    ConverterCard,
  },
  created() {
    //axios
    // .get('http://localhost:3000/events')
    ConverterService.getUnits()
      .then((response) => {
        console.log(response.data)
        this.units = response.data
      })
      .catch((error) => {
        console.log('There was an error: ', error.response)
      })
  },
  data() {
    return {
      units: [],
    }
  },
}
</script>
<style lang="scss" scoped>
.home {
  min-height: 100vh;
  background: url('../assets/—Pngtree—blue geometric shape with dot_3719431.png')
    no-repeat;
  background-attachment: fixed;
  background-position: top;
}
.container-converter-cards {
  width: 70%;
  margin: 5% auto;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  grid-gap: 10px;
  align-items: center;
  justify-content: center;
}
</style>
