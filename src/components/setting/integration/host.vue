<template>
  <div class="host">
    <ManageHost type="system" />
  </div>
</template>
<script>
import bus from '@utils/eventBus'
export default {
  name: 'SystemHost',
  mounted () {
    bus.$emit('set-topbar-title', { title: '', breadcrumb: [{ title: this.$t(`sidebarMenu.systemIntegration`), url: '/v1/system/integration' }, { title: this.$t(`sysSetting.integration.hostTab`), url: '' }] })
  }
}

</script>
<style lang="less" scoped>
.host {
  height: 100%;
  overflow: auto;
}
</style>
