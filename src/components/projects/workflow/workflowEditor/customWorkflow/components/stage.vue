<template>
  <div class="stage">
    <el-tooltip effect="dark" :content="stageInfo.name" placement="top">
      <div class="stage-name">{{ $utils.tailCut(stageInfo.name,15) }}</div>
    </el-tooltip>
    <div v-for="(item,index) in stageInfo.jobs" :key="index" @click="setCurIndex(index,item)" class="job" :class="{'active':item.active}">
      <el-tooltip placement="top-start" effect="dark" width="200" trigger="hover" :content="$t(`workflow.jobNotReady`)">
        <div>
          <span class="error el-icon-warning" v-if="item.error"></span>
        </div>
      </el-tooltip>
      <el-tooltip placement="top-start" effect="dark" width="200" trigger="hover" :content="item.name">
        <span>{{item.name}}</span>
      </el-tooltip>
      <div class="del" @click.stop="delJob(item,index)" v-if="isShowJobAddBtn">
        <i class="el-icon-close"></i>
      </div>
    </div>
    <el-drawer
      title="选择任务"
      :visible.sync="isShowJobOperateDialog"
      :modal-append-to-body="false"
      direction="rtl"
      class="drawer"
      size="30%"
      id="drawer"
      :style="{'zoom':scal}"
    >
      <JobOperate @change="setJob" ref="jobOperate" />
    </el-drawer>
    <el-button @click="addJob" v-if="isShowJobAddBtn" size="small" class="add">+ {{$t(`workflow.job`)}}</el-button>
  </div>
</template>

<script>
import JobOperate from './jobOperate.vue'
import { jobType } from '../config'
import { mapState } from 'vuex'

export default {
  name: 'Stage',
  components: {
    JobOperate
  },
  props: {
    value: {
      type: Object,
      default: () => ({})
    },
    workflowInfo: {
      type: Object,
      default: () => ({})
    },
    curStageIndex: {
      type: Number,
      default: 0
    },
    curJobIndex: {
      type: Number,
      default: 0
    },
    isShowJobAddBtn: {
      type: Boolean,
      default: true
    },
    scale: {
      type: String,
      default: ''
    },
    isShowCurJobDrawer: {
      type: Boolean,
      default: false
    },
    stageInfo: {
      type: Object,
      default: () => ({})
    }
  },
  data () {
    return {
      jobType,
      jobInfos: {
        'zadig-build': {
          name: 'default',
          type: 'zadig-build',
          run_policy: '',
          spec: {
            docker_registry_id: '',
            service_and_builds: []
          }
        },
        'zadig-deploy': {
          name: 'default',
          type: 'zadig-deploy',
          run_policy: '',
          spec: {
            env: '',
            production: false,
            deploy_contents: ['image'],
            check_run_status: false,
            source: '',
            job_name: '',
            service_and_images: [],
            services: []
          }
        },
        'custom-deploy': {
          name: 'default',
          type: 'custom-deploy',
          run_policy: '',
          spec: {
            timeout: '60',
            source: 'runtime',
            targets: []
          }
        },
        freestyle: {
          name: 'default',
          type: 'freestyle',
          run_policy: '',
          isCreate: true, // 保存时删掉
          spec: {
            properties: {
              timeout: 60,
              res_req: 'low', // high/medium/low/min/define
              res_req_spec: {
                cpu_limit: 1000,
                memory_limit: 512
              },
              cluster_id: '',
              build_os: 'focal', // 与 image_id 对应
              image_id: '',
              image_from: 'koderover', // custom/koderover
              envs: [],
              cache_enable: true,
              cache_dir_type: 'workspace', // workspace/user_defined
              cache_user_dir: ''
            },
            steps: [
              {
                name: 'tools',
                type: 'tools',
                spec: {
                  installs: [] // name: 'go', version: '1.13'
                }
              },
              {
                name: 'git',
                type: 'git',
                spec: {
                  repos: []
                }
              }
              // 添加步骤时的数据结构，新建时无
              // {
              //   name: 'shell',
              //   type: 'shell',
              //   spec: {
              //     script: '#!/bin/bash\nset -e'
              //   }
              // },
              // {
              //   name: 'archive',
              //   type: 'archive',
              //   spec: {
              //     object_storage_id: 'xxxxxxx',
              //     upload_detail: [] // { file_path: '', dest_path: '' }
              //   }
              // }
            ]
          }
        },
        plugin: {
          type: 'plugin',
          name: 'default',
          run_policy: '',
          isCreate: true,
          description: '',
          properties: {
            timeout: 60,
            res_req: 'low', // high/medium/low/min/define
            res_req_spec: {
              cpu_limit: 1000,
              memory_limit: 512
            },
            cluster_id: ''
          },
          is_offical: true
        },
        'zadig-test': {
          name: 'default',
          type: 'zadig-test',
          run_policy: '',
          spec: {
            test_type: '',
            test_modules: [],
            target_services: [],
            service_and_tests: []
          }
        },
        'zadig-scanning': {
          name: 'default',
          type: 'zadig-scanning',
          run_policy: '',
          spec: {
            scannings: []
          }
        },
        'zadig-distribute-image': {
          name: 'default',
          type: 'zadig-distribute-image',
          run_policy: '',
          isCreate: true,
          spec: {
            source: 'runtime',
            job_name: '',
            source_registry_id: '',
            target_registry_id: '',
            targets: [],
            timeout: 10,
            cluster_id: '',
            enable_target_image_tag_rule: false,
            target_image_tag_rule: ''
          }
        }
      },
      isShowJobOperateDialog: false,
      scal: ''
    }
  },
  computed: {
    JobIndex: {
      get () {
        return this.curJobIndex
      },
      set (val) {
        this.$emit('update:curJobIndex', val)
      }
    },
    ...mapState({
      isShowFooter: state => state.customWorkflow.isShowFooter,
      curOperateType: state => state.customWorkflow.curOperateType
    })
  },
  methods: {
    addJob () {
      this.$store.dispatch('setCurOperateType', 'jobAdd')
      if (this.isShowFooter) {
        this.$message.error(this.$t(`workflow.saveLastJobconfigFirst`))
      } else {
        this.isShowJobOperateDialog = true
      }
    },
    delJob (item, index) {
      this.$confirm(`确定删除任务 [${item.name}]？`, '确认', {
        confirmButtonText: this.$t(`global.confirm`),
        cancelButtonText: this.$t(`global.cancel`),
        type: 'warning'
      }).then(res => {
        this.stageInfo.jobs.splice(index, 1)
        this.$store.dispatch('setIsShowFooter', false)
        this.JobIndex = -2
      })
    },
    setCurIndex (index) {
      this.$store.dispatch('setCurOperateType', 'job')
      this.JobIndex = index
      this.$store.dispatch('setIsShowFooter', true)
      this.$store.dispatch('setIsEditJob', true)
      // job 变化重新计算样式
      this.workflowInfo.stages.forEach((stage, i) => {
        stage.jobs.forEach((job, j) => {
          if (i === this.curStageIndex) {
            if (j === index) {
              job.active = true
            } else {
              job.active = false
            }
          } else {
            job.active = false
          }
        })
        this.$forceUpdate()
      })
    },
    setJob (newVal) {
      if (Object.keys(newVal).length === 0) {
        return
      }
      this.resetActive()
      if (newVal.type === 'plugin') {
        this.$set(newVal, 'active', true)
        this.stageInfo.jobs.push(newVal)
      } else {
        this.$set(this.jobInfos[newVal.type], 'active', true)
        this.stageInfo.jobs.push(this.jobInfos[newVal.type])
      }
      this.JobIndex = this.stageInfo.jobs.length - 1
      this.isShowJobOperateDialog = false
      this.$store.dispatch('setIsShowFooter', true)
    },
    resetActive () {
      this.workflowInfo.stages.forEach((stage, i) => {
        stage.jobs.forEach((job, j) => {
          job.active = false
        })
      })
    }
  },
  watch: {
    scale (val) {
      this.scal = 1 / val
    },
    curStageIndex: {
      handler (newVal) {
        // job 变化重新计算样式
        this.workflowInfo.stages.forEach((stage, i) => {
          stage.jobs.forEach((job, j) => {
            if (i === newVal) {
              if (j === this.curJobIndex) {
                job.active = true
              } else {
                job.active = false
              }
              this.$forceUpdate()
            } else {
              job.active = false
            }
          })
        })
      },
      immediate: true
    },
    isShowFooter: {
      handler (newVal) {
        if (!newVal) {
          this.JobIndex = -1
          this.stageInfo.jobs.forEach((job, i) => {
            job.active = false
          })
          this.$forceUpdate()
        }
      },
      immediate: true
    }
  }
}
</script>

