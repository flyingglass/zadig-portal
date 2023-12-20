<template>
  <div class="variable-list">
    <div class="primary-title" style="margin-bottom: 0;">
      <span>{{$t('environments.k8s.globalVariables')}}</span>
      <i
        style="margin-left: 10px; cursor: pointer;"
        :class="[showYaml ? 'el-icon-arrow-up' : 'el-icon-arrow-down']"
        @click="showYaml = !showYaml"
      ></i>
    </div>
    <div class="content" v-show="showYaml">
      <ServiceVar :varList="showGlobalVariables" showRelatedServices />
    </div>
  </div>
</template>

<script>
import ServiceVar from '@/components/projects/common/serviceVar.vue'
import { intersection, debounce, difference } from 'lodash'
export default {
  props: {
    globalVariables: {
      default: () => [],
      type: Array
    },
    selectedServices: Array,
    serviceToKeys: Object
  },
  data () {
    return {
      showYaml: false
    }
  },
  computed: {
    showGlobalVariables () {
      this.globalVariables.forEach(item => {
        item.related_services = intersection(
          item.related_services,
          this.selectedServices
        )
      })
      return this.globalVariables.filter(item => item.related_services.length)
    }
  },
  watch: {
    selectedServices (val, oval) {
      if (oval) {
        const addSvc = difference(val, oval)
        if (addSvc.length) {
          const cur = {}
          addSvc.forEach(svc => {
            [...this.serviceToKeys[svc]].forEach(key => {
              if (!cur[key]) {
                cur[key] = []
              }
              cur[key].push(svc)
            })
          })
          this.globalVariables.forEach(item => {
            if (Object.keys(cur).includes(item.key)) {
              item.related_services = [...new Set(item.related_services.concat(cur[item.key]))]
            }
          })
        }
      }
    },
    showGlobalVariables: {
      handler: debounce(function (val, oVal) {
        if (!oVal || !oVal.length) {
          return
        }
        const updateVars = {}
        val.forEach(item => {
          item.related_services.forEach(ser => {
            if (!updateVars[ser]) {
              updateVars[ser] = {}
            }
            updateVars[ser][item.key] = item.value
          })
        })
        this.$emit('updateGlobalValue', updateVars)
      }, 200),
      deep: true
    }
  },
  components: {
    ServiceVar
  }
}
</script>

<style lang="less" scoped>
.variable-list {
  .content {
    width: 90%;
    max-width: 1000px;
    margin-top: 14px;
  }
}
</style>
