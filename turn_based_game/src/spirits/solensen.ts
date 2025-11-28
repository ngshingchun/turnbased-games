/**
 * 混沌魔君索倫森 (Solensen)
 * 
 * 架構：
 * - 魂印/回合/次數效果都用 id + node 定義，便於橋接與 UI 高光
 * - 每行 FunctionCall 都標註 node；TURN/COUNT 可用 effectNode 覆蓋
 * - turn/count effect 分成：檢查 → 設置標記 → 檢測標記執行
 */

import { SpiritData, SoulBuff, Skill } from '../types';

// =============================================================================
// 精靈基礎數據
// =============================================================================

const SPIRIT_DATA: Omit<SpiritData, 'skills' | 'soulBuff'> = {
  key: 'solensen',
  name: '混沌魔君索倫森',
  element: '混沌',
  maxHp: 1000,
  maxPp: 100,
  attack: 130,
  defense: 110,
  spAttack: 130,
  spDefense: 110,
  speed: 100,
  resist: { fixed: 0, percent: 0, trueDmg: 0 },
};

// =============================================================================
// 魂印效果
// =============================================================================

const SOULBUFF: SoulBuff = {
  name: '源',
  desc: '登場消除強化封鎖能力；同步對手過高能力；無強化減傷/有強化回血反擊',
  effects: [
    // 消除對手強化，成功則封鎖提升+屬性技能
    { id: 'solensen_soul_entry_require_key', dispellable: false, calls: [{ system: 'STATE', func: 'REQUIRE_KEY', node: NODE.NODE_05, target: 'self' as const, value: 'solensen' }] },
    { id: 'solensen_soul_entry_not_boss', dispellable: false, calls: [{ system: 'STATE', func: 'REQUIRE_NOT_BOSS', node: NODE.NODE_05, target: 'opponent' as const }] },
    { id: 'solensen_soul_entry_precheck_up', dispellable: false, calls: [{ system: 'STATE', func: 'REQUIRE_STAT_UP', node: NODE.NODE_05, target: 'opponent' as const }] },
    { id: 'solensen_soul_entry_clear_up', dispellable: false, calls: [{ system: 'STATS', func: 'CLEAR_UPS', node: NODE.NODE_05, target: 'opponent' as const }] },
    { id: 'solensen_soul_entry_postcheck_no_up', dispellable: false, calls: [{ system: 'STATE', func: 'REQUIRE_NO_STAT_UP', node: NODE.NODE_05, target: 'opponent' as const }] },
    { id: 'solensen_soul_entry_add_turn_block', dispellable: false, calls: [{ system: 'TURN', func: 'ADD', node: NODE.NODE_05, target: 'opponent' as const, effectId: '32674', turns: 2, effectNode: NODE.NODE_11 }] },
    { id: 'solensen_soul_entry_add_count_attr', dispellable: false, calls: [{ system: 'COUNT', func: 'SET', node: NODE.NODE_05, target: 'opponent' as const, countId: '32675', count: 1, effectNode: NODE.NODE_09 }] },
    { id: 'solensen_soul_entry_block_up', dispellable: false, calls: [{ system: 'STATE', func: 'REQUIRE_TURN_EFFECT', node: NODE.NODE_11, target: 'opponent' as const, effectId: '32674' }] },
    { id: 'solensen_soul_entry_block_up_apply', dispellable: false, calls: [{ system: 'STATS', func: 'BLOCK_UP', node: NODE.NODE_11, target: 'opponent' as const }] },
    { id: 'solensen_soul_entry_block_attr_require', dispellable: false, calls: [{ system: 'STATE', func: 'REQUIRE_COUNT_EFFECT', node: NODE.NODE_09, target: 'opponent' as const, countId: '32675' }] },
    { id: 'solensen_soul_entry_block_attr_apply', dispellable: false, calls: [{ system: 'BLOCK', func: 'NULLIFY_ATTRIBUTE', node: NODE.NODE_09, target: 'opponent' as const }] },
    { id: 'solensen_soul_entry_block_attr_consume', dispellable: false, calls: [{ system: 'COUNT', func: 'CONSUME', node: NODE.NODE_09, target: 'opponent' as const, countId: '32675' }] },

    // 同步對手過高能力
    { id: 'solensen_soul_sync_require_key_start', dispellable: false, calls: [{ system: 'STATE', func: 'REQUIRE_KEY', node: NODE.NODE_06, target: 'self' as const, value: 'solensen' }] },
    { id: 'solensen_soul_sync_not_boss_start', dispellable: false, calls: [{ system: 'STATE', func: 'REQUIRE_NOT_BOSS', node: NODE.NODE_06, target: 'opponent' as const }] },
    { id: 'solensen_soul_sync_down_start', dispellable: false, calls: [{ system: 'STATS', func: 'SYNC_DOWN', node: NODE.NODE_06, target: 'opponent' as const, reference: 'self' as const }] },

    { id: 'solensen_soul_sync_require_key_end', dispellable: false, calls: [{ system: 'STATE', func: 'REQUIRE_KEY', node: NODE.NODE_27, target: 'self' as const, value: 'solensen' }] },
    { id: 'solensen_soul_sync_not_boss_end', dispellable: false, calls: [{ system: 'STATE', func: 'REQUIRE_NOT_BOSS', node: NODE.NODE_27, target: 'opponent' as const }] },
    { id: 'solensen_soul_sync_down_end', dispellable: false, calls: [{ system: 'STATS', func: 'SYNC_DOWN', node: NODE.NODE_27, target: 'opponent' as const, reference: 'self' as const }] },

    // 無強化：減傷與50%免疫
    { id: 'solensen_soul_guard_require_key', dispellable: false, calls: [{ system: 'STATE', func: 'REQUIRE_KEY', node: NODE.NODE_06, target: 'self' as const, value: 'solensen' }] },
    { id: 'solensen_soul_guard_no_up', dispellable: false, calls: [{ system: 'STATE', func: 'REQUIRE_NO_STAT_UP', node: NODE.NODE_06, target: 'self' as const }] },
    { id: 'solensen_soul_guard_add_turn', dispellable: false, calls: [{ system: 'TURN', func: 'ADD', node: NODE.NODE_06, target: 'self' as const, effectId: '32677', turns: 1, effectNode: [NODE.NODE_10, NODE.NODE_12] }] },
    { id: 'solensen_soul_guard_require_turn_nullify', dispellable: false, calls: [{ system: 'STATE', func: 'REQUIRE_TURN_EFFECT', node: NODE.NODE_10, target: 'self' as const, effectId: '32677' }] },
    { id: 'solensen_soul_guard_random', dispellable: false, calls: [{ system: 'STATE', func: 'REQUIRE_RANDOM', node: NODE.NODE_10, chance: 0.5 }] },
    { id: 'solensen_soul_guard_nullify', dispellable: false, calls: [{ system: 'BLOCK', func: 'NULLIFY', node: NODE.NODE_10, target: 'self' as const }] },
    { id: 'solensen_soul_guard_require_turn_reduce', dispellable: false, calls: [{ system: 'STATE', func: 'REQUIRE_TURN_EFFECT', node: NODE.NODE_12, target: 'self' as const, effectId: '32677' }] },
    { id: 'solensen_soul_guard_reduce', dispellable: false, calls: [{ system: 'DAMAGE', func: 'REDUCE_PERCENT', node: NODE.NODE_12, target: 'self' as const, percent: 50 }] },

    // 有強化：戰鬥結束回血反擊
    { id: 'solensen_soul_heal_require_key', dispellable: false, calls: [{ system: 'STATE', func: 'REQUIRE_KEY', node: NODE.NODE_27, target: 'self' as const, value: 'solensen' }] },
    { id: 'solensen_soul_heal_stat_up', dispellable: false, calls: [{ system: 'STATE', func: 'REQUIRE_STAT_UP', node: NODE.NODE_27, target: 'self' as const }] },
    { id: 'solensen_soul_heal', dispellable: false, calls: [{ system: 'HP', func: 'HEAL_PERCENT', node: NODE.NODE_27, target: 'self' as const, percent: 33, basedOn: 'max' as const }] },
    { id: 'solensen_soul_strike', dispellable: false, calls: [{ system: 'DAMAGE', func: 'PERCENT', node: NODE.NODE_27, target: 'opponent' as const, percent: 33, basedOn: 'max' as const }] },
  ],
};

