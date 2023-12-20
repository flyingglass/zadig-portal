<template>
  <div class="custom-tab-class">
    <el-tabs :value="currentTab" type="card" :before-leave="updateCurrent">
      <el-tab-pane v-for="(tab,index) in tabList" :key="index" :label="tab[label]" :name="tab[name]">
        <template slot="label">
          <div class="custom-tab-svg">
            <svg version="1.1" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
              <defs>
                <symbol id="custom-tab-left" viewBox="0 0 214 40">
                  <path d="M17 0h197v40H0v-2c4.5 0 9-3.5 9-8V8c0-4.5 3.5-8 8-8z" />
                </symbol>
                <symbol id="custom-tab-right" viewBox="0 0 214 40">
                  <use xlink:href="#custom-tab-left" />
                </symbol>
                <clipPath id="crop">
                  <rect class="mask" width="100%" height="100%" x="0" />
                </clipPath>
              </defs>
              <svg width="52%" height="100%">
                <use xlink:href="#custom-tab-left" width="214" height="40" class="custom-tab" />
              </svg>
              <g transform="scale(-1, 1)">
                <svg width="52%" height="100%" x="-100%" y="0">
                  <use xlink:href="#custom-tab-right" width="214" height="40" class="custom-tab" />
                </svg>
              </g>
            </svg>
          </div>
          <div class="custom-tab-title">
            <el-tooltip effect="dark" placement="bottom">
              <slot v-bind:tab="tab"></slot>
              <template slot="content">
                <span>{{tab.name}}</span>
                <span v-if="!_.isNil(tab.share_env_is_base) && tab.share_env_is_base" >基准环境</span>
                <span v-if="!tab.share_env_is_base && !_.isNil(tab.share_env_base_env) && tab.share_env_base_env !==''">子环境</span>
              </template>
            </el-tooltip>
          </div>
        </template>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>
<script>
import _ from 'lodash'
export default {
  model: {
    prop: 'currentTab',
    event: 'updateTab'
  },
  props: {
    currentTab: String,
    tabList: Array,
    label: String,
    name: String
  },
  methods: {
    updateCurrent (current) {
      this.$emit('updateTab', current)
    }
  },
  computed: {
    _ () {
      return _
    }
  }
}
</script>

<style lang="less" scoped>
@tabHeight: 40px;

.custom-tab-class {
  width: calc(~'100% - 46px');
  padding: 12px 0 0;
  background-color: #e5e5e5;

  /deep/.el-tabs {
    height: @tabHeight;

    &.el-tabs--card > .el-tabs__header {
      border-bottom-width: 0;
    }

    .el-tabs__item {
      position: relative;
      width: 200px;
      height: @tabHeight;
      border-width: 0;

      &::before {
        position: absolute;
        top: 20%;
        bottom: 20%;
        left: 0;
        width: 1px;
        background-color: #fff;
        content: '';
      }

      &:first-child::before {
        width: 0;
      }

      .custom-tab-title {
        position: absolute;
        z-index: 2;
        width: calc(~'100% - 40px');
        overflow: hidden;

        .favorite {
          position: absolute;
          top: 28%;
          right: 0;
          color: @globalBackgroundColor;
          font-size: 18px;
          cursor: pointer;

          &.active,
          &:hover {
            color: @themeColor;
          }
        }
      }

      .custom-tab-svg {
        position: absolute;
        top: 0;
        right: -5px;
        bottom: 0;
        left: -5px;
        z-index: 1;
      }

      .custom-tab {
        fill: transparent;
      }

      &.is-active {
        &::before,
        & + .el-tabs__item::before {
          width: 0;
        }

        .custom-tab {
          fill: @globalBackgroundColor;
        }

        .custom-tab-title {
          .favorite {
            color: @backgroundColor;

            &.active,
            &:hover {
              color: @themeColor;
            }
          }
        }
      }
    }
  }
}
</style>
