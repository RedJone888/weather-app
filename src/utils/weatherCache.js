const CACHE_PREFIX = 'weather_'
const MAX_CACHE_ITEMS = 10

export default {
  // 获取缓存
  get(cityId) {
    const cacheKey = `${CACHE_PREFIX}${cityId}`
    const cachedData = localStorage.getItem(cacheKey)

    if (!cachedData) return null

    try {
      const parsed = JSON.parse(cachedData)

      // 检查是否过期
      if (Date.now() > parsed.timestamp + parsed.expires * 1000) {
        this.remove(cityId)
        return null
      }

      return parsed.data
    } catch (e) {
      this.remove(cityId)
      return null
    }
  },

  // 设置缓存
  set(cityId, data, isForecast = false) {
    const cacheKey = `${CACHE_PREFIX}${cityId}`
    const cacheData = {
      data,
      timestamp: Date.now(),
      expires: isForecast ? 3600 : 600 // 预报缓存1小时，当前天气10分钟
    }

    localStorage.setItem(cacheKey, JSON.stringify(cacheData))
    this.cleanup() // 清理旧缓存
  },

  // 删除缓存
  remove(cityId) {
    localStorage.removeItem(`${CACHE_PREFIX}${cityId}`)
  },

  // 清理过期和多余的缓存
  cleanup() {
    const keys = Object.keys(localStorage).filter(k =>
      k.startsWith(CACHE_PREFIX)
    )

    // 清理过期缓存
    keys.forEach(key => {
      const cached = localStorage.getItem(key)
      try {
        const parsed = JSON.parse(cached)
        if (Date.now() > parsed.timestamp + parsed.expires * 1000) {
          localStorage.removeItem(key)
        }
      } catch (e) {
        localStorage.removeItem(key)
      }
    })

    // 如果仍然超过最大数量，清理最旧的
    const remainingKeys = Object.keys(localStorage).filter(k =>
      k.startsWith(CACHE_PREFIX)
    )
    if (remainingKeys.length > MAX_CACHE_ITEMS) {
      remainingKeys
        .map(key => ({
          key,
          timestamp: JSON.parse(localStorage.getItem(key)).timestamp
        }))
        .sort((a, b) => a.timestamp - b.timestamp)
        .slice(0, remainingKeys.length - MAX_CACHE_ITEMS)
        .forEach(item => localStorage.removeItem(item.key))
    }
  },

  // 清空所有天气缓存
  clearAll() {
    Object.keys(localStorage)
      .filter(k => k.startsWith(CACHE_PREFIX))
      .forEach(key => localStorage.removeItem(key))
  }
}
