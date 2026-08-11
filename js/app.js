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

/* 居家无器械训练日（水瓶 / 桌椅 / 门框即可完成） */
const HOME_WORKOUT_DAYS = {
  homeFullA: {
    title: '居家全身 A',
    exercises: [
      { name: '徒手深蹲',             muscle: '股四头肌 · 臀',   sets: 3, reps: '12-15', rest: '90 秒', tip: '膝盖与脚尖同向，下蹲到大腿平行' },
      { name: '俯卧撑',               muscle: '胸 · 三头 · 核心', sets: 3, reps: '8-15', rest: '90 秒', tip: '身体呈直线，肘部约 45 度' },
      { name: '反向划船（桌边）',     muscle: '背 · 二头',       sets: 3, reps: '8-12', rest: '90 秒', tip: '身体保持直线，用背部带动上拉' },
      { name: '臀桥',                 muscle: '臀大肌',          sets: 3, reps: '15-20', rest: '60 秒', tip: '顶峰停顿 1-2 秒' },
      { name: '平板支撑',             muscle: '核心',            sets: 3, reps: '30-60 秒', rest: '60 秒', tip: '臀部收紧，身体呈一条直线' },
      { name: '站姿提踵',             muscle: '小腿',            sets: 3, reps: '15-20', rest: '45 秒', tip: '顶峰停顿 1 秒，缓慢下放' },
    ],
  },
  homeFullB: {
    title: '居家全身 B',
    exercises: [
      { name: '箭步蹲',               muscle: '股四头肌 · 臀',   sets: 3, reps: '每侧 10-12', rest: '90 秒', tip: '前膝不超过脚尖过多' },
      { name: '上斜俯卧撑（桌面）',   muscle: '胸 · 三头',       sets: 3, reps: '12-15', rest: '60 秒', tip: '身体呈直线，肘部约 45 度' },
      { name: '超人式',               muscle: '下背 · 臀',       sets: 3, reps: '12-15', rest: '60 秒', tip: '目视地面，用背部发力抬起' },
      { name: '单腿臀桥',             muscle: '臀大肌 · 腘绳肌', sets: 3, reps: '每侧 10-12', rest: '60 秒', tip: '髋部完全顶起，骨盆保持水平' },
      { name: '靠墙静蹲',             muscle: '股四头肌',        sets: 3, reps: '30-60 秒', rest: '60 秒', tip: '大腿与地面平行，膝盖对准脚尖' },
      { name: '卷腹',                 muscle: '腹直肌',          sets: 3, reps: '15-20', rest: '45 秒', tip: '下背部贴地，呼气卷起' },
    ],
  },
  homeFullC: {
    title: '居家全身 C',
    exercises: [
      { name: '保加利亚分腿蹲（自重）', muscle: '股四头肌 · 臀', sets: 3, reps: '每侧 10-12', rest: '90 秒', tip: '后脚垫高，重心放在前脚掌' },
      { name: '宽距俯卧撑',           muscle: '胸 · 三头',       sets: 3, reps: '8-12', rest: '90 秒', tip: '双手略宽于肩，身体呈直线' },
      { name: '毛巾划船（门框）',     muscle: '背 · 二头',       sets: 3, reps: '8-12', rest: '90 秒', tip: '身体后倾约 45 度，用背部带动拉' },
      { name: '侧平板支撑',           muscle: '腹斜肌 · 核心',   sets: 3, reps: '每侧 30-45 秒', rest: '60 秒', tip: '髋部抬起，身体呈一条直线' },
      { name: '死虫式',               muscle: '核心',            sets: 3, reps: '每侧 10-12', rest: '45 秒', tip: '下背贴地，动作缓慢控制' },
      { name: '深蹲跳（可原地深蹲）', muscle: '臀腿 · 心肺',     sets: 3, reps: '10-15', rest: '90 秒', tip: '落地轻缓，膝盖对准脚尖' },
    ],
  },
  homePush: {
    title: '居家推（胸 · 肩 · 三头）',
    exercises: [
      { name: '俯卧撑',               muscle: '胸 · 三头',       sets: 4, reps: '8-15', rest: '90 秒', tip: '身体呈直线，肘部约 45 度' },
      { name: '下斜俯卧撑（脚垫高）', muscle: '上胸 · 三头',     sets: 3, reps: '8-12', rest: '90 秒', tip: '双脚垫高，身体保持直线' },
      { name: '水瓶肩推',             muscle: '三角肌',          sets: 3, reps: '12-15', rest: '60 秒', tip: '核心收紧，不要过度挺腰' },
      { name: '钻石俯卧撑',           muscle: '三头 · 胸',       sets: 3, reps: '6-10', rest: '90 秒', tip: '双手呈菱形置于胸口下方' },
      { name: '水瓶侧平举',           muscle: '三角肌中束',      sets: 3, reps: '15-20', rest: '45 秒', tip: '用小重量，感受中束发力' },
      { name: '凳上臂屈伸',           muscle: '肱三头肌',        sets: 3, reps: '10-15', rest: '60 秒', tip: '大臂贴近身体，肘部后展' },
    ],
  },
  homePull: {
    title: '居家拉（背 · 二头 · 后束）',
    exercises: [
      { name: '反向划船（桌边）',     muscle: '背 · 二头',       sets: 4, reps: '8-12', rest: '90 秒', tip: '身体保持直线，用背部带动上拉' },
      { name: '毛巾划船（门框）',     muscle: '背 · 二头',       sets: 3, reps: '8-12', rest: '90 秒', tip: '身体后倾约 45 度，肘部后拉' },
      { name: '超人式',               muscle: '下背 · 臀',       sets: 3, reps: '12-15', rest: '60 秒', tip: '目视地面，用背部发力抬起' },
      { name: '俯身反向飞鸟（水瓶）', muscle: '三角肌后束 · 上背', sets: 3, reps: '15-20', rest: '45 秒', tip: '俯身固定躯干，肘微屈外展' },
      { name: '水瓶弯举',             muscle: '肱二头肌',        sets: 3, reps: '12-15', rest: '45 秒', tip: '大臂固定不摆动，缓慢下放' },
      { name: '门框悬挂',             muscle: '背阔肌 · 握力',   sets: 3, reps: '20-40 秒', rest: '60 秒', tip: '下沉肩胛骨，保持悬挂' },
    ],
  },
  homeLegs: {
    title: '居家腿（股四 · 臀 · 小腿）',
    exercises: [
      { name: '徒手深蹲',             muscle: '股四头肌 · 臀',   sets: 4, reps: '15-20', rest: '90 秒', tip: '膝盖与脚尖同向，下蹲到大腿平行' },
      { name: '箭步蹲',               muscle: '股四头肌 · 臀',   sets: 3, reps: '每侧 10-12', rest: '90 秒', tip: '前膝不超过脚尖过多' },
      { name: '臀桥',                 muscle: '臀大肌',          sets: 4, reps: '15-20', rest: '60 秒', tip: '顶峰停顿 1-2 秒' },
      { name: '靠墙静蹲',             muscle: '股四头肌',        sets: 3, reps: '40-60 秒', rest: '60 秒', tip: '大腿与地面平行，膝盖对准脚尖' },
      { name: '站姿提踵',             muscle: '小腿',            sets: 4, reps: '15-20', rest: '45 秒', tip: '顶峰停顿 1 秒，缓慢下放' },
      { name: '卷腹',                 muscle: '腹直肌',          sets: 3, reps: '15-20', rest: '45 秒', tip: '下背部贴地，呼气卷起' },
    ],
  },
  homeUpper: {
    title: '居家上肢 A',
    exercises: [
      { name: '俯卧撑',               muscle: '胸 · 三头',       sets: 4, reps: '8-15', rest: '90 秒', tip: '身体呈直线，肘部约 45 度' },
      { name: '反向划船（桌边）',     muscle: '背 · 二头',       sets: 4, reps: '8-12', rest: '90 秒', tip: '身体保持直线，用背部带动上拉' },
      { name: '水瓶肩推',             muscle: '三角肌',          sets: 3, reps: '12-15', rest: '60 秒', tip: '核心收紧，不要过度挺腰' },
      { name: '钻石俯卧撑',           muscle: '三头 · 胸',       sets: 3, reps: '6-10', rest: '90 秒', tip: '双手呈菱形置于胸口下方' },
      { name: '水瓶弯举',             muscle: '肱二头肌',        sets: 3, reps: '12-15', rest: '45 秒', tip: '大臂固定不摆动' },
      { name: '俯身反向飞鸟（水瓶）', muscle: '三角肌后束 · 上背', sets: 3, reps: '15-20', rest: '45 秒', tip: '俯身固定躯干，肘微屈外展' },
    ],
  },
  homeUpperB: {
    title: '居家上肢 B',
    exercises: [
      { name: '上斜俯卧撑（桌面）',   muscle: '胸 · 三头',       sets: 4, reps: '12-15', rest: '60 秒', tip: '身体呈直线，肘部约 45 度' },
      { name: '毛巾划船（门框）',     muscle: '背 · 二头',       sets: 4, reps: '8-12', rest: '90 秒', tip: '身体后倾约 45 度，肘部后拉' },
      { name: '凳上臂屈伸',           muscle: '肱三头肌',        sets: 3, reps: '10-15', rest: '60 秒', tip: '大臂贴近身体，肘部后展' },
      { name: '水瓶前平举',           muscle: '三角肌前束',      sets: 3, reps: '12-15', rest: '45 秒', tip: '抬至肩高，核心收紧不后仰' },
      { name: '锤式弯举（水瓶）',     muscle: '肱二头肌 · 前臂', sets: 3, reps: '12-15', rest: '45 秒', tip: '中立握法，缓慢下放' },
      { name: '门框悬挂',             muscle: '背阔肌 · 握力',   sets: 3, reps: '20-40 秒', rest: '60 秒', tip: '下沉肩胛骨，保持悬挂' },
    ],
  },
  homeLower: {
    title: '居家下肢 A',
    exercises: [
      { name: '徒手深蹲',             muscle: '股四头肌 · 臀',   sets: 4, reps: '15-20', rest: '90 秒', tip: '膝盖与脚尖同向，下蹲到大腿平行' },
      { name: '保加利亚分腿蹲（自重）', muscle: '股四头肌 · 臀', sets: 3, reps: '每侧 10-12', rest: '90 秒', tip: '后脚垫高，重心放在前脚掌' },
      { name: '单腿臀桥',             muscle: '臀大肌 · 腘绳肌', sets: 3, reps: '每侧 10-12', rest: '60 秒', tip: '髋部完全顶起，骨盆保持水平' },
      { name: '侧弓步',               muscle: '臀中肌 · 大腿内侧', sets: 3, reps: '每侧 10-12', rest: '60 秒', tip: '膝盖对准脚尖，重心移到屈膝侧' },
      { name: '站姿提踵',             muscle: '小腿',            sets: 4, reps: '15-20', rest: '45 秒', tip: '顶峰停顿 1 秒，缓慢下放' },
      { name: '死虫式',               muscle: '核心',            sets: 3, reps: '每侧 10-12', rest: '45 秒', tip: '下背贴地，动作缓慢控制' },
    ],
  },
  homeLowerB: {
    title: '居家下肢 B',
    exercises: [
      { name: '箭步蹲',               muscle: '股四头肌 · 臀',   sets: 4, reps: '每侧 10-12', rest: '90 秒', tip: '前膝不超过脚尖过多' },
      { name: '单腿臀桥',             muscle: '臀大肌 · 腘绳肌', sets: 3, reps: '每侧 10-12', rest: '60 秒', tip: '髋部完全顶起，骨盆保持水平' },
      { name: '侧弓步',               muscle: '臀中肌 · 大腿内侧', sets: 3, reps: '每侧 10-12', rest: '60 秒', tip: '膝盖对准脚尖，重心移到屈膝侧' },
      { name: '靠墙静蹲',             muscle: '股四头肌',        sets: 3, reps: '40-60 秒', rest: '60 秒', tip: '大腿与地面平行，膝盖对准脚尖' },
      { name: '深蹲跳（可原地深蹲）', muscle: '臀腿 · 心肺',     sets: 3, reps: '10-15', rest: '90 秒', tip: '落地轻缓，膝盖对准脚尖' },
      { name: '侧平板支撑',           muscle: '腹斜肌 · 核心',   sets: 3, reps: '每侧 30-45 秒', rest: '60 秒', tip: '髋部抬起，身体呈一条直线' },
    ],
  },
};

