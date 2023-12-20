<template>
  <div class="import-from-template-container">
    <el-dialog
      :title="currentUpdatedServiceName?$t('services.common.updateService'):'新建服务 - 使用模板新建'"
      :close-on-click-modal="false"
      append-to-body
      center
      width="760px"
      custom-class="dialog-import-from-template"
      :visible="dialogImportFromYamlVisible"
      @update:visible="$emit('update:dialogImportFromYamlVisible', $event)"
    >
      <el-form :model="importYaml" @submit.native.prevent label-position="left" ref="importYamlForm" :rules="serviceRules">
        <el-form-item :label="$t(`global.serviceName`)" prop="serviceName">
          <el-input
            style="width: calc(100% - 90px);"
            v-model.trim="importYaml.serviceName"
            size="small"
            :disabled="currentUpdatedServiceName!==''?true:false"
            :placeholder="$t('services.common.inputServiceName')"
            clearable
          ></el-input>
        </el-form-item>
        <el-form-item label="选择模板" prop="id">
          <el-select style="width: calc(100% - 90px);" size="small" v-model="importYaml.id" placeholder="请选择模板" @change="getKubernetesTemplate">
            <el-option disabled value="NEWMODULE">
              <router-link to="/v1/template/k8s-yamls" class="module-link">
                <i class="el-icon-circle-plus-outline" style="margin-right: 3px;"></i>
                新建模板
              </router-link>
            </el-option>
            <el-option v-for="item in importYaml.yamls" :key="item.id" :label="item.name" :value="item.id"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="变量配置">
          <div class="variables-container">
            <el-table :data="importYaml.service_variable_kvs" style="width: 100%;">
              <el-table-column :label="$t(`global.key`)">
                <template slot-scope="scope">
                  <span>{{ scope.row.key }}</span>
                </template>
              </el-table-column>
              <el-table-column :label="$t(`global.desc`)">
                <template slot-scope="scope">
                  <span>{{ scope.row.desc }}</span>
                </template>
              </el-table-column>
              <el-table-column :label="$t(`global.value`)">
                <template slot-scope="scope">
                  <el-input v-if="scope.row.type === 'string'" size="mini" v-model="scope.row.value"></el-input>
                  <el-select v-else-if="scope.row.type === 'enum'" v-model="scope.row.value" class="full-width" size="mini">
                    <el-option v-for="(item,index) in scope.row.options" :key="index" :label="item" :value="item"></el-option>
                  </el-select>
                  <el-switch v-else-if="scope.row.type === 'bool'" v-model="scope.row.value"></el-switch>
                  <VariableEditor
                    v-else-if="scope.row.type === 'yaml'"
                    style="width: 100%; height: 100%;"
                    :ref="`variablesYamlEditor-${scope.$index}`"
                    :value.sync="scope.row.value"
                    :varKey="scope.row.key"
                    @changeValue="(value) => {scope.row.value = value}"
                  />
                </template>
              </el-table-column>
            </el-table>
          </div>
        </el-form-item>
        <el-form-item prop="auto_sync">
          <span style="margin-right: 16px;">
            <span>{{$t('global.autoSync')}}</span>
            <el-tooltip content="开启后，对模板库操作应用到服务时，该服务配置将自动基于模板内容同步。" placement="top">
              <i class="pointer el-icon-question"></i>
            </el-tooltip>
          </span>
          <el-switch v-model="importYaml.auto_sync" />
        </el-form-item>
        <el-form-item>
          <el-button
            :disabled="!importYaml.id"
            style="margin-left: 5px;"
            type="text"
            :icon="previewYamlFile?'el-icon-arrow-up':'el-icon-arrow-down'"
            @click="getTemplatePreview"
          >
            {{
            previewYamlFile ? '关闭预览' : $t('global.preview')
            }}
          </el-button>
        </el-form-item>
      </el-form>
      <div v-if="previewYamlFile" class="preview-container">
        <codemirror v-model="renderedYaml" :options="importTemplateEditorOption" />
      </div>
      <div slot="footer" class="dialog-footer">
        <el-button plain native-type="submit" @click="$emit('update:dialogImportFromYamlVisible', false)" size="small">{{$t(`global.cancel`)}}</el-button>
        <el-button
          type="primary"
          native-type="submit"
          size="small"
          class="start-create"
          @click="loadServiceFromKubernetesTemplate"
        >{{currentUpdatedServiceName?$t('global.update'):$t('global.add')}}</el-button>
      </div>
    </el-dialog>
  </div>
