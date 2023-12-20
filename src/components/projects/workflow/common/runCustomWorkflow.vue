<template>
  <div class="custom-workflow">
    <div class="running-jobs-selection">
      <span class="dialog-title">执行工作流</span>
      <el-tag
        v-for="(job,index) in allJobList"
        :key="index"
        :class="{'run-tag': true, 'disabled': job.run_policy === 'force_run', 'selected': !job.skipped}"
        @click="selectJobName(job.name, job)"
      >{{ job.name }}</el-tag>
    </div>
    <el-form label-position="left" label-width="140px" size="small">
      <el-collapse v-model="activeName">
        <el-collapse-item
          :title="$t(`workflow.workflowVars`)"
          name="env"
          v-if="payload.params && payload.params.length>0&&isShowParams"
        >
          <el-table :data="payload.params.filter(item=>item.isShow)">
            <el-table-column :label="$t(`global.key`)">
              <template slot-scope="scope">{{scope.row.name}}</template>
            </el-table-column>
            <el-table-column :label="$t(`global.value`)">
              <template slot-scope="scope">
                <VarBranchSelect v-if="scope.row.type === 'repo'" :originRepo="scope.row.repo" />
                <el-row v-else>
                  <el-col :span="12">
                    <el-select v-if="scope.row.type === 'choice'" style="width: 100%;" v-model="scope.row.value" size="small">
                      <el-option v-for="(item,index) in scope.row.choice_option" :key="index" :value="item" :label="item">{{item}}</el-option>
                    </el-select>
                    <el-input
                      v-if="scope.row.type === 'text'"
                      style="width: 100%;"
                      v-model="scope.row.value"
                      size="small"
                      type="textarea"
                      :rows="2"
                    ></el-input>
                    <el-input
                      v-else-if="scope.row.type === 'string'"
                      style="width: 100%;"
                      class="password"
                      v-model="scope.row.value"
                      size="small"
                      type="text"
                    ></el-input>
                  </el-col>
                </el-row>
              </template>
            </el-table-column>
          </el-table>
        </el-collapse-item>
        <div v-for="(stage,stageIndex) in payload.stages" :key="stage.name" class="stage-container">
          <div v-for="(job,jobIndex) in stage.jobs" :key="job.name" class="job-container">
            <template v-if="(job.run_policy==='force_run' || job.run_policy===''|| job.run_policy === 'default_not_run') && job.skipped === false ">
                <el-collapse-item :title="`${job.name}`" :key="job.name" :name="`${stageIndex}${jobIndex}`">
                  <template slot="title">
                    <span >{{job.name}}</span>
                  </template>
                  <div v-if="job.type === 'zadig-build'">
                    <el-form-item :label="$t(`global.serviceModule`)">
                      <el-select
                        v-model="job.pickedTargets"
                        filterable
                        multiple
                        clearable
                        reserve-keyword
                        value-key="value"
                        size="small"
                        style="width: 220px;"
                        @change="handleServiceBuildChange($event,job,'zadig-build')"
                      >
                        <el-option
                          v-for="(service,index) of job.spec.service_and_builds"
                          :key="index"
                          :label="`${service.service_module}(${service.service_name})`"
                          :value="service"
                        >
                          <span>{{service.service_module}}</span>
                          <span style="color: #ccc;">({{service.service_name}})</span>
                        </el-option>
                      </el-select>
                    </el-form-item>
                    <div v-if="job.pickedTargets">
                      <CustomWorkflowBuildRows :pickedTargets="job.pickedTargets" />
                    </div>
                  </div>
                  <div v-if="job.type === 'zadig-deploy'">
                    <el-form-item prop="productName" :label="$t(`project.environments`)">
                      <el-select
                        v-model="job.spec.env"
                        :disabled="job.spec.envTypes==='fixed'"
                        size="small"
                        @change="handleDeployChange(job, job.pickedTargets)"
                        style="width: 220px;"
                      >
                        <el-option
                          v-for="pro of currentProjectEnvs"
                          :key="`${pro.projectName} / ${pro.name}`"
                          :label="`${pro.projectName} / ${pro.name}`"
                          :value="`${pro.name}`"
                        >
                          <span>{{`${pro.projectName} / ${pro.name}`}}</span>
                        </el-option>
                      </el-select>
                    </el-form-item>
                    <el-form-item :label="$t(`global.serviceModule`)" v-if="job.spec.source === 'runtime'">
                      <el-select
                        v-model="job.pickedTargets"
                        filterable
                        multiple
                        clearable
                        reserve-keyword
                        value-key="value"
                        size="small"
                        style="width: 220px;"
                        @change="handleRuntimeServiceChange(job, job.pickedTargets)"
                      >
                        <el-option
                          disabled
                          :label="$t(`global.selectAll`)"
                          value="ALL"
                          :class="{selected: job.pickedTargets && job.pickedTargets.length === job.spec.service_and_images.length}"
                          style="color: #606266;"
                        >
                          <span
                            style=" display: inline-block; width: 100%; font-weight: normal; cursor: pointer;"
                            @click="job.pickedTargets=job.spec.service_and_images;handleRuntimeServiceChange(job, job.pickedTargets)"
                          >{{$t(`global.selectAll`)}}</span>
                        </el-option>
                        <el-option
                          v-for="(service,index) of job.spec.service_and_images"
                          :key="index"
                          :label="`${service.service_module}(${service.service_name})`"
                          :value="service"
                        >
                          <span>{{service.service_module}}</span>
                          <span style="color: #ccc;">({{service.service_name}})</span>
                        </el-option>
                      </el-select>
                    </el-form-item>
                    <div>
                      <CustomWorkflowDeployConfig
                        :job="job"
                        ref="deployConfig"
                        :originServices="originServices"
                        :projectName="projectName"
                        @deployFromOtherJobInfo="getComputedDeployFromOtherJobInfo"
                        @serviceVariableChange="recordServiceVariable"
                      />
                    </div>
                  </div>
                  <div v-if="job.type === 'custom-deploy'">
                    <el-form-item :label="$t(`workflow.selectContainer`)" v-if="job.spec.source === 'runtime'">
                      <el-select
                        v-model="job.pickedTargets"
                        filterable
                        multiple
                        clearable
                        reserve-keyword
                        value-key="target"
                        size="small"
                        style="width: 220px;"
                        @change="handleContainerChange($event,job)"
                      >
                        <el-option v-for="(item,index) of job.spec.targets" :key="index" :label="item.target" :value="item"></el-option>
                      </el-select>
                    </el-form-item>
                    <div v-for="(item,index) in job.pickedTargets" :key="index">
                      <el-form-item :label="item.service">
                        <el-select
                          v-model="item.image"
                          filterable
                          clearable
                          @change="handleCurImageChange"
                          reserve-keyword
                          size="small"
                          style="width: 220px;"
                          placeholder="请选择镜像"
                        >
                          <el-option
                            v-for="(image,index) of item.images"
                            :key="index"
                            :value="image.host+'/'+image.owner+'/'+image.name+':'+image.tag"
                            :label="image.tag"
                          ></el-option>
                        </el-select>
                      </el-form-item>
                    </div>
                  </div>
                  <div v-if="job.type === 'freestyle'">
                    <CustomWorkflowCommonRows :job="job" />
                  </div>
                  <div v-if="job.type === 'plugin'">
                    <CustomWorkflowCommonRows :job="job" type="plugin" />
                  </div>
                  <div v-if="job.type === 'zadig-test'">
                    <el-form-item
                      :label="$t(`global.serviceModule`)"
                      v-if="job.spec.test_type=== 'service_test'&&job.spec.source==='runtime'"
                    >
                      <el-select
                        v-model="job.pickedTargets"
                        filterable
                        multiple
                        clearable
                        reserve-keyword
                        value-key="value"
                        size="small"
                        style="width: 220px;"
                        @change="handleTestServiceBuildChange($event,job,'zadig-test')"
                      >
                        <el-option
                          v-for="(service,index) of job.spec.originServiceAndTest"
                          :key="index"
                          :label="`${service.service_module}(${service.service_name})`"
                          :value="service"
                        >
                          <span>{{service.service_module}}</span>
                          <span style="color: #ccc;">({{service.service_name}})</span>
                        </el-option>
                      </el-select>
                    </el-form-item>
                    <div v-if="job.pickedTargets">
                      <CustomWorkflowTestRows :job="job" :serviceModules="originServiceAndBuilds" :payload="payload" type="zadig-test" />
                    </div>
                  </div>
                  <div v-if="job.type === 'zadig-scanning'">
                    <div v-if="job.pickedTargets">
                      <CustomWorkflowBuildRows :pickedTargets="job.pickedTargets" type="zadig-scanning" />
                    </div>
                  </div>
                  <div v-if="job.type==='zadig-distribute-image'">
                    <div v-if="job.spec.source === 'runtime'">
                      <el-form-item :label="$t(`global.serviceModule`)">
                        <el-select
                          v-model="job.pickedTargets"
                          filterable
                          multiple
                          clearable
                          reserve-keyword
                          value-key="value"
                          size="small"
                          style="width: 220px;"
                          @change="handleServiceDeployChange(job.pickedTargets, job, 'zadig-distribute-image')"
                        >
                          <el-option
                            disabled
                            label="全选"
                            value="ALL"
                            :class="{selected: job.pickedTargets && job.pickedTargets.length === job.spec.targets.length}"
                            style="color: #606266;"
                          >
                            <span
                              style=" display: inline-block; width: 100%; font-weight: normal; cursor: pointer;"
                              @click="()=>{job.pickedTargets = job.spec.targets;handleServiceDeployChange(job.pickedTargets, job, 'zadig-distribute-image')}"
                            >全选</span>
                          </el-option>
                          <el-option
                            v-for="(service,index) of job.spec.targets"
                            :key="index"
                            :label="`${service.service_module}(${service.service_name})`"
                            :value="service"
                          >
                            <span>{{service.service_module}}</span>
                            <span style="color: #ccc;">({{service.service_name}})</span>
                          </el-option>
                        </el-select>
                      </el-form-item>
                      <el-table :data="job.pickedTargets">
                        <el-table-column :label="$t(`global.serviceModule`)" min-width="15%">
                          <template slot-scope="scope">
                            <el-tooltip  effect="dark" :content="scope.row.service_name" placement="top">
                              <span style="cursor: pointer;">{{`${scope.row.service_module}`}}</span>
                            </el-tooltip>
                          </template>
                        </el-table-column>
                        <el-table-column label="原始镜像版本" min-width="25%">
                          <template slot-scope="scope">
                            <el-select
                              v-model="scope.row.source_tag"
                              filterable
                              clearable
                              reserve-keyword
                              @change="handleSourceTagChange(scope.row)"
                              value-key="service_name"
                              size="small"
                              placeholder="请选择原始镜像版本"
                            >
                              <el-option v-for="(image,index) of scope.row.images" :key="index" :value="image.tag" :label="image.tag"></el-option>
                            </el-select>
                          </template>
                        </el-table-column>
                        <el-table-column label="目标镜像版本" min-width="30%" v-if="!job.spec.enable_target_image_tag_rule">
                          <template slot-scope="{row,$index}">
                            <div class="flex">
                              <el-input v-model="row.target_tag" placeholder="请输入目标镜像版本" size="small" class="input"></el-input>
                              <el-button
                                v-if="$index===0"
                                size="small"
                                type="text"
                                @click="applyAllImage(job.pickedTargets,row.target_tag)"
                              >应用全部</el-button>
                            </div>
                          </template>
                        </el-table-column>
                      </el-table>
                    </div>
                    <div v-else>
                      <el-table :data="disImageFromBuildJobInfo.pickedTargets">
                        <el-table-column :label="$t(`project.services`)" min-width="20%">
                          <template slot-scope="scope">{{`${scope.row.service_module}(${scope.row.service_name})`}}</template>
                        </el-table-column>
                        <el-table-column label="原始镜像版本" min-width="20%">
                          <span style="color: #909399; font-size: 12px; line-height: 33px;">来自前置构建任务</span>
                        </el-table-column>
                        <template v-if="!job.spec.enable_target_image_tag_rule">
                        <el-table-column label="修改版本" min-width="12%">
                          <template slot-scope="scope">
                            <el-switch v-model="scope.row.update_tag"></el-switch>
                          </template>
                        </el-table-column>
                        <el-table-column label="目标镜像版本" min-width="48%">
                          <template slot-scope="scope">
                            <div v-if="scope.row.update_tag" class="flex">
                              <el-input v-model="scope.row.target_tag" placeholder="请输入目标镜像版本" size="small" class="input"></el-input>
                              <el-button
                                size="small"
                                type="text"
                                @click="applyAllImage(disImageFromBuildJobInfo.pickedTargets,scope.row.target_tag)"
                              >应用全部</el-button>
                            </div>
                            <span v-else>
                              <span style="color: #909399; font-size: 12px; line-height: 33px;">来自前置构建任务</span>
                            </span>
                          </template>
                        </el-table-column>
                        </template>
                      </el-table>
                    </div>
                  </div>
                  <div v-if="job.type==='jira'">
                    <el-form-item :label="$t(`workflow.changedIssue`)" v-if="job.spec.source==='runtime'">
                      <el-select
                        v-model="job.pickedTargets"
                        filterable
                        multiple
                        @change="handleIssueChange"
                        placeholder="请选择"
                        remote
                        :loading="loading"
                        :remote-method="(query)=>{searchIssues(query,job)}"
                        value-key="key"
                        style="width: 220px;"
                      >
                        <el-option
                          v-for="item in projectIssues"
                          :key="item.key"
                          :label="`${item.key} ${$utils.tailCut(item.name,100)}`"
                          :value="item"
                        >
                        <el-tag effect="plain" type="info" size="mini">{{item.key}}</el-tag>
                        <span>{{$utils.tailCut(item.name,100)}}</span>
                        </el-option>
                      </el-select>
                    </el-form-item>
                  </div>
                </el-collapse-item>
            </template>
          </div>
        </div>
      </el-collapse>
      <el-button
        @click="runTask"
        :loading="startTaskLoading"
        type="primary"
        size="small"
        class="mg-t16"
      >{{ startTaskLoading?$t(`workflow.starting`):$t(`workflow.run`) }}</el-button>
      <el-tooltip effect="dark" placement="top">
        <div slot="content">
          {{$t(`global.enterprisefeaturesReferforDetails`)}}
          <el-link
            style="font-size: 13px; vertical-align: baseline;"
            type="primary"
            :href="`https://docs.koderover.com/project/common-workflow/#调试`"
            :underline="false"
            target="_blank"
          >{{$t(`global.document`)}}</el-link>
        </div>
        <span style="margin-left: 4px;">
          <el-button
            type="primary"
            size="small"
            class="mg-t16"
            plain
            disabled
          >{{ $t(`workflow.debug`) }}</el-button>
        </span>
      </el-tooltip>
    </el-form>
  </div>
