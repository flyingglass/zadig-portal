<template>
  <div v-if="currentInfo" class="k8s-env-temp-container">
    <div class="global-variable">
      <span>全局变量</span>
      <ServiceVar :varList="globalVariables" showRelatedServices />
    </div>
    <el-table :data="currentInfo.services || []" style="width: 100%;" row-key="service_name" :expand-row-keys="expandKeys">
      <el-table-column prop="service_name" :label="$t(`global.serviceName`)"></el-table-column>
      <el-table-column type="expand" width="100px" label="变量配置">
        <template slot-scope="{ row }">
          <div v-if="row.canEditYaml">
            <div class="primary-title">变量配置</div>
            <!-- use latest_variable_kvs -->
            <ServiceVar
              :varList="row.latest_variable_kvs"
              :globalVariables="globalVariables"
              @updateRelatedServices="updateRelatedServices($event, row.service_name)"
              showSelectGlobalVar
            />
          </div>
          <div v-else style="font-size: 12px; text-align: center;">无变量配置</div>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script>
import ServiceVar from '@/components/projects/common/serviceVar.vue'
import { getEnvGlobalVariablesAPI, getServiceDefaultVariableAPI } from '@api'
import { debounce } from 'lodash'

export default {
  props: {
    currentInfo: Object
  },
  data () {
    return {
      expandKeys: []
    }
  },
  computed: {
    globalVariables () {
      return this.currentInfo ? this.currentInfo.global_variables || [] : []
    }
  },
  methods: {
    getEnvInfo () {
      const envName = this.currentInfo.base_name
      const projectName = this.$route.params.project_name
      Promise.all([
        getEnvGlobalVariablesAPI(projectName, envName).then(res => {
          this.$set(this.currentInfo, 'global_variables', res.global_variables)
        }),
        getServiceDefaultVariableAPI(projectName, envName).then(res => {
          const expandKeys = []
          this.$set(
            this.currentInfo,
            'services',
            res.map(re => {
              if (re.latest_variable_kvs.length) {
                expandKeys.push(re.service_name)
              }
              return {
                ...re,
                canEditYaml: re.latest_variable_kvs.length > 0
              }
            })
          )
          this.expandKeys = expandKeys
        })
      ]).then(() => {
        this.$set(this.currentInfo, 'hasVarYaml', true)
      })
    },
    updateRelatedServices ({ key, operate }, serviceName) {
      // Add or delete a service associated with the current key
      const cur = this.globalVariables.find(vars => vars.key === key)
      if (cur) {
        if (operate === 'add') {
          cur.related_services.push(serviceName)
        } else if (operate === 'delete') {
          cur.related_services = cur.related_services.filter(
            item => item !== serviceName
          )
        }
      }
    }
  },
  watch: {
    currentInfo: {
      handler (val) {
        if (val && !this.currentInfo.hasVarYaml) {
          this.getEnvInfo()
        } else if (val) {
          this.expandKeys = val.services
            .filter(svc => svc.latest_variable_kvs.length)
            .map(svc => svc.service_name)
        }
      },
      immediate: true
    },
    globalVariables: {
      handler: debounce(function (val, oVal) {
        if (
          !oVal ||
          !oVal.length ||
          !(this.currentInfo && this.currentInfo.services)
        ) {
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
        this.currentInfo.services.forEach(service => {
          const cur = updateVars[service.service_name]
          if (cur) {
            const keys = Object.keys(cur)
            service.latest_variable_kvs.forEach(variable => {
              if (keys.includes(variable.key)) {
                variable.value = cur[variable.key]
              }
            })
          }
        })
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
.k8s-env-temp-container {
  .global-variable {
    margin-bottom: 10px;
  }
}
</style>