/* 按训练天数 + 器械 -> 训练日顺序 */
const TEMPLATE_INFO = {
  2: { label: '全身分化（新手友好）', gym: ['fullA', 'fullB'], home: ['homeFullA', 'homeFullB'] },
  3: { label: '推拉腿分化', gym: ['pushA', 'pullA', 'legsA'], home: ['homePush', 'homePull', 'homeLegs'] },
  4: { label: '上下肢分化', gym: ['upperA', 'lowerA', 'upperB', 'lowerB'], home: ['homeUpper', 'homeLower', 'homeUpperB', 'homeLowerB'] },
  5: { label: '推拉腿 + 上下肢', gym: ['pushA', 'pullA', 'legsA', 'upperB', 'lowerB'], home: ['homePush', 'homePull', 'homeLegs', 'homeUpperB', 'homeLowerB'] },
  6: { label: '推拉腿 A/B 轮换', gym: ['pushA', 'pullA', 'legsA', 'pushB', 'pullB', 'legsB'], home: ['homePush', 'homePull', 'homeLegs', 'homePush', 'homePull', 'homeLegs'] },
};

/* 蛋白质来源：一键替换主蛋白，自动同步餐单 */
const PROTEIN_SOURCES = {
  chicken: { label: '鸡胸肉', kcal: 133, protein: 27, carbs: 0, fat: 3 },
  beef:    { label: '瘦牛肉', kcal: 200, protein: 26, carbs: 0, fat: 10 },
  fish:    { label: '鱼虾',   kcal: 165, protein: 26, carbs: 0, fat: 6 },
  tofu:    { label: '豆腐/豆干', kcal: 100, protein: 10, carbs: 4, fat: 5 },
};

/* 饮食偏好配置 */
const DIET_CONFIG = {
  normal:     { label: '普通饮食', vegan: false, lowCarb: false },
  vegetarian: { label: '蛋奶素',   vegan: false, lowCarb: false },
  vegan:      { label: '纯素',     vegan: true,  lowCarb: false },
  lowcarb:    { label: '低碳水',   vegan: false, lowCarb: true },
};

/* 常见动作错误提示 */
function mistakeFor(name) {
  if (name.includes('深蹲')) return '膝盖内扣或脚跟离地；建议膝盖与脚尖同向，重心踩稳全脚掌';
  if (name.includes('卧推')) return '耸肩或手腕弯折；建议肩胛骨后收下沉，手腕保持中立';
  if (name.includes('硬拉')) return '弓背发力；建议挺胸收腹，杠铃贴近身体';
  if (name.includes('划船')) return '身体晃动借力；建议固定躯干，用肘部带动';
  if (name.includes('肩推')) return '过度挺腰；建议核心收紧，不要过度后仰';
  if (name.includes('弯举')) return '大臂摆动借力；建议大臂固定，缓慢下放';
  if (name.includes('侧平举')) return '耸肩代偿；建议用中束发力，肘微屈';
  if (name.includes('俯卧撑')) return '塌腰或撅臀；建议收紧核心，身体呈直线';
  if (name.includes('平板')) return '塌腰或撅臀；建议臀部收紧，身体呈直线';
  if (name.includes('卷腹')) return '用手拉脖子；建议双手轻扶耳侧，下背贴地';
  if (name.includes('箭步蹲')) return '前膝内扣；建议膝盖对准脚尖';
  if (name.includes('臀桥')) return '腰部代偿或幅度不足；建议用臀部发力顶髋';
  if (name.includes('提踵')) return '幅度太小；建议顶峰停顿，缓慢下放';
  if (name.includes('引体')) return '摆动借力；建议控制节奏，先沉肩再发力';
  if (name.includes('下拉')) return '身体后仰过大；建议躯干微倾，拉到上胸位置';
  if (name.includes('面拉')) return '耸肩；建议肩胛骨后收，手臂外旋';
  if (name.includes('分腿蹲')) return '前膝内扣；建议膝盖对准脚尖，重心放前脚掌';
  if (name.includes('腿举')) return '膝盖完全锁死；建议保留微屈';
  if (name.includes('臂屈伸')) return '肘部外展；建议大臂贴近身体';
  if (name.includes('下压')) return '肘部外展；建议大臂夹紧，只用前臂发力';
  if (name.includes('飞鸟')) return '手臂完全伸直锁肘；建议肘微屈，控制下放';
  if (name.includes('前平举')) return '身体后仰借力；建议核心收紧，缓慢下放';
  if (name.includes('耸肩')) return '转肩画圈；建议垂直上下，不要旋转';
  if (name.includes('悬垂举腿')) return '摆动借力；建议骨盆后倾，控制速度';
  if (name.includes('侧平板')) return '髋部下塌；建议髋部抬起，身体呈直线';
  if (name.includes('超人')) return '抬头过高；建议目视地面，用背部发力';
  if (name.includes('静蹲')) return '膝盖超过脚尖过多；建议大腿与地面平行，膝盖对准脚尖';
  if (name.includes('死虫')) return '腰部离地；建议下背贴地，动作缓慢';
  if (name.includes('反向飞鸟')) return '耸肩；建议肩胛骨后收，肘微屈';
  return '建议先以轻重量熟悉动作模式，再逐步加重。';
}

/* 动作库（供替换/编辑动作时选择） */
const EXERCISE_LIBRARY = (function () {
  const map = {};
  Object.values(WORKOUT_DAYS).forEach((d) => d.exercises.forEach((e) => {
    if (!map[e.name]) map[e.name] = { name: e.name, muscle: e.muscle, tip: e.tip };
  }));
  Object.values(HOME_WORKOUT_DAYS).forEach((d) => d.exercises.forEach((e) => {
    if (!map[e.name]) map[e.name] = { name: e.name, muscle: e.muscle, tip: e.tip };
  }));
  return Object.values(map).sort((a, b) => a.name.localeCompare(b.name, 'zh'));
})();

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
  squat: 'img/squat.webp',
  deadlift: 'img/deadlift.webp',
  rdl: 'img/rdl.webp',
  row: 'img/row.webp',
  oneArmRow: 'img/oneArmRow.webp',
  seatedRow: 'img/seatedRow.webp',
  tBarRow: 'img/tBarRow.webp',
  ohp: 'img/ohp.webp',
  standingOhp: 'img/standingOhp.webp',
  pullup: 'img/pullup.webp',
  latPulldown: 'img/latPulldown.webp',
  straightPulldown: 'img/straightPulldown.webp',
  lunge: 'img/lunge.webp',
  splitSquat: 'img/splitSquat.webp',
  hipThrust: 'img/hipThrust.webp',
  lateralRaise: 'img/lateralRaise.webp',
  frontRaise: 'img/frontRaise.webp',
  curl: 'img/curl.webp',
  hammerCurl: 'img/hammerCurl.webp',
  preacherCurl: 'img/preacherCurl.webp',
  pushdown: 'img/pushdown.webp',
  dip: 'img/dip.webp',
  lyingExt: 'img/lyingExt.webp',
  facePull: 'img/facePull.webp',
  reverseFly: 'img/reverseFly.webp',
  pushup: 'img/pushup.webp',
  plank: 'img/plank.webp',
  sidePlank: 'img/sidePlank.webp',
  crunch: 'img/crunch.webp',
  legRaise: 'img/legRaise.webp',
  calfRaise: 'img/calfRaise.webp',
  seatedCalf: 'img/seatedCalf.webp',
  shrug: 'img/shrug.webp',
  abduction: 'img/abduction.webp',
  fly: 'img/fly.webp',
  legCurl: 'img/legCurl.webp',
  legPress: 'img/legPress.webp',
  bench: 'img/bench.webp',
  inclinePress: 'img/inclinePress.webp',
  machinePress: 'img/machinePress.webp',
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
  const units = getUnits();
  const bfRaw = document.getElementById('bodyFatInput').value;
  const bodyFat = bfRaw === '' ? null : Number(bfRaw);
  // 单位换算：斤 -> kg，英尺 -> cm
  const kg = units.weight === 'jin' ? weight / 2 : weight;
  const cm = units.height === 'ft' ? Math.round(height * 30.48) : height;

  const problems = [];
  if (!age || age < 14 || age > 90) problems.push('年龄需在 14-90 之间');
  const cmCheck = units.height === 'ft' ? cm : height;
  if (!cmCheck || cmCheck < 120 || cmCheck > 230) problems.push(units.height === 'ft' ? '身高需在约 4.0-7.5 英尺之间' : '身高需在 120-230cm 之间');
  if (!weight || kg < 30 || kg > 200) problems.push(units.weight === 'jin' ? '体重需在 60-400 斤之间' : '体重需在 30-200kg 之间');
  if (bodyFat != null && (bodyFat < 3 || bodyFat > 60)) problems.push('体脂率需在 3%-60% 之间');
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
    height: Math.round(cmCheck),
    weight: kg,
    bodyFat,
    activity: document.getElementById('activity').value,
    goal: document.getElementById('goal').value,
    days: Number(document.getElementById('days').value),
    experience: document.getElementById('experience').value,
    diet: document.getElementById('diet').value,
    equipment: document.getElementById('equipment').value,
    deficit: getDeficitRatio(),
  };
}

/* Mifflin-St Jeor 基础代谢估算 */
function calcBMR(sex, weight, height, age) {
  const base = 10 * weight + 6.25 * height - 5 * age;
  return sex === 'male' ? base + 5 : base - 161;
}

/* 有体脂数据时使用 Katch-McArdle（去脂体重）公式，更精准 */
function calcBmrWithBodyFat(sex, weight, height, age, bodyFat) {
  if (bodyFat != null && bodyFat >= 3 && bodyFat <= 60) {
    const lbm = weight * (1 - bodyFat / 100);
    return 370 + 21.6 * lbm;
  }
  return calcBMR(sex, weight, height, age);
}

/* 热量缺口 / 盈余比例（来自滑块） */
function getDeficitRatio() {
  const slider = document.getElementById('deficitSlider');
  const goal = document.getElementById('goal').value;
  if (!slider) return goal === 'cut' ? 0.15 : goal === 'bulk' ? 0.12 : 0;
  if (goal === 'cut') return Number(slider.value) / 100;
  if (goal === 'bulk') return Number(slider.value) / 100;
  return 0;
}

function calcTargets(input) {
  const bmr = calcBmrWithBodyFat(input.sex, input.weight, input.height, input.age, input.bodyFat);
  const tdee = bmr * ACTIVITY_LEVELS[input.activity].factor;
  const goal = GOAL_CONFIG[input.goal];
  const ratio = input.goal === 'cut' ? (1 - input.deficit) : input.goal === 'bulk' ? (1 + input.deficit) : 1;
  const calories = Math.round(tdee * ratio);
  const protein = Math.round(input.weight * goal.proteinPerKg);
  const fat = Math.round((calories * goal.fatRatio) / 9);
  const carbs = Math.round((calories - protein * 4 - fat * 9) / 4);
  const waterMl = Math.round(input.weight * 35);
  const macroRanges = {
    protein: input.goal === 'cut' ? [1.8, 2.7] : input.goal === 'bulk' ? [1.6, 2.2] : [1.4, 2.0],
    fatPct: [20, 35],
  };
  const weeklyLossKg = input.goal === 'cut'
    ? (tdee - calories) * 7 / 7700
    : input.goal === 'bulk'
      ? (calories - tdee) * 7 / 7700
      : 0;
  return {
    bmr: Math.round(bmr),
    tdee: Math.round(tdee),
    calories,
    protein,
    carbs,
    fat,
    waterMl,
    weeklyLossKg,
    proteinPerKg: Math.round(protein / input.weight * 10) / 10,
    macroRanges,
    formulaLabel: input.bodyFat != null ? 'Katch-McArdle（含体脂修正）' : 'Mifflin-St Jeor',
    goalLabel: goal.label,
    activityLabel: ACTIVITY_LEVELS[input.activity].label,
  };
}

