# 项目架构迁移说明

## 迁移概述

项目已从 `/home/devbox/project/venue-management-system/` 迁移到 `/home/devbox/project/`。

现在可以直接在项目根目录运行命令，无需进入子目录。

---

## 迁移前后对比

### 迁移前
```bash
cd /home/devbox/project/venue-management-system
npm run dev
```

### 迁移后
```bash
cd /home/devbox/project
npm run dev
```

---

## 当前项目结构

```
/home/devbox/project/
├── .gitignore                          # Git 忽略文件配置
├── .vscode/                            # VSCode 配置
├── index.html                          # HTML 入口文件
├── package.json                        # 项目依赖配置
├── package-lock.json                   # 依赖锁定文件
├── vite.config.js                      # Vite 配置文件
├── jsconfig.json                       # JavaScript 配置
├── entrypoint.sh                       # 入口脚本
├── public/                             # 静态资源目录
├── src/                                # 源代码目录
│   ├── main.js                         # 应用入口
│   ├── App.vue                         # 根组件
│   ├── style.css                       # 全局样式
│   ├── api/                            # API 接口
│   ├── assets/                         # 资源文件
│   ├── components/                     # 公共组件
│   │   └── SideMenu.vue
│   ├── mock/                           # Mock 数据
│   │   └── data.js
│   ├── router/                         # 路由配置
│   │   └── index.js
│   ├── store/                          # 状态管理
│   │   └── user.js
│   ├── utils/                          # 工具函数
│   │   ├── request.js
│   │   └── export.js
│   └── views/                          # 页面组件
│       ├── Login.vue
│       ├── Layout.vue
│       ├── Dashboard.vue
│       ├── 403.vue
│       ├── 404.vue
│       ├── application/
│       │   ├── ApplicationForm.vue
│       │   └── MyApplications.vue
│       ├── approval/
│       │   └── ApprovalList.vue
│       ├── management/
│       │   ├── VenueManagement.vue
│       │   ├── MaterialManagement.vue
│       │   └── UserManagement.vue
│       ├── profile/
│       │   └── UserProfile.vue
│       └── public/
│           └── VenueCalendar.vue
├── node_modules/                       # 依赖包（已安装）
└── 文档/
    ├── README.md                       # 项目说明
    ├── QUICK_START.md                  # 快速开始
    ├── PROJECT_SUMMARY.md              # 项目总结
    ├── RBAC_FLOW.md                    # RBAC 流程
    ├── CHECKLIST.md                    # 检查清单
    ├── TESTING_GUIDE.md                # 测试指南
    ├── MANAGEMENT_MODULES.md           # 管理模块文档
    ├── USER_APPLICATION_MODULE.md      # 用户申请模块文档
    ├── USER_MODULE_TESTING.md          # 用户模块测试文档
    ├── REVIEWER_MODULE.md              # 审核员模块文档
    ├── PROJECT_COMPLETE.md             # 项目完成文档
    ├── VISUALIZATION_MODULE.md         # 可视化模块文档
    ├── BATCH_6_BUGFIX_AND_MANAGEMENT.md # 批次六文档
    └── BATCH_7_FINAL.md                # 批次七文档（最终）
```

---

## 快速开始

### 1. 启动开发服务器
```bash
cd /home/devbox/project
npm run dev
```

服务器将在 `http://localhost:5173` 启动

### 2. 构建生产版本
```bash
npm run build
```

构建产物将输出到 `dist/` 目录

### 3. 预览生产版本
```bash
npm run preview
```

---

## 测试账号

### Admin（系统管理员）
- 用户名：`admin`
- 密码：任意

### Reviewer（审核员）
- 用户名：`reviewer`
- 密码：任意

### User（普通用户）
- 用户名：`user` 或任意其他用户名
- 密码：任意

---

## 功能模块

### Admin 角色
- ✅ 数据看板
- ✅ 场地管理（CRUD + 导出）
- ✅ 物资管理（CRUD + 导出）
- ✅ 用户管理（CRUD + 导出）
- ✅ 个人中心

### Reviewer 角色
- ✅ 数据看板
- ✅ 待我审批（通过/驳回 + 通知）
- ✅ 个人中心

### User 角色
- ✅ 场地日历（可视化）
- ✅ 发起申请（动态表单）
- ✅ 我的申请（查看/取消）
- ✅ 消息通知（实时提醒）
- ✅ 个人中心

---

## 核心特性

1. **RBAC 权限控制**：基于角色的访问控制
2. **数据持久化**：localStorage 自动保存
3. **数据导出**：一键导出 Excel
4. **消息通知**：审批结果实时通知
5. **数据可视化**：ECharts 图表 + FullCalendar 日历
6. **响应式设计**：适配各种屏幕尺寸

---

## 技术栈

- **构建工具**：Vite 7
- **前端框架**：Vue 3 (Composition API + `<script setup>`)
- **UI 组件库**：Element Plus
- **路由管理**：Vue Router 4
- **状态管理**：Pinia
- **HTTP 请求**：Axios
- **图表库**：ECharts
- **日历组件**：FullCalendar
- **Excel 导出**：xlsx

---

## 迁移完成验证

✅ 项目文件已全部迁移到 `/home/devbox/project/`
✅ `node_modules` 已正确安装
✅ 开发服务器可以正常启动
✅ 应用可以正常访问（http://localhost:5173）
✅ 所有功能模块完整保留

---

## 注意事项

1. **数据持久化**：所有数据存储在浏览器的 localStorage 中，清除浏览器缓存会导致数据丢失
2. **Mock 数据**：当前使用 Mock 数据，如需对接真实后端，需修改 `src/api/` 和 `src/utils/request.js`
3. **端口占用**：如果 5173 端口被占用，Vite 会自动使用下一个可用端口

---

## 后续开发

如果需要继续开发或对接后端：

1. **API 集成**：修改 `src/utils/request.js` 配置真实的后端地址
2. **数据接口**：在 `src/api/` 中创建 API 接口函数
3. **移除 Mock**：将 `src/mock/data.js` 替换为真实 API 调用
4. **环境变量**：创建 `.env` 文件配置不同环境的 API 地址

---

## 问题排查

### 问题：npm run dev 无法启动
**解决方案**：
```bash
# 重新安装依赖
rm -rf node_modules package-lock.json
npm install
npm run dev
```

### 问题：端口被占用
**解决方案**：
```bash
# 查看占用端口的进程
lsof -i :5173

# 或指定其他端口启动
npm run dev -- --port 3000
```

### 问题：浏览器白屏
**解决方案**：
1. 打开浏览器开发者工具（F12）查看控制台错误
2. 清除浏览器缓存和 localStorage
3. 检查是否有 JavaScript 错误

---

## 项目完成度

🎉 **前端开发 100% 完成！**

经过七个批次的开发，完成了一个功能完整、体验优秀的校级活动场地与物资管理系统。

---

**迁移完成时间**：2025-10-19
**迁移状态**：✅ 成功

