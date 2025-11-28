/**
 * CTX System - 战斗上下文系统 v3.0
 * 
 * CTX 是所有系统调用的上下文对象
 * 它提供统一的接口来访问:
 * - self: 当前行动精灵
 * - opponent: 对手精灵
 * - selfTeam: 己方队伍
 * - opponentTeam: 对方队伍
 * - skill: 当前使用的技能
 * - 各种状态查询方法
 * 
 * SUBFUNCTIONS:
 * - CTX.CREATE(nodes, handler)     - 创建上下文
 * - CTX.UPDATE(nodes, handler)     - 更新上下文
 * - CTX.QUERY(nodes, handler)      - 查询状态
 * - CTX.LOG(nodes, handler)        - 记录日志
 */
(() => {
    // =========================================================================
    // 创建战斗上下文
    // =========================================================================
    function createBattleContext(teamA, teamB, currentTeamId) {
        const isTeamA = currentTeamId === 'A';
        const selfTeam = isTeamA ? teamA : teamB;
        const opponentTeam = isTeamA ? teamB : teamA;
        
        return {
            // ─────────────────────────────────────────────────────────────────
            // 队伍引用
            // ─────────────────────────────────────────────────────────────────
            teamA,
            teamB,
            selfTeam,
            opponentTeam,
            currentTeamId,
            
            // ─────────────────────────────────────────────────────────────────
            // 当前精灵快捷访问
            // ─────────────────────────────────────────────────────────────────
            get self() {
                return selfTeam.current();
            },
            
            get opponent() {
                return opponentTeam.current();
            },
            
            // ─────────────────────────────────────────────────────────────────
            // 技能相关
            // ─────────────────────────────────────────────────────────────────
            skill: null,
            skillIndex: -1,
            
            // ─────────────────────────────────────────────────────────────────
            // 伤害/治疗记录
            // ─────────────────────────────────────────────────────────────────
            lastDamage: 0,
            lastHeal: 0,
            wasCrit: false,
            damageType: null,  // 'attack', 'fixed', 'percent', 'true'
            
            // ─────────────────────────────────────────────────────────────────
            // 日志
            // ─────────────────────────────────────────────────────────────────
            logs: [],
            
            log(message) {
                this.logs.push({ turn: this.turnCount, message });
                console.log(`[Battle] ${message}`);
            },
            
            // ─────────────────────────────────────────────────────────────────
            // 回合计数
            // ─────────────────────────────────────────────────────────────────
            turnCount: 0,
            
            // ─────────────────────────────────────────────────────────────────
            // 状态查询方法
            // ─────────────────────────────────────────────────────────────────
            
            /**
             * 检查精灵是否有指定状态
             */
            hasStatus(spirit, statusId) {
                if (!spirit) return false;
                return spirit.statuses.some(s => s.id === statusId);
            },
            
            /**
             * 检查精灵是否有任何异常状态
             */
            hasAnyStatus(spirit) {
                if (!spirit) return false;
                return spirit.statuses.length > 0;
            },
            
            /**
             * 检查精灵是否有能力提升
             */
            hasStatUp(spirit) {
                if (!spirit) return false;
                return Object.values(spirit.stages).some(v => v > 0);
            },
            
            /**
             * 检查精灵是否有能力下降
             */
            hasStatDown(spirit) {
                if (!spirit) return false;
                return Object.values(spirit.stages).some(v => v < 0);
            },
            
            /**
             * 检查精灵是否有回合效果
             */
            hasTurnEffect(spirit, effectId) {
                if (!spirit) return false;
                if (effectId) {
                    return spirit.turnEffects.some(e => e.id === effectId);
                }
                return spirit.turnEffects.length > 0;
            },
            
            /**
             * 检查精灵是否有计数效果
             */
            hasCountEffect(spirit, effectId) {
                if (!spirit) return false;
                if (effectId) {
                    return spirit.countEffects.some(e => e.id === effectId);
                }
                return spirit.countEffects.length > 0;
            },
            
            /**
             * 获取计数效果的当前计数
             */
            getCount(spirit, effectId) {
                if (!spirit) return 0;
                const effect = spirit.countEffects.find(e => e.id === effectId);
                return effect ? effect.count : 0;
            },
            
            /**
             * 获取回合效果的剩余回合
             */
            getTurns(spirit, effectId) {
                if (!spirit) return 0;
                const effect = spirit.turnEffects.find(e => e.id === effectId);
                return effect ? effect.turns : 0;
            },
            
            /**
             * 检查队伍是否有指定精灵
             */
            teamHas(key) {
                return this.selfTeam.has(key);
            },
            
            /**
             * 检查是否首发
             */
            get isFirstDeploy() {
                return this.self?.isFirstDeploy ?? false;
            },
            
            /**
             * 获取体力百分比
             */
            hpPercent(spirit) {
                if (!spirit) return 0;
                return Math.floor((spirit.hp / spirit.maxHp) * 100);
            },
            
            /**
             * 获取 PP 百分比
             */
            ppPercent(spirit) {
                if (!spirit) return 0;
                return Math.floor((spirit.pp / spirit.maxPp) * 100);
            },
            
            // ─────────────────────────────────────────────────────────────────
            // 切换当前队伍视角
            // ─────────────────────────────────────────────────────────────────
            switchPerspective() {
                const newTeamId = this.currentTeamId === 'A' ? 'B' : 'A';
                this.currentTeamId = newTeamId;
                this.selfTeam = newTeamId === 'A' ? this.teamA : this.teamB;
                this.opponentTeam = newTeamId === 'A' ? this.teamB : this.teamA;
            },
            
            // ─────────────────────────────────────────────────────────────────
            // 设置当前技能
            // ─────────────────────────────────────────────────────────────────
            setSkill(skill, index) {
                this.skill = skill;
                this.skillIndex = index;
            },
            
            // ─────────────────────────────────────────────────────────────────
            // 重置回合状态
            // ─────────────────────────────────────────────────────────────────
            resetTurn() {
                this.lastDamage = 0;
                this.lastHeal = 0;
                this.wasCrit = false;
                this.damageType = null;
                this.skill = null;
                this.skillIndex = -1;
                
                // 重置双方当前精灵的回合标记
                if (this.teamA.current()) {
                    this.teamA.current().turnFlags = {
                        tookDamageThisTurn: false,
                        tookAttackDamageThisTurn: false,
                        usedSkillThisTurn: null,
                        lastDamageDealt: 0,
                        lastDamageReceived: 0,
                        lastHealAmount: 0,
                        wasCrit: false,
                        acted: false
                    };
                }
                if (this.teamB.current()) {
                    this.teamB.current().turnFlags = {
                        tookDamageThisTurn: false,
                        tookAttackDamageThisTurn: false,
                        usedSkillThisTurn: null,
                        lastDamageDealt: 0,
                        lastDamageReceived: 0,
                        lastHealAmount: 0,
                        wasCrit: false,
                        acted: false
                    };
                }
            }
        };
    }

    // =========================================================================
    // CTX 系统函数
    // =========================================================================
    const CTX = {
        _version: '3.0.0',
        
        // ─────────────────────────────────────────────────────────────────
        // CTX.CREATE - 创建上下文
        // ─────────────────────────────────────────────────────────────────
        CREATE(nodes, handler) {
            return {
                nodes: Array.isArray(nodes) ? nodes : [nodes],
                handler,
                execute(existingCtx) {
                    const { teamA, teamB, currentTeamId } = handler;
                    return createBattleContext(teamA, teamB, currentTeamId || 'A');
                }
            };
        },
        
        // ─────────────────────────────────────────────────────────────────
        // CTX.UPDATE - 更新上下文
        // ─────────────────────────────────────────────────────────────────
        UPDATE(nodes, handler) {
            return {
                nodes: Array.isArray(nodes) ? nodes : [nodes],
                handler,
                execute(ctx) {
                    const { property, value } = handler;
                    if (property && ctx) {
                        ctx[property] = value;
                    }
                    return ctx;
                }
            };
        },
        
        // ─────────────────────────────────────────────────────────────────
        // CTX.QUERY - 查询状态
        // ─────────────────────────────────────────────────────────────────
        QUERY(nodes, handler) {
            return {
                nodes: Array.isArray(nodes) ? nodes : [nodes],
                handler,
                execute(ctx) {
                    const { queryType, target, param } = handler;
                    
                    const spirit = target === 'self' ? ctx.self : 
                                   target === 'opponent' ? ctx.opponent :
                                   target;
                    
                    switch (queryType) {
                        case 'hasStatus':
                            return ctx.hasStatus(spirit, param);
                        case 'hasAnyStatus':
                            return ctx.hasAnyStatus(spirit);
                        case 'hasStatUp':
                            return ctx.hasStatUp(spirit);
                        case 'hasStatDown':
                            return ctx.hasStatDown(spirit);
                        case 'hasTurnEffect':
                            return ctx.hasTurnEffect(spirit, param);
                        case 'hasCountEffect':
                            return ctx.hasCountEffect(spirit, param);
                        case 'getCount':
                            return ctx.getCount(spirit, param);
                        case 'getTurns':
                            return ctx.getTurns(spirit, param);
                        case 'hpPercent':
                            return ctx.hpPercent(spirit);
                        case 'teamHas':
                            return ctx.teamHas(param);
                        default:
                            return null;
                    }
                }
            };
        },
        
        // ─────────────────────────────────────────────────────────────────
        // CTX.LOG - 记录日志
        // ─────────────────────────────────────────────────────────────────
        LOG(nodes, handler) {
            return {
                nodes: Array.isArray(nodes) ? nodes : [nodes],
                handler,
                execute(ctx) {
                    const { message, template, params } = handler;
                    
                    let finalMessage = message;
                    if (template && params) {
                        finalMessage = template.replace(/\{(\w+)\}/g, (_, key) => {
                            if (key === 'self') return ctx.self?.name || 'Unknown';
                            if (key === 'opponent') return ctx.opponent?.name || 'Unknown';
                            if (key === 'damage') return ctx.lastDamage;
                            if (key === 'heal') return ctx.lastHeal;
                            return params[key] ?? key;
                        });
                    }
                    
                    ctx.log(finalMessage);
                    return finalMessage;
                }
            };
        }
    };

    // =========================================================================
    // 导出
    // =========================================================================
    window.CTX = CTX;
    window.createBattleContext = createBattleContext;
    
    console.log('[CTX] System v3.0.0 loaded');
})();
