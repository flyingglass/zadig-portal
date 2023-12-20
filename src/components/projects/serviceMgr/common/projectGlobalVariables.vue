<template>
    <div class="project-global-variables">
        <el-dialog :title="mode ==='edit'?$t('services.k8s.editGlobalKv'):$t('services.k8s.addGlobalKv')" :visible.sync="variableDialogVisible" width="480px" custom-class="variable-dialog">
        <el-form ref="variableForm" :model="variableKv" label-width="105px" label-position="left">
            <el-form-item :label="$t('global.key')" prop="key" :rules="{required: true, message: $t('services.k8s.inputKey'), trigger: ['blur', 'change']}">
              <el-select v-model="variableKv.key" :disabled="mode === 'edit'" size="small" class="full-width" :placeholder="$t('services.k8s.selectKey')" filterable allow-create>
              <el-option
                  v-for="(item,index) in globalVariableCandidates"
                  :key="index"
                  :label="item.key_name"
                  :value="item.key_name">
              </el-option>
              </el-select>
            </el-form-item>
            <el-form-item :label="$t('global.type')" prop="type" :rules="{required: true, message: $t('services.k8s.selectType'), trigger: ['blur', 'change']}">
              <el-select v-model="variableKv.type" @change="changeVariableType" class="full-width" size="small" :placeholder="$t('services.k8s.selectType')">
                <el-option :label="$t('global.string')" value="string"></el-option>
                <el-option :label="$t('global.enumeration')" value="enum"></el-option>
                <el-option :label="$t('global.boolean')" value="bool"></el-option>
                <el-option label="YAML" value="yaml"></el-option>
              </el-select>
            </el-form-item>
            <el-form-item v-if="variableKv.type === 'enum'" :label="$t('services.k8s.optionalValues')" prop="optionsStr" :rules="{required: true, message: $t('services.k8s.inputOptionalValues'), trigger: ['blur', 'change']}">
              <el-input type="textarea" :autosize="{ minRows: 2}" size="small" :placeholder="$t('services.k8s.optionalValuesPlaceholder')" v-model="variableKv.optionsStr"></el-input>
            </el-form-item>
            <el-form-item v-if="variableKv.type === 'bool'" :label="$t('global.value')" prop="value">
              <el-switch v-model="variableKv.value"></el-switch>
            </el-form-item>
            <el-form-item v-else-if="variableKv.type === 'enum'" :label="$t('global.value')" prop="value" :rules="{required: true, message: $t('services.k8s.selectDefaultValue'), trigger: ['blur', 'change']}">
              <el-select v-model="variableKv.value"  class="full-width" size="small" :placeholder="$t('services.k8s.selectDefaultValue')">
                  <el-option v-for="(item,index) in variableKv.optionsStr.split(',')" :key="index" :label="item" :value="item"></el-option>
              </el-select>
            </el-form-item>
            <el-form-item v-else-if="variableKv.type === 'yaml'" :label="$t('global.value')" prop="value" :rules="{required: false, message: $t('services.k8s.inputKey'), trigger: ['blur', 'change']}">
            <div class="yaml-variable-editor">
                <VariablesEditor
                style="width: 100%; height: 100%;"
                ref="variablesYamlEditor"
                @input="onYamlVariablesCodeChange"
                :value="variableKv.value"
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
            <el-form-item v-else-if="variableKv.type === 'string'" :label="$t('global.value')" prop="value" :rules="{required: false, message: $t('services.k8s.inputValue'), trigger: ['blur', 'change']}">
            <el-input  size="small" :placeholder="$t('services.k8s.inputValue')" v-model="variableKv.value"></el-input>
            </el-form-item>
            <el-form-item :label="$t('global.desc')">
            <el-input type="textarea" :rows="2" size="small" v-model="variableKv.desc"></el-input>
            </el-form-item>
        </el-form>
        <span slot="footer" class="dialog-footer">
            <el-button type="primary" size="small" @click="mode === 'add'?saveVariable():updateVariable()">{{$t('global.save')}}</el-button>
            <el-button size="small" @click="cancel">{{$t('global.cancel')}}</el-button>
        </span>
        </el-dialog>
        <el-table :data="globalVariables" style="width: 100%;">
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
                <el-select v-else-if="scope.row.type === 'enum'" v-model="scope.row.value" size="mini" disabled></el-select>
                <el-switch v-else-if="scope.row.type === 'bool'" v-model="scope.row.value" disabled :active-value="scope.row.value===true?true:'true'" :inactive-value="scope.row.value===false?false:'false'"></el-switch>
            </template>
          </el-table-column>
          <el-table-column label="">
            <template slot-scope="scope">
                <div class="variable-list-operation">
                <i class="icon el-icon-edit edit" @click="editCurrentVariable(scope.row)"></i>
                <i class="icon el-icon-remove-outline delete" @click="deleteCurrentVariable(scope.$index)"></i>
                </div>
            </template>
          </el-table-column>
        </el-table>
        <div class="variable-list-operation">
            <el-button type="text" size="medium" @click="addVariable">
              <i class="icon el-icon-circle-plus-outline"></i>
            </el-button>
        </div>
    </div>
