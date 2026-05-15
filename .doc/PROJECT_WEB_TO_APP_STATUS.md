# 冷湖天文 / Stellarium Web Engine — 项目进度与技术背景

> 本文档用于在其他对话中快速接续开发。仓库根目录：`stellarium-web-engine`，前端与 Capacitor 宿主在 `apps/web-frontend`。

---

## 一、当前进度概览

| 阶段 | 状态 | 说明 |
|------|------|------|
| Web 前端本地运行 | 已完成 | `apps/web-frontend`：`npm install --legacy-peer-deps`、`npm run dev` / `npm run build` |
| WASM 引擎构建 | 已完成（本机） | 需在仓库根用 Emscripten + `make js`，产物拷到 `apps/web-frontend/src/assets/js/`（`.gitignore` 忽略） |
| `skydata` 数据路径 | 已处理 | `vue.config.js` 从 `apps/skydata`（`../skydata`）拷贝到 `dist/skydata`；不存在时回退 `apps/test-skydata`（`../test-skydata`） |
| 搜索功能（开发） | 已处理 | `VUE_APP_NOCTUASKY_API_SERVER` 在 dev 为空，走 `vue.config.js` 里 `/api` → `https://api.noctuasky.com` 代理，避免非 8080 端口 CORS |
| 星空名汉化与中文搜索 | 已处理 | 专名/星座/行星/部分深空：`sky-name-translations.js` + `sky-corpus-zh.js`；`querySkySources` 合并 Noctua 与 **`localSkySourcesFromQueries`**；个别英文名与引擎 designation 不一致时用 **`STAR_SEARCH_QUERIES_BY_ENGLISH`** 补 HIP 等（见 **§3.7**、**§5.1**） |
| Observe 侧栏白屏 | 已处理 | 缺官方 `src/plugins/*` 时由 `main.js` 注册内置路由 `p/calendar` → `observing-fallback.vue` |
| Capacitor Android | 已完成 | `apps/web-frontend/android/`，应用名「冷湖天文」，包名 `com.lenghu.astronomy` |
| Android `properties` 与 HTML5 mode | 已处理 | `npm install` → `postinstall` 运行 `scripts/patch-capacitor-android.js`，修补 `@capacitor/android` 的 `WebViewLocalServer.java`，使 `/skydata/**/properties` 按静态文件返回，避免被当成 SPA 返回 `index.html`（否则引擎报 `Source is not a star survey`） |
| App 内 HTTPS API（NoctuaSky） | 已处理 | `sw_helpers.js` 的 `fetchJson`：原生平台对绝对 `http(s)://` URL 使用 **`CapacitorHttp.get`**，绕过 WebView CORS；生产 `.env.production` 配置完整 API 根 URL |
| 大陆定位 / 地图（可选） | 已集成 | `VUE_APP_AMAP_WEB_SERVICE_KEY`（`.env.*.local` 推荐）；`sw_helpers.js` 中高德逆地理、IP 定位、WGS84↔GCJ02；`location-mgr.vue` 等配合 |
| 选中天体信息（大陆网络） | 已处理 | `VUE_APP_DISABLE_WIKIPEDIA`：生产可关英文 Wikipedia 摘要，避免长时间等待；**首条 NoctuaSky 请求冷启动**：引擎就绪后 `warmNoctuaSkyApiConnection()` 轻量预热，选中时先用引擎 **`jsonData`** 立即 `setSelectedObject`，API 返回后再覆盖（`selected-object-info.vue`） |
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
      scripts/
        patch-capacitor-android.js   # postinstall：修补 WebViewLocalServer（skydata properties）
      dist/                     # 构建输出（gitignore），Capacitor webDir
      android/                  # Capacitor 生成的 Android 工程
      capacitor.config.json
      CAPACITOR.md              # 命令、环境变量、网络与星空数据说明（随实现更新）
    test-skydata/               # 测试用天区数据
    skydata/                    # 建议为完整数据或指向 test-skydata 的联接，供 webpack copy
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
   - `npm run android:build`：`build:cap` + `cap sync android`。

3. **`postinstall`（Android 星表 `properties`）**  
   - `package.json`：`postinstall` → `node scripts/patch-capacitor-android.js`。  
   - 升级 `@capacitor/android` 后若补丁未命中，需对照 `WebViewLocalServer.java` 更新脚本中的 `needle`。

