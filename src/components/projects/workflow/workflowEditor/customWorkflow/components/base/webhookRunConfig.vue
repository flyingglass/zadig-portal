<template>
  <div class="custom-workflow">
    <el-form label-position="left" label-width="130px" size="small">
      <el-collapse v-model="activeName">
        <el-collapse-item title="工作流变量" name="env" class="mg-l8" v-if="payload.params && payload.params.length>0">
          <el-table :data="payload.params.filter(item=>item.isShow)">
            <el-table-column :label="$t(`global.key`)">
              <template slot-scope="scope">{{scope.row.name}}</template>
            </el-table-column>
            <el-table-column :label="$t(`global.value`)">
              <template slot-scope="scope">
                <el-select v-model="scope.row.value" v-if="scope.row.type === 'choice'" size="small" style="width: 220px;">
                  <el-option v-for="(item,index) in scope.row.choice_option" :key="index" :value="item" :label="item">{{item}}</el-option>
                </el-select>
                <el-input
                  v-if="scope.row.type === 'text'"
                  v-model="scope.row.value"
                  size="small"
                  type="textarea"
                  :rows="2"
                  style="width: 220px;"
                ></el-input>
                <el-input
                  v-else-if="scope.row.type === 'string'"
                  class="password"
                  v-model="scope.row.value"
                  size="small"
                  type="text"
                  style="width: 220px;"
                ></el-input>
              <VarBranchSelect v-if="scope.row.type === 'repo'" :originRepo="scope.row.repo" />
              </template>
            </el-table-column>
          </el-table>
        </el-collapse-item>
        <div v-for="(stage,stageIndex) in payload.stages" :key="stage.name">
          <el-collapse-item
            v-for="(job,jobIndex) in stage.jobs"
            :title="`${job.name}`"
            :key="job.name"
            :name="`${stageIndex}${jobIndex}`"
          >
            <template slot="title">
              <!-- <el-checkbox v-model="job.skipped"></el-checkbox> -->
              <el-switch v-model="job.skipped"  @click.stop.native :active-value="false" :inactive-value="true" :disabled="job.run_policy==='force_run'" @change="handleSwitchChange($event, stageIndex, jobIndex)"></el-switch>
              <span class="mg-l8">{{job.name}}</span>
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
                  @change="handleServiceBuildChange($event, job, 'zadig-build')"
                >
                  <el-option
                    disabled
                    :label="$t(`global.selectAll`)"
                    value="ALL"
                    :class="{selected: job.pickedTargets && job.pickedTargets.length === job.spec.service_and_builds.length}"
                    style="color: #606266;"
                  >
                    <span
                      style=" display: inline-block; width: 100%; font-weight: normal; cursor: pointer;"
                      @click="job.pickedTargets=job.spec.service_and_builds;handleServiceBuildChange(job.pickedTargets, job, 'zadig-build')"
                    >{{$t(`global.selectAll`)}}</span>
                  </el-option>
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
                <CustomWorkflowBuildRows :pickedTargets="job.pickedTargets" :elSelectWidth="'140px'" />
              </div>
            </div>
            <div v-if="job.type === 'zadig-deploy'">
              <el-form-item prop="productName" :label="$t(`project.environments`)">
                <el-select
                  v-model="job.spec.env"
                  :disabled="job.spec.envType==='fixed'"
                  size="medium"
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
                  size="medium"
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
              部署内容
              <div>
                <CustomWorkflowDeployConfig :job="job" ref="deployConfig" :fromJobInfo="deployFromJobInfo" :originServices="originServices" :projectName="projectName"  @deployFromOtherJobInfo="getComputedDeployFromOtherJobInfo" @serviceVariableChange="recordServiceVariable" />
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
              <el-form-item :label="$t(`global.serviceModule`)" v-if="job.spec.test_type=== 'service_test'&&job.spec.source==='runtime'">
                <el-select
                  v-model="job.pickedTargets"
                  filterable
                  multiple
                  clearable
                  reserve-keyword
                  value-key="value"
                  size="medium"
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
                    <el-option disabled label="全选" value="ALL" :class="{selected: job.pickedTargets && job.pickedTargets.length === job.spec.targets.length}" style="color: #606266;">
                      <span
                        style=" display: inline-block; width: 100%; font-weight: normal; cursor: pointer;"
                        @click="job.pickedTargets = job.spec.targets"
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
                  <el-table-column :label="$t(`project.services`)">
                    <template slot-scope="scope">{{`${scope.row.service_module}(${scope.row.service_name})`}}</template>
                  </el-table-column>
                  <el-table-column label="原始镜像版本">
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
                  <el-table-column label="目标镜像版本" width="240" v-if="!job.spec.enable_target_image_tag_rule">
                    <template slot-scope="{row,$index}">
                      <div class="flex">
                        <el-input v-model="row.target_tag" placeholder="请输入目标镜像版本" size="small" class="input"></el-input>
                        <el-button v-if="$index===0" size="small" type="text" @click="applyAllImage(job.pickedTargets,row.target_tag)">应用全部</el-button>
                      </div>
                    </template>
                  </el-table-column>
                </el-table>
              </div>
              <div v-else>
                <el-table :data="cloneWorkflow.fromJobInfo.pickedTargets" v-if="cloneWorkflow.fromJobInfo">
                  <el-table-column :label="$t(`project.services`)">
                    <template slot-scope="scope">{{`${scope.row.service_module}(${scope.row.service_name})`}}</template>
                  </el-table-column>
                  <el-table-column label="原始镜像版本">
                    <span style="color: #909399; font-size: 12px; line-height: 33px;">来自前置构建任务</span>
                  </el-table-column>
                  <template v-if="!job.spec.enable_target_image_tag_rule">
                  <el-table-column label="修改版本">
                    <template slot-scope="scope">
                      <el-switch v-model="scope.row.update_tag"></el-switch>
                    </template>
                  </el-table-column>
                  <el-table-column label="目标镜像版本" width="240">
                    <template slot-scope="scope">
                      <div v-if="scope.row.update_tag" class="flex">
                        <el-input v-model="scope.row.target_tag" placeholder="请输入目标镜像版本" size="small" class="input"></el-input>
                        <el-button
                          size="small"
                          type="text"
                          @click="applyAllImage(cloneWorkflow.fromJobInfo.pickedTargets,scope.row.target_tag)"
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
              <el-form-item label="变更的问题" v-if="job.spec.source==='runtime'">
                <el-select
                  v-model="job.pickedTargets"
                  filterable
                  multiple
                  @change="handleIssueChange"
                  remote
                  allow-create
                  :loading="loading"
                  :remote-method="(query)=>{searchIssues(query,job)}"
                  placeholder="请选择"
                  value-key="key"
                  size="small"
                  style="width: 220px;"
                >
                  <el-option v-for="item in projectIssues" :key="item.key" :label="`${item.key} ${item.name}`" :value="item">{{item.key}}/{{item.name}}</el-option>
                </el-select>
              </el-form-item>
              <div v-else class="font-gray">{{$t(`workflow.noNeedToEnterVariables`)}}</div>
            </div>
          </el-collapse-item>
        </div>
      </el-collapse>
    </el-form>
  </div>
