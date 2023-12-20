<template>
  <div class="aside__wrap">
    <el-dialog :title="mode ==='edit'?$t('services.k8s.editKv'):$t('services.k8s.addKv')" :visible.sync="variableDialogVisible" width="480px" custom-class="variable-dialog">
      <el-form ref="variableForm" :model="serviceVariableKv" label-width="105px" label-position="left">
        <el-form-item :label="$t('global.key')" prop="key" :rules="{required: true, message: $t('services.k8s.inputKey'), trigger: ['blur', 'change']}">
          <el-input size="small" v-model="serviceVariableKv.key"  :disabled="mode === 'edit'"></el-input>
        </el-form-item>
        <el-form-item :label="$t('global.type')" prop="type" :rules="{required: true, message:  $t('services.k8s.selectType'), trigger: ['blur', 'change']}">
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
            <el-option v-for="(item,index) in serviceVariableKv.optionsStr.split(',')" :key="index" :label="item" :value="item"></el-option>
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
        <el-form-item v-else-if="serviceVariableKv.type === 'string'" :label="$t('global.value')" prop="value" :rules="{required: false, message: $t('services.k8s.inputValue'), trigger: ['blur', 'change']}">
          <el-input  size="small" :placeholder="$t('services.k8s.inputValue')" v-model="serviceVariableKv.value"></el-input>
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
    <div class="aside__inner">
      <div class="aside-bar">
        <div class="tabs__wrap tabs__wrap_vertical">
          <div class="tabs__item" :class="{'selected': $route.query.rightbar === 'var'}" @click="changeRoute('var')">
            <span class="step-name">{{$t('templates.k8sYaml.variablesList')}}</span>
          </div>
          <div class="tabs__item" :class="{'selected': $route.query.rightbar === 'reference'}" @click="changeRoute('reference')">
            <span class="step-name">{{$t('templates.k8sYaml.referenceList')}}</span>
          </div>
        </div>
      </div>
      <div class="aside__content">
        <div v-if="$route.query.rightbar === 'reference'" class="service-aside--variables">
          <header class="service-aside-box__header">
            <div class="service-aside-box__title">{{$t('templates.k8sYaml.referenceList')}}</div>
          </header>
          <div class="service-aside-box__content">
            <section class="aside-section">
              <el-table :data="referenceList" stripe style="width: 100%;">
                <el-table-column prop="project_name" :label="$t('templates.k8sYaml.projectName')"></el-table-column>
                <el-table-column prop="value" :label="$t(`global.serviceName`)">
                  <template slot-scope="scope">
                    <router-link
                      v-if="scope.row.service_name"
                      :to="`/v1/projects/detail/${scope.row.project_name}/services?service_name=${scope.row.service_name}&rightbar=var`"
                    >{{scope.row.service_name}}</router-link>
                    <span v-else>{{$t('templates.k8sYaml.noneVariable')}}</span>
                  </template>
                </el-table-column>
              </el-table>
            </section>
          </div>
        </div>
        <div v-if="$route.query.rightbar === 'var'" class="service-aside--variables">
          <header class="service-aside-box__header">
            <div class="service-aside-box__title">{{$t('templates.k8sYaml.variablesList')}}</div>
          </header>
          <div class="service-aside-box__content">
            <section class="aside-section">
              <h4>
                <span>
                  <i class="iconfont iconfuwu"></i>
                </span>
                {{$t('templates.k8sYaml.systemVariables')}}
              </h4>
              <el-table :data="systemVariables" stripe style="width: 100%;">
                <el-table-column prop="key" label="Key"></el-table-column>
                <el-table-column prop="description" :label="$t('global.desc')">
                  <template slot-scope="scope">
                    <span v-if="scope.row.description">{{scope.row.description}}</span>
                    <span v-else>{{$t('templates.k8sYaml.noneVariable')}}</span>
                  </template>
                </el-table-column>
              </el-table>
            </section>
            <section class="aside-section">
              <h4>
                <span>
                  <i class="iconfont icontanhao"></i>
                </span>
                {{$t('templates.k8sYaml.customVariables')}}
                <el-tooltip effect="dark" :content="$t('templates.k8sYaml.customVariablesTooltip')" placement="top">
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
              </div>
              <div v-if="variableSwitcher === 'yamlEditor'" class="kv-container">
                <VariablesEditor
                  style="width: 100%; height: 100%;"
                  ref="myCm"
                  :value="fileContent.variable_yaml"
                  :options="cmOptions"
                  @input="onCmCodeChange"
                />
              </div>
              <div v-else-if="variableSwitcher === 'list'" class="list-container">
                <el-table :data="fileContent.service_variable_kvs" style="width: 100%;">
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
                        <el-button v-if="checkPermissionSyncMixin({type:'system', action:fileStatus === 'added'?'edit_template':'create_template'})" type="text" size="medium" @click="editCurrentVariable(scope.row)">
                          <i class="icon el-icon-edit edit"></i>
                        </el-button>
                        <el-tooltip v-else effect="light" :content="$t('permission.lackPermission')" placement="top">
                          <el-button class="permission-disabled"  type="text" size="medium">
                            <i class="icon el-icon-edit"></i>
                          </el-button>
                        </el-tooltip>
                        <el-button v-if="checkPermissionSyncMixin({type:'system', action:fileStatus === 'added'?'edit_template':'create_template'})" type="text" size="medium" @click="deleteCurrentVariable(scope.$index)">
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
                  <el-button v-hasPermi="{type:'system', action:fileStatus === 'added'?'edit_template':'create_template', isBtn:true}" type="text" size="medium" @click="addVariable">
                    <i class="icon el-icon-circle-plus-outline"></i>
                  </el-button>
                </div>
              </div>
              <div v-if="notSaved" class="alert-container">
                <el-alert :title="$t('templates.k8sYaml.saveTemplateFirst')" type="info" :closable="false"></el-alert>
              </div>
              <div class="operation" v-else>
                <el-button
                  v-hasPermi="{type:'system', action:fileStatus === 'added'?'edit_template':'create_template',isBtn:true}"
                  type="primary"
                  size="small"
                  @click="validateVariables"
                  plain
                  :disabled="variableYamlIsEmpty"
                >{{$t(`global.validate`)}}</el-button>
                <el-button
                  v-if="variableSwitcher === 'yamlEditor'"
                  v-hasPermi="{type:'system', action: fileStatus === 'added'?'edit_template':'create_template',isBtn:true}"
                  type="primary"
                  size="small"
                  @click="saveKubernetesTemplateVariable"
                  :disabled="variableYamlIsEmpty"
                >{{$t(`global.save`)}}</el-button>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<script>
