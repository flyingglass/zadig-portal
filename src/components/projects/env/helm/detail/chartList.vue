<template>
  <div class="chart-list-container" :style="{width: leftShow ? '250px' : '0'}">
    <div class="chart-list">
      <div class="block-title">
        <span>Chart</span>
        <FilterStatus
          ref="filterStatusRef"
          :filteredItems="filteredItems"
          :defaultFilterList="defaultFilterList"
          :getFilterList="getFilterList"
          @updateFilter="updateFilter"
        />
      </div>
      <div v-for="(chart, index) in filteredReleases" :key="index" class="chart-content" :class="[chart.selected ? 'selected' : '']">
        <span class="chart-left">
          <i v-if="chart.status === 'pending'" class="el-icon-refresh common-icon transition"></i>
        </span>
        <span
          class="chart-middle"
          @click="refreshChartSelected(chart.releaseName);refreshServices([chart.releaseName])"
        >
          <el-tooltip effect="dark" placement="top">
            <div slot="content">
              <div>{{ chart.chart }}</div>
              <div v-if="chart.status === 'failed'" style="margin-top: 5px;">ERROR: {{ chart.error || 'N/A' }}</div>
            </div>
            <div>
              <div class="release-name" :style="{ color: chart.status === 'failed' ? '#f56c6c' : 'inherit'}">
                <span>{{chart.releaseName}}</span>
              </div>
              <div class="chart-name">
                <span>{{ chart.chart }}</span>
              </div>
            </div>
          </el-tooltip>
        </span>
        <span class="chart-right">
          <template v-if="chart.deployStrategy === 'import'">
            <el-tooltip  effect="dark" :content="$t('environments.common.serviceDeployStrategyTip')" placement="top">
              <i class="el-icon-warning-outline common-icon"></i>
            </el-tooltip>
          </template>
          <el-tooltip v-if="chart.updatable" effect="dark" :content="$t('environments.helm.chartListComp.serviceConfigChangedTip')"  placement="top">
            <i class="el-icon-question common-icon"></i>
          </el-tooltip>
          <el-tooltip v-if="checkPermissionSyncMixin({projectName: projectName, action:'manage_environment',resource:{name:envName,type:'env'}})" effect="dark" :content="$t('environments.common.updateService')"  placement="top">
            <i
              class="iconfont icongengxin common-icon pointer"
              :class="[chart.status === 'pending' ? 'disabled' : '']"
              @click="updateChartService(chart, 'update', chart.status === 'pending')"
            ></i>
          </el-tooltip>
          <el-tooltip v-else effect="dark" :content="$t('permission.lackPermission')" placement="top">
            <i class="iconfont icongengxin common-icon pointer disabled"></i>
          </el-tooltip>
          <i class="el-icon-document common-icon pointer" @click="updateChartService(chart, 'value')"></i>
        </span>
      </div>
    </div>
    <div class="arrow-icon" @click="leftShow = !leftShow">
      <i :class="[leftShow ? 'el-icon-arrow-left' : 'el-icon-arrow-right']"></i>
    </div>
    <el-dialog
      :title="$t('environments.helm.chartListComp.updateServiceDialogTitle',{serviceName:`${currentChart.releaseName}(${currentChart.chart})`})"
      :visible.sync="updateDialogVisible"
      width="60%"
      :before-close="dialogBeforeClose"
    >
      <ChartValues
        v-if="updateDialogVisible"
        class="chart-value"
        ref="chartValuesRef"
        :envNames="[envName]"
        :chartNames="currentChart.chartNames"
        :showServicesTab="false"
        :envScene="currentChart.updateServiceTmpl  ? 'updateEnv' : 'updateRenderSet'"
        opeType="update"
      />
      <div v-if="currentChart.showSync" style="margin: 12px 20px;">
        <el-checkbox v-model="currentChart.updateServiceTmpl">{{$t('environments.helm.chartListComp.updateServiceConfigurationCheck')}}</el-checkbox>
      </div>
      <div slot="footer">
        <el-button size="small" @click="dialogBeforeClose()">{{$t(`global.cancel`)}}</el-button>
        <el-button type="primary" size="small" @click="updateChart()">{{$t(`global.confirm`)}}</el-button>
      </div>
    </el-dialog>

    <el-dialog
      :title="$t('environments.helm.chartListComp.updateValuesDialogTitle',{serviceName:currentChart.serviceName})"
      :visible.sync="valuesDialogVisible"
      width="60"
      :before-close="dialogBeforeClose"
    >
      <div>
        <Codemirror class="value-codemirror" ref="codemirror" :value="currentChart.valuesYaml" :cmOption="cmOption" />
      </div>
      <div slot="footer">
        <el-button size="small" @click="dialogBeforeClose()">{{$t(`global.cancel`)}}</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import FilterStatus from '@/components/projects/workflow/productWorkflowTaskDetail/filterStatus.vue'
