<template>
  <div class="dashboard-container">
    <div class="tab-container">
      <div class="tab-content">
        <ul class="tab-item-list">
          <li class="tab-item" :class="{'active': categoryTab ==='status'}" @click="changeViewType('status')">
            <i class="icon iconfont iconyunhangzhuangtai"></i>
            <span class="name">{{$t('sidebarMenu.status')}}</span>
          </li>
          <li class="tab-item" :class="{'active': categoryTab ==='personalView'}" @click="changeViewType('personalView')">
            <i class="icon iconfont iconpersonalview"></i>
            <span class="name">{{$t('sidebarMenu.personalView')}}</span>
          </li>
        </ul>
      </div>
    </div>
    <Status v-if="categoryTab === 'status'" />
    <Dashboard v-else-if="categoryTab === 'personalView'" />
  </div>
</template>
<script>
import bus from '@utils/eventBus'
import Dashboard from './dashboard.vue'
import Status from './status/status.vue'
import store from 'storejs'
import { mapState } from 'vuex'
export default {
  data () {
    return {
      categoryTab: 'status'
    }
  },
  computed: {
    ...mapState({
      userInfo: state => state.login.userinfo
    }),
    username () {
      // 系统用户
      if (this.userInfo.identityType === 'system') {
        if (this.userInfo.name) {
          return `${this.userInfo.name}(${this.userInfo.account})`
        } else {
          return this.userInfo.account
        } // 第三方登录
      } else if (this.userInfo.preferred_username) {
        return `${this.userInfo.name}(${this.userInfo.preferred_username})`
      } else {
        return this.userInfo.name
      }
    }
  },
  methods: {
    checkCategoryTab () {
      const categoryTab = store.get('dashboardCategoryTab')
      if (categoryTab && categoryTab.type && categoryTab.username === this.username) {
        this.categoryTab = categoryTab.type
      } else {
        this.categoryTab = 'status'
      }
    },
    changeViewType (type) {
      this.categoryTab = type
      store.set('dashboardCategoryTab', { type: type, username: this.username })
    }
  },
  mounted () {
    this.checkCategoryTab()
    bus.$emit('set-topbar-title', {
      title: this.$t(`sidebarMenu.dashboard`),
      breadcrumb: [
        { title: this.$t(`sidebarMenu.dashboard`), url: '' }
      ]
    })
  },
  components: {
    Dashboard,
    Status
  }
}
</script>
<style lang="less" scoped>
.dashboard-container {
  height: 100%;
  padding: 0 16px;
  overflow-y: auto;

  .tab-container {
    display: flex;
    justify-content: flex-start;

    .tab-content {
      .tab-item-list {
        display: flex;

        .active {
          box-shadow: inset 0 -2px 0 @themeColor;

          .icon {
            color: @themeColor;
          }
        }

        .tab-item {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          height: 42px;
          padding: 9px 12px;
          color: #000;
          font-weight: 300;
          font-size: 16px;
          line-height: 22px;
          cursor: pointer;

          .icon {
            margin-right: 18px;
            color: #d2d2d2;
            font-size: 22px;
          }

          &.active {
            box-shadow: inset 0 -2px 0 @themeColor;

            .icon {
              color: @themeColor;
            }
          }
        }
      }
    }
  }
}
</style>
