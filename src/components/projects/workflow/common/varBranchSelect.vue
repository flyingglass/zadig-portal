<template>
  <div class="var-branch-select">
    <el-row>
      <el-col :span="12">
        <el-input
          v-if="repoInfo.source==='other'"
          style="width: 100%;"
          v-model="repoInfo.branchOrTag.name"
          :placeholder="$t(`repository.prompt.inputBranchOrTag`)"
          size="small"
        ></el-input>
        <el-select
          v-else
          style="width: 100%;"
          v-model="repoInfo.branchOrTag"
          remote
          :remote-method="(query)=>{searchRepoInfo(repoInfo,query)}"
          @clear="searchRepoInfo(repoInfo,'')"
          filterable
          clearable
          size="small"
          value-key="id"
          :placeholder="$t(`repository.prompt.chooseBranchOrTag`)"
          @change="changeBranchOrTag(repoInfo)"
        >
          <el-option-group v-for="group in repoInfo.branchAndTagList" :key="group.label" :label="group.label">
            <el-option v-for="(item, index) in group.options" :key="index" :label="item.name" :value="item">
              <span
                v-if="item.id.startsWith('addTag')||item.id.startsWith('addBranch')"
              >{{`${$t('repository.prompt.usePRorTagTemplate')}"${item.name}"`}}</span>
              <span v-else>{{item.name}}</span>
            </el-option>
          </el-option-group>
        </el-select>
      </el-col>
      <el-col :span="11" :offset="0" style="margin-left: 10px;" v-if="repoInfo.source!=='other'">
        <el-select
          v-if="!$utils.isEmpty(repoInfo.branchPRsMap[repoInfo.branch])"
          style="width: 100%;"
          v-model="repoInfo.prs"
          multiple
          size="small"
          :placeholder="$t(`repository.prompt.choosePR`)"
          filterable
          clearable
          @change="changePR(repoInfo)"
          :disabled="repoInfo.branchOrTag && repoInfo.branchOrTag.type === 'tag'"
        >
          <el-tooltip
            v-for="item in repoInfo.branchPRsMap[repoInfo.branchOrTag ? repoInfo.branchOrTag.name : '']"
            :key="item[repoInfo.prNumberPropName]"
            placement="left"
            popper-class="gray-popper"
          >
            <div slot="content">
              {{`${$t('repository.info.creatorTemplate')}${$utils.tailCut(item.authorUsername,10)}`}}
              <br />
              {{`${$t('repository.info.creationTimeTemplate')}${$utils.convertTimestamp(item.createdAt)}`}}
              <br />
              {{`${$t('repository.info.sourceBranchTemplate')}${item.sourceBranch}`}}
              <br />
              {{`${$t('repository.info.targetBranchTemplate')}${item.targetBranch}`}}
            </div>
            <el-option :label="`#${item[repoInfo.prNumberPropName]} ${item.title}`" :value="item[repoInfo.prNumberPropName]"></el-option>
          </el-tooltip>
        </el-select>
        <el-tooltip v-else :content="$t(`repository.prompt.prDoesNotExist`)" placement="top" popper-class="gray-popper">
          <el-input
            style="width: 100%;"
            v-model="repoInfo.prs"
            class="short-input"
            size="small"
            @input="changePRManual(repoInfo)"
            :placeholder="$t(`repository.prompt.inputPR`)"
            :disabled="repoInfo.branchOrTag && repoInfo.branchOrTag.type === 'tag'"
          ></el-input>
        </el-tooltip>
      </el-col>
      <el-col :span="1">
        <el-tooltip v-if="repoInfo.errorMsg" class="item" effect="dark" :content="repoInfo.errorMsg" placement="top">
          <i class="el-icon-question repo-warning"></i>
        </el-tooltip>
      </el-col>
    </el-row>
  </div>
