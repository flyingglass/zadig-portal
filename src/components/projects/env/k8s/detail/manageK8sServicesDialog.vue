<template>
  <el-dialog
    title
    :visible.sync="dialogVisible"
    width="740px"
    custom-class="manage-k8s-service-dialog"
    :before-close="closeDialog"
    :close-on-click-modal="false"
  >
    <div slot="title">{{ productInfo.env_name }} 环境 - {{ opeDesc }}服务</div>
    <div class="manage-services-container">
      <el-form ref="serviceFormRef" class="primary-form" :model="updateServices" label-width="100px" label-position="left">
        <el-form-item
          :label="$t(`workflow.selectService`)"
          props="service_names"
          :rules="{ required: true, type: 'array', message: '请选择服务名称', trigger: ['blur', 'change']}"
        >
          <el-select v-model="updateServices.service_names" placeholder="请选择服务" size="small" filterable multiple clearable collapse-tags>
            <el-option v-for="service in currentServices" :key="service" :label="service" :value="service"></el-option>
          </el-select>
          <el-button type="primary" size="mini" plain @click="updateServices.service_names = currentServices">全选</el-button>
        </el-form-item>
      </el-form>
      <template v-if="opeType !== 'delete'">
        <div class="header">服务列表</div>
        <el-table :data="currentResourceCheck" style="width: 100%;" row-key="service_name" :expand-row-keys="expandKeys">
          <el-table-column prop="service_name" :label="$t(`global.serviceName`)"></el-table-column>
          <el-table-column>
            <span slot="header">
              <el-tooltip effect="dark" placement="top">
                <div slot="content">
                  <span>{{ $t('global.enterprisefeaturesReferforDetails') }}</span>
                  <el-link
                    style="font-size: 13px; vertical-align: baseline;"
                    type="primary"
                    href="https://docs.koderover.com/zadig/project/k8s-yaml/#资源检测"
                    :underline="false"
                    target="_blank"
                  >{{$t(`global.document`)}}</el-link>
                </div>
                <span style="color: #909399;">{{$t('environments.k8s.serviceListComp.resourceDetection')}} <i class="el-icon-info"></i></span>
              </el-tooltip>
            </span>
          </el-table-column>
          <el-table-column type="expand" width="100px" label="变量配置">
            <template slot-scope="{ row }">
              <div v-if="row.canEditYaml">
                <div class="primary-title">变量配置</div>
                <ServiceVar :varList="row.variable_kvs" :globalVariables="globalVariables" showSelectGlobalVar />
              </div >
              <div v-else style="font-size: 12px; text-align: center;">无变量配置</div>
            </template>
          </el-table-column>
        </el-table>
      </template>
    </div>
    <div slot="footer">
      <el-button @click="closeDialog()" size="small" :disabled="loading">{{$t(`global.cancel`)}}</el-button>
      <el-button type="primary" size="small" @click="updateEnvironment" :loading="loading">{{$t(`global.confirm`)}}</el-button>
    </div>
  </el-dialog>
</template>

<script>
import ServiceVar from '@/components/projects/common/serviceVar.vue'
import {
  autoUpgradeEnvAPI,
  deleteEnvServicesAPI,
  getEnvGlobalVariablesAPI,
  getServiceDefaultVariableAPI
} from '@api'
import { cloneDeep, flatten, difference, keyBy } from 'lodash'