/* 容量模式：默认完整；light = 每个动作减 1 组（新手 / 疲劳时一键降容量） */
function getVolumeFactor() {
  try { return localStorage.getItem('fitplan-volume') || 'full'; } catch (e) { return 'full'; }
}

function setVolumeFactor(v) {
  try { localStorage.setItem('fitplan-volume', v); } catch (e) { /* 忽略 */ }
}

/* 自定义计划：按模板 dayKey 保存修改后的动作列表 */
function getCustomPlan() {
  try { return JSON.parse(localStorage.getItem('fitplan-custom-plan')) || {}; } catch (e) { return {}; }
}

function saveCustomPlan(obj) {
  try { localStorage.setItem('fitplan-custom-plan', JSON.stringify(obj)); } catch (e) { /* 忽略 */ }
}

/* 根据经验调整容量：新手每组动作减 1 组；降容量模式再减 1 组 */
function adjustSets(ex, experience, volume) {
  let sets = ex.sets;
  if (experience === 'beginner') sets -= 1;
  if (volume === 'light') sets -= 1;
  return Math.max(sets, 2);
}

/* 根据经验调整训练天数（新手高频肌群上限 2 次/周） */
function experienceAllowedDays(experience, days) {
  return experience === 'beginner' ? Math.min(days, 3) : days;
}

function buildWorkoutPlan(input) {
  const keys = TEMPLATE_INFO[input.days][input.equipment === 'home' ? 'home' : 'gym'];
  const isBeginner = input.experience === 'beginner';
  const volume = getVolumeFactor();
  const customPlan = getCustomPlan();
  const planKey = `${input.days}-${input.equipment}`;
  const customMap = customPlan[planKey] || {};

  const days = keys.map((key, i) => {
    const day = WORKOUT_DAYS[key] || HOME_WORKOUT_DAYS[key];
    const custom = customMap[key];
    const baseExercises = (custom && Array.isArray(custom) && custom.length ? custom : day.exercises);
    const exercises = baseExercises.map((ex) => {
      const name = ex.name;
      const lib = EXERCISE_LIBRARY.find((x) => x.name === name);
      return {
        name,
        muscle: ex.muscle || (lib ? lib.muscle : '全身'),
        sets: adjustSets(ex, input.experience, volume),
        reps: ex.reps,
        rest: ex.rest,
        tip: ex.tip || (lib ? lib.tip : ''),
        mistake: mistakeFor(name),
      };
    });
    return {
      dayIndex: i + 1,
      key,
      title: day.title,
      exercises,
    };
  });

  const tips = [];
  if (isBeginner) {
    tips.push('新手前 4-6 周以学习动作模式为主，优先使用轻重量保证动作标准；建议大肌群每周不超过 2 次，留足恢复时间。');
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
    key: planKey,
    days,
    tips,
    coverage: computeCoverage(days),
    splitLabel: `${TEMPLATE_INFO[input.days].label} · ${input.equipment === 'home' ? '居家无器械' : '健身房'}`,
    splitDesc: SPLIT_INFO[input.days].desc + (input.equipment === 'home' ? ' 居家版全部为无器械动作，用桌椅、门框和装满水的瓶子即可完成。' : ''),
    volume,
  };
}

/* 根据目标与饮食偏好生成每日餐单文本 */
function mealSampleText(goal, diet, proteinLabel) {
  const cfg = DIET_CONFIG[diet] || DIET_CONFIG.normal;
  const veg = cfg.vegan;
  const lowCarb = cfg.lowCarb;
  const milk = veg ? '豆浆' : '牛奶';
  const eggs2 = veg ? '豆腐/天贝 120g' : '水煮蛋 2 个';
  const eggs3 = veg ? '天贝/豆腐 150g' : '鸡蛋 3 个';
  const dairy = veg ? '豆浆 1 杯' : '希腊酸奶 1 杯';
  const fruit = lowCarb ? '小份莓果' : '水果 1 份';

  if (goal === 'bulk') {
    if (lowCarb) {
      return [
        `鸡蛋 3 个 + 牛油果 1/2 个 + 蔬菜 1 份`,
        `${proteinLabel} 200g + 蔬菜 1 大份 + 橄榄油 1 勺`,
        `${dairy} + 坚果 15g`,
        `练后：乳清蛋白 1 勺 + 香蕉 1 根`,
        `${proteinLabel} 220g + 蔬菜 2 大份 + 橄榄油 1 勺`,
      ];
    }
    return [
      `燕麦 80g + ${milk} 250ml + ${eggs3} + 香蕉 1 根`,
      `全麦面包 2 片 + 花生酱 1 勺 + ${dairy}`,
      `米饭 250g + ${proteinLabel} 200g + 蔬菜 1 大份`,
      `练后：乳清蛋白 1 勺 + 香蕉 1 根 / 米饭 150g + 蛋白 100g`,
      `米饭 200g + ${proteinLabel} 200g + 蔬菜 2 大份 + 橄榄油 1 勺`,
    ];
  }
  if (goal === 'cut') {
    if (lowCarb) {
      return [
        `${eggs2} + 蔬菜 1 份 + 牛油果 1/4 个`,
        `${proteinLabel} 180g + 蔬菜 2 大份 + 橄榄油 1 勺`,
        `${dairy} + 坚果 10g`,
        `${proteinLabel} 180g + 蔬菜 2 大份`,
      ];
    }
    return [
      `燕麦 50g + ${eggs2} + ${fruit}`,
      `杂粮饭 150g + ${proteinLabel} 150g + 蔬菜 1 大份 + 橄榄油 1 勺`,
      `${dairy} + 苹果/蓝莓 1 份`,
      `红薯/糙米 150g + ${proteinLabel} 150g + 蔬菜 2 大份`,
    ];
  }
  // maintain
  if (lowCarb) {
    return [
      `${eggs2} + 蔬菜 1 份 + 牛油果 1/4 个`,
      `${proteinLabel} 170g + 蔬菜 2 大份 + 橄榄油 1 勺`,
      `${dairy} + 坚果 10g`,
      `${proteinLabel} 170g + 蔬菜 2 大份`,
    ];
  }
  return [
    `燕麦 60g + ${milk} 250ml + 鸡蛋 2 个 + 水果 1 份`,
    `杂粮饭 200g + ${proteinLabel} 150g + 蔬菜 1 大份 + 橄榄油 1 勺`,
    `${dairy} + 坚果 10g`,
    `红薯/糙米 180g + ${proteinLabel} 150g + 蔬菜 2 大份`,
  ];
}

/* 一周购物清单（按每日餐单自动汇总） */
function buildShoppingList(goal, diet, proteinLabel) {
  const cfg = DIET_CONFIG[diet] || DIET_CONFIG.normal;
  const veg = cfg.vegan;
  const lowCarb = cfg.lowCarb;
  const items = [];
  const protG = goal === 'bulk' ? 200 : goal === 'cut' ? 150 : 160;
  items.push({ name: proteinLabel, qty: `${protG * 7}g` });
  if (!veg) {
    items.push({ name: '鸡蛋', qty: goal === 'bulk' ? '21 个' : '14 个' });
    items.push({ name: '牛奶/酸奶', qty: '7 杯' });
  } else {
    items.push({ name: '豆浆', qty: '7 杯' });
    items.push({ name: '天贝/豆腐（额外）', qty: '700g' });
  }
  if (!lowCarb) {
    items.push({ name: '燕麦', qty: goal === 'bulk' ? '560g' : '350g' });
    items.push({ name: '米饭/杂粮饭', qty: goal === 'bulk' ? '3kg' : '1.5kg' });
    items.push({ name: '红薯/糙米', qty: '500g' });
  }
  items.push({ name: '蔬菜（西兰花/菠菜等）', qty: lowCarb ? '3kg' : '2kg' });
  items.push({ name: '水果/莓果', qty: lowCarb ? '500g' : '7 份' });
  items.push({ name: '坚果', qty: '150g' });
  items.push({ name: '橄榄油', qty: '1 瓶' });
  return items;
}

function buildDietPlan(input, targets, proteinSource) {
  const cfg = DIET_CONFIG[input.diet] || DIET_CONFIG.normal;
  const srcKey = (proteinSource && PROTEIN_SOURCES[proteinSource]) ? proteinSource : (cfg.vegan ? 'tofu' : 'chicken');
  const src = PROTEIN_SOURCES[srcKey];
  const plan = MEAL_PLANS[input.goal];
  const samples = mealSampleText(input.goal, input.diet, src.label);
  const meals = plan.meals.map((meal, i) => ({
    name: meal.name,
    kcal: Math.round(targets.calories * meal.pct),
    protein: Math.round(targets.protein * meal.pct),
    carbs: Math.round(targets.carbs * meal.pct),
    fat: Math.round(targets.fat * meal.pct),
    sample: samples[i] || '',
  }));

  const proteinTip = cfg.vegan
    ? '纯素者蛋白质来源：豆腐、豆干、天贝、豆类、藜麦，建议每餐至少 1-2 份蛋白质食物，并注意补充维生素 B12。'
    : cfg.label === '蛋奶素'
      ? '蛋奶素蛋白质来源：鸡蛋、牛奶、酸奶、豆腐、豆干、天贝，建议每餐至少 1-2 份蛋白质食物。'
      : cfg.lowCarb
        ? '低碳水模式已自动减少主食份量、加大蛋白质与蔬菜比例，优质脂肪来源：橄榄油、坚果、牛油果。'
        : '蛋白质来源建议多样化：鸡胸、牛肉、鱼虾、鸡蛋、奶制品、乳清蛋白粉交替食用。';

  return {
    meals,
    proteinTip,
    proteinSource: srcKey,
    proteinLabel: src.label,
    proteinMacros: `${src.label}（每 100g：${src.kcal} kcal · 蛋白 ${src.protein}g · 碳水 ${src.carbs}g · 脂肪 ${src.fat}g）`,
    shopping: buildShoppingList(input.goal, input.diet, src.label),
    dietLabel: cfg.label,
  };
}

/* ---------------- 渲染 ---------------- */