</template>
<script>
import { getAllBranchInfoAPI } from '@api'
import { cloneDeep } from 'lodash'
export default {
  name: 'VarBranchSelect',
  props: {
    originRepo: {
      type: Object,
      required: true
    }
  },
  data () {
    return {
      repoInfo: {},
      repoInfoMap: {}
    }
  },
  methods: {
    changeBranchOrTag (repoInfo) {
      if (repoInfo.branchOrTag) {
        repoInfo[repoInfo.prNumberPropName] = null
        if (repoInfo.branchOrTag.type === 'branch') {
          this.originRepo.branch = repoInfo.branchOrTag.name
          this.originRepo.tag = ''
          repoInfo.branch = repoInfo.branchOrTag.name
          repoInfo.tag = ''
        } else if (repoInfo.branchOrTag.type === 'tag') {
          this.originRepo.tag = repoInfo.branchOrTag.name
          this.originRepo.branch = ''
          repoInfo.tag = repoInfo.branchOrTag.tag
          repoInfo.branch = ''
        }
      }
    },
    changePR (repoInfo) {
      if (repoInfo.prs) {
        this.originRepo.prs = repoInfo.prs
      }
    },
    changePRManual (repoInfo) {
      if (repoInfo.prs && repoInfo.prs.split(',').length > 0) {
        this.originRepo.prs = repoInfo.prs.split(',')
      }
    },
    async searchRepoInfo (repoInfo, query) {
      const reposQuery = [
        {
          source: repoInfo.source,
          repo_owner: repoInfo.repo_owner,
          repo: repoInfo.repo_name,
          default_branch: repoInfo.branch,
          codehost_id: repoInfo.codehost_id,
          repo_namespace: repoInfo.repo_namespace,
          key: query
        }
      ]

      const payload = { infos: reposQuery }
      const res = await getAllBranchInfoAPI(payload)
      const branches = repoInfo.branchAndTagList.find(
        item => item.label === 'Branches'
      )
      const tags = repoInfo.branchAndTagList.find(item => item.label === 'Tags')
      if (repoInfo.source === 'other' && res.length === 0) {
        this.$set(res, 0, {
          branches: repoInfo.branchOrTag.type === 'branch' ? [repoInfo.branchOrTag] : [],
          tags: repoInfo.branchOrTag.type === 'tag' ? [repoInfo.branchOrTag] : []
        })
        if (query) {
          this.$set(res, 0, {
            branches: [],
            tags: []
          })
        }
      }
      if (res && res.length > 0) {
        repoInfo.loading = false
        branches.options = res[0].branches.map(item => {
          return {
            id: 'branch-' + item.name,
            name: item.name,
            type: 'branch'
          }
        })
        tags.options = res[0].tags.map(item => {
          return {
            id: 'tag-' + item.name,
            name: item.name,
            type: 'tag'
          }
        })
      } else {
        branches.options = []
        tags.options = []
      }
      if (query) {
        const queryBranchInResponse = branches.options.findIndex((element) => {
          return element.name === query && element.type === 'branch'
        })
        const queryTagInResponse = tags.options.findIndex((element) => {
          return element.name === query && element.type === 'tag'
        })
        if (queryBranchInResponse === -1) {
          branches.options.unshift({
            id: 'addBranch-' + query,
            name: query,
            type: 'branch'
          })
        }
        if (queryTagInResponse === -1) {
          tags.options.unshift({
            id: 'addTag-' + query,
            name: query,
            type: 'tag'
          })
        }
      }
    },
    getInitRepoInfo (repoInfo) {
      const reposQuery = [
        {
          source: this.repoInfo.source,
          repo_owner: this.repoInfo.repo_owner,
          repo: this.repoInfo.repo_name,
          default_branch: this.repoInfo.branch,
          codehost_id: this.repoInfo.codehost_id,
          repo_namespace: this.repoInfo.repo_namespace
        }
      ]
      getAllBranchInfoAPI({ infos: reposQuery })
        .then(res => {
          // make these repo info more friendly
          res.forEach(repo => {
            if (repo.prs) {
              repo.prs.forEach(element => {
                element.pr = element.id
              })
              repo.branchPRsMap = this.$utils.arrayToMapOfArrays(
                repo.prs,
                'targetBranch'
              )
            } else {
              repo.branchPRsMap = {}
            }
            if (repo.branches) {
              repo.branchNames = repo.branches.map(b => b.name)
            } else {
              repo.branchNames = []
            }
          })
          // and make a map
          this.repoInfoMap = this.$utils.arrayToMap(
            res,
            re => `${re.repo_owner}/${re.repo}`
          )

          this.$set(repoInfo, '_id_', `${repoInfo.repo_owner}/${repoInfo.repo_name}`)
          const curentRepoInfo = this.repoInfoMap[repoInfo._id_]
          this.$set(repoInfo, 'branchNames', curentRepoInfo && curentRepoInfo.branchNames)
          this.$set(
            repoInfo,
            'branchPRsMap',
            curentRepoInfo && curentRepoInfo.branchPRsMap
          )
          this.$set(repoInfo, 'tags', curentRepoInfo.tags ? curentRepoInfo.tags : [])
          this.$set(repoInfo, 'prNumberPropName', 'pr')
          this.$set(repoInfo, 'errorMsg', curentRepoInfo.error_msg || '')
          // make sure branch/pr/tag is reactive
          this.$set(repoInfo, 'branch', repoInfo.branch || '')
          this.$set(
            repoInfo,
            repoInfo.prNumberPropName,
            repoInfo[repoInfo.prNumberPropName] || null
          )
          this.$set(repoInfo, 'tag', repoInfo.tag || '')
          let branchOrTag = null
          if (repoInfo.branch) {
            branchOrTag = {
              type: 'branch',
              id: `branch-${repoInfo.branch}`,
              name: repoInfo.branch
            }
          } else if (repoInfo.tag) {
            branchOrTag = {
              type: 'tag',
              id: `tag-${repoInfo.tag}`,
              name: repoInfo.tag
            }
          }
          this.$set(repoInfo, 'branchOrTag', branchOrTag)
          this.$set(repoInfo, 'branchAndTagList', [
            {
              label: 'Branches',
              options: (repoInfo.branchNames || []).map(name => {
                return {
                  type: 'branch',
                  id: `branch-${name}`,
                  name
                }
              })
            },
            {
              label: 'Tags',
              options: (repoInfo.tags || []).map(tag => {
                return {
                  type: 'tag',
                  id: `tag-${tag.name}`,
                  name: tag.name
                }
              })
            }
          ])
        })
    }
  },
  created () {
    this.repoInfo = cloneDeep(this.originRepo)
    this.getInitRepoInfo(this.repoInfo)
    // if (this.repoInfo.source === 'other') {
    //   this.searchRepoInfo(this.repoInfo, '')
    // } else {
    //   this.searchRepoInfo(this.repoInfo)
    // }
  }
}
</script>
<style lang="less" scoped>
.var-branch-select {
  /deep/.el-input--suffix .el-input__inner {
    padding-right: 35px;
  }
}
</style>
