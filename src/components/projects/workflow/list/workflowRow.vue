<template>
  <div class="product-workflow-row">
    <div class="info-container">
      <span class="info-header">
        <div class="status" :class="recentTaskStatus">
          <span v-if="recentTaskStatus === 'passed'|| recentTaskStatus === 'success'" class="el-icon-success"></span>
          <span
            v-else-if="recentTaskStatus === 'failed'||recentTaskStatus === 'failure'||recentTaskStatus === 'timeout'"
            class="el-icon-error"
          ></span>
          <span v-else-if="recentTaskStatus === 'cancelled'||recentTaskStatus === 'terminated'" class="el-icon-warning"></span>
          <span v-else-if="recentTaskStatus === 'running'||recentTaskStatus === 'elected'" class="el-icon-loading"></span>
          <span v-else class="el-icon-warning"></span>
        </div>
        <div class="tag-container">
          <el-tag v-if="workflowInfo.workflow_type === 'common_workflow'" class="workflow-tag" size="mini" effect="plain" type="info">{{$t(`workflow.customWorkflowTag`)}}</el-tag>
          <el-tag v-else class="workflow-tag" size="mini" effect="plain" type="info">{{$t(`workflow.productWorkflowTag`)}}</el-tag>
        </div>

        <div class="stages-container">
          <CusTags :values="stages" noBorder noLimit />
        </div>
      </span>
    </div>
    <div class="detail-container" @click="$router.push(workflowLink)">
      <section class="workflow-header">
        <div class="info-wrap">
          <span @click.stop="setFavorite(projectName,name,type)" class="favorite el-icon-star-on" :class="{'liked':isFavorite}"></span>
          <div class="name-container">
            <div class="workflow-name">
              <router-link :to="workflowLink">
                <el-tooltip effect="dark" placement="top" popper-class="pipeline-name">
                  <div slot="content">
                    <div>{{ $t(`global.name`) }}: {{ displayName }}</div>
                    <div v-if="description">{{ $t(`global.desc`) }}: {{ description }}</div>
                  </div>
                  <span class="name-span">{{ displayName }}</span>
                </el-tooltip>
              </router-link>
            </div>
          </div>
        </div>
      </section>
      <section class="status-barchart" @click.stop>
        <StatusBarChart :projectName="projectName" :workflowName="name" :displayName="displayName" :type="type" :xData="xData" :yData="yData" />
      </section>
      <section class="section-info">
        <div class="gray-desc">{{$t(`workflow.averageExecutionTime`)}}</div>
        <div class="value">{{ avgRuntime || '-' }}</div>
      </section>
      <section class="section-info">
        <div class="gray-desc">{{$t(`workflow.successRate`)}}</div>
        <div class="value">{{ avgSuccessRate || '-' }}</div>
      </section>
      <section class="recent-info">
        <div class="gray-desc">{{$t(`workflow.recentTask`)}}</div>
        <div v-if="workflowInfo.recentTask && workflowInfo.recentTask.taskID" class="value">{{ `${workflowInfo.recentTask.task_creator} ${formateTime(workflowInfo.recentTask.create_time)}` }}</div>
        <div v-else class="value">-</div>
      </section>
      <section class="operations" @click.stop>
        <slot name="operations"></slot>
      </section>
    </div>
  </div>
</template>

