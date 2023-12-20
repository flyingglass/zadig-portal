<template>
  <div class="project-home-container">
    <div class="project-header">
      <div class="header-start">
        <i class="el-icon-menu display-btn" @click="changeTab('grid')" :class="{'active':currentTab==='grid'}"></i>
        <i class="el-icon-s-fold display-btn" @click="changeTab('list')" :class="{'active':currentTab==='list'}"></i>
      </div>
      <div class="header-end">
        <el-input v-model.trim="projectKeyword" :placeholder="$t(`project.searchProject`)" class="search-input" prefix-icon="el-icon-search" size="medium" @input="searchProject" />
        <el-button
          v-hasPermi="{type: 'system', action: 'create_project'}"
          @click="$router.push(`/v1/projects/create`)"
          style="width: 132px; margin-right: 10px;"
          plain
        >
          <i class="el-icon-plus"></i>&nbsp;&nbsp;&nbsp;&nbsp;{{$t(`project.newProject`)}}&nbsp;&nbsp;
        </el-button>
        <template>
          <el-dropdown placement="bottom" trigger="hover" v-hasPermi="{type: 'system', action: 'get_template'}">
            <button type="button" class="display-btn el-button">
              <i class="iconfont iconvery-template el-icon--left"></i>
              &nbsp;&nbsp;{{$t(`project.templates`)}}&nbsp;&nbsp;
              <i class="el-icon-caret-bottom el-icon--right"></i>
            </button>
            <el-dropdown-menu slot="dropdown" class="template-config">
              <el-dropdown-item icon="iconfont iconvery-k8s" @click.native="$router.push(`/v1/template/k8s-yamls`)">K8s YAML</el-dropdown-item>
              <el-dropdown-item icon="iconfont iconhelmrepo" @click.native="$router.push(`/v1/template/charts`)">Helm Chart</el-dropdown-item>
              <el-dropdown-item icon="iconfont icondocker" @click.native="$router.push(`/v1/template/dockerfiles`)">Dockerfile</el-dropdown-item>
              <el-dropdown-item
                icon="iconfont iconvery-build"
                @click.native="$router.push(`/v1/template/builds`)"
              >{{$t(`project.buildTemplate`)}}</el-dropdown-item>
              <el-tooltip class="item" effect="dark" placement="top">
                <div slot="content">
                  {{$t(`global.enterprisefeaturesReferforDetails`)}}
                  <el-link
                    style="font-size: 13px; vertical-align: baseline;"
                    type="primary"
                    :href="`https://docs.koderover.com/template/workflow/`"
                    :underline="false"
                    target="_blank"
                  >{{$t(`global.document`)}}</el-link>
                </div>
                <el-dropdown-item
                  style="color: #ddd;"
                  icon="iconfont icongongzuoliucheng"
                >{{$t(`project.workflowTemplate`)}}</el-dropdown-item>
              </el-tooltip>
            </el-dropdown-menu>
          </el-dropdown>
        </template>
      </div>
    </div>
    <div
      v-if="currentTab==='grid'"
      class="projects-grid"
    >
      <el-row :gutter="12" class="infinite-wrapper">
        <el-col v-for="(project,index) in projectList" :key="index" :xs="12" :sm="8" :md="6" :lg="6" :xl="4">
          <el-card shadow="hover" class="project-card">
            <div class="operations" v-hasPermi="{type: 'system', actions: ['edit_project','delete_project'],operator:'or',projectName: project.name}">
              <el-dropdown @command="handleCommand" trigger="click">
                <span class="el-dropdown-link">
                  <i class="el-icon-more"></i>
                </span>
                <el-dropdown-menu slot="dropdown">
                  <el-dropdown-item v-hasPermi="{type: 'system', action: 'edit_project', projectName: project.name}" :command="{action:'edit',projectName:project.name}">{{$t(`project.editProject`)}}</el-dropdown-item>
                  <el-dropdown-item v-hasPermi="{type: 'system', action: 'delete_project'}" :command="{action:'delete',projectName:project.name,projectAlias:project.alias}">{{$t(`global.delete`)}}</el-dropdown-item>
                </el-dropdown-menu>
              </el-dropdown>
            </div>
            <div @click="toProject(project)" class="content-container">
              <h4 class="project-name">
                <i class="type-icon iconfont" :class="projectIconMap[project.deployType]"></i>
                <el-tooltip effect="dark" :content="project.alias?project.alias:project.name" placement="top">
                  <span class="name">{{project.alias?project.alias:project.name}}</span>
                </el-tooltip>
                <el-tooltip v-if="!project.public" effect="dark" :content="$t(`project.privateProject`)" placement="top">
                  <i class="icon iconfont iconprivate"></i>
                </el-tooltip>
              </h4>
              <div class="project-desc">{{project.desc}}</div>
            </div>
            <div class="footer">
              <el-tooltip effect="dark" :content="$t(`project.workflows`)" placement="top">
                <span @click="$router.push(`/v1/projects/detail/${project.name}/pipelines`)" class="icon iconfont icongongzuoliucheng"></span>
              </el-tooltip>
              <el-tooltip effect="dark" :content="$t(`project.environments`)" placement="top">
                <span @click="$router.push(`/v1/projects/detail/${project.name}/envs`)" class="icon iconfont iconvery-environ"></span>
              </el-tooltip>
              <el-tooltip effect="dark" :content="$t(`project.tests`)" placement="top">
                <span @click="$router.push(`/v1/projects/detail/${project.name}/test`)" class="icon iconfont iconvery-testing"></span>
              </el-tooltip>
              <el-tooltip effect="dark" :content="$t(`project.services`)" placement="top">
                <span @click="$router.push(`/v1/projects/detail/${project.name}/services`)" class="icon iconfont iconvery-service"></span>
              </el-tooltip>
            </div>
          </el-card>
        </el-col>
        <infinite-loading v-if="projectKeyword === ''" @infinite="infiniteHandler" spinner="waveDots" :identifier="infiniteId" force-use-infinite-wrapper=".infinite-wrapper">
          <div slot="no-more">
           <span style="color: #ccc; font-size: 13px;">{{$t(`project.allProjectsHaveBeenLoaded`)}}</span>
          </div>
        </infinite-loading>
      </el-row>
      <div v-if="!loading && projectList.length === 0" class="empty-list">
        <img src="@assets/icons/illustration/project.svg" alt />
        <p>{{$t(`project.noProjects`)}}</p>
      </div>
    </div>
    <div
      v-if="currentTab==='list'"
      class="projects-list"
    >
      <el-table v-if="projectList.length > 0" :data="projectList" stripe style="width: 100%;">
        <el-table-column :label="$t(`project.projectName`)">
          <template slot-scope="scope">
            <router-link :to="`/v1/projects/detail/${scope.row.name}/detail`" class="project-name">
              {{scope.row.alias?scope.row.alias:scope.row.name }}
              <el-tooltip v-if="!scope.row.public" effect="dark" :content="$t(`project.privateProject`)" placement="top">
                <i class="icon iconfont iconprivate"></i>
              </el-tooltip>
            </router-link>
          </template>
        </el-table-column>
        <el-table-column prop="envs" :label="$t(`project.environmentCounts`)">
          <template slot-scope="scope">{{scope.row.envs.length}}</template>
        </el-table-column>
        <el-table-column :label="$t(`project.updates`)">
          <template slot-scope="scope">
            <div>
              <i class="el-icon-time"></i>
              {{ $utils.convertTimestamp(scope.row.updatedAt || '') }}
            </div>
            <div>
              <i class="el-icon-user"></i>
              {{ scope.row.updatedBy || '' }}
            </div>
          </template>
        </el-table-column>
        <el-table-column label>
          <template slot-scope="scope">
            <div v-hasPermi="{type: 'system', actions: ['edit_project','delete_project'],operator:'or', projectName: scope.row.name}">
              <router-link v-hasPermi="{type: 'system', action: 'edit_project', projectName: scope.row.name}" :to="`/v1/projects/detail/${scope.row.name}/detail`">
                <el-button class="operation" type="text">{{$t(`project.projectDetail`)}}</el-button>
              </router-link>
              <el-button v-hasPermi="{type: 'system', action: 'delete_project'}" @click="deleteProject(scope.row.name,scope.row.alias)" class="operation" type="text">{{$t(`global.delete`)}}</el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>
      <div v-if="projectList.length > 0" class="project-pagination">
        <el-pagination background
                       @current-change="handleCurrentPageChange"
                       :current-page="pageNum"
                       :page-sizes="[10, 20,30, 40]"
                       :page-size="pageSize"
                       layout="total,prev, pager, next, jumper"
                       :total="totalProjects">
      </el-pagination>
      </div>
      <div v-if="projectList.length === 0 && !loading" class="empty-list">
        <img src="@assets/icons/illustration/project.svg" alt />
        <p>{{$t(`project.noProjects`)}}</p>
      </div>
    </div>
    <DeleteProject ref="deleteProject" :followUpFn="followUpFn" />
  </div>
