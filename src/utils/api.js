import axios from 'axios'

// 创建自定义 Axios 实例
const weatherApi = axios.create({
  baseURL: 'https://api.openweathermap.org/data/2.5',
  timeout: 10000, // 10秒超时
  params: {
    units: 'metric',
    lang: 'ja',
    appid: process.env.VUE_APP_OPENWEATHER_API_KEY
  }
})

// 重试配置
const retryConfig = {
  retries: 3, // 最大重试次数
  retryDelay: 1000, // 重试延迟(ms)
  retryOn: [500, 502, 503, 504, 429] // 需要重试的状态码
}

// 请求拦截器
weatherApi.interceptors.request.use(
  config => {
    // 可以在这里添加请求前的逻辑
    return config
  },
  error => {
    return Promise.reject(error)
  }
)

// 响应拦截器（实现重试逻辑）
weatherApi.interceptors.response.use(
  response => response,
  async error => {
    const { config, response } = error

    // 如果没有配置重试或者请求方法不是GET（通常只重试GET请求）
    if (!config || !retryConfig.retries || config.method !== 'get') {
      return Promise.reject(error)
    }

    // 检查是否需要重试
    const shouldRetry = retryConfig.retryOn.includes(response?.status)
    if (!shouldRetry) {
      return Promise.reject(error)
    }

    // 设置重试次数
    config.__retryCount = config.__retryCount || 0

    // 检查是否达到最大重试次数
    if (config.__retryCount >= retryConfig.retries) {
      return Promise.reject(error)
    }

    // 增加重试计数器
    config.__retryCount += 1

    // 创建新的 Promise 来处理指数退避
    const delay = new Promise(resolve => {
      setTimeout(() => {
        resolve()
      }, retryConfig.retryDelay * config.__retryCount) // 指数退避
    })

    // 在延迟后重试请求
    return delay.then(() => weatherApi(config))
  }
)

export default weatherApi