import ChartValues from '@/components/projects/env/helm/common/updateHelmEnvChart.vue'
import Codemirror from '@/components/projects/common/codemirror.vue'

import {
  getHelmReleaseListAPI,
  updateHelmServiceVarAPI,
  getRunningValuesYamlAPI
} from '@api'
import { cloneDeep, uniqBy } from 'lodash'
export default {
  props: {
    envSource: String,
    fetchAllData: Function,
    isProd: Boolean,
    searchServicesByChart: Function
  },
  data () {
    this.cmOption = {
      readOnly: true,
      lineNumbers: false
    }
    return {
      leftShow: true,
      chartNames: [],
      filteredReleases: [],
      currentChart: {
        serviceName: '',
        releaseName: '',
        chart: '',
        chartNames: [],
        showSync: false,
        updateServiceTmpl: true,
        valuesYaml: ''
      },
      updateDialogVisible: false,
      valuesDialogVisible: false
    }
  },
  computed: {
    projectName () {
      return this.$route.params.project_name
    },
    envName () {
      return this.$route.query.envName
    },
    filteredItems () {
      return [
        {
          value: 'chartName',
          text: this.$t('environments.helm.chartListComp.chartName')
        }, {
          value: 'releaseName',
          text: this.$t('environments.helm.chartListComp.releaseName')
        },
        {
          value: 'status',
          text: this.$t('environments.helm.chartListComp.chartDeployStatus')
        }
      ]
    },
    defaultFilterList () {
      return {
        status: [
          { text: this.$t('environments.helm.chartListComp.deployStatusSuccess'), value: 'deployed' },
          { text: this.$t('environments.helm.chartListComp.deployStatusFailed'), value: 'failed' },
          { text: this.$t('environments.helm.chartListComp.deployStatusPending'), value: 'pending' },
          { text: this.$t('environments.helm.chartListComp.deployStatusNotDeployed'), value: 'notDeployed' }
        ]
      }
    }
  },
  methods: {
    getFilterList ({ type }) {
      return getHelmReleaseListAPI(this.projectName, this.envName)
        .then(res => {
          return uniqBy(res.map(re => {
            if (type === 'chartName') {
              return {
                text: re.chart,
                value: re.chart
              }
            } else if (type === 'releaseName') {
              return {
                text: re.releaseName,
                value: re.releaseName
              }
            } else if (type === 'status') {
              return {
                text: re.status,
                value: re.status
              }
            } else {
              return {
                text: re.serviceName,
                value: re.serviceName
              }
            }
          }), 'value')
        })
        .catch(err => {
          console.log(err)
          return []
        })
    },
    getChartNames (envName = this.envName) {
      this.$refs.filterStatusRef.init()

      this.chartNames = []
      getHelmReleaseListAPI(this.projectName, envName).then(res => {
        this.chartNames = res.map(re => {
          return {
            ...re,
            selected: false,
            chartName: re.chart
          }
        })
        this.filteredReleases = this.chartNames
      })
    },

    updateFilter ({ type, list }) {
      const nameList = list.map(li => li.value || li)
      const chartNames = this.chartNames

      this.filteredReleases = type
        ? chartNames.filter(chart => {
          return nameList.includes(chart[type])
        })
        : chartNames

      this.refreshChartSelected()
      this.refreshServices(
        this.filteredReleases.length !== this.chartNames.length
          ? this.filteredReleases.map(chart => chart.releaseName)
          : ['*']
      )
    },
    refreshChartSelected (serviceName = '') {
      this.filteredReleases.forEach(chart => {
        if (chart.releaseName === serviceName) {
          chart.selected = true
        } else {
          chart.selected = false
        }
      })
    },
    refreshServices (list = []) {
      this.searchServicesByChart(list.join('|'))
    },
    updateChartService (chart, action, disabled) {
      if (disabled) {
        return
      }
      if (action === 'update') {
        this.updateDialogVisible = true
        this.currentChart = {
          ...this.currentChart,
          serviceName: chart.serviceName,
          releaseName: chart.releaseName,
          chart: chart.chart,
          chartNames: [
            {
              serviceName: chart.serviceName,
              chartName: chart.chart,
              isHelmChartDeploy: chart.isHelmChartDeploy,
              releaseName: chart.releaseName,
              type: 'update'
            }
          ],
          showSync: chart.updatable,
          updateServiceTmpl: chart.updatable
        }
      } else if (action === 'value') {
        this.valuesDialogVisible = true
        getRunningValuesYamlAPI(
          this.projectName,
          this.envName,
          chart.serviceName
        ).then(res => {
          this.currentChart = {
            ...this.currentChart,
            serviceName: chart.serviceName,
            releaseName: chart.releaseName,
            chart: chart.chart,
            valuesYaml: res.valuesYaml
          }
        })
      }
    },
    dialogBeforeClose (done) {
      this.updateDialogVisible = false
      this.valuesDialogVisible = false
      this.currentChart = {
        serviceName: '',
        releaseName: '',
        chart: '',
        chartNames: [],
        showSync: false,
        updateServiceTmpl: true,
        valuesYaml: ''
      }
      done && done()
    },
    updateChart () {
      const chartValues = cloneDeep(this.$refs.chartValuesRef.getAllChartNameInfo())
      const payload = {
        chartValues: chartValues.map(chart => {
          if (chart.valuesData && chart.valuesData.gitRepoConfig) {
            chart.valuesData.gitRepoConfig.valuesPaths = chart.valuesData.gitRepoConfig.valuesPaths[0] ? chart.valuesData.gitRepoConfig.valuesPaths : [chart.valuesData.gitRepoConfig.valuesPath]
            if (chart.valuesData.gitRepoConfig.valuesPath) {
              delete chart.valuesData.gitRepoConfig.valuesPath
            }
          }
          return {
            serviceName: chart.serviceName,
            overrideYaml: chart.overrideYaml,
            overrideValues: chart.overrideValues,
            valuesData: chart.valuesData
          }
        }),
        updateServiceTmpl: this.currentChart.updateServiceTmpl
      }
      updateHelmServiceVarAPI(this.projectName, this.envName, payload).then(
        () => {
          this.$message.success(this.$t('environments.helm.chartListComp.chartHasBeenUpdatedSuccessfully', { serviceName: this.currentChart.serviceName }))
          this.fetchAllData()
          this.dialogBeforeClose()
        }
      )
    }
  },
  components: {
    FilterStatus,
    ChartValues,
    Codemirror
  }
}
</script>

