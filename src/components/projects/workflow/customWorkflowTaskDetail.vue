<template>
  <div class="product-custom-detail">
    <header>
      <div class="left">
        <el-tooltip effect="dark" :content="displayName" placement="top">
          <router-link :to="`/v1/projects/detail/${projectName}/pipelines/custom/${workflowName}?display_name=${displayName}`">
            <span class="mg-r8">{{ $utils.tailCut(displayName,20) }}</span>
          </router-link>
        </el-tooltip>
        <span class="mg-r8">{{'#'+taskId}}</span>
        <span
          :class="$translate.calcTaskStatusColor(payload.status)"
        >{{ payload.status? $t(`workflowTaskStatus.${payload.status}`):$t(`workflowTaskStatus.notRunning`)}}</span>
      </div>
      <div class="right">
        <div class="mg-l24">
          <i class="el-icon-video-play"></i>
          <span>{{$utils.convertTimestamp(payload.create_time)}}</span>
        </div>
        <div class="mg-l24">
          <i class="el-icon-time"></i>
          <span>{{ payload.interval }}</span>
        </div>
        <div class="mg-l24">
          <i class="el-icon-user"></i>
          <span>{{payload.task_revoker}}</span>
        </div>
        <div class="mg-l24" >
          <el-button v-if="['waiting', 'running', 'waitforapprove'].includes(payload.status)" size="mini" @click="cancel" plain>{{$t(`testing.taskDetails.basicInformation.cancel`)}}</el-button>
          <el-button v-if="['failed', 'timeout', 'cancelled'].includes(payload.status)" size="mini" @click="retry" plain>{{$t(`testing.taskDetails.basicInformation.retry`)}}</el-button>
        </div>
      </div>
    </header>
    <Multipane layout="horizontal" style="height: 100%;">
      <main style="max-height: 20%;">
       <div class="scale">
        <el-tooltip class="item" effect="dark" content="缩小" placement="top">
          <span class="icon el-icon-minus" @click="scale('narrow')"></span>
        </el-tooltip>
        <el-tooltip class="item" effect="dark" content="放大" placement="top">
          <span class="icon el-icon-plus" @click="scale('enlarge')"></span>
        </el-tooltip>
      </div>
        <div class="tab">
          <span class="tab-item" :class="{'active': activeName==='workflow'}" @click="activeName = 'workflow'">{{$t(`global.workflow`)}}</span>
          <span
            class="tab-item"
            :class="{'active': activeName==='env'}"
            @click="activeName = 'env';isShowConsoleFooter=false"
          >{{$t(`global.var`)}}</span>
        </div>
        <div class="content" v-if="activeName==='workflow'" id="ui">
          <span class="text mg-r8">Start</span>
          <div class="line"></div>
          <div class="stages" v-for="(stage,stageIndex) in payload.stages" :key="stage.label">
            <div v-if="stage.approval && stage.approval.enabled" class="stages-approval" @click="handleApprovalChange(stage,stageIndex)">
              <el-button
                type="primary"
                size="small"
              >{{stage.approval.type==='lark'?$t(`approvalType.feishu`):$t(`approvalType.manualApproval`)}}</el-button>
              <div class="line"></div>
            </div>
            <div class="stage" :scale="scal">
              <el-tooltip placement="top-start" effect="dark" width="200" trigger="hover" :content="stage.name">
                <div class="stage-name">{{$utils.tailCut(stage.name,15)}}</div>
              </el-tooltip>
              <div class="jobs" v-for="(job,index) in stage.jobs" :key="job.name">
                <span
                  class="job"
                  @click="setCurJob(job,index,stageIndex)"
                  :class="{'active': stageIndex === curStageIndex && index === curJobIndex}"
                >
                  <div class="job-status" :class="$translate.calcTaskStatusColor(job.status)">
                    <span v-if="job.status === 'passed'|| job.status === 'success'" class="el-icon-success"></span>
                    <span v-else-if="job.status === 'failed'||job.status === 'failure'||job.status === 'timeout'" class="el-icon-error"></span>
                    <span v-else-if="job.status === 'cancelled'||job.status === 'terminated'" class="el-icon-warning"></span>
                    <span v-else-if="job.status === 'prepare'||job.status === 'running'||job.status === 'elected'" class="el-icon-loading"></span>
                    <span v-else class="el-icon-warning color-cancelled"></span>
                  </div>
                  <div v-if="job.job_info" class="job-content">
                    <div class="job-header">
                      <span class="name">{{$utils.tailCut(job.job_info.job_name,16)}}</span>
                      <span class="second">{{$utils.timeFormat(job.cost_seconds)}}</span>
                    </div>
                    <div class="job-detail">
                      <template v-if="job.type === 'zadig-build'">
                        <span v-if="`${job.job_info.service_name}(${job.job_info.service_module})`.length < 22" class="desc">{{`${job.job_info.service_name}(${job.job_info.service_module})`}}</span>
                        <el-tooltip v-else effect="dark" :content="`${job.job_info.service_name}(${job.job_info.service_module})`" placement="right">
                          <span class="desc">{{$utils.tailCut(`${job.job_info.service_name}(${job.job_info.service_module})`,25)}}</span>
                        </el-tooltip>
                      </template>
                      <template v-else-if="job.type === 'zadig-deploy' || job.type === 'mse-gray-release'">
                        <span v-if="`${job.job_info.service_name}`.length < 22" class="desc">{{`${job.job_info.service_name}`}}</span>
                        <el-tooltip v-else effect="dark" :content="`${job.job_info.service_name}`" placement="right">
                          <span class="desc">{{$utils.tailCut(`${job.job_info.service_name}`,25)}}</span>
                        </el-tooltip>
                      </template>
                      <template v-else-if="job.type === 'custom-deploy'">
                        <span class="desc">{{`${job.job_info.workload_name}`}}</span>
                        <span class="desc">{{`${job.job_info.container_name}`}}</span>
                      </template>
                      <template v-else-if="job.type === 'k8s-blue-green-deploy' || job.type === 'k8s-blue-green-release' || job.type === 'k8s-canary-deploy' || job.type === 'k8s-canary-release'">
                        <span v-if="`${job.job_info.k8s_service_name}`.length < 22" class="desc">{{`${job.job_info.k8s_service_name}`}}</span>
                        <el-tooltip v-else effect="dark" :content="`${job.job_info.k8s_service_name}`" placement="right">
                          <span class="desc">{{$utils.tailCut(`${job.job_info.k8s_service_name}`,25)}}</span>
                        </el-tooltip>
                      </template>
                      <template v-else-if="job.type === 'k8s-gray-release' || job.type === 'k8s-gray-rollback' || job.type === 'istio-release' || job.type === 'istio-rollback'">
                        <span v-if="`${job.job_info.workload_name}`.length < 22" class="desc">{{`${job.job_info.workload_name}`}}</span>
                        <el-tooltip v-else effect="dark" :content="`${job.job_info.workload_name}`" placement="right">
                          <span class="desc">{{$utils.tailCut(`${job.job_info.workload_name}`,25)}}</span>
                        </el-tooltip>
                      </template>
                      <template v-else-if="job.type === 'zadig-scanning'">
                        <span v-if="`${job.job_info.scanning_name}`.length < 22" class="desc">{{`${job.job_info.scanning_name}`}}</span>
                        <el-tooltip v-else effect="dark" :content="`${job.job_info.scanning_name}`" placement="right">
                          <span class="desc">{{$utils.tailCut(`${job.job_info.scanning_name}`,25)}}</span>
                        </el-tooltip>
                      </template>
                      <template v-else-if="job.type === 'zadig-test'">
                        <template v-if="job.job_info.test_type === 'service_test'">
                          <span v-if="`${job.job_info.service_name}(${job.job_info.service_module})`.length < 22" class="desc">{{`${job.job_info.service_name}(${job.job_info.service_module})`}}</span>
                          <el-tooltip v-else effect="dark" :content="`${job.job_info.service_name}(${job.job_info.service_module})`" placement="right">
                            <span class="desc">{{$utils.tailCut(`${job.job_info.service_name}(${job.job_info.service_module})`,25)}}</span>
                          </el-tooltip>
                        </template>
                        <template v-else-if="job.job_info.test_type === ''">
                          <span v-if="`${job.job_info.testing_name}`.length < 22" class="desc">{{`${job.job_info.testing_name}`}}</span>
                          <el-tooltip v-else effect="dark" :content="`${job.job_info.testing_name}`" placement="right">
                            <span class="desc">{{$utils.tailCut(`${job.job_info.testing_name}`,25)}}</span>
                          </el-tooltip>
                        </template>
                      </template>
                      <template v-else-if="job.type === 'zadig-helm-chart-deploy'">
                        <span v-if="`${job.job_info.release_name}`.length < 22" class="desc">{{`${job.job_info.release_name}`}}</span>
                        <el-tooltip v-else effect="dark" :content="`${job.job_info.release_name}`" placement="right">
                          <span class="desc">{{$utils.tailCut(`${job.job_info.release_name}`,25)}}</span>
                        </el-tooltip>
                      </template>
                    </div>
                  </div>
                  <div v-else class="job-content">
                    <div class="job-header">
                      <el-tooltip placement="top-start" effect="dark" width="200" trigger="hover" :content="job.name">
                        <span class="name">{{$utils.tailCut(job.name,18)}}</span>
                      </el-tooltip>
                      <span class="second">{{$utils.timeFormat(job.cost_seconds)}}</span>
                    </div>
                  </div>
                </span>
              </div>
            </div>
            <div class="line"></div>
          </div>
          <span class="text mg-l8">End</span>
        </div>
        <div v-if="activeName==='env'" class="env">
          <el-table :data="envList" v-if="envList.length>0" class="env-table">
            <el-table-column type="expand">
              <template slot-scope="props">
                <div v-if="props.row.name==='工作流变量'" class="env-row">
                  <el-row v-for="(env,index) in props.row.envs" :key="index" class="env-item">
                    <el-col :span="12">
                      <span class="key">{{env.name}}</span>
                    </el-col>
                    <el-col :span="12">
                       <span class="value">{{env.value}}</span>
                    </el-col>
                  </el-row>
                </div>
                <div v-if="props.row.type==='zadig-build'" class="env-row">
                  <el-row v-for="(env,index) in props.row.spec.envs" :key="index" class="env-item">
                    <el-col :span="12">
                      <span class="key">{{env.key}}</span>
                    </el-col>
                    <el-col :span="12">
                       <span class="value">{{env.value}}</span>
                    </el-col>
                  </el-row>
                </div>
                <div v-if="props.row.type==='zadig-deploy'" class="env-row">
                  <el-row v-for="(env,index) in props.row.spec.key_vals" :key="index" class="env-item">
                    <el-col :span="12">
                      <span class="key">{{env.key}}</span>
                    </el-col>
                    <el-col :span="12">
                       <span class="value">{{env.value}}</span>
                    </el-col>
                  </el-row>
                </div>
                <div v-if="props.row.type === 'freestyle'" class="env-row">
                  <el-row v-for="(env,index) in props.row.spec.envs" :key="index" class="env-item">
                    <el-col :span="12">
                      <span class="key">{{env.key}}</span>
                    </el-col>
                    <el-col :span="12">
                       <span class="value">{{env.value}}</span>
                    </el-col>
                  </el-row>
                </div>
                <div v-if="props.row.type === 'plugin'" class="env-row">
                  <el-row v-for="(env,index) in props.row.spec.inputs" :key="index" class="env-item">
                    <el-col :span="12">
                      <span class="key">{{env.name}}</span>
                    </el-col>
                    <el-col :span="12">
                       <span class="value">{{env.value}}</span>
                    </el-col>
                  </el-row>
                </div>
              </template>
            </el-table-column>
            <el-table-column :label="$t(`global.key`)" prop="name"></el-table-column>
            <el-table-column :label="$t(`global.value`)"></el-table-column>
          </el-table>
        </div>
      </main>
      <MultipaneResizer class="multipane-resizer" v-if="isShowConsoleFooter"></MultipaneResizer>
      <footer :style="{minHeight:'500px'}" v-if="isShowConsoleFooter">
        <JobBuildDetail
          v-if="curJob.type === jobType.build"
          :jobInfo.sync="curJob"
          :taskId="taskId"
          :workflowName="workflowName"
          :projectName="projectName"
          @showFooter="showFooter"
          :isShowConsoleFooter.sync="isShowConsoleFooter"
        />
        <JobDeployDetail @showFooter="showFooter" v-if="curJob.type=== jobType.deploy" :deployType="deployType" :jobInfo="curJob" :projectName="projectName" />
        <StageApproval
          v-if="curJob.type === jobType.approval"
          :approvalInfo="curStage"
          :workflowName="workflowName"
          :taskId="taskId"
          :firstLoad="firstLoad"
          :projectName="projectName"
          @showFooter="showFooter"
        />
        <JobFreestyleDetail
          v-if="curJob.type === jobType.common"
          :jobInfo="curJob"
          :workflowName="workflowName"
          :taskId="taskId"
          :projectName="projectName"
          @showFooter="showFooter"
        />
        <JobPluginDetail
          v-if="curJob.type === jobType.plugin"
          :pluginInfo="curJob"
          :workflowName="workflowName"
          :taskId="taskId"
          :projectName="projectName"
          @showFooter="showFooter"
        />
        <JobK8sDeployDetail @showFooter="showFooter" v-if="curJob.type=== jobType.k8sDeploy" :jobInfo="curJob" :projectName="projectName" />
        <JobTestDetail
          v-if="curJob.type === jobType.test"
          :jobInfo="curJob"
          :taskId="taskId"
          :workflowName="workflowName"
          :projectName="projectName"
          @showFooter="showFooter"
          :isShowConsoleFooter.sync="isShowConsoleFooter"
        />
        <JobScanningDetail
          v-if="curJob.type === jobType.scanning"
          :jobInfo="curJob"
          :taskId="taskId"
          :workflowName="workflowName"
          :projectName="projectName"
          @showFooter="showFooter"
          :isShowConsoleFooter.sync="isShowConsoleFooter"
        />
        <JobImageDistributeDetail
          v-if="curJob.type === jobType.distribute"
          :jobInfo="curJob"
          :taskId="taskId"
          :workflowName="workflowName"
          :projectName="projectName"
          @showFooter="showFooter"
          :isShowConsoleFooter.sync="isShowConsoleFooter"
        />
      </footer>
    </Multipane>
  </div>
