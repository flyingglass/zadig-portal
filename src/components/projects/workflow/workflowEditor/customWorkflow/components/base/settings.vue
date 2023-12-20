<template>
  <div class="settings">
    <el-form :model="settings" ref="settings">
      <div class="mg-b16 title">{{$t(`workflow.runPolicy`)}}</div>
      <el-form-item>
        <span class="mg-r16">
          <span class="text">{{$t(`workflow.concurrentExecution`)}}</span>
          <el-tooltip effect="dark" content="当同时更新多个不同服务时，产生的多个任务将会并发执行，以提升工作流运行效率，企业版支持设置并发数量" placement="top">
            <i class="pointer el-icon-question"></i>
          </el-tooltip>
        </span>
        <el-switch :active-value="-1" :inactive-value="1" v-model="settings.concurrency_limit"></el-switch>
      </el-form-item>
      <div class="mg-b16 mg-t24 title">
        <span>{{$t(`workflow.shareDirectory`)}}</span>
        <el-button type="text" v-if="!settings.share_storages ||settings.share_storages.length===0" @click="addBuildEnv">{{$t(`global.add`)}}</el-button>
      </div>
      <div v-if="settings.share_storages&&settings.share_storages.length>0">
        <el-row :gutter="6" class="th">
          <el-col :span="8">
            <span class="th-title">{{$t(`global.name`)}}</span>
          </el-col>
          <el-col :span="8">
            <span class="th-title">{{$t(`workflow.shareDirectory`)}}</span>
          </el-col>
        </el-row>

        <el-row :gutter="6" v-for="(item,index) in settings.share_storages" :key="index">
          <el-col :span="8">
            <el-form-item
              :prop="'share_storages.' + index + '.name'"
              :rules="{required: true, validator: validateName, trigger: ['blur','change']}"
            >
              <el-input
                v-model="settings.share_storages[index].name"
                size="small"
                placeholder="shared-path"
                @input="update($event,item,'name')"
              ></el-input>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item
              :prop="'share_storages.' + index + '.path'"
              :rules="{required: true, message: '请输入共享目录', trigger: ['blur','change']}"
            >
              <el-input v-model="item.path" size="small" placeholder="/workspace" @input="update($event,item,'path')"></el-input>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item>
              <el-button @click="deleteBuildEnv(index)" type="danger" size="mini" icon="el-icon-minus" circle plain></el-button>
              <el-button @click="addBuildEnv()" type="primary" size="mini" icon="el-icon-plus" circle plain></el-button>
            </el-form-item>
          </el-col>
        </el-row>
      </div>
    </el-form>
  </div>
</template>

<script>
import { cloneDeep } from 'lodash'
const validateName = (rule, value, callback) => {
  if (value === '') {
    callback(new Error('请输入名称'))
  } else {
    if (!/^[a-z0-9-]{1,63}$/.test(value)) {
      callback(new Error('名称只支持小写字母和数字，特殊字符只支持中划线'))
    } else {
      callback()
    }
  }
}
export default {
  data () {
    return {
      validateName,
      isShowConfig: false,
      settings: {}
    }
  },
  props: {
    workflowInfo: {
      type: Object,
      default: () => ({})
    }
  },
  methods: {
    addBuildEnv () {
      if (!this.settings.share_storages) {
        this.settings.share_storages = []
      }
      this.$refs.settings.validate().then(valid => {
        if (valid) {
          this.settings.share_storages.push({
            name: '',
            path: ''
          })
          this.$forceUpdate()
        }
      })
    },
    deleteBuildEnv (index) {
      this.settings.share_storages.splice(index, 1)
      this.$forceUpdate()
    },
    update (val, item, type) {
      this.$forceUpdate()
    },
    validate () {
      return this.$refs.settings.validate()
    },
    getData () {
      return this.settings
    }
  },
  created () {
    this.settings = cloneDeep(this.workflowInfo)
  }
}
</script>

<style lang="less" scoped>
.settings {
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

  .text {
    color: #72767b;
    font-size: 14px;
  }

  /deep/.el-form-item {
    margin-bottom: 8px;
  }
}
</style>