4. **Capacitor 版本（npm 实际组合）**  
   - `@capacitor/core` / `cli` / `android`：**6.2.1**  
   - `@capacitor/app`：**6.0.3**；`@capacitor/splash-screen`：**6.0.4**；`@capacitor/status-bar`：**6.0.3**  
   （与 npm `latest-6` 标签对齐，非全部同补丁号。）

5. **应用标识**  
   - `capacitor.config.json`：`appId: com.lenghu.astronomy`，`appName: 冷湖天文`，`webDir: dist`。

6. **原生权限**  
   - `AndroidManifest.xml` 已加 `INTERNET`、`ACCESS_COARSE_LOCATION`、`ACCESS_FINE_LOCATION`（Web 定位）。

### 3.3 启动与系统 UI（`src/main.js`）

- 仅在 `Capacitor.isNativePlatform()` 时：`SplashScreen.hide()`、`StatusBar` 深色 + overlay、`App` 插件监听 **返回键**（有历史则 `back`，否则 `exitApp()`）。
- Web 端不受影响，仍直接 `new Vue(...).$mount('#app')`（在 `initCapacitorShell().finally` 里挂载）。

### 3.4 移动端 UI（实用版）

- `public/index.html`：`viewport-fit=cover`、限制缩放、标题「冷湖天文」。
- `App.vue`：窄屏取消 `right_panel` 的 `padding-right: 400px`，避免小屏被侧栏挤没；引擎就绪后调用 **`swh.warmNoctuaSkyApiConnection()`** 预热 NoctuaSky。
- `gui.vue` / `toolbar.vue` / `bottom-bar.vue` / `target-search.vue` / `observing-panel.vue`：安全区 `env(safe-area-inset-*)`、底栏横向滚动、观测面板全宽滑入等。
- `skysource-search.vue`：真机英文键盘等场景下加强 `@input` / DOM 同步，保证搜索框可输入。

### 3.5 搜索、选中信息与 API（`src/assets/sw_helpers.js`）

- **统一入口**：`fetchJson(url)` — 浏览器用 `fetch`；**原生 + 绝对 `http(s)://` URL** 时用 **`CapacitorHttp.get`**，解决 App 内访问 `https://api.noctuasky.com` 的 CORS。
- **开发**：`.env.development` 中 `VUE_APP_NOCTUASKY_API_SERVER` 为空 → 同源 `/api/...` → `vue.config.js` `devServer.proxy` 转发。
- **生产 / App**：`.env.production` 中 `VUE_APP_NOCTUASKY_API_SERVER=https://api.noctuasky.com`（或自建网关）。
- **Wikipedia**：`getSkySourceSummaryFromWikipedia` 在 `VUE_APP_DISABLE_WIKIPEDIA` 为 `1` / `true` 时直接返回，不请求 `en.wikipedia.org`。
- **选中天体**：`lookupSkySourceByName` / `querySkySources` 等仍走上述 `fetchJson`；`sweObj2SkySource` 在 API 失败时用引擎 **`normalizeSkySourceFromSweObj`** 与线上一致的字段修补逻辑。

### 3.6 选中面板与竞态（`selected-object-info.vue`）

- `stelSelectionId` 变化时：若本地 **`jsonData`** 可渲染，则**先** `setSelectedObject(本地)`，再 `sweObj2SkySource`；成功后用在线结果覆盖。  
- 使用当前 **`stelSelectionId`** 作为 `reqId`，在异步 `then` / `catch` 里比对，避免快速切换选中时旧请求覆盖新目标。  
- API 失败且无本地可展示数据时，再 `setSelectedObject(0)`。

### 3.7 界面与星空汉化（技术路线）

**目标与原则**

- 中文 locale 下：搜索结果标题、详情里常见天体名、星座名、行星名等尽量显示**中文**；深空对象补充梅西耶编号中文、卡德威尔编号、以及 `DSO_ENGLISH_ZH` 等常见英文名对照。
- **恒星**：只汉化**有正式中文专名**的条目（与 `STAR_ZH` / `western` skyculture 里 `common_names` 的专名思路一致），**不做**「拜耳记号 + 星座拉丁属格」的自动硬译（易错、与习惯命名不一致）。
- **搜索**：用户输入中文（或部分中文）时，应能命中目标；展示仍走 `translateSkyName`。

**实现分层**

