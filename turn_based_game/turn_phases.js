/**
 * TurnPhases - 回合阶段系统
 * 
 * 回合流程：
 * 1. OPEN_TURN      - 精灵登场（首次/切换）
 * 2. ENTRY          - 登场后立即触发（一次性效果）
 * 3. TURN_START     - 回合开始（每回合触发）
 * 4. CALCULATE_PRIORITY - 计算先制
 * 5. BEFORE_MOVE    - 技能使用前（检查封锁/控制）
 * 6. BEFORE_HIT     - 命中前（检查免疫攻击/闪避）
 * 7. CALCULATE_DAMAGE - 伤害计算（修改倍率）
 * 8. ON_HIT         - 命中中（护盾/吸收/伤害应用）
 * 9. AFTER_HIT      - 命中后（追加效果/X回合内XX）
 * 10. TURN_END      - 回合结束（DOT/回复/效果递减）
 * 11. DEATH_CHECK   - 死亡检测
 * 12. BATTLE_END    - 战斗结束判定
 * 
 * 特殊情况处理：
 * - SWITCH          - 切换精灵时
 * - USE_ITEM        - 使用道具时
 * - SKIP_TURN       - 跳过回合（控制状态）
 */
(() => {
    const PHASES = {
        // === 核心回合流程 ===
        OPEN_TURN: 'open_turn',                    // 精灵登场
        ENTRY: 'entry',                            // 登场后一次性效果
        TURN_START: 'turn_start',                  // 回合开始
        CALCULATE_PRIORITY: 'calculate_priority', // 计算先制顺序
        
        // === 技能执行流程 ===
        BEFORE_MOVE: 'before_move',                // 技能使用前（封锁检测）
        BEFORE_HIT: 'before_hit',                  // 命中前（免疫/闪避检测）
        CALCULATE_DAMAGE: 'calculate_damage',     // 伤害计算
        ON_HIT: 'on_hit',                          // 命中中（伤害应用）
        AFTER_HIT: 'after_hit',                    // 命中后（追加效果）
        
        // === 回合结束流程 ===
        TURN_END: 'turn_end',                      // 回合结束
        DEATH_CHECK: 'death_check',                // 死亡检测
        BATTLE_END: 'battle_end',                  // 战斗结束
        
        // === 特殊事件 ===
        SWITCH: 'switch',                          // 切换精灵
        USE_ITEM: 'use_item',                      // 使用道具
        SKIP_TURN: 'skip_turn',                    // 跳过回合
        
        // === 效果拦截点 ===
        BEFORE_STAT_CHANGE: 'before_stat_change',           // 属性变化前
        BEFORE_FIXED_DAMAGE: 'before_fixed_damage',         // 固定伤害前
        BEFORE_PERCENT_DAMAGE: 'before_percent_damage',     // 百分比伤害前
        BEFORE_HEAL: 'before_heal',                         // 治疗前
        BEFORE_STATUS_APPLY: 'before_status_apply',         // 异常施加前
        BEFORE_CLEAR_TURN_EFFECTS: 'before_clear_turn_effects', // 消除回合效果前
        BEFORE_ADD_TURN_EFFECT: 'before_add_turn_effect',   // 添加回合效果前
        AFTER_CLEAR_STATS: 'after_clear_stats',             // 属性清除后
        
        // === UI事件 ===
        GET_ICONS: 'get_icons'                     // 获取状态图标
    };

    /**
     * 回合流程顺序定义
     */
    const PHASE_ORDER = [
        PHASES.OPEN_TURN,
        PHASES.ENTRY,
        PHASES.TURN_START,
        PHASES.CALCULATE_PRIORITY,
        PHASES.BEFORE_MOVE,
        PHASES.BEFORE_HIT,
        PHASES.CALCULATE_DAMAGE,
        PHASES.ON_HIT,
        PHASES.AFTER_HIT,
        PHASES.TURN_END,
        PHASES.DEATH_CHECK,
        PHASES.BATTLE_END
    ];

    class PhaseEngine {
        constructor(game) {
            this.game = game;
            this.handlers = Object.keys(PHASES).reduce((acc, key) => {
                acc[PHASES[key]] = [];
                return acc;
            }, {});
            this.currentPhase = null;
            this.phaseStack = [];
            this.interrupted = false;
        }

        /**
         * 注册阶段处理器
         * @param {string} phase - 阶段ID
         * @param {Function} handler - 处理函数 (game, payload) => void | { cancel: boolean }
         * @param {number} priority - 优先级（越高越先执行）
         */
        on(phase, handler, priority = 0) {
            if (!this.handlers[phase]) {
                console.warn(`[PhaseEngine] Unknown phase: ${phase}`);
                return;
            }
            this.handlers[phase].push({ handler, priority });
            // 按优先级排序
            this.handlers[phase].sort((a, b) => b.priority - a.priority);
        }

        /**
         * 移除处理器
         */
        off(phase, handler) {
            if (!this.handlers[phase]) return;
            this.handlers[phase] = this.handlers[phase].filter(h => h.handler !== handler);
        }

        /**
         * 触发阶段（同步）
         * @returns {{ cancelled: boolean, results: Array }}
         */
        emit(phase, payload = {}) {
            const list = this.handlers[phase] || [];
            const results = [];
            let cancelled = false;

            this.currentPhase = phase;
            this.phaseStack.push(phase);

            for (const { handler } of list) {
                try {
                    const result = handler(this.game, payload);
                    results.push(result);
                    
                    // 检查是否取消后续处理
                    if (result?.cancel || result?.cancelled) {
                        cancelled = true;
                        break;
                    }
                } catch (err) {
                    console.error(`[PhaseEngine:${phase}] handler error`, err);
                }
            }

            this.phaseStack.pop();
            this.currentPhase = this.phaseStack[this.phaseStack.length - 1] || null;

            return { cancelled, results };
        }

        /**
         * 触发阶段（异步）
         */
        async emitAsync(phase, payload = {}) {
            const list = this.handlers[phase] || [];
            const results = [];
            let cancelled = false;

            this.currentPhase = phase;
            this.phaseStack.push(phase);

            for (const { handler } of list) {
                try {
                    const result = await handler(this.game, payload);
                    results.push(result);
                    
                    if (result?.cancel || result?.cancelled) {
                        cancelled = true;
                        break;
                    }
                } catch (err) {
                    console.error(`[PhaseEngine:${phase}] handler error`, err);
                }
            }

            this.phaseStack.pop();
            this.currentPhase = this.phaseStack[this.phaseStack.length - 1] || null;

            return { cancelled, results };
        }

        /**
         * 获取当前阶段
         */
        getCurrentPhase() {
            return this.currentPhase;
        }

        /**
         * 检查是否在特定阶段
         */
        isInPhase(phase) {
            return this.phaseStack.includes(phase);
        }

        /**
         * 中断当前回合流程
         */
        interrupt() {
            this.interrupted = true;
        }

        /**
         * 重置中断状态
         */
        resetInterrupt() {
            this.interrupted = false;
        }

        /**
         * 检查是否被中断
         */
        isInterrupted() {
            return this.interrupted;
        }

        /**
         * 执行完整回合流程
         * @param {Object} turnData - 回合数据
         */
        async executeTurn(turnData) {
            this.resetInterrupt();

            for (const phase of PHASE_ORDER) {
                if (this.interrupted) {
                    console.log(`[PhaseEngine] Turn interrupted at ${phase}`);
                    break;
                }

                const { cancelled } = await this.emitAsync(phase, turnData);
                
                // 死亡检测后如果有精灵死亡，可能需要中断
                if (phase === PHASES.DEATH_CHECK) {
                    if (turnData.playerDead || turnData.enemyDead) {
                        // 继续到 BATTLE_END
                    }
                }
            }
        }

        /**
         * 处理精灵切换
         */
        async handleSwitch(switchData) {
            // 先处理切换事件
            await this.emitAsync(PHASES.SWITCH, switchData);
            
            // 新精灵登场
            await this.emitAsync(PHASES.OPEN_TURN, {
                actor: switchData.newSpirit,
                isSwitch: true,
                ...switchData
            });
            
            await this.emitAsync(PHASES.ENTRY, {
                actor: switchData.newSpirit,
                isSwitch: true,
                ...switchData
            });
        }

        /**
         * 处理使用道具
         */
        async handleUseItem(itemData) {
            await this.emitAsync(PHASES.USE_ITEM, itemData);
        }

        /**
         * 处理跳过回合（控制状态）
         */
        async handleSkipTurn(skipData) {
            await this.emitAsync(PHASES.SKIP_TURN, skipData);
            // 直接跳到回合结束
            await this.emitAsync(PHASES.TURN_END, skipData);
            await this.emitAsync(PHASES.DEATH_CHECK, skipData);
        }
    }

    /**
     * 阶段上下文 - 用于在效果中访问当前阶段信息
     */
    const PhaseContext = {
        // 当前阶段的payload
        current: null,
        
        // 设置当前上下文
        set(payload) {
            this.current = payload;
        },
        
        // 获取当前上下文
        get() {
            return this.current;
        },
        
        // 清除
        clear() {
            this.current = null;
        }
    };

    window.TurnPhases = PHASES;
    window.PhaseEngine = PhaseEngine;
    window.PhaseContext = PhaseContext;
    window.PHASE_ORDER = PHASE_ORDER;
})();