import {
  getKubernetesTemplateBuildReferenceAPI,
  validateKubernetesTemplateVariableAPI,
  saveKubernetesTemplateVariableAPI,
  convertVariableToKvAPI
} from '@api'
import { debounce, cloneDeep } from 'lodash'
import { codemirror } from 'vue-codemirror'
import 'codemirror/lib/codemirror.css'
import 'codemirror/theme/neo.css'
import store from 'storejs'
import { mapState } from 'vuex'

export default {
  data () {
    return {
      referenceList: [],
      variableSwitcher: 'yamlEditor',
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
    async getBuildReference () {
      if (this.fileContent && this.fileContent.status === 'added') {
        const res = await getKubernetesTemplateBuildReferenceAPI(
          this.fileContent.id
        ).catch(err => {
          console.log(err)
        })
        if (res) {
          this.referenceList = res
        }
      }
    },
    changeRoute (step) {
      this.$router.replace({
        query: Object.assign({}, this.$route.query, {
          rightbar: step
        })
      })
    },
    onCmCodeChange: debounce(function (newCode) {
      this.fileContent.variable_yaml = newCode
    }, 300),
    validateVariables () {
      const payload = {
        content: this.fileContent.content,
        variable_yaml: this.fileContent.variable_yaml
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
    async saveKubernetesTemplateVariable () {
      const id = this.fileContent.id
      if (this.fileContent.service_variable_kvs) {
        this.fileContent.service_variable_kvs.forEach(item => {
          if (item.type === 'enum' && item.optionsStr) {
            item.options = item.optionsStr.split(',')
            delete item.optionsStr
          }
        })
      }
      const convertPayload = {
        action: this.variableSwitcher === 'yamlEditor' ? 'toKV' : 'toYaml',
        kvs: this.fileContent.service_variable_kvs,
        yaml: this.fileContent.variable_yaml
      }
      // 保存前先做 convert，同步变量和 yaml
      const convertResult = await convertVariableToKvAPI(convertPayload).catch(err => {
        this.$message.error(err.message)
      })
      if (convertResult) {
        this.fileContent.variable_yaml = convertResult.yaml
        this.fileContent.service_variable_kvs = convertResult.kvs
      }
      const saveResult = await saveKubernetesTemplateVariableAPI(id, this.fileContent).catch(err => {
        this.$emit('updateTemplate', this.fileContent)
        this.$message.error(err.message)
      })
      if (saveResult) {
        this.$message.success(
          this.$t('templates.k8sYaml.successfullySaved')
        )
        this.$emit('updateTemplate', this.fileContent)
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
        if (this.initVariableYaml !== this.fileContent.variable_yaml) {
          this.$confirm(this.$t('templates.k8sYaml.yamlChangedTooltip'), this.$t('global.tips'), {
            confirmButtonText: this.$t('global.confirm'),
            cancelButtonText: this.$t('global.cancel'),
            type: 'warning'
          }).then(() => {
            const payload = {
              action: 'toKV',
              kvs: this.fileContent.service_variable_kvs,
              yaml: this.fileContent.variable_yaml
            }
            convertVariableToKvAPI(payload)
              .then(res => {
                this.fileContent.service_variable_kvs = res.kvs
                this.fileContent.variable_yaml = res.yaml
                this.saveKubernetesTemplateVariable()
              })
              .catch(err => {
                this.$message.error(err.message)
              })
          }).catch(() => {
            const payload = {
              action: 'toKV',
              kvs: this.fileContent.service_variable_kvs,
              yaml: this.initVariableYaml
            }
            convertVariableToKvAPI(payload)
              .then(res => {
                this.fileContent.service_variable_kvs = res.kvs
                this.fileContent.variable_yaml = res.yaml
              })
              .catch(err => {
                this.$message.error(err.message)
              })
          })
        }
      } else if (type === 'yamlEditor') {
        const payload = {
          action: 'toYaml',
          kvs: this.fileContent.service_variable_kvs,
          yaml: this.fileContent.variable_yaml
        }
        convertVariableToKvAPI(payload)
          .then(res => {
            this.fileContent.service_variable_kvs = res.kvs
            this.fileContent.variable_yaml = res.yaml
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
      this.fileContent.service_variable_kvs.splice(index, 1)
      this.saveKubernetesTemplateVariable()
    },
    saveVariable () {
      this.$refs.variableForm.validate((valid) => {
        if (valid) {
          this.fileContent.service_variable_kvs.push(cloneDeep(this.serviceVariableKv))
          this.$refs.variableForm.clearValidate()
          this.variableDialogVisible = false
          this.saveKubernetesTemplateVariable()
        }
      })
    },
    updateVariable () {
      this.$refs.variableForm.validate((valid) => {
        if (valid) {
          const index = this.fileContent.service_variable_kvs.findIndex(
            item => item.key === this.serviceVariableKv.key
          )
          this.fileContent.service_variable_kvs.splice(index, 1, cloneDeep(this.serviceVariableKv))
          this.$refs.variableForm.clearValidate()
          this.variableDialogVisible = false
          this.saveKubernetesTemplateVariable()
        }
      })
    },
    onYamlVariablesCodeChange (code) {
      this.serviceVariableKv.value = code
    }
  },
  props: {
    fileContent: {
      required: true,
      type: Object
    },
    systemVariables: {
      required: true,
      type: Array
    },
    initVariableYaml: {
      required: true,
      type: String
    }
  },
  computed: {
    notSaved () {
      return this.fileContent.status === 'named'
    },
    fileStatus () {
      return this.fileContent.status
    },
    cmOptions () {
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
      return this.fileContent.variable_yaml === ''
    },
    variableNotChanged () {
      return this.fileContent.variable_yaml === this.initVariableYaml
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
  watch: {
    fileContent: {
      handler (val, old_val) {
        if (val) {
          this.getBuildReference(val.id)
        }
      },
      immediate: false
    }
  },
  created () {
    this.checkVariableViewType()
  },
  components: {
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

            .alert-container {
              margin-top: 10px;
            }

            .operation {
              margin-top: 10px;
            }
          }
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
</style>
