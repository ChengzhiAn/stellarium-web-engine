# 冷湖天文 / Stellarium Web Engine — 项目进度与技术背景

> 本文档用于在其他对话中快速接续开发。仓库根目录：`stellarium-web-engine`，前端与 Capacitor 宿主在 `apps/web-frontend`。

---

## 一、当前进度概览

| 阶段 | 状态 | 说明 |
|------|------|------|
| Web 前端本地运行 | 已完成 | `apps/web-frontend`：`npm install --legacy-peer-deps`、`npm run dev` / `npm run build` |
| WASM 引擎构建 | 已完成（本机） | 需在仓库根用 Emscripten + `make js`，产物拷到 `apps/web-frontend/src/assets/js/`（`.gitignore` 忽略） |
| `skydata` 数据路径 | 已处理 | `vue.config.js` 从 `../skydata` 拷贝到 `dist/skydata`；本地可用 `apps/skydata` → `test-skydata` 的目录联接 |
| 搜索功能（开发） | 已处理 | `VUE_APP_NOCTUASKY_API_SERVER` 在 dev 为空，走 `vue.config.js` 里 `/api` → `https://api.noctuasky.com` 代理，避免非 8080 端口 CORS |
| Observe 侧栏白屏 | 已处理 | 缺官方 `src/plugins/*` 时由 `main.js` 注册内置路由 `p/calendar` → `observing-fallback.vue` |
| Capacitor Android | 已完成 | `apps/web-frontend/android/`，应用名「冷湖天文」，包名 `com.lenghu.astronomy` |
| 真机 USB 安装 | 环境相关 | 若 `INSTALL_FAILED_USER_RESTRICTED`，需在手机开发者选项打开「USB 安装」等（见文末） |
| Gradle / JVM | 需注意 | 工程 Gradle **8.2.1** 要求 **Gradle JVM 8～19**；Android Studio 提示用 **JVM 17**，勿用 JBR 21 跑 Gradle |

---

## 二、仓库结构（与 App 相关）

```
stellarium-web-engine/          # C/WASM 引擎源码根目录，make js 在此执行
  apps/
    web-frontend/               # Vue 2 + Vuetify 2 前端 + Capacitor 宿主（做法 A）
      src/
      public/
      dist/                     # 构建输出（gitignore），Capacitor webDir
      android/                  # Capacitor 生成的 Android 工程
      capacitor.config.json
      CAPACITOR.md              # 命令速查
    test-skydata/               # 测试用天区数据
    skydata/                    # 建议为指向 test-skydata 的联接，供 webpack copy
  .node-version                  # 前端目录建议 Node 18（fnm 按目录切换）
  .doc/                          # 本说明所在目录
```

---

## 三、从 Web 到 App 的技术路径

### 3.1 架构关系

- **星图与数据**：浏览器 / WebView 内运行 **Vue 2** UI + **Emscripten 编译的 WASM**（`stellarium-web-engine.js` / `.wasm`）+ 静态 **`skydata`**。
- **Capacitor**：把 **`dist/`** 作为 Web 资源打包进 **Android WebView**；原生壳负责图标、权限、启动页、返回键等。
- **不是**把 C 引擎改成 Kotlin/Java；引擎仍以 **WASM + WebGL** 在壳里运行。

### 3.2 关键配置

1. **相对资源路径（必须）**  
   - `vue.config.js`：当 `CAPACITOR_BUILD=1` 时 `publicPath: './'`，避免 `file:///android_asset/...` 下脚本从错误根路径加载。

2. **构建命令**  
   - `npm run build:cap`：`CAPACITOR_BUILD=1` + `NODE_OPTIONS=--openssl-legacy-provider`（旧 Webpack + OpenSSL 3）。  
   - `npx cap sync android`：把 `dist` 同步到 `android/app/src/main/assets/public`。

3. **Capacitor 版本（npm 实际组合）**  
   - `@capacitor/core` / `cli` / `android`：**6.2.1**  
   - `@capacitor/app`：**6.0.3**；`@capacitor/splash-screen`：**6.0.4**；`@capacitor/status-bar`：**6.0.3**  
   （与 npm `latest-6` 标签对齐，非全部同补丁号。）

4. **应用标识**  
   - `capacitor.config.json`：`appId: com.lenghu.astronomy`，`appName: 冷湖天文`，`webDir: dist`。

5. **原生权限**  
   - `AndroidManifest.xml` 已加 `INTERNET`、`ACCESS_COARSE_LOCATION`、`ACCESS_FINE_LOCATION`（Web 定位）。

### 3.3 启动与系统 UI（`src/main.js`）