function renderStats(input, targets) {
  const grid = document.getElementById('statGrid');
  const deficitControl = document.getElementById('deficitControl');
  const slider = document.getElementById('deficitSlider');
  const deficitValue = document.getElementById('deficitValue');
  const deficitHint = document.getElementById('deficitHint');
  const units = getUnits();

  // 缺口 / 盈余滑块：减脂 10-20%，增肌 5-15%，保持隐藏
  if (input.goal === 'cut' || input.goal === 'bulk') {
    deficitControl.hidden = false;
    const isCut = input.goal === 'cut';
    slider.min = isCut ? 10 : 5;
    slider.max = isCut ? 20 : 15;
    slider.value = Math.round(input.deficit * 100);
    document.getElementById('deficitLabel').textContent = isCut ? '热量缺口（可调）' : '热量盈余（可调）';
    deficitValue.textContent = slider.value + '%';
    deficitHint.textContent = isCut
      ? `每周预计减重约 ${(targets.weeklyLossKg * 2).toFixed(1)} 斤（${targets.weeklyLossKg.toFixed(2)} kg），建议每周减重不超过体重的 1%。`
      : `每周预计增重约 ${(targets.weeklyLossKg * 2).toFixed(1)} 斤（${targets.weeklyLossKg.toFixed(2)} kg），增肌期体重增速宜缓。`;
  } else {
    deficitControl.hidden = true;
  }

  const wUnit = units.weight === 'jin' ? '斤' : 'kg';
  const wVal = units.weight === 'jin' ? (input.weight * 2) : input.weight;
  const deficitInfo = input.goal === 'cut'
    ? `比维持热量低约 ${Math.round(targets.tdee - targets.calories)} kcal（${Math.round(input.deficit * 100)}% 缺口）`
    : input.goal === 'bulk'
      ? `比维持热量高约 ${Math.round(targets.calories - targets.tdee)} kcal（${Math.round(input.deficit * 100)}% 盈余）`
      : '与维持热量持平';

  const stats = [
    { label: '每日目标热量', value: `${targets.calories}`, unit: 'kcal', extra: deficitInfo },
    { label: '蛋白质', value: `${targets.protein}`, unit: 'g', extra: `约 ${targets.proteinPerKg} g/kg` },
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

  // 宏量参考区间提示（蛋白质 g/kg、脂肪供能占比）
  const [pLo, pHi] = targets.macroRanges.protein;
  const fatPct = Math.round((targets.fat * 9 / targets.calories) * 100);
  const proteinOk = targets.proteinPerKg >= pLo && targets.proteinPerKg <= pHi;
  const fatOk = fatPct >= targets.macroRanges.fatPct[0] && fatPct <= targets.macroRanges.fatPct[1];
  document.getElementById('macroRangeNote').innerHTML = [
    `<span class="${proteinOk ? 'ok' : 'warn'}">蛋白质 ${targets.proteinPerKg} g/kg（推荐区间 ${pLo}-${pHi} g/kg）${proteinOk ? '✓' : '⚠ 建议调整'}</span>`,
    `<span class="${fatOk ? 'ok' : 'warn'}">脂肪供能 ${fatPct}%（推荐 20-35%）${fatOk ? '✓' : '⚠'}</span>`,
  ].join(' · ');

  const profile = `${targets.goalLabel} · ${ACTIVITY_LEVELS[input.activity].label} · 每周 ${input.days} 练 · ${EXPERIENCE_LABEL[input.experience]} · 体重 ${wVal}${wUnit} · ${targets.formulaLabel}`;
  document.getElementById('profileSummary').textContent = profile;
}

function renderTraining(plan) {
  const container = document.getElementById('trainingContent');
  const intro = `
    <div class="plan-intro">
      <h3>周训练安排 · ${plan.splitLabel}</h3>
      <p>${plan.splitDesc}</p>
      <p>${plan.days.map((d) => `第 ${d.dayIndex} 天：${d.title}`).join(' · ')}，其余为休息日（可安排散步或拉伸）。</p>
      <p class="demo-note">点击「Day 1 / Day 2…」展开当天训练；点「开始训练」进入沉浸式模式，按顺序逐动作推进；每行 ⏱ 可单独开启组间计时器；「编辑」可修改组数、次数或替换动作；动作下方为动态演示图（WebP，已懒加载）。</p>
    </div>
    <div class="tip-box">
      ${plan.tips.map((t) => `<p>• ${t}</p>`).join('')}
    </div>
  `;

  const maxSessions = { beginner: 2, intermediate: 3, advanced: 4 };
  const cap = maxSessions[currentExperience()] || 3;
  const highFreq = plan.coverage.filter((c) => c.sessions > cap);
  const isFullBody = plan.splitLabel.includes('全身');
  const coverageNote = isFullBody
    ? '全身分化：每天覆盖全身主要肌群，单块肌群每周 2 次左右，适合每周训练天数较少、需要全身均衡发展的人。'
    : highFreq.length
      ? `<span class="warn-text">注意：${highFreq.map((h) => `${h.group} 每周 ${h.sessions} 练`).join('、')}超出当前经验推荐频率，建议降低训练容量、保证充分恢复。</span>`
      : '大肌群每周约 2 练、间隔 48 小时以上，兼顾刺激频率与恢复。';
  const coverageHtml = `
    <div class="coverage">
      <div class="coverage-head">
        <h4>本周肌群覆盖（按训练日统计）</h4>
        <span>${currentExperienceLabel()}推荐大肌群每周 ≤ ${cap} 练</span>
      </div>
      <div class="chips">
        ${plan.coverage.map((c) => {
          const risk = c.sessions > cap ? ' chip-risk' : '';
          return `<span class="chip${risk}">${c.group} <b>${c.sessions} 练</b> · ${c.exercises} 动作</span>`;
        }).join('')}
      </div>
      <p class="coverage-note">${coverageNote}</p>
      <div class="coverage-actions">
        <button type="button" class="btn btn-ghost btn-sm" id="reduceVolumeBtn">${plan.volume === 'light' ? '恢复标准容量' : '一键降低训练容量（每组减 1 组）'}</button>
      </div>
    </div>
  `;

  const restSeconds = (rest) => {
    const m = String(rest).match(/(\d+)/);
    return m ? Number(m[1]) : 90;
  };

  const days = plan.days.map((d, di) => `
    <div class="day-card${di === 0 ? ' open' : ''}" data-day="${d.dayIndex}">
      <div class="day-head">
        <button type="button" class="day-toggle" aria-expanded="${di === 0}" aria-controls="day-body-${d.dayIndex}">
          <span class="day-title">Day ${d.dayIndex} · ${d.title}</span>
          <span class="chev">▾</span>
        </button>
        <button type="button" class="btn btn-primary btn-sm start-session-btn" data-day-idx="${di}">开始训练</button>
      </div>
      <div class="day-body" id="day-body-${d.dayIndex}">
        <div class="table-wrap">
          <table>
            <thead>
              <tr><th>#</th><th>动作</th><th>目标肌群</th><th>组数 × 次数</th><th>组间休息</th><th>计时</th><th>要点</th></tr>
            </thead>
            <tbody>
              ${d.exercises.map((ex, i) => {
                const motionId = motionFor(ex.name);
                const src = motionId ? EXERCISE_IMAGES[motionId] : null;
                const demoHtml = src
                  ? `<span class="demo-gif-wrap"><img class="demo-gif" src="${src}" alt="${ex.name} 动作演示" loading="lazy" decoding="async"></span>`
                  : '';
                return `
              <tr>
                <td>${i + 1}</td>
                <td class="strong" data-label="动作">${ex.name}${demoHtml}</td>
                <td data-label="目标肌群">${ex.muscle}</td>
                <td class="sets-reps" data-label="组数 × 次数">${ex.sets} × ${ex.reps}</td>
                <td data-label="组间休息">${ex.rest}</td>
                <td><button type="button" class="timer-btn" data-rest="${restSeconds(ex.rest)}" aria-label="为 ${ex.name} 开启组间计时器">⏱</button></td>
                <td class="tip-cell" data-label="要点">
                  <p class="tip-main">${ex.tip}</p>
                  <p class="tip-mistake">⚠ ${ex.mistake}</p>
                  <div class="row-actions">
                    <button type="button" class="btn btn-ghost btn-sm" data-edit-ex="${di}|${i}">编辑</button>
                    <button type="button" class="btn btn-ghost btn-sm btn-danger-ghost" data-del-ex="${di}|${i}">删除</button>
                  </div>
                </td>
              </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `).join('');

  container.innerHTML = intro + coverageHtml + days;
}

function renderDiet(dietPlan, targets, input) {
  const container = document.getElementById('dietContent');
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
      <h3>每日饮食安排 · ${dietPlan.dietLabel}</h3>
      <p>目标 ${targets.calories} kcal，蛋白质 ${targets.protein}g / 碳水 ${targets.carbs}g / 脂肪 ${targets.fat}g。下面是一份示例搭配，点击下方按钮可一键替换蛋白质来源，餐单自动同步。</p>
    </div>
    <div class="tip-box">
      <p>• ${goalNote}</p>
      <p>• 蛋白质建议区间：${proteinRange}<sup><a href="#refs">[2]</a></sup>。本方案取 ${targets.protein}g（${targets.proteinPerKg} g/kg），依据 Morton 2018 荟萃分析<sup><a href="#refs">[2]</a></sup>与 ISSN 2017 立场声明<sup><a href="#refs">[3]</a></sup>。</p>
      <p>• ${dietPlan.proteinMacros}</p>
      <p>• ${dietPlan.proteinTip}</p>
      <p>• 训练日可把「练前 / 练后加餐」安排在训练前后 1 小时内；训练前 2 小时完成正餐。</p>
      <p>• 每天饮水 ${targets.waterMl}ml（约 35 ml/kg，运动人群常见建议 30–40 ml/kg），睡眠 7–9 小时，睡眠不足会显著影响恢复与食欲控制。<sup><a href="#refs">[6]</a></sup></p>
    </div>
    <div class="protein-source">
      <span class="field-label">蛋白质来源：</span>
      ${Object.entries(PROTEIN_SOURCES).map(([k, s]) => `
        <button type="button" class="btn btn-ghost btn-sm protein-src-btn${dietPlan.proteinSource === k ? ' active' : ''}" data-protein="${k}">${s.label}</button>
      `).join('')}
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
    <div class="shopping-card">
      <div class="shopping-head">
        <h4>一周购物清单</h4>
        <button type="button" class="btn btn-ghost btn-sm" id="copyShopBtn">复制清单</button>
      </div>
      <ul class="shopping-list">
        ${dietPlan.shopping.map((s) => `<li><span>${s.name}</span><b>${s.qty}</b></li>`).join('')}
      </ul>
    </div>
  `;

  container.innerHTML = meals;
}

function renderFoods() {
  const container = document.getElementById('foodsContent');
  container.innerHTML = `
    <div class="plan-intro">
      <h3>常见食物营养参考</h3>
      <p>以「份」为单位估算，方便你自由组合每天的蛋白质、碳水和脂肪。实际数值会因做法与品牌略有差异。</p>
    </div>
    <div class="panel">
      <h3>食材计算器</h3>
      <p class="demo-note">选择食材并输入重量，自动计算营养（自定义食材按每 100g 营养换算）。</p>
      <form class="food-calc-form" id="foodCalcForm">
        <label class="field">
          <span class="field-label">食材</span>
          <select id="foodCalcSelect"></select>
        </label>
        <label class="field">
          <span class="field-label">重量（g）</span>
          <input type="number" id="foodCalcWeight" min="1" max="2000" value="100" required />
        </label>
        <button type="submit" class="btn btn-primary">计算</button>
      </form>
      <div class="food-calc-result" id="foodCalcResult"></div>
    </div>
    <div class="panel">
      <h3>添加自定义食材（每 100g 营养）</h3>
      <form class="custom-food-form" id="customFoodForm">
        <label class="field">
          <span class="field-label">名称</span>
          <input type="text" id="cfName" required placeholder="如：即食鸡胸" />
        </label>
        <label class="field">
          <span class="field-label">蛋白质（g）</span>
          <input type="number" id="cfProtein" step="0.1" min="0" required />
        </label>
        <label class="field">
          <span class="field-label">碳水（g）</span>
          <input type="number" id="cfCarbs" step="0.1" min="0" required />
        </label>
        <label class="field">
          <span class="field-label">脂肪（g）</span>
          <input type="number" id="cfFat" step="0.1" min="0" required />
        </label>
        <label class="field">
          <span class="field-label">热量（kcal，可留空自动算）</span>
          <input type="number" id="cfKcal" step="1" min="0" placeholder="自动" />
        </label>
        <button type="submit" class="btn btn-primary">添加</button>
      </form>
      <ul class="custom-food-list" id="customFoodList"></ul>
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

/* ---------------- 训练沉浸模式 / 动作编辑 / 容量 ---------------- */

function currentExperience() {
  const el = document.getElementById('experience');
  return el ? el.value : 'beginner';
}

function currentExperienceLabel() {
  return EXPERIENCE_LABEL[currentExperience()] || '新手';
}

const sessionState = {
  active: false, dayIndex: 0, exIdx: 0, setIdx: 0,
  start: 0, done: 0, total: 0, restInterval: null, restRemain: 0,
};

function startSession(dayIndex) {
  const day = currentPlan.days[dayIndex];
  if (!day) return;
  sessionState.active = true;
  sessionState.dayIndex = dayIndex;
  sessionState.exIdx = 0;
  sessionState.setIdx = 0;
  sessionState.start = Date.now();
  sessionState.done = 0;
  sessionState.total = day.exercises.reduce((s, e) => s + e.sets, 0);
  document.getElementById('sessionOverlay').hidden = false;
  document.getElementById('sessionDoneBtn').hidden = false;
  document.getElementById('sessionEndBtn').textContent = '结束训练';
  document.body.classList.add('no-scroll');
  renderSession();
}

function renderSession() {
  const day = currentPlan.days[sessionState.dayIndex];
  const ex = day.exercises[sessionState.exIdx];
  document.getElementById('sessionDayTitle').textContent = `Day ${day.dayIndex} · ${day.title}`;
  document.getElementById('sessionExerciseName').textContent = ex.name;
  document.getElementById('sessionMeta').textContent = `${ex.sets} 组 × ${ex.reps} · 组间休息 ${ex.rest} · ${ex.muscle}`;
  document.getElementById('sessionSetInfo').textContent = `第 ${sessionState.setIdx + 1} / ${ex.sets} 组`;
  const pct = Math.round(sessionState.done / sessionState.total * 100);
  document.getElementById('sessionProgress').textContent = `已完成 ${sessionState.done} / ${sessionState.total} 组（${pct}%）`;
  const lastSet = sessionState.setIdx + 1 >= ex.sets;
  document.getElementById('sessionDoneBtn').textContent = lastSet ? '完成本组 ✓ 下一动作' : '完成本组 ✓';
  document.getElementById('sessionRest').hidden = true;
  document.getElementById('sessionSkipBtn').hidden = true;
  document.getElementById('sessionDoneBtn').disabled = false;
}

function restSecondsOf(rest) {
  const m = String(rest).match(/(\d+)/);
  return m ? Number(m[1]) : 90;
}

function sessionRest(seconds) {
  const restEl = document.getElementById('sessionRest');
  restEl.hidden = false;
  document.getElementById('sessionSkipBtn').hidden = false;
  document.getElementById('sessionDoneBtn').disabled = true;
  sessionState.restRemain = seconds;
  document.getElementById('sessionRestTime').textContent = seconds + ' 秒';
  sessionState.restInterval = setInterval(() => {
    sessionState.restRemain--;
    document.getElementById('sessionRestTime').textContent = sessionState.restRemain + ' 秒';
    if (sessionState.restRemain <= 0) {
      clearInterval(sessionState.restInterval);
      sessionState.restInterval = null;
      beep();
      vibrate();
      restEl.hidden = true;
      document.getElementById('sessionSkipBtn').hidden = true;
      document.getElementById('sessionDoneBtn').disabled = false;
      showToast('休息结束，开始下一组！💪');
    }
  }, 1000);
}

function vibrate() {
  try { if (navigator.vibrate) navigator.vibrate([200, 100, 200]); } catch (e) { /* 忽略 */ }
}

function sessionDone() {
  if (sessionState.restInterval) { clearInterval(sessionState.restInterval); sessionState.restInterval = null; }
  const day = currentPlan.days[sessionState.dayIndex];
  const ex = day.exercises[sessionState.exIdx];
  sessionState.done++;
  if (sessionState.setIdx + 1 < ex.sets) {
    sessionState.setIdx++;
    renderSession();
    sessionRest(restSecondsOf(ex.rest));
  } else if (sessionState.exIdx + 1 < day.exercises.length) {
    sessionState.exIdx++;
    sessionState.setIdx = 0;
    renderSession();
    sessionRest(restSecondsOf(ex.rest));
  } else {
    finishSession();
  }
}

function sessionSkip() {
  if (sessionState.restInterval) { clearInterval(sessionState.restInterval); sessionState.restInterval = null; }
  document.getElementById('sessionRest').hidden = true;
  document.getElementById('sessionSkipBtn').hidden = true;
  document.getElementById('sessionDoneBtn').disabled = false;
}

function finishSession() {
  const day = currentPlan.days[sessionState.dayIndex];
  const durationMin = Math.max(1, Math.round((Date.now() - sessionState.start) / 60000));
  const sessions = getSessions();
  sessions.push({ date: dateKey(new Date()), dayTitle: day.title, sets: sessionState.done, durationMin });
  saveSessions(sessions);
  const pct = Math.round(sessionState.done / sessionState.total * 100);
  document.getElementById('sessionExerciseName').textContent = '训练完成 🎉';
  document.getElementById('sessionMeta').textContent = `用时 ${durationMin} 分钟 · 完成 ${sessionState.done} 组 · 完成度 ${pct}%`;
  document.getElementById('sessionSetInfo').textContent = ENCOURAGE[Math.floor(Math.random() * ENCOURAGE.length)];
  document.getElementById('sessionRest').hidden = true;
  document.getElementById('sessionSkipBtn').hidden = true;
  document.getElementById('sessionDoneBtn').hidden = true;
  document.getElementById('sessionEndBtn').textContent = '关闭';
  sessionState.active = false;
  markCheckin(dateKey(new Date()));
  renderVolume();
}

function closeSession() {
  if (sessionState.active && sessionState.done > 0 && !confirm('训练尚未完成，确定要结束吗？')) return;
  if (sessionState.restInterval) { clearInterval(sessionState.restInterval); sessionState.restInterval = null; }
  document.getElementById('sessionOverlay').hidden = true;
  document.body.classList.remove('no-scroll');
  document.getElementById('sessionDoneBtn').hidden = false;
  document.getElementById('sessionEndBtn').textContent = '结束训练';
}

function getSessions() {
  try { return JSON.parse(localStorage.getItem('fitplan-sessions')) || []; } catch (e) { return []; }
}

function saveSessions(list) {
  try { localStorage.setItem('fitplan-sessions', JSON.stringify(list)); } catch (e) { /* 忽略 */ }
}

function markCheckin(dateStr) {
  const checkins = getCheckins();
  if (!checkins[dateStr]) {
    checkins[dateStr] = 1;
    saveCheckins(checkins);
    renderCalendar(currentPlan);
  }
}

let editing = null;

function openEditOverlay(dayIdx, exIdx) {
  editing = { dayIdx, exIdx };
  const day = currentPlan.days[dayIdx];
  const ex = day.exercises[exIdx];
  const nameSel = document.getElementById('editName');
  nameSel.innerHTML = EXERCISE_LIBRARY.map((e) =>
    `<option value="${e.name.replace(/"/g, '&quot;')}">${e.name}</option>`).join('');
  nameSel.value = ex.name;
  document.getElementById('editMuscle').value = ex.muscle;
  document.getElementById('editSets').value = ex.sets;
  document.getElementById('editReps').value = ex.reps;
  document.getElementById('editRest').value = ex.rest;
  document.getElementById('editTip').value = ex.tip;
  document.getElementById('editOverlay').hidden = false;
  document.body.classList.add('no-scroll');
}

