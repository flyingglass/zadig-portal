<template>
  <div class="integration-project-container">
    <el-dialog
      :title="operateType==='add'?$t(`sysSetting.integration.project.addProjectManageSys`):$t(`sysSetting.integration.project.editProjectManageSys`)"
      :close-on-click-modal="false"
      custom-class="edit-form-dialog"
      :visible.sync="dialogVisible"
    >
      <el-alert style="margin-bottom: 10px;" v-if="checkResult === 'fail'" :title="errorMessage" type="error" :closable="false" ></el-alert>
      <el-form :model="params" @submit.native.prevent label-position="left" :rules="formRules" label-width="134px" ref="form">
        <el-form-item :label="$t(`sysSetting.integration.project.sysType`)" prop="type">
          <el-select v-model="params.type" :disabled="operateType==='edit'">
            <el-option label="飞书项目" value="lark" disabled>
              <el-tooltip effect="dark" placement="top">
                <div slot="content">
                  <span>{{ $t('global.enterprisefeaturesReferforDetails') }}</span>
                  <el-link
                    style="font-size: 13px; vertical-align: baseline;"
                    type="primary"
                    href="https://docs.koderover.com/settings/lark/"
                    :underline="false"
                    target="_blank"
                  >{{$t(`global.document`)}}</el-link>
                </div>
                <span>
                  <i class="config-icon iconfont iconfeishu-xin_new-lark"></i>
                  <span>飞书项目</span>
                  <i class="el-icon-warning"></i>
                </span>
              </el-tooltip>
            </el-option>
            <el-option label="Jira" value="jira" :disabled="isJiraDisabled">
              <i class="config-icon iconfont iconjira"></i>
              <span>Jira</span>
            </el-option>
          </el-select>
        </el-form-item>
        <div v-if="params.type==='jira'">
          <el-form-item :label="$t(`sysSetting.integration.project.address`)" prop="jira_host">
            <el-input v-model.trim="params.jira_host" placeholder="Jira 访问地址" auto-complete="off"></el-input>
          </el-form-item>
          <el-form-item :label="$t(`sysSetting.integration.project.userName`)" prop="jira_user">
            <el-input v-model="params.jira_user" placeholder="有 issue 读写权限的用户名"  auto-complete="off"></el-input>
          </el-form-item>
          <el-form-item :label="$t(`sysSetting.integration.project.token`)" prop="jira_token">
            <el-input
              v-model="params.jira_token"
              placeholder="用户密码/Access Token"
              :suffix-icon="showCheckIcon"
              type="password"
              auto-complete="off"
            ></el-input>
          </el-form-item>
        </div>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button
          type="primary"
          native-type="submit"
          size="small"
          :loading="checkLoading"
          @click="updateProjectManage()"
        >{{$t(`global.confirm`)}}</el-button>
        <el-button plain native-type="submit" size="small" @click="handleDialogCancel()">{{$t(`global.cancel`)}}</el-button>
      </div>
    </el-dialog>
    <!--end of edit list dialog-->

    <div class="tab-container">
      <template>
        <el-alert type="info" :closable="false">
          <template>
            {{$t(`sysSetting.integration.project.referToDoc`)}}
            <el-link
              style="font-size: 14px; vertical-align: baseline;"
              type="primary"
              :href="`https://docs.koderover.com/zadig/settings/jira/`"
              :underline="false"
              target="_blank"
            >{{$t(`global.helpDoc`)}}</el-link>
          </template>
        </el-alert>
      </template>
      <div class="sync-container">
        <el-button
          v-if="!isJiraDisabled"
          size="small"
          type="primary"
          plain
          @click="handleConfigEdit('add',params)"
        >{{$t(`global.add`)}}</el-button>
      </div>
      <el-table :data="list" style="width: 100%;">
        <el-table-column :label="$t(`sysSetting.integration.project.address`)">
          <template slot-scope="scope">{{scope.row.type==='jira'?scope.row.jira_host:scope.row.meego_host}}</template>
        </el-table-column>
        <el-table-column :label="$t(`sysSetting.integration.gitProviders.lastUpdated`)">
          <template slot-scope="scope">{{ $utils.convertTimestamp(scope.row.updated_at)}}</template>
        </el-table-column>
        <el-table-column :label="$t(`global.operation`)" width="160">
          <template slot-scope="scope">
            <el-button type="primary" size="mini" @click="handleConfigEdit('edit',scope.row)" plain>{{$t(`global.edit`)}}</el-button>
            <el-button type="danger" size="mini" @click="deleteProjectManage(scope.row)" plain>{{$t(`global.delete`)}}</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>
  </div>
