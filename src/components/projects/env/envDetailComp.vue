<template>
  <div class="env-detail-container" ref="envContainer">
    <div class="envs-container">
      <div class="btn-container">
        <button type="button" :class="{'active':showFavorite}" @click="showFavorite=!showFavorite" class="display-btn">
          <i class="el-icon-star-on favorite"></i>
        </button>
      </div>
      <ChromeTabs v-model="envName" :tabList="showEnvNames" :label="'name'" :name="'name'">
        <template v-slot="{ tab }">
          <span class="title-content">
            <i v-if="tab.source==='helm'" class="iconfont iconhelmrepo"></i>
            <i v-else-if="tab.source==='spock'" class="el-icon-cloudy"></i>
            {{ tab.alias?$utils.tailCut(tab.alias,14):$utils.tailCut(tab.name,14) }}
            <el-tag v-if="tab.source==='external'" effect="light" size="mini" type="primary">{{$t('environments.common.hostingEnv')}}</el-tag>
            <el-tag
              v-if="!_.isNil(tab.share_env_is_base) && tab.share_env_is_base"
              effect="light"
              size="mini"
              type="primary"
            >{{$t('environments.common.baseEnv')}}</el-tag>
            <el-tag
              v-if="!tab.share_env_is_base && !_.isNil(tab.share_env_base_env) && tab.share_env_base_env !==''"
              effect="light"
              size="mini"
              type="primary"
            >{{$t('environments.common.subEnv')}}</el-tag>
            <i class="el-icon-star-on favorite" :class="{'active': tab.is_favorite}" @click.stop="setCurFavorite(tab)"></i>
          </span>
        </template>
      </ChromeTabs>
    </div>
    <TestEnvDetail v-if="currentEnv" :envBasePath="envBasePath" :envNameList="envNameList" @getEnvNameList="getEnvNameList" />
  </div>
</template>

<script>
import {
  listProductAPI,
  createFavoriteEnvAPI,
  deleteFavoriteEnvAPI
} from '@api'
import _ from 'lodash'
import TestEnvDetail from './testEnvDetail.vue'
import ChromeTabs from './common/chromeTabs.vue'
export default {
  data () {
    return {
      envNameList: [],
      showFavorite: false
    }
  },
  computed: {
    projectName () {
      return this.$route.params.project_name
    },
    envBasePath () {
      return `/v1/projects/detail/${this.projectName}/envs/detail`
    },
    _ () {
      return _
    },
    envName: {
      get: function () {
        if (this.$route.query.envName) {
          return this.$route.query.envName
        } else {
          return this.envNameList[0].envName
        }
      },
      set: function (newValue) {
        this.$router.push({
          path: `${this.envBasePath}`,
          query: { envName: newValue }
        })
      }
    },
    currentEnv () {
      const currentEnv = this.envNameList.find(item => {
        return item.envName === this.envName
      })
      return currentEnv
    },
    envSource () {
      return this.currentEnv.source
    },
    showEnvNames () {
      return this.showFavorite ? this.envNameList.filter(env => env.is_favorite) : this.envNameList
    }
  },
  methods: {
    setCurFavorite (env) {
      ;(env.is_favorite ? deleteFavoriteEnvAPI : createFavoriteEnvAPI)(
        env.name,
        this.projectName
      ).then(() => {
        this.$message.success(env.is_favorite ? '取消收藏' : '收藏成功')
        this.getEnvNameList()
      })
    },
    async getEnvNameList () {
      const projectName = this.projectName
      const requests = []
      const hasTestEnvListPermission = await this.checkingPermissionMixin({ projectName: projectName, action: 'get_environment' })
      if (hasTestEnvListPermission) {
        requests.push(listProductAPI(projectName))
      }
      const res = await Promise.all(requests)
      let envNameList = []
      if (res[1]) {
        envNameList = res[0].concat(res[1])
      } else {
        envNameList = res[0]
      }
      envNameList.forEach(element => {
        element.envName = element.name
      })
      if (envNameList) {
        this.envNameList = _.sortBy(envNameList, item => {
          return !item.is_favorite // item.production
        })
      }
    }
  },
  watch: {
    $route: {
      handler: function (to, from) {
        if (this.projectName !== '') {
          this.getEnvNameList()
        }
      },
      immediate: true
    }
  },
  components: {
    TestEnvDetail,
    ChromeTabs
  }
}
</script>

<style lang="less">
@import '~@assets/css/component/env-detail.less';
</style>
