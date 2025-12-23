一、 核心架构与公共功能 (Core Architecture & Public)
这是整个项目的基石，为所有角色提供支持。

技术栈 (Stack)

构建工具：Vite

框架：Vue 3 (全站使用 <script setup> 组合式 API)

UI 库：Element Plus (已配置自动按需导入)

路由：Vue Router 4

状态管理：Pinia

HTTP：Axios

图表：ECharts

Excel 导出：xlsx

权限控制 (RBAC - 核心)

三角色定义：admin (管理员), reviewer (审核员), user (普通用户)。

路由守卫：router.beforeEach (在 router/index.js) 中实现。

自动鉴权：访问页面时，自动检查 Pinia 和 localStorage 中的 token 和 role。

路由元 (meta)：使用 meta: { roles: [...] } 来定义每个路由的访问权限。

自动重定向：未登录用户访问受保护页面时，自动跳转到 /login。

403 页面：已登录用户访问其无权访问的页面时，自动跳转到 /403。

状态管理 (Pinia)

useUserStore：在 store/user.js 中定义，用于全局管理 token 和 userInfo (包含 username 和 role)。

Mock 登录：login action，可模拟三种不同角色的登录，并将凭证存入 localStorage。

登出：logout action，可清除 Pinia 和 localStorage 中的凭证，并跳转到登录页。

布局与导航 (Layout)

Layout.vue：提供“上-左-右”的经典后台布局 (El-Container)。

动态侧边栏 (SideMenu.vue)：

菜单动态生成：自动读取 router/index.js 中的路由表。

菜单权限过滤：根据当前登录用户的 role，自动过滤并只显示该角色有权访问的菜单项。

菜单隐藏：支持 meta: { hidden: true }，用于在路由中注册页面但不显示在菜单中（如“个人中心”）。

顶部导航栏：

用户下拉菜单：显示用户名，包含“个人中心”和“退出登录”两个入口。

面包屑导航 (已由 Cursor 实现)：自动显示当前页面路径。

侧边栏折叠 (已由 Cursor 实现)：支持 Layout 侧边栏的展开与收起。

公共页面 (Pages)

Login.vue：登录页，使用 El-Form，调用 useUserStore 执行登录。

UserProfile.vue (个人中心)：

所有角色均可访问（通过顶部下拉菜单）。

显示当前用户的基本信息（用户名、角色等）。

提供“修改密码”的 El-Form (纯前端模拟，验证两次输入一致)。

403.vue / 404.vue：错误提示页面。

二、 系统管理员 (Admin) 模块
VenueManagement.vue (场地管理)

CRUD：完整的场地增、删、改、查功能。

界面：El-Table 展示, El-Dialog + El-Form (带验证) 用于新增/编辑, El-MessageBox.confirm 用于删除。

UI 细节：使用 El-Tag 根据场地状态（“开放预约”/“维修中”）显示不同颜色。

MaterialManagement.vue (物资管理)

CRUD：完整的物资增、删、改、查功能。

界面：同上（Table + Dialog Form + MessageBox）。

UI 细节：使用 El-Tag 根据库存数量显示不同颜色（如：库存预警）。

UserManagement.vue (用户管理)

CRUD：完整的用户增、删、改、查功能。

界面：同上（Table + Dialog Form + MessageBox）。

特殊逻辑：新增表单包含“密码”字段；编辑表单则隐藏“密码”字段。

Dashboard.vue (数据看板) (Admin/Reviewer 共用)

统计卡片：4 个顶部的快捷统计（总场地数、总物资数等）。

ECharts 图表 1：场地使用率（饼图）。

ECharts 图表 2：热门物资借用统计（柱状图）。

ECharts 图表 3：申请状态分布（环形饼图）。

数据聚合：所有图表数据均通过 computed 属性从 mock/data.js 的 applicationList 中动态聚合而成。

生命周期：在 onMounted 中初始化图表，在 onBeforeUnmount 中销毁实例，防止内存泄漏。

export.js (数据导出)

在 场地管理、物资管理、用户管理 三个页面的表格上方，均添加了“导出 Excel”按钮。

点击可调用 xlsx 库，将当前表格的全部数据导出为 .xlsx 文件。

三、 普通用户 (User) 模块
ApplicationForm.vue (发起申请)

