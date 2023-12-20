<template>
  <div class="job-deploy-detail">
    <header class="mg-b8">
      <el-col :span="6">
        <span class="type">{{$t(`workflow.jobType.deploy`)}}</span>
        <span>{{jobInfo.name}}</span>
      </el-col>
      <el-col :span="2">
        <div class="item-desc">
          <a
            :class="buildOverallColor"
            href="#buildv4-log"
          >{{jobInfo.status?$t(`workflowTaskStatus.${jobInfo.status}`):$t(`workflowTaskStatus.notRunning`)}}</a>
        </div>
      </el-col>
      <el-col :span="2">
        <span class="item-desc">{{$utils.timeFormat(jobInfo.cost_seconds)}}</span>
      </el-col>
      <el-col v-if="jobInfo" :span="6">
        <span class="item-desc status">
          <span v-if="jobInfo.spec.skip_check_run_status">
            <i class="el-icon-warning"></i>
            {{$t(`workflow.notOpenServiceStatusCheck`)}}
          </span>
          <span v-else-if="!jobInfo.spec.skip_check_run_status && jobInfo.status ==='passed'">
            <i class="el-icon-warning"></i>
            {{$t(`workflow.serviceStatusCheckPassed`)}}
          </span>
          <span v-else-if="!jobInfo.spec.skip_check_run_status && jobInfo.status ==='failed'">
            <i class="el-icon-warning"></i>
            {{$t(`workflow.serviceStatusCheckFailed`)}}
          </span>
        </span>
      </el-col>
      <el-col :span="1" class="close">
        <span @click="$emit('showFooter',false)">
          <i class="el-icon-close"></i>
        </span>
      </el-col>
    </header>
    <main>
      <div class="error-wrapper">
        <el-alert v-if="jobInfo.error" :title="$t(`global.errorMsg`)" type="error" :close-text="$t(`global.ok`)">
          <span style="white-space: pre-wrap;">{{jobInfo.error}}</span>
        </el-alert>
      </div>
      <el-row class="item">
        <el-col :span="4">
          <div class="item-title">{{$t(`workflow.deploymentEnv`)}}</div>
        </el-col>
        <el-col :span="8">
          <div class="item-desc">
            <router-link class="env-link" :to="`/v1/projects/detail/${projectName}/envs/detail?envName=${jobInfo.spec.env}`">{{jobInfo.spec.env}}</router-link>
          </div>
        </el-col>
      </el-row>
      <el-row class="item" :gutter="0" v-for="(build,index) in jobInfo.spec.service_and_images" :key="index">
        <el-col :span="4">
          <div class="item-title">{{$t(`global.serviceName`)}}</div>
        </el-col>
        <el-col :span="8">
          <div class="item-desc">
            <template v-if="deployType !=='helm'">
              <router-link class="env-link" :to="`/v1/projects/detail/${projectName}/envs/detail/${build.service_name}?envName=${jobInfo.spec.env}&projectName=${projectName}&envSource=${deployType}`">{{build.service_name}}({{build.service_module}})</router-link>
            </template>
            <template v-else-if="deployType ==='helm'">
              <router-link class="env-link" :to="`/v1/projects/detail/${projectName}/envs/detail?envName=${jobInfo.spec.env}`">{{build.service_name}}({{build.service_module}})</router-link>
            </template>
          </div>
        </el-col>
        <el-col :span="4">
          <div class="item-title">
            {{$t(`workflow.imageName`)}}
            <el-tooltip effect="dark" placement="top">
              <div slot="content">
                <div>{{$t(`workflow.imageRule.title`)}}</div>
                <div v-for="(item, index) in $t(`workflow.imageRule.list`)" :key="index">{{item}}</div>
              </div>
              <span>
                <i class="el-icon-question"></i>
              </span>
            </el-tooltip>
          </div>
        </el-col>
        <el-col :span="8">
          <el-tooltip effect="dark" :content="build.image" placement="top">
            <span class="file-name item-desc">{{ build.image.split('/')[2]}}</span>
          </el-tooltip>
        </el-col>
      </el-row>
      <el-row class="item" v-if="deployType!=='helm' && deployType!=='external' && jobInfo.spec.variable_kvs.length > 0">
        <div class="item-title mg-t16 mg-b8">{{$t(`global.serviceVar`)}}</div>
        <el-col :span="20">
          <el-table :data="jobInfo.spec.variable_kvs" class="table" size="mini">
            <el-table-column :label="$t(`global.key`)">
              <template slot-scope="scope">{{scope.row.key}}</template>
            </el-table-column>
            <el-table-column :label="$t(`global.desc`)">
              <template slot-scope="scope">
                <span>{{scope.row.desc}}</span>
              </template>
            </el-table-column>
            <el-table-column :label="$t(`global.value`)">
              <template slot-scope="scope">
                <el-input v-if="scope.row.type === 'string' || scope.row.type === 'yaml'" size="mini" v-model="scope.row.value" disabled></el-input>
                <el-select v-else-if="scope.row.type === 'enum'" v-model="scope.row.value" class="full-width" size="mini" disabled>
                </el-select>
                <el-switch v-else-if="scope.row.type === 'bool'" v-model="scope.row.value" disabled :active-value="scope.row.value===true?true:'true'" :inactive-value="scope.row.value===false?false:'false'"></el-switch>
              </template>
            </el-table-column>
          </el-table>
        </el-col>
      </el-row>
      <el-row class="item" v-if="deployType!=='external'">
        <div v-if="deployType === 'helm'" class="item-title mg-t16 mg-b8">{{$t(`global.serviceVar`)}}</div>
        <div v-else class="item-title mg-t16 mg-b8">{{$t(`global.serviceConfiguration`)}}</div>
        <el-col :span="20">
          <codemirror
            v-if="deployType==='helm'"
            class="codemirror"
            ref="yamlEditor"
            v-model="jobInfo.spec.user_supplied_value"
            style="min-height: 200px; margin-bottom: 30px; border: 1px solid #ddd;"
            :options="editorReadOnlyOptions"
          />
          <codemirror
            v-else
            class="codemirror"
            ref="yamlEditor"
            v-model="jobInfo.spec.yaml_content"
            style="min-height: 200px; margin-bottom: 30px; border: 1px solid #ddd;"
            :options="editorReadOnlyOptions"
          />
        </el-col>
      </el-row>
    </main>
  </div>
