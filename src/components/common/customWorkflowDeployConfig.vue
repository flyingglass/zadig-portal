<template>
  <div class="workflow-deploy-rows">
    <el-row class="title">
      <el-col :span="4">{{$t(`global.serviceName`)}}</el-col>
      <el-col :span="4" v-if="job.spec.deploy_contents.includes('image')">{{$t(`global.serviceModule`)}}</el-col>
      <el-col :span="6" v-if="job.spec.deploy_contents.includes('image')">{{$t(`global.imageVersion`)}}</el-col>
      <el-col :span="1"></el-col>
    </el-row>
    <div v-if="job.spec.source && job.spec.source==='runtime'">
      <el-row v-for="(item,index) in job.spec.services" :key="index" class="list">
        <el-col :span="4">{{item.service_name}}</el-col>
        <el-col :span="10" v-if="job.spec.deploy_contents.includes('image')" class="col">
          <div v-for="(image,index) in item.service_and_images" :key="index" class="col-item">
            <div style="width: 40%;">{{image.service_module}}</div>
            <div style="width: 60%;">
              <el-select v-model="image.image" size="small" style="width: 80%;" filterable>
                <el-option
                  v-for="(image,index) of image.images"
                  :key="index"
                  :value="image.host+'/'+image.owner+'/'+image.name+':'+image.tag"
                  :label="image.tag"
                ></el-option>
              </el-select>
            </div>
          </div>
        </el-col>
        <el-col :span="1" class="col" v-if="deployType!=='external'">
          <span class="icon" @click="preview(item, 'runtime', job)">{{$t(`global.preview`)}}</span>
        </el-col>
        <el-row v-if="item.isExpand" justify="end">
          <el-col :span="20" :offset="4">
            <VariablesEditor
              v-if="deployType === 'helm'"
              class="helm-yaml-editor"
              style="width: 100%; height: 100%;"
              :ref="`variablesYamlEditor-${index}`"
              @input="(value) => { item.variable_yaml = value }"
              :value="item.variable_yaml"
              :options="{
                tabSize: 5,
                readOnly: false,
                theme: 'neo',
                mode: 'text/x-yaml',
                lineNumbers: true,
                line: true,
                collapseIdentical: true,
                placeholder:'请输入 values 文件'
              }" />
            <el-table v-else :data="item.update_config?item.latest_variable_kvs:item.variable_kvs" class="table" size="mini">
              <el-table-column :label="$t(`global.key`)">
                <template slot-scope="scope">{{scope.row.key}}</template>
              </el-table-column>
              <el-table-column :label="$t(`global.desc`)">
                <template slot-scope="scope">{{scope.row.desc}}</template>
              </el-table-column>
              <el-table-column :label="$t(`global.value`)">
                <template slot-scope="scope">
                  <el-input v-if="scope.row.type === 'string'" size="mini" v-model="scope.row.value" @input="changeServiceVariable(item)"></el-input>
                  <el-select v-else-if="scope.row.type === 'enum'" v-model="scope.row.value" @change="changeServiceVariable(item)" class="full-width" size="mini">
                    <el-option v-for="(item,index) in scope.row.options" :key="index" :label="item" :value="item"></el-option>
                  </el-select>
                  <el-switch v-else-if="scope.row.type === 'bool'" v-model="scope.row.value" @change="changeServiceVariable(item)"></el-switch>
                  <VariablesEditor
                    v-else-if="scope.row.type === 'yaml'"
                    class="helm-yaml-editor"
                    style="width: 100%; height: 100%;"
                    :ref="`variablesYamlEditor-${scope.$index}`"
                    @input="(value) => { scope.row.value = value; changeServiceVariable(item) }"
                    :value="scope.row.value"
                    :options="{
                      tabSize: 5,
                      readOnly: false,
                      theme: 'neo',
                      mode: 'text/x-yaml',
                      lineNumbers: true,
                      line: true,
                      collapseIdentical: true
                    }"
                  />
                </template>
              </el-table-column>
            </el-table>
          </el-col>
        </el-row>
      </el-row>
    </div>
    <div v-else>
      <div v-if="job.originPickedTargets">
        <el-row v-for="(item,index) in job.originPickedTargets" :key="index" class="list">
          <el-col :span="4">{{item.service_name}}</el-col>
          <el-col :span="10" v-if="job.spec.deploy_contents.includes('image')" class="col">
            <div v-for="(image,index) in item.service_and_images" :key="index" class="col-item">
              <div style="width: 40%;">{{image.service_module}}</div>
              <div style="width: 60%;">
                <span style="color: #909399; font-size: 12px;">来自前置构建任务</span>
              </div>
            </div>
          </el-col>
          <el-col :span="4" class="list-change" v-if="job.spec.deploy_contents.includes('config')">
            <div v-if="item.updatable">
              <div class="has">
                <span class="el-icon-warning-outline"></span>
                {{$t(`global.hasChange`)}}
              </div>
              <el-checkbox v-model="item.update_config">
                <span style="font-size: 13px;">使用最新变更</span>
              </el-checkbox>
            </div>
            <div v-else class="no">{{$t(`global.noChange`)}}</div>
          </el-col>
          <el-col :span="1" class="col" v-if="deployType!=='external'">
            <span class="icon" @click="preview(item, 'other', job)">{{$t(`global.preview`)}}</span>
          </el-col>
          <el-row v-if="item.isExpand" justify="end">
            <el-col :span="20" :offset="4">
            <VariablesEditor
              v-if="deployType === 'helm'"
              class="helm-yaml-editor"
              style="width: 100%; height: 100%;"
              :ref="`variablesYamlEditor-${index}`"
              @input="(value) => { item.variable_yaml = value;changeServiceVariable(item) }"
              :value="item.variable_yaml"
              :options="{
                tabSize: 5,
                readOnly: false,
                theme: 'neo',
                mode: 'text/x-yaml',
                lineNumbers: true,
                line: true,
                collapseIdentical: true,
                placeholder:'请输入 values 文件'
              }" />
              <el-table v-else :data="item.update_config?item.latest_variable_kvs:item.variable_kvs" class="table" size="mini">
                <el-table-column :label="$t(`global.key`)">
                  <template slot-scope="scope">{{scope.row.key}}</template>
                </el-table-column>
                <el-table-column :label="$t(`global.value`)">
                <template slot-scope="scope">
                  <el-input v-if="scope.row.type === 'string'" size="mini" v-model="scope.row.value" @input="changeServiceVariable(item)"></el-input>
                  <el-select v-else-if="scope.row.type === 'enum'" v-model="scope.row.value" @change="changeServiceVariable(item)" class="full-width" size="mini">
                    <el-option v-for="(item,index) in scope.row.options" :key="index" :label="item" :value="item"></el-option>
                  </el-select>
                  <el-switch v-else-if="scope.row.type === 'bool'" v-model="scope.row.value" @change="changeServiceVariable(item)"></el-switch>
                  <VariablesEditor
                    v-else-if="scope.row.type === 'yaml'"
                    class="helm-yaml-editor"
                    style="width: 100%; height: 100%;"
                    :ref="`variablesYamlEditor-${scope.$index}`"
                    @input="(value) => { scope.row.value = value;changeServiceVariable(item)}"
                    :value="scope.row.value"
                    :options="{
                      tabSize: 5,
                      readOnly: false,
                      theme: 'neo',
                      mode: 'text/x-yaml',
                      lineNumbers: true,
                      line: true,
                      collapseIdentical: true
                    }"
                  />
                </template>
                </el-table-column>
              </el-table>
            </el-col>
          </el-row>
        </el-row>
      </div>
    </div>
    <el-dialog
      :append-to-body="true"
      :visible.sync="fileDiffDialogVisible"
      width="50%"
      :title="fileDiffDialogTitle"
      class="file-diff-dialog"
    >
      <div class="diff-container">
        <div
          v-if="deployType === 'helm' && job.spec.source !== 'runtime'"
          class="title"
        >{{ $t(`workflow.fromJobDiffTitle`, { name: reviewServiceName }) }}</div>
        <div class="diff-content">
          <div v-for="(section, index) in yamlDiff" :key="index" :class="{ 'added': section.added, 'removed': section.removed }">
            <pre id="yaml-content">{{ section.value }}</pre>
          </div>
        </div>
      </div>
      <span slot="footer" class="dialog-footer">
        <el-button type="primary" size="small" @click="fileDiffDialogVisible=false">{{$t(`global.confirm`)}}</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
