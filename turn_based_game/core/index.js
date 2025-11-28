/**
 * Core Module Index - v2.1
 * 
 * 新架构: 每个系统独立文件, FUNC.SUBFUNC(node(s)) 格式
 * 
 * 加载顺序:
 * 1. turn_phase.js     - 回合阶段容器 (36节点)
 * 2. spirit_state.js   - 精灵状态容器
 * 3. team_state.js     - 队伍状态容器 (6只精灵)
 * 4. global_state.js   - 全局状态容器
 * 5. player_input.js   - 玩家输入容器
 * 
 * 独立系统 (SYSTEM.SUBFUNC(node(s), handler) 格式):
 * 6. turn_effect.js    - TURN 回合效果系统
 * 7. count_effect.js   - COUNT 计数效果系统
 * 8. damage.js         - DAMAGE 伤害系统
 * 9. hp.js             - HP 体力系统
 * 10. pp.js            - PP 活力系统
 * 11. stats.js         - STATS 属性系统
 * 12. status.js        - STATUS 异常状态系统
 * 13. priority.js      - PRIO 先制系统
 * 14. soulbuff.js      - SOULBUFF 魂印系统
 * 
 * 工具与整合:
 * 15. systems.js       - 系统整合与工具
 * 
 * 核心引擎:
 * 16. battle_engine.js - 战斗引擎
 * 17. index.js         - 模块索引
 * 
 * HTML 引入示例:
 * <script src="core/turn_phase.js"></script>
 * <script src="core/spirit_state.js"></script>
 * <script src="core/team_state.js"></script>
 * <script src="core/global_state.js"></script>
 * <script src="core/player_input.js"></script>
 * <script src="core/turn_effect.js"></script>
 * <script src="core/count_effect.js"></script>
 * <script src="core/damage.js"></script>
 * <script src="core/hp.js"></script>
 * <script src="core/pp.js"></script>
 * <script src="core/stats.js"></script>
 * <script src="core/status.js"></script>
 * <script src="core/priority.js"></script>
 * <script src="core/soulbuff.js"></script>
 * <script src="core/systems.js"></script>
 * <script src="core/battle_engine.js"></script>
 * <script src="core/index.js"></script>
 */
