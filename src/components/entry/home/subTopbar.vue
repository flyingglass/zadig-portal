<template>
  <div class="subtopbar-container">
    <div class="nav-container">
      <div class="nav-content">
        <ul class="nav-item-list">
          <router-link
            v-hasPermi="{projectName: projectName, action: 'get_workflow'}"
            active-class="active"
            :to="`/v1/projects/detail/${projectName}/pipelines`"
          >
            <li class="nav-item">
              <i class="icon iconfont icongongzuoliucheng"></i>
              <span class="name">{{$t('subTopbarMenu.workflows')}}</span>
            </li>
          </router-link>
          <router-link
            v-hasPermi="{projectName: projectName, action: 'get_environment'}"
            active-class="active"
            :to="`/v1/projects/detail/${projectName}/envs`"
          >
            <li class="nav-item">
              <i class="icon iconfont iconvery-environ"></i>
              <span class="name">{{$t('subTopbarMenu.environments')}}</span>
            </li>
          </router-link>

          <el-dropdown v-if="deployType==='k8s' || deployType==='helm'"  v-hasPermi="{projectName: projectName, action: 'get_service'}" placement="bottom" trigger="hover">
            <li class="nav-item" :class="{'active':$route.path === `/v1/projects/detail/${projectName}/services` || $route.path === `/v1/projects/detail/${projectName}/services/production`}"
              @click="$router.push(`/v1/projects/detail/${projectName}/services`)">
              <i class="icon iconfont iconvery-service"></i>
              <span class="name">{{$t('subTopbarMenu.services')}}</span>
            </li>
            <el-dropdown-menu slot="dropdown" class="project-config">
              <el-dropdown-item v-hasPermi="{projectName: projectName, action: 'get_service', isBtn: true}" @click.native="$router.push(`/v1/projects/detail/${projectName}/services`)">
                {{$t('subTopbarMenu.testServices')}}
              </el-dropdown-item>
              <el-tooltip effect="dark" placement="top">
                <div slot="content">
                  {{$t(`global.enterprisefeaturesReferforDetails`)}}
                  <el-link
                    style="font-size: 13px; vertical-align: baseline;"
                    type="primary"
                    :href="`https://docs.koderover.com/project/service/${deployType}/prod/`"
                    :underline="false"
                    target="_blank"
                  >{{$t(`global.document`)}}</el-link>
                </div>
                <el-dropdown-item style="color: #a0a0a0;">
                  {{$t('subTopbarMenu.productionServices')}}
                </el-dropdown-item>
              </el-tooltip>
            </el-dropdown-menu>
          </el-dropdown>
          <router-link
            v-else
            v-hasPermi="{projectName: projectName, action: 'get_service'}"
            active-class="active"
            :to="`/v1/projects/detail/${projectName}/services`"
          >
            <li class="nav-item">
              <i class="icon iconfont iconvery-service"></i>
              <span class="name">{{$t('subTopbarMenu.services')}}</span>
            </li>
          </router-link>
          <router-link
            v-hasPermi="{projectName: projectName, action: 'get_build'}"
            active-class="active"
            :to="`/v1/projects/detail/${projectName}/builds`"
          >
            <li class="nav-item">
              <i class="icon iconfont iconvery-build"></i>
              <span class="name">{{$t('subTopbarMenu.builds')}}</span>
            </li>
          </router-link>
          <router-link
            v-hasPermi="{projectName: projectName, action: 'get_test'}"
            active-class="active"
            :to="`/v1/projects/detail/${projectName}/test`"
          >
            <li class="nav-item">
              <i class="icon iconfont iconvery-testing"></i>
              <span class="name">{{$t('subTopbarMenu.tests')}}</span>
            </li>
          </router-link>
          <router-link
            v-hasPermi="{projectName: projectName, action: 'get_scan'}"
            active-class="active"
            :to="`/v1/projects/detail/${projectName}/scanner`"
          >
            <li class="nav-item">
              <i class="icon iconfont iconvery-scanner"></i>
              <span class="name">{{$t('subTopbarMenu.scannings')}}</span>
            </li>
          </router-link>
          <el-tooltip v-if="deployType === 'helm' ||deployType === 'k8s' " effect="dark" placement="top">
            <div slot="content">
              {{$t(`global.enterprisefeaturesReferforDetails`)}}
              <el-link
                style="font-size: 13px; vertical-align: baseline;"
                type="primary"
                :href="`https://docs.koderover.com/project/version/`"
                :underline="false"
                target="_blank"
              >{{$t(`global.document`)}}</el-link>
            </div>
            <li class="nav-item disabled">
              <i class="icon iconfont iconvery-versionmana"></i>
              <span class="name">{{$t('subTopbarMenu.versions')}}</span>
            </li>
          </el-tooltip>
        </ul>
      </div>
    </div>
    <div class="operation">
      <template v-if="$route.path === `/v1/projects/detail/${projectName}/pipelines`">
        <el-button
          v-hasPermi="{projectName: projectName, action: 'create_workflow',isBtn:true}"
          @click="bindComp(comp,'workflow')"
          icon="el-icon-plus"
          plain
        >{{$t('subTopbarMenu.createWorkflow')}}</el-button>
      </template>
      <template v-if="$route.path === `/v1/projects/detail/${projectName}/envs/detail`">
        <el-dropdown v-if="deployType !=='cloud_host'" placement="bottom" trigger="click">
          <button v-hasPermi="{projectName: projectName, action: 'create_environment',isBtn:true}" type="button" class="display-btn el-button">
            <i class="el-icon-plus"></i>
            &nbsp;&nbsp;{{$t('subTopbarMenu.createEnvironment')}}&nbsp;&nbsp;
            <i class="el-icon-caret-bottom el-icon--right"></i>
          </button>
          <el-dropdown-menu slot="dropdown" class="project-config">
            <el-dropdown-item
              @click.native="bindComp(comp,'env')"
            >{{$t('subTopbarMenu.testEnvironment')}}
            </el-dropdown-item>
            <el-tooltip  effect="dark" placement="top">
              <div slot="content">
                {{$t(`global.enterprisefeaturesReferforDetails`)}}
                <el-link
                  style="font-size: 13px; vertical-align: baseline;"
                  type="primary"
                  :href="docLink[deployType]"
                  :underline="false"
                  target="_blank"
                >{{$t(`global.document`)}}</el-link>
              </div>
             <el-dropdown-item style="color: #a0a0a0;">
              {{$t('subTopbarMenu.productionEnvironment')}}
            </el-dropdown-item>
          </el-tooltip>
          </el-dropdown-menu>
        </el-dropdown>
        <template v-else>
          <el-button
            v-hasPermi="{projectName: projectName, action: 'create_environment',isBtn:true}"
            @click="bindComp(comp, 'env')"
            icon="el-icon-plus"
            plain
          >{{$t('subTopbarMenu.createEnvironment')}}</el-button>
        </template>
      </template>
      <template v-if="$route.path === `/v1/projects/detail/${projectName}/builds`">
        <el-button
          v-hasPermi="{projectName: projectName, action: 'create_build',isBtn:true}"
          @click="bindComp(comp,'build')"
          icon="el-icon-plus"
          plain
        >{{$t('subTopbarMenu.createBuild')}}</el-button>
      </template>
      <template v-if="$route.path === `/v1/projects/detail/${projectName}/test`">
        <el-button
          v-hasPermi="{projectName: projectName, action: 'create_test',isBtn:true}"
          @click="bindComp(comp,'test')"
          icon="el-icon-plus"
          plain
        >{{$t('subTopbarMenu.createTest')}}</el-button>
      </template>
      <template v-if="$route.path === `/v1/projects/detail/${projectName}/scanner`">
        <el-button
          v-hasPermi="{projectName: projectName, action: 'create_scan',isBtn:true}"
          @click="bindComp(comp,'scanner')"
          icon="el-icon-plus"
          plain
        >{{$t('subTopbarMenu.createScanner')}}</el-button>
      </template>
      <template v-if="comp && comp.isProjectAdmin && $route.path === `/v1/projects/detail/${projectName}/detail`">
        <el-button v-if="deployType === 'external'" type="text" disabled>
          <el-tooltip effect="dark" placement="top">
            <div slot="content">
              <span>{{ $t('global.enterprisefeaturesReferforDetails') }}</span>
              <el-link
                style="font-size: 13px; vertical-align: baseline;"
                type="primary"
                href="https://docs.koderover.com/zadig/project/host-k8s-resources/#托管项目切换-k8s-yaml-项目"
                :underline="false"
                target="_blank"
              >{{$t(`global.document`)}}</el-link>
            </div>
            <span>{{$t('subTopbarMenu.changeProjectType')}}</span>
          </el-tooltip>
        </el-button>
        <el-dropdown
          placement="bottom"
          trigger="click"
        >
          <button type="button" class="display-btn el-button">
            <i class="iconfont iconvery-options el-icon--left"></i>
            &nbsp;&nbsp;{{$t('subTopbarMenu.projectConfig')}}&nbsp;&nbsp;
            <i class="el-icon-caret-bottom el-icon--right"></i>
          </button>
          <el-dropdown-menu slot="dropdown" class="project-config">
            <el-dropdown-item
              icon="el-icon-edit-outline"
              @click.native="$router.push(`/v1/projects/edit/${projectName}`)"
            >{{$t('subTopbarMenu.editProject')}}</el-dropdown-item>
            <el-dropdown-item v-if="deployType === 'cloud_host'" @click.native="$router.push(`/v1/projects/detail/${projectName}/host`)">
              <i class="iconfont iconwuliji"></i>
              {{$t('subTopbarMenu.hostManagement')}}
            </el-dropdown-item>
            <el-dropdown-item
              icon="el-icon-lock"
              @click.native="$router.push(`/v1/projects/detail/${projectName}/rbac`)"
            >{{$t('subTopbarMenu.projectPermission')}}</el-dropdown-item>
            <el-dropdown-item
              v-if="deployType !== 'cloud_host'"
              icon="item-icon iconfont iconvery-collaboratiom"
              @click.native="$router.push(`/v1/projects/detail/${projectName}/policy`)"
            >{{$t('subTopbarMenu.projectCollaborationMode')}}</el-dropdown-item>
            <el-dropdown-item
              v-if="deployType === 'helm'"
              icon="item-icon iconfont iconchakanbianliang"
              disabled
              style="pointer-events: auto;"
            >
              <el-tooltip effect="dark" placement="top">
                <div slot="content">
                  <span>{{ $t('global.enterprisefeaturesReferforDetails') }}</span>
                  <el-link
                    style="font-size: 13px; vertical-align: baseline;"
                    type="primary"
                    href="https://docs.koderover.com/zadig/project/config/#变量组"
                    :underline="false"
                    target="_blank"
                  >{{$t(`global.document`)}}</el-link>
                </div>
                <span>{{$t('subTopbarMenu.varsGroup')}}</span>
              </el-tooltip>
            </el-dropdown-item>
            <el-dropdown-item icon="el-icon-delete" @click.native="comp.deleteProject">{{$t(`global.delete`)}}</el-dropdown-item>
          </el-dropdown-menu>
        </el-dropdown>
      </template>
    </div>
  </div>