function saveEdit() {
  if (!editing) return;
  const { dayIdx, exIdx } = editing;
  const day = currentPlan.days[dayIdx];
  const ex = day.exercises[exIdx];
  const name = document.getElementById('editName').value;
  const lib = EXERCISE_LIBRARY.find((e) => e.name === name);
  ex.name = name;
  ex.muscle = document.getElementById('editMuscle').value || (lib ? lib.muscle : '全身');
  ex.sets = Math.max(1, Number(document.getElementById('editSets').value) || 3);
  ex.reps = document.getElementById('editReps').value || '8-12';
  ex.rest = document.getElementById('editRest').value || '90 秒';
  ex.tip = document.getElementById('editTip').value || (lib ? lib.tip : '');
  ex.mistake = mistakeFor(name);
  persistCustomDay(day);
  closeEditOverlay();
  renderTraining(currentPlan);
  showToast('动作已更新并保存');
}

function deleteExercise(dayIdx, exIdx) {
  const day = currentPlan.days[dayIdx];
  if (day.exercises.length <= 1) { showToast('至少保留 1 个动作'); return; }
  if (!confirm(`确定删除「${day.exercises[exIdx].name}」吗？`)) return;
  day.exercises.splice(exIdx, 1);
  persistCustomDay(day);
  renderTraining(currentPlan);
  showToast('已删除动作');
}

function persistCustomDay(day) {
  const customPlan = getCustomPlan();
  if (!currentPlan.key) return;
  if (!customPlan[currentPlan.key]) customPlan[currentPlan.key] = {};
  customPlan[currentPlan.key][day.key] = day.exercises.map((e) => ({
    name: e.name, muscle: e.muscle, sets: e.sets, reps: e.reps, rest: e.rest, tip: e.tip,
  }));
  saveCustomPlan(customPlan);
}

function closeEditOverlay() {
  editing = null;
  document.getElementById('editOverlay').hidden = true;
  document.body.classList.remove('no-scroll');
}

function toggleVolume() {
  setVolumeFactor(getVolumeFactor() === 'light' ? 'full' : 'light');
  const input = getInput();
  if (!input) return;
  generate();
  showToast(getVolumeFactor() === 'light' ? '已降低训练容量（每组减 1 组）' : '已恢复标准训练容量');
}

/* ---------------- 单位切换 ---------------- */

function getUnits() {
  try {
    return JSON.parse(localStorage.getItem('fitplan-units')) || { weight: 'kg', height: 'cm' };
  } catch (e) { return { weight: 'kg', height: 'cm' }; }
}

function saveUnits(u) {
  try { localStorage.setItem('fitplan-units', JSON.stringify(u)); } catch (e) { /* 忽略 */ }
}

