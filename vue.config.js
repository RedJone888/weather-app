const { defineConfig } = require('@vue/cli-service')
module.exports = defineConfig({
  transpileDependencies: true,
  publicPath: (() => {
    if (process.env.NODE_ENV === 'production') {
      if (process.env.DEPLOY_TARGET === 'github-pages') {
        return '/weather-app/'
      } else if (process.env.DEPLOY_TARGET === 'vercel') {
        return '/'
      }
    }
    return '/' // 默认开发环境
  })()
})