</template>
<script>
import InfiniteLoading from 'vue-infinite-loading'
import DeleteProject from './components/deleteProject.vue'
import bus from '@utils/eventBus'
import { isMobile } from 'mobile-device-detect'
import store from 'storejs'
import { getProjectsAPI } from '@api'
import { debounce } from 'lodash'
export default {
  data () {
    return {
      loading: true,
      currentTab: 'grid',
      infiniteId: +new Date(),
      projectIconMap: {
        k8s: 'iconk8s',
        helm: 'iconhelmrepo',
        external: 'iconvery-trustee',
        cloud_host: 'iconwuliji'
      },
      projectKeyword: '',
      totalProjects: null,
      pageSize: 16,
      pageNum: 1,
      projectList: []
    }
  },
  methods: {
    changeTab (tab) {
      // this.projectList = []
      this.currentTab = tab
      if (tab === 'list') {
        this.projectList = []
        this.pageSize = 16
        this.pageNum = 1
        this.getProjectList(this.pageNum, this.pageSize, this.projectKeyword)
      } else if (tab === 'grid') {
        this.infiniteId += 1
        this.projectList = []
        this.pageSize = 16
        this.pageNum = 1
      }
    },
    toProject (project) {
      this.$router.push(`/v1/projects/detail/${project.name}/detail`)
    },
    handleCommand (command) {
      if (command.action === 'delete') {
        this.deleteProject(command.projectName, command.projectAlias)
      } else if (command.action === 'edit') {
        this.$router.push(`/v1/projects/edit/${command.projectName}`)
      }
    },
    followUpFn () {
      if (this.currentTab === 'grid') {
        this.resetInfiniteLoading()
      } else if (this.currentTab === 'list') {
        this.getProjectList(this.pageNum, this.pageSize, this.projectKeyword)
      }
    },
    deleteProject (projectName, projectAlias) {
      this.$refs.deleteProject.openDialog(projectName, projectAlias)
    },
    redirectByDevice () {
      const userInfo = store.get('userInfo')
      if (isMobile && userInfo) {
        if (!window.location.pathname.includes('/mobile')) {
          this.$router.push('/mobile/projects')
        }
      }
    },
    searchProject: debounce(function (val) {
      if (this.currentTab === 'grid') {
        if (val !== '') {
          this.projectList = []
          const pageNum = 1
          const pageSize = 9999
          this.getProjectList(pageNum, pageSize, val)
        } else {
          this.resetInfiniteLoading()
        }
      } else if (this.currentTab === 'list') {
        this.projectList = []
        const pageNum = this.pageNum
        const pageSize = this.pageSize
        this.getProjectList(pageNum, pageSize, val)
      }
    }, 200),
    async getProjectList (pageNum, pageSize, projectKeyword) {
      const res = await getProjectsAPI(pageNum, pageSize, projectKeyword)
      if (res) {
        this.totalProjects = res.total
        this.projectList = res.projects
      }
    },
    handleCurrentPageChange (val) {
      this.pageNum = val
      this.getProjectList(this.pageNum, this.pageSize, this.projectKeyword)
    },
    resetInfiniteLoading () {
      this.pageNum = 1
      this.projectList = []
      this.infiniteId += 1
    },
    infiniteHandler ($state) {
      if (this.currentTab === 'grid' && this.projectKeyword === '') {
        const pageSize = this.pageSize
        const pageNum = this.pageNum
        const projectKeyword = this.projectKeyword
        getProjectsAPI(pageNum, pageSize, projectKeyword).then((res) => {
          this.loading = false
          this.totalProjects = res.total
          if (this.projectList.length !== res.total) {
            this.pageNum = this.pageNum + 1
            this.projectList = this.projectList.concat(res.projects)
            $state.loaded()
          } else {
            $state.complete()
          }
        })
      }
    }
  },
  mounted () {
    bus.$emit('set-topbar-title', { title: '', breadcrumb: [{ title: this.$t(`sidebarMenu.projects`), url: '' }] })
    // Compatible with non-system login
    this.redirectByDevice()
  },
  components: {
    InfiniteLoading,
    DeleteProject
  }
}
</script>