</template>
<script>
import bus from '@utils/eventBus'
import {
  getProjectManageAPI,
  updateProjectManageAPI,
  deleteProjectManageAPI,
  createProjectManageAPI,
  checkProjectManageAPI
} from '@api'
const validateJiraURL = (rule, value, callback) => {
  if (value === '') {
    callback(new Error('请输入服务 URL，包含协议'))
  } else {
    if (value.endsWith('/')) {
      callback(new Error('URL 末尾不能包含 /'))
    } else {
      callback()
    }
  }
}
export default {
  data () {
    return {
      operateType: 'add',
      list: [],
      params: {
        type: 'jira',
        jira_host: '',
        jira_user: '',
        jira_token: ''
      },
      formRules: {
        type: {
          required: true
        },
        jira_user: {
          required: true,
          message: '请输入用户名',
          trigger: ['blur', 'change']
        },
        jira_host: [
          {
            required: true,
            message: '请输入 Host',
            trigger: 'blur'
          },
          {
            required: true,
            validator: validateJiraURL,
            trigger: ['change']
          }
        ],
        jira_token: {
          required: true,
          message: '请输入密码',
          trigger: ['blur', 'change']
        }
      },
      dialogVisible: false,
      checkResult: '',
      errorMessage: '',
      checkLoading: false
    }
  },
  computed: {
    isJiraDisabled () {
      return this.list.filter(item => item.type === 'jira').length > 0
    },
    showCheckIcon () {
      if (this.checkResult === 'pass') {
        return 'el-icon-circle-check'
      } else if (this.checkResult === 'fail') {
        return 'el-icon-circle-close'
      } else {
        return ''
      }
    }
  },
  methods: {
    clearValidate (ref) {
      this.$refs[ref].clearValidate()
    },
    getProjectManage () {
      const key = this.$utils.rsaEncrypt()
      getProjectManageAPI(key).then(res => {
        this.list = res
      })
    },
    handleConfigEdit (type, row) {
      this.operateType = type
      this.dialogVisible = true
      this.checkResult = null
      this.$nextTick(() => {
        this.$refs.form.resetFields()
      })
      if (type === 'edit') {
        this.params = this.$utils.cloneObj(row)
      } else {
        this.params = {
          type: 'jira',
          jira_host: '',
          jira_user: '',
          jira_token: ''
        }
      }
    },
    deleteProjectManage (item) {
      this.$confirm(
        this.$t(`sysSetting.integration.project.confirmDel`),
        this.$t(`global.confirmation`),
        {
          confirmButtonText: this.$t(`global.confirm`),
          cancelButtonText: this.$t(`global.cancel`),
          type: 'warning'
        }
      ).then(() => {
        deleteProjectManageAPI(item.id).then(res => {
          this.getProjectManage()
          this.$message({
            message: this.$t(
              `sysSetting.integration.project.configurationDelSuccessfully`
            ),
            type: 'success'
          })
        })
      })
    },
    async updateProjectManage () {
      this.$refs.form.validate(async valid => {
        if (valid) {
          const { type, jira_host, jira_user, jira_token } = this.params
          const validatePayload = { type, jira_host, jira_user, jira_token }
          this.checkLoading = true
          const checkResult = await checkProjectManageAPI(validatePayload).catch(error => {
            this.checkResult = 'fail'
            this.checkLoading = false
            this.errorMessage = error.response.data.message
          })
          if (checkResult) {
            const params = {
              type: 'jira',
              jira_host: this.params.jira_host,
              jira_user: this.params.jira_user,
              jira_token: this.params.jira_token
            }

            if (this.operateType === 'add') {
              const res = await createProjectManageAPI(params).catch(error => {
                this.checkLoading = false
                console.log(error)
              })
              if (res && res.message === 'success') {
                this.getProjectManage()
                this.handleDialogCancel()
                this.checkLoading = false
                this.$message({
                  message: this.$t(
                    `sysSetting.integration.project.configurationAddedSuccessfully`
                  ),
                  type: 'success'
                })
              }
            } else {
              const res = await updateProjectManageAPI(params, this.params.id).catch(error => {
                this.checkLoading = false
                console.log(error)
              })
              if (res && res.message === 'success') {
                this.getProjectManage()
                this.handleDialogCancel()
                this.checkLoading = false
                this.$message({
                  message: this.$t(
                    `sysSetting.integration.project.configurationModifiedSuccessfully`
                  ),
                  type: 'success'
                })
              }
            }
          }
        } else {
          return false
        }
      })
    },
    handleDialogCancel () {
      this.$nextTick(() => {
        this.checkResult = null
        this.checkLoading = false
        this.$refs.form.resetFields()
        this.dialogVisible = false
      })
    }
  },
  mounted () {
    this.getProjectManage()
    bus.$emit('set-topbar-title', { title: '', breadcrumb: [{ title: this.$t(`sidebarMenu.systemIntegration`), url: '/v1/system/integration' }, { title: this.$t(`sysSetting.integration.projectTab`), url: '' }] })
  }
}
</script>

<style lang="less" scoped>
.integration-project-container {
  position: relative;
  flex: 1;
  padding: 15px 30px;
  overflow: auto;
  font-size: 13px;

  .tab-container {
    .sync-container {
      padding-top: 15px;
      padding-bottom: 15px;
    }
  }

  .text-success {
    color: rgb(82, 196, 26);
  }

  .text-failed {
    color: #ff1949;
  }

  /deep/.edit-form-dialog {
    width: 550px;

    .el-dialog__header {
      padding: 15px;
      text-align: center;
      border-bottom: 1px solid #e4e4e4;

      .el-dialog__close {
        font-size: 10px;
      }
    }

    .el-dialog__body {
      padding: 30px 20px;
      color: #606266;
      font-size: 14px;

      .el-form-item {
        margin-bottom: 15px;
      }
    }

    .el-select {
      width: 100%;
    }

    .el-input {
      display: inline-block;
    }

    .el-input__suffix-inner {
      display: inline-flex;
    }
  }
}

/deep/ .el-icon-circle-check {
  margin-left: 10px;
  color: @success;
}

/deep/ .el-icon-circle-close {
  margin-left: 10px;
  color: red;
}
</style>
