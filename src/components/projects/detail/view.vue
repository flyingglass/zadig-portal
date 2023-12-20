<template>
  <div class="projects-container">
    <SubTopbar :comp="comp" :projectName="projectName" />
    <router-view @injectComp="injectComp" ></router-view>
  </div>
</template>
<script>
import SubTopbar from '../../entry/home/subTopbar.vue'
export default {
  data () {
    return {
      comp: null
    }
  },
  components: {
    SubTopbar
  },
  computed: {
    projectName () {
      return this.$route.params.project_name
    }
  },
  methods: {
    injectComp (comp) {
      this.comp = comp
    }
  }
}
</script>

<style lang="less" scoped>

.projects-container {
  position: relative;
  display: flex;
  flex-direction: column;
  height: calc(~'100% - 40px');
  background-color: var(--color-gray-bg);
}
</style>
