<template>
  <div class="task-detail-artifact-deploy">
    <el-card v-if="deploy" class="box-card task-process" :body-style="{ margin: '15px 0 0 0' }">
      <div slot="header" class="clearfix subtask-header">
        <span>{{$t(`productWorkflowStage.artifact`)}}</span>
        <div v-if="deploy.status==='running'" class="loader">
          <div class="ball-scale-multiple">
            <div></div>
            <div></div>
            <div></div>
          </div>
        </div>
      </div>
      <div class="deploy-item">
        <div class="error-wrapper">
          <el-alert v-if="deploy.error" :title="$t(`global.errorMsg`)" type="error" :close-text="$t(`global.ok`)">
            <span style="white-space: pre-wrap;">{{deploy.error}}</span>
          </el-alert>
        </div>
        <el-row :gutter="0">
          <el-col :span="6">
            <div class="item-title">
              <i class="iconfont iconzhuangtai"></i> {{$t(`status.deployStatus`)}}
            </div>
          </el-col>
          <el-col :span="6">
            <div
              class="item-desc"
              :class="$translate.calcTaskStatusColor(deploy.status)"
            >{{deploy.status?$t(`workflowTaskStatus.${deploy.status}`):$t(`workflowTaskStatus.notRunning`)}}</div>
          </el-col>
          <el-col :span="6">
            <div class="item-title">
              <i class="iconfont iconvery-environ"></i> {{$t(`workflow.deploymentEnv`)}}
            </div>
          </el-col>
          <el-col :span="6">
            <div class="item-desc">
              <router-link
                class="env-link"
                :to="`/v1/projects/detail/${deploy.product_name}/envs/detail?envName=${deploy.env_name}`"
              >{{deploy.env_name}}</router-link>
            </div>
          </el-col>
        </el-row>
        <el-row :gutter="0">
          <el-col :span="6" v-if="deploy.artifact_info">
            <div class="item-title">
              <i class="iconfont iconSliceCopy"></i> 交付物信息
            </div>
          </el-col>
          <el-col :span="6" v-if="deploy.artifact_info">
            <div>{{deploy.artifact_info.file_name}}</div>
          </el-col>
          <el-col :span="6">
            <div class="item-title">
              <i class="iconfont iconvery-service"></i> {{$t(`global.serviceName`)}}
            </div>
          </el-col>
          <el-col :span="6">
            <div class="item-desc">
              <span v-if="deploy.service_type==='helm'">{{`${$utils.showServiceName(deploy.container_name,deploy.service_name)}`}}</span>
              <router-link v-else class="env-link" :to="serviceUrl(deploy)">{{$utils.showServiceName(deploy.service_name)}}</router-link>
            </div>
          </el-col>
          <el-col :span="6" v-if="!deploy.artifact_info">
            <div class="item-title">
              <i class="iconfont iconSliceCopy"></i> {{$t(`status.imgInfo`)}}
            </div>
          </el-col>
          <el-col :span="6" v-if="!deploy.artifact_info">
            <el-tooltip effect="dark" :content="deploy.image" placement="top">
              <div class="item-desc image-name">{{deploy.image?deploy.image.split('/')[2]:"*"}}</div>
            </el-tooltip>
          </el-col>
        </el-row>
      </div>
    </el-card>
    <el-card
      id="deploy-log"
      v-if="!$utils.isEmpty(deploy)&&deploy.enabled && serviceType==='pm'"
      class="box-card task-process"
      :body-style="{padding:'8px 20px',margin: '5px 0 0 0' }"
    >
      <div class="log-container">
        <div class="log-content">
          <XtermLog :id="deploy.service_name" @mouseleave.native="leaveLog" :logs="artifactDeployLog" />
        </div>
      </div>
    </el-card>
  </div>
</template>

<script>
import mixin from '@/mixin/killSSELogMixin'
import qs from 'qs'
import { getWorkflowHistoryBuildLogAPI } from '@api'

