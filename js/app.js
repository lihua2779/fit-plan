/* ============================================================
   FitPlan · 健身与饮食计划助手
   核心逻辑：BMR/TDEE 计算、营养素分配、训练计划生成、饮食方案生成
   ============================================================ */
'use strict';

/* ---------------- 常量与数据 ---------------- */

const ACTIVITY_LEVELS = {
  sedentary: { factor: 1.2,  label: '久坐少动' },
  light:     { factor: 1.375, label: '轻度活动' },
  moderate:  { factor: 1.55,  label: '中度活动' },
  active:    { factor: 1.725, label: '高度活动' },
  athlete:   { factor: 1.9,   label: '极高强度' },
};

const GOAL_CONFIG = {
  cut:      { label: '减脂',  calorieRatio: 0.85, proteinPerKg: 2.2, fatRatio: 0.25, cardio: true  },
  bulk:     { label: '增肌',  calorieRatio: 1.12, proteinPerKg: 1.8, fatRatio: 0.25, cardio: false },
  maintain: { label: '保持',  calorieRatio: 1.0,  proteinPerKg: 1.6, fatRatio: 0.25, cardio: false },
};

const EXPERIENCE_LABEL = {
  beginner: '新手',
  intermediate: '中级',
  advanced: '高级',
};

/* 训练动作库：名字 / 目标肌群 / 组数 / 次数 / 组间休息 / 要点 */
const WORKOUT_DAYS = {
  fullA: {
    title: '全身训练 A',
    exercises: [
      { name: '杠铃深蹲',           muscle: '股四头肌 · 臀',     sets: 4, reps: '8-10', rest: '120 秒', tip: '膝盖与脚尖同向，保持核心收紧' },
      { name: '杠铃卧推',           muscle: '胸 · 三头',         sets: 4, reps: '8-10', rest: '120 秒', tip: '肩胛骨后收下沉，杠铃触胸' },
      { name: '杠铃划船',           muscle: '背 · 二头',         sets: 4, reps: '10-12', rest: '90 秒', tip: '背部平直，用肘部带动上拉' },
      { name: '坐姿哑铃肩推',       muscle: '三角肌',            sets: 3, reps: '10-12', rest: '90 秒', tip: '下放至耳朵高度即可' },
      { name: '哑铃二头弯举',       muscle: '肱二头肌',          sets: 3, reps: '12-15', rest: '60 秒', tip: '大臂固定，不要借力摆动' },
      { name: '平板支撑',           muscle: '核心',              sets: 3, reps: '45-60 秒', rest: '60 秒', tip: '臀部收紧，身体呈一条直线' },
    ],
  },
  fullB: {
    title: '全身训练 B',
    exercises: [
      { name: '杠铃硬拉',           muscle: '后链 · 臀腿',       sets: 4, reps: '6-8',   rest: '150 秒', tip: '杠铃贴近小腿，髋部主导起身' },
      { name: '上斜哑铃卧推',       muscle: '上胸 · 三头',       sets: 4, reps: '8-10',  rest: '120 秒', tip: '手肘约 45 度夹角' },
      { name: '引体向上 / 高位下拉', muscle: '背阔肌 · 二头',     sets: 4, reps: '8-12',  rest: '120 秒', tip: '下沉肩胛骨，拉到锁骨高度' },
      { name: '哑铃箭步蹲',         muscle: '股四头肌 · 臀',     sets: 3, reps: '每侧 10-12', rest: '90 秒', tip: '前腿膝盖不超过脚尖过多' },
      { name: '哑铃侧平举',         muscle: '三角肌中束',        sets: 3, reps: '12-15', rest: '60 秒',  tip: '用肩部发力，肘微屈' },
      { name: '卷腹',               muscle: '腹直肌',            sets: 3, reps: '15-20', rest: '60 秒',  tip: '下背部贴地，呼气卷起' },
    ],
  },
  fullC: {
    title: '全身训练 C',
    exercises: [
      { name: '罗马尼亚硬拉',       muscle: '腘绳肌 · 臀',       sets: 4, reps: '8-10',  rest: '120 秒', tip: '屈髋后移，杠铃贴腿下放' },
      { name: '俯卧撑（负重可选）',  muscle: '胸 · 三头 · 核心',  sets: 4, reps: '至接近力竭', rest: '90 秒', tip: '身体呈直线，肘部约 45 度' },
      { name: '单臂哑铃划船',       muscle: '背阔肌 · 斜方肌',   sets: 4, reps: '每侧 10-12', rest: '90 秒', tip: '背部平直，避免躯干旋转' },
      { name: '杠铃臀桥',           muscle: '臀大肌',            sets: 3, reps: '12-15', rest: '90 秒',  tip: '顶峰停顿 1-2 秒' },
      { name: '面拉',               muscle: '后束 · 上背',       sets: 3, reps: '15-20', rest: '60 秒',  tip: '绳索拉向面部，外旋肩部' },
      { name: '悬垂举腿',           muscle: '下腹 · 髋屈肌',     sets: 3, reps: '10-15', rest: '60 秒',  tip: '骨盆后倾卷起，避免摆动' },
    ],
  },
  upperA: {
    title: '上肢训练 A',
    exercises: [
      { name: '杠铃卧推',           muscle: '胸 · 三头',         sets: 4, reps: '8-10',  rest: '120 秒', tip: '肩胛骨后收下沉，杠铃触胸' },
      { name: '杠铃划船',           muscle: '背 · 二头',         sets: 4, reps: '10-12', rest: '120 秒', tip: '背部平直，用肘部带动上拉' },
      { name: '坐姿哑铃肩推',       muscle: '三角肌',            sets: 3, reps: '10-12', rest: '90 秒',  tip: '下放至耳朵高度即可' },
      { name: '引体向上 / 高位下拉', muscle: '背阔肌 · 二头',     sets: 3, reps: '8-12',  rest: '90 秒',  tip: '下沉肩胛骨再发力' },
      { name: '哑铃二头弯举',       muscle: '肱二头肌',          sets: 3, reps: '12-15', rest: '60 秒',  tip: '大臂固定不摆动' },
      { name: '绳索下压',           muscle: '肱三头肌',          sets: 3, reps: '12-15', rest: '60 秒',  tip: '肘部贴近身体，全程控制' },
    ],
  },
  upperB: {
    title: '上肢训练 B',
    exercises: [
      { name: '上斜哑铃卧推',       muscle: '上胸 · 三头',       sets: 4, reps: '8-10',  rest: '120 秒', tip: '手肘约 45 度夹角' },
      { name: '高位下拉',           muscle: '背阔肌 · 二头',     sets: 4, reps: '10-12', rest: '120 秒', tip: '拉到上胸位置' },
      { name: '坐姿绳索划船',       muscle: '中背 · 后束',       sets: 3, reps: '10-12', rest: '90 秒',  tip: '挺胸收肘，顶峰收紧肩胛' },
      { name: '哑铃侧平举',         muscle: '三角肌中束',        sets: 3, reps: '12-15', rest: '60 秒',  tip: '用小重量做高次数，感受中束' },
      { name: '面拉',               muscle: '后束 · 上背',       sets: 3, reps: '15-20', rest: '60 秒',  tip: '绳索拉向面部，外旋肩部' },
      { name: '锤式弯举',           muscle: '肱二头肌 · 前臂',   sets: 3, reps: '12-15', rest: '60 秒',  tip: '中立握法，缓慢下放' },
    ],
  },
  lowerA: {
    title: '下肢训练 A',
    exercises: [
      { name: '杠铃深蹲',           muscle: '股四头肌 · 臀',     sets: 4, reps: '8-10',  rest: '150 秒', tip: '蹲到髋部略低于膝盖' },
      { name: '罗马尼亚硬拉',       muscle: '腘绳肌 · 臀',       sets: 4, reps: '8-10',  rest: '120 秒', tip: '屈髋后移，杠铃贴腿下放' },
      { name: '腿举机',             muscle: '股四头肌 · 臀',     sets: 3, reps: '12-15', rest: '90 秒',  tip: '膝盖不要完全锁死' },
      { name: '杠铃臀桥',           muscle: '臀大肌',            sets: 3, reps: '12-15', rest: '90 秒',  tip: '顶峰停顿 1-2 秒' },
      { name: '站姿提踵',           muscle: '小腿',              sets: 3, reps: '15-20', rest: '60 秒',  tip: '顶峰停顿 1 秒，缓慢下放' },
      { name: '卷腹',               muscle: '腹直肌',            sets: 3, reps: '15-20', rest: '60 秒',  tip: '下背部贴地' },
    ],
  },
  lowerB: {
    title: '下肢训练 B',
    exercises: [
      { name: '杠铃硬拉',           muscle: '后链 · 臀腿',       sets: 4, reps: '6-8',   rest: '150 秒', tip: '杠铃贴近小腿，髋部主导起身' },
      { name: '保加利亚分腿蹲',     muscle: '股四头肌 · 臀',     sets: 3, reps: '每侧 10-12', rest: '90 秒', tip: '后脚垫高，重心放在前脚掌' },
      { name: '腿弯举',             muscle: '腘绳肌',            sets: 3, reps: '12-15', rest: '90 秒',  tip: '收缩顶峰停顿 1 秒' },
      { name: '髋外展机',           muscle: '臀中肌',            sets: 3, reps: '15-20', rest: '60 秒',  tip: '控制速度，避免惯性' },
      { name: '坐姿提踵',           muscle: '小腿',              sets: 3, reps: '15-20', rest: '60 秒',  tip: '充分拉伸后缓慢下放' },
      { name: '悬垂举腿',           muscle: '下腹 · 髋屈肌',     sets: 3, reps: '10-15', rest: '60 秒',  tip: '骨盆后倾卷起' },
    ],
  },
  pushA: {
    title: '推 A（胸 · 肩 · 三头）',
    exercises: [
      { name: '杠铃卧推',           muscle: '胸 · 三头',         sets: 4, reps: '8-10',  rest: '120 秒', tip: '肩胛骨后收下沉，杠铃触胸' },
      { name: '上斜哑铃卧推',       muscle: '上胸 · 三头',       sets: 3, reps: '10-12', rest: '90 秒',  tip: '手肘约 45 度夹角' },
      { name: '坐姿哑铃肩推',       muscle: '三角肌',            sets: 4, reps: '10-12', rest: '90 秒',  tip: '下放至耳朵高度' },
      { name: '双杠臂屈伸（负重可选）', muscle: '下胸 · 三头',   sets: 3, reps: '8-12',  rest: '90 秒',  tip: '身体略前倾，肘部后展' },
      { name: '哑铃侧平举',         muscle: '三角肌中束',        sets: 3, reps: '12-15', rest: '60 秒',  tip: '用小重量，感受中束发力' },
      { name: '绳索下压',           muscle: '肱三头肌',          sets: 3, reps: '12-15', rest: '60 秒',  tip: '肘部贴近身体' },
    ],
  },
  pullA: {
    title: '拉 A（背 · 二头 · 后束）',
    exercises: [
      { name: '引体向上 / 高位下拉', muscle: '背阔肌 · 二头',     sets: 4, reps: '8-12',  rest: '120 秒', tip: '下沉肩胛骨再发力' },
      { name: '杠铃划船',           muscle: '中背 · 二头',       sets: 4, reps: '10-12', rest: '120 秒', tip: '背部平直，用肘带动' },
      { name: '坐姿绳索划船',       muscle: '中背 · 后束',       sets: 3, reps: '10-12', rest: '90 秒',  tip: '顶峰收紧肩胛骨' },
      { name: '面拉',               muscle: '后束 · 上背',       sets: 3, reps: '15-20', rest: '60 秒',  tip: '绳索拉向面部，外旋肩部' },
      { name: '哑铃二头弯举',       muscle: '肱二头肌',          sets: 3, reps: '12-15', rest: '60 秒',  tip: '大臂固定不摆动' },
      { name: '锤式弯举',           muscle: '肱二头肌 · 前臂',   sets: 3, reps: '12-15', rest: '60 秒',  tip: '中立握法，缓慢下放' },
    ],
  },
  legsA: {
    title: '腿 A（股四 · 腘绳 · 臀 · 小腿）',
    exercises: [
      { name: '杠铃深蹲',           muscle: '股四头肌 · 臀',     sets: 4, reps: '8-10',  rest: '150 秒', tip: '蹲到髋部略低于膝盖' },
      { name: '罗马尼亚硬拉',       muscle: '腘绳肌 · 臀',       sets: 4, reps: '8-10',  rest: '120 秒', tip: '屈髋后移，杠铃贴腿' },
      { name: '腿举机',             muscle: '股四头肌 · 臀',     sets: 3, reps: '12-15', rest: '90 秒',  tip: '膝盖不要完全锁死' },
      { name: '腿弯举',             muscle: '腘绳肌',            sets: 3, reps: '12-15', rest: '90 秒',  tip: '顶峰停顿 1 秒' },
      { name: '站姿提踵',           muscle: '小腿',              sets: 3, reps: '15-20', rest: '60 秒',  tip: '顶峰停顿 1 秒' },
      { name: '卷腹',               muscle: '腹直肌',            sets: 3, reps: '15-20', rest: '60 秒',  tip: '下背部贴地' },
    ],
  },
  pushB: {
    title: '推 B（胸 · 肩 · 三头）',
    exercises: [
      { name: '上斜杠铃卧推',       muscle: '上胸 · 三头',       sets: 4, reps: '8-10',  rest: '120 秒', tip: '凳角 15-30 度，肩胛骨后收下沉' },
      { name: '杠铃站姿肩推',       muscle: '三角肌',            sets: 4, reps: '8-10',  rest: '120 秒', tip: '核心收紧，杠铃过顶不锁死肘' },
      { name: '哑铃飞鸟（平板）',   muscle: '胸大肌',            sets: 3, reps: '12-15', rest: '90 秒',  tip: '肘微屈，下放至胸部有拉伸感' },
      { name: '器械推胸',           muscle: '胸 · 三头',         sets: 3, reps: '10-12', rest: '90 秒',  tip: '顶峰收缩 1 秒，避免完全锁死' },
      { name: '哑铃前平举',         muscle: '三角肌前束',        sets: 3, reps: '12-15', rest: '60 秒',  tip: '抬至肩高，缓慢下放' },
      { name: '仰卧哑铃臂屈伸',     muscle: '肱三头肌',          sets: 3, reps: '12-15', rest: '60 秒',  tip: '大臂固定，只动前臂' },
    ],
  },
  pullB: {
    title: '拉 B（背 · 二头 · 后束）',
    exercises: [
      { name: '单臂哑铃划船',       muscle: '背阔肌 · 斜方肌',   sets: 4, reps: '每侧 10-12', rest: '120 秒', tip: '背部平直，避免躯干旋转' },
      { name: '直臂下压',           muscle: '背阔肌',            sets: 3, reps: '12-15', rest: '90 秒',  tip: '手臂伸直，用背阔肌带动下压' },
      { name: 'T 杠划船',           muscle: '中背',              sets: 4, reps: '10-12', rest: '120 秒', tip: '挺胸收肘，顶峰收紧肩胛骨' },
      { name: '杠铃耸肩',           muscle: '斜方肌上束',        sets: 3, reps: '12-15', rest: '90 秒',  tip: '垂直向上耸肩，不要转肩' },
      { name: '牧师凳弯举',         muscle: '肱二头肌',          sets: 3, reps: '12-15', rest: '60 秒',  tip: '上臂贴紧凳面，顶峰收缩' },
      { name: '反向飞鸟',           muscle: '三角肌后束',        sets: 3, reps: '15-20', rest: '60 秒',  tip: '俯身或趴凳，肘微屈外展' },
    ],
  },
  legsB: {
    title: '腿 B（股四 · 腘绳 · 臀 · 小腿）',
    exercises: [
      { name: '腿举机',             muscle: '股四头肌 · 臀',     sets: 4, reps: '10-12', rest: '120 秒', tip: '下放至膝盖约 90 度，不锁死' },
      { name: '保加利亚分腿蹲',     muscle: '股四头肌 · 臀',     sets: 3, reps: '每侧 10-12', rest: '90 秒', tip: '后脚垫高，重心放在前脚掌' },
      { name: '腿弯举',             muscle: '腘绳肌',            sets: 4, reps: '12-15', rest: '90 秒',  tip: '顶峰停顿 1 秒，缓慢还原' },
      { name: '髋外展机',           muscle: '臀中肌',            sets: 3, reps: '15-20', rest: '60 秒',  tip: '控制速度，避免惯性' },
      { name: '坐姿提踵',           muscle: '小腿',              sets: 4, reps: '15-20', rest: '60 秒',  tip: '顶峰停顿 1 秒，充分拉伸' },
      { name: '侧平板支撑',         muscle: '腹斜肌 · 核心',     sets: 3, reps: '每侧 30-45 秒', rest: '60 秒', tip: '髋部抬起，身体呈一条直线' },
    ],
  },
};

