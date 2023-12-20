<template>
  <div class="projects-service-mgr">
    <el-drawer title="代码源集成" :visible.sync="integrationCodeDrawer" direction="rtl">
      <IntegrationCode @cancel="integrationCodeDrawer = false" />
    </el-drawer>
    <el-dialog title="是否更新对应环境？" custom-class="dialog-upgrade-env" :visible.sync="updateEnvDialogVisible" width="40%">
      <div class="title">
        <el-alert title="勾选需要更新的环境，点击确定之后，该服务将自动在对应的环境中进行更新" :closable="false" type="warning"></el-alert>
        <el-checkbox-group v-model="checkedEnvList">
          <el-checkbox v-for="(env,index) in envNameList" :key="index" :label="env">{{env.name}}</el-checkbox>
        </el-checkbox-group>
        <div v-show="checkedEnvList.find(env => env.is_existed)" class="tip-desc">Zadig 中定义的服务将覆盖所选命名空间中的同名服务，请谨慎操作！</div>
      </div>
      <span slot="footer" class="dialog-footer">
        <el-button size="small" type="primary" @click="autoUpgradeEnv">{{$t(`global.confirm`)}}</el-button>
        <el-button size="small" @click="updateEnvDialogVisible=false">{{$t(`global.skip`)}}</el-button>
      </span>
    </el-dialog>
    <el-dialog
      :title="`选择 ${service.service_name} 需要加入的环境？`"
      custom-class="dialog-upgrade-env"
      :visible.sync="joinToEnvDialogVisible"
      width="50%"
    >
      <div class="title">
        <el-checkbox-group v-model="checkedEnvList" @change="changeUpgradeEnv">
          <el-checkbox v-for="(env,index) in deployableEnvListWithVars" :key="index" :label="env">{{env.env_name}}</el-checkbox>
        </el-checkbox-group>
      </div>
      <div v-if="checkedEnvList.length > 0" class="env-tabs">
        <el-tabs v-model="activeEnvTabName" type="card">
          <el-tab-pane v-for="(env,index) in checkedEnvList" :key="index" :label="env.env_name" :name="env.env_name">
            <el-table :data="env.serviceNames" style="width: 100%;" row-key="service_name" :expand-row-keys="env.expandKeys">
              <el-table-column prop="service_name" :label="$t(`global.serviceName`)"></el-table-column>
              <el-table-column type="expand" width="100px" label="变量配置">
                <template slot-scope="{ row }">
                  <div v-if="row.variable_kvs.length">
                    <div class="primary-title">变量配置</div>
                    <ServiceVar :varList="row.variable_kvs" :globalVariables="env.global_variable_kvs" showSelectGlobalVar />
                  </div>
                  <div v-else style="font-size: 12px; text-align: center;">无变量配置</div>
                </template>
              </el-table-column>
            </el-table>
          </el-tab-pane>
        </el-tabs>
      </div>
      <span slot="footer" class="dialog-footer">
        <el-button size="small" @click="joinToEnvDialogVisible = false">{{$t(`global.cancel`)}}</el-button>
        <el-button size="small" type="primary" @click="joinToEnv">{{$t(`global.confirm`)}}</el-button>
      </span>
    </el-dialog>
    <div class="service-wrap">
      <div class="service-container">
        <Multipane class="vertical-panes" layout="vertical">
          <div class="service-tree-container">
            <ServiceTree
              :services="services"
              :projectInfo="projectInfo"
              :currentServiceYamlKinds="currentServiceYamlKinds"
              :showNext.sync="showNext"
              :yamlChange="yamlChange"
              ref="serviceTree"
              @onAddCodeSource="addCodeSource"
              @onJumpToKind="jumpToKind"
              @onRefreshProjectInfo="checkProjectFeature"
              @onRefreshService="getServices"
              @onDeleteService="deleteService"
              @onSelectServiceChange="onSelectServiceChange"
              @onShowJoinToEnvBtn="showJoinToEnvBtnEvent"
              @updateYaml="updateYaml($event)"
            />
          </div>
          <template v-if="service.service_name  &&  services.length >0">
            <MultipaneResizer />
            <div class="service-editor-container" :style="{ minWidth: '0px',width: '550px' }">
              <ServiceEditor
                ref="serviceEditor"
                :serviceInTree="service"
                :showNext.sync="showNext"
                :yamlChange.sync="yamlChange"
                :isOnboarding="isOnboarding"
                :serviceWithConfigs="serviceWithConfigs"
                :showJoinToEnvBtn.sync="showJoinToEnvBtn"
                @onGetTemplateId="getTemplateId"
                @onParseKind="getYamlKind"
                @onRefreshService="getServices"
                @onUpdateService="onUpdateService"
                @showJoinToEnvDialog="showJoinToEnvDialog"
                @onGetLatestServiceYaml="getLatestYaml"
                class="service-editor-content"
              />
            </div>
            <MultipaneResizer />
            <aside class="service-aside service-aside-right" :style="{ flexGrow: 1 }">
              <ServiceAside
                ref="serviceAside"
                :service="service"
                :services="services"
                :latestYaml="latestYaml"
                @onRefreshService="getServices"
                @onGetServiceWithConfigs="getServiceWithConfigs"
                :buildBaseUrl="isOnboarding?`/v1/projects/create/${projectName}/k8s/service`:`/v1/projects/detail/${projectName}/services`"
                :changeEditorWidth="changeEditorWidth"
              />
            </aside>
          </template>
          <div v-else class="no-content">
            <img src="@assets/icons/illustration/editorNoService.svg" alt />
            <p v-if="services.length === 0">
              <span>{{$t('services.common.projectWithoutService')}}</span>
              <el-button size="mini" icon="el-icon-plus" @click="createService()" plain circle></el-button>
              <span>{{$t('services.common.toCreateService')}}</span>
            </p>
            <p v-else-if="service.service_name==='服务列表' && services.length >0">请在左侧选择需要编辑的服务</p>
            <p v-else-if="!service.service_name && services.length >0">请在左侧选择需要编辑的服务</p>
          </div>
        </Multipane>
      </div>
    </div>
    <div v-if="isOnboarding" class="controls__wrap">
      <div class="controls__right onboarding">
        <el-button
          type="primary"
          size="small"
          :disabled="!enableOnboardingNext"
          @click="showOnboardingNext"
        >{{$t('project.onboardingComp.nextStep')}}</el-button>
      </div>
    </div>
  </div>
