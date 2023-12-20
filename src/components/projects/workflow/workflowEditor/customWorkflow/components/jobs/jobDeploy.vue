<template>
  <div class="job-deploy">
    <el-form label-width="136px" :model="job" ref="ruleForm" label-position="left" class="mg-t24 mg-b24 form-item">
      <el-form-item
        :label="$t(`workflow.jobName`)"
        prop="name"
        :rules="{required: true,validator:validateJobName, trigger: ['blur', 'change']}"
      >
        <el-input v-model="job.name" size="small" class="fix-width"></el-input>
      </el-form-item>
      <el-form-item
        prop="spec.env"
        :label="$t(`project.environments`)"
        :rules="{required: true, message: '请选择环境', trigger: ['blur', 'change']}"
      >
        <el-select v-model="job.spec.production" placeholder="请选择" size="small" class="fix-width mg-r8" @change="handleEnvChange">
          <el-option
            v-for="item in envTypes"
            :disabled="deployType==='external'"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          ></el-option>
        </el-select>
        <el-select v-model="job.spec.env" placeholder="请选择" size="small" clearable class="fix-width" @change="getServiceList">
          <el-option v-for="item in envList" :key="item.id" :label="item.name" :value="item.name"></el-option>
        </el-select>
        <EnvTypeSelect
          v-model="job.spec.envTypes"
          isFixed
          isRuntime
          style="display: inline-block;"
          @change="handleEnvTypeChange($event,'select')"
        />
      </el-form-item>
      <el-form-item :label="$t(`global.serviceModule`)" :required="job.spec.serviceType && job.spec.serviceType!=='runtime'">
        <el-form-item
          prop="spec.service_and_images"
          v-if="!job.spec.serviceType || job.spec.serviceType === 'runtime'"
          class="form-item"
          key="1"
        >
          <el-select size="small" v-model="job.spec.service_and_images" multiple filterable clearable value-key="value" class="fix-width">
            <el-option
              v-for="(service,index) in serviceModulesList"
              :key="index"
              :value="service"
              :label="`${service.service_name}/${service.name}`"
            >{{service.service_name}}/{{service.name}}</el-option>
          </el-select>
        </el-form-item>
        <el-form-item
          prop="spec.job_name"
          v-if="job.spec.serviceType === 'other'"
          class="form-item"
          key="2"
          :rules="{required: true, message: '请选择服务', trigger: ['blur', 'change']}"
        >
          <el-select v-model="job.spec.job_name" placeholder="请选择" size="small" class="fix-width" ref="select1">
            <el-option v-for="(item,index) in allJobList" :key="index" :label="item.name" :value="item.name">{{item.name}}</el-option>
          </el-select>
        </el-form-item>
        <EnvTypeSelect
          v-model="job.spec.serviceType"
          isRuntime
          isOther
          isService
          style="display: inline-block;"
          @change="handleEnvTypeChange($event,'select1')"
        />
      </el-form-item>
      <el-form-item v-if="isShowVarConfig && deployType!=='helm'">
        <span slot="label">
          {{$t(`workflow.serviceVarConfig`)}}
        </span>
        <br />
        <el-row>
          <el-col :span="10" class="title">{{$t(`global.serviceName`)}}</el-col>
          <el-col :span="6" class="title">{{$t(`workflow.varConfig`)}}</el-col>
          <el-col :span="8" class="title"></el-col>
        </el-row>
        <div v-for="(item,index) in job.spec.services" :key="index">
          <el-form :model="item" :ref="`ruleForm${index}`" label-position="left" size="small">
            <el-row style="line-height: 30px;">
              <el-col :span="10">
                <div>{{item.service_name}}</div>
              </el-col>
              <el-col :span="8">
                <el-tooltip class="item" effect="dark" :content="$t(`workflow.varConfig`)" placement="top">
                  <span class="iconfont iconbianliang1" @click="handleVarBranchChange('var',item,index)"></span>
                </el-tooltip>
              </el-col>
              <el-col :span="4">
                <el-button type="danger" size="mini" plain @click="deleteService(index)">{{$t(`global.delete`)}}</el-button>
              </el-col>
            </el-row>
          </el-form>
        </div>
        <el-select size="small" v-model="selectServices" multiple filterable clearable class="mg-t24" value-key="service_name">
          <el-option disabled :label="$t('environments.common.checkAllServices')" value="ALL" style="color: #606266;">
            <span
              style=" display: inline-block; width: 100%; font-weight: normal; cursor: pointer;"
              @click="selectServices = allServiceList"
            >{{$t('environments.common.checkAllServices')}}</span>
          </el-option>
          <el-option
            v-for="(service,index) in allServiceList"
            :key="index"
            :value="service"
            :label="service.service_name"
          >{{service.service_name}}</el-option>
        </el-select>
        <el-button
          type="primary"
          size="mini"
          plain
          :disabled="Object.keys(allServiceList).length === 0"
          @click="addService()"
        >+ {{$t(`global.add`)}}</el-button>
      </el-form-item>
      <el-form-item class="status-check">
        <span slot="label">
          {{$t(`workflow.serviceStatusCheck`)}}
          <el-tooltip effect="dark" content="开启后，部署任务会轮询服务运行状态，待服务正常运行，任务状态才为成功。" placement="top">
            <i class="el-icon-question" style="cursor: pointer;"></i>
          </el-tooltip>
        </span>
        <el-form-item prop="spec.skip_check_run_status" class="form-item" :rules="{required: false}">
          <el-switch v-model="job.spec.skip_check_run_status" :active-value="false" :inactive-value="true"></el-switch>
        </el-form-item>
      </el-form-item>
    </el-form>
    <el-dialog :title="`${currentService.service_name} 变量配置`" :visible.sync="variableDialogVisible" :append-to-body="true" width="40%">
      <el-table :data="currentService.variable_configs" size="small">
        <el-table-column prop="variable_key" :label="$t(`global.key`)"></el-table-column>
        <!-- <el-table-column label="使用全局变量">
          <template slot-scope="scope">
             <el-checkbox v-model="scope.row.use_global_variable"></el-checkbox>
          </template>
        </el-table-column> -->
        <el-table-column :label="$t(`global.operation`)">
          <template slot-scope="{row, $index}">
            <el-button type="danger" size="mini" @click="deleteVariable($index, row)" plain>{{$t(`global.delete`)}}</el-button>
          </template>
        </el-table-column>
      </el-table>
      <el-select size="small" v-model="selectVariables" multiple filterable clearable class="mg-t24" value-key="key">
        <el-option disabled :label="$t('environments.common.checkAllServices')" value="ALL" style="color: #606266;">
          <span
            style=" display: inline-block; width: 100%; font-weight: normal; cursor: pointer;"
            @click="selectVariables = allVariablesList"
          >{{$t('environments.common.checkAllServices')}}</span>
        </el-option>
        <el-option v-for="(item,index) in allVariablesList" :key="index" :value="item" :label="item.key">{{item.key}}</el-option>
      </el-select>
      <el-button type="primary" size="mini" plain :disabled="Object.keys(allVariablesList).length === 0" @click="addVariable()">+ {{$t(`global.add`)}}</el-button>
      <span slot="footer" class="dialog-footer">
        <el-button @click="variableDialogVisible = false" size="small">{{$t(`global.cancel`)}}</el-button>
        <el-button type="primary" @click="saveCurSetting('var',currentService)" size="small">{{$t(`global.confirm`)}}</el-button>
      </span>
    </el-dialog>
    <el-dialog
      :visible.sync="variableTypeConfigDialog"
      title="枚举"
      width="600px"
      :close-on-click-modal="false"
      :show-close="false"
      append-to-body
    >
      <el-form ref="form" :model="currentVars" label-position="left" label-width="90px">
        <el-form-item :label="$t(`build.variableKey`)">
          <el-input v-model="currentVars.key" size="small" disabled></el-input>
        </el-form-item>
        <el-form-item :label="$t(`build.variableOptions`)">
          <el-input type="textarea" v-model="currentVars.choice_option" placeholder="可选值之间用英文 “,” 隔开" size="small" rows="4"></el-input>
        </el-form-item>
      </el-form>
      <div slot="footer">
        <el-button @click="variableTypeConfigDialog = false" size="small">{{$t(`global.cancel`)}}</el-button>
        <el-button type="primary" @click="saveVariable" size="small">{{$t(`global.confirm`)}}</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import {
  listProductAPI,
  getWorkflowGlobalVarsAPI,
  getTestEnvServiceListAPI
} from '@/api'
import EnvTypeSelect from '../envTypeSelect.vue'
import { validateJobName, envTypes, deployContentList } from '../../config'
import jsyaml from 'js-yaml'
import { cloneDeep, differenceWith, uniqBy } from 'lodash'

