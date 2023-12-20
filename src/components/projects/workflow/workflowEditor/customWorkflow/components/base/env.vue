<template>
  <div class="global-env">
    <el-dialog title="代码库" :visible.sync="repoDialogVisible" width="450px" append-to-body>
      <VarRepoSelect ref="repoSelectRef" :config="currentRepoVar" />
      <span slot="footer" class="dialog-footer">
        <el-button size="small" @click="repoDialogVisible = false">取 消</el-button>
        <el-button size="small" type="primary" @click="saveRepoParams">确 定</el-button>
      </span>
    </el-dialog>
    <el-form ref="buildEnvRef" :inline="true" :model="preEnvs" class="variable-form" label-position="top" label-width="80px">
      <el-row :gutter="2" class="th">
        <el-col :span="6" class="th-title">{{$t(`global.type`)}}</el-col>
        <el-col :span="6" class="th-title">{{$t(`global.key`)}}</el-col>
        <el-col :span="6" class="th-title">{{$t(`global.value`)}}</el-col>
      </el-row>
      <el-button
        v-if="preEnvs.params && preEnvs.params.length===0"
        @click="addFirstBuildEnv()"
        type="primary"
        size="mini"
        plain
        class="mg-b16"
      >+ {{$t(`global.add`)}}</el-button>
      <el-row v-for="(item,envIndex) in preEnvs.params" :key="envIndex" :gutter="2">
        <el-col :span="6">
          <el-form-item class="display-flex">
            <el-select
              v-model="preEnvs.params[envIndex].type"
              :placeholder="$t(`global.type`)"
              size="small"
              :class="{'partial-width': preEnvs.params[envIndex].type === 'choice'}"
              style="margin-right: 6px;"
              @change="changeEnvType(envIndex)"
            >
              <el-option :label="$t('global.string')" value="string"></el-option>
              <el-option :label="$t('global.multilineText')" value="text"></el-option>
              <el-option :label="$t('global.enumeration')" value="choice"></el-option>
              <el-option :label="$t('global.repository')" value="repo"></el-option>
            </el-select>
            <i
              v-show="preEnvs.params[envIndex].type === 'choice'"
              class="el-icon-edit edit-icon"
              @click="updateParams(envIndex)"
            ></i>
          </el-form-item>
        </el-col>
        <el-col :span="6">
          <el-form-item
            :prop="'params.' + envIndex + '.name'"
            :rules="{required: true, message: $t(`global.inputKey`), trigger: ['blur','change']}"
          >
            <el-input
              :placeholder="$t(`global.key`)"
              v-model="preEnvs.params[envIndex].name"
              size="small"
              @input="updateKeyParams(envIndex)"
            ></el-input>
          </el-form-item>
        </el-col>
        <el-col :span="6">
          <el-form-item
            :prop="preEnvs.params[envIndex].type === 'repo'?'params.' + envIndex + '.repo':'params.' + envIndex + '.value'"
            :rules="{required: true, message: $t(`global.inputValue`), trigger: ['blur','change']}"
          >
            <el-select
              v-if="preEnvs.params[envIndex].type==='choice'"
              v-model="preEnvs.params[envIndex].value"
              placeholder="默认值"
              size="small"
              style="max-width: 176px;"
            >
              <el-option v-for="option in preEnvs.params[envIndex].choice_option" :key="option" :label="option" :value="option"></el-option>
            </el-select>
            <el-input
              v-else-if="preEnvs.params[envIndex].type==='string'"
              :disabled="preEnvs.params[envIndex].auto_generate"
              :placeholder="$t(`global.value`)"
              @input="updateKeyParams(envIndex)"
              v-model="preEnvs.params[envIndex].value"
              size="small"
            ></el-input>
            <el-input
              v-else-if="preEnvs.params[envIndex].type==='text'"
              type="textarea"
              :disabled="preEnvs.params[envIndex].auto_generate"
              :placeholder="$t(`global.value`)"
              @input="updateKeyParams(envIndex)"
              v-model="preEnvs.params[envIndex].value"
              size="small"
            ></el-input>
            <el-button v-else-if="preEnvs.params[envIndex].type==='repo'" @click="editRepoParams(envIndex)" type="text">配置</el-button>
          </el-form-item>
        </el-col>
        <el-col :span="2">
          <el-form-item>
            <EnvTypeSelect v-model="preEnvs.params[envIndex].command" :isFixed="preEnvs.params[envIndex].type==='repo'?false:true" isRuntime />
          </el-form-item>
        </el-col>
        <el-col :span="4">
          <el-form-item>
            <div class="app-operation">
              <el-button
                v-if="preEnvs.params.length >= 1"
                @click="deleteBuildEnv(envIndex)"
                type="danger"
                size="mini"
                icon="el-icon-minus"
                circle
                plain
              ></el-button>
              <el-button
                v-if="envIndex===preEnvs.params.length-1"
                @click="addBuildEnv()"
                type="primary"
                size="mini"
                icon="el-icon-plus"
                circle
                plain
              ></el-button>
            </div>
          </el-form-item>
        </el-col>
      </el-row>
    </el-form>
    <el-dialog
      :visible.sync="choiceDialogVisible"
      title="枚举"
      width="600px"
      :close-on-click-modal="false"
      :show-close="false"
      append-to-body
    >
      <el-form ref="form" :model="currentChoiceVar" label-position="left" label-width="90px">
        <el-form-item label="变量名称">
          <el-input v-model="currentChoiceVar.name" size="small"></el-input>
        </el-form-item>
        <el-form-item label="可选值">
          <el-input type="textarea" v-model="currentChoiceVar.choice_option" placeholder="可选值之间用英文 “,” 隔开" size="small" rows="4"></el-input>
        </el-form-item>
      </el-form>
      <div slot="footer">
        <el-button @click="choiceDialogVisible = false" size="small">{{$t(`global.cancel`)}}</el-button>
        <el-button type="primary" @click="saveVariable" size="small">{{$t(`global.confirm`)}}</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import EnvTypeSelect from '../envTypeSelect.vue'
