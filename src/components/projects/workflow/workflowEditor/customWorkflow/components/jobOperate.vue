<template>
  <div class="job-operate">
    <div class="left">
      <div
        v-for="(task, index) in taskList"
        :key="index"
        class="task"
        @click="jumpTo(task)"
        :class="[curGroup === task.category ? 'active' : '']"
      >{{ task.name }}</div>
    </div>
    <div class="right" @scroll="onScroll">
      <div v-for="(task, index) in taskList" :key="index" :ref="task.category">
        <div class="task-title">{{ task.name }}</div>
        <div
          v-for="(item, id) in task.jobTypeList"
          :key="`${index}-${id}`"
          class="item"
          :class="{'active':curTaskIndex===index}"
          @click="setCurTask(index,item)"
        >
          <div class="mg-b8">
            <span class="item-title">{{item.label ? $t(`workflow.jobType.${item.label}`) : item.name}}</span>
            <el-tag size="mini" class="item-tag mg-l8" v-if="item.is_offical" effect="plain">官方</el-tag>
          </div>
          <span class="item-dec">{{item.description}}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { jobTypeGroup } from '../config'
import { getPluginsAPI } from '@api'
import { debounce, cloneDeep } from 'lodash'

export default {
  name: 'JobOperate',
  data () {
    return {
      jobTypeGroup: cloneDeep(jobTypeGroup),
      plugins: [],
      curTaskIndex: -1,
      curGroup: jobTypeGroup[0].category
    }
  },
  computed: {
    taskList () {
      // 由两部分组成 一部分前端定义 + 后端插件列表（并且插件需要自己造结构）
      const groupObj = {}
      this.jobTypeGroup.forEach(group => {
        groupObj[group.category] = group
      })
      this.plugins.forEach(plugin => {
        ;(groupObj[plugin.category] || groupObj.other).jobTypeList.push(plugin)
      })
      return this.jobTypeGroup
    }
  },
  created () {
    this.getPlugins()
  },
  methods: {
    getPlugins () {
      getPluginsAPI().then(res => {
        res.forEach(item => {
          item.type = 'plugin'
        })
        this.plugins = res
      })
    },
    setCurTask (index, item) {
      this.$store.dispatch('setIsEditJob', false)
      if (item.type === 'plugin') {
        const obj = {
          name: 'default',
          type: 'plugin',
          spec: {
            properties: {
              timeout: 60,
              res_req: 'low', // high/medium/low/min/define
              res_req_spec: {
                cpu_limit: 1000,
                memory_limit: 512
              },
              cluster_id: ''
            },
            plugin: item
          }
        }
        this.$emit('change', obj)
      } else {
        this.$emit('change', item)
      }
      this.curTaskIndex = -1
    },
    onScroll: debounce(function (event) {
      const scrollTop = event.target.scrollTop
      for (let i = 0; i < this.jobTypeGroup.length; i++) {
        const group = this.jobTypeGroup[i]
        const cur = this.$refs[group.category][0]
        if (
          cur.offsetTop <= scrollTop &&
          cur.offsetTop + cur.offsetHeight > scrollTop
        ) {
          this.curGroup = group.category
          break
        }
      }
    }, 100),
    jumpTo (task) {
      this.$refs[task.category][0].scrollIntoView({
        behavior: 'smooth'
      })
    }
  }
}
</script>
<style lang="less" scoped>
.job-operate {
  position: relative;
  display: flex;
  height: 100%;
  margin-left: 5px;
  overflow: hidden;

  .left {
    flex: 0 0 100px;
    padding-right: 5px;
    border-right: 1px solid #ebedef;

    .task {
      padding: 16px;
      text-align: left;
      cursor: pointer;

      &:hover {
        background: rgba(0, 102, 255, 0.07);
      }
    }
  }

  .right {
    flex: 1 1 auto;
    height: 100%;
    overflow: auto;

    .task-title {
      padding: 5px 10px;
      color: @secondaryColor;
    }

    .item {
      margin: 10px;
      padding: 16px;
      text-align: left;
      border: 1px solid #ebedef;
      cursor: pointer;

      &-title {
        font-size: 16px;
      }

      &-tag {
        vertical-align: text-top;
      }

      &-dec {
        color: #888;
        font-size: 14px;
      }

      &:hover {
        background: rgba(0, 102, 255, 0.07);
      }
    }
  }

  .active {
    background: rgba(0, 102, 255, 0.07);
  }
}
</style>
