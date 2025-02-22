<template>
  <el-dialog class="form" :title="$t('project.rbac.addRole')" :visible.sync="dialogRoleAddFormVisible" width="62%">
    <el-form ref="form" :model="form" :rules="formRules" label-position="left">
      <el-form-item :label="$t('project.rbac.roleName')" prop="name" label-width="100px">
        <el-input size="small" :disabled="isEdit" v-model="form.name"  :placeholder="$t('project.rbac.inputRoleName')"></el-input>
      </el-form-item>
      <el-form-item :label="$t('project.rbac.permissionList')" prop="permissions" label-width="100px">
        <el-table :data="permissionGroups" border style="line-height: 1.2;">
          <el-table-column label="操作对象" prop="alias" width="95px"></el-table-column>
          <el-table-column label="权限项">
            <template slot-scope="{ row }">
              <el-checkbox-group v-model="form.permissions">
                <el-checkbox
                  class="sub-permissions-checkbox"
                  v-for="(subPermission,sub_index) in  row.rules"
                  :key="sub_index"
                  :label="subPermission. uniqueAction"
                >{{subPermission.alias}}</el-checkbox>
              </el-checkbox-group>
            </template>
          </el-table-column>
          <el-table-column  width="36px">
            <template slot-scope="{ row }">
              <el-checkbox
                :key="row.resource"
                :value="calculatePermissionGroupsCheckedState(row.rules)"
                @change="handlePermissionGroupChange(row.rules)"
                :indeterminate="isIndeterminate(row.resource,row.rules)"
              ></el-checkbox>
            </template>
          </el-table-column>
        </el-table>
      </el-form-item>
    </el-form>
    <div slot="footer" class="dialog-footer">
      <el-button size="small" @click="dialogRoleAddFormVisible = false">{{$t(`global.cancel`)}}</el-button>
      <el-button size="small" type="primary" @click="submit">{{$t(`global.confirm`)}}</el-button>
    </div>
  </el-dialog>
</template>
<script>
import { queryPolicyDefinitionsAPI, addRoleAPI, queryRoleDetailAPI, queryPublicRoleDetailAPI, updateRoleAPI, updatePublicRoleAPI, addPublicRoleAPI } from '@api'
import _ from 'lodash'

const initFormData = {
  name: '',
  permissions: [],
  isPublic: false

}

const resources = {
  Workflow: false,
  Environment: false,
  Service: false,
  Test: false,
  Delivery: false
}