import { cloneDeep } from 'lodash'
export default {
  components: { EnvTypeSelect },
  props: {
    preEnvs: {
      type: Object,
      default: () => ({})
    },
    isTest: {
      type: Boolean,
      default: false
    },
    mini: {
      type: Boolean,
      default: false
    },
    validObj: {
      required: false,
      type: Object,
      default: null
    },
    fromServicePage: {
      type: Boolean,
      default: false
    },
    isJenkins: {
      type: Boolean,
      default: false
    },
    serviceName: {
      type: Array,
      default: () => [{ service_name: '' }]
    },
    fromWhere: {
      type: Object,
      default: () => {
        return {
          origin: 'build',
          title: '构建',
          vars: []
        }
      }
    }
  },
  data () {
    return {
      choiceDialogVisible: false,
      repoDialogVisible: false,
      currentChoiceVar: {},
      currentRepoVar: {
        index: null,
        name: '',
        repo: {
          source: '',
          repo_owner: '',
          repo_namespace: '',
          repo_name: '',
          remote_name: 'origin',
          branch: '',
          codehost_id: null
        }
      },
      showBuildInEnvVar: false
    }
  },
  computed: {
    projectName () {
      return this.$route.params.project_name
    }
  },
  methods: {
    validate () {
      return this.$refs.buildEnvRef.validate()
    },
    getData () {
      return this.preEnvs.params
    },
    addFirstBuildEnv () {
      this.preEnvs.params.push({
        key: '',
        value: '',
        type: 'string',
        is_credential: false
      })
    },
    addBuildEnv () {
      this.validate().then(valid => {
        this.preEnvs.params.push({
          name: '',
          value: '',
          type: 'string',
          is_credential: false
        })
        this.$forceUpdate()
      })
    },
    deleteBuildEnv (index) {
      this.preEnvs.params.splice(index, 1)
    },
    changeEnvType (index) {
      const current = this.preEnvs.params[index]
      const type = current.type
      current.value = ''
      if (type === 'string' || type === 'text') {
        this.updateKeyParams(index)
      } else if (type === 'choice') {
        this.updateParams(index)
      }
    },
    updateParams (index) {
      this.choiceDialogVisible = true
      this.updateKeyParams(index)
    },
    updateKeyParams (index) {
      const current = this.preEnvs.params[index]
      this.currentChoiceVar = cloneDeep({
        index,
        ...current,
        choice_option: current.choice_option
          ? current.choice_option.join(',')
          : ''
      })
    },
    editRepoParams (index) {
      if (!this.preEnvs.params[index].repo) {
        this.$set(this.preEnvs.params[index], 'repo', {
          source: '',
          repo_owner: '',
          repo_namespace: '',
          repo_name: '',
          remote_name: 'origin',
          branch: '',
          codehost_id: null
        })
      }
      const currentRepoVar = cloneDeep(this.preEnvs.params[index])
      currentRepoVar.index = index
      this.currentRepoVar = currentRepoVar
      this.repoDialogVisible = true
    },
    saveRepoParams () {
      this.repoDialogVisible = false
      const index = this.currentRepoVar.index
      this.$set(this.preEnvs.params[index], 'name', this.currentRepoVar.name)
      this.$set(this.preEnvs.params[index], 'repo', this.currentRepoVar.repo)
    },
    saveVariable () {
      this.choiceDialogVisible = false
      const index = this.currentChoiceVar.index
      const env = this.preEnvs.params[index]
      const choice_option = this.currentChoiceVar.choice_option.split(',')
      env.choice_option = choice_option
      this.$set(env, 'name', this.currentChoiceVar.name)
      if (!choice_option.includes(env.value)) {
        env.value = ''
      }
    }
  },
  watch: {
    preEnvs: {
      handler (newValue, oldValue) {
        if (newValue) {
          newValue.params.forEach(e => {
            if (!e.type) {
              this.$set(e, 'type', 'string')
            }
          })
          this.$forceUpdate()
        }
      },
      deep: true
    }
  },
  created () {
    this.validObj &&
      this.validObj.addValidate({
        name: 'envVariable',
        valid: this.validate
      })
    const origin = this.fromWhere.origin
    if (origin === 'build') {
      this.fromWhere.vars = this.buildVars
    } else if (origin === 'test') {
      this.fromWhere.vars = this.testVars
    }
  }
}
</script>

<style lang="less" scoped>
.global-env {
  .th {
    margin-bottom: 16px;
    padding: 4px;
    font-weight: 500;
    background: #eaeaea;

    &-title {
      display: inline-block;
      color: @primaryColor;
      font-weight: 300;
      font-size: 14px;
      line-height: 28px;
    }
  }

  .display-flex {
    /deep/.el-form-item__content {
      display: flex;
      align-items: center;

      .el-select.partial-width {
        width: 80%;
      }
    }

    .edit-icon {
      color: @themeColor;
      cursor: pointer;
    }
  }

  /deep/.el-form-item {
    margin-bottom: 8px;
  }
}
</style>