</template>
<script>
import { getProjectVariablesAPI, getProjectVariableCandidatesAPI, updateProjectVariablesAPI } from '@api'
import { cloneDeep } from 'lodash'
import { codemirror } from 'vue-codemirror'
import 'codemirror/lib/codemirror.css'
import 'codemirror/theme/neo.css'
export default {
  data () {
    return {
      globalVariables: [],
      globalVariableCandidates: [],
      variableKv: {
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
  computed: {
    projectName () {
      return this.$route.params.project_name
    }
  },
  methods: {
    changeVariableType (type) {
      if (type === 'bool') {
        this.$set(this.variableKv, 'options', [])
        this.$set(this.variableKv, 'optionsStr', '')
        this.$set(this.variableKv, 'value', true)
      } else {
        this.$set(this.variableKv, 'options', [])
        this.$set(this.variableKv, 'optionsStr', '')
        this.$set(this.variableKv, 'value', '')
      }
    },
    addVariable () {
      this.mode = 'add'
      this.$set(this, 'variableKv', {
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
      this.variableKv = data
      this.variableDialogVisible = true
    },
    deleteCurrentVariable (index) {
      this.globalVariables.splice(index, 1)
      this.saveProjectVariables()
    },
    saveVariable () {
      this.$refs.variableForm.validate((valid) => {
        if (valid) {
          this.globalVariables.push(cloneDeep(this.variableKv))
          this.$refs.variableForm.clearValidate()
          this.variableDialogVisible = false
          this.saveProjectVariables()
        }
      })
    },
    updateVariable () {
      this.$refs.variableForm.validate((valid) => {
        if (valid) {
          const index = this.globalVariables.findIndex(
            item => item.key === this.variableKv.key
          )
          this.globalVariables.splice(index, 1, cloneDeep(this.variableKv))
          this.$refs.variableForm.clearValidate()
          this.variableDialogVisible = false
          this.saveProjectVariables()
        }
      })
    },
    getProjectVariables () {
      getProjectVariablesAPI(this.projectName).then(res => {
        this.globalVariables = res
      })
    },
    getProjectVariableCandidates () {
      getProjectVariableCandidatesAPI(this.projectName).then(res => {
        this.globalVariableCandidates = res
      })
    },
    saveProjectVariables () {
      this.globalVariables.forEach(item => {
        if (item.type === 'enum' && item.optionsStr) {
          item.options = item.optionsStr.split(',')
          delete item.optionsStr
        }
      })
      const payload = {
        global_variables: this.globalVariables
      }
      updateProjectVariablesAPI(this.projectName, payload).then(() => {
        this.getProjectVariableCandidates()
        this.$message.success(this.$t('services.k8s.globalVariablesHasBeenSuccessfullySaved'))
      }, () => {
        this.getProjectVariables()
        this.getProjectVariableCandidates()
      })
    },
    cancel () {
      this.$nextTick(() => {
        this.$refs.variableForm.clearValidate()
      })
      this.$set(this, 'variableKv', {
        desc: '',
        key: '',
        options: [],
        optionsStr: '',
        type: 'string',
        value: ''
      })
      this.variableDialogVisible = false
    },
    onYamlVariablesCodeChange (code) {
      this.variableKv.value = code
    }
  },
  created () {
    this.getProjectVariables()
    this.getProjectVariableCandidates()
  },
  components: {
    VariablesEditor: codemirror
  }
}
</script>
<style lang="less" scoped>
.project-global-variables {
  padding: 0 20px;

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
</style>
