<template>
  <div class="test-advanced-config-container">
    <el-form class="secondary-form" :model="scannerConfig" ref="advancedRef" label-width="120px" label-position="left">
      <BuildAdvancedConfig
        :buildConfig="scannerConfig"
        :secondaryProp="`advanced_settings`"
        :validObj="validObj"
        :isCreate="!isEdit"
        @validateFailed="$emit('validateFailed')"
        hiddenCache
      />

      <div class="primary-title not-first-child">{{$t(`scanning.advancedSettings.hooksAndNotification.title`)}}</div>
      <div class="trigger">
        <el-form-item>
          <template slot="label">{{$t(`scanning.advancedSettings.hooksAndNotification.webhookTitle`)}}</template>
          <el-button @click="addTrigger" type="primary" size="small" plain>{{$t(`global.add`)}}</el-button>
        </el-form-item>
        <TestTrigger
          ref="trigger"
          :projectName="projectName"
          :testName="isEdit ? scannerName : scannerConfig.name"
          :webhook="scannerConfig.advanced_settings.hook_ctl"
          :avaliableRepos="scannerConfig.repos"
          :canSwitchBranch="false"
          :class="{ 'margin-bottom': scannerConfig.advanced_settings.hook_ctl.items.length }"
        />
      </div>
      <!-- <div class="timer">
        <el-form-item>
          <template slot="label">定时器触发</template>
          <el-button @click="addTimer" type="primary" size="small" plain>{{$t(`global.add`)}}</el-button>
        </el-form-item>
        <TestTimer
          ref="timer"
          timerType="test"
          :projectName="projectName"
          :testName="isEdit ? scannerName : scannerConfig.name"
          :schedules="scannerConfig.schedules"
          :class="[scannerConfig.schedules.items.length === 0 ? 'hidden-table' : 'margin-bottom']"
        >
          <template v-slot:content="{ orgsObject, indexWork }">
            <div>{{indexWork}}</div>
            <div>{{orgsObject}}</div>
          </template>
        </TestTimer>
      </div>-->

      <div class="notify">
        <el-form-item>
          <template slot="label">
            <span>{{$t(`scanning.advancedSettings.hooksAndNotification.notificationTitle`)}}</span>
            <el-tooltip  effect="dark" placement="top">
              <div slot="content">
                {{$t(`global.enterprisefeaturesReferforDetails`)}}
                <el-link
                  style="font-size: 13px; vertical-align: baseline;"
                  type="primary"
                  href="https://docs.koderover.com/zadig/project/scan/#触发器与通知"
                  :underline="false"
                  target="_blank"
                >{{$t(`global.document`)}}</el-link>
              </div>
              <i class="el-icon-warning"></i>
            </el-tooltip>
          </template>
          <el-button type="primary" size="small" plain disabled>{{$t(`global.add`)}}</el-button>
        </el-form-item>
      </div>
    </el-form>
  </div>
</template>

<script>
import BuildAdvancedConfig from '@/components/projects/build/advancedConfig.vue'
import TestTrigger from '@/components/common/testTrigger.vue'
export default {
  props: {
    scannerConfig: Object,
    allCodeHosts: Array,
    validObj: Object
  },
  computed: {
    projectName () {
      return this.$route.params.project_name
    },
    scannerName () {
      return this.$route.params.scanner_name
    },
    isEdit () {
      return !!this.scannerName
    }
  },
  methods: {
    validate () {
      return Promise.all([
        this.$refs.advancedRef.validate(),
        this.$refs.notifyComp && this.$refs.notifyComp.$refs.notify.validate()
      ])
    },
    addTrigger () {
      this.scannerConfig.repos.forEach(repo => {
        this.allCodeHosts.forEach(codehost => {
          if (repo.codehost_id === codehost.id) {
            repo.source = codehost.type
          }
        })
      })
      this.$refs.trigger.addWebhookBtn()
    },
    addTimer () {
      this.$refs.timer.addTimerBtn()
    }
  },
  components: {
    BuildAdvancedConfig,
    TestTrigger
  }
}
</script>

<style lang="less" scoped>
.test-advanced-config-container {
  /deep/.el-form.secondary-form {
    .export-input {
      margin-right: 10px;

      &.el-input {
        width: calc(~'100% - 100px');
        min-width: 400px;
      }
    }
  }

  .hidden-table {
    /deep/.el-table {
      display: none;
    }
  }

  .margin-bottom {
    margin-bottom: 10px;
  }

  .notify {
    /deep/.el-card.notify-content {
      border-color: @borderGray;
      box-shadow: 0 0 0;

      .el-card__body {
        padding: 10px 20px;

        .notify-container {
          margin: 0;
        }
      }
    }
  }
}
</style>