import { codemirror } from 'vue-codemirror'
import 'codemirror/lib/codemirror.css'
import 'codemirror/mode/yaml/yaml.js'
import 'codemirror/theme/neo.css'
import 'codemirror/addon/display/placeholder.js'
import { previewChangedYaml, previewChangedHelmYaml } from '@api'
import { cloneDeep } from 'lodash'
const jsdiff = require('diff')

export default {
  props: {
    job: {
      type: Object,
      default: () => ({})
    },
    fromJobInfo: {
      type: Object,
      default: () => ({})
    },
    originServices: {
      type: Array,
      default: () => []
    },
    type: {
      type: String,
      default: ''
    },
    projectName: {
      type: String,
      default: ''
    }
  },
  computed: {
    deployType () {
      const project = this.$store.getters.projectList.find(
        project => project.name === this.projectName
      )
      return project ? project.deployType : ''
    }
  },
  data () {
    return {
      deployFromOtherJobInfo: {},
      fileDiffDialogVisible: false,
      yamlDiff: [],
      fileDiffDialogTitle: '服务渲染后的 YAML 结果和当前环境中的服务 YAML 比对',
      reviewServiceName: ''
    }
  },
  methods: {
    handleServices (val, job) {
      const data = cloneDeep(val)
      if (this.job.spec.source === 'fromjob') {
        // 兼容开源版本 平铺是后端需要的结构 树形是方便前端展示 最后传值依然要平铺的结构
        if (!job.originPickedTargets || (job.originPickedTargets && job.originPickedTargets.length === 0)) return
        data.forEach(image => {
          job.originPickedTargets.forEach(item => {
            this.$set(item, 'isExpand', item.isExpand ? item.isExpand : false)
            if (!item.service_and_images) {
              this.$set(item, 'service_and_images', [])
            }
            if (item.service_name === image.service_name) {
              item.service_and_images = item.service_and_images.concat(image)
            }
          })
        })
      } else {
        const services = cloneDeep(this.job.spec.originServices)
        if (!services) return
        data.forEach(image => {
          services.forEach(item => {
            this.$set(item, 'isExpand', item.isExpand ? item.isExpand : false)
            if (!item.service_and_images) {
              this.$set(item, 'service_and_images', [])
            }
            if (item.service_name === image.service_name) {
              item.service_and_images = item.service_and_images.concat(image)
            }
          })
        })
        this.job.spec.services = services.filter(
          item => item.service_and_images && item.service_and_images.length > 0
        )
      }
    },
    expand (item, isExpand) {
      this.$set(item, 'isExpand', isExpand)
      this.$forceUpdate()
    },
    preview (item, type, job) {
      let service_modules = []
      if (job.spec.deploy_contents.includes('image')) {
        service_modules = item.service_and_images
          ? item.service_and_images.map(item => {
            return {
              name: item.service_module,
              image: type === 'other' ? '{{.build.image}}' : item.image
            }
          })
          : []
      } else {
        service_modules = []
      }
      if (this.deployType === 'helm') {
        const payload = {
          service_modules,
          service_name: item.service_name,
          variable_yaml: item.variable_yaml,
          env_name: this.job.spec.env,
          production: this.job.spec.production,
          update_service_revision: item.update_config
        }
        previewChangedHelmYaml(
          this.projectName,
          payload
        ).then(res => {
          this.fileDiffDialogTitle = `${item.service_name} 更新后的 values 文件和当前环境中的 values 文件比对`
          this.reviewServiceName = item.service_name
          const { current, latest } = res
          this.openUpdateServiceDialog({ yaml: current }, { yaml: latest })
        })
      } else {
        const payload = {
          update_service_revision: item.update_config,
          service_modules,
          variable_kvs: (item.update_config && item.updatable) ? item.latest_variable_kvs : item.variable_kvs
        }
        previewChangedYaml(
          this.job.spec.env,
          item.service_name,
          this.projectName,
          payload
        ).then(res => {
          this.fileDiffDialogTitle = `服务渲染后的 YAML 结果和当前环境中的服务 YAML 比对`
          const { current, latest } = res
          this.openUpdateServiceDialog(current, latest)
        })
      }
    },
    openUpdateServiceDialog (current, latest) {
      current.yaml = current.yaml || ''
      this.yamlDiff = jsdiff.diffLines(
        current.yaml.replace(/\\n/g, '\n').replace(/\\t/g, '\t'),
        latest.yaml.replace(/\\n/g, '\n').replace(/\\t/g, '\t')
      )
      this.fileDiffDialogVisible = true
    },
    changeServiceVariable (service) {
      this.$emit('serviceVariableChange', service)
    }
  },
  watch: {
    'job.pickedTargets': {
      handler (value) {
        if (this.job.spec.source === 'runtime') {
          setTimeout(() => { this.handleServices(value) }, 100)
        }
      },
      immediate: true,
      deep: true
    }
  },
  components: {
    VariablesEditor: codemirror
  }
}
</script>