</template>

<script>
import { codemirror } from 'vue-codemirror'
export default {
  data () {
    return {
      editorReadOnlyOptions: {
        mode: 'yaml',
        theme: 'neo',
        lineNumbers: true,
        lineWrapping: true,
        indentUnit: 2,
        tabSize: 2,
        indentWithTabs: false,
        autofocus: true,
        readOnly: true,
        extraKeys: {
          'Ctrl-Space': 'autocomplete'
        }
      }
    }
  },
  components: { codemirror },
  props: {
    jobInfo: {
      type: Object,
      default: () => ({})
    },
    projectName: {
      type: String,
      default: ''
    },
    taskId: {
      type: [String, Number],
      default: 1
    },
    workflowName: {
      type: String,
      default: ''
    },
    deployType: {
      type: String,
      default: ''
    }
  },

  computed: {
    buildOverallStatus () {
      return this.$utils.calcOverallBuildStatus(this.jobInfo, {})
    },
    buildOverallStatusZh () {
      return this.$t(`workflowTaskStatus.${this.buildOverallStatus}`)
    },
    buildOverallColor () {
      return this.$translate.calcTaskStatusColor(this.buildOverallStatus)
    }
  },
  methods: {
    adaptTaskDetail (detail) {
      detail.intervalSec =
        (detail.status === 'running'
          ? Math.round(new Date().getTime() / 1000)
          : detail.end_time) - detail.start_time
      detail.interval = this.$utils.timeFormat(detail.intervalSec)
    }
  },
  watch: {
    jobInfo: {
      handler (val, oldVal) {
        if (val) {
          this.adaptTaskDetail(val)
        }
      },
      deep: true,
      immediate: true
    }
  }
}
</script>
<style lang="less" scoped>
.job-deploy-detail {
  position: relative;
  height: 100%;
  font-size: 14px;
  background: #fff;
  box-shadow: 1px 1px 14px rgba(0, 0, 0, 0.1);

  header {
    height: 42px;
    padding: 0 24px;
    line-height: 42px;
    border-top: 1px solid #ddd;
    border-bottom: 1px solid #ddd;

    .type {
      margin-right: 8px;
      font-weight: 500;
    }

    .close {
      float: right;
      font-size: 16px;
      cursor: pointer;
    }

    .status {
      color: #888;
    }
  }

  main {
    box-sizing: border-box;
    width: 100%;
    min-height: 400px;
    max-height: 70%;
    padding: 0 24px;
    overflow-x: hidden;
    overflow-y: auto;

    .item {
      margin-top: 8px;

      &-title {
        color: #8d9199;
      }

      &-desc {
        color: #4a4a4a;
      }
    }

    .env-link {
      color: @themeColor;
    }

    .full-width {
      width: 100%;
    }
  }
}
</style>