<script>
import { setFavoriteAPI, deleteFavoriteAPI } from '@api'
import StatusBarChart from '../common/statusBarChart.vue'
import moment from 'moment'
import { fill } from 'lodash'
export default {
  data () {
    return {}
  },
  props: {
    workflowInfo: {
      type: Object,
      required: true
    },
    projectName: {
      type: String,
      required: true
    },
    type: {
      type: String,
      required: true
    },
    isFavorite: {
      type: Boolean,
      required: true
    },
    name: {
      type: String,
      required: true
    },
    displayName: {
      type: String,
      required: true
    },
    stages: {
      type: Array,
      required: true
    },
    recentTaskStatus: {
      type: String,
      required: true
    },
    updateTime: {
      type: String,
      required: true
    },
    avgRuntime: {
      type: String,
      required: true
    },
    avgSuccessRate: {
      type: String,
      required: false
    },
    description: {
      type: String,
      required: false
    }
  },
  computed: {
    workflowLink () {
      if (this.type === 'common_workflow' || this.type === 'release') {
        return `/v1/projects/detail/${this.projectName}/pipelines/custom/${this.name}?display_name=${this.displayName}`
      } else {
        return `/v1/projects/detail/${this.projectName}/pipelines/multi/${this.name}?display_name=${this.displayName}`
      }
    },
    xData () {
      return [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
    },
    yData () {
      const recentTasks = this.workflowInfo.recentTasks ? this.workflowInfo.recentTasks : []
      const formatedData = recentTasks.map((item) => {
        const now = Math.floor(Date.now() / 1000)
        const value = item.status === 'running' ? now - item.start_time : item.end_time - item.start_time
        const statusFormated = `<span class="el-tag el-tag--${this.$utils.taskElTagType(item.status)} el-tag--mini el-tag--dark">${this.$t(`workflowTaskStatus.${item.status}`)}</span>`
        const createTime = moment.unix(item.create_time).format('MM-DD HH:mm')
        const durationFormated = item.status === 'running' ? (now - item.start_time) + 's' : this.$utils.timeFormatEn(item.end_time - item.start_time)
        return { value: value, taskId: item.taskID, status: item.status, statusFormated: statusFormated, creator: item.task_creator, createTime: createTime, duration: 400, durationFormated: durationFormated }
      })
      const initArray = fill(Array(10), { value: 0 })
      const yData = initArray.splice(formatedData.length).concat(formatedData.reverse())
      return yData
    }
  },
  methods: {
    setFavorite (projectName, workflowName, type) {
      const curType = (type === 'common_workflow' || type === 'release') ? 'workflow_v4' : type
      const payload = {
        product_name: projectName,
        name: workflowName,
        type: type === 'common_workflow' ? 'workflow_v4' : type
      }
      if (this.isFavorite) {
        deleteFavoriteAPI(projectName, workflowName, curType).then(res => {
          this.$emit('refreshWorkflow', this.projectName)
          this.$message({
            type: 'success',
            message: this.$t(`workflow.cancelFavoriteSuccess`)
          })
        })
      } else {
        setFavoriteAPI(payload).then(res => {
          this.$emit('refreshWorkflow', this.projectName)
          this.$message({
            type: 'success',
            message: this.$t(`workflow.addFavoriteSuccess`)
          })
        })
      }
    },
    formateTime (time) {
      return moment.unix(time).format('MM-DD HH:mm')
    }
  },
  components: {
    StatusBarChart
  }
}
</script>

<style lang="less">
.product-workflow-row {
  display: flex;
  flex-direction: column;

  .info-container {
    display: flex;
    align-items: center;
    justify-content: flex-start;

    .info-header {
      display: inline-flex;
      align-items: center;
      padding: 6px 8px;
      background-color: #fff;
      border-radius: 6px 6px 0 0;

      .status {
        display: flex;
        color: #77797d;

        &.running,
        &.elected {
          color: @themeColor;
          animation: blink 1.5s infinite;
        }

        &.passed,
        &.success {
          color: #67c23a;
        }

        &.failed,
        &.failure,
        &.timeout {
          color: #ff1949;
        }

        &.cancelled,
        &.terminated {
          color: #77797d;
        }
      }

      .tag-container {
        width: 48px;
        margin-left: 10px;
      }

      .stages-container {
        display: flex;
      }
    }
  }

  .detail-container {
    display: flex;
    flex-flow: row nowrap;
    flex-grow: 1;
    align-items: center;
    justify-content: space-between;
    box-sizing: border-box;
    width: 100%;
    height: 70px;
    margin-bottom: 14px;
    font-size: 14px;
    line-height: 22px;
    background: #fff;
    border-left: 0 solid #77797d;
    cursor: pointer;
    transition: all 0.3s;

    &:hover {
      box-shadow: 0 3px 8px rgba(0, 0, 0, 0.1);
    }

    .detail-desc {
      margin-top: 4px;
      color: #4a4a4a;
      font-size: 12px;

      span,
      .icon {
        cursor: auto;
      }
    }

    .gray-desc {
      color: @fontLightGray;
      font-size: 12px;
      line-height: 22px;

      &.workflow-desc {
        display: flex;
        max-width: 300px;
        margin-top: 4px;
        overflow: hidden;
        white-space: nowrap;
        text-overflow: ellipsis;
      }
    }

    .workflow-header {
      flex: 0 0 300px;
      max-width: 300px;

      .info-wrap {
        display: flex;
        align-items: center;

        .favorite {
          display: inline-flex;
          flex: 0 0 8px;
          margin: 0 8px;
          color: @backgroundColor;
          font-size: 20px;
          text-align: center;
          cursor: pointer;

          &.liked,
          &:hover {
            color: @themeColor;
          }
        }

        .name-container {
          display: flex;
          flex-direction: column;

          .workflow-name {
            display: flex;
            align-items: center;

            a {
              display: flex;
              color: @themeColor;
              font-weight: 500;

              .name-span {
                display: inline-block;
                max-width: 220px;
                margin-right: 8px;
                overflow: hidden;
                white-space: nowrap;
                text-overflow: ellipsis;
              }
            }
          }
        }
      }
    }

    .desc {
      flex: 1 0 20%;
      color: @fontLightGray;
      font-size: 13px;
    }

    .section-info {
      flex: 0 0 80px;
      margin-right: 20px;
      white-space: nowrap;

      .value {
        margin-top: 4px;
        color: #4a4a4a;
        line-height: 22px;
      }
    }

    .recent-info {
      flex: 0 0 150px;
      margin-right: 20px;
      white-space: nowrap;

      .value {
        margin-top: 4px;
        color: #4a4a4a;
        line-height: 22px;
        cursor: auto;
      }
    }

    .status-barchart {
      flex: 0 0 180px;
      width: 100%;
      height: 70px;
      white-space: nowrap;
    }

    .operations {
      display: flex;
      flex: 0 0 200px;
      align-items: center;
      justify-content: space-around;
      font-size: 23px;
      cursor: auto;
    }
  }
}

.el-tooltip__popper.is-dark.pipeline-name {
  padding: 8px;
  color: #fff;
  font-size: 12px;
  line-height: 21px;
  background-color: #323232b3;

  &[x-placement^='top'] .popper__arrow {
    border-top-color: #323232b3;

    &::after {
      border-top-color: transparent;
    }
  }
}
</style>