<style lang="less" scoped>
@import '~@assets/css/common/build-row.less';

.workflow-deploy-rows {
  .title {
    margin: 8px 0 8px 0;
    padding: 0 10px;
    font-weight: 300;
    font-size: 14px;
    line-height: 40px;
    background: #eaeaea;
  }

  .full-width {
    width: 100%;
  }

  .list {
    padding: 0 10px;
    line-height: 33px;

    &-change {
      .has {
        color: red;
        line-height: 16px;
      }

      .no {
        color: #ddd;
      }
    }

    .icon {
      color: @themeColor;
      font-size: 13px;
      cursor: pointer;
    }

    .helm-yaml-editor {
      width: 100%;
      height: 100%;
      margin-bottom: 10px;

      /deep/.CodeMirror {
        height: 100%;
        border: 1px solid #ccc;
        border-radius: 4px;
      }

      /deep/.CodeMirror-placeholder {
        color: #ccc;
      }
    }

    .col {
      position: relative;
      z-index: 11;
      min-height: 1px;

      &-item {
        display: flex;
        justify-content: space-between;
        margin-bottom: 8px;
      }
    }

    .table {
      position: relative;
      z-index: 0;
      width: 100%;
      margin: 0 auto;
      padding: 5px 0;

      .yaml-editor {
        width: 100%;
        height: 100%;

        /deep/.CodeMirror {
          height: 100%;
          border: 1px solid #ccc;
          border-radius: 4px;
        }

        /deep/.CodeMirror-placeholder {
          color: #ccc;
        }
      }
    }
  }
}

.file-diff-dialog {
  /deep/.el-dialog__body {
    padding-top: 10px;
  }

  .diff-container {
    margin-bottom: 5px;

    .title {
      display: inline-block;
      margin-bottom: 10px;
      color: #999;
    }

    .diff-content {
      overflow-y: auto;

      pre {
        margin: 0;
      }

      .added {
        background-color: #b4e2b4;
      }

      .removed {
        background-color: #ffb6ba;
      }
    }
  }
}
</style>
