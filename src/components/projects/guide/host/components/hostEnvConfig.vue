<template>
  <AddHostEnv ref="addHostEnv" class="content" />
</template>
<script>
import AddHostEnv from '@/components/projects/env/host/detail/addHostEnv.vue'
export default {
  name: 'hostEnvConfig',
  components: {
    AddHostEnv
  },
  data () {
    return {}
  },
  methods: {
    async nextStep (step) {
      const status = await this.$refs.addHostEnv.validate()
      const envName = this.$refs.addHostEnv.form.env_name
      if (status) {
        const res = await this.$refs.addHostEnv.submit()
        if (res) {
          this.$router.push(
            `/v1/projects/create/${this.$route.params.project_name}/host/config?step=${step}&envName=${envName}`
          )
        }
      }
    }
  },
  onboardingStatus: 1
}
</script>
<style lang="less" scoped>
.content {
  height: 100%;
}
</style>