function applyUnitsUI() {
  const u = getUnits();
  document.querySelectorAll('#weightUnitSeg .seg-btn').forEach((b) =>
    b.classList.toggle('active', b.dataset.unit === u.weight));
  document.querySelectorAll('#heightUnitSeg .seg-btn').forEach((b) =>
    b.classList.toggle('active', b.dataset.unit === u.height));
  const hField = document.getElementById('height');
  const wField = document.getElementById('weight');
  if (hField) {
    const label = hField.closest('.field').querySelector('.field-label');
    if (label) label.textContent = u.height === 'ft' ? '身高（英尺）' : '身高（cm）';
  }
  if (wField) {
    const label = wField.closest('.field').querySelector('.field-label');
    if (label) label.textContent = u.weight === 'jin' ? '体重（斤）' : '体重（kg）';
  }
  const tgt = document.getElementById('targetWeight');
  if (tgt) {
    tgt.placeholder = u.weight === 'jin' ? '目标体重（斤）' : '目标体重（kg）';
    tgt.value = '';
    const saved = getTargetWeight();
    if (saved != null) tgt.value = u.weight === 'jin' ? Math.round(saved * 2 * 10) / 10 : saved;
  }
  const kgInput = document.getElementById('weightKg');
  if (kgInput) {
    const label = kgInput.closest('.field').querySelector('.field-label');
    if (label) label.textContent = u.weight === 'jin' ? '体重（斤）' : '体重（kg）';
  }
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
let lastInput = null;
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

/* 统计一周内各主要肌群的训练频率（按训练日计）+ 动作数量 */
function computeCoverage(days) {
  const sessions = {};
  const exCounts = {};
  MUSCLE_ORDER.forEach((g) => { sessions[g] = 0; exCounts[g] = 0; });
  days.forEach((d) => {
    const dayGroups = new Set();
    d.exercises.forEach((ex) => {
      const g = muscleGroupOf(ex.muscle);
      if (g in sessions) {
        dayGroups.add(g);
        exCounts[g]++;
      }
    });
    dayGroups.forEach((g) => { sessions[g]++; });
  });
  return MUSCLE_ORDER
    .map((g) => ({ group: g, sessions: sessions[g], exercises: exCounts[g] }))
    .filter((c) => c.exercises > 0);
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

/* ---------------- 训练打卡 ---------------- */

const ENCOURAGE = [
  '太棒了！今天又坚持练了一组 💪',
  '打卡成功！离目标又近了一步 🔥',
  '自律的你最帅/最美，继续保持！',
  '今天的汗水不会白流，加油！',
  '完成打卡，奖励自己一杯水吧 💧',
];

function getCheckins() {
  try {
    return JSON.parse(localStorage.getItem('fitplan-checkins')) || {};
  } catch (e) {
    return {};
  }
}

function saveCheckins(obj) {
  try {
    localStorage.setItem('fitplan-checkins', JSON.stringify(obj));
  } catch (e) { /* 忽略 */ }
}

function dateKey(d) {
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/* 连续打卡天数：从今天（或昨天，允许一天宽限）往前数 */
function calcStreak() {
  const checkins = getCheckins();
  const today = new Date();
  let streak = 0;
  let cursor = new Date(today);
  if (!checkins[dateKey(cursor)]) cursor.setDate(cursor.getDate() - 1);
  while (checkins[dateKey(cursor)]) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

function toggleCheckin(dateStr) {
  const checkins = getCheckins();
  if (checkins[dateStr]) {
    delete checkins[dateStr];
  } else {
    checkins[dateStr] = 1;
    showToast(ENCOURAGE[Math.floor(Math.random() * ENCOURAGE.length)]);
  }
  saveCheckins(checkins);
  renderCalendar(currentPlan);
}

function renderCalendar(plan) {
  if (!reminderSettings.customized) {
    reminderSettings.weekdays = [...DEFAULT_WEEKDAYS[plan.days.length]];
  }
  const container = document.getElementById('calendarContent');
  const sortedWeekdays = [...reminderSettings.weekdays].sort((a, b) => a - b);
  const weekdayPlan = {};
  plan.days.forEach((d, i) => {
    if (sortedWeekdays[i] !== undefined) weekdayPlan[sortedWeekdays[i]] = d;
  });
  reminderSettings.weekdayPlan = weekdayPlan;
  const checkins = getCheckins();
  const streak = calcStreak();

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
    const key = dateKey(d);
    const checked = !!checkins[key];
    cells += `
      ${planDay
        ? `<button type="button" class="cal-cell train-cell${inMonth ? '' : ' muted'}${isToday ? ' today' : ''}${checked ? ' checked' : ''}" data-date="${key}" aria-pressed="${checked}" title="点击打卡/取消">
            <span class="cal-date">${d.getDate()}</span>
            <span class="cal-workout">${planDay.title.split('（')[0]}</span>
            <span class="cal-check">${checked ? '✓ 已练' : ''}</span>
          </button>`
        : `<div class="cal-cell${inMonth ? '' : ' muted'}${isToday ? ' today' : ''}">
            <span class="cal-date">${d.getDate()}</span>
          </div>`}`;
  }

  container.innerHTML = `
    <div class="plan-intro">
      <h3>训练日历</h3>
      <p>训练计划已按你选定的训练日排进日历（每周循环），今天自动高亮；点击训练日可打卡，连续打卡 <b>${streak}</b> 天。</p>
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

  document.querySelectorAll('.train-cell').forEach((btn) => {
    btn.addEventListener('click', () => toggleCheckin(btn.dataset.date));
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
        'BEGIN:VALARM',
        `ACTION:DISPLAY`,
        `DESCRIPTION:训练提醒`,
        `TRIGGER:-PT${reminderSettings.leadMin}M`,
        'END:VALARM',
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
    'X-WR-CALNAME:FitPlan 健身训练',
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
  let proteinSource = null;
  try { proteinSource = localStorage.getItem('fitplan-protein-source'); } catch (e) { /* 忽略 */ }
  const diet = buildDietPlan(input, targets, proteinSource);

  currentPlan = workout;
  lastInput = input;
  renderStats(input, targets);
  renderTraining(workout);
  renderDiet(diet, targets, input);
  renderFoods();
  populateFoodUI();
  renderCalendar(workout);
  renderWeight();

  document.getElementById('homeResults').hidden = false;
  document.getElementById('saveNote').textContent = '计划已生成并自动保存在本机浏览器中';
  try {
    localStorage.setItem('fitplan-profile', JSON.stringify(input));
  } catch (e) {
    /* 浏览器禁用 localStorage 时静默跳过 */
  }
}

/* ---------------- 导航 ---------------- */

function switchView(view) {
  document.querySelectorAll('.view').forEach((v) => v.classList.toggle('active', v.id === 'view-' + view));
  document.querySelectorAll('.nav-btn').forEach((b) => b.classList.toggle('active', b.dataset.view === view));
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/* ---------------- Toast 提示 ---------------- */

let toastTimer = null;
function showToast(msg) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { el.hidden = true; }, 2600);
}

/* ---------------- 组间计时器 ---------------- */

const timerState = { seconds: 90, remain: 90, running: false, interval: null };
let timerAudioCtx = null;

function beep() {
  try {
    if (!timerAudioCtx) timerAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const ctx = timerAudioCtx;
    [0, 0.25, 0.5].forEach((t) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = 880;
      gain.gain.setValueAtTime(0.001, ctx.currentTime + t);
      gain.gain.exponentialRampToValueAtTime(0.4, ctx.currentTime + t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + t + 0.18);
      osc.start(ctx.currentTime + t);
      osc.stop(ctx.currentTime + t + 0.2);
    });
  } catch (e) { /* 忽略 */ }
}

function renderTimer() {
  const disp = document.getElementById('timerDisplay');
  disp.textContent = timerState.remain;
  disp.classList.toggle('running', timerState.running);
  const toggle = document.getElementById('timerToggle');
  toggle.textContent = timerState.running ? '暂停' : (timerState.remain < timerState.seconds ? '继续' : '开始');
  document.querySelectorAll('.timer-preset').forEach((b) => {
    b.classList.toggle('active', Number(b.dataset.sec) === timerState.seconds);
  });
}

function stopTimer() {
  if (timerState.interval) clearInterval(timerState.interval);
  timerState.interval = null;
  timerState.running = false;
}

function openTimer(seconds) {
  stopTimer();
  timerState.seconds = seconds || 90;
  timerState.remain = timerState.seconds;
  renderTimer();
  document.getElementById('timerOverlay').hidden = false;
}

function closeTimer() {
  stopTimer();
  document.getElementById('timerOverlay').hidden = true;
}

function toggleTimer() {
  if (timerState.running) {
    stopTimer();
    renderTimer();
    return;
  }
  timerState.running = true;
  renderTimer();
  timerState.interval = setInterval(() => {
    timerState.remain -= 1;
    if (timerState.remain <= 0) {
      timerState.remain = 0;
      stopTimer();
      beep();
      showToast('休息结束，开始下一组！💪');
    }
    renderTimer();
  }, 1000);
}

/* ---------------- 自定义食材 ---------------- */

/* 常见食材每 100g 营养（供计算器使用） */
const NUTRIENT_100G = {
  '鸡胸肉（熟）': { p: 27, c: 0, f: 3, kcal: 133 },
  '瘦牛肉（熟）': { p: 26, c: 0, f: 10, kcal: 200 },
  '三文鱼': { p: 20, c: 0, f: 13, kcal: 208 },
  '虾仁': { p: 24, c: 0, f: 0.3, kcal: 99 },
  '鸡蛋': { p: 13, c: 1, f: 10, kcal: 144 },
  '北豆腐': { p: 8, c: 4, f: 4, kcal: 84 },
  '全脂牛奶': { p: 3.2, c: 4.8, f: 3.3, kcal: 61 },
  '希腊酸奶': { p: 10, c: 4, f: 0.4, kcal: 59 },
  '乳清蛋白粉': { p: 80, c: 10, f: 5, kcal: 400 },
  '米饭（熟）': { p: 2.6, c: 26, f: 0.3, kcal: 116 },
  '杂粮饭（熟）': { p: 3.5, c: 23, f: 0.7, kcal: 112 },
  '燕麦（干）': { p: 16.9, c: 66, f: 6.9, kcal: 389 },
  '红薯': { p: 1.6, c: 20, f: 0.1, kcal: 86 },
  '全麦面包': { p: 10, c: 47, f: 4, kcal: 260 },
  '香蕉': { p: 1.4, c: 22, f: 0.2, kcal: 93 },
  '苹果': { p: 0.3, c: 14, f: 0.2, kcal: 52 },
  '西兰花': { p: 4.1, c: 4.3, f: 0.6, kcal: 36 },
  '菠菜': { p: 2.9, c: 3.6, f: 0.4, kcal: 23 },
  '橄榄油': { p: 0, c: 0, f: 100, kcal: 900 },
  '杏仁': { p: 21, c: 21, f: 50, kcal: 579 },
  '花生酱': { p: 25, c: 22, f: 50, kcal: 588 },
  '西瓜': { p: 0.6, c: 7.5, f: 0.1, kcal: 30 },
};

function getCustomFoods() {
  try { return JSON.parse(localStorage.getItem('fitplan-custom-foods')) || []; } catch (e) { return []; }
}

function saveCustomFoods(list) {
  try { localStorage.setItem('fitplan-custom-foods', JSON.stringify(list)); } catch (e) { /* 忽略 */ }
}

function populateFoodUI() {
  const sel = document.getElementById('foodCalcSelect');
  if (!sel) return;
  const names = [...Object.keys(NUTRIENT_100G)];
  getCustomFoods().forEach((f) => names.push(f.name));
  sel.innerHTML = names.map((n) => `<option value="${n.replace(/"/g, '&quot;')}">${n}</option>`).join('');
  renderCustomFoodList();
}

function renderCustomFoodList() {
  const ul = document.getElementById('customFoodList');
  if (!ul) return;
  const list = getCustomFoods();
  ul.innerHTML = list.length
    ? list.map((f, i) => `
        <li class="custom-food-item">
          <span><b>${f.name}</b> · 每100g：蛋白 ${f.p}g / 碳水 ${f.c}g / 脂肪 ${f.f}g / ${f.kcal} kcal</span>
          <button type="button" class="btn btn-ghost btn-sm" data-del-food="${i}" aria-label="删除 ${f.name}">删除</button>
        </li>`).join('')
    : '<li class="demo-note">还没有自定义食材，先添加一个吧。</li>';
}

function addCustomFood(name, p, c, f, kcal) {
  const list = getCustomFoods();
  list.push({ name, p, c, f, kcal: kcal || Math.round(p * 4 + c * 4 + f * 9) });
  saveCustomFoods(list);
  populateFoodUI();
}

function calcFood(name, weight) {
  const custom = getCustomFoods().find((x) => x.name === name);
  const n = custom || NUTRIENT_100G[name];
  if (!n || !weight || weight <= 0) return null;
  const k = weight / 100;
  return {
    kcal: Math.round(n.kcal * k),
    protein: (n.p * k).toFixed(1),
    carbs: (n.c * k).toFixed(1),
    fat: (n.f * k).toFixed(1),
  };
}

/* ---------------- 体重 / 体脂追踪 ---------------- */

function getWeights() {
  try { return JSON.parse(localStorage.getItem('fitplan-weight')) || []; } catch (e) { return []; }
}

function saveWeights(list) {
  try { localStorage.setItem('fitplan-weight', JSON.stringify(list)); } catch (e) { /* 忽略 */ }
}

function renderWeight() {
  const wrap = document.getElementById('weightList');
  if (!wrap) return;
  const list = getWeights().sort((a, b) => (a.date < b.date ? -1 : 1));
  const units = getUnits();
  const wUnit = units.weight === 'jin' ? '斤' : 'kg';
  const fmt = (kg) => units.weight === 'jin' ? (Math.round(kg * 2 * 10) / 10) : kg;
  wrap.innerHTML = list.length
    ? [...list].reverse().map((w) => `
        <div class="weight-item">
          <span>${w.date}${w.bf != null ? ` · 体脂 ${w.bf}%` : ''}</span>
          <b>${fmt(w.kg)} ${wUnit}</b>
        </div>`).join('')
    : '<p class="demo-note">还没有记录，输入日期和体重后点「记录」。</p>';

  const tip = document.getElementById('weightTip');
  let expected = null;
  try {
    const profile = lastInput || JSON.parse(localStorage.getItem('fitplan-profile'));
    if (profile && profile.goal === 'cut') {
      const t = calcTargets(profile);
      const deficit = t.tdee - t.calories;
      expected = deficit / 7700; // 约 7700 kcal ≈ 1kg 脂肪
      const target = getTargetWeight();
      let pred = '';
      if (target && list.length && target < list[list.length - 1].kg && expected > 0) {
        const weeks = (list[list.length - 1].kg - target) / (expected * 7);
        const d = new Date(Date.now() + weeks * 7 * 86400000);
        pred = `按当前缺口，预计 ${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} 前后到达目标体重（${fmt(target)} ${wUnit}）。`;
      }
      tip.textContent = `当前热量缺口约 ${deficit} kcal/天，按理论预期每周约减 ${(expected * 7 * 2).toFixed(1)} 斤（${(expected * 7).toFixed(2)} kg）；橙色虚线为参考线。${pred}`;
    } else {
      const target = getTargetWeight();
      tip.textContent = target != null
        ? `当前目标体重 ${fmt(target)} ${wUnit}，观察长期趋势即可；完成训练后「训练容量趋势」会显示你的训练量变化。`
        : '当前目标为增肌/保持，体重参考线不适用；完成训练后「训练容量趋势」会显示你的训练量变化。';
    }
  } catch (e) { tip.textContent = ''; }

  drawWeightChart(list, expected);
  renderVolume();
  const tgtInput = document.getElementById('targetWeight');
  if (tgtInput) {
    const saved = getTargetWeight();
    tgtInput.value = saved != null ? fmt(saved) : '';
  }
}

function drawWeightChart(list, expectedKgPerDay) {
  const canvas = document.getElementById('weightChart');
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  ctx.clearRect(0, 0, W, H);
  if (!list.length) return;

  const padL = 44, padR = 16, padT = 16, padB = 28;
  const innerW = W - padL - padR, innerH = H - padT - padB;
  ctx.font = '12px sans-serif';
  ctx.fillStyle = '#8b9b93';
  ctx.strokeStyle = '#c9d6d0';
  ctx.lineWidth = 1;

  const kgs = list.map((w) => w.kg);
  const target = getTargetWeight();
  const allKgs = target != null ? [...kgs, target] : kgs;
  let yMin = Math.floor(Math.min(...allKgs) - 1);
  let yMax = Math.ceil(Math.max(...allKgs) + 1);
  if (yMax - yMin < 4) { const mid = (yMax + yMin) / 2; yMin = mid - 2; yMax = mid + 2; }
  const y = (v) => padT + innerH - ((v - yMin) / (yMax - yMin)) * innerH;
  const x = (i) => (list.length === 1 ? padL + innerW / 2 : padL + (i / (list.length - 1)) * innerW);

  for (let v = yMin; v <= yMax; v++) {
    const yy = y(v);
    ctx.beginPath(); ctx.moveTo(padL, yy); ctx.lineTo(W - padR, yy); ctx.stroke();
    ctx.fillText(String(v), 8, yy + 4);
  }
  ctx.textAlign = 'center';
  ctx.fillText(list[0].date, padL, H - 8);
  if (list.length > 1) ctx.fillText(list[list.length - 1].date, W - padR, H - 8);

  if (expectedKgPerDay && list.length > 1) {
    ctx.save();
    ctx.setLineDash([6, 5]);
    ctx.strokeStyle = '#f59e0b';
    ctx.beginPath();
    list.forEach((w, i) => {
      const px = x(i);
      const days = (new Date(w.date) - new Date(list[0].date)) / 86400000;
      const py = y(list[0].kg - expectedKgPerDay * days);
      i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
    });
    ctx.stroke();
    ctx.restore();
  }

  ctx.strokeStyle = '#0e9f6e';
  ctx.lineWidth = 2;
  ctx.beginPath();
  list.forEach((w, i) => { const px = x(i), py = y(w.kg); i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py); });
  ctx.stroke();
  if (target != null) {
    ctx.save();
    ctx.setLineDash([8, 5]);
    ctx.strokeStyle = '#6366f1';
    ctx.lineWidth = 2;
    const ty = y(target);
    ctx.beginPath(); ctx.moveTo(padL, ty); ctx.lineTo(W - padR, ty); ctx.stroke();
    ctx.restore();
    const units = getUnits();
    const tUnit = units.weight === 'jin' ? '斤' : 'kg';
    const tVal = units.weight === 'jin' ? (Math.round(target * 2 * 10) / 10) : target;
    ctx.fillStyle = '#6366f1';
    ctx.fillText(`目标 ${tVal}${tUnit}`, W - padR - 70, ty - 6);
  }
  list.forEach((w, i) => {
    const px = x(i), py = y(w.kg);
    ctx.beginPath(); ctx.arc(px, py, 3.5, 0, Math.PI * 2); ctx.fillStyle = '#0e9f6e'; ctx.fill();
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(px, py, 1.6, 0, Math.PI * 2); ctx.fill();
  });
}