| 层级 | 文件 | 作用 |
|------|------|------|
| 展示翻译 | `apps/web-frontend/src/assets/sky-name-translations.js` | `translateSkyName(name, locale)`：恒星专名 `STAR_ZH`、星座 `CONSTELLATION_ZH`、行星等合并表；梅西耶 / 卡德威尔规则；`DSO_ENGLISH_ZH`；引擎 `translateFn` 等接入点与此一致。 |
| 语料块 | `apps/web-frontend/src/assets/sky-corpus-zh.js` | `PLANET_NAME_ZH`、`MESSIER_NUM_TO_ZH`、`DSO_ENGLISH_ZH` 等大块字典，供翻译与中文搜索条目生成复用。 |
| 中文 → 英文候选 | `sky-name-translations.js` | `CHINESE_TO_SKY_NAME`、`CHINESE_SEARCH_ENTRIES`、`getChineseSearchMatches`、`getSkySearchQueries`：把规范化后的中文键映射到 API/引擎可用的英文查询串（如「摇光」→ `Alkaid`）。 |
| 搜索聚合 | `apps/web-frontend/src/assets/sw_helpers.js` | `querySkySources`：对每个候选并发请求 NoctuaSky `skysources`；**合并前**调用 `localSkySourcesFromQueries`，用 `$stel.getObj(query)` 与 `getObj('NAME ' + query)` 把引擎已能解析的对象转成与线上一致的 `skysource` 形状。 |
| UI | `skysource-search.vue`、`selected-object-info.vue` 等 | 列表副标题等调用 `nameForSkySourceType(..., locale)`；搜索框仍会把文本规范化后传入 `querySkySources`（见 **§5.1**「踩坑」）。 |
| 字体 | `App.vue` | 注册 **Noto Sans SC（可变字体）** 并在 Roboto 之前加载，减轻中文在 **粗体** 下的 tofu（方框）问题。 |

**数据侧（星名与 skyculture）**

- 专名与 HIP 等对应关系以 `apps/skydata/skycultures/western/index.json`（及 `test-skydata` 等拷贝）里 `common_names` 为准；若脚本或工具改星表，注意多目录副本与前端构建拷贝路径一致。

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
| `npm install` | 前端需 **`--legacy-peer-deps`**（Vue2 与部分依赖 peer 冲突）；安装后会执行 **Capacitor Android 补丁脚本**。 |
| `JAVA_HOME` | 命令行 **`gradlew`** 需要；**Gradle 8.2.1** 与 **JVM 21** 不兼容，Android Studio 应选 **Use JVM 17**；`JAVA_HOME` 建议指向 **JDK 17**，不要指向仅适配 Gradle 21 的 JBR 若与 Gradle 冲突。 |
| Android Studio 提示 Defender | 性能建议，非错误；可稍后通过「排除文件夹」加速构建。 |
| 真机 `INSTALL_FAILED_USER_RESTRICTED` | 多为 **USB 安装** 未开（尤其小米 MIUI）；开发者选项中打开 **USB 安装** 等后再 Run。 |
| 星点消失 / `Source is not a star survey` | 确认 `dist/skydata/stars/properties` 存在且 **非** `index.html`；确认 **postinstall 补丁** 已应用；`cap sync` 后重装 App。 |
| **汉化 / 搜索** | 见 **§3.7** 与下表「汉化与搜索踩坑」。 |

### 5.1 汉化与搜索踩坑

| 现象 | 原因 | 处理或注意 |
|------|------|------------|
| 中文搜得到「摇光」、搜不到「开阳」 | 中文映射到英文名 `Mizar` 正确，但 WASM 里 `core_search` 用 **整条 designation 与查询串 strcasecmp 全等**；该星在星表里常以 **`HIP 65378`** 等形式出现，**不一定**存在与 `Mizar` / `NAME Mizar` 完全一致的 designation，故 `getObj` 与 Noctua 都可能 0 条。 | 在 `sky-name-translations.js` 中维护 **`STAR_SEARCH_QUERIES_BY_ENGLISH`**（例：`Mizar` → 追加 `HIP 65378`），在 `getSkySearchQueries` 里对英文候选自动附加备用串；同类问题按需补 HIP 或其它引擎可解析的 designation。 |
| 只有远程 API 时能搜到「北极」类目标 | Noctua 有索引、本地 `getObj(中文)` 无效。 | 已用 **`localSkySourcesFromQueries`** 对每个英文候选调引擎，与 API 结果 **合并去重**；API 为 0 时仍可有本地结果。 |
| 行星中文标签粗体为方框 | 默认西文字体缺 CJK 字形。 | `App.vue` 中 **先注册 Noto Sans SC** 再注册 Roboto，并注意异步注册顺序。 |
| 误把拜耳全称译成中文 | 规则翻译易与星表/习惯名不一致。 | **已撤销**该路径；恒星展示仅依赖明确专名表。 |
| `skysource-search` 里对 `searchText` 做 `toUpperCase()` | 对 CJK 一般等价，极端输入法组合需留意。 | 若出现单字异常，再对照传入 `querySkySources` 的字符串排查。 |