</template>
<script>
import CustomWorkflowBuildRows from '@/components/common/customWorkflowBuildRows.vue'
import CustomWorkflowCommonRows from '@/components/common/customWorkflowCommonRows.vue'
import VarBranchSelect from './varBranchSelect.vue'
import CustomWorkflowDeployConfig from '@/components/common/customWorkflowDeployConfig.vue'
import CustomWorkflowTestRows from '@/components/common/customWorkflowTestRows.vue'
import {
  listProductAPI,
  getAllBranchInfoAPI,
  runCustomWorkflowTaskAPI,
  imagesAPI,
  getCustomWorkfloweTaskPresetAPI,
  getRegistryWhenBuildAPI,
  getAssociatedBuildsAPI,
  searchIssueAPI,
  searchJqlIssueAPI,
  getFilterEnvServicesAPI,
  getTestEnvServiceListAPI
} from '@api'
import { keyBy, orderBy, cloneDeep, intersectionWith } from 'lodash'

const validatePhone = (rule, value, callback) => {
  if (value === '') {
    callback(new Error('请填写手机号'))
  } else {
    if (
      !/^(13[0-9]|14[01456879]|15[0-35-9]|16[2567]|17[0-8]|18[0-9]|19[0-35-9])\d{8}$/.test(
        value
      )
    ) {
      callback(new Error('请输入正确的手机号码'))
    } else {
      callback()
    }
  }
}

