<template>
  <el-dropdown @command="handleCommand($event,value)" class="dropdown">
    <span class="el-dropdown-link">
      <i class="iconfont iconshuru" v-if="!type || type === 'runtime'"></i>
      <i class="iconfont icongudingzhi" v-if="type === 'fixed'"></i>
      <i class="iconfont iconhanshu" v-if="type === 'other'"></i>
      <i class="iconfont iconhanshu" v-if="type === 'param'"></i>
    </span>
    <el-dropdown-menu slot="dropdown">
      <el-dropdown-item command="runtime" v-if="isRuntime" :class="{'active': type === 'runtime'||type === ''}">
        <span class="iconfont iconshuru"></span>
        {{$t(`workflow.runtimeInput`)}}
      </el-dropdown-item>
      <el-dropdown-item command="fixed" v-if="isFixed" :class="{'active': type === 'fixed'}">
        <span class="iconfont icongudingzhi"></span>
        {{$t(`workflow.fixedvalue`)}}
      </el-dropdown-item>
      <el-dropdown-item command="other" v-if="isOther" :class="{'active': type === 'other'}">
        <span class="iconfont iconhanshu"></span>
        {{$t(`workflow.globalVariableOrotherTaskOutput`)}}
      </el-dropdown-item>
      <el-dropdown-item command="param" v-if="isParam" :class="{'active': type === 'param'}">
        <span class="iconfont iconhanshu"></span>
        {{$t(`workflow.globalVariableOrotherTaskOutput`)}}
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
    isFixed: {
      type: Boolean,
      default: false
    },
    isRuntime: {
      type: Boolean,
      default: false
    },
    isOther: {
      type: Boolean,
      default: false
    },
    isParam: {
      type: Boolean,
      default: false
    },
    isService: {
      type: Boolean,
      default: false
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

/deep/ .el-dropdown-menu__item {
  &.active {
    background: @sidebarActiveColor;
  }
}
</style>