---

## 六、已知限制 / 后续可做

1. **观测插件**：完整「日历 / 观测计划」依赖 `src/plugins/*` 的官方扩展包；当前为 **fallback 页** + 「今晚行星」入口。  
2. **搜索 API**：生产依赖公网 NoctuaSky 或自建 **`VUE_APP_NOCTUASKY_API_SERVER`**；App 内 CORS 已通过 **CapacitorHttp** 缓解，仍受网络与 API 可用性影响。  
3. **品牌资源**：应用图标、启动图仍可替换 `android/app/src/main/res` 与 `capacitor.config.json` 中 Splash 配置。  
4. **iOS**：未接入；若需要再在 `apps/web-frontend` 执行 `npx cap add ios`（需 macOS + Xcode）。  
5. **Wikipedia**：当前策略为可选关闭；若以后要国内可访问的摘要源，需另接百科或自建摘要接口。  
6. **星空汉化覆盖**：当前恒星以 **`STAR_ZH` 专名表** 为准；若用户反馈某中文专名搜不到或展示仍为英文，先对照 **§5.1**（designation / HIP 备用串），再考虑扩表或从 `western/index.json` 对齐数据。

---

## 七、关键文件索引（便于检索）

| 用途 | 路径 |
|------|------|
| Cap 配置 | `apps/web-frontend/capacitor.config.json` |
| Webpack / 代理 / Cap publicPath / skydata copy | `apps/web-frontend/vue.config.js` |
| Cap 启动、返回键 | `apps/web-frontend/src/main.js` |
| 路由与 Observe fallback | `apps/web-frontend/src/main.js`、`observing-fallback.vue` |
| API / 定位 / 地图 / `fetchJson` / Wikipedia / 预热 / `sweObj2SkySource` | `apps/web-frontend/src/assets/sw_helpers.js` |
| 选中天体面板与本地优先展示 | `apps/web-frontend/src/components/selected-object-info.vue` |
| 搜索框（真机输入） | `apps/web-frontend/src/components/skysource-search.vue` |
| 星空名翻译与中文搜索候选 | `apps/web-frontend/src/assets/sky-name-translations.js`（含 `STAR_SEARCH_QUERIES_BY_ENGLISH` 等） |
| 中文语料（行星 / 梅西耶 / DSO 等） | `apps/web-frontend/src/assets/sky-corpus-zh.js` |
| Android WebView `properties` 补丁 | `apps/web-frontend/scripts/patch-capacitor-android.js` |
| 开发环境 API | `apps/web-frontend/.env.development` |
| 生产环境 API / Wikipedia 开关等 | `apps/web-frontend/.env.production` |
| Android 清单 | `apps/web-frontend/android/app/src/main/AndroidManifest.xml` |
| 操作说明 | `apps/web-frontend/CAPACITOR.md` |

---

## 八、变更记录

| 日期 | 摘要 |
|------|------|
| 2026-05-14 | 初版进度与结构说明。 |
| 2026-05-14 | 补充：Capacitor `properties` postinstall 补丁、`CapacitorHttp`、高德可选、Wikipedia 开关、选中天体本地优先 + API 预热与竞态防护、`skysource-search` 真机输入；进度表与文件索引同步。 |
| 2026-05-15 | 新增 **§3.7 汉化技术路线**、**§5.1 汉化与搜索踩坑**（含 `core_search` 全等 designation、`Mizar`/`HIP 65378`、`localSkySourcesFromQueries`、字体与专名策略）；**§一** 进度表、`§六` 已知限制、`§七` 文件索引同步。 |

---

*若目录结构或依赖有变，请在 **§八 变更记录** 表格中追加一行。*
