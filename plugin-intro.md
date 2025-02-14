## 目录结构

obsidian-siga-plugin/
├── src/
│   ├── core/                  
│   │   ├── indexer/           
│   │   │   ├── chunking.ts     # 保留标题分块，新增`preserveContext()`方法保持上下文连贯[3,6](@ref)
│   │   │   ├── embedding.ts    # 升级为BGE-M3模型，支持中英混合编码[6,7](@ref)
│   │   │   └── metadata.ts     # 增强YAML解析，支持Obsidian内部链接关系图谱[4,6](@ref)
│   │   │
│   │   ├── retriever/         
│   │   │   ├── hybrid.ts       # 动态权重调整公式：$Score=0.6 \cdot BM25 + 0.4 \cdot Cosine$[3,6](@ref)
│   │   │   ├── reranker.ts     # 新增`colorTagging()`实现色块标记（蓝-语义/绿-关键词）[6](@ref)
│   │   │   └── path-filter.ts  # 集成Copilot插件的路径过滤逻辑[5,6](@ref)
│   │   │
│   │   └── generator/         
│   │       ├── prompt-engine/  
│   │       │   └── citation.ts # 生成`[[file#^block]]`格式锚点，支持点击跳转[4,6](@ref)
│   │       └── llm-adapter/    
│   │           ├── deepseek/   # 本地部署DeepSeek-V3（6B）[6,7](@ref)
│   │           └── bedrock/    # 新增Amazon Bedrock适配（参考Copilot实现）[5](@ref)
│   │
│   ├── ui/                    
│   │   ├── directory-tree/     # 三栏布局左侧目录树，集成Copilot的右键菜单功能[3,6](@ref)
│   │   │   ├── render.ts       # 图标系统（📁/📄/⭐️）和未读标记[6](@ref)
│   │   │   └── events.ts       # 扩展`提问选区`和`限定检索路径`功能[3,6](@ref)
│   │   │
│   │   ├── chat-panel.ts       # 右侧问答面板，支持Markdown渲染和引用跳转[6](@ref)
│   │   ├── preview-pane.ts     # 文档预览区，集成Copilot的`Send Note`按钮[6](@ref)
│   │   └── status-bar.ts       # 状态栏显示检索耗时和token用量[6](@ref)
│   │
│   ├── services/              
│   │   ├── vector-db.ts        # 切换为LanceDB，支持增量更新（内存降低30%）[3,7](@ref)
│   │   ├── file-watcher.ts     # 优化文件监听逻辑，跳过`.obsidian`系统目录[4,7](@ref)
│   │   └── cache/             
│   │       ├── query-cache.ts  # LRU缓存策略（最大1000条记录）[6](@ref)
│   │       └── model-cache.ts  # 本地模型权重缓存（DeepSeek-V3约12GB）[7](@ref)
│   │
│   └── utils/                 
│       ├── parser.ts           # 增强Markdown AST解析，提取标题层级结构[4,6](@ref)
│       ├── security.ts         # JWT令牌管理和请求速率限制（每秒5次）[5,7](@ref)
│       └── chinese-nlp/        
│           ├── jieba.ts        # 中文分词优化，特殊处理`[[内部链接]]`格式[3,6](@ref)
│           └── link-parse.ts   # 解析Obsidian双向链接关系[4,6](@ref)
│
└── test/
    ├── e2e/
    │   └── hybrid-retrieve.test.ts # 验证混合检索召回率（测试集：中文技术文档库）[3,6](@ref)
    └── mocks/
        └── obsidian-api.ts     # 模拟`app.vault.getFiles()`等核心API[4](@ref)


## 开发路线图

以下是基于敏捷开发理念的渐进式路线规划，兼顾快速验证和核心功能交付，分为4个关键阶段：

阶段1：最小可行产品（MVP） - 2周
目标：实现可交互目录树+基础检索

[✓] 核心模块               
   ├─ ui/directory-tree/render.ts    # 基础目录树渲染（使用📁/📄图标）
   └─ services/file-watcher.ts       # 文件变动监听（仅处理md文件）  

[✓] 关键技术
   - 调用`app.vault.getFiles()`获取文件树 [Obsidian API]
   - 使用`react-treeview`库实现折叠/展开 [文献6]

[✓] 验证方式
   - 在Obsidian中显示完整目录结构
   - 点击文档节点可在右侧面板显示文件名
阶段2：核心能力建设 - 3周
目标：完成混合检索+RAG问答基础链路

