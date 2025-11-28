/**
 * TurnPhase - 回合阶段系统 (36节点完整版)
 * 
 * 基于 turn_phase.txt 的完整流程定义
 * 与 StateA / StateB 并行运行
 * 每个回合循环前清空，在每个节点读写状态
 * 
 * 战斗阶段开始时(NODE.BATTLE_PHASE_START)决定先后手，之后分别执行先手方/后手方节点
 */
(() => {
    // =========================================================================
    // 36 NODES 节点定义
    // =========================================================================
    const NODE = {
        // === 1-4: 切换/登场流程 ===
        SWITCH_IN_PHASE: 'switch_in_phase',           // 1. 切換上場階段
        ON_ENTRY_SPEED: 'on_entry_speed',             // 2. 出戰時(手速決定雙方先後)
        AFTER_ENTRY: 'after_entry',                   // 3. 出戰後
        SPIRIT_ACTION_PHASE: 'spirit_action_phase',   // 4. 精靈操作階段

        // === 5-6: 登场/回合开始 ===
        ON_ENTRY: 'on_entry',                         // 5. 登場時
        TURN_START: 'turn_start',                     // 6. 回合開始時

        // === 7: 战斗阶段开始 (决定先后手) ===
        BATTLE_PHASE_START: 'battle_phase_start',     // 7. 戰鬥階段開始時

        // === 8-16: 先手方战斗阶段 ===
        FIRST_ACTION_START: 'first_action_start',             // 8. 先手方-出手流程開始時
        FIRST_BEFORE_HIT: 'first_before_hit',                 // 9. 先手方-命中前/使用技能時
        FIRST_ON_HIT: 'first_on_hit',                         // 10. 先手方-命中時
        FIRST_SKILL_EFFECT: 'first_skill_effect',             // 11. 先手方-技能效果生效時
        FIRST_BEFORE_DAMAGE: 'first_before_damage',           // 12. 先手方-造成攻擊傷害前
        FIRST_DEAL_DAMAGE: 'first_deal_damage',               // 13. 先手方-造成攻擊傷害
        FIRST_AFTER_ATTACK: 'first_after_attack',             // 14. 先手方-攻擊後/使用技能後
        FIRST_ACTION_END: 'first_action_end',                 // 15. 先手方-出手流程結束時
        FIRST_AFTER_ACTION: 'first_after_action',             // 16. 先手方-行動結束後

        // === 17: 死亡判定1 ===
        DEATH_CHECK_1: 'death_check_1',               // 17. 死亡判定節點1

        // === 18-26: 后手方战斗阶段 ===
        SECOND_ACTION_START: 'second_action_start',           // 18. 後手方-出手流程開始時
        SECOND_BEFORE_HIT: 'second_before_hit',               // 19. 後手方-命中前/使用技能時
        SECOND_ON_HIT: 'second_on_hit',                       // 20. 後手方-命中時
        SECOND_SKILL_EFFECT: 'second_skill_effect',           // 21. 後手方-技能效果生效時
        SECOND_BEFORE_DAMAGE: 'second_before_damage',         // 22. 後手方-造成攻擊傷害前
        SECOND_DEAL_DAMAGE: 'second_deal_damage',             // 23. 後手方-造成攻擊傷害
        SECOND_AFTER_ATTACK: 'second_after_attack',           // 24. 後手方-攻擊後/使用技能後
        SECOND_ACTION_END: 'second_action_end',               // 25. 後手方-出手流程結束時
        SECOND_AFTER_ACTION: 'second_after_action',           // 26. 後手方-行動結束後

        // === 27-30: 战斗/回合结束 ===
        BATTLE_PHASE_END: 'battle_phase_end',         // 27. 戰鬥階段結束時
        AFTER_BATTLE_PHASE: 'after_battle_phase',     // 28. 戰鬥階段結束後
        TURN_END: 'turn_end',                         // 29. 回合結束時
        AFTER_TURN: 'after_turn',                     // 30. 回合結束後

        // === 31-35: 击败/死亡流程 ===
        NOT_DEFEATED: 'not_defeated',                 // 31. 未被擊敗/被擊敗時
        DEFEAT_CHECK: 'defeat_check',                 // 32. 未擊敗/擊敗對手時
        AFTER_DEFEATED: 'after_defeated',             // 33. 被擊敗後
        AFTER_DEFEAT_FOE: 'after_defeat_foe',         // 34. 擊敗對手後
        ON_DEATH_SWITCH: 'on_death_switch',           // 35. 死亡下場

        // === 36: 战败判定 ===
        BATTLE_END_CHECK: 'battle_end_check',         // 36. 戰敗判定節點

        // =====================================================================
        // 通用行动节点 (Generic Action Nodes)
        // 在技能定义中使用，运行时根据先后手解析为具体节点
        // 由 BATTLE_PHASE_START 决定先后手后，引擎将这些节点映射到实际节点
        // =====================================================================
        ACTION_START: 'action_start',                 // → FIRST/SECOND_ACTION_START
        BEFORE_HIT: 'before_hit',                     // → FIRST/SECOND_BEFORE_HIT
        ON_HIT: 'on_hit',                             // → FIRST/SECOND_ON_HIT
        SKILL_EFFECT: 'skill_effect',                 // → FIRST/SECOND_SKILL_EFFECT
        BEFORE_DAMAGE: 'before_damage',               // → FIRST/SECOND_BEFORE_DAMAGE
        DEAL_DAMAGE: 'deal_damage',                   // → FIRST/SECOND_DEAL_DAMAGE
        AFTER_ATTACK: 'after_attack',                 // → FIRST/SECOND_AFTER_ATTACK
        ACTION_END: 'action_end',                     // → FIRST/SECOND_ACTION_END
        AFTER_ACTION: 'after_action'                  // → FIRST/SECOND_AFTER_ACTION
    };

    // =========================================================================
    // 通用节点到具体节点的映射
    // =========================================================================
    const GENERIC_TO_FIRST = {
        [NODE.ACTION_START]: NODE.FIRST_ACTION_START,
        [NODE.BEFORE_HIT]: NODE.FIRST_BEFORE_HIT,
        [NODE.ON_HIT]: NODE.FIRST_ON_HIT,
        [NODE.SKILL_EFFECT]: NODE.FIRST_SKILL_EFFECT,
        [NODE.BEFORE_DAMAGE]: NODE.FIRST_BEFORE_DAMAGE,
        [NODE.DEAL_DAMAGE]: NODE.FIRST_DEAL_DAMAGE,
        [NODE.AFTER_ATTACK]: NODE.FIRST_AFTER_ATTACK,
        [NODE.ACTION_END]: NODE.FIRST_ACTION_END,
        [NODE.AFTER_ACTION]: NODE.FIRST_AFTER_ACTION
    };

    const GENERIC_TO_SECOND = {
        [NODE.ACTION_START]: NODE.SECOND_ACTION_START,
        [NODE.BEFORE_HIT]: NODE.SECOND_BEFORE_HIT,
        [NODE.ON_HIT]: NODE.SECOND_ON_HIT,
        [NODE.SKILL_EFFECT]: NODE.SECOND_SKILL_EFFECT,
        [NODE.BEFORE_DAMAGE]: NODE.SECOND_BEFORE_DAMAGE,
        [NODE.DEAL_DAMAGE]: NODE.SECOND_DEAL_DAMAGE,
        [NODE.AFTER_ATTACK]: NODE.SECOND_AFTER_ATTACK,
        [NODE.ACTION_END]: NODE.SECOND_ACTION_END,
        [NODE.AFTER_ACTION]: NODE.SECOND_AFTER_ACTION
    };

    /**
     * 解析通用节点为具体节点
     * @param {string} genericNode - 通用节点
     * @param {boolean} isFirst - 是否先手
     * @returns {string} 具体节点
     */
    function resolveNode(genericNode, isFirst) {
        if (isFirst && GENERIC_TO_FIRST[genericNode]) {
            return GENERIC_TO_FIRST[genericNode];
        }
        if (!isFirst && GENERIC_TO_SECOND[genericNode]) {
            return GENERIC_TO_SECOND[genericNode];
        }
        // 如果不是通用节点，原样返回
        return genericNode;
    }

    /**
     * 检查节点是否为通用行动节点
     */
    function isGenericActionNode(node) {
        return [
            NODE.ACTION_START, NODE.BEFORE_HIT, NODE.ON_HIT,
            NODE.SKILL_EFFECT, NODE.BEFORE_DAMAGE, NODE.DEAL_DAMAGE,
            NODE.AFTER_ATTACK, NODE.ACTION_END, NODE.AFTER_ACTION
        ].includes(node);
    }

    // =========================================================================
    // 节点顺序 (完整流程)
    // =========================================================================
    const NODE_ORDER = [
        NODE.SWITCH_IN_PHASE,
        NODE.ON_ENTRY_SPEED,
        NODE.AFTER_ENTRY,
        NODE.SPIRIT_ACTION_PHASE,
        NODE.ON_ENTRY,
        NODE.TURN_START,
        NODE.BATTLE_PHASE_START,
        // 先手方
        NODE.FIRST_ACTION_START,
        NODE.FIRST_BEFORE_HIT,
        NODE.FIRST_ON_HIT,
        NODE.FIRST_SKILL_EFFECT,
        NODE.FIRST_BEFORE_DAMAGE,
        NODE.FIRST_DEAL_DAMAGE,
        NODE.FIRST_AFTER_ATTACK,
        NODE.FIRST_ACTION_END,
        NODE.FIRST_AFTER_ACTION,
        NODE.DEATH_CHECK_1,
        // 后手方
        NODE.SECOND_ACTION_START,
        NODE.SECOND_BEFORE_HIT,
        NODE.SECOND_ON_HIT,
        NODE.SECOND_SKILL_EFFECT,
        NODE.SECOND_BEFORE_DAMAGE,
        NODE.SECOND_DEAL_DAMAGE,
        NODE.SECOND_AFTER_ATTACK,
        NODE.SECOND_ACTION_END,
        NODE.SECOND_AFTER_ACTION,
        // 结束流程
        NODE.BATTLE_PHASE_END,
        NODE.AFTER_BATTLE_PHASE,
        NODE.TURN_END,
        NODE.AFTER_TURN,
        NODE.NOT_DEFEATED,
        NODE.DEFEAT_CHECK,
        NODE.AFTER_DEFEATED,
        NODE.AFTER_DEFEAT_FOE,
        NODE.ON_DEATH_SWITCH,
        NODE.BATTLE_END_CHECK
    ];

    // =========================================================================
    // 节点中文名称映射
    // =========================================================================
    const NODE_NAMES = {
        [NODE.SWITCH_IN_PHASE]: '切換上場階段',
        [NODE.ON_ENTRY_SPEED]: '出戰時(手速決定先後)',
        [NODE.AFTER_ENTRY]: '出戰後',
        [NODE.SPIRIT_ACTION_PHASE]: '精靈操作階段',
        [NODE.ON_ENTRY]: '登場時',
        [NODE.TURN_START]: '回合開始時',
        [NODE.BATTLE_PHASE_START]: '戰鬥階段開始時',
        [NODE.FIRST_ACTION_START]: '先手方-出手流程開始時',
        [NODE.FIRST_BEFORE_HIT]: '先手方-命中前',
        [NODE.FIRST_ON_HIT]: '先手方-命中時',
        [NODE.FIRST_SKILL_EFFECT]: '先手方-技能效果生效時',
        [NODE.FIRST_BEFORE_DAMAGE]: '先手方-造成傷害前',
        [NODE.FIRST_DEAL_DAMAGE]: '先手方-造成傷害',
        [NODE.FIRST_AFTER_ATTACK]: '先手方-攻擊後',
        [NODE.FIRST_ACTION_END]: '先手方-出手流程結束時',
        [NODE.FIRST_AFTER_ACTION]: '先手方-行動結束後',
        [NODE.DEATH_CHECK_1]: '死亡判定節點1',
        [NODE.SECOND_ACTION_START]: '後手方-出手流程開始時',
        [NODE.SECOND_BEFORE_HIT]: '後手方-命中前',
        [NODE.SECOND_ON_HIT]: '後手方-命中時',
        [NODE.SECOND_SKILL_EFFECT]: '後手方-技能效果生效時',
        [NODE.SECOND_BEFORE_DAMAGE]: '後手方-造成傷害前',
        [NODE.SECOND_DEAL_DAMAGE]: '後手方-造成傷害',
        [NODE.SECOND_AFTER_ATTACK]: '後手方-攻擊後',
        [NODE.SECOND_ACTION_END]: '後手方-出手流程結束時',
        [NODE.SECOND_AFTER_ACTION]: '後手方-行動結束後',
        [NODE.BATTLE_PHASE_END]: '戰鬥階段結束時',
        [NODE.AFTER_BATTLE_PHASE]: '戰鬥階段結束後',
        [NODE.TURN_END]: '回合結束時',
        [NODE.AFTER_TURN]: '回合結束後',
        [NODE.NOT_DEFEATED]: '未被擊敗/被擊敗時',
        [NODE.DEFEAT_CHECK]: '未擊敗/擊敗對手時',
        [NODE.AFTER_DEFEATED]: '被擊敗後',
        [NODE.AFTER_DEFEAT_FOE]: '擊敗對手後',
        [NODE.ON_DEATH_SWITCH]: '死亡下場',
        [NODE.BATTLE_END_CHECK]: '戰敗判定節點'
    };

    // =========================================================================
    // TurnPhase Container Class
    // =========================================================================
    class TurnPhaseContainer {
        constructor() {
            this.reset();
        }

        /**
         * 每回合开始前重置
         */
        reset() {
            this.current = null;
            this.index = -1;
            this.firstMover = null;  // 'A' or 'B'
            this.secondMover = null;
            
            // 各节点的效果队列
            this.nodeEffects = {};
            for (const node of Object.values(NODE)) {
                this.nodeEffects[node] = [];
            }
            
            // 各节点的临时数据
            this.nodeData = {};
            
            // 流程控制
            this.skipSecondMover = false;
            this.interrupted = false;
            
            // 回合历史
            this.history = [];
        }

        /**
         * 注册效果到指定节点
         * @param {string} node - 节点名
         * @param {Object} effect - 效果对象 { id, handler, priority, owner }
         */
        register(node, effect) {
            if (!this.nodeEffects[node]) {
                console.warn(`[TurnPhase] Unknown node: ${node}`);
                return;
            }
            this.nodeEffects[node].push({
                id: effect.id,
                handler: effect.handler,
                priority: effect.priority || 0,
                owner: effect.owner,
                source: effect.source
            });
            // 按优先级排序
            this.nodeEffects[node].sort((a, b) => b.priority - a.priority);
        }

        /**
         * 设置当前节点
         */
        setNode(node) {
            this.current = node;
            this.index = NODE_ORDER.indexOf(node);
            this.history.push({ node, timestamp: Date.now() });
            this.nodeData[node] = this.nodeData[node] || {};
        }

        /**
         * 进入下一节点
         */
        nextNode() {
            // 检查是否跳过后手方节点
            if (this.skipSecondMover && this.isSecondMoverNode(NODE_ORDER[this.index + 1])) {
                // 跳到战斗阶段结束
                this.jumpTo(NODE.BATTLE_PHASE_END);
                return this.current;
            }
            
            if (this.index < NODE_ORDER.length - 1) {
                this.index++;
                this.current = NODE_ORDER[this.index];
                this.history.push({ node: this.current, timestamp: Date.now() });
                return this.current;
            }
            return null;
        }

        /**
         * 跳转到指定节点
         */
        jumpTo(node) {
            const idx = NODE_ORDER.indexOf(node);
            if (idx !== -1) {
                this.index = idx;
                this.current = node;
                this.history.push({ node, timestamp: Date.now(), jumped: true });
            }
        }

        /**
         * 检查是否是后手方节点
         */
        isSecondMoverNode(node) {
            return node && node.startsWith('second_');
        }

        /**
         * 检查是否是先手方节点
         */
        isFirstMoverNode(node) {
            return node && node.startsWith('first_');
        }

        /**
         * 设置先后手
         * @param {string} first - 先手方 'A' or 'B'
         */
        setMoveOrder(first) {
            this.firstMover = first;
            this.secondMover = first === 'A' ? 'B' : 'A';
        }

        /**
         * 获取当前行动方
         */
        getCurrentMover() {
            if (this.isFirstMoverNode(this.current)) return this.firstMover;
            if (this.isSecondMoverNode(this.current)) return this.secondMover;
            return null;
        }

        /**
         * 执行当前节点的所有效果
         * @param {Object} stateA - A方状态
         * @param {Object} stateB - B方状态
         * @param {Object} context - 上下文
         */
        execute(stateA, stateB, context = {}) {
            const effects = this.nodeEffects[this.current] || [];
            const results = [];
            
            for (const effect of effects) {
                if (this.interrupted) break;
                
                try {
                    const result = effect.handler({
                        stateA,
                        stateB,
                        node: this.current,
                        firstMover: this.firstMover,
                        secondMover: this.secondMover,
                        currentMover: this.getCurrentMover(),
                        ...context
                    });
                    
                    if (result) {
                        results.push({ id: effect.id, result });
                        if (result.cancel) break;
                        if (result.skipSecondMover) this.skipSecondMover = true;
                    }
                } catch (err) {
                    console.error(`[TurnPhase:${this.current}] Effect error:`, err);
                }
            }
            
            return results;
        }

        /**
         * 获取/设置节点数据
         */
        getData(key) {
            return this.nodeData[this.current]?.[key];
        }

        setData(key, value) {
            if (!this.nodeData[this.current]) {
                this.nodeData[this.current] = {};
            }
            this.nodeData[this.current][key] = value;
        }

        /**
         * 中断流程
         */
        interrupt() {
            this.interrupted = true;
        }

        /**
         * 获取节点中文名
         */
        getNodeName(node = this.current) {
            return NODE_NAMES[node] || node;
        }

        /**
         * 检查当前节点
         */
        isNode(node) {
            return this.current === node;
        }

        /**
         * 检查是否已过某节点
         */
        isPast(node) {
            return NODE_ORDER.indexOf(node) < this.index;
        }

        /**
         * 检查是否在某节点之前
         */
        isBefore(node) {
            return NODE_ORDER.indexOf(node) > this.index;
        }
    }

    // =========================================================================
    // Export
    // =========================================================================
    window.TurnPhaseNode = NODE;
    window.TurnPhaseOrder = NODE_ORDER;
    window.TurnPhaseNames = NODE_NAMES;
    window.TurnPhaseContainer = TurnPhaseContainer;
    
    // 通用节点映射
    window.TurnPhaseGenericToFirst = GENERIC_TO_FIRST;
    window.TurnPhaseGenericToSecond = GENERIC_TO_SECOND;
    window.resolveNode = resolveNode;
    window.isGenericActionNode = isGenericActionNode;
    
    // 创建单例方便使用
    window.createTurnPhase = () => new TurnPhaseContainer();
})();