- 仅在 `Capacitor.isNativePlatform()` 时：`SplashScreen.hide()`、`StatusBar` 深色 + overlay、`App` 插件监听 **返回键**（有历史则 `back`，否则 `exitApp()`）。
- Web 端不受影响，仍直接 `new Vue(...).$mount('#app')`（在 `initCapacitorShell().finally` 里挂载）。

### 3.4 移动端 UI（实用版）

- `public/index.html`：`viewport-fit=cover`、限制缩放、标题「冷湖天文」。
- `App.vue`：窄屏取消 `right_panel` 的 `padding-right: 400px`，避免小屏被侧栏挤没。
- `gui.vue` / `toolbar.vue` / `bottom-bar.vue` / `target-search.vue` / `observing-panel.vue`：安全区 `env(safe-area-inset-*)`、底栏横向滚动、观测面板全宽滑入等。

### 3.5 搜索与 API（`src/assets/sw_helpers.js`）

- `fetch((process.env.VUE_APP_NOCTUASKY_API_SERVER || '') + '/api/v1/skysources/...')`  
- **开发**：`.env.development` 中 `VUE_APP_NOCTUASKY_API_SERVER` 为空 → 同源 `/api/...` → `vue.config.js` `devServer.proxy` 转发。  
- **生产 / App**：`.env.production` 指向 `https://api.noctuasky.com`；若 WebView 遇 CORS，需自建后端或改官方白名单（后续项）。

---

## 四、本地开发常用命令

```powershell
# 仓库根：引擎（WSL/Linux 推荐）
# source emsdk_env.sh && export EMSCRIPTEN_TOOL_PATH=... && make js
# 拷贝 build/stellarium-web-engine.{js,wasm} → apps/web-frontend/src/assets/js/

cd apps/web-frontend
npm install --legacy-peer-deps
npm run dev                    # 浏览器开发

npm run build:cap              # 打 Capacitor 用 dist
npx cap sync android
# 用 Android Studio 打开 apps/web-frontend/android 并 Run
```

详见：`apps/web-frontend/CAPACITOR.md`。

---

## 五、环境与踩坑记录

| 主题 | 说明 |
|------|------|
| Node | 仓库根 `.node-version` 为 `18`；Windows 可用 **fnm** 按目录切换，与系统其他 Node 版本并存。 |
| `npm install` | 前端需 **`--legacy-peer-deps`**（Vue2 与部分依赖 peer 冲突）。 |
| `JAVA_HOME` | 命令行 **`gradlew`** 需要；**Gradle 8.2.1** 与 **JVM 21** 不兼容，Android Studio 应选 **Use JVM 17**；`JAVA_HOME` 建议指向 **JDK 17**，不要指向仅适配 Gradle 21 的 JBR 若与 Gradle 冲突。 |
| Android Studio 提示 Defender | 性能建议，非错误；可稍后通过「排除文件夹」加速构建。 |
| 真机 `INSTALL_FAILED_USER_RESTRICTED` | 多为 **USB 安装** 未开（尤其小米 MIUI）；开发者选项中打开 **USB 安装** 等后再 Run。 |

---

## 六、已知限制 / 后续可做

1. **观测插件**：完整「日历 / 观测计划」依赖 `src/plugins/*` 的官方扩展包；当前为 **fallback 页** + 「今晚行星」入口。  
2. **搜索 API**：生产依赖公网 API 与 CORS 策略；自有 App 长期可换自建 `VUE_APP_NOCTUASKY_API_SERVER`。  
3. **品牌资源**：应用图标、启动图仍可替换 `android/app/src/main/res` 与 `capacitor.config.json` 中 Splash 配置。  
4. **iOS**：未接入；若需要再在 `apps/web-frontend` 执行 `npx cap add ios`（需 macOS + Xcode）。

---

## 七、关键文件索引（便于检索）

| 用途 | 路径 |
|------|------|
| Cap 配置 | `apps/web-frontend/capacitor.config.json` |
| Webpack / 代理 / Cap publicPath | `apps/web-frontend/vue.config.js` |
| Cap 启动、返回键 | `apps/web-frontend/src/main.js` |
| 路由与 Observe fallback | `apps/web-frontend/src/main.js`、`observing-fallback.vue` |
| 搜索 fetch | `apps/web-frontend/src/assets/sw_helpers.js` |
| 开发环境 API | `apps/web-frontend/.env.development` |
| 生产环境 API | `apps/web-frontend/.env.production` |
| Android 清单 | `apps/web-frontend/android/app/src/main/AndroidManifest.xml` |
| 操作说明 | `apps/web-frontend/CAPACITOR.md` |

---

*文档生成日期：2026-05-14。若目录结构或依赖有变，请在本文件末尾追加变更记录。*