[✓] 核心增量模块          
   ├─ core/retriever/hybrid.ts       # BM25基础实现（使用`wink-bm25`库）
   ├─ utils/chinese-nlp/jieba.ts     # 中文分词（停用词表精简版）
   └─ ui/chat-panel.ts               # 问答输入框+结果展示区  

[✓] 关键技术
   - BM25检索响应时间<500ms（测试集<1000文档）
   - 使用`marked.js`渲染基础Markdown回答

[✓] 验证方式
   - 输入"项目管理"返回前5个相关文档
   - 选中文本提问能返回带`[[文件名]]`的回答
阶段3：体验优化 - 2周
目标：提升可用性和性能

[✓] 核心优化点          
   ├─ services/cache/query-cache.ts  # 缓存最近10次检索结果
   ├─ ui/directory-tree/events.ts    # 右键"限定检索路径"功能
   └─ utils/security.ts              # 路径脱敏基础实现  

[✓] 关键技术
   - 混合检索响应时间优化至<1s（万级文档）
   - 目录树渲染帧率>30fps

[✓] 验证方式
   - 在万级文档库中搜索"机器学习"<1.2s
   - 右键文件夹可限定检索范围
阶段4：高级功能 - 2周+
目标：扩展生产级能力

[✓] 核心扩展模块          
   ├─ core/generator/llm-adapter      # DeepSeek-V3本地部署
   ├─ services/vector-db.ts           # LanceDB集成
   └─ test/e2e/                       # 混合检索自动化测试  

[✓] 关键技术
   - 本地模型问答延迟<5s（M1芯片）
   - 向量索引内存占用<2GB（10万文档）

[✓] 验证方式
   - 输入复杂问题生成带引用的连贯回答
   - 检索召回率>75%（测试数据集）
开发节奏控制技巧
每日构建：每天结束时确保有可运行的版本（即使功能不完整）
测试驱动：优先编写hybrid-retrieve.test.ts基础用例
```typescript
// test/e2e/hybrid-retrieve.test.ts
test('混合检索应返回BM25和语义结果', async () => {
  const results = await hybridSearch("人工智能");
  expect(results.filter(r => r.type === 'bm25').length).toBeGreaterThan(0);
  expect(results.filter(r => r.type === 'vector').length).toBeGreaterThan(0);
});
```
用户反馈环：每阶段结束后邀请3-5名Obsidian用户试用
技术债管理：在路线图中预留20%时间处理前期妥协方案
建议从MVP阶段开始，用npx create-obsidian-plugin快速初始化项目，首日即可获得可见成果。关键路径应先实现目录树→BM25检索→基础问答这条主干，再扩展其他分支功能。

## 参考技术栈

我看了一个 Obsidian 的 AI Copilot 插件的代码模块架构，通过看这个插件的大体实现，你能优化一下上面我们要做的插件的代码模块架构吗？注意，你还是需要按照上面的格式来给出完整的代码架构说明。

**AI 对话引擎模块**
核心文件：src/LLMProviders/、src/chainFactory.ts、src/chainUtils.ts
核心技术：
LangChain 框架用于 AI 对话链的构建
支持多种 LLM 提供商的集成
使用 TypeScript 实现类型安全

**上下文处理模块**
核心文件：src/contextProcessor.ts、src/contexts/
核心技术：
上下文管理和处理系统
智能文本分析
动态上下文注入

**提示词处理模块**
核心文件：src/customPromptProcessor.ts、src/promptUsageStrategy.ts
核心技术：
自定义提示词处理系统
提示词模板管理
策略模式实现提示词使用策略

**UI 组件模块**
核心文件：src/components/
核心技术：
React 框架
TailwindCSS 样式框架
组件化开发

**安全模块**
核心文件：src/encryptionService.ts、src/rateLimiter.ts
核心技术：
加密服务实现
速率限制
安全令牌管理
缓存系统

**缓存系统**
核心文件：src/cache/
核心技术：
本地缓存实现
缓存策略管理

**设置管理模块**
核心文件：src/settings/
核心技术：
Obsidian 设置 API 集成
用户配置管理

**搜索功能模块**
核心文件：src/search/
核心技术：
全文搜索实现
搜索结果优化

**工具集成模块**
核心文件：src/tools/
核心技术：
工具链集成
扩展功能支持

**核心技术栈**
前端框架：React + TypeScript
样式框架：TailwindCSS
AI 框架：LangChain
构建工具：esbuild
测试框架：Jest
代码质量：ESLint + Prettier
版本控制：Git

这个项目采用了现代化的技术栈，使用 TypeScript 确保类型安全，采用模块化的架构设计，并集成了多个先进的 AI 相关技术。项目的架构设计清晰，各个模块职责分明，便于维护和扩展。
