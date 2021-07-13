<template>
  <div class="converter-card">
    <router-link
      :to="{ name: 'converter', params: { unit_name: unit.unit_name } }"
      class="event-link"
    >
      <div class="event-card -shadow">
        <span class="eyebrow"
          ><span>#{{ unit.category }}:</span> {{ unit.description }}</span
        >
        <h4 class="title">{{ unit.title }}</h4>
        <span>{{ unit.options.length }} units</span>
      </div>
    </router-link>
  </div>
  <!-- all the attributes above are extracted from the DB through the parrent component -->
</template>

<script>
export default {
  props: {
    unit: Object /** info from DB is a prop: {} - receiving each object from the parrent through the DB+API call(axios),
    instead of creating n same components each one containg static info in data() */,
  },
}
</script>

<style lang="scss" scoped>
.event-card {
  color: var(--custom-white);
  padding: 20px;
  margin-bottom: 24px;
  transition: all 0.2s linear;
  cursor: pointer;
  background: #285063;
  .eyebrow span {
    font-style: italic;
    padding: 0.2em;
  }
}
.converter-card:nth-child(1) .event-card {
  background: #0ba1e8;
}
.converter-card:nth-child(2) .event-card {
  background: #536d79;
}
.converter-card:nth-child(3) .event-card {
  background: var(--custom-blue-light);
  color: darkslategray;
}
.event-card:hover {
  transform: scale(1.01);
  box-shadow: 0 3px 12px 0 rgba(0, 0, 0, 0.2), 0 1px 15px 0 rgba(0, 0, 0, 0.19);
}
.event-card > .title {
  margin: 0;
}

.event-link {
  color: black;
  text-decoration: none;
  font-weight: 100;
}
</style>
