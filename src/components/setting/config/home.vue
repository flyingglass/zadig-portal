<template>
  <div class="config-home">
    <div class="tab-container">
      <el-tabs v-model="activeTab" type="card">
        <el-tab-pane name="quota" label="任务配置">
          <keep-alive >
            <Quota v-if="activeTab === 'quota'" />
          </keep-alive>
        </el-tab-pane>
        <el-tab-pane name="proxy" label="代理配置">
          <keep-alive >
            <Proxy v-if="activeTab === 'proxy'" />
          </keep-alive>
        </el-tab-pane>
        <el-tab-pane name="cache" label="缓存清理">
          <keep-alive >
            <Cache v-if="activeTab === 'cache'" />
          </keep-alive>
        </el-tab-pane>
        <el-tab-pane name="link" label="快捷链接">
          <keep-alive >
            <Link v-if="activeTab === 'link'" />
          </keep-alive>
        </el-tab-pane>
        <el-tab-pane name="mail" label="邮件配置">
          <keep-alive >
            <Mail v-if="activeTab === 'mail'" />
          </keep-alive>
        </el-tab-pane>
      </el-tabs>
    </div>
  </div>
</template>
<script>
import Quota from './quota.vue'
import Proxy from './proxy.vue'
import Cache from './cache.vue'
import Link from './link.vue'
import Mail from './mail.vue'
import bus from '@utils/eventBus'

export default {
  name: 'config',
  components: {
    Proxy,
    Cache,
    Quota,
    Link,
    Mail
  },
  data () {
    return {
      activeTab: 'quota'
    }
  },
  mounted () {
    bus.$emit('set-topbar-title', { title: '', breadcrumb: [{ title: this.$t(`sidebarMenu.settings`), url: '' }] })
    if (this.$route.query.tab && this.$route.query.tab === 'mail') {
      this.activeTab = 'mail'
    }
  }
}
</script>

<style lang="less" >
.config-home {
  position: relative;
  flex: 1;
  padding: 15px 30px;
  overflow: auto;
}
</style>
