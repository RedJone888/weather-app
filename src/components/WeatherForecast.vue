<template>
  <div class="weather-container">
    <div class="cache-status" v-if="showCacheStatus">
      <span v-if="isUsingCache">🔄 显示缓存数据 ({{ cacheAge }}分钟前)</span>
      <span v-else>✅ 实时数据</span>
      <button @click="refreshData">刷新</button>
    </div>
    <div class="weather-header">
      <h2>天気予報</h2>
      <div class="location-selector">
        <select v-model="selectedLocation" @change="fetchWeatherData">
          <option v-for="location in locations" :key="location.id" :value="location.id">{{ location.name }}</option>
        </select>
      </div>
    </div>
    <div class="weather-content">

      <!-- 加载状态 -->
      <div v-if="isLoading" class="skeleton-container">
        <!-- 当前天气骨架屏 -->
        <div class="skeleton-card">
          <div class="skeleton-header"></div>
          <div class="skeleton-main">
            <div class="skeleton-main-temp"></div>
            <div class="skeleton-main-icon"></div>
          </div>
          <div class="skeleton-details">
            <div class="skeleton-details-item" v-for="i in skeletonCount" :key="'detail-' + i"></div>
          </div>
        </div>

        <!-- 24小时预报骨架屏 -->
        <div class="skeleton-card">
          <div class="skeleton-header" style="width: 30%"></div>
          <div class="skeleton-forecast"></div>
        </div>
      </div>

      <!-- 加载覆盖层（可选） -->
      <div v-if="isLoading" class="loading-overlay">
        <div class="loading-spinner"></div>
      </div>

      <!-- 实际天气内容 -->
      <template v-else>

        <div class="current-weather" v-if="currentWeather">
          <div class="location-info">
            <h3>{{ currentWeather.name }}</h3>
            <p class="update-time">更新時間:{{ formatTime(currentWeather.dt) }} </p>
          </div>
          <div class="weather-main">
            <div class="temperature-section">
              <div class="temperature">
                <span class="temp">{{ Math.round(currentWeather.main.temp) }}</span>
                <span class="unit">°C</span>
              </div>
              <div class="feels-like">
                体感温度:{{ Math.round(currentWeather.main.feels_like) }}°C
              </div>
              <div class="temp-range">
                <span class="max">↑{{ Math.round(currentWeather.main.temp_max) }}°</span>
                <span class="min">↓{{ Math.round(currentWeather.main.temp_min) }}°</span>
              </div>
            </div>

            <div class="weather-icon-section">
              <img :src="getWeatherIcon(currentWeather.weather[0].icon)" alt="Weather icon">
              <p class="description">{{ currentWeather.weather[0].description }}</p>
            </div>
          </div>
          <div class="weather-details">
            <div class="detail-card">
              <div class="detail-icon">💧</div>
              <div class="detail-content">
                <div class="detail-label">湿度</div>
                <div class="detail-value">{{ currentWeather.main.humidity }}%</div>
              </div>
            </div>
            <div class="detail-card">
              <div class="detail-icon">🌬️</div>
              <div class="detail-content">
                <div class="detail-label">風速</div>
                <div class="detail-value">{{ currentWeather.wind.speed }} m/s
                  <span class="wind-direction" :style="{ transform: `rotate(${currentWeather.wind.deg}deg)` }">↑</span>
                </div>
              </div>
            </div>
            <div class="detail-card">
              <div class="detail-icon">📊</div>
              <div class="detail-content">
                <div class="detail-label">気圧</div>
                <div class="detail-value">{{ currentWeather.main.pressure }} hPa</div>
              </div>
            </div>
            <div class="detail-card">
              <div class="detail-icon">👁️</div>
              <div class="detail-content">
                <div class="detail-label">視程</div>
                <div class="detail-value">{{ (currentWeather.visibility / 1000).toFixed(1) }} km</div>
              </div>
            </div>
            <div class="detail-card" v-if="currentWeather.rain">
              <div class="detail-icon">🌧️</div>
              <div class="detail-content">
                <div class="detail-label">降水量</div>
                <div class="detail-value">{{ currentWeather.rain['1h'] }} mm/h</div>
              </div>
            </div>
            <div class="detail-card">
              <div class="detail-icon">☁️</div>
              <div class="detail-content">
                <div class="detail-label">雲量</div>
                <div class="detail-value">{{ currentWeather.clouds.all }} %</div>
              </div>
            </div>
            <div class="detail-card">
              <div class="detail-icon">🌅</div>
              <div class="detail-content">
                <div class="detail-label">日の出</div>
                <div class="detail-value">{{ formatTime(currentWeather.sys.sunrise, 'HH:mm') }}</div>
              </div>
            </div>
            <div class="detail-card">
              <div class="detail-icon">🌇</div>
              <div class="detail-content">
                <div class="detail-label">日の入</div>
                <div class="detail-value">{{ formatTime(currentWeather.sys.sunset, 'HH:mm') }}</div>
              </div>
            </div>
          </div>
        </div>

        <div class="hourly-forecast" v-if="hourlyForecast.length > 0">
          <h3>24時間予報</h3>
          <div class="hourly-items">
            <div class="hourly-item" v-for="(hour, index) in hourlyForecast" :key="index">
              <div class="hour">{{ formatTime(hour.dt, 'HH:mm') }}</div>
              <div class="hourly-icon">
                <img :src="getWeatherIcon(hour.weather[0].icon)" alt="Weather icon">
                <p class="description">{{ hour.weather[0].description }}</p>
              </div>
              <div class="hourly-temp">{{ Math.round(hour.main.temp) }}°</div>
              <div class="hourly-pop" v-if="hour.pop > 0">
                <span class="pop-value">{{ Math.round(hour.pop * 100) }}%</span>
              </div>
            </div>
          </div>
        </div>
      </template>
    </div>

  </div>
