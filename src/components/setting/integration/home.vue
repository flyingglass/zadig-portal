<template>
  <div class="integration-home">
    <div class="integration-list">
      <div v-for="(item,index) in list" :key="index" :class="{ 'integration-item':true,'disabled':item.disabled }" @click="redirectToDetail(item)">
        <div class="info">
          <div class="icon">
            <i :class="item.icon"></i>
          </div>
          <div class="detail">
            <div class="name">
              <span>{{item.name}}</span>
              <el-tag v-if="item.disabled" class="tag" size="mini" effect="plain" type="info">企业功能</el-tag>
            </div>
            <div class="desc">
              {{item.desc}}
            </div>
          </div>
        </div>
        <div class="configure">
          <el-button :class="{ 'configure-btn':true,'disabled-btn':item.disabled }" :disabled="item.disabled" plain>{{$t('global.configure')}}</el-button>
        </div>
      </div>
    </div>
  </div>
</template>
<script>
import bus from '@utils/eventBus'
export default {
  name: 'integration',
  computed: {
    list () {
      return [{
        icon: 'iconfont icongeren',
        name: this.$t('sysSetting.integration.accountTab'),
        desc: this.$t('sysSetting.integration.accountTip'),
        link: '/v1/system/integration/account'
      },
      {
        icon: 'iconfont iconvery-project',
        name: this.$t('sysSetting.integration.projectTab'),
        desc: this.$t('sysSetting.integration.projectTip'),
        link: '/v1/system/integration/project'
      }, {
        icon: 'iconfont iconvery-master',
        name: this.$t('sysSetting.integration.gitProviderTab'),
        desc: this.$t('sysSetting.integration.gitProviderTip'),
        link: '/v1/system/integration/git'
      },
      {
        icon: 'iconfont iconpeizhi',
        name: this.$t('sysSetting.integration.configTab'),
        desc: this.$t('sysSetting.integration.configTip'),
        link: '/v1/system/integration/config',
        disabled: true
      },
      {
        icon: 'iconfont iconjenkins',
        name: this.$t('sysSetting.integration.ciTab'),
        desc: this.$t('sysSetting.integration.ciTip'),
        link: '/v1/system/integration/ci'
      },
      {
        icon: 'iconfont iconvery-scanner',
        name: this.$t('sysSetting.integration.scannerTab'),
        desc: this.$t('sysSetting.integration.scannerTip'),
        link: '/v1/system/integration/scanner'
      },
      {
        icon: 'iconfont iconapproval',
        name: this.$t('sysSetting.integration.approvalTab'),
        desc: this.$t('sysSetting.integration.approvalTip'),
        link: '/v1/system/integration/approval',
        disabled: true
      },
      {
        icon: 'iconfont icondocker',
        name: this.$t('sysSetting.integration.registryTab'),
        desc: this.$t('sysSetting.integration.registryTip'),
        link: '/v1/system/integration/registry'
      },
      {
        icon: 'iconfont iconduixiangcunchu',
        name: this.$t('sysSetting.integration.storageTab'),
        desc: this.$t('sysSetting.integration.storageTip'),
        link: '/v1/system/integration/storage'
      },
      {
        icon: 'iconfont iconhelmrepo',
        name: this.$t('sysSetting.integration.helmChartRepoTab'),
        desc: this.$t('sysSetting.integration.helmChartRepoTip'),
        link: '/v1/system/integration/helmChartRepo'
      },
      {
        icon: 'iconfont iconvery-k8s',
        name: this.$t('sysSetting.integration.clusterTab'),
        desc: this.$t('sysSetting.integration.clusterTip'),
        link: '/v1/system/integration/cluster'
      }, {
        icon: 'iconfont iconzhuji',
        name: this.$t('sysSetting.integration.hostTab'),
        desc: this.$t('sysSetting.integration.hostTip'),
        link: '/v1/system/integration/host'
      }, {
        icon: 'iconfont iconvery-collaboratiom',
        name: this.$t('sysSetting.integration.externalSystemTab'),
        desc: this.$t('sysSetting.integration.externalSystemTip'),
        link: '/v1/system/integration/external'
      }]
    }
  },
  methods: {
    redirectToDetail (item) {
      if (!item.disabled) {
        this.$router.push(item.link)
      }
    }
  },
  mounted () {
    bus.$emit('set-topbar-title', { title: '', breadcrumb: [{ title: this.$t(`sidebarMenu.systemIntegration`), url: '' }] })
  }
}
</script>

<style lang="less" >
.integration-home {
  position: relative;
  flex: 1;
  height: 100%;
  padding: 30px 30px;
  overflow: auto;

  .integration-list {
    display: flex;
    flex-direction: column;
    min-height: 100%;

    .integration-item {
      display: flex;
      align-items: center;
      margin-bottom: 10px;
      padding: 20px 30px;
      background-color: #fff;
      box-shadow: 0 2px 5px 3px #0000000d;
      cursor: pointer;
      transition: transform 0.15s ease-in-out;

      &:hover {
        transform: translate(5px);
      }

      .info {
        display: flex;
        flex-grow: 1;
        align-items: center;
        margin-right: 10px;

        .icon {
          margin-right: 30px;

          i {
            color: @themeColor;
            font-size: 30px;
          }
        }

        .detail {
          .name {
            display: flex;
            align-items: center;
            margin-bottom: 5px;
            color: #2f2f2f;
            font-weight: 500;
            font-size: 16px;

            .tag {
              margin-left: 4px;
            }
          }

          .desc {
            color: #969799;
            font-size: 13px;
          }
        }
      }

      &.disabled {
        cursor: not-allowed;

        .info {
          .icon {
            i {
              color: gray;
            }
          }
        }
      }

      .configure {
        .configure-btn {
          padding: 10px 40px;
          color: @themeColor;
          border: 1px solid @themeColor;
          transition: all 0.5s;

          &:hover {
            color: #fff;
            background-color: @themeColor;
          }
        }

        .disabled-btn {
          color: gray;
          border: 1px solid gray;

          &:hover {
            color: gray;
            background: #fff;
          }
        }
      }
    }
  }
}
</style>