function getTargetWeight() {
  try { return localStorage.getItem('fitplan-target-weight'); } catch (e) { return null; }
}

function renderVolume() {
  const canvas = document.getElementById('volumeChart');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  ctx.clearRect(0, 0, W, H);
  const sessions = getSessions();
  const listEl = document.getElementById('sessionList');
  if (!sessions.length) {
    if (listEl) listEl.innerHTML = '<p class="demo-note">还没有训练记录。在「训练」页点击「开始训练」完成一次训练后，这里会显示容量趋势。</p>';
    return;
  }
  const byDate = {};
  sessions.forEach((s) => { byDate[s.date] = (byDate[s.date] || 0) + s.sets; });
  const dates = Object.keys(byDate).sort();
  if (listEl) {
    listEl.innerHTML = [...dates].reverse().slice(0, 7)
      .map((d) => `<div class="session-item"><span>${d}</span><b>${byDate[d]} 组</b></div>`).join('');
  }
  const padL = 36, padR = 12, padT = 14, padB = 24;
  const innerW = W - padL - padR, innerH = H - padT - padB;
  const maxV = Math.max(...dates.map((d) => byDate[d]));
  ctx.font = '11px sans-serif';
  ctx.fillStyle = '#8b9b93';
  ctx.strokeStyle = '#c9d6d0';
  ctx.lineWidth = 1;
  for (let v = 0; v <= maxV; v += Math.max(1, Math.ceil(maxV / 4))) {
    const yy = padT + innerH - (v / maxV) * innerH;
    ctx.beginPath(); ctx.moveTo(padL, yy); ctx.lineTo(W - padR, yy); ctx.stroke();
    ctx.fillText(String(v), 6, yy + 4);
  }
  const bw = Math.min(30, innerW / dates.length * 0.6);
  dates.forEach((d, i) => {
    const cx = padL + (i + 0.5) * (innerW / dates.length);
    const bh = (byDate[d] / maxV) * innerH;
    ctx.fillStyle = '#0e9f6e';
    ctx.fillRect(cx - bw / 2, padT + innerH - bh, bw, bh);
    if (dates.length <= 14) {
      ctx.textAlign = 'center';
      ctx.fillStyle = '#8b9b93';
      ctx.fillText(d.slice(5), cx, H - 8);
    }
  });
}

/* ---------------- 设置与导出 ---------------- */

function setTheme(dark) {
  document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
  try { localStorage.setItem('fitplan-theme', dark ? 'dark' : 'light'); } catch (e) { /* 忽略 */ }
  const btn = document.getElementById('themeBtn');
  if (btn) {
    btn.textContent = dark ? '切换到浅色' : '切换到深色';
    btn.setAttribute('aria-pressed', String(dark));
  }
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

function exportCsv() {
  const rows = [['名称', '份量', '热量(kcal)', '蛋白质(g)', '碳水(g)', '脂肪(g)']];
  FOOD_TABLE.forEach((f) => rows.push([f.name, f.amount, f.kcal, f.protein, f.carbs, f.fat]));
  getCustomFoods().forEach((f) => rows.push([f.name, '100g', f.kcal, f.p, f.c, f.f]));
  const csv = '\ufeff' + rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\r\n');
  downloadBlob(new Blob([csv], { type: 'text/csv;charset=utf-8' }), 'fitplan-foods.csv');
}

function printMode(mode) {
  document.body.classList.remove('print-training', 'print-diet');
  if (mode) document.body.classList.add('print-' + mode);
  window.print();
  setTimeout(() => document.body.classList.remove('print-training', 'print-diet'), 1500);
}

function clearAllData() {
  const keys = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && k.startsWith('fitplan-')) keys.push(k);
  }
  keys.forEach((k) => localStorage.removeItem(k));
  location.reload();
}

/* ---------------- 饮水提醒 ---------------- */

let waterSettings = { enabled: false, intervalMin: 60 };

function getWaterSettings() {
  try { return JSON.parse(localStorage.getItem('fitplan-water')) || { enabled: false, intervalMin: 60 }; } catch (e) { return { enabled: false, intervalMin: 60 }; }
}

function saveWaterSettings() {
  try { localStorage.setItem('fitplan-water', JSON.stringify(waterSettings)); } catch (e) { /* 忽略 */ }
}

function renderWaterStatus() {
  const el = document.getElementById('waterStatus');
  if (!el) return;
  el.textContent = waterSettings.enabled
    ? `饮水提醒已开启：每 ${waterSettings.intervalMin} 分钟提醒一次（8:00-22:00，页面打开时生效）。`
    : '未开启饮水提醒。开启后会在浏览器中定时弹出喝水通知。';
  const btn = document.getElementById('waterBtn');
  if (btn) btn.textContent = waterSettings.enabled ? '关闭饮水提醒' : '开启饮水提醒';
}

function checkWater() {
  if (!waterSettings.enabled) return;
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  const now = new Date();
  if (now.getHours() < 8 || now.getHours() > 22) return;
  let last = 0;
  try { last = Number(localStorage.getItem('fitplan-water-last')) || 0; } catch (e) { /* 忽略 */ }
  if (now.getTime() - last < waterSettings.intervalMin * 60000) return;
  try { localStorage.setItem('fitplan-water-last', String(now.getTime())); } catch (e) { /* 忽略 */ }
  try {
    new Notification('FitPlan · 饮水提醒 💧', { body: '该喝水啦！建议每次 200-300ml，全天少量多次。' });
  } catch (e) { /* 忽略 */ }
}

/* ---------------- JSON 备份 ---------------- */

function exportData() {
  const data = {};
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && k.startsWith('fitplan-')) data[k] = localStorage.getItem(k);
  }
  const payload = JSON.stringify({ app: 'FitPlan', savedAt: new Date().toISOString(), data }, null, 2);
  downloadBlob(new Blob([payload], { type: 'application/json' }), `fitplan-backup-${dateKey(new Date())}.json`);
  showToast('已导出备份文件');
}

function importData(file) {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const obj = JSON.parse(reader.result);
      const data = obj && obj.data ? obj.data : obj;
      let n = 0;
      Object.entries(data).forEach(([k, v]) => {
        if (k.startsWith('fitplan-')) { localStorage.setItem(k, v); n++; }
      });
      showToast(`已导入 ${n} 项数据，正在刷新…`);
      setTimeout(() => location.reload(), 900);
    } catch (e) {
      showToast('导入失败：文件格式不正确');
    }
  };
  reader.readAsText(file);
}

/* ---------------- 事件绑定 ---------------- */