</template>

<script>
import CustomWorkflowBuildRows from '@/components/common/customWorkflowBuildRows.vue'
import CustomWorkflowCommonRows from '@/components/common/customWorkflowCommonRows.vue'
import VarBranchSelect from '@/components/projects/workflow/common/varBranchSelect.vue'
import CustomWorkflowDeployConfig from '@/components/common/customWorkflowDeployConfig.vue'
import CustomWorkflowTestRows from '@/components/common/customWorkflowTestRows.vue'
import {
  listProductAPI,
  getAllBranchInfoAPI,
  imagesAPI,
  getRegistryWhenBuildAPI,
  getAssociatedBuildsAPI,
  searchIssueAPI,
  searchJqlIssueAPI,
  getFilterEnvServicesAPI,
  getTestEnvServiceListAPI
} from '@api'
import { keyBy, orderBy, cloneDeep, intersectionWith } from 'lodash'

export default {
  data () {
    return {
      registry_id: '',
      currentProjectEnvs: [],
      productionEnvList: [],
      dockerList: [],
      specificEnv: true,
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
      projectIssues: [],
      loading: false,
      deployFromJobName: '',
      deployJobName: '',
      originServices: [],
      requestedServices: new Set(),
      filterEnvServicesRequestCache: {}
    }
  },
  props: {
    workflowName: {
      type: String,
      required: true,
      default: ''
    },
    projectName: {
      type: String,
      required: true,
      default: ''
    },
    cloneWorkflow: {
      type: Object,
      required: true,
      default: () => ({})
    },
    webhookSelectedRepo: {
      type: Object,
      default: () => ({})
    },
    timerEditMode: {
      type: Boolean,
      required: false
    }
  },
  components: {
    CustomWorkflowBuildRows,
    CustomWorkflowCommonRows,
    VarBranchSelect,
    CustomWorkflowDeployConfig,
    CustomWorkflowTestRows
  },
  computed: {
    deployFromJobInfo () {
      let res = {}
      const jobs = []
      this.payload.stages.forEach(stage => {
        jobs.push(...stage.jobs)
      })
      res = jobs.find(job => this.deployFromJobName === job.name)
      return res
    }
  },
  created () {
    this.init()
  },
  methods: {
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
              if (!this.timerEditMode && job.type === 'zadig-build') {
                this.$set(job, 'pickedTargets', [])
              } else {
                this.$set(job, 'pickedTargets', job.spec.service_and_builds)
              }
              job.spec.service_and_builds.forEach(build => {
                this.getRepoInfo(build.repos)
                build.repos.forEach(repo => {
                  if (
                    repo.codehost_id === this.webhookSelectedRepo.codehost_id &&
                    repo.repo_name === this.webhookSelectedRepo.repo_name &&
                    repo.repo_owner === this.webhookSelectedRepo.repo_owner
                  ) {
                    this.$set(repo, 'showTip', true)
                  }
                })
              })
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
            if (job.type === 'zadig-distribute-image') {
              if (job.spec.source === 'runtime') {
                this.$set(job, 'pickedTargets', job.spec.targets)
              } else {
                // fix undefined fromJobInfo
                if (!this.cloneWorkflow.fromJobInfo) {
                  this.cloneWorkflow.fromJobInfo = cloneDeep(job)
                }
                this.cloneWorkflow.fromJobInfo.pickedTargets = job.spec.targets
              }
            }
          })
        })
        this.$set(this, 'payload', this.cloneWorkflow)
        this.handleEnv()
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
    handleEnv () {
      this.payload.params.forEach(item => {
        if (item.value.includes('fixed') || item.value.includes('{{')) {
          item.isShow = false
        } else {
          item.isShow = true
        }
      })
      this.payload.stages.forEach((stage, stageIndex) => {
        stage.jobs.forEach((job, jobIndex) => {
          if (job.run_policy !== 'default_not_run') {
            this.activeName.push(`${stageIndex}${jobIndex}`)
          }
          if (job.spec && job.spec.service_and_builds) {
            this.cloneWorkflow.fromJobInfo = cloneDeep(job)
            job.spec.service_and_builds.forEach(service => {
              service.key_vals.forEach(item => {
                if (item.value.includes('fixed') || item.value.includes('{{')) {
                  item.isShow = false
                } else {
                  item.isShow = true
                }
              })
              service.value = `${service.service_name}/${service.service_module}`
              service.key_vals.forEach(key => {
                // if (key.is_credential) {
                //   key.value = this.$utils.aesDecrypt(key.value)
                // }
              })
            })
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
              }, 500)
            } else {
              this.deployFromJobName = job.spec.job_name
              this.deployJobName = job.name
            }
          }
          if (job.type === 'custom-deploy') {
            job.spec.targets.forEach(item => {
              item.service = item.target.split('/')[2]
            })
            job.pickedTargets = job.spec.targets
            this.handleContainerChange(job.pickedTargets, job)
          }
          if (job.type === 'freestyle') {
            job.spec.steps.forEach(step => {
              if (step.type === 'git') {
                this.getRepoInfo(step.spec.repos)
              }
            })
            job.spec.properties.envs.forEach(item => {
              if (item.value.includes('fixed') || item.value.includes('{{')) {
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
              if (item.value.includes('fixed') || item.value.includes('{{')) {
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
              this.cloneWorkflow.fromJobInfo.pickedTargets = job.spec.targets
            }
          }
          if (job.type === 'jira') {
            job.pickedTargets = job.spec.issues
            this.searchIssues('', job)
          }
        })
      })
      this.getEnvList()
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
    getRegistryId (val, type) {
      if (val) {
        const envList = type ? this.productionEnvList : this.currentProjectEnvs
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
    },
    handleServiceBuildChange (services, job, type) {
      this.cloneWorkflow.fromJobInfo = cloneDeep(job)
      const jobs = []
      let res = []
      this.payload.stages.forEach(stage => {
        jobs.push(...stage.jobs)
      })
      res = jobs.filter(item => job.name === item.spec.job_name && item.type === 'zadig-deploy')
      res.forEach(job => this.getFilterEnvServices(job, services))
      if (type === 'zadig-build') {
        if (services && services.length > 0) {
          services.forEach(service => {
            if (!this.requestedServices.has(service)) {
              this.requestedServices.add(service)
              this.getRepoInfo(service.repos)
            }
            service.repos.forEach(repo => {
              if (
                repo.codehost_id === this.webhookSelectedRepo.codehost_id &&
                repo.repo_name === this.webhookSelectedRepo.repo_name &&
                repo.repo_owner === this.webhookSelectedRepo.repo_owner
              ) {
                this.$set(repo, 'showTip', true)
              }
            })
          })
        }
      }
      this.$set(job, 'pickedTargets', services)
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
    handleRuntimeServiceChange (job, val) {
      this.getFilterEnvServices(job, val)
      if (!this.registry_id) return
      const serviceImages = {}
      job.spec.services.forEach(service => {
        (service.service_and_images || []).forEach(svcImg => {
          serviceImages[svcImg.value] = svcImg.image
        })
      })
      val.forEach(item => {
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
    getFilterEnvServices (job, services) {
      if (!job || !services || services.length === 0) return
      let service_names = []
      if (job.spec.source === 'fromjob') {
        service_names = services.map(item => item.service_name)
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
          this.$refs.deployConfig[0].handleServices(services, job)
        })
        this.$forceUpdate()
      })
    },
    recordServiceVariable (service) {
      this.$set(this.filterEnvServicesRequestCache, service.service_name, service)
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
    handleContainerChange (val, job) {
      if (!val || val.length === 0) return
      val.forEach(item => {
        this.getRegistryList([item.image_name || item.service], job.spec.docker_registry_id).then(
          res => {
            this.$set(item, 'images', res)
            this.$forceUpdate()
          }
        )
      })
    },
    handleImageChange (job) {
      this.handleContainerChange(job.pickedTargets, job)
    },
    handleCurImageChange () {
      this.$forceUpdate()
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
    getComputedDeployFromOtherJobInfo (val) {
      this.$store.dispatch('setDeployFromOtherJobInfo', val)
    },
    getServiceList (job) {
      if (job.spec.env_name) {
        this.getTestEnvServiceList(job)
      }
    },
    getTestEnvServiceList (job) {
      // 获取测试环境服务
      const projectName = this.projectName
      const envName = job.spec.env_name
      getTestEnvServiceListAPI(envName, projectName).then(res => {
        this.$set(job.spec, 'serviceOptions', res.services.filter((item) => { return item.deployed }))
      })
    }
  },
  watch: {
    webhookSelectedRepo: {
      handler (val) {
        if (val) {
          if (this.payload.stages) {
            this.payload.stages.forEach(stage => {
              if (stage.jobs) {
                stage.jobs.forEach(job => {
                  if (
                    job.type === 'zadig-build' &&
                    job.pickedTargets &&
                    job.pickedTargets.length > 0
                  ) {
                    job.pickedTargets.forEach(build => {
                      if (build.repos) {
                        build.repos.forEach(repo => {
                          if (
                            repo.codehost_id === val.codehost_id &&
                            repo.repo_name === val.repo_name &&
                            repo.repo_owner === val.repo_owner
                          ) {
                            this.$set(repo, 'showTip', true)
                          } else {
                            this.$set(repo, 'showTip', false)
                          }
                        })
                      }
                    })
                  }
                  if (job.type === 'freestyle') {
                    if (
                      job.spec &&
                      job.spec.steps &&
                      job.spec.steps.length > 0
                    ) {
                      job.spec.steps.forEach(step => {
                        if (step.type === 'git') {
                          if (step.spec.repos && step.spec.repos.length > 0) {
                            step.spec.repos.forEach(repo => {
                              if (
                                repo.codehost_id === val.codehost_id &&
                                repo.repo_name === val.repo_name &&
                                repo.repo_owner === val.repo_owner
                              ) {
                                this.$set(repo, 'showTip', true)
                              } else {
                                this.$set(repo, 'showTip', false)
                              }
                            })
                          }
                        }
                      })
                    }
                  }
                })
              }
            })
          }
        }
      },
      immediate: false,
      deep: true
    },
    cloneWorkflow (val) {
      if (val) {
        this.init()
      }
    },
    'deployFromJobInfo.pickedTargets': {
      handler (newVal) {
        const job = {
          name: this.deployJobName,
          type: 'deploy',
          spec: {
            source: 'fromjob'
          },
          pickedTargets: newVal
        }
        this.getFilterEnvServices(job)
      },
      immediate: true,
      deep: true
    }
  }
}
</script>
<style lang="less" scoped>
.custom-workflow {
  .flex {
    display: flex;
    justify-content: space-between;

    .input {
      width: 160px;
    }
  }

  /deep/.el-collapse {
    border-bottom: none;

    .el-collapse-item__header {
      padding: 0 8px;
      background: @globalBackgroundColor;
    }

    .el-collapse-item__wrap {
      padding: 8px 0;
    }

    .el-collapse-item:last-child {
      margin-bottom: 0;

      .el-collapse-item__content {
        padding: 8px;
      }
    }
  }
}
</style>