export default {
  name: 'addRole',
  props: {
    projectName: String,
    currentRole: Object,
    getRoles: Function
  },
  data () {
    return {
      isEdit: false,
      dialogRoleAddFormVisible: false,
      permissionGroups: [],
      form: {
        name: '',
        permissions: [],
        isPublic: false
      }
    }
  },
  computed: {
    formRules () {
      const validateRoleName = (rule, value, callback) => {
        if (typeof value === 'undefined' || value === '') {
          callback(new Error(this.$t('project.rbac.inputRoleName')))
        } else {
          if (!/^[a-z0-9-]+$/.test(value)) {
            callback(new Error(this.$t('project.rbac.checkRoleName')))
          } else {
            callback()
          }
        }
      }
      return {
        name: [
          { trigger: ['blur', 'change'], validator: validateRoleName, required: true }
        ],
        permissions: [
          { type: 'array', required: true, message: this.$t('project.rbac.selectAtLeastOnePermission'), trigger: 'change' }

        ]
      }
    }
  },
  methods: {
    initNewForm () {
      this.form = _.cloneDeep(initFormData)
    },
    async getRoleDetail (role) {
      let res = null
      const projectName = this.projectName
      if (role.isPublic) {
        res = await queryPublicRoleDetailAPI(role.name, projectName).catch(error => console.log(error))
      } else {
        res = await queryRoleDetailAPI(role.name, projectName).catch(error => console.log(error))
      }
      res.rules.forEach(item => {
        if (item.kind === 'resource') {
          item.verbs.forEach(action => {
            this.form.permissions.push(`${item.resources[0]}/${action}`)
          })
        }
      })
    },
    handlePermissionGroupChange (rules) {
      for (let i = 0; i < rules.length; i++) {
        if (this.form.permissions.includes(rules[i].uniqueAction)) {
          const index = this.form.permissions.indexOf(rules[i].uniqueAction)
          this.form.permissions.splice(index, 1)
        } else {
          const res = rules.map(item => (item.uniqueAction))
          this.form.permissions = _.uniq(this.form.permissions.concat(res))
          return
        }
      }
    },
    calculatePermissionGroupsCheckedState (rules) {
      for (const rule of rules) {
        if (!this.form.permissions.includes(rule.uniqueAction)) {
          return false
        }
      }
      return true
    },
    isIndeterminate (resource, rules) {
      for (const rule of rules) {
        if (this.form.permissions.includes(rule.uniqueAction)) {
          resources[resource] = true
          return true
        }
      }
      resources[resource] = false
      return false
    },
    async getPolicyDefinitions () {
      const projectName = this.projectName
      const projectTypeMap = {
        cloud_host: 'pm',
        k8s: 'k8s',
        external: 'trusteeship',
        helm: 'k8s'
      }
      const currentProject = this.$store.getters.projectList.find(project => project.name === projectName)
      const projectType = currentProject && projectTypeMap[currentProject.deployType]
      const res = await queryPolicyDefinitionsAPI(projectName, 'project', projectType).catch(error => console.log(error))
      if (res) {
        const filterRes = res.filter((item) => {
          return item.resource !== 'Delivery' && item.resource !== 'ProductionService' && item.resource_key !== 'ProductionEnvironment'
        })
        filterRes.forEach(group => {
          group.rules.forEach(item => {
            item.uniqueAction = `${group.resource}/${item.action}`
            item.resource = group.resource
          })
        })
        this.permissionGroups = filterRes
      }
    },
    async submit () {
      const res = await this.$refs.form.validate()
      const resource = []
      const projectName = this.projectName
      Object.keys(resources).forEach(i => {
        if (resources[i]) {
          resource.push(i)
        }
      })

      const rules = []
      const permissions = this.form.permissions
      if (res) {
        const resourceMap = {}
        for (let index = 0; index < permissions.length; index++) {
          const element = permissions[index]
          const resource = element.split('/')[0]
          const action = element.split('/')[1]
          resourceMap[resource] = resourceMap[resource] || []
          resourceMap[resource].push(action)
        }
        for (const resource in resourceMap) {
          if (Object.hasOwnProperty.call(resourceMap, resource)) {
            const element = resourceMap[resource]
            rules.push({
              kind: 'resource',
              resources: [resource],
              verbs: element
            })
          }
        }
        if (this.isEdit) {
          let result = null
          if (this.form.isPublic) {
            result = await updatePublicRoleAPI({ name: this.form.name, rules: rules }, projectName).catch(error => console.log(error))
          } else {
            result = await updateRoleAPI({ name: this.form.name, rules: rules, projectName: projectName }, projectName).catch(error => console.log(error))
          }
          if (result) {
            this.$message.success('修改成功')
            this.dialogRoleAddFormVisible = false
            this.getRoles()
          }
        } else {
          let result = null
          if (this.form.isPublic) {
            result = await addPublicRoleAPI({ name: this.form.name, rules: rules }, projectName).catch(error => console.log(error))
          } else {
            result = await addRoleAPI({ name: this.form.name, rules: rules, projectName: projectName }, projectName).catch(error => console.log(error))
          }
          if (result) {
            this.$message.success('添加成功')
            this.dialogRoleAddFormVisible = false
            this.getRoles()
          }
        }
      }
    }
  },
  watch: {
    dialogRoleAddFormVisible (value) {
      if (value && this.currentRole) {
        this.isEdit = true
        this.getRoleDetail(this.currentRole)
        this.form.name = this.currentRole.name
        this.form.isPublic = !!this.currentRole.isPublic
      } else {
        this.isEdit = false
        this.initNewForm()
      }
    }
  },
  mounted () {
    this.getPolicyDefinitions()
  }
}
</script>
<style lang="less" scoped>
.permissions-group {
  .sub-permissions {
    margin-left: 25px;
  }
}
</style>