document.addEventListener('DOMContentLoaded', () => {
  // 导航切换（事件委托，保证始终生效）
  document.addEventListener('click', (e) => {
    const nav = e.target.closest('.nav-btn');
    if (nav) {
      switchView(nav.dataset.view);
      return;
    }
    const goto = e.target.closest('[data-goto]');
    if (goto) {
      switchView(goto.dataset.goto);
      return;
    }
    const cite = e.target.closest('a[href="#refs"]');
    if (cite) switchView('settings');
  });

  // 全局错误提示：任何运行时错误都会显示在首页表单下方
  window.addEventListener('error', (e) => {
    const note = document.getElementById('saveNote');
    if (note && !note.textContent) note.textContent = '页面出错：' + e.message;
  });

  // 分段选择按钮
  document.querySelectorAll('.seg-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      if (btn.dataset.font) {
        const size = Number(btn.dataset.font);
        document.documentElement.style.fontSize = size + 'px';
        try { localStorage.setItem('fitplan-font', String(size)); } catch (e) { /* 忽略 */ }
        document.querySelectorAll('#fontSeg .seg-btn').forEach((b) => b.classList.toggle('active', b === btn));
        return;
      }
      document.querySelectorAll(`.seg-btn[data-target="${btn.dataset.target}"]`)
        .forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });

  document.getElementById('generateBtn').addEventListener('click', generate);

  // 训练折叠 + 计时器 + 开始训练 + 编辑/删除动作（事件委托）
  document.addEventListener('click', (e) => {
    const toggle = e.target.closest('.day-toggle');
    if (toggle) {
      const card = toggle.closest('.day-card');
      const open = card.classList.toggle('open');
      toggle.setAttribute('aria-expanded', String(open));
      return;
    }
    const timerBtn = e.target.closest('.timer-btn');
    if (timerBtn) {
      openTimer(Number(timerBtn.dataset.rest));
      return;
    }
    const startBtn = e.target.closest('.start-session-btn');
    if (startBtn) {
      startSession(Number(startBtn.dataset.dayIdx));
      return;
    }
    const editBtn = e.target.closest('[data-edit-ex]');
    if (editBtn) {
      const [di, ei] = editBtn.dataset.editEx.split('|').map(Number);
      openEditOverlay(di, ei);
      return;
    }
    const delBtn = e.target.closest('[data-del-ex]');
    if (delBtn) {
      const [di, ei] = delBtn.dataset.delEx.split('|').map(Number);
      deleteExercise(di, ei);
      return;
    }
    const reduceBtn = e.target.closest('#reduceVolumeBtn');
    if (reduceBtn) {
      toggleVolume();
    }
  });

  // 计时器
  document.querySelectorAll('.timer-preset').forEach((b) => {
    b.addEventListener('click', () => {
      timerState.seconds = Number(b.dataset.sec);
      timerState.remain = timerState.seconds;
      stopTimer();
      renderTimer();
    });
  });
  document.getElementById('timerToggle').addEventListener('click', toggleTimer);
  document.getElementById('timerReset').addEventListener('click', () => {
    stopTimer();
    timerState.remain = timerState.seconds;
    renderTimer();
  });
  document.getElementById('timerClose').addEventListener('click', closeTimer);

  // 沉浸式训练模式
  document.getElementById('sessionDoneBtn').addEventListener('click', sessionDone);
  document.getElementById('sessionSkipBtn').addEventListener('click', sessionSkip);
  document.getElementById('sessionEndBtn').addEventListener('click', () => {
    if (sessionState.active) finishSession(); else closeSession();
  });
  document.getElementById('sessionClose').addEventListener('click', closeSession);

  // 动作编辑浮层
  document.getElementById('editSaveBtn').addEventListener('click', saveEdit);
  document.getElementById('editCancelBtn').addEventListener('click', closeEditOverlay);
  document.getElementById('editCloseBtn').addEventListener('click', closeEditOverlay);
  document.getElementById('editName').addEventListener('change', () => {
    const lib = EXERCISE_LIBRARY.find((x) => x.name === document.getElementById('editName').value);
    if (lib) {
      document.getElementById('editMuscle').value = lib.muscle;
      if (!document.getElementById('editTip').value) document.getElementById('editTip').value = lib.tip;
    }
  });

  // 热量缺口 / 盈余滑块实时重算
  const deficitSlider = document.getElementById('deficitSlider');
  if (deficitSlider) {
    deficitSlider.addEventListener('input', () => {
      document.getElementById('deficitValue').textContent = deficitSlider.value + '%';
      generate();
    });
  }

  // 蛋白质来源替换 + 购物清单复制
  document.addEventListener('click', (e) => {
    const srcBtn = e.target.closest('.protein-src-btn');
    if (srcBtn) {
      try { localStorage.setItem('fitplan-protein-source', srcBtn.dataset.protein); } catch (err) { /* 忽略 */ }
      generate();
      return;
    }
    const copyBtn = e.target.closest('#copyShopBtn');
    if (copyBtn) {
      const list = document.querySelector('#dietContent .shopping-list');
      if (list) {
        const text = [...list.querySelectorAll('li')]
          .map((li) => `${li.querySelector('span').textContent}：${li.querySelector('b').textContent}`).join('\n');
        navigator.clipboard.writeText('FitPlan 一周购物清单\n' + text)
          .then(() => showToast('购物清单已复制 ✓'))
          .catch(() => showToast('复制失败，请长按手动复制'));
      }
      return;
    }
  });

  // 自定义食材（表单每次渲染后重建，用事件委托）
  document.addEventListener('submit', (e) => {
    if (e.target.id === 'foodCalcForm') {
      e.preventDefault();
      const name = document.getElementById('foodCalcSelect').value;
      const weight = Number(document.getElementById('foodCalcWeight').value);
      const r = calcFood(name, weight);
      const out = document.getElementById('foodCalcResult');
      out.textContent = r
        ? `${name} ${weight}g：约 ${r.kcal} kcal · 蛋白 ${r.protein}g · 碳水 ${r.carbs}g · 脂肪 ${r.fat}g`
        : '未找到该食材';
      return;
    }
    if (e.target.id === 'customFoodForm') {
      e.preventDefault();
      const name = document.getElementById('cfName').value.trim();
      const p = Number(document.getElementById('cfProtein').value);
      const c = Number(document.getElementById('cfCarbs').value);
      const f = Number(document.getElementById('cfFat').value);
      const kcal = Number(document.getElementById('cfKcal').value) || 0;
      if (!name) return;
      addCustomFood(name, p, c, f, kcal);
      e.target.reset();
      showToast('已添加：' + name);
    }
  });
  document.addEventListener('click', (e) => {
    const del = e.target.closest('[data-del-food]');
    if (del) {
      const i = Number(del.dataset.delFood);
      const list = getCustomFoods();
      list.splice(i, 1);
      saveCustomFoods(list);
      populateFoodUI();
      showToast('已删除自定义食材');
    }
  });

  // 体重记录
  const weightForm = document.getElementById('weightForm');
  if (weightForm) {
    document.getElementById('weightDate').value = dateKey(new Date());
    weightForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const date = document.getElementById('weightDate').value;
      const raw = Number(document.getElementById('weightKg').value);
      const kg = getUnits().weight === 'jin' ? raw / 2 : raw;
      const bfRaw = document.getElementById('bodyFat').value;
      const bf = bfRaw === '' ? null : Number(bfRaw);
      if (!date || !kg) return;
      const list = getWeights().filter((w) => w.date !== date);
      list.push({ date, kg, bf });
      saveWeights(list);
      document.getElementById('weightKg').value = '';
      document.getElementById('bodyFat').value = '';
      renderWeight();
      showToast(`已记录 ${date} 体重 ${getUnits().weight === 'jin' ? raw + ' 斤' : kg + 'kg'}`);
    });
  }

  // 设置
  document.getElementById('themeBtn').addEventListener('click', () => {
    setTheme(document.documentElement.getAttribute('data-theme') !== 'dark');
  });
  document.getElementById('clearDataBtn').addEventListener('click', () => {
    if (confirm('确定清除全部本地数据吗？包括身体数据、自定义食材、体重记录与打卡。')) clearAllData();
  });
  document.getElementById('printTrainingBtn').addEventListener('click', () => printMode('training'));
  document.getElementById('printDietBtn').addEventListener('click', () => printMode('diet'));
  document.getElementById('csvExportBtn').addEventListener('click', exportCsv);
  document.getElementById('icsExportBtn').addEventListener('click', () => exportIcs(currentPlan));

  // 饮水提醒
  document.getElementById('waterBtn').addEventListener('click', async () => {
    if (!('Notification' in window)) {
      showToast('当前浏览器不支持通知，无法开启饮水提醒');
      return;
    }
    if (!waterSettings.enabled && 'Notification' in window && Notification.permission === 'default') {
      const perm = await Notification.requestPermission();
      if (perm !== 'granted') { showToast('未授权通知，无法开启饮水提醒'); return; }
    }
    waterSettings.enabled = !waterSettings.enabled;
    saveWaterSettings();
    renderWaterStatus();
    showToast(waterSettings.enabled ? '饮水提醒已开启 💧' : '饮水提醒已关闭');
  });
  document.getElementById('waterInterval').addEventListener('change', (e) => {
    waterSettings.intervalMin = Number(e.target.value);
    saveWaterSettings();
    renderWaterStatus();
  });

  // 单位切换
  document.querySelectorAll('#weightUnitSeg .seg-btn').forEach((b) => {
    b.addEventListener('click', () => {
      const u = getUnits();
      u.weight = b.dataset.unit;
      saveUnits(u);
      applyUnitsUI();
      generate();
    });
  });
  document.querySelectorAll('#heightUnitSeg .seg-btn').forEach((b) => {
    b.addEventListener('click', () => {
      const u = getUnits();
      u.height = b.dataset.unit;
      saveUnits(u);
      applyUnitsUI();
      generate();
    });
  });

  // 数据备份
  document.getElementById('exportDataBtn').addEventListener('click', exportData);
  document.getElementById('importDataBtn').addEventListener('click', () => document.getElementById('importDataFile').click());
  document.getElementById('importDataFile').addEventListener('change', (e) => {
    if (e.target.files && e.target.files[0]) importData(e.target.files[0]);
    e.target.value = '';
  });

  // 目标体重
  document.getElementById('saveTargetBtn').addEventListener('click', () => {
    const v = document.getElementById('targetWeight').value;
    if (v === '') {
      localStorage.removeItem('fitplan-target-weight');
      renderWeight();
      showToast('已清除目标体重');
      return;
    }
    const units = getUnits();
    const kg = units.weight === 'jin' ? Number(v) / 2 : Number(v);
    localStorage.setItem('fitplan-target-weight', kg);
    renderWeight();
    showToast('目标体重已保存');
  });

  // 回到顶部
  const backBtn = document.getElementById('backToTop');
  window.addEventListener('scroll', () => {
    backBtn.classList.toggle('show', window.scrollY > 400);
  }, { passive: true });
  backBtn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

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
      document.getElementById('diet').value = saved.diet || 'normal';
      document.getElementById('equipment').value = saved.equipment || 'gym';
      if (saved.bodyFat != null) document.getElementById('bodyFatInput').value = saved.bodyFat;
      const units = getUnits();
      if (units.weight === 'jin') document.getElementById('weight').value = Math.round(saved.weight * 2 * 10) / 10;
      if (units.height === 'ft') document.getElementById('height').value = Math.round(saved.height / 30.48 * 100) / 100;
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

  // 恢复饮水提醒设置
  waterSettings = getWaterSettings();
  renderWaterStatus();

  // 单位 UI
  applyUnitsUI();

  // 每 30 秒检查一次提醒（训练时间前触发桌面通知）
  setInterval(checkReminders, 30000);
  setInterval(checkWater, 30000);

  setTheme(document.documentElement.getAttribute('data-theme') === 'dark');

  // 首次进入直接生成一次示例计划
  try {
    generate();
  } catch (err) {
    const note = document.getElementById('saveNote');
    if (note) note.textContent = '初始化出错：' + err.message;
  }
});