/* 按每周训练天数 -> 分化类型与训练日顺序 */
const SPLIT_INFO = {
  2: { label: '全身分化', desc: '全身 A / 全身 B 交替训练，动作覆盖全身，适合新手或时间有限的训练者。' },
  3: { label: '推拉腿分化', desc: '推 A（胸 · 肩 · 三头）/ 拉 A（背 · 二头 · 后束）/ 腿 A（股四 · 臀 · 腘绳）。每天只练同一动作模式的肌群，训练动作连贯、恢复也更好安排。' },
  4: { label: '上下肢分化', desc: '上肢 A / 下肢 A / 上肢 B / 下肢 B，每个部位每周 2 练，是增肌效率很高的经典分化。' },
  5: { label: '推拉腿 + 上下肢分化', desc: '推 A / 拉 A / 腿 A / 上肢 B / 下肢 B，前三天练大项，后两天补充细节。' },
  6: { label: '推拉腿分化（A/B 轮换）', desc: '推 A / 拉 A / 腿 A / 推 B / 拉 B / 腿 B，每个部位每周 2 练，A/B 版本动作不同，避免枯燥。' },
};

const SPLIT_MAP = {
  2: ['fullA', 'fullB'],
  3: ['pushA', 'pullA', 'legsA'],
  4: ['upperA', 'lowerA', 'upperB', 'lowerB'],
  5: ['pushA', 'pullA', 'legsA', 'upperB', 'lowerB'],
  6: ['pushA', 'pullA', 'legsA', 'pushB', 'pullB', 'legsB'],
};