export default {
  data () {
    return {
      validatePhone,
      registry_id: '',
      currentProjectEnvs: [],
      dockerList: [],
      startTaskLoading: false,
      activeName: ['env'],
      payload: {
        workflow_name: '',
        stages: [
          {
            name: '',
            jobs: []
          }
        ]
      },
      originServiceAndBuilds: [],
      isShowParams: true,
      disImageFromBuildJobInfo: {},
      userInfo: {
        phone: ''
      },
      projectIssues: [],
      loading: false,
      originServices: [],
      deployFromJobName: '',
      deployJobName: '',
      deployFromOtherJobInfo: '',
      originServiceAndTest: [],
      requestedServices: new Set(),
      filterEnvServicesRequestCache: {},
      mseTags: [],
      mseOfflineServices: []
    }
  },
  props: {
    workflowName: {
      type: String,
      default: ''
    },
    displayName: {
      type: String,
      default: ''
    },
    projectName: {
      type: String,
      default: ''
    },
    cloneWorkflow: {
      type: Object,
      default: () => ({})
    }
  },
  components: {
    CustomWorkflowBuildRows,
    CustomWorkflowCommonRows,
    CustomWorkflowDeployConfig,
    CustomWorkflowTestRows,
    VarBranchSelect
  },
  computed: {
    allJobList () {
      const jobs = []
      this.payload.stages.forEach(stage => {
        jobs.push(stage.jobs)
      })
      return jobs.flat()
    },
    deployType () {
      const project = this.$store.getters.projectList.find(
        project => project.name === this.projectName
      )
      return project ? project.deployType : ''
    }
  },
  created () {
    this.init()
  },
  methods: {
    selectJobName (name, curJob) {
      if (curJob.run_policy === 'force_run') {
        return
      }
      this.payload.stages.forEach((stage, stageIndex) => {
        stage.jobs.forEach((job, jobIndex) => {
          if (job.name === name) {
            if (job.skipped) {
              job.skipped = false
              this.activeName.push(`${stageIndex}${jobIndex}`)
            } else {
              this.activeName = this.activeName.filter(item => {
                return item !== `${stageIndex}${jobIndex}`
              })
              job.skipped = true
              job.run_policy = ''
            }
          }
        })
      })
    },
    init () {
      this.getRegistryWhenBuild()
      this.getServiceAndBuildList()
      if (Object.keys(this.cloneWorkflow).length > 0) {
        this.cloneWorkflow.stages.forEach(stage => {
          stage.jobs.forEach(job => {
            if (
              job.spec.service_and_builds &&
              job.spec.service_and_builds.length > 0
            ) {
              job.pickedTargets = job.spec.service_and_builds
              job.pickedTargets.forEach(build => {
                this.getRepoInfo(build.repos)
              })
            }
            if (job.type === 'zadig-distribute-image') {
              if (job.spec.source === 'runtime') {
                this.$set(job, 'pickedTargets', job.spec.targets)
              } else {
                this.disImageFromBuildJobInfo.pickedTargets = cloneDeep(
                  job.spec.targets
                )
              }
            }
            if (job.type === 'zadig-deploy') {
              // Mapping for value-key
              if (
                job.spec &&
                  job.spec.service_and_images &&
                  job.spec.service_and_images.length > 0
              ) {
                job.spec.service_and_images.forEach(service => {
                  service.value = `${service.service_name}/${service.service_module}`
                })
              }
            }
          })
        })
        this.payload = cloneDeep(this.cloneWorkflow)
        this.handleEnv()
      } else {
        this.getWorkflowPresetInfo(this.workflowName)
      }
    },
    handleEnv () {
      this.payload.params.forEach(item => {
        if (item.value.includes('<+fixed>') || item.value.includes('{{')) {
          item.isShow = false
        } else {
          item.isShow = true
        }
        const len = this.payload.params.filter(item => item.isShow)
        this.isShowParams = len.length !== 0
      })
      this.payload.stages.forEach((stage, stageIndex) => {
        stage.jobs.forEach((job, jobIndex) => {
          if (job.run_policy !== 'default_not_run') {
            this.activeName.push(`${stageIndex}${jobIndex}`)
          }
          if (!job.pickedTargets) {
            this.$set(job, 'pickedTargets', [])
          }
          if (job.type === 'custom-deploy') {
            job.spec.targets.forEach(item => {
              item.service = item.image_name
            })
            this.$set(job, 'pickedTargets', job.spec.target)
            this.handleContainerChange(job.pickedTargets, job)
          }
          if (job.spec && job.spec.service_and_builds) {
            job.spec.service_and_builds.forEach(service => {
              this.getRepoInfo(service.repos)
              service.key_vals.forEach(item => {
                if (
                  item.value.includes('<+fixed>') ||
                  item.value.includes('{{')
                ) {
                  item.isShow = false
                } else {
                  item.isShow = true
                }
              })
              service.value = `${service.service_name}/${service.service_module}`
            })
            // 如果只有一个组件 默认选上
            if (job.spec.service_and_builds.length === 1) {
              job.pickedTargets = job.spec.service_and_builds
            }
            this.handleServiceBuildChange(job.pickedTargets, job, 'zadig-build')
          }
          if (job.type === 'zadig-deploy') {
            if (job.spec.env.includes('fixed')) {
              job.spec.envTypes = 'fixed'
              if (job.spec.env.replaceAll) {
                job.spec.env = job.spec.env.replaceAll('<+fixed>', '')
              } else {
                job.spec.env = job.spec.env.replace(/\<\+fixed\>/g, '')
              }
            }
            if (job.spec.source === 'runtime') {
              this.$set(job, 'pickedTargets', job.spec.service_and_images)
              setTimeout(() => {
                this.getRegistryId(job.spec.env, job.spec.production)
                this.handleRuntimeServiceChange(job, job.pickedTargets)
                this.getServiceList(job)
              }, 500)
            }
          }
          if (job.type === 'freestyle') {
            job.spec.steps.forEach(step => {
              if (step.type === 'git') {
                this.getRepoInfo(step.spec.repos)
              }
            })
            job.spec.properties.envs.forEach(item => {
              if (
                item.value.includes('<+fixed>') ||
                item.value.includes('{{')
              ) {
                item.isShow = false
              } else {
                item.isShow = true
              }
            })
            // 判断是否展示(固定值和全局变量不展示)一个都没有的话则不展示表头
            const len = job.spec.properties.envs.filter(item => item.isShow)
            job.isShowCommon = len.length !== 0
          }
          if (job.type === 'plugin') {
            job.spec.plugin.inputs.forEach(item => {
              if (
                item.value.includes('<+fixed>') ||
                item.value.includes('{{')
              ) {
                item.isShow = false
              } else {
                item.isShow = true
              }
            })
            const len = job.spec.plugin.inputs.filter(item => item.isShow)
            job.isShowPlugin = len.length !== 0
          }
          if (job.type === 'zadig-test') {
            job.pickedTargets = []
            if (!job.spec.test_type) {
              if (job.spec.test_modules && job.spec.test_modules.length > 0) {
                job.pickedTargets = job.spec.test_modules
                job.spec.test_modules.forEach(service => {
                  if (service.repos && service.repos.length > 0) {
                    this.getRepoInfo(service.repos)
                  }
                  if (service.key_vals && service.key_vals.length > 0) {
                    service.key_vals.forEach(item => {
                      if (
                        item.value.includes('<+fixed>') ||
                        item.value.includes('{{')
                      ) {
                        item.isShow = false
                      } else {
                        item.isShow = true
                      }
                    })
                  }
                })
              }
            } else {
              if (
                job.spec.target_services &&
                job.spec.target_services.length > 0
              ) {
                job.pickedTargets = job.spec.target_services
                job.spec.target_services.forEach(service => {
                  service.value = `${service.service_name}/${service.service_module}`
                })
              }
              if (
                job.spec.service_and_tests &&
                job.spec.service_and_tests.length > 0
              ) {
                job.spec.service_and_tests.forEach(service => {
                  if (service.repos && service.repos.length > 0) {
                    this.getRepoInfo(service.repos)
                  }
                  service.value = `${service.service_name}/${service.service_module}`
                  if (service.key_vals && service.key_vals.length > 0) {
                    service.key_vals.forEach(item => {
                      if (
                        item.value.includes('<+fixed>') ||
                        item.value.includes('{{')
                      ) {
                        item.isShow = false
                      } else {
                        item.isShow = true
                      }
                    })
                  }
                })
              }
            }
            job.spec.originServiceAndTest = job.spec.service_and_tests
            if (job.spec.source === 'runtime') {
              this.handleTestServiceBuildChange(job.pickedTargets, job)
            }
          }
          if (job.type === 'zadig-scanning') {
            job.pickedTargets = job.spec.scannings
            job.spec.scannings.forEach(service => {
              this.getRepoInfo(service.repos)
            })
          }
          if (job.type === 'zadig-distribute-image') {
            if (job.spec.source === 'runtime') {
              job.spec.targets.forEach(service => {
                service.value = `${service.service_name}/${service.service_module}`
              })
              this.registry_id = job.spec.source_registry_id
            } else {
              this.disImageFromBuildJobInfo.pickedTargets = cloneDeep(
                job.spec.targets
              )
            }
          }
          if (job.type === 'workflow-trigger') {
            if (job.spec.trigger_type === 'common') {
              job.spec.service_trigger_workflow.forEach(item => {
                item.value = `${item.service_name}/${item.service_module}`
              })
              if (job.spec.source === 'runtime') {
                const defaultServiceModules = job.spec.source_service ? job.spec.source_service : []
                if (defaultServiceModules && defaultServiceModules.length > 0) {
                  job.pickedTargets = job.spec.service_trigger_workflow.filter((item) => {
                    return defaultServiceModules.some((defaultServiceModule) => {
                      return defaultServiceModule.service_name === item.service_name &&
                        defaultServiceModule.service_module === item.service_module
                    })
                  })
                }
              } else if (job.spec.source === 'fromjob') {
                this.payload.stages.forEach((originStage) => {
                  originStage.jobs.forEach((originJob) => {
                    if (originJob.name === job.spec.source_job_name) {
                      const originJobServiceModules = originJob.pickedTargets.map((item) => {
                        return {
                          service_name: item.service_name,
                          service_module: item.service_module
                        }
                      })
                      job.pickedTargets = job.spec.service_trigger_workflow.filter((item) => {
                        return originJobServiceModules.some((originJobServiceModule) => {
                          return originJobServiceModule.service_name === item.service_name &&
                          originJobServiceModule.service_module === item.service_module
                        })
                      })
                    }
                  })
                })
              }
            }
            if (job.spec.trigger_type === 'fixed') {
              job.pickedTargets = cloneDeep(job.spec.fixed_workflow_list)
            }
          }
        })
      })
      this.getEnvList()
    },
    getWorkflowPresetInfo (workflowName) {
      // const key = this.$utils.rsaEncrypt()
      getCustomWorkfloweTaskPresetAPI(workflowName, this.projectName).then(
        res => {
          res.stages.forEach(stage => {
            stage.jobs.forEach(job => {
              if (job.type === 'zadig-deploy') {
                // Mapping for value-key
                if (
                  job.spec &&
                  job.spec.service_and_images &&
                  job.spec.service_and_images.length > 0
                ) {
                  job.spec.service_and_images.forEach(service => {
                    service.value = `${service.service_name}/${service.service_module}`
                  })
                }
              }
            })
          })
          this.payload = res
          this.handleEnv()
        }
      )
    },
    searchIssues (keyword = '', job) {
      this.loading = true
      const { project_id, query_type, issue_type, jql } = job.spec
      if (!project_id) return
      if (query_type === 'advanced') {
        searchJqlIssueAPI(project_id, jql, keyword).then(res => {
          this.projectIssues = res.map(item => {
            return {
              key: item.key,
              name: item.fields.summary
            }
          })
          this.loading = false
        }, () => {
          this.loading = false
        })
      } else {
        searchIssueAPI(project_id, issue_type, keyword).then(res => {
          this.projectIssues = res.map(item => {
            return {
              key: item.key,
              name: item.fields.summary
            }
          })
          this.loading = false
        }, () => {
          this.loading = false
        })
      }
    },
    handleIssueChange (val) {
      this.$forceUpdate()
    },
    getEnvList () {
      const projectName = this.projectName
      listProductAPI(projectName).then(res => {
        // Sort by environment type first, then by name
        this.currentProjectEnvs = orderBy(
          res,
          ['production', 'name'],
          ['asc', 'asc']
        ).filter(re => !re.production)
      })
    },
    getRegistryWhenBuild () {
      const projectName = this.projectName
      getRegistryWhenBuildAPI(projectName).then(res => {
        this.dockerList = res
      })
    },
    async getRepoInfo (originRepos) {
      if (!originRepos || originRepos.length === 0) return
      const reposQuery = originRepos.filter(re => re.source_from !== 'param').map(re => {
        return {
          source: re.source,
          repo_owner: re.repo_owner,
          repo: re.repo_name,
          default_branch: re.branch,
          codehost_id: re.codehost_id,
          repo_namespace: re.repo_namespace,
          filter_regexp: re.filter_regexp
        }
      })
      const payload = { infos: reposQuery }
      // b = branch, p = pr, t = tag
      const res = await getAllBranchInfoAPI(payload)
      // make these repo info more friendly
      res.forEach(repo => {
        if (repo.prs) {
          repo.prs.forEach(element => {
            element.pr = element.id
          })
          repo.branchPRsMap = this.$utils.arrayToMapOfArrays(
            repo.prs,
            'targetBranch'
          )
        } else {
          repo.branchPRsMap = {}
        }
        if (repo.branches) {
          repo.branchNames = repo.branches.map(b => b.name)
        } else {
          repo.branchNames = []
        }
      })

      const repoInfoMap = keyBy(res, repo => {
        return `${repo.repo_owner}/${repo.repo}`
      })
      for (const repo of originRepos) {
        this.$set(repo, '_id_', `${repo.repo_owner}/${repo.repo_name}`)
        const repoInfo = repoInfoMap[repo._id_]
        this.$set(repo, 'branchNames', repoInfo && repoInfo.branchNames)
        this.$set(repo, 'branchPRsMap', repoInfo && repoInfo.branchPRsMap)
        this.$set(repo, 'tags', repoInfo && repoInfo.tags ? repoInfo.tags : [])
        this.$set(repo, 'prNumberPropName', 'pr')
        if (repoInfo) {
          this.$set(repo, 'errorMsg', repoInfo.error_msg || '')
        }
        this.$set(repo, 'branch', repo.branch || '')
        this.$set(
          repo,
          repo.prNumberPropName,
          repo[repo.prNumberPropName] || null
        )
        this.$set(repo, 'tag', repo.tag || '')
        let branchOrTag = null
        if (repo.branch) {
          branchOrTag = {
            type: 'branch',
            id: `branch-${repo.branch}`,
            name: repo.branch
          }
        } else if (repo.tag) {
          branchOrTag = {
            type: 'tag',
            id: `tag-${repo.tag}`,
            name: repo.tag
          }
        }
        this.$set(repo, 'branchOrTag', branchOrTag)
        this.$set(repo, 'branchAndTagList', [
          {
            label: 'Branches',
            options: (repo.branchNames || []).map(name => {
              return {
                type: 'branch',
                id: `branch-${name}`,
                name
              }
            })
          },
          {
            label: 'Tags',
            options: (repo.tags || []).map(tag => {
              return {
                type: 'tag',
                id: `tag-${tag.name}`,
                name: tag.name
              }
            })
          }
        ])
      }
    },
    runTask (status = 'run') {
      // 数据处理
      const payload = cloneDeep(this.payload)
      payload.stages.forEach(stage => {
        stage.jobs.forEach(job => {
          if (job.type === 'zadig-build') {
            if (
              job.spec.service_and_builds &&
              job.spec.service_and_builds.length > 0
            ) {
              job.spec.service_and_builds = job.pickedTargets
              job.spec.service_and_builds.forEach(item => {
                if (item.repos) {
                  item.repos.forEach(repo => {
                    if (typeof repo.prs === 'string') {
                      repo.prs = repo.prs.split(',').map(Number)
                    }
                    if (repo.branchOrTag) {
                      if (repo.branchOrTag.type === 'branch') {
                        repo.branch = repo.branchOrTag.name
                      }
                      if (repo.branchOrTag.type === 'tag') {
                        repo.tag = repo.branchOrTag.name
                      }
                    }
                  })
                }
              })
              delete job.pickedTargets
            }
          }
          if (job.type === 'freestyle') {
            job.spec.steps.forEach(step => {
              if (step.type === 'git') {
                step.spec.repos.forEach(repo => {
                  if (typeof repo.prs === 'string') {
                    repo.prs = repo.prs.split(',').map(Number)
                  }
                  if (repo.branchOrTag) {
                    if (repo.branchOrTag.type === 'branch') {
                      repo.branch = repo.branchOrTag.name
                    }
                    if (repo.branchOrTag.type === 'tag') {
                      repo.tag = repo.branchOrTag.name
                    }
                  }
                })
              }
            })
          }
          if (job.type === 'zadig-deploy') {
            if (job.spec.source === 'runtime') {
              const serviceAndImages = []
              job.spec.services.forEach(service => {
                delete service.isExpand
                if (service.service_and_images && service.service_and_images.length > 0) {
                  service.service_and_images.forEach(image => {
                    delete image.images
                    serviceAndImages.push(image)
                  })
                  delete service.service_and_images
                }
                if (service.updatable && service.update_config) {
                  service.key_vals = service.latest_key_vals
                }
              })
              job.spec.service_and_images = serviceAndImages
              if (!job.spec.deploy_contents.includes('image')) {
                job.spec.service_and_images = job.pickedTargets
                job.spec.service_and_images.forEach(item => {
                  delete item.images
                })
              }
              delete job.pickedTargets
            } else {
              const serviceAndImages = []
              if (job.originPickedTargets && job.originPickedTargets.length > 0) {
                job.originPickedTargets.forEach(service => {
                  delete service.isExpand
                  if (service.service_and_images && service.service_and_images.length > 0) {
                    service.service_and_images.forEach(image => {
                      serviceAndImages.push(image)
                    })
                    delete service.service_and_images
                  }
                  if (service.updatable && service.update_config) {
                    service.key_vals = service.latest_key_vals
                  }
                })
              }
              job.spec.service_and_images = serviceAndImages
              job.spec.services = job.originPickedTargets
              delete job.originPickedTargets
            }
          }
          if (job.type === 'custom-deploy' && job.spec.source === 'runtime') {
            job.spec.targets = cloneDeep(job.pickedTargets)
            delete job.pickedTargets
          }
          if (job.type === 'zadig-test') {
            if (job.spec.test_type === 'service_test') {
              if (job.spec.source === 'fromjob') {
                job.spec.service_and_tests = job.spec.fromJobInfo
              } else {
                job.spec.target_services = job.pickedTargets
              }
            } else {
              job.spec.test_modules = job.pickedTargets
            }
            if (job.spec.test_modules && job.spec.test_modules.length > 0) {
              job.spec.test_modules.forEach(item => {
                if (item.repos) {
                  item.repos.forEach(repo => {
                    if (typeof repo.prs === 'string') {
                      repo.prs = repo.prs.split(',').map(Number)
                    }
                    if (repo.branchOrTag) {
                      if (repo.branchOrTag.type === 'branch') {
                        repo.branch = repo.branchOrTag.name
                      }
                      if (repo.branchOrTag.type === 'tag') {
                        repo.tag = repo.branchOrTag.name
                      }
                    }
                  })
                }
              })
            }
            delete job.pickedTargets
          }
          if (job.type === 'zadig-scanning') {
            job.spec.scannings = cloneDeep(job.pickedTargets)
            if (job.spec.scannings && job.spec.scannings.length > 0) {
              job.spec.scannings.forEach(item => {
                if (item.repos) {
                  item.repos.forEach(repo => {
                    if (typeof repo.prs === 'string') {
                      repo.prs = repo.prs.split(',').map(Number)
                    }
                    if (repo.branchOrTag) {
                      if (repo.branchOrTag.type === 'branch') {
                        repo.branch = repo.branchOrTag.name
                      }
                      if (repo.branchOrTag.type === 'tag') {
                        repo.tag = repo.branchOrTag.name
                      }
                    }
                  })
                }
              })
            }
            delete job.pickedTargets
          }
          if (job.type === 'zadig-distribute-image') {
            if (job.spec.source === 'runtime') {
              job.spec.targets = cloneDeep(job.pickedTargets)
              job.spec.targets.forEach(item => {
                delete item.images
              })
              delete job.pickedTargets
            } else {
              // fromjob
              if (
                this.disImageFromBuildJobInfo.pickedTargets &&
                this.disImageFromBuildJobInfo.pickedTargets.length > 0
              ) {
                this.disImageFromBuildJobInfo.pickedTargets.forEach(item => {
                  if (item.update_tag && !item.target_tag) {
                    this.$message.error(
                      this.$t(`workflow.inputTargetImage`, {
                        serviceName: item.service_name
                      })
                    )
                    throw Error()
                  }
                })
                job.spec.targets = this.disImageFromBuildJobInfo.pickedTargets
                job.spec.targets = job.spec.targets.map(item => {
                  return {
                    service_name: item.service_name,
                    service_module: item.service_module,
                    source_tag: item.source_tag,
                    target_tag: item.target_tag,
                    update_tag: item.update_tag
                  }
                })
              }
            }
          }
        })
      })
      payload.debug = status === 'debug'
      this.startTaskLoading = true
      runCustomWorkflowTaskAPI(payload, this.projectName)
        .then(res => {
          const taskId = res.task_id || 1
          this.$message.success('创建成功')
          this.$emit('success')
          this.$router.push(
            `/v1/projects/detail/${this.projectName}/pipelines/custom/${this.payload.name}/${taskId}?status=running&display_name=${this.displayName}`
          )
        })
        .catch(error => {
          this.$message({
            message: error.message,
            type: 'warning',
            dangerouslyUseHTMLString: true,
            duration: 5000
          })
        })
        .finally(() => {
          this.startTaskLoading = false
        })
    },
    getRegistryId (val, type) {
      if (val) {
        const envList = this.currentProjectEnvs
        const res = envList.find(item => {
          return item.name === val
        })
        this.registry_id = res ? res.registry_id : ''
      }
    },
    getRegistryList (name, id, item) {
      return imagesAPI(name, id).then(res => {
        return res
      })
    },
    handleServiceDeployChange (val, job, type) {
      if (!this.registry_id) return
      val.forEach(item => {
        this.getRegistryList([item.image_name], job.spec.source_registry_id).then(
          res => {
            this.$set(item, 'images', res)
          }
        )
      })
      this.handleServiceBuildChange(val, job, type)
      this.$forceUpdate()
    },
    handleRuntimeServiceChange (job, val) {
      this.getFilterEnvServices(job, val)
      if (!this.registry_id) return
      const serviceImages = {}
      job.spec.services.forEach(service => {
        (service.service_and_images || []).forEach(svcImg => {
          serviceImages[svcImg.value] = svcImg.image
        })
      })
      job.pickedTargets.forEach(item => {
        this.getRegistryList([item.image_name], this.registry_id).then(
          res => {
            this.$set(item, 'images', res)
            if (serviceImages[item.value]) {
              this.$set(item, 'image', serviceImages[item.value])
            }
          }
        )
      })
      this.$forceUpdate()
    },
    handleServiceBuildChange (services, job, type) {
      this.disImageFromBuildJobInfo = cloneDeep(job)
      const jobs = []
      let res = []
      this.payload.stages.forEach(stage => {
        jobs.push(...stage.jobs)
      })
      res = jobs.filter(item => job.name === item.spec.job_name && item.type === 'zadig-deploy' && item.spec.source !== 'runtime')
      res.forEach(job => this.getFilterEnvServices(job, services, type))
      if (type === 'zadig-build') {
        services.forEach(service => {
          if (!this.requestedServices.has(service)) {
            this.requestedServices.add(service)
            this.getRepoInfo(service.repos)
          }
        })
      }
      this.$forceUpdate()
    },
    handleTestServiceBuildChange (services, job) {
      const res = intersectionWith(job.spec.originServiceAndTest, services, (a, b) => `${a.service_module}(${a.service_name})` === `${b.service_module}(${b.service_name})`)
      res.forEach(service => {
        this.getRepoInfo(service.repos)
      })
      job.spec.service_and_tests = res
      this.$forceUpdate()
    },
    handleContainerChange (val, job) {
      if (!val || val.length === 0) return
      val.forEach(item => {
        this.getRegistryList(
          [item.image_name || item.service],
          job.spec.docker_registry_id
        ).then(res => {
          this.$set(item, 'images', res)
          this.$forceUpdate()
        })
      })
      this.$forceUpdate()
    },
    handleK8sServiceChange (val, job) {
      val.forEach(item => {
        this.getRegistryList(
          [item.container_name || item.image_name],
          job.spec.docker_registry_id
        ).then(res => {
          this.$set(item, 'images', res)
          this.$forceUpdate()
        })
      })
      this.$forceUpdate()
    },
    handleImageChange (job) {
      this.handleContainerChange(job.pickedTargets, job)
    },
    handleCurImageChange () {
      this.$forceUpdate()
    },
    handleResourceChange (val, job) {
      job.pickedTargets = val
      this.$forceUpdate()
    },
    handleStrategyChange (val) {
      this.$forceUpdate()
    },
    handleCommand (val, item) {
      this.$set(item, 'patch_strategy', val)
      this.$forceUpdate()
    },
    getServiceAndBuildList () {
      const projectName = this.projectName
      getAssociatedBuildsAPI(projectName, true).then(res => {
        res.forEach(item => {
          item.value = `${item.service_name}/${item.service_module}`
        })
        this.originServiceAndBuilds = res
      })
    },
    applyAllImage (allTags, curTag) {
      allTags.forEach(item => {
        this.$set(item, 'target_tag', curTag)
      })
    },
    handleSourceTagChange (row) {
      if (!row.target_tag) {
        this.$set(row, 'target_tag', row.source_tag)
      }
    },
    handleSwitchChange (val, stageIndex, jobIndex) {
      if (val) {
        this.activeName = this.activeName.filter(item => {
          return item !== `${stageIndex}${jobIndex}`
        })
      } else {
        this.activeName.push(`${stageIndex}${jobIndex}`)
      }
    },
    getComputedDeployFromOtherJobInfo (val) {
      this.deployFromOtherJobInfo = val
    },
    handleDeployChange (job, services) {
      if (job.spec.source === 'fromjob') {
        const services = []
        job.spec.services.forEach(item => {
          if (item.service_and_images) {
            services.push(...item.service_and_images)
          }
        })
        this.handleRuntimeServiceChange(job, services)
      } else {
        this.handleRuntimeServiceChange(job, services)
      }
      this.getRegistryId(job.spec.env, job.spec.production)
      this.getServiceList(job)
    },
    getFilterEnvServices (job, services, type) {
      if (!job || !services) return
      let service_names = []
      if (job.spec.source === 'fromjob') {
        service_names = services.length > 0 ? services.map(item => item.service_name) : []
      } else {
        if (job.pickedTargets) {
          service_names = job.pickedTargets.length > 0 ? job.pickedTargets.map(item => item.service_name) : []
        }
      }
      if (job.spec.env && job.spec.env.includes('fixed')) {
        job.spec.envTypes = 'fixed'
        if (job.spec.env.replaceAll) {
          job.spec.env = job.spec.env.replaceAll('<+fixed>', '')
        } else {
          job.spec.env = job.spec.env.replace(/\<\+fixed\>/g, '')
        }
      }
      const payload = {
        workflow_name: this.workflowName,
        job_name: job.name,
        env_name: job.spec.env,
        service_names: Array.from(new Set(service_names))
      }
      getFilterEnvServicesAPI(this.projectName, payload).then(res => {
        // 使用用户修改的变量覆盖最新值
        res = res.map(item => {
          if (this.filterEnvServicesRequestCache[item.service_name]) {
            // item.isExpand = this.filterEnvServicesRequestCache[item.service_name].isExpand
            item.key_vals = this.filterEnvServicesRequestCache[item.service_name].key_vals
            item.latest_key_vals = this.filterEnvServicesRequestCache[item.service_name].latest_key_vals
            item.latest_variable_kvs = this.filterEnvServicesRequestCache[item.service_name].latest_variable_kvs
            item.update_config = this.filterEnvServicesRequestCache[item.service_name].update_config
            item.variable_configs = this.filterEnvServicesRequestCache[item.service_name].variable_configs
            item.variable_kvs = this.filterEnvServicesRequestCache[item.service_name].variable_kvs
            item.variable_yaml = this.filterEnvServicesRequestCache[item.service_name].variable_yaml
          }
          return item
        })
        job.spec.services = res
        if (job.spec.source === 'fromjob') {
          this.$set(job, 'originPickedTargets', job.spec.services)
        } else {
          this.$set(job.spec, 'originServices', job.spec.services)
        }
        this.$nextTick(() => {
          if (this.$refs.deployConfig && this.$refs.deployConfig.length > 0) {
            this.$refs.deployConfig.forEach((ref, index) => {
              if (ref.job && ref.job.name === job.name) {
                ref.handleServices(services, job)
              }
            })
            if (type === 'zadig-distribute-image') {
              job.pickedTargets.forEach(item => {
                this.getRegistryList([item.image_name], this.registry_id).then(
                  res => {
                    this.$set(item, 'images', res)
                  }
                )
              })
            }
          }
        })
        this.$forceUpdate()
      })
    },
    recordServiceVariable (service) {
      this.$set(this.filterEnvServicesRequestCache, service.service_name, service)
    },
    getServiceList (job) {
      if (job.spec.env || job.spec.env_name) {
        this.getTestEnvServiceList(job)
      }
    },
    getTestEnvServiceList (job) {
      // 获取测试环境服务
      const projectName = this.projectName
      const envName = job.spec.env || job.spec.env_name
      getTestEnvServiceListAPI(envName, projectName).then(res => {
        if (job.type === 'zadig-deploy') {
          res.services.forEach(item => {
            item.service_modules.forEach(service_module => {
              service_module.service_name = item.service_name
            })
          })
          job.spec.service_and_images = res.services
            .map(item => {
              item.service_modules.forEach(item => {
                item.service_module = item.name
                item.value = `${item.service_name}/${item.name}`
              })
              return item.service_modules
            })
            .flat()
        }
      })
    }
  }
}
</script>
<style lang="less" scoped>
.custom-workflow {
  .error {
    position: absolute;
    top: -10%;
    left: 50%;
    padding: 4px 8px;
    background: #fde2e2;
    transform: translateX(-50%);
  }

  .font-gray {
    color: @fontLightGray;
  }

  .flex {
    display: flex;
    justify-content: space-between;

    .input {
      width: 220px;
    }
  }

  .meego {
    position: relative;
    margin: 8px 0;
    padding: 8px 8px 0 8px;
    border: 1px solid #ddd;
    border-radius: 4px;

    .add {
      position: absolute;
      bottom: -28px;
      left: 0;
      padding: 4px;
      border-radius: 50%;
      cursor: pointer;
    }

    .del {
      position: absolute;
      top: 10px;
      right: 10px;
      cursor: pointer;
    }
  }

  /deep/.el-collapse {
    background-color: rgba(0, 0, 0, 0.02);
    border: 1px solid #d9d9d9;
    border-bottom: 0;
    border-radius: 8px;

    .el-collapse-item__header {
      padding: 0 8px;
      font-weight: 700;
      background: transparent;
    }

    .el-collapse-item__wrap {
      padding: 8px 0;

      .el-collapse-item__content {
        padding-right: 8px;
        padding-left: 8px;
      }
    }
  }

  .running-jobs-selection {
    margin-bottom: 10px;
    padding: 10px 0;
    border-bottom: 1px solid #ebeef5;

    .dialog-title {
      margin-right: 5px;
      color: #303133;
      font-size: 16px;
      line-height: 24px;
    }

    .run-tag {
      margin-left: 10px;
      color: #aaa;
      background: #fff;
      border-color: #aaa;
      border-radius: 10px;
      cursor: pointer;
      user-select: none;

      &.disabled {
        cursor: not-allowed;
      }

      &:hover {
        color: @themeColor;
        background: #fff;
        border-color: @themeColor;
      }

      &.selected,
      &.selected:hover {
        color: #fff;
        background: @themeColor;
        border-color: @themeColor;
      }
    }
  }
}
</style>