export default {
  props: {
    fetchAllData: Function,
    productInfo: Object, // add: vars/services
    allServiceNames: Array
  },
  data () {
    return {
      opeType: '',
      dialogVisible: false,
      currentServices: [],
      serviceVariables: {},
      updateServices: {
        // env_names: [], // use this parameter when adding or updating services
        service_names: [] // not use
        // services: [{service_name: '', variable_kvs: [], deploy_strategy: ''}] // use
      },
      loading: false,
      expandKeys: [],
      globalVariables: []
    }
  },
  computed: {
    projectName () {
      return this.$route.params.project_name
    },
    currentResourceCheck () {
      const res = []
      const expandKeys = []
      this.updateServices.service_names.forEach(name => {
        const curSvc = this.serviceVariables[name]
        if (curSvc.canEditYaml) {
          expandKeys.push(curSvc.service_name)
        }
        res.push(curSvc)
      })
      this.expandKeys = expandKeys
      return res
    },
    opeDesc () {
      const typeEnum = {
        add: this.$t('global.add'),
        update: this.$t('global.update'),
        delete: this.$t('global.delete')
      }
      return typeEnum[this.opeType] || ''
    }
  },
  methods: {
    updateEnvironment () {
      this.loading = true
      if (this.opeType === 'delete') {
        const payload = {
          service_names: cloneDeep(this.updateServices.service_names)
        }
        deleteEnvServicesAPI(
          this.projectName,
          this.productInfo.env_name,
          payload
        )
          .then(() => {
            this.$message.success(`${this.opeDesc}服务成功！`)
            this.closeDialog()
            this.fetchAllData()
          })
          .catch(error => {
            console.log(error)
            if (error.response && error.response.data.code === 6094) {
              const HtmlStrings = []
              for (const service in error.response.data.extra) {
                if (
                  Object.hasOwnProperty.call(error.response.data.extra, service)
                ) {
                  const envNames = error.response.data.extra[service]
                  HtmlStrings.push(
                    `服务 ${service} 存在于子环境 ${envNames.join(',')} 中`
                  )
                }
              }
              const HtmlTemplate = `<p>待删除服务存在于子环境中，请先删除引用后再进行${
                this.opeDesc
              }操作！</p><br><p>${HtmlStrings.join('<br>')}</p>`
              this.$message({
                message: HtmlTemplate,
                type: 'warning',
                dangerouslyUseHTMLString: true,
                duration: 5000
              })
            }
          })
          .finally(() => {
            this.loading = false
          })
      } else if (this.opeType === 'add' || this.opeType === 'update') {
        const isAdd = this.opeType === 'add'
        const payload = [
          {
            services: this.currentResourceCheck.map(resource => {
              return {
                service_name: resource.service_name,
                variable_kvs: resource.variable_kvs,
                deploy_strategy: isAdd ? resource.deploy_strategy : 'deploy'
              }
            }),
            env_name: this.productInfo.env_name
          }
        ]
        autoUpgradeEnvAPI(this.projectName, payload, false)
          .then(() => {
            this.$message.success(`${this.opeDesc}服务成功！`)
            this.closeDialog()
            this.fetchAllData()
          })
          .catch(error => {
            const description = error.response.data.description
            const res = description.match(
              'the following services are modified since last update'
            )
            if (res) {
              this.updateEnvByForce(payload, description)
            }
          })
          .finally(() => {
            this.loading = false
          })
      }
    },
    updateEnvByForce (payload, description) {
      const message = JSON.parse(description.match(/{.+}/g)[0])
      const key = Object.keys(message)[0]
      const value = message[key].map(item => {
        return item.name
      })
      this.$confirm(
        `您的更新操作将覆盖环境中 ${key} 的 ${value} 服务变更，确认继续?`,
        '提示',
        {
          confirmButtonText: this.$t(`global.confirm`),
          cancelButtonText: this.$t(`global.cancel`),
          type: 'warning'
        }
      ).then(() => {
        const force = true
        autoUpgradeEnvAPI(this.projectName, payload, force).then(res => {
          this.closeDialog()
          this.fetchAllData()
          this.$message({
            message: '更新环境成功',
            type: 'success'
          })
        })
      })
    },
    closeDialog (done) {
      this.dialogVisible = false
      this.serviceVariables = {}
      this.updateServices.service_names = []
      done && done()
    },
    async openDialog (type) {
      this.dialogVisible = true
      this.opeType = type
      const productServices = flatten(this.productInfo.services).map((item) => item.service_name)
      this.currentServices =
        type === 'add'
          ? difference(this.allServiceNames, productServices)
          : productServices

      const serviceVariables = {}
      this.currentServices.forEach(svc => {
        serviceVariables[svc] = {
          service_name: svc,
          deploy_strategy: '',
          variable_kvs: [],
          canEditYaml: false
        }
      })
      this.serviceVariables = serviceVariables
      const [defaultVar, yamlMap] = await Promise.all([
        getEnvGlobalVariablesAPI(this.projectName, this.productInfo.env_name),
        getServiceDefaultVariableAPI(
          this.projectName,
          this.productInfo.env_name,
          this.currentServices
        )
      ])
      this.globalVariables = defaultVar.global_variables || []
      const globalVarObj = keyBy(defaultVar.global_variables, 'key')
      yamlMap.forEach(svc => {
        const variableKvs = svc.latest_variable_kvs || svc.variable_kvs
        serviceVariables[svc.service_name] = {
          service_name: svc.service_name,
          deploy_strategy: '',
          variable_kvs:
            type === 'add'
              ? variableKvs.map(item => {
                const globalKv = globalVarObj[item.key]
                let addObj = {}
                if (globalKv && globalKv.type !== item.type) {
                  addObj = {
                    type: globalKv.type,
                    ownData: {
                      type: item.type,
                      value: item.value
                    }
                  }
                }
                return {
                  ...item,
                  value: globalKv ? globalKv.value : item.value,
                  use_global_variable: !!globalKv,
                  ...addObj
                }
              })
              : variableKvs,
          canEditYaml: !!variableKvs.length > 0
        }
      })
      this.serviceVariables = serviceVariables
    }
  },
  components: {
    ServiceVar
  }
}
</script>

<style lang="less">
.manage-k8s-service-dialog {
  .el-dialog__header {
    padding: 15px;
    text-align: center;
    border-bottom: 1px solid #e4e4e4;
  }

  .el-dialog__body {
    padding: 30px 40px;

    .header {
      margin: 20px 0 10px;
      font-weight: 500;
    }

    .el-radio {
      margin-right: 10px;
      color: inherit;
      font-weight: inherit;

      &:last-child {
        margin-right: 0;
      }

      .el-radio__label {
        padding-left: 4px;
      }
    }

    .primary-title {
      margin-bottom: 14px;
    }
  }
}
</style>