</template>
<script>
export default {
  data () {
    return {
      docLink: {
        k8s: 'https://docs.koderover.com/project/env/k8s/',
        helm: 'https://docs.koderover.com/project/env/helm/chart/',
        external: 'https://docs.koderover.com/project/env/k8s/host/'
      }
    }
  },
  props: {
    projectName: {
      type: String,
      required: true
    },
    comp: {
      required: false
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
  methods: {
    bindComp (comp, type) {
      if (type === 'workflow') {
        comp.showSelectWorkflowType = true
      } else if (type === 'env') {
        this.$router.push(`/v1/projects/detail/${this.projectName}/envs/create`)
      } else if (type === 'build') {
        this.$router.push(
          `/v1/projects/detail/${this.projectName}/builds/create`
        )
      } else if (type === 'test') {
        this.$router.push(
          `/v1/projects/detail/${this.projectName}/test/add/function`
        )
      } else if (type === 'scanner') {
        this.$router.push(
          `/v1/projects/detail/${this.projectName}/scanner/create`
        )
      } else if (type === 'version') {
        this.$router.push(
          `/v1/projects/detail/${this.projectName}/version/create`
        )
      }
    }
  }
}
</script>
<style lang="less">
.subtopbar-container {
  position: relative;
  z-index: 2;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  height: 60px;
  padding-left: 26px;
  background-color: #fff;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.1);

  .nav-container {
    .nav-content {
      .nav-item-list {
        display: flex;

        .active {
          box-shadow: inset 0 -2px 0 @themeColor;

          .nav-item {
            .icon {
              color: @themeColor;
            }
          }
        }

        .nav-item {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          height: 42px;
          padding: 9px 12px;
          color: #000;
          font-weight: 300;
          font-size: 16px;
          line-height: 22px;
          cursor: pointer;

          .icon {
            margin-right: 18px;
            color: #d2d2d2;
            font-size: 22px;
          }

          &.active {
            box-shadow: inset 0 -2px 0 @themeColor;

            .icon {
              color: @themeColor;
            }
          }

          a {
            margin-right: 16px;

            &.active {
              box-shadow: inset 0 -2px 0 @themeColor;

              .icon {
                color: @themeColor;
              }
            }
          }
        }
      }
    }
  }

  .operation {
    display: flex;
    margin-right: 80px;

    .el-button:not(.el-button--text) {
      padding: 10px 15px;
      color: @themeColor;
      font-weight: 400;
      border: 1px solid @themeColor;
      border-radius: 4px;
      box-shadow: 0 4px 4px rgba(0, 0, 0, 0.05);
    }

    .el-button--text {
      margin-right: 10px;
    }

    .display-btn {
      padding: 10px 15px;
      color: @themeColor;
      font-weight: 400;
      font-size: 14px;
      background-color: #fff;
      border: 1px solid @themeColor;
      border-radius: 4px;
      box-shadow: 0 4px 4px rgba(0, 0, 0, 0.05);
      cursor: pointer;
    }
  }
}

.el-dropdown-menu.el-popper.project-config {
  margin-top: 2px;

  .el-dropdown-menu__item {
    margin: 0 10px;
    padding: 0 10px;
    font-weight: 300;
    border-radius: 6px;

    .item-icon {
      font-size: 14px;
    }
  }

  .popper__arrow {
    display: none;
  }
}
</style>