/* 每日饮食模板：餐次 / 热量占比 / 示例食物 / 替换建议 */
const MEAL_PLANS = {
  cut: {
    meals: [
      { name: '早餐', pct: 0.25 },
      { name: '午餐', pct: 0.35 },
      { name: '加餐', pct: 0.10 },
      { name: '晚餐', pct: 0.30 },
    ],
    sample: {
      normal: [
        '燕麦 50g（用低脂奶或水煮）+ 水煮蛋 2 个 + 水果 1 份',
        '杂粮饭 150g + 鸡胸肉/瘦牛肉 150g + 蔬菜 1 大份 + 橄榄油 1 勺',
        '希腊酸奶 1 杯 + 苹果/蓝莓 1 份',
        '红薯/糙米 150g + 鱼/虾 150g + 蔬菜 2 大份',
      ],
      vegetarian: [
        '燕麦 50g + 鸡蛋 2 个 + 水果 1 份',
        '杂粮饭 150g + 豆腐/豆干 200g + 蔬菜 1 大份 + 橄榄油 1 勺',
        '希腊酸奶 1 杯 + 坚果 10g',
        '红薯 150g + 鸡蛋 2 个/豆腐 150g + 蔬菜 2 大份',
      ],
    },
  },
  bulk: {
    meals: [
      { name: '早餐', pct: 0.25 },
      { name: '上午加餐', pct: 0.10 },
      { name: '午餐', pct: 0.30 },
      { name: '练前 / 练后加餐', pct: 0.10 },
      { name: '晚餐', pct: 0.25 },
    ],
    sample: {
      normal: [
        '燕麦 80g + 牛奶 250ml + 鸡蛋 3 个 + 香蕉 1 根',
        '全麦面包 2 片 + 花生酱 1 勺 + 希腊酸奶 1 杯',
        '米饭 250g + 牛肉/鸡腿肉 200g + 蔬菜 1 大份',
        '练后：乳清蛋白 1 勺 + 香蕉 1 根 / 米饭 150g + 鸡胸 100g',
        '米饭 200g + 鱼/虾 200g + 蔬菜 2 大份 + 橄榄油 1 勺',
      ],
      vegetarian: [
        '燕麦 80g + 牛奶 250ml + 鸡蛋 3 个 + 香蕉 1 根',
        '全麦面包 2 片 + 花生酱 1 勺 + 希腊酸奶 1 杯',
        '米饭 250g + 豆腐/天贝 250g + 蔬菜 1 大份',
        '练后：乳清蛋白 1 勺 + 香蕉 1 根 / 米饭 150g + 鸡蛋 2 个',
        '米饭 200g + 豆制品 200g + 蔬菜 2 大份 + 橄榄油 1 勺',
      ],
    },
  },
  maintain: {
    meals: [
      { name: '早餐', pct: 0.25 },
      { name: '午餐', pct: 0.35 },
      { name: '加餐', pct: 0.10 },
      { name: '晚餐', pct: 0.30 },
    ],
    sample: {
      normal: [
        '燕麦 60g + 牛奶 250ml + 鸡蛋 2 个 + 水果 1 份',
        '杂粮饭 200g + 鸡胸肉/牛肉 150g + 蔬菜 1 大份 + 橄榄油 1 勺',
        '希腊酸奶 1 杯 + 坚果 10g',
        '红薯/糙米 180g + 鱼/豆腐 150g + 蔬菜 2 大份',
      ],
      vegetarian: [
        '燕麦 60g + 牛奶 250ml + 鸡蛋 2 个 + 水果 1 份',
        '杂粮饭 200g + 豆腐/豆干 200g + 蔬菜 1 大份 + 橄榄油 1 勺',
        '希腊酸奶 1 杯 + 坚果 10g',
        '红薯 180g + 鸡蛋 2 个/豆腐 150g + 蔬菜 2 大份',
      ],
    },
  },
};

