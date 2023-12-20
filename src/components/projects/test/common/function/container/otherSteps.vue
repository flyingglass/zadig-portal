<template>
  <section class="other-step-container">
    <div style="margin: 14px 0 8px;">
      <el-dropdown @command="addExtra">
        <el-button type="primary" size="small" plain>
          {{$t(`build.addSteps`)}}
          <i style="margin-left: 8px;" class="el-icon-arrow-down el-icon--right"></i>
        </el-button>
        <el-dropdown-menu slot="dropdown">
          <el-dropdown-item command="object" :disabled="object_storage_upload_enabled">{{$t(`build.stepFileUpload`)}}</el-dropdown-item>
        </el-dropdown-menu>
      </el-dropdown>
    </div>
    <div class="common-parcel-block" v-if="object_storage_upload_enabled">
      <el-form
        v-if="object_storage_upload_enabled && testPostConfig.object_storage_upload"
        :model="testPostConfig.object_storage_upload"
        :rules="object_storage_rules"
        ref="objectStorageRef"
        label-width="150px"
        class="secondary-form"
        label-position="left"
      >
        <div class="dashed-container">
          <span class="primary-title">
            {{$t(`build.stepFileUpload`)}}
            <el-button type="text" @click="removeObject" icon="el-icon-delete"></el-button>
          </span>
          <el-form-item :label="$t(`sysSetting.integration.storageTab`)" prop="object_storage_id">
            <el-select
              size="small"
              v-model="testPostConfig.object_storage_upload.object_storage_id"
              :placeholder="$t(`build.prompt.selectObjectStorage`)"
              @change="$refs.objectStorageRef.clearValidate()"
            >
              <el-option v-for="(item,index) in objectStorageList" :key="index" :label="`${item.endpoint}/${item.bucket}`" :value="item.id"></el-option>
            </el-select>
          </el-form-item>
          <el-form-item :label="$t(`build.uploadFile`)" prop="upload_detail">
            <template v-if="testPostConfig.object_storage_upload.upload_detail.length > 0">
              <el-row v-for="(item,index) in testPostConfig.object_storage_upload.upload_detail" :key="index">
                <el-col :span="11">
                  <el-input v-model="item.file_path" style="max-width: 100%;" size="small">
                    <template slot="prepend">$WORKSPACE/</template>
                  </el-input>
                </el-col>
                <el-col :span="1" style="text-align: center;">to</el-col>
                <el-col :span="8">
                  <el-input v-model="item.dest_path" size="small"></el-input>
                </el-col>
                <el-col :span="4">
                  <div class>
                    <el-button @click="removeObjectStorage(index)" type="danger" icon="el-icon-minus" size="mini" circle plain></el-button>
                    <el-button
                      v-if="index === testPostConfig.object_storage_upload.upload_detail.length - 1"
                      type="primary"
                      icon="el-icon-plus"
                      @click="addObjectStorage"
                      size="mini"
                      circle
                      plain
                    ></el-button>
                  </div>
                </el-col>
              </el-row>
            </template>
            <el-button v-else type="plain" icon="el-icon-plus" @click="addObjectStorage" size="mini" circle plain></el-button>
          </el-form-item>
        </div>
      </el-form>
    </div>
  </section>
</template>

<script>
import { getStorageListAPI } from '@api'
export default {
  props: {
    testPostConfig: Object,
    validObj: Object
  },
  data () {
    return {
      objectStorageList: [],
      object_storage_upload_enabled: false
    }
  },
  computed: {
    object_storage_rules () {
      return {
        object_storage_id: [
          {
            type: 'string',
            message: this.$t(`build.prompt.selectObjectStorage`),
            required: true,
            trigger: 'blur'
          }
        ],
        upload_detail: [
          {
            type: 'array',
            required: true,
            validator: (rule, value, callback) => {
              const empty = value.every(item => {
                return !item.file_path || !item.dest_path
              })
              if (value.length === 0) {
                callback(new Error(this.$t(`build.prompt.atLeastUploadOneFile`)))
              } else if (empty) {
                callback(new Error(this.$t(`build.prompt.uploadFilePathEmpty`)))
              } else {
                callback()
              }
            }
          }
        ]
      }
    }
  },
  methods: {
    // called by the parent component at edit time
    initStepStatus (testPostConfig = this.testPostConfig) {
      if (testPostConfig.object_storage_upload) {
        this.object_storage_upload_enabled = true
      } else {
        this.object_storage_upload_enabled = false
      }
    },
    addExtra (command) {
      if (command === 'object') {
        this.object_storage_upload_enabled = true
        this.$set(this.testPostConfig, 'object_storage_upload', {
          enabled: true,
          object_storage_id: '',
          upload_detail: [{
            file_path: '',
            dest_path: ''
          }]
        })
      }
      this.$nextTick(() => {
        document.querySelector('.other-step-container').scrollIntoView({
          behavior: 'smooth'
        })
      })
    },
    removeObject () {
      this.object_storage_upload_enabled = false
      delete this.testPostConfig.object_storage_upload
    },
    addObjectStorage () {
      this.testPostConfig.object_storage_upload.upload_detail.push({
        file_path: '',
        dest_path: ''
      })
    },
    removeObjectStorage (index) {
      this.testPostConfig.object_storage_upload.upload_detail.splice(index, 1)
    },
    getUsedData () {
      const key = this.$utils.rsaEncrypt()
      getStorageListAPI(key).then(res => {
        this.objectStorageList = res
      })
    },
    validate () {
      const valid = []
      if (this.object_storage_upload_enabled) {
        valid.push(this.$refs.objectStorageRef.validate())
      }
      return Promise.all(valid)
    }
  },
  created () {
    this.getUsedData()
    this.validObj.addValidate({
      name: 'otherStepsValid',
      valid: this.validate
    })
  }
}
</script>

<style lang="less" scoped>
.other-step-container {
  .common-parcel-block {
    .primary-title {
      margin: 0;
      line-height: 28px;
    }

    /deep/.el-form.secondary-form {
      .el-input,
      .el-select {
        width: 100%;
      }

      .el-form-item {
        margin-bottom: 15px;
      }
    }
  }

  /deep/.el-form-item__content {
    .el-input-group {
      vertical-align: baseline;
    }
  }
}
</style>