</template>
<script>
import weatherApi from '@/utils/api';
import moment from 'moment';
import weatherCache from '@/utils/weatherCache';
export default {
  name: 'WeatherForecast',
  data() {
    return {
      selectedLocation: '1850147',// 默认东京
      showCacheStatus: true,
      forceRefresh: false,
      locations: [
        { id: '1850147', name: '東京都' },
        { id: '1853909', name: '大阪市' },
        { id: '1856057', name: '名古屋市' },
        { id: '2128295', name: '札幌市' },
        { id: '1863958', name: '福岡県' },
        { id: '1848354', name: '横浜市' },
        { id: '1863967', name: '福岡市' },
        { id: '1857910', name: '京都市' },
        { id: '1859171', name: '神戸市' },
        { id: '1862415', name: '広島市' },
        { id: '2111149', name: '仙台' }
      ],
      currentWeather: null,
      hourlyForecast: [],
      isLoading: true,
      skeletonCount: 8, // 骨架屏卡片数量
    }
  },
  mounted() {
    this.fetchWeatherData();
  },
  computed: {
    cacheAge() {
      const cached = weatherCache.get(this.selectedLocation);
      if (!cached) return 0;
      return Math.floor((Date.now() - cached.dt * 1000) / 60000);
    },
    isUsingCache() {
      return this.cacheAge > 0 && !this.forceRefresh;
    }
  },
  methods: {
    async fetchWeatherData() {
      const cached = weatherCache.get(this.selectedLocation);
      // 如果有有效缓存且不是强制刷新
      if (cached && !this.forceRefresh) {
        this.currentWeather = cached;
        this.showMessage('使用缓存数据');
        this.isLoading = false
        return;
      }
      try {
        this.isLoading = true;
        // 获取当前天气
        // 处理每小时预报（未来24小时，每3小时一次）
        const [currentResponse, forecast] = await Promise.all([
          weatherApi.get('/weather', { params: { id: this.selectedLocation } }),
          weatherApi.get('/forecast', { params: { id: this.selectedLocation } })
        ])
        this.currentWeather = currentResponse.data
        this.hourlyForecast = forecast.data.list.slice(0, 8)
        // 设置缓存
        weatherCache.set(this.selectedLocation, currentResponse.data)
        weatherCache.set(`${this.selectedLocation}_forecast`, forecast.data, true)
        // https://tile.openweathermap.org/map/{layer}/{z}/{x}/{y}.png?appid={API key}
        // http://api.openweathermap.org/geo/1.0/direct?q={city name},{state code},{country code}&limit={limit}&appid={API key}
        // await axios.get(`http://api.openweathermap.org/data/2.5/air_pollution?id=${this.selectedLocation}&appid=${this.apiKey}`)
        // await axios.get('http://api.openweathermap.org/data/3.0/stations')
        // await axios.get('http://api.openweathermap.org/data/3.0/triggers')
        // console.log('currentResponse', currentResponse.data)
      } catch (error) {
        console.error('获取天气失败:', error);

        // 如果API失败但有缓存，使用缓存
        const fallbackData = weatherCache.get(this.selectedLocation);
        if (fallbackData) {
          this.currentWeather = fallbackData;
          this.showWarning('实时数据获取失败，使用缓存数据');
        } else {
          this.showError('获取天气数据失败');
        }
      } finally {
        this.isLoading = false
        this.forceRefresh = false;
      }
    },
    // 强制刷新方法
    refreshData() {
      this.forceRefresh = true;
      this.fetchWeatherData();
    },
    showMessage(message) {
      this.message = message;
      this.messageType = 'info';
      this.clearMessageAfterDelay();
    },

    showWarning(message) {
      this.message = message;
      this.messageType = 'warning';
      this.clearMessageAfterDelay();
    },

    showError(message) {
      this.message = message;
      this.messageType = 'error';
      this.clearMessageAfterDelay();
    },

    clearMessageAfterDelay() {
      if (this.messageTimeout) {
        clearTimeout(this.messageTimeout);
      }
      this.messageTimeout = setTimeout(() => {
        this.message = '';
      }, 3000);
    },
    getWeatherIcon(iconCode) {
      return `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
    },
    formatTime(timestamp, format = 'YYYY-MM-DD HH:mm') {
      return moment.unix(timestamp).format(format);
    }
  }
}
</script>
<style lang="scss" scoped>
$primary-color: #2c3e50;
$secondary-color: #666;
$red-color: #e74c3c;
$blue-color: #3498db;
$bg-color: #f5f5f5;
$card-bg: white;
$border-radius: 10px;

.weather-container {
  max-width: 900px;
  margin: 0 auto;
  font-family: 'Arial', sans-serif;
  color: #333;
  background-color: $bg-color;
  padding: 20px;
  border-radius: $border-radius;
  box-shadow: 0 2px 15px rgba(0, 0, 0, .1);

  .cache-status {
    padding: 8px;
    background: #f5f5f5;
    border-radius: 4px;
    margin-bottom: 10px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 0.9em;
  }

  .weather-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    border-bottom: 1px solid #ddd;
    padding-bottom: 10px;

    h2 {
      color: $primary-color;
      margin: 0;
      font-size: 24px;
    }

    .location-selector select {
      padding: 8px 15px;
      border-radius: 6px;
      border: 1px solid #ddd;
      background-color: white;
      font-size: 14px;
    }
  }

  .weather-content {
    position: relative; // 为加载层提供定位上下文

    .loading-overlay {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: rgba($bg-color, 0.8);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 10;
      border-radius: $border-radius;

      .loading-spinner {
        width: 50px;
        height: 50px;
        border: 4px solid rgba($primary-color, 0.2);
        border-radius: 50%;
        border-top-color: $primary-color;
        animation: spin 1s ease-in-out infinite;
      }
    }

    @keyframes spin {
      to {
        transform: rotate(360deg);
      }
    }

    .skeleton {
      &-container {
        width: 100%;
      }

      &-card {
        background-color: $card-bg;
        border-radius: $border-radius;
        padding: 20px;
        margin-bottom: 20px;
        position: relative;
        overflow: hidden;

        &::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(90deg,
              rgba(white, 0) 0%,
              rgba(white, 0.5) 50%,
              rgba(white, 0) 100%);
          animation: shimmer 1.5s infinite;
        }
      }

      &-header {
        height: 30px;
        width: 40%;
        background-color: darken($bg-color, 5%);
        border-radius: 4px;
        margin-bottom: 20px;
      }

      &-main {
        display: flex;
        justify-content: space-between;
        margin-bottom: 20px;

        &-temp {
          height: 80px;
          width: 120px;
          background-color: darken($bg-color, 5%);
          border-radius: 8px;
        }

        &-icon {
          height: 100px;
          width: 100px;
          background-color: darken($bg-color, 5%);
          border-radius: 50%;
        }
      }

      &-details {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
        gap: 15px;

        &-item {
          height: 70px;
          background-color: darken($bg-color, 5%);
          border-radius: 8px;
        }
      }

      &-forecast {
        height: 150px;
        background-color: darken($bg-color, 5%);
        border-radius: $border-radius;
      }
    }

    @keyframes shimmer {
      0% {
        transform: translateX(-100%);
      }

      100% {
        transform: translateX(100%);
      }
    }

    .current-weather {
      .location-info {
        margin-bottom: 15px;

        h3 {
          margin: 0;
          font-size: 22px;
          color: $primary-color;
        }

        .update-time {
          margin: 5px 0 0;
          font-size: 12px;
          color: $secondary-color;
        }
      }

      .weather-main {
        display: flex;
        justify-content: space-between;
        align-items: center;
        background-color: $card-bg;
        border-radius: $border-radius;
        padding: 20px;
        margin-bottom: 20px;

        .temperature-section {
          display: flex;
          flex-direction: column;
          align-items: flex-start;

          .temperature {
            display: flex;
            align-items: flex-start;
            margin-bottom: 5px;

            .temp {
              font-size: 56px;
              font-weight: bold;
              color: $primary-color;
              line-height: 1;
            }

            .unit {
              font-size: 28px;
              margin-top: 5px;
            }
          }

          .feels-like {
            font-size: 14px;
            color: $secondary-color;
            margin-bottom: 10px;
          }

          .temp-range {
            display: flex;
            gap: 10px;

            .max {
              color: $red-color;
            }

            .min {
              color: $blue-color;
            }
          }
        }

        .weather-icon-section {
          display: flex;
          flex-direction: column;
          align-items: center;

          img {
            width: 100px;
            height: 100px;
            border-radius: $border-radius;
            background-color: #8DD0FF;
          }

          .description {
            text-transform: capitalize;
            margin: 5px 0 0;
            font-size: 18px;
            color: $secondary-color;
          }
        }
      }

      .weather-details {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
        gap: 15px;
        margin-bottom: 20px;

        .detail-card {
          display: flex;
          align-items: center;
          background-color: white;
          border-radius: 8px;
          padding: 15px;
          box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);

          .detail-icon {
            font-size: 24px;
            margin-right: 15px;
          }

          .detail-content {
            display: flex;
            flex-direction: column;

            .detail-label {
              font-size: 12px;
              color: #888;
              margin-bottom: 3px;
            }

            .detail-value {
              font-size: 16px;
              font-weight: bold;

              .wind-direction {
                display: inline-block;
                margin-left: 5px;
                font-size: 14px;
              }
            }
          }
        }
      }
    }

    .hourly-forecast {
      background-color: white;
      border-radius: 10px;
      padding: 20px;
      margin-bottom: 20px;

      h3 {
        margin-top: 0;
        margin-bottom: 15px;
        color: #2c3e50;
        font-size: 18px;
      }

      .hourly-items {
        display: flex;
        justify-content: space-between;
        overflow-x: auto;
        gap: 15px;
        padding-bottom: 10px;

        .hourly-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          min-width: 70px;
          padding: 10px;
          border: 2px solid #efefef;
          border-radius: 6px;

          .hour {
            font-size: 14px;
            font-weight: bold;
            margin-bottom: 5px;
          }

          .hourly-icon {
            display: flex;
            flex-direction: column;
            align-items: center;

            img {
              width: 40px;
              height: 40px;
              border-radius: 6px;
              background-color: #8DD0FF;
            }

            .description {
              font-size: 12px;
              text-transform: capitalize;
              margin: 4px 0 0;
              color: #888;
            }
          }

          .hourly-temp {
            font-size: 16px;
            font-weight: bold;
            margin: 5px 0;
          }

          .pop-value {
            font-size: 12px;
            color: #3498db;
            background-color: #e1f0fa;
            padding: 2px 5px;
            border-radius: 10px;
          }
        }

        /* 滚动条样式 */
        &::-webkit-scrollbar {
          height: 6px;
        }

        &::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 3px;
        }

        ::-webkit-scrollbar-thumb {
          background: #ccc;
          border-radius: 3px;
        }

        ::-webkit-scrollbar-thumb:hover {
          background: #aaa;
        }
      }
    }
  }
}
</style>
