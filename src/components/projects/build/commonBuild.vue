<template>
  <div class="build-config-container" :class="{'mini-width': mini}">
    <div class="build-source" :class="{'small-padding': mini}">
      <span class="build-source-title">{{$t(`build.buildType`)}}</span>
      <el-select v-model="source" size="small" value-key="key" :disabled="isEdit || !jenkinsEnabled" @change="loadBuild(buildName)" filterable>
        <el-option v-for="(item,index) in originOptions" :key="index" :label="item.label" :value="item.value"></el-option>
      </el-select>
      <el-checkbox v-if="source ==='zadig'" v-model="useTemplate">{{$t(`build.useTemplate`)}}</el-checkbox>
    </div>
    <JenkinsBuild
      v-if="jenkinsEnabled"
      v-show="source === 'jenkins'"
      ref="jenkinsBuildRef"
      :jenkinsBuildData="jenkinsBuild"
      :isCreate="!isEdit"
      :serviceTargets="serviceTargets"
      :jenkinsList ="jenkinsList"
      :mini="mini"
      />
    <ZadigBuild
      v-show="source === 'zadig'"
      ref="zadigBuildForm"
      :isCreate="!isEdit"
      :useTemplate="useTemplate"
      :jenkinsEnabled="jenkinsEnabled"
      :buildConfigData="buildConfig"
      :serviceTargets="serviceTargets"
      :mini="mini"
      :fromServicePage="fromServicePage"
    >
      <template v-if="canSelectBuildName" v-slot:buildName>
        <el-form-item :label="$t(`build.buildName`)" prop="name">
          <el-select
            v-model="buildConfig.name"
            :placeholder="$t(`build.buildName`)"
            :disabled="isEdit"
            size="small"
            @change="loadBuild"
            allow-create
            filterable
            clearable
          >
            <el-option v-for="item in buildNames" :key="item" :label="item" :value="item"></el-option>
            <el-option v-if="!buildNames.includes(defaultBuildName)" :label="defaultBuildName" :value="defaultBuildName"></el-option>
          </el-select>
        </el-form-item>
      </template>
    </ZadigBuild>
    <slot name="footer">
      <footer class="create-footer">
        <el-button
          class="save-btn"
          type="primary"
          size="small"
          @click="handleBuildConfig"
          :disabled="saveDisabled"
          :loading="saveLoading"
        >{{$t(`build.saveBuild`)}}</el-button>
      </footer>
    </slot>
  </div>
</template>
<script>
import ZadigBuild from '@/components/projects/build/zadigBuild.vue'
import JenkinsBuild from '@/components/projects/build/jenkinsBuild.vue'
import {
  createBuildConfigAPI,
  updateBuildConfigAPI,
  checkJenkinsConfigExistsAPI,
  getBuildConfigDetailAPI,
  getServiceTargetsAPI,
  getBuildConfigsAPI,
  queryJenkins,
  createBuildTemplateAPI
} from '@api'
import { cloneDeep } from 'lodash'

