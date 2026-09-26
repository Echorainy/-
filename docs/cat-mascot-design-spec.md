# 猫咪助手设计规范

## 定位

“家里放哪儿”App 的轻量陪伴型猫咪助手。形象要圆润、简约、扁平、温暖、友好，并且在手机卡片尺寸下仍然容易识别。

## 造型

- 默认使用单只猫、正面坐姿。
- 身体偏瘦但保持圆润，避免球状或过度肥胖。
- 头部与身体有清晰分界。
- 耳朵较大，使用柔和圆角三角形。
- 尾巴短小，位于身体一侧。
- 脚部只保留简单圆形外轮廓，不绘制脚趾、肉垫或爪子细节。

## 线稿与表情

- 使用粗细一致的暖深棕线稿：`#3D220F`，不用纯黑。
- 外轮廓明显加粗，缩小后仍清晰。
- 眼睛是两条短而粗的圆角竖线或小椭圆。
- 鼻子极小；嘴巴省略，或只保留一条极短线。
- 不使用胡须、睫毛、复杂表情线或纹理线。
- 默认表情温和、安静、友好，略带陪伴感。

## 配色

### 猫咪固定色板

以下颜色构成最后一版猫咪形象，生成猫咪本体时保持不变：

- 主毛色：奶油橘 `#FFD093`
- 暖白区域（口鼻或腹部）：`#FFFAF4
- 耳朵内侧和脸颊：浅粉橘 `#F9B393`
- 轮廓、眼睛和鼻子：暖深棕 `#3D220F`

### App 搭配色

以下颜色只用于 App 界面或猫咪的展示背景，不作为猫咪毛色或线稿颜色：

- App 背景：奶油米白 `#F8F3E9`
- UI 搭配主色：鼠尾草绿 `#708B72`

## App 首页视觉规范

首页采用“温暖欢迎区 + 重点统计 + 到期概览”的信息层级，整体保持轻量陪伴感，让猫咪和颜色提供情绪，而不抢夺物品信息的注意力。

### 页面基础令牌

- 页面背景：奶油米白 `#F8F3E9`
- 卡片与输入框表面：暖白 `#FFFAF4`
- 主操作与欢迎区：鼠尾草绿 `#708B72`
- 主要文字、图标和分隔线强调：暖深棕 `#3D220F`
- 次要文字：低饱和棕 `#806C58`
- 边框：浅暖灰棕 `#E8DCCB`
- 统一间距：`8 / 12 / 16 / 20 / 24 px`
- 统一圆角：输入框 `16 px`、统计卡片 `18 px`、内容卡片 `20 px`、欢迎区 `24 px`

### 欢迎区

- 使用整块鼠尾草绿背景，圆角 `24 px`，移动端最小高度约 `214 px`。
- 家庭名称位于左上方，使用暖白粗体；右侧保留家庭切换入口。
- 主问候语为“今天也要把家照顾好”，使用暖白大字号，允许在窄屏自然换行。
- 辅助文案使用浅绿色白色 `#E6EEE4`，保持低对比度陪伴感。
- 猫咪位于欢迎区右侧，使用透明背景占位或最终 PNG，显示比例固定，不改变文字布局。

### 到期统计卡语义配色

四张统计卡必须使用不同语义颜色，禁止“30 天内过期”和“已过期”使用同一颜色：

- 家庭物品：柔和暖蜂蜜 `#E7B56F`，用于总量和日常状态，避免过深造成突兀。
- 30 天内过期：浅桃色 `#F4D6C7`，表示需要关注但不紧急。
- 7 天内过期：浅鼠尾草绿 `#DDE8DA`，表示近期可安排处理。
- 已过期：深陶土色 `#C27454`，表示明确需要处理的异常状态。

统计卡文字统一使用暖深棕；卡片保持稳定高度和两列布局，在窄屏不发生文字溢出。

### 到期概览

- 标题使用“到期概览”，与统计区保持 `24 px` 左右的视觉间距。
- 每条物品使用独立暖白卡片，圆角 `16 px`、浅暖边框和稳定行高。
- 状态点与右侧状态文字使用语义色：过期使用陶土色，即将到期使用蜂蜜色，正常使用鼠尾草绿。
- 物品名称使用暖深棕粗体；路径、日期和分类使用低饱和棕次要文字。

### 主操作

- “记录物品”是首页唯一高强调主按钮。
- 使用鼠尾草绿背景、暖白文字、圆角 `16 px`，保持稳定高度 `48–52 px`。
- 不在统计卡或到期列表中加入同等强度的第二主按钮。

猫咪只使用上述固定色板中的扁平纯色块，不使用渐变、复杂阴影、写实毛发或高饱和蓝紫色。生成时不得用鼠尾草绿替代猫咪主毛色，也不得用奶油米白替代透明背景。

## 生成规格

- 优先输出透明背景 PNG，尺寸 1024 × 1024。
- 居中构图，保留足够留白。
- 适用于首页欢迎区、空状态、搜索无结果、记录成功和到期提醒。
- 所有变体必须保持相同的头身比例、耳朵形状、线稿粗细、主色和极简程度。

## 固定提示词模板

```text
Original minimalist cream-orange cat mascot for a warm home organization mobile app.
One single front-facing seated cat with a slim rounded body, clearly separated head and torso, two large softly rounded triangular ears, and a small side tail.
Use a thick, consistent dark warm-brown hand-drawn outline (#3D220F). Make the eyes two short bold rounded vertical strokes. Use a tiny nose and no mouth, or only one very short subtle mouth stroke.
Keep the paws extremely simple with no toes, no paw pads, and no interior detail. Use cream-orange fur (#FFD093), one warm-white muzzle or belly patch (#FFFAF4), pale peach inner ears and optional cheeks (#F9B393), and dark warm-brown outline and facial features (#3D220F). Do not use the app sage green (#708B72) or cream-beige background (#F8F3E9) as cat colors.
Flat solid colors only. No gradients, shadows, texture, whiskers, accessories, text, logo, watermark, collage, multiple cats, complex background, or copying any specific existing character or artwork.
Transparent background, centered composition, generous empty space, clear silhouette at small mobile UI size.
```

## 禁止事项

- 过胖的球形身体或头身完全粘连
- 过小、尖锐或不对称的耳朵
- 复杂嘴巴、脚趾、肉垫、爪子或脸部纹理
- 细而断裂的线稿
- 多只猫、表情包网格、文字、水印或品牌标志
- 模仿参考图中的具体角色、构图或版权元素

## 使用规则

每次生成或修改猫咪图像前，先阅读本文件，并在提示词中保留“造型、线稿、配色、禁止事项”四部分约束。生成后检查透明背景、轮廓粗细、眼睛粗细、耳朵比例和手机小尺寸可读性。