// =============================================================================
// 技能
// =============================================================================

const SKILLS: Skill[] = [
  {
    id: 'solensen_skill_1',
    name: '混沌滅世決',
    type: 'attack',
    element: '混沌',
    category: 'special',
    power: 160,
    pp: 5,
    maxPp: 5,
    priority: 0,
    accuracy: 'must_hit',
    desc: '第五技能\n必中；消除對手強化，成功則對手下2次攻擊無效；\n未擊敗對手則下2回合先制+2；\n對手每有1項能力等級與自身相同則附加120點固傷',
    calls: [
      { system: 'PP', func: 'USE', node: NODE.NODE_09, target: 'self' as const, skillIndex: 0, amount: 1 },
      { system: 'STATS', func: 'CLEAR_UPS', node: NODE.NODE_11, target: 'opponent' as const },
      { system: 'DAMAGE', func: 'ATTACK', node: NODE.NODE_13, target: 'opponent' as const, category: 'special' as const, power: 160 },
      { system: 'STATE', func: 'REQUIRE_NO_STAT_UP', node: NODE.NODE_11, target: 'opponent' as const },
      {
        system: 'COUNT',
        func: 'SET',
        node: NODE.NODE_11,
        target: 'opponent' as const,
        countId: '32680',
        count: 2,
        effectNode: NODE.NODE_09,
      },
      { system: 'STATE', func: 'REQUIRE_COUNT_EFFECT', node: NODE.NODE_09, target: 'opponent' as const, countId: '32680' },
      { system: 'BLOCK', func: 'NULLIFY', node: NODE.NODE_09, target: 'opponent' as const },
      { system: 'COUNT', func: 'CONSUME', node: NODE.NODE_09, target: 'opponent' as const, countId: '32680' },
      { system: 'STATE', func: 'REQUIRE_ALIVE', node: NODE.NODE_14, target: 'opponent' as const },
      {
        system: 'TURN',
        func: 'ADD',
        node: NODE.NODE_14,
        target: 'self' as const,
        effectId: '32682',
        turns: 2,
        effectNode: NODE.NODE_06,
      },
      { system: 'STATE', func: 'REQUIRE_TURN_EFFECT', node: NODE.NODE_06, target: 'self' as const, effectId: '32682' },
      { system: 'PRIO', func: 'ADD', node: NODE.NODE_06, target: 'self' as const, value: 2 },
      { system: 'STATE', func: 'REQUIRE_STAT_EQUAL', node: NODE.NODE_14, stat: 'attack' },
      { system: 'DAMAGE', func: 'FIXED', node: NODE.NODE_14, target: 'opponent' as const, value: 120 },
      { system: 'STATE', func: 'REQUIRE_STAT_EQUAL', node: NODE.NODE_14, stat: 'defense' },
      { system: 'DAMAGE', func: 'FIXED', node: NODE.NODE_14, target: 'opponent' as const, value: 120 },
      { system: 'STATE', func: 'REQUIRE_STAT_EQUAL', node: NODE.NODE_14, stat: 'spAttack' },
      { system: 'DAMAGE', func: 'FIXED', node: NODE.NODE_14, target: 'opponent' as const, value: 120 },
      { system: 'STATE', func: 'REQUIRE_STAT_EQUAL', node: NODE.NODE_14, stat: 'spDefense' },
      { system: 'DAMAGE', func: 'FIXED', node: NODE.NODE_14, target: 'opponent' as const, value: 120 },
      { system: 'STATE', func: 'REQUIRE_STAT_EQUAL', node: NODE.NODE_14, stat: 'speed' },
      { system: 'DAMAGE', func: 'FIXED', node: NODE.NODE_14, target: 'opponent' as const, value: 120 },
    ],
  },
  {
    id: 'solensen_skill_2',
    name: '烈火淨世擊',
    type: 'attack',
    element: '混沌',
    category: 'special',
    power: 150,
    pp: 5,
    maxPp: 5,
    priority: 0,
    accuracy: 'must_hit',
    desc: '混沌特攻\n必中；對手無強化時傷害+100%；\n反轉對手強化，成功則恢復所有體力及PP',
    calls: [
      { system: 'PP', func: 'USE', node: NODE.NODE_09, target: 'self' as const, skillIndex: 1, amount: 1 },
      { system: 'DAMAGE', func: 'ATTACK', node: NODE.NODE_13, target: 'opponent' as const, category: 'special' as const, power: 150 },
      { system: 'STATS', func: 'REVERSE', node: NODE.NODE_14, target: 'opponent' as const },
      { system: 'STATE', func: 'REQUIRE_NO_STAT_UP', node: NODE.NODE_13, target: 'opponent' as const },
      { system: 'DAMAGE', func: 'MULTIPLY', node: NODE.NODE_13, target: 'opponent' as const, multiplier: 2.0 },
      { system: 'STATE', func: 'REQUIRE_STAT_DOWN', node: NODE.NODE_14, target: 'opponent' as const },
      { system: 'HP', func: 'SET_MAX', node: NODE.NODE_14, target: 'self' as const },
      { system: 'PP', func: 'RESTORE_ALL', node: NODE.NODE_14, target: 'self' as const },
    ],
  },
  {
    id: 'solensen_skill_2',
    name: '混沌滅世決',
    type: 'ultimate',
    element: '混沌',
    category: 'special',
    power: 160,
    pp: 5,
    maxPp: 5,
    priority: 0,
    accuracy: 'must_hit',
    desc: '第五技能\n必中；消除對手強化，成功則對手下2次攻擊無效；\n未擊敗對手則下2回合先制+2；\n對手每有1項能力等級與自身相同則附加120點固傷',
    calls: [
      { system: 'PP', func: 'USE', node: NODE.NODE_09, target: 'self' as const, skillIndex: 1, amount: 1 },
      { system: 'STATS', func: 'CLEAR_UPS', node: NODE.NODE_11, target: 'opponent' as const },
      { system: 'DAMAGE', func: 'ATTACK', node: NODE.NODE_13, target: 'opponent' as const, category: 'special' as const, power: 160 },
      { system: 'STATE', func: 'REQUIRE_NO_STAT_UP', node: NODE.NODE_11, target: 'opponent' as const },
      {
        system: 'COUNT',
        func: 'SET',
        node: NODE.NODE_11,
        target: 'opponent' as const,
        countId: '32680',
        count: 2,
        effectNode: NODE.NODE_09,
        onSuccess: [
          { system: 'BLOCK', func: 'NULLIFY', node: NODE.NODE_09, target: 'self' as const },
          { system: 'COUNT', func: 'CONSUME', node: NODE.NODE_09, target: 'self' as const, countId: '32680' },
        ],
      },
      { system: 'STATE', func: 'REQUIRE_ALIVE', node: NODE.NODE_14, target: 'opponent' as const },
      {
        system: 'TURN',
        func: 'ADD',
        node: NODE.NODE_14,
        target: 'self' as const,
        effectId: '32682',
        turns: 2,
        effectNode: NODE.NODE_06,
        onSuccess: [
          { system: 'PRIO', func: 'ADD', node: NODE.NODE_06, target: 'self' as const, value: 2 },
        ],
      },
      { system: 'STATE', func: 'REQUIRE_STAT_EQUAL', node: NODE.NODE_14, stat: 'attack' },
      { system: 'DAMAGE', func: 'FIXED', node: NODE.NODE_14, target: 'opponent' as const, value: 120 },
      { system: 'STATE', func: 'REQUIRE_STAT_EQUAL', node: NODE.NODE_14, stat: 'defense' },
      { system: 'DAMAGE', func: 'FIXED', node: NODE.NODE_14, target: 'opponent' as const, value: 120 },
      { system: 'STATE', func: 'REQUIRE_STAT_EQUAL', node: NODE.NODE_14, stat: 'spAttack' },
      { system: 'DAMAGE', func: 'FIXED', node: NODE.NODE_14, target: 'opponent' as const, value: 120 },
      { system: 'STATE', func: 'REQUIRE_STAT_EQUAL', node: NODE.NODE_14, stat: 'spDefense' },
      { system: 'DAMAGE', func: 'FIXED', node: NODE.NODE_14, target: 'opponent' as const, value: 120 },
      { system: 'STATE', func: 'REQUIRE_STAT_EQUAL', node: NODE.NODE_14, stat: 'speed' },
      { system: 'DAMAGE', func: 'FIXED', node: NODE.NODE_14, target: 'opponent' as const, value: 120 },
    ],
  },
  {
    id: 'solensen_skill_3',
    name: '背棄聖靈',
    type: 'buff',
    element: '混沌',
    category: 'attribute',
    power: 0,
    pp: 5,
    maxPp: 5,
    priority: 0,
    accuracy: 'must_hit',
    desc: '屬性攻擊\n全屬性+1；恢復滿體力並造成等量固傷；\n下2回合對手受擊傷害+150%；下2回合自身先制+2',
    calls: [
      { system: 'PP', func: 'USE', node: NODE.NODE_09, target: 'self' as const, skillIndex: 2, amount: 1 },
      { system: 'STATS', func: 'MODIFY', node: NODE.NODE_11, target: 'self' as const, stats: { attack: 1, defense: 1, spAttack: 1, spDefense: 1, speed: 1 } },
      { system: 'HP', func: 'HEAL_PERCENT', node: NODE.NODE_11, target: 'self' as const, percent: 100, basedOn: 'lost' as const },
      { system: 'DAMAGE', func: 'PERCENT', node: NODE.NODE_11, target: 'opponent' as const, percent: 100, basedOn: 'lost' as const },
      {
        system: 'TURN',
        func: 'ADD',
        node: NODE.NODE_11,
        target: 'opponent' as const,
        effectId: '32683',
        turns: 2,
        effectNode: NODE.NODE_12,
      },
      { system: 'STATE', func: 'REQUIRE_TURN_EFFECT', node: NODE.NODE_12, target: 'opponent' as const, effectId: '32683' },
      { system: 'DAMAGE', func: 'MULTIPLY', node: NODE.NODE_12, target: 'opponent' as const, multiplier: 2.5 },
      {
        system: 'TURN',
        func: 'ADD',
        node: NODE.NODE_11,
        target: 'self' as const,
        effectId: '32684',
        turns: 2,
        effectNode: NODE.NODE_06,
      },
      { system: 'STATE', func: 'REQUIRE_TURN_EFFECT', node: NODE.NODE_06, target: 'self' as const, effectId: '32684' },
      { system: 'PRIO', func: 'ADD', node: NODE.NODE_06, target: 'self' as const, value: 2 },
    ],
  },
  {
    id: 'solensen_skill_4',
    name: '混沌魔域',
    type: 'buff',
    element: '混沌',
    category: 'attribute',
    power: 0,
    pp: 5,
    maxPp: 5,
    priority: 0,
    accuracy: 100,
    desc: '屬性攻擊\n5回合免疫並反彈異常；\n100%害怕，未觸發則吸取1/3最大體力；\n對手全屬性-1，自身體力低於對手時翻倍',
    calls: [
      { system: 'PP', func: 'USE', node: NODE.NODE_09, target: 'self' as const, skillIndex: 3, amount: 1 },
      {
        system: 'COUNT',
        func: 'SET',
        node: NODE.NODE_11,
        target: 'self' as const,
        countId: '32685',
        count: 5,
        effectNode: NODE.NODE_11,
      },
      { system: 'STATE', func: 'REQUIRE_COUNT_EFFECT', node: NODE.NODE_11, target: 'self' as const, countId: '32685' },
      { system: 'STATUS', func: 'BLOCK', node: NODE.NODE_11, target: 'self' as const },
      { system: 'COUNT', func: 'CONSUME', node: NODE.NODE_11, target: 'self' as const, countId: '32685' },
      {
        system: 'TURN',
        func: 'ADD',
        node: NODE.NODE_11,
        target: 'self' as const,
        effectId: '32686',
        turns: 99,
        effectNode: NODE.NODE_11,
      },
      { system: 'STATE', func: 'REQUIRE_TURN_EFFECT', node: NODE.NODE_11, target: 'self' as const, effectId: '32686' },
      { system: 'STATUS', func: 'REFLECT', node: NODE.NODE_11, target: 'opponent' as const },
      { system: 'STATUS', func: 'APPLY', node: NODE.NODE_11, target: 'opponent' as const, status: 'fear' as const, turns: 1, chance: 100 },
      { system: 'STATE', func: 'REQUIRE_NO_STATUS', node: NODE.NODE_11, target: 'opponent' as const, status: 'fear' as const },
      { system: 'HP', func: 'DRAIN_PERCENT', node: NODE.NODE_11, target: 'opponent' as const, percent: 33, basedOn: 'max' as const },
      { system: 'STATS', func: 'MODIFY', node: NODE.NODE_11, target: 'opponent' as const, stats: { attack: -1, defense: -1, spAttack: -1, spDefense: -1, speed: -1 } },
      { system: 'STATE', func: 'REQUIRE_HP_LOWER_THAN', node: NODE.NODE_11 },
      { system: 'STATS', func: 'MODIFY', node: NODE.NODE_11, target: 'opponent' as const, stats: { attack: -1, defense: -1, spAttack: -1, spDefense: -1, speed: -1 } },
    ],
  },
  {
    id: 'solensen_skill_5',
    name: '諸雄之主',
    type: 'attack',
    element: '混沌',
    category: 'special',
    power: 85,
    pp: 20,
    maxPp: 20,
    priority: 3,
    accuracy: 100,
    desc: '混沌特攻\n先制+3；消除對手回合效果，成功則免疫下2次異常；\n30%幾率3倍傷害，自身強化時概率翻倍',
    calls: [
      { system: 'PP', func: 'USE', node: NODE.NODE_09, target: 'self' as const, skillIndex: 4, amount: 1 },
      { system: 'TURN', func: 'DISPEL', node: NODE.NODE_11, target: 'opponent' as const },
      { system: 'DAMAGE', func: 'ATTACK', node: NODE.NODE_13, target: 'opponent' as const, category: 'special' as const, power: 85 },
      { system: 'STATE', func: 'REQUIRE_NO_TURN_EFFECT', node: NODE.NODE_11, target: 'opponent' as const },
      {
        system: 'COUNT',
        func: 'SET',
        node: NODE.NODE_11,
        target: 'self' as const,
        countId: '32688',
        count: 2,
        effectNode: NODE.NODE_11,
      },
      { system: 'STATE', func: 'REQUIRE_COUNT_EFFECT', node: NODE.NODE_11, target: 'self' as const, countId: '32688' },
      { system: 'STATUS', func: 'BLOCK', node: NODE.NODE_11, target: 'self' as const },
      { system: 'COUNT', func: 'CONSUME', node: NODE.NODE_11, target: 'self' as const, countId: '32688' },
      { system: 'STATE', func: 'REQUIRE_NO_STAT_UP', node: NODE.NODE_13, target: 'self' as const },
      { system: 'STATE', func: 'REQUIRE_RANDOM', node: NODE.NODE_13, chance: 0.3 },
      { system: 'DAMAGE', func: 'MULTIPLY', node: NODE.NODE_13, target: 'opponent' as const, multiplier: 3.0 },
      { system: 'STATE', func: 'REQUIRE_STAT_UP', node: NODE.NODE_13, target: 'self' as const },
      { system: 'STATE', func: 'REQUIRE_RANDOM', node: NODE.NODE_13, chance: 0.6 },
      { system: 'DAMAGE', func: 'MULTIPLY', node: NODE.NODE_13, target: 'opponent' as const, multiplier: 3.0 },
    ],
  },
];

// =============================================================================
// 導出
// =============================================================================

export const solensen: SpiritData = {
  ...SPIRIT_DATA,
  skills: SKILLS,
  soulBuff: SOULBUFF,
};

export default solensen;