/* 常见食物参考（每份） */
const FOOD_TABLE = [
  { name: '鸡胸肉（熟）',        amount: '100g', kcal: 133, protein: 27,  carbs: 0,   fat: 3   },
  { name: '瘦牛肉（熟）',        amount: '100g', kcal: 200, protein: 26,  carbs: 0,   fat: 10  },
  { name: '三文鱼',              amount: '100g', kcal: 208, protein: 20,  carbs: 0,   fat: 13  },
  { name: '虾仁',                amount: '100g', kcal: 99,  protein: 24,  carbs: 0,   fat: 0.3 },
  { name: '鸡蛋',                amount: '1 个', kcal: 72,  protein: 6.5, carbs: 0.5, fat: 5   },
  { name: '北豆腐',              amount: '100g', kcal: 84,  protein: 8,   carbs: 4,   fat: 4   },
  { name: '全脂牛奶',            amount: '250ml',kcal: 135, protein: 8,   carbs: 12,  fat: 7   },
  { name: '希腊酸奶',            amount: '100g', kcal: 59,  protein: 10,  carbs: 4,   fat: 0.4 },
  { name: '乳清蛋白粉',          amount: '30g',  kcal: 120, protein: 24,  carbs: 3,   fat: 1.5 },
  { name: '米饭（熟）',          amount: '100g', kcal: 116, protein: 2.6, carbs: 26,  fat: 0.3 },
  { name: '杂粮饭（熟）',        amount: '100g', kcal: 112, protein: 3.5, carbs: 23,  fat: 0.7 },
  { name: '燕麦（干）',          amount: '100g', kcal: 389, protein: 16.9,carbs: 66,  fat: 6.9 },
  { name: '红薯',                amount: '100g', kcal: 86,  protein: 1.6, carbs: 20,  fat: 0.1 },
  { name: '全麦面包',            amount: '2 片', kcal: 160, protein: 6,   carbs: 28,  fat: 2.5 },
  { name: '香蕉',                amount: '1 根', kcal: 93,  protein: 1.4, carbs: 22,  fat: 0.2 },
  { name: '苹果',                amount: '1 个', kcal: 95,  protein: 0.5, carbs: 25,  fat: 0.3 },
  { name: '西兰花',              amount: '100g', kcal: 36,  protein: 4.1, carbs: 4.3, fat: 0.6 },
  { name: '菠菜',                amount: '100g', kcal: 23,  protein: 2.9, carbs: 3.6, fat: 0.4 },
  { name: '橄榄油',              amount: '1 勺', kcal: 90,  protein: 0,   carbs: 0,   fat: 10  },
  { name: '杏仁',                amount: '28g',  kcal: 164, protein: 6,   carbs: 6,   fat: 14  },
  { name: '花生酱',              amount: '16g',  kcal: 95,  protein: 4,   carbs: 3.5, fat: 8   },
  { name: '西瓜',                amount: '200g', kcal: 60,  protein: 1.2, carbs: 15,  fat: 0.2 },
];

/* ---------------- 动作演示 GIF（本地文件，来自开源动作库 ExerciseGymGifsDB） ---------------- */

/* motionId -> 本地 GIF 文件 */
const EXERCISE_IMAGES = {
  squat: 'img/squat.gif',
  deadlift: 'img/deadlift.gif',
  rdl: 'img/rdl.gif',
  row: 'img/row.gif',
  oneArmRow: 'img/oneArmRow.gif',
  seatedRow: 'img/seatedRow.gif',
  tBarRow: 'img/tBarRow.gif',
  ohp: 'img/ohp.gif',
  standingOhp: 'img/standingOhp.gif',
  pullup: 'img/pullup.gif',
  latPulldown: 'img/latPulldown.gif',
  straightPulldown: 'img/straightPulldown.gif',
  lunge: 'img/lunge.gif',
  splitSquat: 'img/splitSquat.gif',
  hipThrust: 'img/hipThrust.gif',
  lateralRaise: 'img/lateralRaise.gif',
  frontRaise: 'img/frontRaise.gif',
  curl: 'img/curl.gif',
  hammerCurl: 'img/hammerCurl.gif',
  preacherCurl: 'img/preacherCurl.gif',
  pushdown: 'img/pushdown.gif',
  dip: 'img/dip.gif',
  lyingExt: 'img/lyingExt.gif',
  facePull: 'img/facePull.gif',
  reverseFly: 'img/reverseFly.gif',
  pushup: 'img/pushup.gif',
  plank: 'img/plank.gif',
  sidePlank: 'img/sidePlank.gif',
  crunch: 'img/crunch.gif',
  legRaise: 'img/legRaise.gif',
  calfRaise: 'img/calfRaise.gif',
  seatedCalf: 'img/seatedCalf.gif',
  shrug: 'img/shrug.gif',
  abduction: 'img/abduction.gif',
  fly: 'img/fly.gif',
  legCurl: 'img/legCurl.gif',
  legPress: 'img/legPress.gif',
  bench: 'img/bench.gif',
  inclinePress: 'img/inclinePress.gif',
  machinePress: 'img/machinePress.gif',
};

/* 根据动作名称匹配演示 GIF */
function motionFor(name) {
  const n = name;
  if (n.includes('直臂下压')) return 'straightPulldown';
  if (n.includes('双杠臂屈伸')) return 'dip';
  if (n.includes('仰卧哑铃臂屈伸')) return 'lyingExt';
  if (n.includes('腿弯举')) return 'legCurl';
  if (n.includes('腿举')) return 'legPress';
  if (n.includes('深蹲')) return 'squat';
  if (n.includes('分腿蹲')) return 'splitSquat';
  if (n.includes('箭步蹲')) return 'lunge';
  if (n.includes('罗马尼亚')) return 'rdl';
  if (n.includes('硬拉')) return 'deadlift';
  if (n.includes('上斜') && n.includes('卧推')) return 'inclinePress';
  if (n.includes('器械推胸')) return 'machinePress';
  if (n.includes('卧推')) return 'bench';
  if (n.includes('站姿肩推')) return 'standingOhp';
  if (n.includes('肩推')) return 'ohp';
  if (n.includes('引体')) return 'pullup';
  if (n.includes('高位下拉')) return 'latPulldown';
  if (n.includes('臀桥')) return 'hipThrust';
  if (n.includes('侧平举')) return 'lateralRaise';
  if (n.includes('前平举')) return 'frontRaise';
  if (n.includes('锤式弯举')) return 'hammerCurl';
  if (n.includes('牧师凳弯举')) return 'preacherCurl';
  if (n.includes('弯举')) return 'curl';
  if (n.includes('下压')) return 'pushdown';
  if (n.includes('面拉')) return 'facePull';
  if (n.includes('反向飞鸟')) return 'reverseFly';
  if (n.includes('俯卧撑')) return 'pushup';
  if (n.includes('侧平板')) return 'sidePlank';
  if (n.includes('平板支撑')) return 'plank';
  if (n.includes('卷腹')) return 'crunch';
  if (n.includes('悬垂举腿')) return 'legRaise';
  if (n.includes('坐姿提踵')) return 'seatedCalf';
  if (n.includes('提踵')) return 'calfRaise';
  if (n.includes('耸肩')) return 'shrug';
  if (n.includes('髋外展')) return 'abduction';
  if (n.includes('飞鸟')) return 'fly';
  if (n.includes('坐姿绳索划船')) return 'seatedRow';
  if (n.includes('单臂哑铃划船')) return 'oneArmRow';
  if (n.includes('T 杠划船') || n.includes('T杠划船')) return 'tBarRow';
  if (n.includes('划船')) return 'row';
  return null;
}

