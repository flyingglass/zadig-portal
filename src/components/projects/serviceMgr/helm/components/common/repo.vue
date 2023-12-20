<template>
  <div class="form-code-container">
    <GitRepo
      v-show="serviceSource === 'git'"
      @triggleAction="$emit('triggleAction')"
      :currentSelect="'git'"
      :currentService="currentService"
      ref="gitRepo"
    />

    <ChartRepo
      v-show="serviceSource === 'chart'"
      :currentSelect="'chart'"
      :currentService="currentService"
      ref="chartRepo"
    />

    <TemplateRepo
      v-show="serviceSource === 'chartTemplate'"
      :currentSelect="'chartTemplate'"
      ref="templateRepo"
    />
  </div>
</template>
<script>
import GitRepo from './gitRepo.vue'
import ChartRepo from './chartRepo.vue'
import TemplateRepo from './templateRepo.vue'
export default {
  data () {
    return {
      isUpdate: false
    }
  },
  computed: {
    value () {
      return this.$store.state.serviceHelm.serviceDialogVisible
    },
    currentService () {
      return this.$store.state.serviceHelm.currentService
    },
    serviceSource () {
      return this.$store.state.serviceHelm.serviceSource
    }
  },
  watch: {
    value: {
      handler (val) {
        if (val) {
          const cs = this.currentService
          if (cs) {
            this.isUpdate = true
            if (cs.source && cs.source === 'chartTemplate') {
              this.$store.commit('SERVICE_SOURCE', 'chartTemplate')
            } else if (cs.source && cs.source === 'chartRepo') {
              this.$store.commit('SERVICE_SOURCE', 'chart')
            } else {
              this.$store.commit('SERVICE_SOURCE', 'git')
            }
          } else {
            this.isUpdate = false
          }
        }
      },
      immediate: true
    }
  },
  methods: {
    closeSelectRepo () {
      this.$refs.gitRepo.closeSelectRepo()
      this.$refs.chartRepo.closeSelectRepo()
      this.$refs.templateRepo.closeSelectRepo()
    }
  },
  components: {
    GitRepo,
    ChartRepo,
    TemplateRepo
  }
}
</script>
<style lang="less" scoped>
.form-code-container {
  .create-origin {
    span {
      display: inline-block;
      width: 128px;
      margin-bottom: 20px;
      padding-right: 12px;
      line-height: 40px;
      text-align: right;
    }
  }

  /deep/.el-tabs__content {
    max-height: 500px;
    overflow: auto;
  }
}
</style>