<style lang="less" >
.project-home-container {
  position: relative;
  flex: 1;
  height: 100%;
  overflow: auto;
  background-color: @globalBackgroundColor;

  .empty-list {
    display: flex;
    flex-direction: column;
    align-content: center;
    align-items: center;
    justify-content: center;
    height: 70%;

    img {
      width: 400px;
      height: 400px;
    }

    p {
      color: #606266;
      font-size: 15px;
    }
  }

  .project-header {
    position: relative;
    z-index: 1;
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 60px;
    padding-right: 80px;
    padding-left: 26px;
    background: #fff;

    .header-start {
      flex: 0 0 auto;
      padding: 5px 10px;
      font-size: 20px;
      background-color: #fff;
      border: 1px solid @borderGray;
      border-radius: 4px;
      box-shadow: 0 0 4px rgba(0, 0, 0, 0.05);

      .display-btn {
        color: @fontGray;
        cursor: pointer;

        &:not(:last-child) {
          margin-right: 8px;
        }

        &:hover,
        &.active {
          color: @themeColor;
        }
      }
    }

    .header-end {
      display: flex;
      justify-content: flex-end;
      min-width: 510px;

      .search-input {
        width: 210px;
        margin-right: 10px;

        .el-input__inner {
          border-color: @themeColor;
        }
      }

      .el-button {
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

      .iconfont {
        font-size: 14px;
      }
    }
  }

  .projects-list {
    height: calc(~'100% - 60px');
    padding: 0 20px;

    .el-table {
      .project-name {
        color: @projectNameColor;
        font-weight: 400;
        font-size: 16px;
        line-height: 22px;
        text-align: left;

        .iconprivate::before {
          color: #c8c9cc;
        }
      }

      .operation {
        margin-right: 10px;
        color: #606266;

        &:hover {
          color: @themeColor;
        }
      }
    }
  }

  .projects-grid {
    height: calc(~'100% - 84px');
    padding: 12px;

    .project-card {
      height: 142px;
      margin-bottom: 12px;
      border: 2px solid #fff;
      border-radius: 6px;
      box-shadow: unset;

      &:hover {
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        cursor: pointer;
      }

      .el-card__body {
        position: relative;
        display: flex;
        flex-direction: column;
        box-sizing: border-box;
        height: 100%;
        padding: 15px;

        &.add {
          font-size: 30px;
          text-align: center;

          .text {
            margin: auto 0;
            padding: 40px;

            a {
              color: #7a8599;
            }

            span {
              cursor: pointer;
            }
          }
        }

        .operations {
          position: absolute;
          top: 8px;
          right: 15px;
          display: flex;
          cursor: pointer;

          i {
            color: #888;
            font-size: 20px;
            line-height: 25px;
          }
        }

        .footer {
          display: flex;
          flex-direction: row;
          align-self: flex-end;
          justify-content: flex-end;
          width: 100%;
          height: 28px;

          .icon {
            margin-left: 18px;
            color: @themeColor;
            font-size: 18px;
            line-height: 35px;
            cursor: pointer;
          }

          .operation {
            border-left: 2px solid #ebeef5;
          }
        }

        .content-container {
          flex: 1;
          height: calc(~'100% - 35px');

          .divider {
            width: 278px;
            height: 1px;
            margin-top: 14px;
            margin-bottom: 8px;
            background-color: #ccc;
          }

          .project-name {
            margin: 0;
            padding: 0;
            padding-right: 15px;
            color: @projectNameColor;
            font-weight: 400;
            font-size: 18px;
            line-height: 22px;
            cursor: pointer;

            .type-icon {
              margin-right: 6px;
              color: @themeColor;
              font-size: 20px;
              vertical-align: top;
            }

            .name {
              display: inline-block;
              max-width: calc(100% - 40px);
              overflow: hidden;
              white-space: nowrap;
              text-overflow: ellipsis;
            }

            .iconprivate::before {
              color: #c8c9cc;
            }
          }

          .icon {
            margin-left: 6px;
            color: @fontLightGray;
            vertical-align: top;
          }

          .project-desc {
            max-height: calc(100% - 32px);
            overflow: auto;
            font-size: 12px;
            line-height: 22px;
          }
        }
      }
    }
  }
}

.el-message-box.product-prompt {
  width: 40%;

  .el-message-box__content {
    max-height: 300px;
    overflow-y: auto;
  }
}

.el-dropdown-menu.el-popper.template-config {
  margin-top: 2px;

  .el-dropdown-menu__item {
    margin: 0 10px;
    padding: 0 10px;
    font-weight: 400;
    border-radius: 6px;
  }

  .popper__arrow {
    display: none;
  }
}
</style>
