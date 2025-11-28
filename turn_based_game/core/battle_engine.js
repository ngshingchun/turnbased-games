/**
 * BattleEngine v2.1 - 战斗引擎
 * 
 * 支持队伍模式 (6v6)
 * 整合 TurnPhase, TeamState, GlobalState, PlayerInput
 * 执行完整的36节点战斗流程
 */
(() => {
    const NODE = window.TurnPhaseNode;

    class BattleEngine {
        constructor(config = {}) {
            // 创建容器
            this.turnPhase = window.createTurnPhase();
            this.teamA = null;  // 玩家队伍
            this.teamB = null;  // 对手队伍
            this.global = window.createGlobalState();
            this.input = window.createPlayerInput();
            
            // 配置
            this.config = {
                maxTurns: config.maxTurns || 999,
                logEnabled: config.logEnabled !== false,
                ...config
            };
            
            // 回调
            this.onLog = config.onLog || console.log;
            this.onUpdate = config.onUpdate || (() => {});
            this.onNodeExecute = config.onNodeExecute || null;
            
            // 战斗状态
            this.battleEnded = false;
            this.winner = null;
            
            // 当前技能上下文
            this.currentContext = {};
        }

        // =====================================================================
        // 便捷访问器
        // =====================================================================

        /** 当前A方精灵 */
        get stateA() { return this.teamA?.current; }
        
        /** 当前B方精灵 */
        get stateB() { return this.teamB?.current; }

        /** 获取队伍 */
        getTeam(side) { return side === 'A' ? this.teamA : this.teamB; }

        /** 获取当前精灵 */
        getState(side) { return side === 'A' ? this.stateA : this.stateB; }

        /** 获取对手精灵 */
        getOpponent(side) { return side === 'A' ? this.stateB : this.stateA; }

        // =====================================================================
        // 初始化
        // =====================================================================

        /**
         * 初始化队伍战斗
         */
        initTeams(teamASpirits, teamBSpirits) {
            this.teamA = window.createTeamState('A', teamASpirits);
            this.teamB = window.createTeamState('B', teamBSpirits);
            this.global.reset();
            this.turnPhase.reset();
            this.input.reset();
            this.battleEnded = false;
            this.winner = null;
            
            this.log(`战斗开始！${this.stateA.name} VS ${this.stateB.name}`);
            
            return this;
        }

        /**
         * 兼容旧版单精灵初始化
         */
        init(spiritA, spiritB) {
            return this.initTeams([spiritA], [spiritB]);
        }

        // =====================================================================
        // 节点执行 - 每个节点都可接受指令
        // =====================================================================

        /**
         * 执行单个节点
         * 每个节点可接受handler指令
         */
        async executeNode(node, handler = null) {
            this.turnPhase.setNode(node);
            
            // 构建执行上下文
            const ctx = this.buildContext();
            
            // 执行回调
            if (this.onNodeExecute) {
                await this.onNodeExecute(node, ctx);
            }
            
            // 执行自定义handler
            if (handler) {
                await handler(ctx);
            }
            
            // 执行注册的效果
            const results = this.turnPhase.execute(this.stateA, this.stateB, ctx);
            
            // 触发双方当前精灵的魂印
            await this.triggerSoulBuffs(node, ctx);
            
            // 触发队伍中所有精灵的被动效果
            await this.triggerTeamEffects(node, ctx);
            
            this.onUpdate();
            return results;
        }

        /**
         * 构建执行上下文
         */
        buildContext() {
            return {
                engine: this,
                global: this.global,
                input: this.input,
                teamA: this.teamA,
                teamB: this.teamB,
                stateA: this.stateA,
                stateB: this.stateB,
                currentNode: this.turnPhase.current,
                turnCount: this.global.turnCount,
                ...this.currentContext
            };
        }

        /**
         * 触发魂印
         */
        async triggerSoulBuffs(node, ctx) {
            if (this.stateA?.soulBuff?.active) {
                await this.stateA.soulBuff.run(node, {
                    ...ctx,
                    self: this.stateA,
                    opponent: this.stateB,
                    team: this.teamA,
                    opponentTeam: this.teamB
                });
            }
            if (this.stateB?.soulBuff?.active) {
                await this.stateB.soulBuff.run(node, {
                    ...ctx,
                    self: this.stateB,
                    opponent: this.stateA,
                    team: this.teamB,
                    opponentTeam: this.teamA
                });
            }
        }

        /**
         * 触发队伍效果（后备精灵）
         */
        async triggerTeamEffects(node, ctx) {
            // A队后备精灵
            for (let i = 0; i < this.teamA.spirits.length; i++) {
                if (i === this.teamA.currentIndex) continue;
                const spirit = this.teamA.spirits[i];
                if (spirit?.benchEffect) {
                    await spirit.benchEffect(node, { ...ctx, self: spirit });
                }
            }
            // B队后备精灵
            for (let i = 0; i < this.teamB.spirits.length; i++) {
                if (i === this.teamB.currentIndex) continue;
                const spirit = this.teamB.spirits[i];
                if (spirit?.benchEffect) {
                    await spirit.benchEffect(node, { ...ctx, self: spirit });
                }
            }
        }

        // =====================================================================
        // 登场流程 (Nodes 1-5)
        // =====================================================================

        /**
         * 执行登场流程
         */
        async executeEntry(handlers = {}) {
            // Node 1: 换人阶段
            await this.executeNode(NODE.SWITCH_IN_PHASE, handlers[NODE.SWITCH_IN_PHASE]);
            
            // Node 2: 登场速度判定
            await this.executeNode(NODE.ON_ENTRY_SPEED, handlers[NODE.ON_ENTRY_SPEED]);
            
            // Node 3: 登场后
            await this.executeNode(NODE.AFTER_ENTRY, handlers[NODE.AFTER_ENTRY]);
            
            // Node 4: 精灵行动阶段
            await this.executeNode(NODE.SPIRIT_ACTION_PHASE, handlers[NODE.SPIRIT_ACTION_PHASE]);
            
            // Node 5: 登场时
            await this.executeNode(NODE.ON_ENTRY, handlers[NODE.ON_ENTRY]);
        }

        // =====================================================================
        // 回合开始 (Node 6)
        // =====================================================================

        /**
         * 回合开始
         */
        async executeTurnStart(handler = null) {
            if (this.battleEnded) return;
            
            // 回合开始前重置
            this.turnPhase.reset();
            this.stateA?.resetTurnFlags?.();
            this.stateB?.resetTurnFlags?.();
            this.global.nextTurn();
            
            this.log(`\n===== 第 ${this.global.turnCount} 回合 =====`);

            // Node 6: 回合开始
            await this.executeNode(NODE.TURN_START, handler);
        }

        // =====================================================================
        // 战斗阶段开始 (Node 7)
        // =====================================================================

        /**
         * 战斗阶段开始 - 决定先后手
         */
        async executeBattlePhaseStart(handler = null) {
            // Node 7: 战斗阶段开始
            await this.executeNode(NODE.BATTLE_PHASE_START, handler);
            
            // 决定先后手
            const { first, second } = this.input.resolve(this.stateA, this.stateB);
            this.turnPhase.setMoveOrder(first);
            this.log(`先手方: ${first === 'A' ? this.stateA.name : this.stateB.name}`);
            
            return { first, second };
        }

        // =====================================================================
        // 先手方行动 (Nodes 8-16)
        // =====================================================================

        /**
         * 先手方行动流程
         */
        async executeFirstMoverActions(handlers = {}) {
            // Node 8: 先手行动开始
            await this.executeNode(NODE.FIRST_ACTION_START, handlers[NODE.FIRST_ACTION_START]);
            if (this.battleEnded) return;
            
            // Node 9: 先手命中前
            await this.executeNode(NODE.FIRST_BEFORE_HIT, handlers[NODE.FIRST_BEFORE_HIT]);
            if (this.battleEnded) return;
            
            // Node 10: 先手命中时
            await this.executeNode(NODE.FIRST_ON_HIT, handlers[NODE.FIRST_ON_HIT]);
            if (this.battleEnded) return;
            
            // Node 11: 先手技能效果
            await this.executeNode(NODE.FIRST_SKILL_EFFECT, handlers[NODE.FIRST_SKILL_EFFECT]);
            if (this.battleEnded) return;
            
            // Node 12: 先手伤害前
            await this.executeNode(NODE.FIRST_BEFORE_DAMAGE, handlers[NODE.FIRST_BEFORE_DAMAGE]);
            if (this.battleEnded) return;
            
            // Node 13: 先手造成伤害
            await this.executeNode(NODE.FIRST_DEAL_DAMAGE, handlers[NODE.FIRST_DEAL_DAMAGE]);
            if (this.battleEnded) return;
            
            // Node 14: 先手攻击后
            await this.executeNode(NODE.FIRST_AFTER_ATTACK, handlers[NODE.FIRST_AFTER_ATTACK]);
            if (this.battleEnded) return;
            
            // Node 15: 先手行动结束
            await this.executeNode(NODE.FIRST_ACTION_END, handlers[NODE.FIRST_ACTION_END]);
            if (this.battleEnded) return;
            
            // Node 16: 先手行动后
            await this.executeNode(NODE.FIRST_AFTER_ACTION, handlers[NODE.FIRST_AFTER_ACTION]);
        }

        // =====================================================================
        // 死亡判定1 (Node 17)
        // =====================================================================

        /**
         * 死亡判定1
         */
        async executeDeathCheck1(handler = null) {
            await this.executeNode(NODE.DEATH_CHECK_1, handler);
            return this.checkBattleEnd();
        }

        // =====================================================================
        // 后手方行动 (Nodes 18-26)
        // =====================================================================

        /**
         * 后手方行动流程
         */
        async executeSecondMoverActions(handlers = {}) {
            // Node 18: 后手行动开始
            await this.executeNode(NODE.SECOND_ACTION_START, handlers[NODE.SECOND_ACTION_START]);
            if (this.battleEnded) return;
            
            // Node 19: 后手命中前
            await this.executeNode(NODE.SECOND_BEFORE_HIT, handlers[NODE.SECOND_BEFORE_HIT]);
            if (this.battleEnded) return;
            
            // Node 20: 后手命中时
            await this.executeNode(NODE.SECOND_ON_HIT, handlers[NODE.SECOND_ON_HIT]);
            if (this.battleEnded) return;
            
            // Node 21: 后手技能效果
            await this.executeNode(NODE.SECOND_SKILL_EFFECT, handlers[NODE.SECOND_SKILL_EFFECT]);
            if (this.battleEnded) return;
            
            // Node 22: 后手伤害前
            await this.executeNode(NODE.SECOND_BEFORE_DAMAGE, handlers[NODE.SECOND_BEFORE_DAMAGE]);
            if (this.battleEnded) return;
            
            // Node 23: 后手造成伤害
            await this.executeNode(NODE.SECOND_DEAL_DAMAGE, handlers[NODE.SECOND_DEAL_DAMAGE]);
            if (this.battleEnded) return;
            
            // Node 24: 后手攻击后
            await this.executeNode(NODE.SECOND_AFTER_ATTACK, handlers[NODE.SECOND_AFTER_ATTACK]);
            if (this.battleEnded) return;
            
            // Node 25: 后手行动结束
            await this.executeNode(NODE.SECOND_ACTION_END, handlers[NODE.SECOND_ACTION_END]);
            if (this.battleEnded) return;
            
            // Node 26: 后手行动后
            await this.executeNode(NODE.SECOND_AFTER_ACTION, handlers[NODE.SECOND_AFTER_ACTION]);
        }

        // =====================================================================
        // 战斗阶段结束 (Nodes 27-30)
        // =====================================================================

        /**
         * 回合结束流程
         */
        async executeEndPhase(handlers = {}) {
            // Node 27: 战斗阶段结束
            await this.executeNode(NODE.BATTLE_PHASE_END, handlers[NODE.BATTLE_PHASE_END]);
            if (this.battleEnded) return;
            
            // Node 28: 战斗阶段后
            await this.executeNode(NODE.AFTER_BATTLE_PHASE, handlers[NODE.AFTER_BATTLE_PHASE]);
            if (this.battleEnded) return;
            
            // Node 29: 回合结束
            await this.executeNode(NODE.TURN_END, handlers[NODE.TURN_END]);
            if (this.battleEnded) return;
            
            // Node 30: 回合后
            await this.executeNode(NODE.AFTER_TURN, handlers[NODE.AFTER_TURN]);
            
            // 回合效果递减 (两个队伍所有精灵)
            this.tickTurnEffects();
            
            // 检查战斗结束
            this.checkBattleEnd();
        }

        /**
         * 递减回合效果
         */
        tickTurnEffects() {
            // A队所有精灵
            for (const spirit of this.teamA.spirits) {
                if (!spirit) continue;
                const expired = spirit.turnEffects?.tick?.() || [];
                expired.forEach(e => this.log(`${spirit.name} 的 ${e.name} 效果结束`));
                spirit.pp?.tickLock?.();
            }
            // B队所有精灵
            for (const spirit of this.teamB.spirits) {
                if (!spirit) continue;
                const expired = spirit.turnEffects?.tick?.() || [];
                expired.forEach(e => this.log(`${spirit.name} 的 ${e.name} 效果结束`));
                spirit.pp?.tickLock?.();
            }
        }

        // =====================================================================
        // 击败流程 (Nodes 31-36)
        // =====================================================================

        /**
         * 执行击败流程
         */
        async executeDefeatPhase(defeatedSide, handlers = {}) {
            // Node 31: 未被击败
            await this.executeNode(NODE.NOT_DEFEATED, handlers[NODE.NOT_DEFEATED]);
            
            // Node 32: 击败判定
            await this.executeNode(NODE.DEFEAT_CHECK, handlers[NODE.DEFEAT_CHECK]);
            
            // Node 33: 被击败后
            await this.executeNode(NODE.AFTER_DEFEATED, handlers[NODE.AFTER_DEFEATED]);
            
            // Node 34: 击败对手后
            await this.executeNode(NODE.AFTER_DEFEAT_FOE, handlers[NODE.AFTER_DEFEAT_FOE]);
            
            // Node 35: 死亡换人
            await this.executeNode(NODE.ON_DEATH_SWITCH, handlers[NODE.ON_DEATH_SWITCH]);
            
            // Node 36: 战斗结束判定
            await this.executeNode(NODE.BATTLE_END_CHECK, handlers[NODE.BATTLE_END_CHECK]);
        }

        // =====================================================================
        // 完整回合执行
        // =====================================================================

        /**
         * 执行完整回合 (Nodes 6-30)
         */
        async executeTurn(handlers = {}) {
            if (this.battleEnded) return { battleEnded: true };
            
            // Node 6: 回合开始
            await this.executeTurnStart(handlers[NODE.TURN_START]);
            
            // 等待双方输入
            if (!this.input.allReady()) {
                this.log('等待双方输入...');
                return { waitingInput: true };
            }
            
            // Node 7: 战斗阶段开始
            const { first, second } = await this.executeBattlePhaseStart(handlers[NODE.BATTLE_PHASE_START]);
            
            // Nodes 8-16: 先手方行动
            await this.executeFirstMoverActions(handlers);
            
            // Node 17: 死亡判定1
            if (await this.executeDeathCheck1(handlers[NODE.DEATH_CHECK_1])) {
                return { battleEnded: true, winner: this.winner };
            }
            
            // 如果先手方击败对手，跳过后手方
            if (this.turnPhase.skipSecondMover) {
                this.log('后手方无法行动');
            } else {
                // Nodes 18-26: 后手方行动
                await this.executeSecondMoverActions(handlers);
            }
            
            // Nodes 27-30: 回合结束流程
            await this.executeEndPhase(handlers);
            
            // 清除输入
            this.input.clear();
            
            return { completed: true, turn: this.global.turnCount };
        }

        // =====================================================================
        // 换人系统
        // =====================================================================

        /**
         * 换人
         */
        async switchSpirit(side, newIndex, handlers = {}) {
            const team = this.getTeam(side);
            const oldSpirit = team.current;
            
            if (!team.switchTo(newIndex)) {
                this.log(`换人失败: 无效的索引 ${newIndex}`);
                return false;
            }
            
            const newSpirit = team.current;
            this.log(`${side}方 ${oldSpirit?.name || '无'} 换下，${newSpirit.name} 登场！`);
            
            // 执行换人登场流程
            await this.executeEntry(handlers);
            
            return true;
        }

        /**
         * 强制换人（击败后）
         */
        async forceSwitch(side, newIndex, handlers = {}) {
            const team = this.getTeam(side);
            
            if (!team.switchTo(newIndex)) {
                // 无可用精灵，检查是否全灭
                const alive = team.spirits.filter(s => s && !s.isDead());
                if (alive.length === 0) {
                    this.battleEnded = true;
                    this.winner = side === 'A' ? 'B' : 'A';
                    this.log(`${side}方全灭！${this.winner}方获胜！`);
                    return false;
                }
                return false;
            }
            
            // 执行死亡换人登场
            await this.executeNode(NODE.ON_DEATH_SWITCH, handlers[NODE.ON_DEATH_SWITCH]);
            
            return true;
        }

        // =====================================================================
        // 战斗结束检测
        // =====================================================================

        /**
         * 检查战斗是否结束
         */
        checkBattleEnd() {
            const aAlive = this.teamA?.spirits.some(s => s && !s.isDead());
            const bAlive = this.teamB?.spirits.some(s => s && !s.isDead());
            
            if (!aAlive && !bAlive) {
                // 双方全灭，后手方获胜
                const second = this.turnPhase.secondMover;
                this.winner = second || 'B';
                this.battleEnded = true;
                this.log('双方同时全灭！后手方获胜！');
            } else if (!aAlive) {
                this.winner = 'B';
                this.battleEnded = true;
                this.turnPhase.skipSecondMover = true;
                this.log(`A方全灭！B方获胜！`);
            } else if (!bAlive) {
                this.winner = 'A';
                this.battleEnded = true;
                this.turnPhase.skipSecondMover = true;
                this.log(`B方全灭！A方获胜！`);
            } else if (this.global.turnCount >= this.config.maxTurns) {
                this.battleEnded = true;
                this.log('回合数达到上限！');
            }
            
            return this.battleEnded;
        }

        /**
         * 检查当前精灵是否死亡，需要换人
         */
        checkCurrentSpiritDeath() {
            const results = { A: false, B: false };
            
            if (this.stateA?.isDead?.()) {
                results.A = true;
            }
            if (this.stateB?.isDead?.()) {
                results.B = true;
            }
            
            return results;
        }

        // =====================================================================
        // 便捷方法
        // =====================================================================

        /**
         * 获取当前行动方状态
         */
        getCurrentMoverState() {
            const mover = this.turnPhase.getCurrentMover();
            return mover === 'A' ? this.stateA : this.stateB;
        }

        /**
         * 获取当前防守方状态
         */
        getCurrentDefenderState() {
            const mover = this.turnPhase.getCurrentMover();
            return mover === 'A' ? this.stateB : this.stateA;
        }

        /**
         * 设置当前技能上下文
         */
        setSkillContext(context) {
            this.currentContext = { ...this.currentContext, ...context };
        }

        /**
         * 清除技能上下文
         */
        clearSkillContext() {
            this.currentContext = {};
        }

        /**
         * 日志输出
         */
        log(message) {
            if (!this.config.logEnabled) return;
            this.global.log(message);
            this.onLog(message);
        }

        /**
         * 获取状态摘要
         */
        getSummary() {
            return {
                turn: this.global.turnCount,
                phase: this.turnPhase.current,
                phaseName: this.turnPhase.getNodeName(),
                firstMover: this.turnPhase.firstMover,
                teamA: {
                    currentIndex: this.teamA?.currentIndex,
                    spirits: this.teamA?.spirits.map(s => s ? {
                        name: s.name,
                        hp: s.hp.current,
                        maxHp: s.hp.max,
                        pp: s.pp.current,
                        maxPp: s.pp.max,
                        isDead: s.isDead()
                    } : null)
                },
                teamB: {
                    currentIndex: this.teamB?.currentIndex,
                    spirits: this.teamB?.spirits.map(s => s ? {
                        name: s.name,
                        hp: s.hp.current,
                        maxHp: s.hp.max,
                        pp: s.pp.current,
                        maxPp: s.pp.max,
                        isDead: s.isDead()
                    } : null)
                },
                battleEnded: this.battleEnded,
                winner: this.winner
            };
        }

        /**
         * 获取全部36个节点的列表
         */
        static getAllNodes() {
            return Object.values(NODE);
        }
    }

    window.BattleEngine = BattleEngine;
    window.createBattleEngine = (config) => new BattleEngine(config);
})();