/* ---------------- 计算函数 ---------------- */

function getInput() {
  const age = Number(document.getElementById('age').value);
  const height = Number(document.getElementById('height').value);
  const weight = Number(document.getElementById('weight').value);

  const problems = [];
  if (!age || age < 14 || age > 90) problems.push('年龄需在 14-90 之间');
  if (!height || height < 120 || height > 230) problems.push('身高需在 120-230cm 之间');
  if (!weight || weight < 30 || weight > 200) problems.push('体重需在 30-200kg 之间');
  if (problems.length) {
    const note = document.getElementById('saveNote');
    note.style.color = '#dc2626';
    note.textContent = '请检查：' + problems.join('；');
    return null;
  }

  const note = document.getElementById('saveNote');
  note.style.color = '#16a34a';
  return {
    sex: document.querySelector('.seg-btn.active[data-target="sex"]').dataset.value,
    age,
    height,
    weight,
    activity: document.getElementById('activity').value,
    goal: document.getElementById('goal').value,
    days: Number(document.getElementById('days').value),
    experience: document.getElementById('experience').value,
    diet: document.getElementById('diet').value,
  };
}

/* Mifflin-St Jeor 基础代谢估算 */
function calcBMR(sex, weight, height, age) {
  const base = 10 * weight + 6.25 * height - 5 * age;
  return sex === 'male' ? base + 5 : base - 161;
}

function calcTargets(input) {
  const bmr = calcBMR(input.sex, input.weight, input.height, input.age);
  const tdee = bmr * ACTIVITY_LEVELS[input.activity].factor;
  const goal = GOAL_CONFIG[input.goal];
  const calories = Math.round(tdee * goal.calorieRatio);
  const protein = Math.round(input.weight * goal.proteinPerKg);
  const fat = Math.round((calories * goal.fatRatio) / 9);
  const carbs = Math.round((calories - protein * 4 - fat * 9) / 4);
  const waterMl = Math.round(input.weight * 35);
  return {
    bmr: Math.round(bmr),
    tdee: Math.round(tdee),
    calories,
    protein,
    carbs,
    fat,
    waterMl,
    goalLabel: goal.label,
    activityLabel: ACTIVITY_LEVELS[input.activity].label,
  };
}

/* 根据经验调整组数：新手每组动作减 1 组 */
function buildWorkoutPlan(input) {
  const split = SPLIT_MAP[input.days];
  const isBeginner = input.experience === 'beginner';
  const days = split.map((key, i) => {
    const day = WORKOUT_DAYS[key];
    const exercises = day.exercises.map((ex) => {
      const sets = isBeginner ? Math.max(ex.sets - 1, 2) : ex.sets;
      return { ...ex, sets };
    });
    return {
      dayIndex: i + 1,
      title: day.title,
      exercises,
    };
  });

  const tips = [];
  if (isBeginner) {
    tips.push('新手前 2-4 周以学习动作模式为主，优先使用轻重量保证动作标准，再逐步加重。');
  }
  if (input.goal === 'cut') {
    tips.push('减脂期力量训练后建议加 20-30 分钟中低强度有氧（快走 / 单车 / 爬坡），组间休息可缩短到 60-90 秒。');
  }
  if (input.goal === 'bulk') {
    tips.push('增肌期以渐进超负荷为核心：当一组次数能轻松达到上限时，下次增加 2.5-5kg 重量。');
  }
  tips.push('每次训练前先做 5-10 分钟动态热身（开合跳、髋部绕环、肩部环绕等），复合动作前再做 2-3 组空杆/轻重量热身组。');
  tips.push('力量训练安排在训练日的同一时段，保证每周 2 天以上休息日用于恢复。');

  return {
    days,
    tips,
    coverage: computeCoverage(days),
    splitLabel: SPLIT_INFO[input.days].label,
    splitDesc: SPLIT_INFO[input.days].desc,
  };
}

function buildDietPlan(input, targets) {
  const plan = MEAL_PLANS[input.goal];
  const samples = plan.sample[input.diet === 'vegetarian' ? 'vegetarian' : 'normal'];

  const meals = plan.meals.map((meal, i) => ({
    name: meal.name,
    kcal: Math.round(targets.calories * meal.pct),
    protein: Math.round(targets.protein * meal.pct),
    carbs: Math.round(targets.carbs * meal.pct),
    fat: Math.round(targets.fat * meal.pct),
    sample: samples[i],
  }));

  const proteinTip = input.diet === 'vegetarian'
    ? '素食者蛋白质来源：鸡蛋、牛奶、酸奶、豆腐、豆干、天贝，建议每餐至少包含 1-2 份蛋白质食物。'
    : '蛋白质来源建议多样化：鸡胸、牛肉、鱼虾、鸡蛋、奶制品、乳清蛋白粉交替食用。';

  return { meals, proteinTip };
}

/* ---------------- 渲染 ---------------- */

function renderStats(input, targets) {
  const grid = document.getElementById('statGrid');
  const deficitInfo = input.goal === 'cut'
    ? `比维持热量低约 ${Math.round(targets.tdee - targets.calories)} kcal（约 15% 缺口，建议 10–20%）`
    : input.goal === 'bulk'
      ? `比维持热量高约 ${Math.round(targets.calories - targets.tdee)} kcal（约 12% 盈余，建议 10–20%）`
      : '与维持热量持平';

  const stats = [
    { label: '每日目标热量', value: `${targets.calories}`, unit: 'kcal', extra: deficitInfo },
    { label: '蛋白质', value: `${targets.protein}`, unit: 'g', extra: `约 ${Math.round(targets.protein * 4)} kcal` },
    { label: '碳水', value: `${targets.carbs}`, unit: 'g', extra: `约 ${Math.round(targets.carbs * 4)} kcal` },
    { label: '脂肪', value: `${targets.fat}`, unit: 'g', extra: `约 ${Math.round(targets.fat * 9)} kcal` },
    { label: '每日饮水', value: `${targets.waterMl}`, unit: 'ml', extra: '建议分多次饮用' },
  ];

  grid.innerHTML = stats.map((s) => `
    <div class="stat-card">
      <div class="stat-label">${s.label}</div>
      <div class="stat-value">${s.value}<span class="stat-unit">${s.unit}</span></div>
      <div class="stat-extra">${s.extra}</div>
    </div>
  `).join('');

  // 宏量营养素分配条
  const totalMacroKcal = targets.protein * 4 + targets.carbs * 4 + targets.fat * 9;
  const pct = (v) => Math.round((v / totalMacroKcal) * 100);
  document.getElementById('segProtein').style.width = pct(targets.protein * 4) + '%';
  document.getElementById('segCarbs').style.width = pct(targets.carbs * 4) + '%';
  document.getElementById('segFat').style.width = pct(targets.fat * 9) + '%';
  document.getElementById('macroBar').hidden = false;
  document.getElementById('macroLegend').textContent =
    `热量分配：蛋白质 ${pct(targets.protein * 4)}% · 碳水 ${pct(targets.carbs * 4)}% · 脂肪 ${pct(targets.fat * 9)}%`;

  const profile = `${targets.goalLabel} · ${ACTIVITY_LEVELS[input.activity].label} · 每周 ${input.days} 练 · ${EXPERIENCE_LABEL[input.experience]}`;
  document.getElementById('profileSummary').textContent = profile;
}

