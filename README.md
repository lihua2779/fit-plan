# FitPlan · 健身与饮食计划助手

一个纯前端、无需安装的健身计划生成器。输入基本身体数据和目标，即可自动生成：

- 每日目标热量与三大营养素（蛋白质 / 碳水 / 脂肪）分配
- 按每周训练天数（2–6 天）生成的训练计划，含动作、组数、次数、休息与动作要点
- 每周肌群覆盖统计，检查各部位训练频率是否均衡
- 日历视图：把训练计划排进月历，训练日标注当天动作
- 日程提醒：可自定义每周训练日、训练时间与提前提醒时长，支持浏览器桌面通知和导出 .ics 日历文件
- 每日饮食安排（减脂 / 增肌 / 保持三种目标，普通或蛋奶素偏好）
- 常见食物营养参考表

## 使用方法

直接用浏览器打开 `index.html` 即可，不需要服务器或网络。生成后可点击「打印 / 保存 PDF」输出为纸质或 PDF 版本。

想让手机和其他电脑也能访问？项目已支持 PWA（可添加到主屏幕、离线使用），部署方法见 [DEPLOY.md](DEPLOY.md)（GitHub Pages / Netlify Drop / 局域网三种方式）。

## 训练分化

训练计划按每周训练天数自动匹配对应的分化方式，且每个训练日都使用不同的动作安排：

| 每周天数 | 分化方式 | 一周安排 |
| --- | --- | --- |
| 2 天 | 全身分化 | 全身 A / 全身 B |
| 3 天 | 推拉腿分化 | 推 A / 拉 A / 腿 A |
| 4 天 | 上下肢分化 | 上肢 A / 下肢 A / 上肢 B / 下肢 B |
| 5 天 | 推拉腿 + 上下肢 | 推 A / 拉 A / 腿 A / 上肢 B / 下肢 B |
| 6 天 | 推拉腿（A/B 轮换） | 推 A / 拉 A / 腿 A / 推 B / 拉 B / 腿 B |

推、拉、腿分别有 A/B 两套不同的动作模板：3 天使用 A 版（每天一个动作模式，胸肩三头 / 背二头 / 下肢分开练），6 天 A/B 轮换，一周内不会重复同一套计划。

## 动作演示 GIF 来源

训练计划中的动作演示 GIF 来自开源动作库 [ExerciseGymGifsDB](https://github.com/JahelCuadrado/ExerciseGymGifsDB)（1323 个动作、按肌群分类），已按本应用计划中实际出现的动作下载到 `img/` 目录本地使用，未下载整个动作库。

个别动作在动作库中没有完全同名的版本，采用了最接近的动作示意：杠铃深蹲使用「杠铃凳式深蹲」示意，面拉使用「绳索后束划船」示意。

## 日历与提醒

- 「日历与提醒」标签页按月显示训练计划，训练日自动标注当天动作（如「推 A」），今天高亮，可切换月份查看。
- 训练日默认按训练天数推荐（如 3 天练：周一、周三、周五），可自行增删。
- 开启桌面提醒后，页面打开时会在训练时间前 15 / 30 / 60 分钟弹出浏览器通知。
- 点击「导出日历 (.ics)」会下载每周循环 52 周的计划文件，可用 Google 日历、Outlook、Apple 日历等导入，页面关闭也能收到提醒。

## 计算原理

- **基础代谢（BMR）**：采用 Mifflin-St Jeor 公式（1990），该公式在多项验证研究中是预测 BMR 最准确的通用公式之一
  - 男性：10 × 体重(kg) + 6.25 × 身高(cm) − 5 × 年龄 + 5
  - 女性：10 × 体重(kg) + 6.25 × 身高(cm) − 5 × 年龄 − 161
- **每日总消耗（TDEE）** = BMR × 活动系数（1.2–1.9）
- **目标热量**：减脂取 TDEE 的 85%（10–20% 缺口区间内，相当于每日 300–500 kcal 缺口）；增肌取 112%（10–20% 盈余区间内）；保持为 TDEE
- **蛋白质**（按体重计算）：减脂 2.2g/kg（建议区间 1.8–2.7g/kg，热量缺口下保留肌肉）、增肌 1.8g/kg（建议区间 1.6–2.2g/kg，超过约 1.6g/kg 后增肌收益有限）、保持 1.6g/kg（建议区间 1.4–2.0g/kg）
- **脂肪**：约占总热量 25%（符合 20–35% 建议范围）；剩余热量由碳水补充
- **减脂 / 增肌速率**：减脂每周 0.5–1% 体重、增肌每周 0.25–0.5% 体重
- **训练频率**：大肌群每周至少 2 练，增肌效果优于每周 1 练

## 参考文献

1. Mifflin MD, et al. A new predictive equation for resting energy expenditure in healthy individuals. *Am J Clin Nutr*. 1990;51(2):241-247.
2. Morton RW, et al. A systematic review, meta-analysis and meta-regression of the effect of protein supplementation on resistance training-induced gains in muscle mass and strength in healthy adults. *Br J Sports Med*. 2018;52(6):376-384.
3. Aragon AA, et al. International society of sports nutrition position stand: diets and body composition. *J Int Soc Sports Nutr*. 2017;14:16.
4. Donnelly JE, et al. American College of Sports Medicine Position Stand. Appropriate intervention strategies for weight loss and prevention of weight regain for adults. *Med Sci Sports Exerc*. 2001;33(12):2145-2156.
5. Schoenfeld BJ, et al. Effects of resistance training frequency on measures of muscle hypertrophy: a systematic review and meta-analysis. *Sports Med*. 2016;46(11):1689-1697.
6. Kerksick CM, et al. ISSN exercise & sports nutrition review update: research & recommendations. *J Int Soc Sports Nutr*. 2018;15:38.

## 目录结构

```
fitness-planner/
├── index.html      页面结构
├── css/styles.css  样式（响应式 + 打印样式）
├── js/app.js       计算与生成逻辑
└── README.md       本说明
```

## 注意事项

计划基于通用健身营养学原理估算，供参考与学习使用。如有慢性疾病、饮食障碍或其他健康问题，请在开始前咨询医生或注册营养师。训练中如有疼痛应停止并寻求专业指导。

## 后续可扩展方向

- 训练重量与次数的渐进记录（localStorage）
- 体重 / 体脂率跟踪图表
- 更多训练动作库与替换动作
- 导出为 Excel / 图片格式