<style lang="less" scoped>
.chart-list-container {
  position: relative;
  margin-right: 20px;
  background: white;
  border-top-right-radius: 0;

  .chart-list {
    height: 100%;
    margin: 5px;
    overflow: auto;
    line-height: 22px;

    .block-title {
      display: flex;
      align-items: center;
      margin-bottom: 10px;
      margin-left: 6px;
      color: @projectNameColor;
      font-weight: 300;
    }

    .chart-content {
      display: flex;
      align-items: center;
      line-height: 26px;
      border: 0 solid white;
      border-top-width: 3px;
      border-bottom-width: 3px;
      border-radius: 6px;

      &.selected {
        background: #06f3;
      }

      &:hover {
        background: #f5f7fa;
      }

      .chart-left {
        flex: 0 0 18px;

        .transition {
          @keyframes rotate {
            from {
              transform: rotate(0deg);
            }

            to {
              transform: rotate(359deg);
            }
          }

          animation: rotate 2s linear infinite;
        }
      }

      .chart-middle {
        flex: 1 1 calc(~'100% - 90px');
        overflow: hidden;
        white-space: nowrap;
        text-overflow: ellipsis;
        cursor: pointer;

        .release-name {
          display: flex;
          color: #000;
          font-weight: 400;
        }

        .chart-name {
          display: flex;
          color: #ccc;
        }
      }

      .chart-right {
        flex: 0 0 90px;
        color: @themeColor;
        text-align: right;

        .common-icon {
          margin-right: 4px;
          font-size: 18px;

          &.pointer {
            cursor: pointer;
          }

          &.disabled {
            cursor: not-allowed;
            opacity: 0.5;
          }
        }
      }
    }
  }

  .arrow-icon {
    position: absolute;
    top: 0;
    right: -15px;
    width: 15px;
    height: 40px;
    color: @themeColor;
    line-height: 40px;
    text-align: center;
    text-decoration: none;
    background-color: white;
    border-radius: 0 3px 3px 0;
    cursor: pointer;
  }

  /deep/.el-dialog {
    .el-dialog__header {
      padding: 20px 20px 10px;
      font-size: 16px;
      text-align: center;
      border: 1px solid #d2d2d2;
    }

    .el-dialog__body {
      padding: 20px;

      .chart-value {
        .values {
          border-width: 0;
          box-shadow: initial;
        }
      }

      .value-codemirror {
        height: 300px;
        padding: 5px;
        border: 1px solid #dcdfe6;
        border-radius: 5px;
      }
    }
  }
}
</style>