function renderTraining(plan) {
  const container = document.getElementById('tab-training');
  const intro = `
    <div class="plan-intro">
      <h3>周训练安排 · ${plan.splitLabel}</h3>
      <p>${plan.splitDesc}</p>
      <p>${plan.days.map((d) => `第 ${d.dayIndex} 天：${d.title}`).join(' · ')}，其余为休息日（可安排散步或拉伸）。</p>
      <p class="demo-note">每个动作下方配有动态演示 GIF（来源：开源动作库 ExerciseGymGifsDB，见 README 署名）。</p>
    </div>
    <div class="tip-box">
      ${plan.tips.map((t) => `<p>• ${t}</p>`).join('')}
    </div>
  `;

  const highFreq = plan.coverage.filter((c) => c.count >= 4);
  const isFullBody = plan.splitLabel.includes('全身');
  const coverageNote = isFullBody
    ? '全身分化：每天覆盖全身主要肌群，单块肌群每周 2 次左右，适合每周训练天数较少、需要全身均衡发展的人。'
    : highFreq.length
      ? `注意：${highFreq.map((h) => `${h.group} 每周 ${h.count} 次`).join('、')}，频率较高，训练时建议控制容量并保证充分恢复。`
      : '大肌群每周约 2 练、间隔 48 小时以上，兼顾刺激频率与恢复。';
  const coverageHtml = `
    <div class="coverage">
      <div class="coverage-head">
        <h4>本周肌群覆盖</h4>
        <span>大肌群建议每周训练 2 次以上</span>
      </div>
      <div class="chips">
        ${plan.coverage.map((c) => `<span class="chip">${c.group} <b>×${c.count}</b></span>`).join('')}
      </div>
      <p class="coverage-note">${coverageNote}</p>
    </div>
  `;

  const days = plan.days.map((d) => `
    <div class="day-card">
      <h4>Day ${d.dayIndex} · ${d.title}</h4>
      <div class="table-wrap">
        <table>
          <thead>
            <tr><th>#</th><th>动作</th><th>目标肌群</th><th>组数 × 次数</th><th>组间休息</th><th>要点</th></tr>
          </thead>
          <tbody>
            ${d.exercises.map((ex, i) => `
              ${(() => {
                const motionId = motionFor(ex.name);
                const src = motionId ? EXERCISE_IMAGES[motionId] : null;
                const demoHtml = src
                  ? `<span class="demo-gif-wrap"><img class="demo-gif" src="${src}" alt="${ex.name} 动作演示" loading="lazy"></span>`
                  : '';
                return `
              <tr>
                <td>${i + 1}</td>
                <td class="strong">${ex.name}${demoHtml}</td>
                <td>${ex.muscle}</td>
                <td>${ex.sets} × ${ex.reps}</td>
                <td>${ex.rest}</td>
                <td class="tip-cell">${ex.tip}</td>
              </tr>
                `;
              })()}
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `).join('');

  container.innerHTML = intro + coverageHtml + days;
}

function renderDiet(dietPlan, targets, input) {
  const container = document.getElementById('tab-diet');
  const proteinRange = input.goal === 'cut'
    ? '1.8–2.7 g/kg（减脂期保留肌肉）'
    : input.goal === 'bulk'
      ? '1.6–2.2 g/kg（增肌）'
      : '1.4–2.0 g/kg（保持）';
  const goalNote = input.goal === 'cut'
    ? '减脂期建议每日热量缺口 300–500 kcal（10–20% TDEE），每周减重 0.5–1% 体重；若两周体重无变化，可再减少 100–150 kcal。'
    : input.goal === 'bulk'
      ? '增肌期建议每日热量盈余约 300–500 kcal（10–20%），每周增重 0.25–0.5% 体重较为理想，增重过快意味着脂肪也增加较多。'
      : '保持期以体重稳定在 ±1kg 内为目标，定期根据活动量微调热量。';

  const meals = `
    <div class="plan-intro">
      <h3>每日饮食安排</h3>
      <p>目标 ${targets.calories} kcal，蛋白质 ${targets.protein}g / 碳水 ${targets.carbs}g / 脂肪 ${targets.fat}g（约占总热量 25%，符合 20–35% 建议范围）。下面是一份示例搭配，同类食物可自由替换。</p>
    </div>
    <div class="tip-box">
      <p>• ${goalNote}</p>
      <p>• 蛋白质建议区间：${proteinRange}。本方案取 ${targets.protein}g（${GOAL_CONFIG[input.goal].proteinPerKg} g/kg），依据 Morton 2018 荟萃分析（增肌平台期约 1.6 g/kg/天）与 ISSN 2017 立场声明。</p>
      <p>• ${dietPlan.proteinTip}</p>
      <p>• 训练日可把「练前 / 练后加餐」安排在训练前后 1 小时内；训练前 2 小时完成正餐。</p>
      <p>• 每天饮水 ${targets.waterMl}ml（约 35 ml/kg，运动人群常见建议 30–40 ml/kg），睡眠 7–9 小时，睡眠不足会显著影响恢复与食欲控制。</p>
    </div>
    <div class="meal-list">
      ${dietPlan.meals.map((m) => `
        <div class="meal-card">
          <div class="meal-head">
            <h4>${m.name}</h4>
            <div class="meal-macros">
              <span>${m.kcal} kcal</span>
              <span>蛋白质 ${m.protein}g</span>
              <span>碳水 ${m.carbs}g</span>
              <span>脂肪 ${m.fat}g</span>
            </div>
          </div>
          <p class="meal-sample">${m.sample}</p>
        </div>
      `).join('')}
    </div>
  `;

  container.innerHTML = meals;
}

function renderFoods() {
  const container = document.getElementById('tab-foods');
  container.innerHTML = `
    <div class="plan-intro">
      <h3>常见食物营养参考</h3>
      <p>以「份」为单位估算，方便你自由组合每天的蛋白质、碳水和脂肪。实际数值会因做法与品牌略有差异。</p>
    </div>
    <div class="table-wrap">
      <table>
        <thead>
          <tr><th>食物</th><th>份量</th><th>热量 (kcal)</th><th>蛋白质 (g)</th><th>碳水 (g)</th><th>脂肪 (g)</th></tr>
        </thead>
        <tbody>
          ${FOOD_TABLE.map((f) => `
            <tr>
              <td class="strong">${f.name}</td>
              <td>${f.amount}</td>
              <td>${f.kcal}</td>
              <td>${f.protein}</td>
              <td>${f.carbs}</td>
              <td>${f.fat}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}

/* ---------------- 日历与提醒 ---------------- */

const WEEKDAY_NAMES = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
const WEEKDAY_ICS = ['MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU'];

/* 各训练天数对应的推荐训练日（0=周一） */
const DEFAULT_WEEKDAYS = {
  2: [0, 3],
  3: [0, 2, 4],
  4: [0, 1, 3, 4],
  5: [0, 1, 2, 3, 4],
  6: [0, 1, 2, 3, 4, 5],
};

const MUSCLE_ORDER = ['胸', '背', '肩', '二头', '三头', '腿前', '臀·腿后', '小腿', '核心'];

let calendarYear = new Date().getFullYear();
let calendarMonth = new Date().getMonth();
let currentPlan = null;
let reminderSettings = { weekdays: null, time: '19:00', leadMin: 30, enabled: false, customized: false };

/* 根据动作的肌群描述归入主要肌群 */
function muscleGroupOf(muscle) {
  if (muscle.includes('胸')) return '胸';
  if (muscle.includes('背')) return '背';
  if (muscle.includes('斜方肌') || muscle.includes('三角肌') ||
      muscle.includes('前束') || muscle.includes('中束') || muscle.includes('后束')) return '肩';
  if (muscle.includes('二头')) return '二头';
  if (muscle.includes('三头')) return '三头';
  if (muscle.includes('股四')) return '腿前';
  if (muscle.includes('臀') || muscle.includes('腘绳')) return '臀·腿后';
  if (muscle.includes('小腿')) return '小腿';
  if (muscle.includes('核心') || muscle.includes('腹')) return '核心';
  return '其他';
}

/* 统计一周内各主要肌群的训练次数 */
function computeCoverage(days) {
  const counts = {};
  MUSCLE_ORDER.forEach((g) => { counts[g] = 0; });
  days.forEach((d) => d.exercises.forEach((ex) => {
    const g = muscleGroupOf(ex.muscle);
    if (g in counts) counts[g]++;
  }));
  return MUSCLE_ORDER
    .map((g) => ({ group: g, count: counts[g] }))
    .filter((c) => c.count > 0);
}

function saveSettings() {
  try {
    localStorage.setItem('fitplan-settings', JSON.stringify(reminderSettings));
  } catch (e) { /* 忽略 */ }
}

function notifyStatusText() {
  if (!('Notification' in window)) {
    return '当前浏览器不支持桌面通知，建议导出 .ics 文件导入系统日历实现提醒。';
  }
  if (reminderSettings.enabled) {
    return `桌面提醒已开启：每周 ${reminderSettings.weekdays.length} 个训练日，每天 ${reminderSettings.time} 提前 ${reminderSettings.leadMin} 分钟提醒（页面打开时生效）。建议同时导出 .ics 实现离线提醒。`;
  }
  return '未开启桌面提醒。开启后浏览器会定时检查训练日程并弹出通知；导出 .ics 可导入手机 / 电脑系统日历，即使页面关闭也能提醒。';
}

function renderCalendar(plan) {
  if (!reminderSettings.customized) {
    reminderSettings.weekdays = [...DEFAULT_WEEKDAYS[plan.days.length]];
  }
  const container = document.getElementById('tab-calendar');
  const sortedWeekdays = [...reminderSettings.weekdays].sort((a, b) => a - b);
  const weekdayPlan = {};
  plan.days.forEach((d, i) => {
    if (sortedWeekdays[i] !== undefined) weekdayPlan[sortedWeekdays[i]] = d;
  });
  reminderSettings.weekdayPlan = weekdayPlan;

  const first = new Date(calendarYear, calendarMonth, 1);
  const offset = (first.getDay() + 6) % 7; // 距周一的天数
  const start = new Date(calendarYear, calendarMonth, 1 - offset);
  const today = new Date();

  const dowRow = WEEKDAY_NAMES.map((n) => `<div class="cal-dow">${n}</div>`).join('');
  let cells = '';
  for (let i = 0; i < 42; i++) {
    const d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
    const inMonth = d.getMonth() === calendarMonth;
    const wd = (d.getDay() + 6) % 7;
    const planDay = weekdayPlan[wd];
    const isToday = d.toDateString() === today.toDateString();
    cells += `
      <div class="cal-cell${inMonth ? '' : ' muted'}${isToday ? ' today' : ''}">
        <span class="cal-date">${d.getDate()}</span>
        ${planDay ? `<span class="cal-workout">${planDay.title.split('（')[0]}</span>` : ''}
      </div>`;
  }

  container.innerHTML = `
    <div class="plan-intro">
      <h3>训练日历</h3>
      <p>训练计划已按你选定的训练日排进日历（每周循环），今天会自动高亮。</p>
    </div>
    <div class="cal-card">
      <div class="cal-head">
        <button type="button" class="cal-nav" data-cal="prev">‹ 上月</button>
        <h3>${calendarYear} 年 ${calendarMonth + 1} 月</h3>
        <button type="button" class="cal-nav" data-cal="today">本月</button>
        <button type="button" class="cal-nav" data-cal="next">下月 ›</button>
      </div>
      <div class="cal-grid">${dowRow}${cells}</div>
      <div class="cal-legend">
        <span class="legend-dot today-dot"></span> 今天
        <span class="legend-pill"></span> 训练日
      </div>
    </div>

    <div class="reminder-card">
      <h4>日程与提醒</h4>
      <p class="reminder-hint">选择每周训练日（自动按训练天数推荐，可自行调整），设置训练时间与提前提醒时长。页面打开时会收到浏览器桌面提醒；导出 .ics 文件导入系统日历可离线提醒。</p>
      <div class="weekday-picker">
        ${WEEKDAY_NAMES.map((n, i) => `
          <button type="button" class="wd-btn${reminderSettings.weekdays.includes(i) ? ' active' : ''}" data-wd="${i}" title="${n}">${n.charAt(1)}</button>
        `).join('')}
      </div>
      <div class="reminder-row">
        <label>训练时间 <input type="time" id="trainTime" value="${reminderSettings.time}" /></label>
        <label>提前提醒
          <select id="leadSelect">
            ${[15, 30, 60].map((m) => `<option value="${m}"${reminderSettings.leadMin === m ? ' selected' : ''}>${m} 分钟</option>`).join('')}
          </select>
        </label>
      </div>
      <div class="reminder-actions">
        <button type="button" class="btn btn-ghost btn-sm" id="notifyBtn">${reminderSettings.enabled ? '桌面提醒已开启' : '开启桌面提醒'}</button>
        <button type="button" class="btn btn-ghost btn-sm" id="exportIcsBtn">导出日历 (.ics)</button>
      </div>
      <p class="notify-status" id="notifyStatus">${notifyStatusText()}</p>
    </div>
  `;

  bindCalendarEvents();
}

function bindCalendarEvents() {
  document.querySelectorAll('[data-cal]').forEach((btn) => {
    btn.addEventListener('click', () => {
      if (btn.dataset.cal === 'prev') {
        calendarMonth -= 1;
        if (calendarMonth < 0) { calendarMonth = 11; calendarYear -= 1; }
      } else if (btn.dataset.cal === 'next') {
        calendarMonth += 1;
        if (calendarMonth > 11) { calendarMonth = 0; calendarYear += 1; }
      } else {
        const now = new Date();
        calendarYear = now.getFullYear();
        calendarMonth = now.getMonth();
      }
      renderCalendar(currentPlan);
    });
  });

  document.querySelectorAll('.wd-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const wd = Number(btn.dataset.wd);
      reminderSettings.customized = true;
      reminderSettings.weekdays = reminderSettings.weekdays.includes(wd)
        ? reminderSettings.weekdays.filter((x) => x !== wd)
        : [...reminderSettings.weekdays, wd];
      saveSettings();
      renderCalendar(currentPlan);
    });
  });

  const timeInput = document.getElementById('trainTime');
  if (timeInput) {
    timeInput.addEventListener('change', () => {
      reminderSettings.time = timeInput.value || '19:00';
      saveSettings();
      renderCalendar(currentPlan);
    });
  }

  const leadSelect = document.getElementById('leadSelect');
  if (leadSelect) {
    leadSelect.addEventListener('change', () => {
      reminderSettings.leadMin = Number(leadSelect.value);
      saveSettings();
      renderCalendar(currentPlan);
    });
  }

  const notifyBtn = document.getElementById('notifyBtn');
  if (notifyBtn) notifyBtn.addEventListener('click', enableNotifications);

  const exportBtn = document.getElementById('exportIcsBtn');
  if (exportBtn) exportBtn.addEventListener('click', () => exportIcs(currentPlan));
}

async function enableNotifications() {
  if (!('Notification' in window)) {
    renderCalendar(currentPlan);
    return;
  }
  const perm = await Notification.requestPermission();
  reminderSettings.enabled = perm === 'granted';
  saveSettings();
  renderCalendar(currentPlan);
  checkReminders();
}

/* 定时检查：训练时间前 leadMin 分钟弹出桌面通知（仅当天一次） */
function checkReminders() {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  const s = reminderSettings;
  if (!s.weekdays || !s.weekdayPlan || !s.time) return;
  const now = new Date();
  const wd = (now.getDay() + 6) % 7;
  if (!s.weekdays.includes(wd)) return;
  const [h, m] = s.time.split(':').map(Number);
  const target = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m);
  const trigger = new Date(target.getTime() - s.leadMin * 60000);
  if (now < trigger || now > target) return;
  const key = `fitplan-notified-${target.toDateString()}-${h}-${m}`;
  try { if (localStorage.getItem(key)) return; } catch (e) { /* 忽略 */ }
  const day = s.weekdayPlan[wd];
  try {
    const n = new Notification('FitPlan · 训练提醒', {
      body: `${s.leadMin} 分钟后开始训练：${day ? day.title : '训练日'}。去准备吧！`,
    });
    n.onclick = () => window.focus();
  } catch (e) { /* 忽略 */ }
  try { localStorage.setItem(key, '1'); } catch (e) { /* 忽略 */ }
}

/* 导出每周循环的 .ics 日历文件 */
function exportIcs(plan) {
  if (!plan || !reminderSettings.weekdays.length) return;
  const pad = (n) => String(n).padStart(2, '0');
  const fmtDate = (d) => `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`;
  const fmtTime = (d) => `${pad(d.getHours())}${pad(d.getMinutes())}00`;
  const now = new Date();
  const [h, m] = reminderSettings.time.split(':').map(Number);
  const sortedWeekdays = [...reminderSettings.weekdays].sort((a, b) => a - b);

  const events = sortedWeekdays
    .map((wd, i) => {
      const day = plan.days[i];
      if (!day) return null;
      const d = new Date(now);
      const diff = (wd - ((d.getDay() + 6) % 7) + 7) % 7; // 距下一个该星期几的天数
      d.setDate(d.getDate() + diff);
      const start = new Date(d.getFullYear(), d.getMonth(), d.getDate(), h, m);
      const end = new Date(start.getTime() + 75 * 60000);
      const desc = day.exercises.map((e) => `${e.name} ${e.sets}×${e.reps}`).join('，');
      return [
        'BEGIN:VEVENT',
        `UID:fitplan-${wd}-${now.getFullYear()}@fitplan.local`,
        `DTSTAMP:${fmtDate(now)}T${fmtTime(now)}`,
        `DTSTART:${fmtDate(start)}T${fmtTime(start)}`,
        `DTEND:${fmtDate(end)}T${fmtTime(end)}`,
        `RRULE:FREQ=WEEKLY;BYDAY=${WEEKDAY_ICS[wd]};COUNT=52`,
        `SUMMARY:健身训练 · ${day.title.split('（')[0]}`,
        `DESCRIPTION:${desc.replace(/[,;\\]/g, '\\$&')}`,
        'END:VEVENT',
      ].join('\r\n');
    })
    .filter(Boolean);

  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//FitPlan//Training//CN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    ...events,
    'END:VCALENDAR',
  ].join('\r\n');

  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'fitplan-training.ics';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function generate() {
  const input = getInput();
  if (!input) return;
  const targets = calcTargets(input);
  const workout = buildWorkoutPlan(input);
  const diet = buildDietPlan(input, targets);

  currentPlan = workout;
  renderStats(input, targets);
  renderTraining(workout);
  renderDiet(diet, targets, input);
  renderFoods();
  renderCalendar(workout);

  document.getElementById('resultsPanel').hidden = false;
  document.getElementById('resultsPanel').scrollIntoView({ behavior: 'smooth', block: 'start' });
  document.getElementById('saveNote').textContent = '计划已生成并自动保存在本机浏览器中';
  try {
    localStorage.setItem('fitplan-profile', JSON.stringify(input));
  } catch (e) {
    /* 浏览器禁用 localStorage 时静默跳过 */
  }
}

/* ---------------- 事件绑定 ---------------- */

document.addEventListener('DOMContentLoaded', () => {
  // 分段选择按钮
  document.querySelectorAll('.seg-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll(`.seg-btn[data-target="${btn.dataset.target}"]`)
        .forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });

  // 标签页切换
  document.querySelectorAll('.tab').forEach((tab) => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.tab').forEach((t) => t.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach((c) => c.classList.remove('active'));
      tab.classList.add('active');
      document.getElementById(`tab-${tab.dataset.tab}`).classList.add('active');
    });
  });

  document.getElementById('generateBtn').addEventListener('click', generate);
  document.getElementById('printBtn').addEventListener('click', () => window.print());

  // 恢复上次保存的资料
  try {
    const saved = JSON.parse(localStorage.getItem('fitplan-profile'));
    if (saved && saved.sex) {
      document.querySelectorAll('.seg-btn[data-target="sex"]').forEach((b) =>
        b.classList.toggle('active', b.dataset.value === saved.sex));
      document.getElementById('age').value = saved.age;
      document.getElementById('height').value = saved.height;
      document.getElementById('weight').value = saved.weight;
      document.getElementById('activity').value = saved.activity;
      document.getElementById('goal').value = saved.goal;
      document.getElementById('days').value = saved.days;
      document.getElementById('experience').value = saved.experience;
      document.getElementById('diet').value = saved.diet;
    }
  } catch (e) { /* 忽略损坏的缓存 */ }

  // 恢复提醒设置
  try {
    const savedSettings = JSON.parse(localStorage.getItem('fitplan-settings'));
    if (savedSettings && Array.isArray(savedSettings.weekdays)) {
      reminderSettings = {
        weekdays: savedSettings.weekdays,
        time: savedSettings.time || '19:00',
        leadMin: savedSettings.leadMin || 30,
        enabled: !!savedSettings.enabled,
        customized: !!savedSettings.customized,
      };
    }
  } catch (e) { /* 忽略损坏的缓存 */ }

  // 每 30 秒检查一次提醒（训练时间前触发桌面通知）
  setInterval(checkReminders, 30000);

  // 首次进入直接生成一次示例计划
  generate();
});
