import * as types from '../mutations'
import { userLoginAPI, userLogoutAPI, queryUserBindingsAPI } from '@api'
import { Message } from 'element-ui'
import { parseJwt } from '@/utilities/jwt'
import store from 'storejs'

const state = {
  userinfo: {
    id: 0,
    name: '',
    email: '',
    password: '',
    phone: ''
  },
  role: []
}

const getters = {
  uid: state => {
    return state.userinfo.uid
  }
}

const actions = {
  OTHERLOGIN (context, token) { // 第三方登录
    const info = parseJwt(token)
    const res = { ...info, token: token }
    store.set('userInfo', res)
    Message({
      message: '登录成功，欢迎 ' + res.name,
      type: 'success'
    })
    context.dispatch('getPreferenceSetting', { uid: res.uid })
    return Promise.resolve(true)
  },
  async LOGIN (context, args) {
    let errorHeaders = null
    const res = await userLoginAPI(args).catch(error => {
      if (error.response && error.response.headers) {
        errorHeaders = error.response.headers
      }
      console.log(error)
    })
    const userInfo = res && res.data
    if (userInfo) {
      store.set('userInfo', userInfo) // 存储用户信息，包括 Token
      context.dispatch('GETUSERROLE')
      context.dispatch('getPreferenceSetting', { uid: userInfo.uid })
      return Promise.resolve({ userInfo: userInfo })
    } else {
      return Promise.resolve({ errorHeaders: errorHeaders })
    }
  },
  async LOGOUT (context, args) {
    const result = await userLogoutAPI().catch(error => console.log(error))
    if (result) {
      store.remove('userInfo')
      store.remove('role')
      Message({
        message: '登出成功',
        type: 'success'
      })
      return Promise.resolve(result)
    } else {
      Message({
        message: '登出失败',
        type: 'error'
      })
    }
  },
  async GETUSERROLE (context) {
    const userInfo = store.get('userInfo')
    if (userInfo) {
      const roleBinding = await queryUserBindingsAPI(userInfo.uid).catch(error => console.log(error))
      if (roleBinding) {
        const role = roleBinding.map(item => (item.role))
        store.set('role', role)
        context.commit('INJECT_ROLE', role)
        return role
      }
    }
  },
  async GETUSERINFO (context, args) {
    context.commit('INJECT_PROFILE', store.get('userInfo'))
    context.dispatch('GETUSERROLE')
  }
}

const mutations = {
  [types.INJECT_PROFILE] (state, profile) {
    state.userinfo = profile
  },
  [types.INJECT_ROLE] (state, role) {
    state.role = role
  }
}

export default {
  state,
  getters,
  actions,
  mutations
}