</template>
<script>
import {
  getCustomWorkflowTaskDetailAPI,
  deleteCustomWorkflowTaskAPI,
  retryCustomWorkflowTaskAPI
} from '@api'
import { Multipane, MultipaneResizer } from 'vue-multipane'
import JobBuildDetail from './customWorkflowTaskDetail/jobBuildDetail.vue'
import JobDeployDetail from './customWorkflowTaskDetail/jobDeployDetail.vue'
import StageApproval from './customWorkflowTaskDetail/stageApproval.vue'
import JobFreestyleDetail from './customWorkflowTaskDetail/jobFreestyleDetail.vue'
import JobPluginDetail from './customWorkflowTaskDetail/jobPluginDetail.vue'
import JobK8sDeployDetail from './customWorkflowTaskDetail/jobK8sDeployDetail.vue'
import JobTestDetail from './customWorkflowTaskDetail/jobTestDetail.vue'
import JobScanningDetail from './customWorkflowTaskDetail/jobScanningDetail.vue'
import JobImageDistributeDetail from './customWorkflowTaskDetail/jobImageDistributeDetail.vue'
import { jobType } from './workflowEditor/customWorkflow/config'
import bus from '@utils/eventBus'

export default {
  data () {
    return {
      jobType,
      isShowConsoleFooter: false,
      firstLoad: true,
      curJobIndex: 0,
      curJob: {},
      payload: {},
      curStageIndex: 0,
      timerId: null,
      timeTimeoutFinishFlag: false,
      activeName: 'workflow',
      activeEnvName: 'env',
      envList: [],
      scal: '1'
    }
  },
  components: {
    Multipane,
    MultipaneResizer,
    JobBuildDetail,
    JobDeployDetail,
    JobFreestyleDetail,
    JobPluginDetail,
    JobK8sDeployDetail,
    JobTestDetail,
    JobScanningDetail,
    StageApproval,
    JobImageDistributeDetail
  },
  computed: {
    taskId () {
      return this.$route.params.task_id
    },
    workflowName () {
      return this.$route.params.workflow_name
    },
    displayName () {
      return this.$route.query.display_name
    },
    projectName () {
      return this.$route.params.project_name
    },
    status () {
      return this.payload.status
    },
    buildOverallStatus () {
      return this.$utils.calcOverallBuildStatus(this.buildStage)
    },
    buildOverallColor () {
      return this.colorTranslation(this.buildOverallStatus, 'pipeline', 'task')
    },
    curStage () {
      if (this.payload.stages) {
        return this.payload.stages[this.curStageIndex]
      } else {
        return {}
      }
    },
    deployType () {
      const project = this.$store.getters.projectList.find(
        project => project.name === this.projectName
      )
      return project ? project.deployType : ''
    }
  },
  methods: {
    getWorkflowTaskDetail (workflow_name, task_id) {
      getCustomWorkflowTaskDetailAPI(
        workflow_name,
        task_id,
        this.projectName
      ).then(res => {
        this.$router.replace({
          query: {
            ...this.$route.query,
            status: res.status
          }
        })
        // show approval detail when init data
        res.stages.forEach((item, index) => {
          if (
            item.approval &&
            item.approval.enabled &&
            (item.status === 'running' || item.status === 'waitforapprove') &&
            this.firstLoad
          ) {
            this.handleApprovalChange(item, index)
            this.firstLoad = false
          }
        })
        if (
          this.curJob.type &&
          this.curJob.type !== 'zadig-approval' &&
          this.payload.stages &&
          this.payload.stages.length > 0
        ) {
          // can't use computed hook because approval footer is stage level data but use job level data
          this.curJob = this.payload.stages[this.curStageIndex].jobs[
            this.curJobIndex
          ]
        }
        this.payload = res
        this.adaptTaskDetail(res)
        if (this.envList.length === 0) {
          // global env and stage are not in same level data,  so need to handle data
          this.handleEnv()
          const globalEnv = [
            {
              name: this.$t(`workflow.workflowVars`),
              envs: this.payload.params
            }
          ]
          const jobs = this.payload.stages.map(item => {
            return item.jobs.map(job => job)
          })
          this.envList = globalEnv.concat(jobs.flat())
        }
      })
    },
    handleEnv () {
      // dont show env value includes 'fixed'/'{{'
      for (let i = 0; i < this.payload.params.length; i++) {
        if (
          this.payload.params[i].value.includes('fixed') ||
          this.payload.params[i].value.includes('{{')
        ) {
          this.$delete(this.payload.params, i)
        }
        if (this.payload.params[i].is_credential) {
          this.payload.params[i].value = '******'
        }
      }
      this.payload.stages.forEach(stage => {
        stage.jobs.forEach(job => {
          if (job.spec && job.spec.service_and_builds) {
            job.spec.service_and_builds.forEach(service => {
              for (let i = 0; i < service.key_vals.length; i++) {
                if (
                  service.key_vals[i].value.includes('fixed') ||
                  service.key_vals[i].value.includes('{{')
                ) {
                  this.$delete(service.key_vals, i)
                }
                if (service.key_vals[i].is_credential) {
                  service.key_vals[i].value = '******'
                }
              }
            })
          }
          if (job.type === 'freestyle') {
            for (let i = 0; i < job.spec.envs.length; i++) {
              if (
                job.spec.envs[i].value.includes('fixed') ||
                job.spec.envs[i].value.includes('{{')
              ) {
                this.$delete(job.spec.envs, i)
              }
              if (job.spec.envs[i].is_credential) {
                job.spec.envs[i].value = '******'
              }
            }
          }
          if (job.type === 'plugin') {
            for (let i = 0; i < job.spec.inputs.length; i++) {
              if (
                job.spec.inputs[i].value.includes('fixed') ||
                job.spec.inputs[i].value.includes('{{')
              ) {
                this.$delete(job.spec.inputs, i)
              }
              if (job.spec.inputs[i].is_credential) {
                job.spec.inputs[i].value = '******'
              }
            }
          }
        })
      })
    },
    setCurJob (item, index, curStageIndex) {
      this.isShowConsoleFooter = true
      this.curJob = item
      this.curJobIndex = index
      this.curStageIndex = curStageIndex
    },
    async refreshHistoryTaskDetail (operation) {
      await this.getWorkflowTaskDetail(this.workflowName, this.taskId)
      const statusList = ['running', 'waiting', 'waitforapprove']
      if ((!this.timeTimeoutFinishFlag && statusList.includes(this.$route.query.status)) || operation === 'retry') {
        this.timerId = setTimeout(this.refreshHistoryTaskDetail, 1000) // 保证内存中只有一个定时器
      }
    },
    adaptTaskDetail (detail) {
      detail.intervalSec =
        (detail.status === 'running'
          ? Math.round(new Date().getTime() / 1000)
          : detail.end_time) - detail.start_time
      detail.interval = this.$utils.timeFormat(detail.intervalSec)
    },
    handleApprovalChange (stage, index) {
      // approval is stage level data, there use job ui
      this.curStageIndex = index
      this.curJob.type = 'zadig-approval'
      this.isShowConsoleFooter = true
    },
    showFooter (val) {
      this.isShowConsoleFooter = val
    },
    cancel () {
      deleteCustomWorkflowTaskAPI(
        this.workflowName,
        this.taskId,
        this.projectName
      ).then(res => {
        this.$message.success(this.$t(`workflow.cancelSuccess`))
      })
    },
    retry () {
      retryCustomWorkflowTaskAPI(
        this.workflowName,
        this.taskId,
        this.projectName
      ).then(res => {
        this.$message.success(this.$t(`workflow.retrySuccess`))
        this.refreshHistoryTaskDetail('retry')
      })
    },
    closeFooter () {
      this.isShowConsoleFooter = false
    },
    setTitle () {
      bus.$emit('set-topbar-title', {
        title: '',
        breadcrumb: [
          { title: this.$t(`global.project`), url: '/v1/projects' },
          {
            title: this.projectName,
            isProjectName: true,
            url: `/v1/projects/detail/${this.projectName}/detail`
          },
          {
            title: this.$t(`global.workflow`),
            url: `/v1/projects/detail/${this.projectName}/pipelines`
          },
          {
            title: this.displayName || this.workflowName,
            url: `/v1/projects/detail/${this.projectName}/pipelines/custom/${this.workflowName}?display_name=${this.displayName}`
          },
          { title: this.taskId, url: `` }
        ]
      })
    },
    scale (type) {
      this.$nextTick(() => {
        const main = document.getElementById('ui')
        if (type === 'enlarge') {
          if (this.scal > 1) return
          this.scal = (parseFloat(this.scal) + 0.1).toFixed(2)
        } else {
          if (this.scal < 0.5) return
          this.scal = (parseFloat(this.scal) - 0.1).toFixed(2)
        }
        main.style.zoom = this.scal
      })
    }
  },
  mounted () {
    this.setTitle()
    this.refreshHistoryTaskDetail()
    this.curJobIndex = -1
  },
  beforeDestroy () {
    this.timeTimeoutFinishFlag = true
    clearTimeout(this.timerId)
  },
  watch: {
    isShowConsoleFooter (newVal, val) {
      if (!newVal) {
        this.curJobIndex = -1
      }
    }
  }
}
</script>
<style lang="less" scoped>
.product-custom-detail {
  height: 100%;
  font-size: 14px;
  background: #fff;

  header {
    display: flex;
    justify-content: space-between;
    height: 42px;
    margin: 24px;
    padding: 0 24px;
    color: #121212;
    line-height: 42px;
    box-shadow: 1px 1px 4px rgba(0, 0, 0, 0.1);

    .left {
      width: 30%;
    }

    .right {
      display: flex;
      flex: 1 0 300px;
      justify-content: flex-end;
    }
  }

  .tab {
    margin: 4px 0 24px 0;
    color: @projectNameColor;
    font-size: 14px;
    cursor: pointer;

    span:first-child {
      position: relative;
      margin-right: 16px;

      &::after {
        position: absolute;
        top: 0;
        right: -10px;
        width: 2px;
        height: 100%;
        background: @borderGray;
        content: '';
      }
    }

    .active {
      color: @themeColor;
    }
  }

  .scale {
    position: absolute;
    right: 4%;
    bottom: 6%;
    z-index: 0;
    cursor: pointer;

    .icon {
      margin-right: 4px;
      padding: 4px;
      border: 1px solid #ddd;
    }
  }

  main {
    padding: 0 24px;

    .content {
      display: flex;
      box-sizing: border-box;
      min-height: 300px;
      max-height: 650px;
      padding: 10px 0;
      overflow: auto;

      .text {
        line-height: 52px;
      }

      .stages {
        display: flex;
        height: 100%;
        font-size: 16px;
        text-align: center;

        &-approval {
          display: flex;
          height: 40px;
        }

        .stage {
          box-sizing: border-box;
          width: 240px;
          margin: -6px 4px;
          padding: 8px 0 16px 0;
          border: 2px dotted @borderGray;
          border-radius: 4px;
          cursor: pointer;

          &-name {
            margin-right: 16px;
            margin-left: 16px;
            padding-left: -8px;
            color: #121212;
            font-size: 14px;
            line-height: 24px;
            text-align: left;
            border-bottom: 1px solid @borderGray;
            cursor: pointer;
          }
        }

        .jobs {
          margin-top: 8px;
          padding: 0 16px;
          line-height: 20px;

          .job {
            position: relative;
            display: flex;
            align-items: center;
            justify-content: space-between;
            box-sizing: border-box;
            padding: 8px;
            font-weight: 400;
            font-size: 14px;
            text-align: left;
            border: 1px solid @borderGray;
            border-radius: 4px;
            cursor: pointer;
            transition-duration: 0.6s;
            transition-property: box-shadow, border-color;

            &-status {
              flex: 0 0 12px;
              font-size: 18px;
            }

            &-content {
              display: flex;
              flex: 1 1 auto;
              flex-direction: column;
              margin-left: 10px;
              overflow: hidden;
              text-align: left;

              .job-header {
                display: flex;

                .name {
                  display: inline-flex;
                  flex: 1 1 auto;
                  overflow: hidden;
                  color: #4a4a4a;
                  white-space: nowrap;
                  text-overflow: ellipsis;
                }

                .second {
                  display: inline-flex;
                  color: @fontGray;
                  font-size: 12px;
                }
              }

              .job-detail {
                display: flex;
                overflow: hidden;
                white-space: nowrap;
                text-overflow: ellipsis;

                .desc {
                  display: inline-flex;
                  flex: 1 1 auto;
                  overflow: hidden;
                  color: #8d9199;
                  white-space: nowrap;
                  text-overflow: ellipsis;
                }
              }
            }

            &:hover {
              border: 1px solid @themeColor;
              box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
            }

            &-debug {
              position: absolute;
              top: 50%;
              left: 100%;
              display: inline-block;
              width: 10px;
              height: 10px;
              background: #eee;
              border-radius: 50%;
              transform: translate(-50%, -50%);

              &.debugging {
                background: #f00;
              }
            }
          }

          .active {
            border: 1px solid @themeColor;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          }
        }
      }
    }

    .env {
      width: 100%;
      min-height: 400px;
      max-height: 80%;
      overflow-y: auto;

      .env-table {
        .env-row {
          padding-left: 60px;

          .env-item {
            padding-top: 5px;
            padding-bottom: 5px;

            .key,
            .value {
              word-wrap: break-word;
            }
          }
        }
      }
    }
  }

  footer {
    height: 100%;
  }

  .multipane-resizer {
    z-index: 10;
    cursor: row-resize;
  }

  .multipane-resizer::before {
    position: absolute;
    top: 50%;
    left: 50%;
    display: block;
    width: 100px;
    height: 8px;
    margin-left: -5.5px;
    background-color: #fff;
    border: 1px solid #dbdbdb;
    border-radius: 5px;
    content: '';
  }

  .line {
    position: relative;
    min-width: 46px;
    height: 2px;
    margin-top: 24px;
    background: @themeColor;

    &::before {
      position: absolute;
      top: -2px;
      left: -5px;
      width: 4px;
      height: 4px;
      border: 1px solid @themeColor;
      border-radius: 50%;
      content: '';
    }

    &::after {
      position: absolute;
      top: -2px;
      right: -5px;
      width: 4px;
      height: 4px;
      border: 1px solid @themeColor;
      border-radius: 50%;
      content: '';
    }
  }
}

@media only screen and (max-width: 1441px) {
  .product-custom-detail {
    main {
      .content {
        max-height: 440px;
        overflow: auto;
      }
    }
  }
}
</style>
