<template>
  <el-dropdown @command="handleCommand($event,value)" class="dropdown">
    <span class="el-dropdown-link">
      <i class="iconfont iconshuru" v-if="!type || type === placeholderData.runtime.value"></i>
      <i class="iconfont icongudingzhi" v-if="type === placeholderData.fixed.value"></i>
      <i class="iconfont iconhanshu" v-if="type === placeholderData.other.value"></i>
    </span>
    <el-dropdown-menu slot="dropdown">
      <el-dropdown-item v-if="placeholderData.runtime.show" :command="placeholderData.runtime.value" >
        <span class="iconfont iconshuru"></span>
        {{placeholderData.runtime.label}}
      </el-dropdown-item>
      <el-dropdown-item v-if="placeholderData.fixed.show" :command="placeholderData.fixed.value">
        <span class="iconfont icongudingzhi"></span>
        {{placeholderData.fixed.label}}
      </el-dropdown-item>
      <el-dropdown-item v-if="placeholderData.other.show" :command="placeholderData.other.value" >
        <span class="iconfont iconhanshu"></span>
        {{placeholderData.other.label}}
      </el-dropdown-item>
    </el-dropdown-menu>
  </el-dropdown>
</template>
<script>
export default {
  model: {
    prop: 'value',
    event: 'change'
  },
  props: {
    value: {
      type: String,
      default: ''
    },
    placeholderData: {
      type: Object,
      default: () => {
        return {}
      }
    }
  },
  data () {
    return {
      type: ''
    }
  },
  methods: {
    handleCommand (val) {
      this.type = val
      this.$emit('change', val)
    }
  },
  watch: {
    value: {
      handler (val) {
        this.type = val
      },
      immediate: true
    }
  }
}
</script>
<style lang="less" scoped>
.dropdown {
  color: @themeColor;
  cursor: pointer;

  .iconfont {
    cursor: pointer;
  }
}
</style>
