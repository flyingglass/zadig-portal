<template>
  <div class="aside__wrap">
  <el-dialog :title="mode ==='edit'?$t('services.k8s.editKv'):$t('services.k8s.addKv')" :visible.sync="variableDialogVisible" width="480px" custom-class="variable-dialog">
      <el-form ref="variableForm" :model="serviceVariableKv" label-width="105px" label-position="left">
        <el-form-item :label="$t('global.key')" prop="key" :rules="{required: true, message: $t('services.k8s.inputKey'), trigger: ['blur', 'change']}">
          <el-input size="small" v-model="serviceVariableKv.key"  :disabled="mode === 'edit'"></el-input>
        </el-form-item>
        <el-form-item :label="$t('global.type')" prop="type" :rules="{required: true, message: $t('services.k8s.selectType'), trigger: ['blur', 'change']}">
          <el-select v-model="serviceVariableKv.type" @change="changeVariableType" class="full-width" size="small" :placeholder="$t('services.k8s.selectType')">
            <el-option :label="$t('global.string')" value="string"></el-option>
            <el-option :label="$t('global.enumeration')" value="enum"></el-option>
            <el-option :label="$t('global.boolean')" value="bool"></el-option>
            <el-option label="YAML" value="yaml"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item v-if="serviceVariableKv.type === 'enum'" :label="$t('services.k8s.optionalValues')" prop="optionsStr" :rules="{required: true, message: $t('services.k8s.inputOptionalValues'), trigger: ['blur', 'change']}">
          <el-input type="textarea" :autosize="{ minRows: 2}" size="small" :placeholder="$t('services.k8s.optionalValuesPlaceholder')" v-model="serviceVariableKv.optionsStr"></el-input>
        </el-form-item>
        <el-form-item v-if="serviceVariableKv.type === 'bool'" :label="$t('global.value')" prop="value">
           <el-switch v-model="serviceVariableKv.value" :active-value="serviceVariableKv.value===true?true:'true'" :inactive-value="serviceVariableKv.value===false?false:'false'"></el-switch>
        </el-form-item>
        <el-form-item v-else-if="serviceVariableKv.type === 'enum'" :label="$t('global.value')" prop="value" :rules="{required: true, message: $t('services.k8s.selectDefaultValue'), trigger: ['blur', 'change']}">
          <el-select v-model="serviceVariableKv.value"  class="full-width" size="small" :placeholder="$t('services.k8s.selectDefaultValue')">
            <template v-if="serviceVariableKv.optionsStr">
             <el-option v-for="(item,index) in serviceVariableKv.optionsStr.split(',')" :key="index" :label="item" :value="item"></el-option>
            </template>
          </el-select>
        </el-form-item>
        <el-form-item v-else-if="serviceVariableKv.type === 'yaml'" :label="$t('global.value')" prop="value" :rules="{required: false, message: $t('services.k8s.inputValue'), trigger: ['blur', 'change']}">
          <div class="yaml-variable-editor">
            <VariablesEditor
              style="width: 100%; height: 100%;"
              ref="variablesYamlEditor"
              @input="onYamlVariablesCodeChange"
              :value="serviceVariableKv.value"
              :options="{
                tabSize: 5,
                readOnly: false,
                theme: 'neo',
                mode: 'text/x-yaml',
                lineNumbers: true,
                line: true,
                collapseIdentical: true
              }"
            />
          </div>
        </el-form-item>
        <el-form-item v-else-if="serviceVariableKv.type === 'string'" :label="$t('global.value')" prop="value" :rules="{required: false, message: $t('services.k8s.inputKey'), trigger: ['blur', 'change']}">
          <el-input size="small" :placeholder="$t('services.k8s.inputValue')" v-model="serviceVariableKv.value"></el-input>
        </el-form-item>
        <el-form-item :label="$t('global.desc')">
          <el-input type="textarea" :rows="2" size="small" v-model="serviceVariableKv.desc"></el-input>
        </el-form-item>
      </el-form>
      <span slot="footer" class="dialog-footer">
        <el-button type="primary" size="small" @click="mode === 'add'?saveVariable():updateVariable()">{{$t('global.save')}}</el-button>
        <el-button size="small" @click="cancel">{{$t('global.cancel')}}</el-button>
      </span>
    </el-dialog>
    <el-drawer title="代码源集成" :visible.sync="integrationCodeDrawer" direction="rtl">
      <IntegrationCode @cancel="integrationCodeDrawer = false" />
    </el-drawer>
    <el-drawer title="镜像仓库集成" :visible.sync="registryCreateVisible">
      <IntegrationRegistry @cancel="registryCreateVisible = false" @createSuccess="getRegistryWhenBuild" />
    </el-drawer>
    <div class="aside__inner">
      <div class="aside-bar">
        <div class="tabs__wrap tabs__wrap_vertical">
          <div class="tabs__item" :class="{'selected': selected === 'var'}" @click="changeRoute('var')">
            <span class="step-name">{{$t('services.k8s.variablesSection')}}</span>
          </div>
          <div class="tabs__item" :class="{'selected': selected === 'policy'}" @click="changeRoute('policy')">
            <span class="step-name">{{$t('services.common.policySection')}}</span>
          </div>
          <div class="tabs__item" :class="{'selected': selected === 'help'}" @click="changeRoute('help')">
            <span class="step-name">{{$t('services.common.helpSection')}}</span>
          </div>
        </div>
      </div>
      <div class="aside__content">
        <div v-if="selected === 'build'" class="service-aside--variables">
          <div style="padding-left: 15px;">
            <el-button @click="$router.back()" icon="el-icon-back" type="text">{{$t('global.back')}}</el-button>
          </div>
          <header class="service-aside-box__header">
            <div class="service-aside-box__title">{{$t('services.common.serviceBuild')}}</div>
          </header>
          <div class="service-aside-box__content">
            <CommonBuild
              ref="buildRef"
              :name="$route.query.service_name"
              :buildName="$route.query.build_name"
              :isEdit="!!$route.query.build_name"
              :followUpFn="followUpFn"
              :saveDisabled="projectName !== projectNameOfService"
              :buildNameIndex="buildNameIndex"
              canSelectBuildName
              mini
              fromServicePage
            />
          </div>
        </div>
        <div v-if="selected === 'projectVariables'" class="service-aside--variables">
          <div style="padding-left: 15px;">
            <el-button @click="$router.back()" icon="el-icon-back" type="text">{{$t('global.back')}}</el-button>
          </div>
          <header class="service-aside-box__header">
            <div class="service-aside-box__title">{{$t('services.k8s.globalVariablesList')}}</div>
          </header>
          <div class="service-aside-box__content">
            <ProjectGlobalVariables
              ref="projectGlobalVariables"
            />
          </div>
        </div>
        <div v-if="selected === 'var'" class="service-aside--variables">
          <header class="service-aside-box__header">
            <div class="service-aside-box__title">{{$t('services.k8s.variablesSection')}}</div>
          </header>
          <div class="service-aside-box__content">
            <section class="aside-section">
              <h4>
                <span>
                  <i class="iconfont iconfuwu"></i>
                </span> {{$t('services.common.detectedServiceModules')}}
                <el-tooltip effect="dark" placement="top">
                  <div slot="content">{{$t('services.common.detectedServiceModulesTooltip')}}</div>
                  <span>
                    <i class="el-icon-question"></i>
                  </span>
                </el-tooltip>
              </h4>
              <div v-if="allRegistry.length === 0" class="registry-alert">
                <el-alert type="warning">
                  <div>
                    私有镜像仓库未集成，
                    <el-button type="text" class="theme-color" style="padding: 0;" @click="registryCreateVisible = true">立即集成</el-button>
                  </div>
                </el-alert>
              </div>
              <el-table :data="serviceConfigs.service_module" stripe style="width: 100%;">
                <el-table-column prop="name" :label="$t('services.common.serviceModule')"></el-table-column>
                <el-table-column prop="image_name" :label="$t('services.common.serviceImageName')"></el-table-column>
                <el-table-column prop="image">
                  <template slot="header">
                    <span>{{$t('services.common.serviceImageLabel')}}</span>
                    <el-tooltip effect="dark" placement="top">
                      <div slot="content">
                        工作流任务执行过程中，由构建任务生成 $IMAGE 镜像，部署任务使用生成的 $IMAGE 镜像更新服务。
                        <br />其中 $IMAGE 为系统内置的镜像名称，工作流执行时自动生成。
                        <br />点击「策略」配置镜像名称规则。
                      </div>
                      <span>
                        <i class="el-icon-question"></i>
                      </span>
                    </el-tooltip>
                  </template>
                </el-table-column>
                <el-table-column :label="$t('services.common.buildInfoAndOperation')">
                  <template slot-scope="scope">
                    <div v-for="(buildName, index) in scope.row.build_names" :key="index">
                      <router-link :to="`${buildBaseUrl}?rightbar=build&service_name=${scope.row.name}&build_name=${buildName}`">
                        <span class="build-name">{{ buildName }}</span>
                      </router-link>
                    </div>
                    <el-button size="small" v-hasPermi="{projectName: projectName, action: 'create_build',isBtn:true}" :disabled="projectName !== projectNameOfService" @click="addBuild(scope.row)" type="text">{{$t('services.common.addServiceBuild')}}</el-button>
                  </template>
                </el-table-column>
              </el-table>
            </section>
            <section class="aside-section">
              <h4>
                <span>
                  <i class="iconfont iconchakanbianliang"></i>
                </span> {{$t('services.k8s.buildInVariables')}}
                <el-tooltip effect="dark" :content="$t('services.k8s.buildInVariablesTooltip')" placement="top">
                  <span>
                    <i class="el-icon-question"></i>
                  </span>
                </el-tooltip>
              </h4>
              <el-table :data="serviceConfigs.system_variable" stripe style="width: 100%;">
                <el-table-column prop="key" :label="$t(`global.var`)"></el-table-column>
                <el-table-column prop="value" :label="$t('services.k8s.currentValue')">
                  <template slot-scope="scope">
                    <span v-if="scope.row.value">{{scope.row.value}}</span>
                    <span v-else>{{$t('global.emptyText')}}</span>
                  </template>
                </el-table-column>
              </el-table>
            </section>
            <section class="aside-section">
              <h4>
                <span>
                  <i class="iconfont iconchakanbianliang"></i>
                </span> {{$t('services.k8s.customVariables')}}
                <el-tooltip effect="dark" :content="$t('services.k8s.customVariablesTooltip')" placement="top">
                  <span>
                    <i class="el-icon-question"></i>
                  </span>
                </el-tooltip>
              </h4>
              <div class="variable-operation-container">
                <div class="tab-conatiner">
                  <el-radio-group v-model="variableSwitcher" @input="changeVariableView" size="mini">
                    <el-radio-button label="list">
                      <el-tooltip effect="dark" :content="$t('global.keyValuePairs')" placement="top">
                        <i class="iconfont iconliebiao"></i>
                      </el-tooltip>
                    </el-radio-button>
                    <el-radio-button label="yamlEditor">
                      <el-tooltip effect="dark" :content="$t('global.yamlFile')" placement="top">
                        <i class="iconfont iconyaml"></i>
                      </el-tooltip>
                    </el-radio-button>
                  </el-radio-group>
                </div>
                <div class="parse-container">
                  <router-link v-if="checkPermissionSyncMixin({projectName: projectName, operator: 'or', actions: ['create_service','edit_service']})" :to="`${this.buildBaseUrl}?rightbar=projectVariables`">
                   <el-button class="parse-btn" type="text">{{$t('services.k8s.globalVariablesManagement')}}</el-button>
                  </router-link>
                  <el-tooltip v-else effect="light" :content="$t('permission.lackPermission')" placement="top">
                   <el-button class="permission-disabled" type="text">{{$t('services.k8s.globalVariablesManagement')}}</el-button>
                  </el-tooltip>
                </div>
              </div>
              <div v-if="variableSwitcher === 'yamlEditor'" class="kv-container">
                <VariablesEditor
                  style="width: 100%; height: 100%;"
                  ref="myCm"
                  :value="serviceConfigs.variable_yaml"
                  :options="editorOptions"
                  @input="onCmCodeChange"
                />
              </div>
              <div v-else-if="variableSwitcher === 'list'" class="list-container">
                <el-table :data="serviceConfigs.service_variable_kvs" style="width: 100%;">
                  <el-table-column :label="$t('global.key')">
                    <template slot-scope="scope">
                      <el-tooltip v-if="scope.row.desc" effect="dark" :content="scope.row.desc" placement="top">
                        <span>{{ scope.row.key }}</span>
                      </el-tooltip>
                      <span v-else>{{ scope.row.key }}</span>
                    </template>
                  </el-table-column>
                  <el-table-column :label="$t('global.type')">
                    <template slot-scope="scope">
                      <span v-if="scope.row.type === 'string'">{{$t('global.string')}}</span>
                      <span v-else-if="scope.row.type === 'enum'">{{$t('global.enumeration')}}</span>
                      <span v-else-if="scope.row.type === 'bool'">{{$t('global.boolean')}}</span>
                      <span v-else-if="scope.row.type === 'yaml'">YAML</span>
                    </template>
                  </el-table-column>
                  <el-table-column :label="$t('global.value')">
                    <template slot-scope="scope">
                      <el-input v-if="scope.row.type === 'string' || scope.row.type === 'yaml'" size="mini" v-model="scope.row.value" disabled></el-input>
                      <el-select v-else-if="scope.row.type === 'enum'" v-model="scope.row.value" size="mini" disabled>
                      </el-select>
                      <el-switch v-else-if="scope.row.type === 'bool'" v-model="scope.row.value" disabled :active-value="scope.row.value===true?true:'true'" :inactive-value="scope.row.value===false?false:'false'"></el-switch>
                    </template>
                  </el-table-column>
                  <el-table-column label="">
                    <template slot-scope="scope">
                      <div class="variable-list-operation">
                      <el-button v-if="checkPermissionSyncMixin({projectName: projectName, operator: 'or', actions: ['create_service','edit_service']})" type="text" size="medium" @click="editCurrentVariable(scope.row)">
                        <i class="icon el-icon-edit edit"></i>
                      </el-button>
                      <el-tooltip v-else effect="light" :content="$t('permission.lackPermission')" placement="top">
                        <el-button class="permission-disabled"  type="text" size="medium">
                          <i class="icon el-icon-edit"></i>
                        </el-button>
                      </el-tooltip>
                      <el-button v-if="checkPermissionSyncMixin({projectName: projectName, operator: 'or', actions: ['create_service','edit_service']})" type="text" size="medium" @click="deleteCurrentVariable(scope.$index)">
                        <i class="icon el-icon-remove-outline delete"></i>
                      </el-button>
                      <el-tooltip v-else effect="light" :content="$t('permission.lackPermission')" placement="top">
                        <el-button class="permission-disabled"  type="text" size="medium">
                          <i class="icon el-icon-remove-outline"></i>
                        </el-button>
                      </el-tooltip>
                      </div>
                    </template>
                  </el-table-column>
                </el-table>
                <div class="variable-list-operation">
                  <el-button v-hasPermi="{projectName: projectName, operator: 'or', actions: ['create_service','edit_service'],isBtn:true}" type="text" size="medium" @click="addVariable">
                    <i class="icon el-icon-circle-plus-outline"></i>
                  </el-button>
                </div>
              </div>
              <div class="operation">
                <el-button
                  v-hasPermi="{projectName: projectName, operator: 'or', actions: ['create_service','edit_service'],isBtn:true}"
                  type="primary"
                  size="small"
                  @click="validateVariables"
                  plain
                >{{$t(`global.validate`)}}</el-button>
                <el-button
                  v-if="variableSwitcher === 'yamlEditor'"
                  v-hasPermi="{projectName: projectName, operator: 'or', actions: ['create_service','edit_service'],isBtn:true}"
                  type="primary"
                  size="small"
                  @click="saveServiceVariable"
                  :disabled="service.status==='named'||(service.visibility === 'public'&&service.product_name !== projectName)"
                >{{$t(`global.save`)}}</el-button>
              </div>
            </section>
          </div>
        </div>
        <div v-if="selected === 'policy'" class="service-aside--variables">
          <header class="service-aside-box__header">
            <div class="service-aside-box__title">{{$t('services.common.policySection')}}</div>
          </header>
          <div class="service-aside-help__content">
            <Policy :service="serviceConfigs.service_module" />
          </div>
        </div>
        <div v-if="selected === 'help'" class="service-aside--variables">
          <header class="service-aside-box__header">
            <div class="service-aside-box__title">{{$t('services.common.helpSection')}}</div>
          </header>
          <div class="service-aside-help__content">
            <Help />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<script>
