<template>
  <div class="common-parcel-block">
    <div class="primary-title">{{$t('environments.k8s.serviceListComp.serviceList')}}</div>
    <div>
      <div v-if="showFilter" class="service-filter-block">
        <span class="service-filter">
          {{$t('environments.k8s.serviceListComp.quickFilter')}}
          <el-tooltip class="img-tooltip" effect="dark" placement="top">
            <div slot="content">
              {{$t('environments.k8s.serviceListComp.quickFilterFirstTip')}}
              <br />{{$t('environments.k8s.serviceListComp.quickFilterSecondTip')}}
            </div>
            <i class="el-icon-info"></i>
          </el-tooltip>
          <el-select
            :disabled="cantOperate"
            size="small"
            class="img-select"
            v-model="quickSelection"
            :placeholder="$t('environments.k8s.serviceListComp.selectFilterMethod')"
            @change="quickInitImage()"
          >
            <el-option :label="$t('environments.k8s.serviceListComp.selectLatestImage')" value="latest"></el-option>
            <el-option :label="$t('environments.k8s.serviceListComp.selectDefaultImage')" value="default"></el-option>
          </el-select>
        </span>
      </div>
      <el-form class="service-form-block" label-width="50%" label-position="left">
        <div class="service-item" v-for="(service, serviceName) in selectedContainerMap" :key="serviceName">
          <div class="primary-title service-title">
            <div class="service-name">{{ serviceName }}</div>
            <template>
              <div class="service-resource">
                <span class="middle">
                  <el-tooltip effect="dark" placement="top">
                    <div slot="content">
                      <span>{{ $t('global.enterprisefeaturesReferforDetails') }}</span>
                      <el-link
                        style="font-size: 13px; vertical-align: baseline;"
                        type="primary"
                        href="https://docs.koderover.com/zadig/project/k8s-yaml/#资源检测"
                        :underline="false"
                        target="_blank"
                      >{{$t(`global.document`)}}</el-link>
                    </div>
                    <span class="gray">{{$t('environments.k8s.serviceListComp.resourceDetection')}} <i class="el-icon-info gray"></i></span>
                  </el-tooltip>
                </span>
              </div>
            </template>
          </div>
          <div class="service-content">
            <template v-if="service.type==='k8s' && service.containers">
              <el-form-item v-for="con of service.containers" :key="con.name" :label="con.name" label-width="40%">
                <el-select v-model="con.image" :disabled="cantOperate" filterable size="small">
                  <virtual-scroll-list
                    v-if="imageMap[con.image_name] && imageMap[con.image_name].length > 200"
                    style="height: 272px; overflow-y: auto;"
                    :size="virtualData.size"
                    :keeps="virtualData.keeps"
                    :start="virtualData.start"
                    :dataKey="(img)=>{ return img.name+'-'+img.tag}"
                    :dataSources="imageMap[con.image_name]"
                    :dataComponent="itemComponent"
                  ></virtual-scroll-list>
                  <el-option
                    v-else
                    v-for="img of imageMap[con.image_name]"
                    :key="`${img.name}-${img.tag}`"
                    :label="img.tag"
                    :value="img.full"
                  ></el-option>
                </el-select>
              </el-form-item>
            </template>
          </div>
          <div v-if="service.canEditYaml" class="var-config">
            <div class="primary-title var-title">变量配置</div>
            <ServiceVar
              :varList="service.variable_kvs"
              :globalVariables="globalVariables"
              @updateRelatedServices="updateRelatedServices($event, service.service_name)"
              showSelectGlobalVar
            />
          </div>
        </div>
      </el-form>
    </div>
  </div>
</template>

<script>
import ServiceVar from '@/components/projects/common/serviceVar.vue'
import virtualListItem from '@/components/projects/common/imageItem.vue'
import virtualScrollList from 'vue-virtual-scroll-list'
import { imagesAPI } from '@api'