(() => {
    const Core = {
        version: '2.1.0',
        
        // =====================================================================
        // 节点常量 (36 nodes)
        // =====================================================================
        NODE: window.TurnPhaseNode,
        NODE_ORDER: window.TurnPhaseOrder,
        NODE_NAMES: window.TurnPhaseNames,
        
        // =====================================================================
        // 容器工厂
        // =====================================================================
        createTurnPhase: window.createTurnPhase,
        createSpiritState: window.createSpiritState,
        createTeamState: window.createTeamState,
        createGlobalState: window.createGlobalState,
        createPlayerInput: window.createPlayerInput,
        createBattleEngine: window.createBattleEngine,
        
        // =====================================================================
        // 类引用
        // =====================================================================
        TurnPhaseContainer: window.TurnPhaseContainer,
        SpiritState: window.SpiritState,
        TeamState: window.TeamState,
        GlobalState: window.GlobalState,
        PlayerInput: window.PlayerInput,
        BattleEngine: window.BattleEngine,
        
        // =====================================================================
        // 独立系统 (SYSTEM.SUBFUNC(node(s), handler) 格式)
        // =====================================================================
        TURN: window.TURN,           // 回合效果
        COUNT: window.COUNT,         // 计数效果
        DAMAGE: window.DAMAGE,       // 伤害
        HP: window.HP,               // 体力
        PP: window.PP,               // 活力
        STATS: window.STATS,         // 属性
        STATUS: window.STATUS,       // 异常状态
        PRIO: window.PRIO,           // 先制
        SOULBUFF: window.SOULBUFF,   // 魂印
        
        // =====================================================================
        // 工具函数
        // =====================================================================
        skill: window.skill,          // 技能构建器
        spirit: window.spirit,        // 精灵构建器
        effectQueue: window.effectQueue, // 效果队列
        combine: window.combine,      // 组合效果
        when: window.when,            // 条件执行
        chance: window.chance,        // 随机执行
        onTarget: window.onTarget,    // 对目标执行
        onSelf: window.onSelf,        // 对自己执行
        onOpponent: window.onOpponent,// 对对手执行
        sequence: window.sequence,    // 序列执行
        parallel: window.parallel,    // 并行执行
        repeat: window.repeat,        // 重复执行
        
        // =====================================================================
        // 状态定义
        // =====================================================================
        STATUS_DEFS: window.STATUS_DEFS,
        CONTROL_STATUSES: window.CONTROL_STATUSES,
        ABNORMAL_STATUSES: window.ABNORMAL_STATUSES,
        SWITCH_BLOCK_STATUSES: window.SWITCH_BLOCK_STATUSES,
        
        // =====================================================================
        // 处理器
        // =====================================================================
        TURN_HANDLERS: window.TURN_HANDLERS,
        COUNT_HANDLERS: window.COUNT_HANDLERS,
        SOULBUFF_REGISTRY: window.SOULBUFF_REGISTRY,
        
        /**
         * 检查是否就绪
         */
        isReady() {
            return !!(
                window.TurnPhaseNode &&
                window.SpiritState &&
                window.TeamState &&
                window.GlobalState &&
                window.PlayerInput &&
                window.TURN &&
                window.COUNT &&
                window.DAMAGE &&
                window.HP &&
                window.PP &&
                window.STATS &&
                window.STATUS &&
                window.PRIO &&
                window.SOULBUFF
            );
        },
        
        /**
         * 获取系统状态
         */
        getStatus() {
            return {
                TurnPhaseNode: !!window.TurnPhaseNode,
                SpiritState: !!window.SpiritState,
                TeamState: !!window.TeamState,
                GlobalState: !!window.GlobalState,
                PlayerInput: !!window.PlayerInput,
                BattleEngine: !!window.BattleEngine,
                TURN: !!window.TURN,
                COUNT: !!window.COUNT,
                DAMAGE: !!window.DAMAGE,
                HP: !!window.HP,
                PP: !!window.PP,
                STATS: !!window.STATS,
                STATUS: !!window.STATUS,
                PRIO: !!window.PRIO,
                SOULBUFF: !!window.SOULBUFF,
                // 工具
                SkillBuilder: !!window.SkillBuilder,
                SpiritBuilder: !!window.SpiritBuilder,
                EffectQueue: !!window.EffectQueue
            };
        },
        
        /**
         * 获取所有36个节点
         */
        getAllNodes() {
            return Object.values(window.TurnPhaseNode);
        },
        
        /**
         * 获取节点名称
         */
        getNodeName(node) {
            return window.TurnPhaseNames?.[node] || `Unknown(${node})`;
        },
        
        /**
         * 快速创建战斗
         */
        createBattle(teamASpirits, teamBSpirits, config = {}) {
            const engine = window.createBattleEngine(config);
            engine.initTeams(teamASpirits, teamBSpirits);
            return engine;
        },
        
        /**
         * 定义精灵 (使用构建器)
         */
        defineSpirit(data) {
            if (window.spirit) {
                const builder = window.spirit(data.name)
                    .type(data.element || 'normal')
                    .stats(
                        data.hp || data.maxHp || 1000,
                        data.attack || 100,
                        data.defense || 100,
                        data.spAttack || 100,
                        data.spDefense || 100,
                        data.speed || 100
                    );
                
                if (data.skills) {
                    for (const skill of data.skills) {
                        builder.skill(skill);
                    }
                }
                
                if (data.soulBuff) {
                    builder.soulBuff(data.soulBuff);
                }
                
                const result = builder.build();
                result.id = data.id;
                result.key = data.key;
                result.maxPp = data.pp || data.maxPp || 100;
                result.soulBuffKey = data.soulBuffKey || data.key;
                result.resist = data.resist;
                
                return result;
            }
            
            // 回退到简单对象
            return {
                id: data.id,
                key: data.key,
                name: data.name,
                element: data.element || 'normal',
                maxHp: data.hp || data.maxHp || 1000,
                maxPp: data.pp || data.maxPp || 100,
                attack: data.attack || 100,
                defense: data.defense || 100,
                spAttack: data.spAttack || 100,
                spDefense: data.spDefense || 100,
                speed: data.speed || 100,
                skills: data.skills || [],
                soulBuffKey: data.soulBuffKey || data.key,
                resist: data.resist
            };
        },
        
        /**
         * 定义技能 (使用构建器)
         */
        defineSkill(data) {
            if (window.skill) {
                const builder = window.skill(data.name)
                    .pp(data.pp || 10)
                    .power(data.power || 0)
                    .accuracy(data.accuracy || 100)
                    .priority(data.priority || 0)
                    .type(data.element || 'normal');
                
                if (data.special) {
                    builder.special();
                } else {
                    builder.physical();
                }
                
                // 添加效果
                if (data.effects) {
                    for (const effect of data.effects) {
                        if (effect.nodes && effect.handler) {
                            builder.onNode(effect.nodes, effect);
                        }
                    }
                }
                
                const result = builder.build();
                result.id = data.id;
                result.type = data.type || 'attack';
                result.description = data.description || '';
                
                return result;
            }
            
            // 回退到简单对象
            return {
                id: data.id,
                name: data.name,
                type: data.type || 'attack',
                element: data.element || 'normal',
                power: data.power || 0,
                pp: data.pp || 10,
                priority: data.priority || 0,
                accuracy: data.accuracy || 100,
                special: data.special || false,
                effects: data.effects || [],
                description: data.description || ''
            };
        },
        
        /**
         * 定义魂印
         */
        defineSoulBuff(spiritKey, name, desc, effects) {
            if (window.SOULBUFF?.define) {
                return window.SOULBUFF.define(spiritKey, name, desc, effects);
            }
            return null;
        },
        
        /**
         * 创建效果
         * 使用 SYSTEM.SUBFUNC(nodes, handler) 格式
         */
        effect: {
            // DAMAGE 系统
            damage: (nodes, opts) => window.DAMAGE?.ATTACK(nodes, opts),
            fixedDamage: (nodes, opts) => window.DAMAGE?.FIXED(nodes, opts),
            percentDamage: (nodes, opts) => window.DAMAGE?.PERCENT(nodes, opts),
            trueDamage: (nodes, opts) => window.DAMAGE?.TRUE(nodes, opts),
            
            // HP 系统
            heal: (nodes, opts) => window.HP?.HEAL(nodes, opts),
            healPercent: (nodes, opts) => window.HP?.HEAL_PERCENT(nodes, opts),
            drain: (nodes, opts) => window.HP?.DRAIN(nodes, opts),
            
            // STATS 系统
            statUp: (nodes, opts) => window.STATS?.MODIFY(nodes, opts),
            statDown: (nodes, opts) => window.STATS?.MODIFY(nodes, opts),
            clearStats: (nodes) => window.STATS?.CLEAR_UPS(nodes, {}),
            
            // STATUS 系统
            applyStatus: (nodes, opts) => window.STATUS?.APPLY(nodes, opts),
            removeStatus: (nodes, opts) => window.STATUS?.REMOVE(nodes, opts),
            
            // TURN 系统
            turnBuff: (nodes, opts) => window.TURN?.ADD(nodes, opts),
            burn: (nodes, opts) => window.TURN?.BURN(nodes, opts),
            poison: (nodes, opts) => window.TURN?.POISON(nodes, opts),
            dispel: (nodes) => window.TURN?.DISPEL(nodes, {}),
            
            // COUNT 系统
            shield: (nodes, opts) => window.COUNT?.SHIELD(nodes, opts),
            reflect: (nodes, opts) => window.COUNT?.REFLECT(nodes, opts),
            immunity: (nodes, opts) => window.COUNT?.IMMUNITY(nodes, opts),
            
            // PRIO 系统
            priority: (nodes, opts) => window.PRIO?.ADD(nodes, opts),
            forceFirst: (nodes) => window.PRIO?.FORCE(nodes, {}),
            
            // PP 系统
            ppDrain: (nodes, opts) => window.PP?.DRAIN(nodes, opts),
            ppRestore: (nodes, opts) => window.PP?.RESTORE(nodes, opts)
        }
    };

    window.Core = Core;
    
    // 初始化日志
    if (Core.isReady()) {
        console.log('[Core] Battle System v2.1.0 Ready');
        console.log('[Core] 36 Nodes:', Core.getAllNodes().length);
        console.log('[Core] Status:', Core.getStatus());
    } else {
        console.warn('[Core] Some modules not loaded', Core.getStatus());
    }
})();