import {
  projectServiceWithConfigAPI,
  getSingleProjectAPI,
  getRegistryWhenBuildAPI,
  getCodeProviderAPI,
  validateKubernetesTemplateVariableAPI,
  saveServiceVariableAPI,
  convertVariableToKvAPI
} from '@api'
import CommonBuild from '@/components/projects/build/commonBuild.vue'
import Help from './common/help.vue'
import Policy from './common/policy.vue'
import IntegrationCode from '../common/integrationCode.vue'
import ProjectGlobalVariables from '../common/projectGlobalVariables.vue'
import IntegrationRegistry from '@/components/projects/common/integrationRegistry.vue'
import { codemirror } from 'vue-codemirror'
import 'codemirror/lib/codemirror.css'
import 'codemirror/theme/neo.css'
import store from 'storejs'
import qs from 'qs'
import { debounce, cloneDeep } from 'lodash'
import { mapState } from 'vuex'

export default {
  data () {
    return {
      allRegistry: [],
      customEnvs: [],
      serviceConfigs: {
        variable_yaml: '',
        service_variable_kvs: []
      },
      integrationCodeDrawer: false,
      projectForm: {},
      registryCreateVisible: false,
      showAllVariables: true,
      buildNameIndex: 0,
      variableSwitcher: 'yamlEditor',
      initVariableYaml: '',
      serviceVariableKv: {
        desc: '',
        key: '',
        options: [],
        optionsStr: '',
        type: 'string',
        value: ''
      },
      mode: 'add',
      variableDialogVisible: false
    }
  },
  methods: {
    async addBuild (item) {
      // no build: no suffix
      // build: the last number, take the maximum value + 1
      this.buildNameIndex = item.build_names.length
        ? Math.max.apply(
          null,
          item.build_names.map(buildName => {
            const names = buildName.split('-')
            const last = names[names.length - 1]
            return isNaN(last) ? 1 : Number(last) + 1
          })
        )
        : 0
      const key = this.$utils.rsaEncrypt()
      const res = await getCodeProviderAPI(key)
      if (res && res.length > 0) {
        this.$router.push(
          `${this.buildBaseUrl}?rightbar=build&service_name=${item.name}&build_add=true`
        )
      } else {
        this.integrationCodeDrawer = true
      }
    },
    followUpFn () {
      this.getServiceTemplateWithConfig()
      this.$router.replace({
        query: Object.assign(
          {},
          qs.parse(window.location.search, { ignoreQueryPrefix: true }),
          {
            rightbar: 'var'
          }
        )
      })
    },
    getProject () {
      const projectName = this.projectName
      getSingleProjectAPI(projectName).then(res => {
        this.projectForm = res
        if (res.team_id === 0) {
          this.projectForm.team_id = null
        }
      })
    },
    getServiceTemplateWithConfig () {
      if (
        this.service &&
        this.service.type === 'k8s' &&
        this.service.status === 'added'
      ) {
        projectServiceWithConfigAPI(
          this.service.service_name,
          this.projectNameOfService
        ).then(res => {
          this.serviceConfigs = res
          this.initVariableYaml = res.variable_yaml
          this.$emit('onGetServiceWithConfigs', res)
        })
      }
      if (this.service.status === 'named') {
        this.changeRoute('var')
      }
    },
    changeRoute (step) {
      this.$route.query.service_project_name &&
        delete this.$route.query.service_project_name
      this.$route.query.build_name && delete this.$route.query.build_name
      this.$router.replace({
        query: Object.assign({}, this.$route.query, {
          rightbar: step
        })
      })
    },
    getRegistryWhenBuild () {
      getRegistryWhenBuildAPI(this.projectName).then(res => {
        this.allRegistry = res
      })
    },
    onCmCodeChange: debounce(function (newCode) {
      this.serviceConfigs.variable_yaml = newCode
    }, 300),
    validateVariables () {
      const payload = {
        content: this.serviceConfigs.service.yaml,
        variable_yaml: this.serviceConfigs.variable_yaml
      }
      validateKubernetesTemplateVariableAPI(payload)
        .then(res => {
          if (res) {
            this.$message.success(
              this.$t('templates.k8sYaml.validationSuccess')
            )
          }
        })
        .catch(err => {
          this.$message.error(err.message)
        })
    },
    async saveServiceVariable () {
      const projectName = this.projectName
      const serviceName = this.service.service_name
      if (this.serviceConfigs.service_variable_kvs) {
        this.serviceConfigs.service_variable_kvs.forEach(item => {
          if (item.type === 'enum' && item.optionsStr) {
            item.options = item.optionsStr.split(',')
            delete item.optionsStr
          }
        })
      }
      const convertPayload = {
        action: this.variableSwitcher === 'yamlEditor' ? 'toKV' : 'toYaml',
        kvs: this.serviceConfigs.service_variable_kvs,
        yaml: this.serviceConfigs.variable_yaml
      }
      // 保存前先做 convert，同步变量和 yaml
      const convertResult = await convertVariableToKvAPI(convertPayload).catch(err => {
        this.$message.error(err.message)
      })
      if (convertResult) {
        this.serviceConfigs.variable_yaml = convertResult.yaml
        this.serviceConfigs.service_variable_kvs = convertResult.kvs
      }
      const savePayload = {
        service_variable_kvs: this.serviceConfigs.service_variable_kvs,
        variable_yaml: this.serviceConfigs.variable_yaml
      }
      const saveResult = await saveServiceVariableAPI(serviceName, projectName, savePayload).catch(err => {
        this.$message.error(err.message)
        this.getServiceTemplateWithConfig()
      })
      if (saveResult) {
        this.getServiceTemplateWithConfig()
        this.$message.success(this.$t('services.k8s.variablesHasBeenSuccessfullySaved'))
      }
    },
    checkVariableViewType () {
      const viewType = store.get('variableViewType')
      if (viewType && viewType.type && viewType.username === this.username) {
        this.variableSwitcher = viewType.type
      } else {
        this.variableSwitcher = 'yamlEditor'
      }
    },
    changeVariableView (type) {
      store.set('variableViewType', { type: type, username: this.username })
      if (type === 'list') {
        if (this.initVariableYaml !== this.serviceConfigs.variable_yaml) {
          this.$confirm(this.$t('services.k8s.yamlChangedTooltip'), this.$t('global.tips'), {
            confirmButtonText: this.$t('global.confirm'),
            cancelButtonText: this.$t('global.cancel'),
            type: 'warning'
          }).then(() => {
            const payload = {
              action: 'toKV',
              kvs: this.serviceConfigs.service_variable_kvs,
              yaml: this.serviceConfigs.variable_yaml
            }
            convertVariableToKvAPI(payload)
              .then(res => {
                this.serviceConfigs.service_variable_kvs = res.kvs
                this.serviceConfigs.variable_yaml = res.yaml
                this.saveServiceVariable()
              })
              .catch(err => {
                this.$message.error(err.message)
              })
          }).catch(() => {
            const payload = {
              action: 'toKV',
              kvs: this.serviceConfigs.service_variable_kvs,
              yaml: this.initVariableYaml
            }
            convertVariableToKvAPI(payload)
              .then(res => {
                this.serviceConfigs.service_variable_kvs = res.kvs
                this.serviceConfigs.variable_yaml = res.yaml
              })
              .catch(err => {
                this.$message.error(err.message)
              })
          })
        }
      } else if (type === 'yamlEditor') {
        const payload = {
          action: 'toYaml',
          kvs: this.serviceConfigs.service_variable_kvs,
          yaml: this.serviceConfigs.variable_yaml
        }
        convertVariableToKvAPI(payload)
          .then(res => {
            this.serviceConfigs.service_variable_kvs = res.kvs
            this.serviceConfigs.variable_yaml = res.yaml
          })
          .catch(err => {
            this.$message.error(err.message)
          })
      }
    },
    changeVariableType (type) {
      if (type === 'bool') {
        this.$set(this.serviceVariableKv, 'options', [])
        this.$set(this.serviceVariableKv, 'optionsStr', '')
        this.$set(this.serviceVariableKv, 'value', true)
      } else {
        this.$set(this.serviceVariableKv, 'options', [])
        this.$set(this.serviceVariableKv, 'optionsStr', '')
        this.$set(this.serviceVariableKv, 'value', '')
      }
    },
    addVariable () {
      this.mode = 'add'
      this.$set(this, 'serviceVariableKv', {
        desc: '',
        key: '',
        options: [],
        optionsStr: '',
        type: 'string',
        value: ''
      })
      this.variableDialogVisible = true
      this.$nextTick(() => {
        this.$refs.variableForm.clearValidate()
      })
    },
    editCurrentVariable (row) {
      this.mode = 'edit'
      const data = cloneDeep(row)
      if (data.type === 'enum') {
        data.optionsStr = data.options.join(',')
      }
      this.serviceVariableKv = data
      this.variableDialogVisible = true
    },
    cancel () {
      this.$nextTick(() => {
        this.$refs.variableForm.clearValidate()
      })
      this.$set(this, 'serviceVariableKv', {
        desc: '',
        key: '',
        options: [],
        optionsStr: '',
        type: 'string',
        value: ''
      })
      this.variableDialogVisible = false
    },
    deleteCurrentVariable (index) {
      this.serviceConfigs.service_variable_kvs.splice(index, 1)
      this.saveServiceVariable()
    },
    saveVariable () {
      this.$refs.variableForm.validate((valid) => {
        if (valid) {
          this.serviceConfigs.service_variable_kvs.push(cloneDeep(this.serviceVariableKv))
          this.$refs.variableForm.clearValidate()
          this.variableDialogVisible = false
          this.saveServiceVariable()
        }
      })
    },
    updateVariable () {
      this.$refs.variableForm.validate((valid) => {
        if (valid) {
          const index = this.serviceConfigs.service_variable_kvs.findIndex(
            item => item.key === this.serviceVariableKv.key
          )
          this.serviceConfigs.service_variable_kvs.splice(index, 1, cloneDeep(this.serviceVariableKv))
          this.$refs.variableForm.clearValidate()
          this.variableDialogVisible = false
          this.saveServiceVariable()
        }
      })
    },
    onYamlVariablesCodeChange (code) {
      this.serviceVariableKv.value = code
    }
  },
  created () {
    this.getRegistryWhenBuild()
    this.getProject()
    this.getServiceTemplateWithConfig()
    if (this.$route.query.rightbar) {
      this.changeRoute(this.$route.query.rightbar)
    } else {
      this.changeRoute('var')
    }
    this.checkVariableViewType()
  },
  props: {
    service: {
      required: false,
      type: Object
    },
    services: {
      required: false,
      type: Array
    },
    buildBaseUrl: {
      required: true,
      type: String
    },
    latestYaml: {
      required: true,
      type: String
    },
    changeEditorWidth: Function
  },
  watch: {
    service (val) {
      if (val) {
        this.getServiceTemplateWithConfig()
        this.changeRoute('var')
      }
    }
  },
  computed: {
    projectName () {
      return this.$route.params.project_name
    },
    projectNameOfService () {
      return this.service.product_name
    },
    serviceType () {
      return 'k8s'
    },
    selected () {
      const defaultAside = this.service.status === 'named' ? 'help' : 'var'
      const selected = this.$route.query.rightbar || defaultAside
      if (selected === 'build') {
        this.changeEditorWidth('30%')
      } else {
        this.changeEditorWidth('50%')
      }
      return selected
    },
    editorOptions () {
      return {
        tabSize: 5,
        readOnly: this.notSaved ? 'nocursor' : false,
        theme: 'neo',
        mode: 'text/plain',
        lineNumbers: true,
        line: true,
        collapseIdentical: true
      }
    },
    variableYamlIsEmpty () {
      return this.serviceConfigs.variable_yaml === ''
    },
    variableNotChanged () {
      return this.serviceConfigs.variable_yaml === this.initVariableYaml
    },
    ...mapState({
      userInfo: state => state.login.userinfo
    }),
    username () {
      // 系统用户
      if (this.userInfo.identityType === 'system') {
        if (this.userInfo.name) {
          return `${this.userInfo.name}(${this.userInfo.account})`
        } else {
          return this.userInfo.account
        } // 第三方登录
      } else if (this.userInfo.preferred_username) {
        return `${this.userInfo.name}(${this.userInfo.preferred_username})`
      } else {
        return this.userInfo.name
      }
    }
  },
  components: {
    CommonBuild,
    Policy,
    Help,
    IntegrationCode,
    ProjectGlobalVariables,
    IntegrationRegistry,
    VariablesEditor: codemirror
  }
}
</script>
<style lang="less" scoped>
.aside__wrap {
  position: relative;
  display: flex;
  flex: 1;
  height: 100%;

  .variable-dialog {
    .full-width {
      width: 100%;
    }

    .yaml-variable-editor {
      display: inline-block;
      width: 100%;
      height: 200px;

      .vue-codemirror {
        width: 100%;
        height: 100%;

        /deep/.CodeMirror {
          height: 100%;
          border: 1px solid #ccc;
          border-radius: 4px;
        }
      }
    }
  }

  .aside__inner {
    display: flex;
    flex: 1;
    flex-direction: row-reverse;
    box-shadow: 0 4px 4px rgba(0, 0, 0, 0.05);

    .aside__content {
      flex: 1;
      width: 200px;
      overflow-x: hidden;
      background-color: #fff;

      .service-aside--variables {
        display: flex;
        flex-direction: column;
        flex-grow: 1;
        height: 100%;

        .service-aside-box__header {
          display: flex;
          flex-shrink: 0;
          align-items: center;
          justify-content: space-between;
          width: 100%;
          height: 35px;
          padding: 10px 7px 10px 20px;

          .service-aside-box__title {
            margin-right: 20px;
            margin-bottom: 0;
            color: #000;
            font-weight: bold;
            font-size: 16px;
            text-transform: uppercase;
          }
        }

        .service-aside-box__content {
          flex-grow: 1;
          overflow-x: hidden;
          overflow-y: auto;

          .aside-section {
            position: relative;
            padding: 12px 16px;

            h4 {
              margin: 0;
              padding: 0;
              color: #909399;
              font-weight: 300;
            }

            /deep/ .el-table td,
            /deep/ .el-table th {
              padding: 6px 0;
            }

            .variable-operation-container {
              display: flex;
              flex-direction: row;
              align-content: center;
              align-items: center;
              justify-content: space-between;

              .tab-conatiner {
                display: flex;
              }
            }

            .kv-container {
              height: 200px;
              margin-top: 5px;

              /deep/ .vue-codemirror {
                width: 100%;
                height: 100%;

                .CodeMirror {
                  height: 100%;
                  border: 1px solid #ccc;
                  border-radius: 4px;
                }
              }

              .icon-tooltip {
                cursor: pointer;
              }
            }

            .list-container {
              margin-top: 5px;

              .variable-list-operation {
                .icon {
                  margin-right: 10px;
                  font-size: 17px;
                  cursor: pointer;

                  &:last-child {
                    margin-right: 0;
                  }
                }

                .edit {
                  color: @themeColor;
                }

                .delete {
                  color: #f56c6c;
                }
              }
            }

            .operation {
              margin-top: 10px;
            }

            .build-name {
              display: inline-block;
              margin-top: 5px;
              font-size: 12px;
              line-height: 16px;
            }
          }
        }

        .service-aside-help__content {
          display: flex;
          flex: 1;
          flex-direction: column;
          height: 100%;
          padding: 0 20px 10px 20px;
          overflow-y: auto;
        }
      }
    }

    .aside-bar {
      .tabs__wrap_vertical {
        flex-direction: column;
        width: 47px;
        height: 100%;
        background-color: #f5f5f5;
        border: none;

        .tabs__item {
          position: relative;
          display: flex;
          align-items: center;
          margin-bottom: -1px;
          padding: 20px 17px;
          color: #000;
          font-size: 13px;
          text-transform: uppercase;
          text-orientation: mixed;
          background-color: #f5f5f5;
          border: none;
          border-top: 1px solid transparent;
          cursor: pointer;
          transition: background-color 150ms ease, color 150ms ease;

          &.selected {
            z-index: 1;
            background-color: #fff;
            border: none;
            box-shadow: 0 4px 4px rgba(0, 0, 0, 0.05);
          }

          &:hover {
            z-index: 2;
            color: #000;
            background-color: #fff;
            border: none;
            border-top: 1px solid #f5f5f5;
            box-shadow: 0 4px 4px rgba(0, 0, 0, 0.05);
          }

          .step-name {
            font-weight: 500;
            font-size: 14px;
            writing-mode: vertical-rl;
          }
        }
      }

      .tabs__wrap {
        display: flex;
        justify-content: flex-start;
        height: 56px;
      }
    }
  }
}

.theme-color {
  color: @themeColor;
}
</style>
