<template>
  <div class="status-barchart-container">
    <v-chart :options="option" :autoresize="true" @click="clickChart" ref="chartRef" />
  </div>
</template>
<script>
import i18n from '@/lang'
import ECharts from 'vue-echarts'
import 'echarts/lib/component/title'
import 'echarts/lib/component/tooltip'
import 'echarts/lib/component/legend'
import 'echarts/lib/chart/bar'
const colorMap = {
  waitforapprove: '#cdb62c',
  created: '#909399',
  waiting: '#cdb62c',
  running: '#0066ff',
  failed: '#f56c6c',
  passed: '#67c23a',
  timeout: '#e6a23c',
  cancelled: '#909399',
  reject: '#f56c6c',
  approve: '#67c23a'
}
export default {
  data () {
    return {
      option: {
        tooltip: {
          trigger: 'axis',
          appendToBody: true,
          formatter: function (data) {
            if (data[0] && data[0].data && data[0].data.taskId) {
              const taskId = data[0].data.taskId
              const statusFormated = data[0].data.statusFormated
              const creator = data[0].data.creator
              const createTime = data[0].data.createTime
              const durationFormated = data[0].data.durationFormated
              return `
            <div style="font-size:12px">
            <span>#${taskId}</span>
            ${statusFormated}
            <br>
            <span style="display:inline-block;width:50px;">${i18n.t('workflow.executor')}: </span>
            <span>${creator} | ${createTime}</span>
            <br>
            <span style="display:inline-block;width:50px">${i18n.t('workflow.duration')}: </span>
            <span>${durationFormated}</span>
            </div>
            `
            }
          }
        },
        legend: {
          show: false
        },
        xAxis: {
          show: false,
          data: this.xData,
          axisLine: {
            show: true,
            lineStyle: {
              color: '#cccccc'
            }
          }
        },
        yAxis: {
          show: false,
          axisTick: { show: false },
          axisLine: {
            show: false,
            lineStyle: {
              color: '#000000a6'
            }
          },
          axisLabel: {
            interval: 0
          }
        },
        series: [
          {
            name: this.$t('workflowTaskStatus.passed'),
            type: 'bar',
            cursor: 'pointer',
            // barMaxWidth: 10,
            barCategoryGap: '10%',
            data: this.yData,
            showBackground: true,
            // backgroundStyle: {
            //   color: 'rgba(154, 58, 58, 1)'
            // },
            itemStyle: {
              normal: {
                color: function (params) {
                  if (colorMap[params.data.status]) {
                    return colorMap[params.data.status]
                  } else {
                    return '#a0a0a0'
                  }
                }
              }
            }
          }
        ]
      }
    }
  },
  components: {
    'v-chart': ECharts
  },
  props: {
    projectName: {
      required: true,
      type: String
    },
    workflowName: {
      required: true,
      type: String
    },
    displayName: {
      required: true,
      type: String
    },
    type: {
      required: true,
      type: String
    },
    xData: {
      required: true,
      type: Array,
      default () {
        return []
      }
    },
    yData: {
      required: true,
      type: Array,
      default () {
        return []
      }
    }
  },
  methods: {
    clickChart (item) {
      let link = ''
      if (this.type === 'common_workflow') {
        link = `/v1/projects/detail/${this.projectName}/pipelines/custom/${this.workflowName}/${item.data.taskId}?display_name=${this.displayName}`
      } else {
        link = `/v1/projects/detail/${this.projectName}/pipelines/multi/${this.workflowName}/${item.data.taskId}?status=${item.data.status}&display_name=${this.displayName}`
      }
      this.$router.push(link)
    }
  },
  mounted () {
    // this.$nextTick(() => {
    //   this.$refs.chartRef.chart.getZr().on('click', function (event) {
    //   // 该监听器正在监听一个`zrender 事件`。
    //     console.log(event)
    //   })
    // })
  }
}
</script>
<style lang="less">
.status-barchart-container {
  display: flex;
  width: 100%;
  height: 100%;

  .echarts {
    width: 100% !important;
    height: 100% !important;
  }
}
</style>
