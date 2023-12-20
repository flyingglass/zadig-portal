import Vue from 'vue'
import Vuex from 'vuex'

// Login
import login from './modules/login'

// Global config
import globalConfig from './modules/globalConfig'

// Project
import projectList from './modules/projectList'

// Global Permission
import globalPermission from './modules/globalPermission'

// Project Permission
import projectPermission from './modules/projectPermission'

// Sidebar
import sidebarStatus from './modules/sidebarStatus'

// Service
import serviceHelm from './modules/serviceHelm'

// External Link
import externalLink from './modules/externalLink'

// Custom Workflow
import customWorkflow from './modules/customWorkflow'

// Preference
import preference from './modules/preference'

Vue.use(Vuex)

const debug = process.env.NODE_ENV !== 'production'

export default new Vuex.Store({
  modules: {
    login,
    globalConfig,
    projectList,
    globalPermission,
    projectPermission,
    sidebarStatus,
    serviceHelm,
    externalLink,
    customWorkflow,
    preference
  },
  strict: debug
})
