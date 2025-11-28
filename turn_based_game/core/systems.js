/**
 * Systems v2.1 - 系统整合与工具
 * 
 * 整合所有 FUNC.SUBFUNC(node(s)) 系统，提供:
 * 1. 统一访问接口
 * 2. 效果队列
 * 3. 技能/精灵构建器
 * 4. 组合工具函数
 */
(() => {
    const NODE = window.TurnPhaseNode;

    // =========================================================================
    // 系统引用 (在各系统文件加载后可用)
    // =========================================================================
    
    /**
     * 获取所有系统的引用
     */
    function getSystems() {
        return {
            TURN: window.TURN,
            COUNT: window.COUNT,
            DAMAGE: window.DAMAGE,
            HP: window.HP,
            PP: window.PP,
            STATS: window.STATS,
            STATUS: window.STATUS,
            PRIO: window.PRIO,
            SOULBUFF: window.SOULBUFF
        };
    }

    // =========================================================================
    // 效果队列 - 按节点组织效果
    // =========================================================================

    class EffectQueue {
        constructor() {
            this.effects = new Map(); // node -> effect[]
        }

        /**
         * 添加效果到指定节点
         */
        add(nodes, effect) {
            const nodeList = Array.isArray(nodes) ? nodes : [nodes];
            for (const node of nodeList) {
                if (!this.effects.has(node)) {
                    this.effects.set(node, []);
                }
                this.effects.get(node).push(effect);
            }
            return this;
        }

        /**
         * 获取节点的所有效果
         */
        get(node) {
            return this.effects.get(node) || [];
        }

        /**
         * 执行节点的所有效果
         */
        async execute(node, ctx) {
            const nodeEffects = this.get(node);
            const results = [];
            
            for (const effect of nodeEffects) {
                if (typeof effect.execute === 'function') {
                    const result = await effect.execute(ctx);
                    results.push(result);
                } else if (typeof effect === 'function') {
                    const result = await effect(ctx);
                    results.push(result);
                }
            }
            
            return results;
        }

        /**
         * 清空所有效果
         */
        clear() {
            this.effects.clear();
        }

        /**
         * 移除特定效果
         */
        remove(effectId) {
            for (const [node, effects] of this.effects) {
                this.effects.set(node, effects.filter(e => e.id !== effectId));
            }
        }

        /**
         * 获取所有节点
         */
        getAllNodes() {
            return Array.from(this.effects.keys());
        }
    }

    // =========================================================================
    // 技能构建器 - 简化技能定义
    // =========================================================================

    class SkillBuilder {
        constructor(name) {
            this.skill = {
                name,
                ppCost: 0,
                power: 0,
                accuracy: 100,
                priority: 0,
                special: false,
                type: 'normal',
                effects: new EffectQueue()
            };
        }

        pp(cost) {
            this.skill.ppCost = cost;
            return this;
        }

        power(value) {
            this.skill.power = value;
            return this;
        }

        accuracy(value) {
            this.skill.accuracy = value;
            return this;
        }

        priority(value) {
            this.skill.priority = value;
            return this;
        }

        special() {
            this.skill.special = true;
            return this;
        }

        physical() {
            this.skill.special = false;
            return this;
        }

        type(typeName) {
            this.skill.type = typeName;
            return this;
        }

        /**
         * 在指定节点添加效果
         * 使用新的 FUNC.SUBFUNC(nodes, handler) 模式
         */
        onNode(nodes, effect) {
            this.skill.effects.add(nodes, effect);
            return this;
        }

        /**
         * 添加伤害效果 - 使用 DAMAGE 系统
         */
        damage(options = {}) {
            const nodes = options.nodes || [NODE.FIRST_DEAL_DAMAGE, NODE.SECOND_DEAL_DAMAGE];
            const DAMAGE = window.DAMAGE;
            if (DAMAGE) {
                const effect = DAMAGE.ATTACK(nodes, {
                    power: options.power || this.skill.power,
                    special: options.special !== undefined ? options.special : this.skill.special,
                    ...options
                });
                this.skill.effects.add(nodes, effect);
            }
            return this;
        }

        /**
         * 添加状态效果 - 使用 STATUS 系统
         */
        status(statusId, turns, options = {}) {
            const nodes = options.nodes || [NODE.FIRST_SKILL_EFFECT, NODE.SECOND_SKILL_EFFECT];
            const STATUS = window.STATUS;
            if (STATUS) {
                const effect = STATUS.APPLY(nodes, { statusId, turns, ...options });
                this.skill.effects.add(nodes, effect);
            }
            return this;
        }

        /**
         * 添加属性变化 - 使用 STATS 系统
         */
        stats(changes, options = {}) {
            const nodes = options.nodes || [NODE.FIRST_SKILL_EFFECT, NODE.SECOND_SKILL_EFFECT];
            const STATS = window.STATS;
            if (STATS) {
                const effect = STATS.MODIFY(nodes, { changes, ...options });
                this.skill.effects.add(nodes, effect);
            }
            return this;
        }

        /**
         * 添加回合效果 - 使用 TURN 系统
         */
        turnEffect(id, turns, handler, options = {}) {
            const nodes = options.nodes || [NODE.FIRST_SKILL_EFFECT, NODE.SECOND_SKILL_EFFECT];
            const TURN = window.TURN;
            if (TURN) {
                const effect = TURN.ADD(nodes, { id, turns, handler, ...options });
                this.skill.effects.add(nodes, effect);
            }
            return this;
        }

        /**
         * 添加计数效果 - 使用 COUNT 系统
         */
        countEffect(key, amount, options = {}) {
            const nodes = options.nodes || [NODE.FIRST_SKILL_EFFECT, NODE.SECOND_SKILL_EFFECT];
            const COUNT = window.COUNT;
            if (COUNT) {
                const effect = COUNT.ADD(nodes, { key, amount, ...options });
                this.skill.effects.add(nodes, effect);
            }
            return this;
        }

        /**
         * 添加治疗效果 - 使用 HP 系统
         */
        heal(amount, options = {}) {
            const nodes = options.nodes || [NODE.FIRST_SKILL_EFFECT, NODE.SECOND_SKILL_EFFECT];
            const HP = window.HP;
            if (HP) {
                const effect = HP.HEAL(nodes, { amount, ...options });
                this.skill.effects.add(nodes, effect);
            }
            return this;
        }

        /**
         * 添加百分比治疗 - 使用 HP 系统
         */
        healPercent(percent, options = {}) {
            const nodes = options.nodes || [NODE.FIRST_SKILL_EFFECT, NODE.SECOND_SKILL_EFFECT];
            const HP = window.HP;
            if (HP) {
                const effect = HP.HEAL_PERCENT(nodes, { percent, ...options });
                this.skill.effects.add(nodes, effect);
            }
            return this;
        }

        /**
         * 添加优先级效果 - 使用 PRIO 系统
         */
        prio(amount, options = {}) {
            const nodes = options.nodes || [NODE.BATTLE_PHASE_START];
            const PRIO = window.PRIO;
            if (PRIO) {
                const effect = PRIO.ADD(nodes, { amount, ...options });
                this.skill.effects.add(nodes, effect);
            }
            return this;
        }

        /**
         * 构建技能对象
         */
        build() {
            return this.skill;
        }
    }

    // =========================================================================
    // 精灵构建器 - 简化精灵定义
    // =========================================================================

    class SpiritBuilder {
        constructor(name) {
            this.spirit = {
                name,
                type: 'normal',
                baseStats: {
                    hp: 100,
                    atk: 100,
                    def: 100,
                    spa: 100,
                    spd: 100,
                    spe: 100
                },
                skills: [],
                soulBuff: null,
                passives: []
            };
        }

        type(typeName) {
            this.spirit.type = typeName;
            return this;
        }

        stats(hp, atk, def, spa, spd, spe) {
            this.spirit.baseStats = { hp, atk, def, spa, spd, spe };
            return this;
        }

        skill(skillOrBuilder) {
            const skill = skillOrBuilder instanceof SkillBuilder 
                ? skillOrBuilder.build() 
                : skillOrBuilder;
            this.spirit.skills.push(skill);
            return this;
        }

        soulBuff(config) {
            this.spirit.soulBuff = config;
            return this;
        }

        passive(name, node, handler) {
            this.spirit.passives.push({ name, node, handler });
            return this;
        }

        build() {
            return this.spirit;
        }
    }

    // =========================================================================
    // 工具函数
    // =========================================================================

    /**
     * 创建技能
     */
    function skill(name) {
        return new SkillBuilder(name);
    }

    /**
     * 创建精灵
     */
    function spirit(name) {
        return new SpiritBuilder(name);
    }

    /**
     * 创建效果队列
     */
    function effectQueue() {
        return new EffectQueue();
    }

    /**
     * 组合多个效果
     */
    function combine(...effects) {
        return {
            nodes: effects.flatMap(e => e.nodes || []),
            execute: async (ctx) => {
                const results = [];
                for (const effect of effects) {
                    if (effect.execute) {
                        results.push(await effect.execute(ctx));
                    }
                }
                return results;
            }
        };
    }

    /**
     * 条件执行效果
     */
    function when(condition, effect) {
        return {
            nodes: effect.nodes,
            execute: async (ctx) => {
                if (typeof condition === 'function' ? condition(ctx) : condition) {
                    return effect.execute(ctx);
                }
                return null;
            }
        };
    }

    /**
     * 随机执行效果
     */
    function chance(percent, effect) {
        return when(() => Math.random() * 100 < percent, effect);
    }

    /**
     * 对目标执行效果
     */
    function onTarget(target, effect) {
        return {
            nodes: effect.nodes,
            execute: async (ctx) => {
                const newCtx = { ...ctx, target };
                return effect.execute(newCtx);
            }
        };
    }

    /**
     * 对自己执行效果
     */
    function onSelf(effect) {
        return {
            nodes: effect.nodes,
            execute: async (ctx) => {
                const newCtx = { ...ctx, target: ctx.self };
                return effect.execute(newCtx);
            }
        };
    }

    /**
     * 对对手执行效果
     */
    function onOpponent(effect) {
        return {
            nodes: effect.nodes,
            execute: async (ctx) => {
                const newCtx = { ...ctx, target: ctx.opponent };
                return effect.execute(newCtx);
            }
        };
    }

    /**
     * 序列执行效果
     */
    function sequence(...effects) {
        return {
            nodes: effects.flatMap(e => e.nodes || []),
            execute: async (ctx) => {
                const results = [];
                for (const effect of effects) {
                    const result = await effect.execute(ctx);
                    results.push(result);
                    // 如果某个效果失败，停止序列
                    if (result && result.failed) break;
                }
                return results;
            }
        };
    }

    /**
     * 并行执行效果
     */
    function parallel(...effects) {
        return {
            nodes: effects.flatMap(e => e.nodes || []),
            execute: async (ctx) => {
                return Promise.all(effects.map(e => e.execute(ctx)));
            }
        };
    }

    /**
     * 重复执行效果
     */
    function repeat(times, effect) {
        return {
            nodes: effect.nodes,
            execute: async (ctx) => {
                const results = [];
                for (let i = 0; i < times; i++) {
                    results.push(await effect.execute({ ...ctx, repeatIndex: i }));
                }
                return results;
            }
        };
    }

    // =========================================================================
    // 导出
    // =========================================================================

    window.getSystems = getSystems;
    window.EffectQueue = EffectQueue;
    window.SkillBuilder = SkillBuilder;
    window.SpiritBuilder = SpiritBuilder;
    window.skill = skill;
    window.spirit = spirit;
    window.effectQueue = effectQueue;
    window.combine = combine;
    window.when = when;
    window.chance = chance;
    window.onTarget = onTarget;
    window.onSelf = onSelf;
    window.onOpponent = onOpponent;
    window.sequence = sequence;
    window.parallel = parallel;
    window.repeat = repeat;

    // 便捷访问 (延迟获取，确保系统已加载)
    window.Systems = {
        get TURN() { return window.TURN; },
        get COUNT() { return window.COUNT; },
        get DAMAGE() { return window.DAMAGE; },
        get HP() { return window.HP; },
        get PP() { return window.PP; },
        get STATS() { return window.STATS; },
        get STATUS() { return window.STATUS; },
        get PRIO() { return window.PRIO; },
        get SOULBUFF() { return window.SOULBUFF; }
    };
})();