export default {
  name: 'JobDeploy',
  props: {
    projectName: {
      type: String,
      default: ''
    },
    workflowInfo: {
      type: Object,
      default: () => ({})
    },
    originServiceAndBuilds: {
      type: Array,
      default: () => []
    },
    job: {
      type: Object,
      default: () => ({})
    },
    curStageIndex: {
      type: Number,
      default: 0
    },
    curJobIndex: {
      type: Number,
      default: 0
    }
  },
  components: {
    EnvTypeSelect
  },
  data () {
    return {
      validateJobName,
      envTypes,
      deployContentList,
      envList: [],
      serviceList: [],
      serviceModulesList: [],
      proEnvServiceList: [],
      globalEnv: [],
      variableDialogVisible: false,
      isShowVarConfig: false,
      variableTypeConfigDialog: false,
      currentService: {},
      currentVars: [],
      curVarIndex: 0,
      selectServices: [],
      selectVariables: []
    }
  },
  computed: {
    allJobList () {
      const allJobList = this.workflowInfo.stages
        .map(stage => {
          return stage.jobs
        })
        .flat()
      return allJobList.filter(
        job =>
          job.name !== this.job.name &&
          (job.type === 'zadig-build' || job.type === 'zadig-distribute-image')
      )
    },
    allServiceList () {
      return differenceWith(
        this.serviceList,
        this.job.spec.services,
        (a, b) => {
          return a.service_name === b.service_name
        }
      )
    },
    allVariablesList () {
      const variable_configs = this.currentService.variable_configs ? this.currentService.variable_configs : []
      const differenceVars = differenceWith(uniqBy(this.originVariables, 'key'), uniqBy(variable_configs, 'variable_key'), (a, b) => {
        return a.key === b.variable_key
      })
      return differenceVars
    },
    deployType () {
      const project = this.$store.getters.projectList.find(
        project => project.name === this.projectName
      )
      return project ? project.deployType : ''
    },
    originVariables () {
      const res = this.serviceList.find(
        item => item.service_name === this.currentService.service_name
      )
      const varsList = res ? res.latest_variable_kvs : []
      return uniqBy(varsList, 'key')
    }
  },
  methods: {
    getEnvList () {
      this.getTestEnvList()
    },
    getTestEnvList () {
      // 获取测试环境
      const projectName = this.projectName
      listProductAPI(projectName).then(res => {
        this.envList = res.filter(re => !re.production)
        this.getServiceList()
      })
    },
    getServiceList () {
      if (!this.job.spec.env) return
      this.getTestEnvServiceList()
    },
    getTestEnvServiceList () {
      // 获取测试环境服务
      const projectName = this.projectName
      let envName = ''
      if (this.job.spec.env.replaceAll) {
        envName = this.job.spec.env.replaceAll('<+fixed>', '')
      } else {
        envName = this.job.spec.env.replace(/\<\+fixed\>/g, '')
      }
      getTestEnvServiceListAPI(envName, projectName).then(res => {
        res.services.forEach(item => {
          item.variable_kvs.forEach(kv => {
            delete kv.value
          })
          item.service_modules.forEach(service_module => {
            service_module.service_name = item.service_name
            service_module.variable_kvs = item.variable_kvs
          })
        })
        this.job.spec.services =
          this.job.spec.services.length > 0
            ? this.job.spec.services
            : cloneDeep(res.services)
        this.serviceList = cloneDeep(res.services)
        this.serviceModulesList = res.services
          .map(item => {
            item.service_modules.forEach(item => {
              item.value = `${item.service_name}/${item.name}`
            })
            return item.service_modules
          })
          .flat()
      })
    },
    handleEnvChange () {
      this.job.spec.env = ''
      this.job.spec.services = []
      this.allServiceList = []
      this.job.spec.service_and_images = []
      this.getEnvList()
    },
    handleEnvTypeChange (val, ref) {
      if (val === 'other') {
        this.$nextTick(() => {
          this.$refs[ref].toggleMenu()
        })
      }
    },
    getGlobalEnv () {
      const params = cloneDeep(this.workflowInfo)
      const curJob = cloneDeep(this.job)
      curJob.name = Math.random()
      params.stages[this.curStageIndex].jobs[this.curJobIndex] = curJob
      getWorkflowGlobalVarsAPI(curJob.name, jsyaml.dump(params)).then(res => {
        this.globalEnv = res
      })
    },
    addService () {
      this.selectServices.forEach(item => {
        this.job.spec.services.push(item)
      })
      this.selectServices = []
    },
    deleteService (index) {
      this.job.spec.services.splice(index, 1)
    },
    handleVarBranchChange (type, item, index) {
      this.variableDialogVisible = true
      this.curIndex = index
      this.currentService = cloneDeep(item)
      if (this.currentService.variable_configs) {
        this.currentService.variable_configs = uniqBy(this.currentService.variable_configs, 'variable_key')
      } else {
        this.$set(this.currentService, 'variable_configs', [])
      }
    },
    saveVariable () {
      const env = this.currentService.variable_configs[this.curVarIndex]
      const choice_option = this.currentVars.choice_option.split(',')
      env.choice_option = choice_option
      this.$set(env, 'name', this.currentVars.name)
      if (!choice_option.includes(env.value)) {
        env.value = ''
      }
      this.variableTypeConfigDialog = false
    },
    deleteVariable (index) {
      this.currentService.variable_configs.splice(index, 1)
    },
    addVariable () {
      this.selectVariables.forEach(item => {
        this.currentService.variable_configs.push(
          {
            use_global_variable: item.use_global_variable,
            variable_key: item.key
          }
        )
      })
      this.selectVariables = []
    },
    saveCurSetting (type, currentService) {
      this.job.spec.services.forEach((item, index) => {
        if (index === this.curIndex) {
          item.variable_configs = currentService.variable_configs
        }
      })
      this.variableDialogVisible = false
    },
    getData () {
      this.job.spec.service_and_images = this.job.spec.service_and_images.map(
        item => {
          return {
            service_name: item.service_name,
            service_module: item.name || item.service_module,
            value: `${item.service_name}/${item.service_module}`
          }
        }
      )
      this.job.spec.services = this.job.spec.services.map(item => {
        return {
          variable_configs: item.variable_configs,
          service_name: item.service_name,
          updatable: item.updatable
        }
      })
      return this.job
    },
    validate () {
      return this.$refs.ruleForm.validate()
    }
  },
  watch: {
    'job.spec.deploy_contents': {
      handler (newVal) {
        if (newVal.includes('vars')) {
          this.isShowVarConfig = true
        } else {
          this.isShowVarConfig = false
        }
      },
      immediate: true
    },
    job: {
      handler (newVal) {
        this.getEnvList()
      }
    }
  },
  created () {
    this.getEnvList()
    this.getGlobalEnv()
  }
}
</script>
<style lang="less" scoped>
.job-deploy {
  .form-item {
    display: inline-block;

    .fix-width {
      width: 220px;
    }

    .iconfont {
      margin-right: 8px;
      color: @themeColor;
      cursor: pointer;
    }
  }

  .status-check {
    /deep/ .el-form-item__label {
      line-height: 40px;
    }
  }
}
</style>