<style lang="less" scoped>
.stage {
  text-align: center;

  .drawer {
    color: #555;
    text-align: left;

    /deep/ .el-drawer.rtl,
    .el-drawer__container {
      top: auto;
      right: 0;
      bottom: 0;
      height: calc(~'100% - 102px') !important;
    }
  }

  &-name {
    margin-right: 12px;
    margin-left: 12px;
    padding-left: -8px;
    overflow: hidden;
    color: #121212;
    font-size: 14px;
    line-height: 24px;
    text-align: left;
    border-bottom: 1px solid @borderGray;
    cursor: pointer;
  }

  .job {
    position: relative;
    width: 7em;
    margin: 8px auto;
    padding: 0 8px;
    overflow: hidden;
    color: #555;
    font-size: 14px;
    line-height: 30px;
    white-space: nowrap;
    text-indent: 7px;
    text-overflow: ellipsis;
    border: 1px solid @borderGray;
    border-radius: 4px;
    cursor: pointer;

    .del {
      position: absolute;
      top: -8px;
      right: 0;
      display: none;
      font-size: 14px;
    }

    &:hover {
      color: #000;
      border: 1px solid #06f;
      box-shadow: 1px 1px 2px 1px rgb(150, 185, 238);

      .del {
        display: block;
      }
    }

    .error {
      position: absolute;
      top: 8px;
      left: -7px;
      color: red;
    }
  }

  .active {
    border: 1px solid #06f;
    box-shadow: 1px 1px 2px 1px rgb(150, 185, 238);
  }

  .add {
    width: 8em;
    margin-top: 8px;
    font-size: 14px;
    border: 2px dotted @borderGray;
  }
}
</style>