</template>
<script>
import { codemirror } from 'vue-codemirror'
import 'codemirror/lib/codemirror.css'
import 'codemirror/mode/yaml/yaml.js'
import 'codemirror/theme/neo.css'
import {
  loadServiceFromKubernetesTemplateAPI,
  reloadServiceFromKubernetesTemplateAPI,
  getKubernetesTemplatesAPI,
  getKubernetesTemplatePreviewAPI,
  getKubernetesTemplateDetailAPI,
  convertVariableToKvAPI
} from '@api'
export default {
  data () {
    return {
      previewYamlFile: false,
      renderedYaml: '',
      importYaml: {
        serviceName: '',
        id: '',
        yamls: [],
        service_variable_kvs: [],
        variable_yaml: '',
        content: '',
        auto_sync: false
      },
      importTemplateEditorOption: {
        tabSize: 2,
        readOnly: 'nocursor',
        theme: 'neo',
        mode: 'text/yaml',
        lineNumbers: true,
        line: true,
        showGutter: false,
        displayIndentGuides: false,
        showPrintMargin: false,
        collapseIdentical: true
      },
      importTemplateVariablesOptions: {
        tabSize: 5,
        readOnly: false,
        theme: 'neo',
        mode: 'text/x-yaml',
        lineNumbers: true,
        line: true,
        collapseIdentical: true
      }
    }
  },
  props: {
    projectName: {
      type: String,
      required: true
    },
    dialogImportFromYamlVisible: {
      type: Boolean,
      default: false
    },
    currentUpdatedServiceName: {
      type: String,
      required: false
    },
    currentUpdatedServiceTemplateId: {
      type: String,
      required: false
    },
    currentUpdatedServiceAutoSync: {
      type: Boolean,
      required: false
    },
    currentUpdatedServiceVariableYaml: {
      type: String,
      required: false
    },
    currentUpdatedServiceVariableKvs: {
      type: Array,
      required: false
    }
  },
  computed: {
    serviceRules () {
      const validateServiceName = (rule, value, callback) => {
        if (value === '') {
          callback(new Error(this.$t('services.common.inputServiceName')))
        } else {
          if (!/^[a-z0-9-]+$/.test(value)) {
            callback(new Error(this.$t('services.k8s.checkServiceName')))
          } else {
            callback()
          }
        }
      }
      const rules = {
        serviceName: [{
          type: 'string',
          required: true,
          validator: validateServiceName,
          trigger: ['blur', 'change']
        }],
        id: [{ required: true, message: '请选择模板', trigger: ['change', 'blur'] }]
      }
      return rules
    }
  },
  methods: {
    onVariablesCodeChange (code) {
      this.importYaml.variable_yaml = code
    },
    async getTemplatePreview () {
      this.previewYamlFile = !this.previewYamlFile
      if (this.previewYamlFile) {
        this.renderedYaml = ''
        const convertResult = await this.convertVariable('toYaml', this.importYaml.service_variable_kvs, this.importYaml.variable_yaml)
        if (convertResult) {
          this.importYaml.variable_yaml = convertResult.yaml
          this.importYaml.service_variable_kvs = convertResult.kvs
        }
        const renderedResult = await getKubernetesTemplatePreviewAPI({
          template_id: this.importYaml.id,
          variable_yaml: this.importYaml.variable_yaml,
          service_name: this.importYaml.serviceName
        }, this.projectName)
        if (renderedResult) {
          this.renderedYaml = renderedResult
        }
      }
    },
    async getKubernetesTemplate (id) {
      if (id) {
        this.previewYamlFile = false
        const projectName = this.projectName
        const res = await getKubernetesTemplateDetailAPI(id, projectName).catch(
          err => {
            console.log(err)
          }
        )
        if (res) {
          this.importYaml.content = res.content
          this.importYaml.variable_yaml = res.variable_yaml
          this.importYaml.service_variable_kvs = res.service_variable_kvs
        }
      }
    },
    async openImportYamlDialog () {
      this.previewYamlFile = false
      if (this.currentUpdatedServiceName) {
        this.importYaml.auto_sync = this.currentUpdatedServiceAutoSync
        this.importYaml.variable_yaml = this.currentUpdatedServiceVariableYaml
        this.importYaml.service_variable_kvs = this.currentUpdatedServiceVariableKvs
      } else {
        this.importYaml.serviceName = ''
        this.importYaml.id = ''
        this.importYaml.auto_sync = false
        this.importYaml.variable_yaml = ''
        this.importYaml.service_variable_kvs = []
      }
      const res = await getKubernetesTemplatesAPI(this.projectName)
      if (res) {
        this.importYaml.yamls = res.yaml_template
      }
    },
    async convertVariable (operation, originalKvs, originalYaml) {
      const convertPayload = {
        action: operation,
        kvs: originalKvs,
        yaml: originalYaml
      }
      const res = await convertVariableToKvAPI(convertPayload)
      if (res) {
        return res
      }
    },
    async loadServiceFromKubernetesTemplate () {
      const serviceName = this.currentUpdatedServiceName
        ? this.currentUpdatedServiceName
        : this.importYaml.serviceName
      const projectName = this.projectName
      const templateId = this.importYaml.id
      const variableYaml = this.importYaml.variable_yaml
      const serviceVariableKvs = this.importYaml.service_variable_kvs
      const autoSync = this.importYaml.auto_sync
      const payload = {
        service_name: serviceName,
        project_name: projectName,
        template_id: templateId,
        variable_yaml: variableYaml,
        service_variable_kvs: serviceVariableKvs,
        auto_sync: autoSync
      }
      const valid = await this.$refs.importYamlForm.validate().catch(err => {
        console.log(err)
      })
      if (valid) {
        const convertResult = await this.convertVariable('toYaml', payload.service_variable_kvs, payload.variable_yaml)
        if (convertResult) {
          payload.variable_yaml = convertResult.yaml
          payload.service_variable_kvs = convertResult.kvs
        }
        const fn = this.currentUpdatedServiceName ? reloadServiceFromKubernetesTemplateAPI : loadServiceFromKubernetesTemplateAPI
        const res = await fn(payload, projectName).catch(err => {
          console.log(err)
        })

        if (res) {
          this.$refs.importYamlForm.resetFields()
          this.importYaml.variable_yaml = ''
          this.importYaml.service_variable_kvs = []
          this.previewYamlFile = false
          this.$emit('update:dialogImportFromYamlVisible', false)
          this.$message({
            type: 'success',
            message: `服务 ${payload.service_name} ${
              this.currentUpdatedServiceName ? '更新' : '导入'
            }成功`
          })
          this.$emit('importYamlSuccess', serviceName)
        }
      }
    }
  },
  watch: {
    currentUpdatedServiceName (val) {
      if (val) {
        this.importYaml.serviceName = val
      } else {
        this.importYaml.serviceName = ''
      }
    },
    currentUpdatedServiceTemplateId (val) {
      if (val) {
        this.importYaml.id = val
      } else {
        this.importYaml.id = ''
      }
    },
    dialogImportFromYamlVisible (val) {
      if (val) {
        this.openImportYamlDialog()
      }
    }
  },
  components: {
    codemirror
  }
}
</script>
<style lang="less">
.dialog-source,
.dialog-import-from-template {
  .el-dialog__header {
    padding: 20px 20px 10px;
    font-size: 16px;
    border: 1px solid #d2d2d2;
  }

  .el-dialog__footer {
    padding: 0 20px 20px;
    text-align: right;
  }

  .el-dialog__body {
    padding: 40px 20px 0;

    .preload-container {
      .service-name,
      .contains {
        color: #909399;
        font-size: 13px;
      }

      .service-name {
        display: inline-block;
        margin-right: 4px;
        color: #303133;
      }
    }
  }

  .preload-error {
    color: #ff1949;
    font-size: 12px;
  }

  .full-width {
    width: 100%;
  }

  .variables-container {
    display: block;
    width: 100%;

    .vue-codemirror {
      width: 100%;
      height: 100%;

      .CodeMirror {
        height: 100%;
        border: 1px solid #ccc;
        border-radius: 4px;
      }
    }
  }

  .preview-container {
    width: 100%;
    height: 300px;
    margin-bottom: 10px;

    .vue-codemirror {
      width: 100%;
      height: 100%;

      .CodeMirror {
        height: 100%;
        border: 1px solid #ccc;
        border-radius: 4px;
      }
    }
  }
}

.module-link {
  display: inline-block;
  width: 100%;
  height: calc(~'100% - 1px');
  color: #606266;
  border-bottom: 1px solid #d2d7dc;
}
</style>