复杂表单：整个项目中最复杂的表单，分段显示“活动信息”、“场地预约”、“物资借用”。

场地选择：El-Select 自动过滤，只显示 status 为“开放预约”的场地。

时间选择：使用 El-Date-Picker 的 datetimerange 类型选择起止时间。

动态物资表单 (核心)：

一个“添加物资”按钮。

每点击一次，动态增加一行“物资选择 El-Select + 数量 El-Input-Number + 删除按钮”。

可动态删除任意一行。

提交逻辑：表单验证通过后，将数据组合成一个申请对象（status: '待审核')，push 到全局 applicationList 中，并自动跳转到“我的申请”页。

MyApplications.vue (我的申请)

数据过滤：computed 属性自动过滤 applicationList，只显示 applicant_username 为当前用户的申请。

数据关联：computed 属性自动将 venue_id 关联查询 venueList，以显示“场地名称”而非 ID。

状态显示：使用 El-Tag 根据 status（待审核、已通过、未通过、已取消）显示不同颜色。

操作：

提供“取消申请”按钮（仅在 status 为“待审核”或“已通过”时显示）。

点击后使用 El-MessageBox.confirm 确认，并将 status 更新为“已取消”。

VenueCalendar.vue (场地日历)

日历视图：使用 El-Calendar 展示当月日期。

场地筛选：顶部提供一个 El-Select，允许用户筛选特定场地的预约，或查看全部。

自定义单元格：使用 #date-cell 插槽，在日历的每一天中，v-for 遍历所有已通过的申请。

事件显示：将当天发生的活动以 El-Tag 的形式显示在单元格内。

详情弹窗：点击 El-Tag 可弹出一个 El-Dialog，显示该活动的详细信息（时间、场地、所借物资等）。

四、 审核员 (Reviewer) 模块
ApprovalList.vue (待我审批)

数据过滤：computed 属性自动过滤 applicationList，只显示所有 status === '待审核' 的申请。

展开行 (核心)：使用 <el-table-column type="expand">。

详情展示：在展开行中，清晰地显示申请的所有详细信息，包括一个嵌套表格，用于展示所申请的物资列表。

智能提示 (Cursor 实现)：在展开的物资列表中，自动检测申请数量与总库存，并给予“库存不足/紧张/充足”的 El-Tag 提示。

审批操作 (核心)：

“通过”按钮：点击后弹出 El-MessageBox.confirm，确认后将 status 改为“已通过”。

“驳回”按钮：点击后弹出 El-MessageBox.prompt，强制要求审核员输入驳回理由，确认后将 status 改为“未通过”，并存储理由。

Dashboard.vue (数据看板)

reviewer 角色与 admin 角色共享同一个数据看板，用于查看全局统计。

五、 跨模块的“隐形”功能
这些功能贯穿于整个应用，是系统得以“高保真”运行的关键。

中央模拟数据库 (src/mock/data.js)

整个前端的“单一数据源”。

使用 Vue 3 ref 导出了所有核心数据：venueList, materialList, applicationList, userList, notificationList。

所有组件的 CRUD 操作，最终都是在直接修改这个文件中的 ref 变量。

数据持久化 (核心)

在 src/mock/data.js 中，使用 watch (深度监听) 监控上述所有 ref 变量。

自动保存：一旦任一数据（如新增一个申请）发生变化，watch 会立即触发，将该数据的完整 JSON 存入 localStorage。

自动加载：当应用启动（main.js 加载 data.js）时，自动从 localStorage 读取数据并覆盖 ref 的初始值。

最终效果：用户的所有操作（增删改查、审批）在浏览器刷新后都会被保留，提供了无限接近真实后端的体验。

消息通知系统

通知创建：ApprovalList.vue 在“通过”或“驳回”时，会向 notificationList 中 push 一条新通知。

红点提示：Layout.vue 的顶部“铃铛”图标，使用 El-Badge，其 value 绑定到一个 computed 属性 (unreadCount)。

unreadCount：自动计算 notificationList 中，recipient (接收者) 为当前登录用户且 read === false 的通知数量。

通知面板：点击“铃铛”图标，弹出 El-Popover，显示当前用户的通知列表，并支持“标记已读”和“全部已读”操作。