export default {
  data () {
    return {
      artifactDeployLog: [],
      wsBuildDataBuffer: [],
      artifactDeployLogStarted: true,
      hasNewMsg: false
    }
  },
  computed: {
    artifactDeployRunning () {
      return this.deploy && this.deploy.status === 'running'
    },
    artifactDeployDone () {
      return this.isSubTaskDone(this.deploy)
    },
    serviceType () {
      return this.deploy.service_type
    },
    serviceName () {
      return this.deploy.service_name
    },
    envName () {
      return this.deploy.env_name
    },
    projectName () {
      return this.deploy.product_name
    }
  },
  methods: {
    serviceUrl (deploy) {
      const serviceName = deploy.service_name.split('_')[0]
      const path = `/v1/projects/detail/${deploy.product_name}/envs/detail/${serviceName}`
      const query = {
        envName: deploy.env_name,
        projectName: deploy.product_name,
        namespace: deploy.namespace,
        clusterId: deploy.cluster_id ? deploy.cluster_id : ''
      }
      if (deploy.service_type === 'pm') {
        return path + '/pm?' + qs.stringify(query)
      } else {
        return path + '?' + qs.stringify(query)
      }
    },
    getArtifactDeployLog () {
      this.artifactDeployLogStarted = true
    },
    leaveLog () {
      const el = document.querySelector('.workflow-task-detail').style
      el.overflow = 'auto'
    },
    openArtifactDeployLog (buildType) {
      const url = `/api/aslan/logs/sse/workflow/build/${this.workflowName}/${this.taskID}/999999/${this.serviceName}?subTask=artifact_deploy&envName=${this.envName}&projectName=${this.projectName}`
      if (typeof window.msgServer === 'undefined') {
        window.msgServer = {}
        window.msgServer[this.serviceName] = {}
      }
      this[`${buildType}IntervalHandle`] = setInterval(() => {
        if (this.hasNewMsg) {
          this.artifactDeployLog = this.artifactDeployLog.concat(
            this.wsBuildDataBuffer
          )
          this.wsBuildDataBuffer = []
        }
        this.hasNewMsg = false
      }, 500)
      this.$sse(url, { format: 'plain' })
        .then(sse => {
          // Store SSE object at a higher scope
          window.msgServer[this.serviceName] = sse
          sse.onError(e => {
            console.error('lost connection; giving up!', e)
            sse.close()
            this.killLog(buildType)
          })
          // Listen for messages without a specified event
          sse.subscribe('', data => {
            this.hasNewMsg = true
            this.wsBuildDataBuffer = this.wsBuildDataBuffer.concat(
              Object.freeze(data)
            )
          })
        })
        .catch(err => {
          console.error('Failed to connect to server', err)
          this.killLog(buildType)
        })
    },
    getHistoryArtifactDeployLog () {
      return getWorkflowHistoryBuildLogAPI(
        this.projectName,
        this.workflowName,
        this.taskID,
        this.serviceName,
        'artifact_deploy'
      ).then(response => {
        this.artifactDeployLog = response.split('\n').map(element => {
          return element
        })
      })
    }
  },
  watch: {
    artifactDeployRunning (val, oldVal) {
      if (!oldVal && val && this.artifactDeployLogStarted) {
        this.openArtifactDeployLog('artifact_deploy')
      }
      if (oldVal && !val) {
        this.killLog('artifact_deploy')
      }
    }
  },
  mounted () {
    if (this.serviceType === 'pm') {
      if (this.artifactDeployRunning) {
        this.openArtifactDeployLog('artifact_deploy')
      } else if (this.artifactDeployDone) {
        this.getHistoryArtifactDeployLog()
      }
    }
  },
  beforeDestroy () {
    if (this.serviceType === 'pm') {
      this.killLog('artifact_deploy')
    }
  },
  props: {
    deploy: {
      type: Object,
      required: true
    },
    workflowName: {
      type: String,
      required: true
    },
    taskID: {
      type: String,
      required: false
    }
  },
  mixins: [mixin]
}
</script>

<style lang="less">
@import '~@assets/css/component/subtask.less';

.task-detail-artifact-deploy {
  .deploy-item {
    margin-bottom: 15px;
  }

  .image-name {
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }

  .env-link {
    color: @themeColor;
  }
}
</style>