</template>
<script>
import mixin from '@/mixin/serviceModuleMixin'
import ServiceAside from './k8s/serviceAside.vue'
import ServiceEditor from './k8s/serviceEditor.vue'
import ServiceTree from './common/serviceTree.vue'
import IntegrationCode from './common/integrationCode.vue'
import ServiceVar from '@/components/projects/common/serviceVar.vue'
import { sortBy, keyBy } from 'lodash'
import {
  getSingleProjectAPI,
  getProjectServicesAPI,
  projectServiceWithConfigAPI,
  autoUpgradeEnvAPI,
  listProductAPI,
  getServiceDeployableEnvsAPI
} from '@api'
import { Multipane, MultipaneResizer } from 'vue-multipane'
export default {
  props: {
    isOnboarding: {
      type: Boolean,
      default: false
    }
  },
  data () {
    return {
      projectInfo: {},
      service: {},
      services: [],
      detectedEnvs: [],
      checkedEnvList: [],
      currentServiceYamlKinds: {},
      showNext: false,
      showJoinToEnvBtn: false,
      yamlChange: false,
      updateEnvDialogVisible: false,
      integrationCodeDrawer: false,
      joinToEnvDialogVisible: false,
      envNameList: [],
      deployableEnvs: [],
      activeEnvTabName: '',
      deletedService: '',
      middleWidth: '50%',
      deployableEnvListWithVars: [],
      serviceWithConfigs: {},
      latestYaml: ''
    }
  },
  methods: {
    changeEditorWidth (width) {
      this.middleWidth = width
    },
    addCodeSource () {
      if (!this.$utils.roleCheck('admin')) {
        this.$message(
          '私有镜像仓库未集成，请联系系统管理员前往「系统设置 -> 镜像仓库」进行集成！'
        )
      } else {
        this.integrationCodeDrawer = true
      }
    },
    createService () {
      this.$refs.serviceTree.createService('platform')
    },
    upgradeEnv () {
      this.updateEnvDialogVisible = true
    },
    onSelectServiceChange (service) {
      this.$set(this, 'service', service)
    },
    getServices () {
      const projectName = this.projectName
      this.$set(this, 'service', {})
      getProjectServicesAPI(projectName).then(res => {
        this.services = sortBy(
          res.data.map(service => {
            service.idStr = `${service.service_name}/${service.type}`
            service.status = 'added'
            return service
          }),
          'service_name'
        )
      })
    },
    showJoinToEnvDialog () {
      this.checkedEnvList = []
      this.getServiceDeployableEnvs()
      this.joinToEnvDialogVisible = true
    },
    changeUpgradeEnv (val) {
      if (this.checkedEnvList.length) {
        this.activeEnvTabName = val[val.length - 1].env_name
      }
    },
    onUpdateService ({ serviceName, serviceStatus, res }) {
      this.showNext = true
      this.$router.replace({
        query: Object.assign(
          {},
          {},
          {
            service_name: serviceName,
            rightbar: 'var',
            status: serviceStatus
          }
        )
      })
      if (serviceStatus === 'named') {
        this.getServices()
        this.$refs.serviceTree.getServiceGroup()
      }
      this.$refs.serviceAside.getServiceTemplateWithConfig()
    },
    updateYaml (switchNode) {
      this.$refs.serviceEditor.updateService().then(() => {
        if (switchNode) {
          this.$refs.serviceTree.selectAndSwitchTreeNode()
        }
      })
    },
    getYamlKind (payload) {
      this.currentServiceYamlKinds = payload
    },
    getTemplateId (payload) {
      if (payload) {
        this.services.forEach(service => {
          if (service.service_name === payload.service_name) {
            this.$set(service, 'template_id', payload.template_id)
          }
        })
      }
    },
    jumpToKind (payload) {
      this.$nextTick(() => {
        this.$refs.serviceEditor.jumpToWord(`kind: ${payload.kind}`)
      })
    },
    async checkProjectFeature () {
      const projectName = this.projectName
      this.projectInfo = await getSingleProjectAPI(projectName)
      return this.projectInfo.vars
    },
    showJoinToEnvBtnEvent () {
      this.showJoinToEnvBtn = true
    },
    joinToEnv () {
      const payload = this.checkedEnvList.map(item => {
        return {
          env_name: item.env_name,
          services: item.serviceNames.map(svc => ({
            service_name: svc.service_name,
            deploy_strategy: '',
            variable_kvs: svc.variable_kvs
          }))
        }
      })
      const projectName = this.projectName
      const force = false
      autoUpgradeEnvAPI(projectName, payload, force)
        .then(res => {
          this.joinToEnvDialogVisible = false
          this.$message({
            message: '更新环境成功',
            type: 'success'
          })
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
    },
    deleteService (serviceName) {
      this.deletedService = serviceName
      if (!this.isOnboarding) {
        this.updateEnvDialogVisible = true
      }
    },
    autoUpgradeEnv () {
      const payload = this.checkedEnvList.map(item => {
        return {
          env_name: item.name,
          services: [{ service_name: this.deletedService }]
        }
      })
      const projectName = this.projectName
      const force = false
      autoUpgradeEnvAPI(projectName, payload, force)
        .then(res => {
          this.updateEnvDialogVisible = false
          this.$message({
            message: '更新环境成功',
            type: 'success'
          })
        })
        .catch(error => {
          const description = error.response.data.description
          const res = description.match(
            'the following services are modified since last update'
          )
          if (res) {
            this.updateEnvupdateEnvByForce(payload, description)
          }
        })
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
          this.updateEnvDialogVisible = false
          this.joinToEnvDialogVisible = false
          this.$message({
            message: '更新环境成功',
            type: 'success'
          })
        })
      })
    },
    async getEnvNameList () {
      const projectName = this.projectName
      const envNameList = await listProductAPI(projectName)
      if (envNameList.length) {
        this.envNameList = envNameList
          .filter(re => !re.production)
          .map(env => {
            return {
              name: env.name,
              is_existed: env.is_existed || false
            }
          })
      }
    },
    async getServiceDeployableEnvs () {
      const projectName = this.projectName
      const serviceName = this.service.service_name
      const result = await Promise.all([
        getServiceDeployableEnvsAPI(projectName, serviceName),
        projectServiceWithConfigAPI(serviceName, projectName)
      ])
      const deployableEnvs = result[0].envs
      const serviceVariableKvs = result[1].service_variable_kvs || [] // visible variable kvs
      deployableEnvs.forEach(env => {
        env.services = env.services.filter(item => {
          return item.service_name === serviceName
        })
        env.hasDeployed =
          env.services.filter(item => {
            return item.service_name === serviceName
          }).length > 0
        if (env.services.length === 0) {
          const envGlobalVars = keyBy(env.global_variable_kvs, 'key')
          env.serviceNames = [
            {
              service_name: serviceName,
              variable_kvs: serviceVariableKvs.map(item => {
                const globalKv = envGlobalVars[item.key]
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
            }
          ]
        } else {
          const service = env.services.find(
            element => element.service_name === serviceName
          )
          env.serviceNames = [
            {
              service_name: serviceName,
              variable_kvs: service.variable_kvs
            }
          ]
        }
        this.$set(
          env,
          'expandKeys',
          env.serviceNames
            .filter(item => {
              return item.variable_kvs && item.variable_kvs.length > 0
            })
            .map(item => {
              return item.service_name
            })
        )
      })
      this.deployableEnvListWithVars = deployableEnvs
    },
    changeSize (ref) {
      this.$nextTick(() => {
        this.$refs[ref][0].refresh()
      })
    },
    showOnboardingNext () {
      this.$router.push(
        `/v1/projects/create/${this.projectName}/k8s/runtime?serviceName=${this.serviceName}`
      )
    },
    getServiceWithConfigs (data) {
      this.serviceWithConfigs = data
    },
    getLatestYaml (data) {
      this.latestYaml = data
    }
  },
  computed: {
    projectName () {
      return this.$route.params.project_name
    },
    serviceName () {
      return this.$route.query.service_name
    },
    enableOnboardingNext () {
      const services = this.services.filter(
        service => service.status === 'added'
      )
      if (services.length > 0) {
        return true
      } else {
        return false
      }
    }
  },
  mounted () {
    this.getEnvNameList()
    this.checkProjectFeature().then(vars => {
      this.detectedEnvs = vars || []
    })
    this.getServices()
  },
  components: {
    ServiceAside,
    ServiceEditor,
    ServiceTree,
    Multipane,
    MultipaneResizer,
    IntegrationCode,
    ServiceVar
  },
  mixins: [mixin]
}
</script>

<style lang="less">
@import '~@assets/css/component/service-mgr.less';
</style>