export default {
  props: {
    name: {
      type: String,
      default: ''
    }, // serviceName/Generic builds do not require a service name
    buildName: {
      type: String,
      default: ''
    }, // The build name will be available when editing the build
    isEdit: Boolean,
    followUpFn: Function,
    handlerSubmit: Function,
    saveDisabled: {
      default: false,
      type: Boolean
    },
    canSelectBuildName: {
      default: false,
      type: Boolean
    }, // Build name can be selected
    initServiceName: {
      default: true,
      type: Boolean
    }, // Pre-set service names and build names, usually passing in a service name means setting a pre-set value
    mini: {
      default: false,
      type: Boolean
    },
    fromServicePage: {
      type: Boolean,
      default: false
    },
    buildNameIndex: {
      type: Number,
      default: 0
    }
  },
  data () {
    return {
      source: 'zadig',
      jenkinsEnabled: false,
      jenkinsBuild: {},
      serviceTargets: [],
      jenkinsList: [],
      saveLoading: false,
      configDataLoading: true,
      useTemplate: false,
      buildConfig: {},
      buildInfos: []
    }
  },
  methods: {
    async handleBuildConfig () {
      const isAdd = this.canSelectBuildName
        ? this.buildNames.includes(this.buildConfig.name)
        : this.isEdit
      const reqAPI = isAdd ? updateBuildConfigAPI : createBuildConfigAPI
      const formName =
        this.source === 'zadig' ? 'zadigBuildForm' : 'jenkinsBuildRef'
      this.$refs[formName]
        .validate()
        .then(data => {
          const payload = data
          payload.source = this.source
          payload.product_name = this.projectName
          if (payload.target_repos) {
            payload.target_repos.forEach(repo => {
              delete repo.showVars
            })
          }
          this.saveLoading = true
          this.$emit('updateBtnLoading', true)
          reqAPI(payload)
            .then(() => {
              this.saveLoading = false
              this.followUpFn &&
                this.followUpFn({
                  buildName: payload.name
                })
              this.$message({
                type: 'success',
                message: this.isEdit ? this.$t(`build.prompt.buildSaved`) : this.$t(`build.prompt.buildCreated`)
              })
              this.handlerSubmit()
            })
            .catch(() => {
              this.saveLoading = false
            })
        })
        .catch(err => {
          console.log(err)
          this.saveLoading = false
        })
    },
    async saveBuildConfigToTemplate () {
      if (this.source === 'zadig') {
        const templateNames = this.$refs.zadigBuildForm.templates.map(temp => temp.name)
        this.$prompt(this.$t(`build.prompt.saveAsTemplate`), this.$t(`global.tips`), {
          confirmButtonText: this.$t(`global.confirm`),
          cancelButtonText: this.$t(`global.cancel`),
          inputValidator: input => {
            if (!input) {
              return this.$t(`build.prompt.fillInBuildTemplateName`)
            } else if (templateNames.includes(input)) {
              return this.$t(`build.prompt.templateNameIsDuplicated`)
            } else {
              return true
            }
          },
          inputPlaceholder: this.$t(`build.prompt.fillInBuildTemplateName`),
          type: 'warning'
        }).then(({ value }) => {
          this.$refs.zadigBuildForm
            .validate()
            .then(data => {
              const payload = cloneDeep(data)
              payload.name = value
              this.$emit('updateBtnLoading', true)
              createBuildTemplateAPI(payload)
                .then(() => {
                  this.$message({
                    type: 'success',
                    message: this.$t(`build.prompt.templateSaved`)
                  })
                  this.$emit('updateBtnLoading', false)
                  this.$refs.zadigBuildForm.getBuildTemplates()
                })
                .catch(() => {
                  this.$emit('updateBtnLoading', false)
                })
            })
        }).catch(() => {
          this.$message({
            type: 'info',
            message: this.$t(`build.prompt.saveAsTemplateCanceled`)
          })
        })
      }
    },
    async loadBuild (buildConfigName) {
      this.buildConfig = {
        name: buildConfigName || this.defaultBuildName
      }
      this.jenkinsBuild = {
        name: buildConfigName || this.defaultBuildName
      }

      this.configDataLoading = true
      await getServiceTargetsAPI(this.projectName).then(response => {
        this.serviceTargets = response.map(element => {
          element.key = element.service_name + '/' + element.service_module
          return element
        })
      })
      // Request existing build data: If you can select a build name, determine whether the build name belongs to an existing name, otherwise determine whether it is an edit state
      if (
        (this.canSelectBuildName &&
          this.buildNames.includes(buildConfigName)) ||
        (!this.canSelectBuildName && this.isEdit)
      ) {
        await this.getCurrentBuild(buildConfigName)
      } else {
        await this.initBuildInfo()
      }

      this.configDataLoading = false
    },
    async getCurrentBuild (buildConfigName) {
      const buildConfig = await getBuildConfigDetailAPI(
        buildConfigName,
        this.projectName
      ).catch(error => console.log(error))
      if (buildConfig) {
        buildConfig.pre_build.installs.forEach(element => {
          element.id = element.name + element.version
        })
        buildConfig.targets.forEach(t => {
          t.key = t.service_name + '/' + t.service_module
        })
        buildConfig.target_repos.forEach(t => {
          t.service.key = t.service.service_name + '/' + t.service.service_module
        })
        if (buildConfig.source === 'jenkins') {
          this.source = 'jenkins'
          this.jenkinsBuild = buildConfig
        }
        if (!buildConfig.timeout) {
          this.$set(buildConfig, 'timeout', 60)
        }
        if (buildConfig.template_id) {
          this.useTemplate = true
        }

        if (buildConfig.target_repos) {
          buildConfig.target_repos.forEach(repo => {
            this.$set(repo, 'showVars', false)
          })
        }
        if (buildConfig.pre_build.envs) {
          buildConfig.pre_build.envs.forEach(element => {
            element.disabledKey = true
          })
        }

        this.buildConfig = buildConfig

        if (!this.isEdit) {
          const currentServices = [
            ...this.buildConfig.targets,
            ...this.serviceTargets.filter(element => {
              return element.service_module === this.name
            })
          ]
          if (this.source === 'zadig') {
            this.buildConfig.targets = currentServices
          } else if (this.source === 'jenkins') {
            this.jenkinsBuild.targets = currentServices
          }
        }
      }

      this.$refs.zadigBuildForm.initData(this.buildConfig)

      // Add current service to template targets_repos when creating a new build
      if (this.useTemplate && !this.isEdit) {
        const service = this.buildConfig.targets.find(
          element => element.service_module === this.name
        )
        if (service) {
          this.buildConfig.target_repos.push({
            service: service,
            repos: [{
              codehost_id: null,
              repo_owner: '',
              repo_name: '',
              branch: '',
              checkout_path: '',
              remote_name: 'origin',
              submodules: false
            }],
            envs: [],
            showVars: false
          })
        }
        this.$refs.zadigBuildForm.initServiceRepoSelectData(this.buildConfig)
      }
    },
    async initBuildInfo () {
      const currentService = this.serviceTargets.filter(element => {
        return element.service_module === this.name
      })
      this.$set(this.buildConfig, 'targets', currentService)
      this.$set(this.jenkinsBuild, 'targets', currentService)

      this.$nextTick(() => {
        this.$refs.zadigBuildForm.initData()
      })
    },
    async initGlobalData () {
      // existed jenkins
      checkJenkinsConfigExistsAPI().then(res => {
        this.jenkinsEnabled = res.exists
      })
      // get all builds of the current project
      return await getBuildConfigsAPI(this.projectName).then(res => {
        this.buildInfos = res
      })
    },
    async getJenkins () {
      const key = this.$utils.rsaEncrypt()
      const res = await queryJenkins(key).catch(error => console.log(error))
      if (res) {
        this.jenkinsList = res
      }
    }
  },
  computed: {
    projectName () {
      return this.$route.params.project_name
    },
    buildNames () {
      return this.buildInfos.map(build => build.name)
    },
    buildServices () {
      const target = this.buildInfos.find(
        build => build.name === this.buildConfig.name
      )
      if (target) {
        return target.targets.map(tar => {
          this.$set(tar, 'key', `${tar.service_name}/${tar.service_module}`)
          return tar
        })
      } else {
        return []
      }
    },
    defaultBuildName () {
      return this.initServiceName
        ? `${this.projectName}-build-${this.name}${
          this.buildNameIndex ? '-' + this.buildNameIndex : ''
        }`
        : ''
    },
    originOptions () {
      return [
        {
          value: 'zadig',
          label: this.$t(`build.buildTypeZadig`)
        },
        {
          value: 'jenkins',
          label: this.$t(`build.buildTypeJenkins`)
        }
      ]
    }
  },
  watch: {
    name: {
      handler () {
        this.loadBuild(this.buildName)
      }
    },
    source: {
      handler (val) {
        if (val === 'jenkins') {
          this.getJenkins()
        }
      }
    }
  },
  created () {
    this.initGlobalData().then(() => {
      this.loadBuild(this.buildName)
    })
  },
  components: {
    JenkinsBuild,
    ZadigBuild
  }
}
</script>
<style lang="less" scoped>
@inputWidth: 400px;
@labelColor: #000;
@labelWeight: 300;
@formItemBottom: 8px;

.build-config-container {
  // position: relative;
  flex: 1;
  box-sizing: border-box;
  height: calc(~'100% - 50px');
  margin-right: -3px;
  padding-top: 2px;
  padding-bottom: 50px;
  overflow: auto;
  background-color: @globalBackgroundColor;

  .create-footer {
    position: absolute;
    right: 0;
    bottom: 0;
    left: 0;
    height: 50px;
    background-color: #fff;

    .save-btn {
      margin-top: 10px;
      margin-left: 20px;
    }
  }

  .build-source {
    padding: 16px 40px @formItemBottom;
    white-space: nowrap;
    background-color: #fff;
    border-start-start-radius: 6px;
    border-start-end-radius: 6px;

    &.small-padding {
      padding: 10px 10px @formItemBottom;
    }

    .build-source-title {
      display: inline-block;
      width: 116px;
      color: @labelColor;
      font-weight: @labelWeight;
      font-size: 14px;
    }

    /deep/.el-select {
      width: @inputWidth;
      max-width: calc(~'100% - 130px');
    }
  }
}
</style>