export default {
  props: {
    showFilter: Boolean,
    cantOperate: Boolean,
    selectedContainerMap: Object,
    registryId: {
      required: true,
      type: String
    },
    globalVariables: Array,
    serviceToKeys: Object
  },
  data () {
    this.services = []

    return {
      itemComponent: virtualListItem,
      virtualData: {
        keeps: 20,
        size: 34,
        start: 0
      },
      quickSelection: '',
      imageMapById: {},
      svcResources: {}
    }
  },
  computed: {
    imageMap () {
      return this.imageMapById[this.registryId] || {}
    }
  },
  methods: {
    async getImages (containerNames, registryId, init, services) {
      if (!this.imageMapById[registryId]) {
        const images = await imagesAPI(containerNames, registryId).catch(err =>
          console.log(err)
        )
        if (images) {
          for (const image of images) {
            image.full = `${image.host}/${image.owner}/${image.name}:${image.tag}`
          }
          this.$set(
            this.imageMapById,
            registryId,
            this.makeMapOfArray(images, 'name')
          )
        }
      }
      this.services = services
      if (init) {
        this.quickSelection = 'latest'
        this.quickInitImage(this.imageMapById[registryId])
      }
    },
    makeMapOfArray (arr, namePropName) {
      const map = {}
      for (const obj of arr) {
        if (!map[obj[namePropName]]) {
          map[obj[namePropName]] = [obj]
        } else {
          map[obj[namePropName]].push(obj)
        }
      }
      return map
    },
    quickInitImage (imageMap = this.imageMap) {
      const select = this.quickSelection
      const services = this.services || []
      for (const group of services) {
        for (const ser of group) {
          ser.picked =
            ser.type === 'k8s' && (select === 'latest' || select === 'default')
          const containers = ser.containers
          if (containers) {
            for (const con of ser.containers) {
              if (select === 'latest') {
                if (imageMap[con.image_name]) {
                  con.image = imageMap[con.image_name][0].full
                } else {
                  con.image = con.defaultImage
                }
              }
              if (select === 'default') {
                con.image = con.defaultImage
              }
            }
          }
        }
      }
    },
    updateRelatedServices ({ key, operate }, serviceName) {
      // Add or delete a service associated with the current key
      const cur = this.globalVariables.find(vars => vars.key === key)
      if (cur) {
        if (operate === 'add') {
          cur.related_services.push(serviceName)
          this.serviceToKeys[serviceName].add(key)
        } else if (operate === 'delete') {
          cur.related_services = cur.related_services.filter(
            item => item !== serviceName
          )
          this.serviceToKeys[serviceName].delete(key)
        }
      }
    }
  },
  components: {
    virtualScrollList,
    ServiceVar
  }
}
</script>

<style lang="less" scoped>
.service-filter-block {
  margin-bottom: 14px;

  .service-filter {
    color: @themeColor;
    font-size: 14px;

    .el-input__inner {
      color: #06f;
      border-color: #8cc5ff;

      &::placeholder {
        color: #8cc5ff;
      }
    }
  }
}

.service-form-block {
  width: 90%;
  max-width: 1000px;

  .service-item {
    margin-bottom: 8px;
    padding: 12px;
    background: rgba(246, 246, 246, 0.6);
    border-radius: 6px;

    .service-title {
      display: flex;
      align-items: center;
      margin-bottom: 0;

      .service-name {
        flex: 1 0 auto;
      }

      .service-resource {
        flex: 0 0 60%;
        margin: 0 20px;

        .resource-item {
          white-space: nowrap;
        }
      }

      .middle {
        margin-left: 8px;
        vertical-align: middle;
      }

      .success {
        color: @success;
      }

      .fail {
        color: @danger;
      }

      .gray {
        color: @info;
      }

      /deep/.el-radio {
        margin-right: 10px;
        color: inherit;
        font-weight: inherit;

        &:last-child {
          margin-right: 0;
        }

        .el-radio__label {
          padding-left: 4px;
        }
      }
    }

    .service-content {
      box-sizing: border-box;
      margin-top: 14px;
      padding: 15px 12px;
      background: var(--color-global-bg);
      border: 1px solid #d2d7dc;
      border-radius: 6px;

      /deep/.el-form-item {
        margin-bottom: 8px;

        .el-select {
          width: 100%;
        }
      }
    }

    .var-config {
      margin-top: 14px;

      .var-title {
        margin-bottom: 5px;
      }
    }
  }
}
</style>
