<template>
  <el-dialog title="更新全局变量" :visible.sync="updateK8sEnvVarDialogVisible" width="60%" class="update-env-variable">
    <div class="update-global-variable">
      <ServiceVar :varList="globalVariables" showRelatedServices showOperation />
      <div class="operation">
        <el-select v-model="addGlobalVars" size="small" :placeholder="$t(`global.pleaseSelect`)" multiple value-key="key">
          <el-option v-for="(item, index) in leftGlobalVars" :key="index" :label="item.key" :value="item"></el-option>
        </el-select>
        <el-button type="primary" plain size="small" @click="addVars">{{$t(`global.add`)}}</el-button>
      </div>
    </div>
    <span slot="footer" class="dialog-footer">
      <el-button size="small" type="primary" :loading="updateK8sEnvVarLoading" @click="updateK8sEnv" :disabled="!isUpdated">更新</el-button>
      <el-button size="small" @click="updateK8sEnvVarDialogVisible = false">{{$t(`global.cancel`)}}</el-button>
    </span>
  </el-dialog>
</template>
<script>
import ServiceVar from '@/components/projects/common/serviceVar.vue'
import {
  getGlobalVariablesAPI,
  getEnvGlobalVariablesAPI,
  updateK8sEnvAPI
} from '@api'
import { cloneDeep, debounce } from 'lodash'
export default {
  name: 'updateK8sVar',
  props: {
    fetchAllData: Function
  },
  data () {
    this.globalVariablesBackup = []

    return {
      updateK8sEnvVarDialogVisible: false,
      updateK8sEnvVarLoading: false,
      projectGlobalVars: [],
      globalVariables: [],
      addGlobalVars: [],
      revision: 0,
      isUpdated: false
    }
  },
  computed: {
    projectName () {
      return this.$route.params.project_name
    },
    envName () {
      return this.$route.query.envName
    },
    globalVariableKeys () {
      return this.globalVariables.map(item => item.key)
    },
    leftGlobalVars () {
      return this.projectGlobalVars.filter(
        item => !this.globalVariableKeys.includes(item.key)
      )
    }
  },
  methods: {
    openDialog () {
      this.updateK8sEnvVarDialogVisible = true
    },
    addVars () {
      this.globalVariables = this.globalVariables.concat(this.addGlobalVars)
      this.addGlobalVars = []
    },
    async updateK8sEnv () {
      const changedSvc = new Set()
      this.globalVariablesBackup.forEach(item => {
        const cur = this.globalVariables.find(vars => vars.key === item.key)
        if (cur && cur.value !== item.value) {
          cur.related_services.forEach(svc => changedSvc.add(svc))
        }
      })
      this.$confirm(
        changedSvc.size > 0
          ? this.$t(`environments.common.sureRelatedServices`, {
            services: [...changedSvc].join('、')
          })
          : this.$t(`environments.common.noRelatedServices`),
        this.$t(`global.confirmation`),
        {
          confirmButtonText: this.$t(`global.confirm`),
          cancelButtonText: this.$t(`global.cancel`),
          type: 'warning'
        }
      ).then(() => {
        this.updateK8sEnvVar()
      })
    },
    updateK8sEnvVar () {
      this.updateK8sEnvVarLoading = true
      updateK8sEnvAPI(this.projectName, this.envName, {
        current_revision: this.revision,
        global_variables: this.globalVariables
      }).then(() => {
        this.updateK8sEnvVarLoading = false
        this.updateK8sEnvVarDialogVisible = false
        this.fetchAllData()
        this.$message({
          message: '更新全局变量成功，请等待服务升级',
          type: 'success'
        })
      })
    }
  },
  watch: {
    updateK8sEnvVarDialogVisible (value) {
      if (value) {
        getGlobalVariablesAPI(this.projectName).then(res => {
          this.projectGlobalVars = res.map(item => ({
            ...item,
            related_services: []
          }))
        })
        getEnvGlobalVariablesAPI(this.projectName, this.envName).then(res => {
          this.globalVariablesBackup = cloneDeep(res.global_variables)
          this.globalVariables = res.global_variables
          this.revision = res.revision
        })
      } else {
        this.projectGlobalVars = []
        this.globalVariables = []
        this.globalVariablesBackup = []
        this.addGlobalVars = []
      }
    },
    globalVariables: {
      handler: debounce(function (val) {
        if (val.length !== this.globalVariablesBackup.length) {
          this.isUpdated = true
        } else {
          this.isUpdated = val.some(
            (item, index) =>
              item.key !== this.globalVariablesBackup[index].key ||
              item.value !== this.globalVariablesBackup[index].value
          )
        }
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
.update-global-variable {
  margin: 10px 20px;

  .operation {
    margin-top: 16px;

    /deep/.el-button {
      margin-left: 10px;
    }
  }
}
</style>
