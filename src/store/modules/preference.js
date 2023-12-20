import * as types from '../mutations'
import { getPreferenceSettingAPI, savePreferenceSettingAPI } from '@api'

const state = {
  xtermTheme: {
    foreground: '#ffffff', // 字体
    background: '#000000' // 背景色
  }
}

const mutations = {
  [types.SET_PREFERENCE_SETTING] (state, payload) {
    state.xtermTheme = payload.xtermTheme
  }
}

const actions = {
  getPreferenceSetting ({ commit, rootState }, payload) {
    const uid = (payload && payload.uid) || rootState.login.userinfo.uid
    return getPreferenceSettingAPI(uid).then(res => {
      const data = {
        xtermTheme: {
          foreground: res.log_font_color || '#ffffff',
          background: res.log_bg_color || '#000000'
        }
      }
      commit(types.SET_PREFERENCE_SETTING, data)
      return data
    })
  },
  savePreferenceSetting ({ commit, rootState }, data) {
    const uid = rootState.login.userinfo.uid
    const payload = {
      log_bg_color: data.xtermTheme.background,
      log_font_color: data.xtermTheme.foreground
    }
    return savePreferenceSettingAPI(uid, payload).then(res => {
      commit(types.SET_PREFERENCE_SETTING, data)
    })
  }
}

export default {
  state,
  mutations,
  actions
}
