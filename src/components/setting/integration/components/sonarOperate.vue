<template>
  <el-dialog
    :title="(isEdit ? '编辑': '新增') + ' Sonar 配置'"
    custom-class="edit-form-dialog"
    :visible.sync="dialogVisible"
    :close-on-click-modal="false"
  >
    <el-alert
      style="margin-bottom: 10px;"
      v-if="checkResult === 'fail'"
      :title="errorMessage"
      type="error"
      :closable="false">
    </el-alert>
    <el-form
      :model="addForm"
      ref="addForm"
      :rules="formRules"
      class="form"
      label-position="left"
      label-width="100px"
    >
      <el-form-item label="访问地址" prop="server_address">
        <el-input
          v-model.trim="addForm.server_address"
          placeholder="Sonar 访问地址"
        ></el-input>
      </el-form-item>
      <el-form-item label="Token" prop="token">
        <el-input
          v-model="addForm.token"
          v-if="dialogVisible"
          :suffix-icon="showCheckIcon"
          type="password"
          placeholder="Sonar Token"
          class="input"
        ></el-input>
      </el-form-item>
    </el-form>
    <div slot="footer">
      <el-button type="primary" size="small" :loading="checkLoading" @click="save">{{$t(`global.save`)}}</el-button>
      <el-button @click="dialogVisible = false" size="small">{{$t(`global.cancel`)}}</el-button>
    </div>
  </el-dialog>
</template>
<script>
import { addSonarAPI, checkSonarConnectionAPI, editSonarAPI } from '@api'
export default {
  name: 'addSonar',
  props: {
    getSonar: Function
  },
  data () {
    return {
      dialogVisible: false,
      checkResult: null,
      checkLoading: false,
      isEdit: false,
      errorMessage: '',
      addForm: {
        server_address: '',
        token: ''
      },
      formRules: {
        server_address: [
          {
            required: true,
            message: '请输入 URL，包含协议',
            trigger: ['blur', 'change']
          }
        ],
        token: [
          { required: true, message: 'Token 不能为空', trigger: 'blur' }
        ]
      }
    }
  },
  methods: {
    openDialog (data) {
      this.dialogVisible = true
      if (data) {
        this.isEdit = true
        data.token = this.$utils.aesDecrypt(data.token)
        this.addForm = data
      } else {
        this.isEdit = false
      }
    },
    async save () {
      if (this.isEdit) {
        this.edit()
      } else {
        this.$refs.addForm.validate(async (valid) => {
          if (valid) {
            this.checkLoading = true
            const checkResult = await checkSonarConnectionAPI(this.addForm).catch((error) => {
              this.checkResult = 'fail'
              this.checkLoading = false
              this.errorMessage = error.response.data.message + error.response.data.description
            })
            if (checkResult) {
              const res = await addSonarAPI(this.addForm).catch((error) =>
                console.log(error)
              )
              if (res && res.message === 'success') {
                this.$message.success('新增成功')
                this.dialogVisible = false
                this.getSonar()
              }
            }
          } else {
            return false
          }
        })
      }
    },
    async edit () {
      this.$refs.addForm.validate(async (valid) => {
        if (valid) {
          this.checkLoading = true
          const checkResult = await checkSonarConnectionAPI(this.addForm).catch((error) => {
            this.checkResult = 'fail'
            this.checkLoading = false
            this.errorMessage = error.response.data.message + error.response.data.description
          })
          if (checkResult) {
            const res = await editSonarAPI(this.addForm).catch(error => {
              this.checkLoading = false; console.log(error)
            })
            if (res && res.message === 'success') {
              this.$message.success('保存成功')
              this.dialogVisible = false
              this.getSonar()
            }
          }
        } else {
          return false
        }
      })
    },
    resetForm () {
      this.addForm = {
        server_address: '',
        token: ''
      }
    }
  },
  computed: {
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
  watch: {
    dialogVisible (value) {
      if (!value) {
        this.$refs.addForm.resetFields()
        this.checkResult = null
        this.checkLoading = false
        this.resetForm()
      }
    }
  }
}
</script>
<style lang="less" scoped>
/deep/ .el-input {
  width: 400px;
}

/deep/ .edit-form-dialog {
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
