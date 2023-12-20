<template>
  <div class="service-variable-container">
    <el-dialog :visible.sync="yaml.dialogVisible" width="60%" :before-close="closeDialog" append-to-body>
      <div>
        <Resize class="desc mirror" @sizeChange="$refs.codemirror.refresh()">
          <Codemirror ref="codemirror" v-model="yaml.row.value" :cmOption="{ readOnly: yaml.row.use_global_variable }"></Codemirror>
        </Resize>
      </div>
      <div slot="footer">
        <el-button type="primary" @click="closeDialog" size="small">{{ $t(`global.confirm`) }}</el-button>
      </div>
    </el-dialog>
    <el-table :data="varList" style="width: 100%;">
      <el-table-column prop="key" :label="$t(`global.key`)"></el-table-column>
      <el-table-column prop="desc" :label="$t(`global.descInfo`)"></el-table-column>
      <el-table-column prop="value" :label="$t(`global.value`)">
        <template slot-scope="{ row }">
          <el-input
            v-if="row.type === 'string'"
            :disabled="row.use_global_variable"
            v-model="row.value"
            :placeholder="$t(`global.string`)"
            size="small"
          ></el-input>
          <el-switch v-else-if="row.type === 'bool'" :disabled="row.use_global_variable" v-model="row.value" size="small"></el-switch>
          <el-select
            v-else-if="row.type === 'enum'"
            :disabled="row.use_global_variable"
            v-model="row.value"
            :placeholder="$t(`global.pleaseSelect`)"
            size="small"
          >
            <el-option v-for="item in row.options" :key="item" :label="item" :value="item"></el-option>
          </el-select>
          <div v-else-if="row.type === 'yaml'" class="yaml-content">
            <el-input :disabled="row.use_global_variable" type="textarea" v-model="row.value" size="small" rows="2"></el-input>
            <i class="el-icon-full-screen screen" :class="{ disabled: row.use_global_variable}" @click="expandShowYaml(row)"></i>
          </div>
        </template>
      </el-table-column>
      <!-- 全局变量 checkbox -->
      <el-table-column v-if="showSelectGlobalVar" :label="$t(`environments.common.useGlobalVariables`)">
        <template slot-scope="{ row }">
          <el-checkbox :disabled="!globalVarKey.includes(row.key)" v-model="row.use_global_variable" @change="whetherUseGlobal(row)"></el-checkbox>
        </template>
      </el-table-column>
      <!-- 更新全局变量 -->
      <!-- 关联服务 -->
      <el-table-column v-if="showRelatedServices" prop="related_services" :label="$t(`environments.common.associatedServices`)">
        <template slot-scope="{ row }">
          <el-tooltip effect="dark" :content="row.related_services.join(',') || '-'" placement="top">
            <div class="no-wrap">{{ row.related_services.join(',') || '-'}}</div>
          </el-tooltip>
        </template>
      </el-table-column>
      <el-table-column v-if="showOperation" width="60px">
        <template slot-scope="{ row, $index }">
          <el-button
            type="danger"
            plain
            circle
            icon="el-icon-minus"
            :disabled="row.related_services && row.related_services.length > 0"
            size="mini"
            @click="deleteCurVar($index)"
          ></el-button>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script>
import Resize from '@/components/common/resize'
import Codemirror from './codemirror.vue'
export default {
  components: { Resize, Codemirror },
  props: {
    varList: {
      type: Array,
      default: () => []
    },
    globalVariables: Array,
    showSelectGlobalVar: Boolean,
    showRelatedServices: Boolean,
    showOperation: Boolean
  },
  data () {
    return {
      yaml: {
        dialogVisible: false,
        row: {}
      }
    }
  },
  computed: {
    usedGlobalVariables () {
      return this.globalVariables || []
    },
    globalVarKey () {
      return this.usedGlobalVariables.map(item => item.key)
    }
  },
  methods: {
    whetherUseGlobal (row) {
      if (row.use_global_variable) {
        const find = this.usedGlobalVariables.find(item => item.key === row.key)
        if (find.type !== row.type) {
          if (!row.ownData) {
            row.ownData = {
              type: row.type,
              value: row.value
            }
          }
          row.type = find.type
        }
        row.value = find.value
      } else if (row.ownData) {
        row.type = row.ownData.type
        row.value = row.ownData.value
      }
      this.$emit('updateRelatedServices', {
        key: row.key,
        operate: row.use_global_variable ? 'add' : 'delete'
      })
    },
    deleteCurVar (index) {
      this.varList.splice(index, 1)
    },
    expandShowYaml (row) {
      this.yaml = {
        dialogVisible: true,
        row
      }
    },
    closeDialog () {
      this.yaml = {
        dialogVisible: false,
        row: {}
      }
    }
  }
}
</script>

<style lang="less" scoped>
.service-variable-container {
  .yaml-content {
    display: flex;

    .screen {
      color: #8cc5ff;
      font-size: 20px;
      cursor: pointer;

      &.disabled {
        color: #909399;
        cursor: not-allowed;
      }
    }
  }

  .no-wrap {
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }
}
</style>
