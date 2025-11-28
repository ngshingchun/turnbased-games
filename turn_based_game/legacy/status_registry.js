/**
 * StatusRegistry - 异常状态注册表
 * 集中管理所有异常状态定义，方便新增和随机选择
 * 
 * 使用方式:
 * - StatusRegistry.register(id, config) - 注册新状态
 * - StatusRegistry.random(count, filter) - 随机选择状态
 * - StatusRegistry.get(id) - 获取状态配置
 */
(() => {
    const StatusRegistry = {
        // 状态存储
        _statuses: new Map(),

        // 状态分类
        CATEGORIES: {
            DOT: 'dot',           // 持续伤害 (毒/灼/烧/出血)
            CONTROL: 'control',   // 控制 (睡/冻/惧/疲/石化/焚烬/感染)
            DEBUFF: 'debuff',     // 减益 (衰弱/诅咒/失明)
            RESTRICT: 'restrict', // 限制 (束缚/凝滞/沉默/封攻/封属)
            SPECIAL: 'special'    // 特殊 (寄生/易燃)
        },

        /**
         * 注册异常状态
         * @param {string} id - 状态ID
         * @param {Object} config - 状态配置
         */
        register(id, config) {
            const defaults = {
                id,
                name: config.name || id,
                category: config.category || this.CATEGORIES.DEBUFF,
                defaultTurns: config.defaultTurns || 2,
                stackable: config.stackable || false,
                maxStacks: config.maxStacks || 1,
                isControl: config.isControl || false,
                blockSwitch: config.blockSwitch || false,
                canReflect: config.canReflect !== false,  // 默认可反弹
                canImmune: config.canImmune !== false,    // 默认可免疫
                desc: config.desc || '',
                onApply: config.onApply || null,         // 施加时回调
                onTick: config.onTick || null,           // 每回合结算回调
                onRemove: config.onRemove || null,       // 移除时回调
                priority: config.priority || 0           // 结算优先级
            };
            this._statuses.set(id, { ...defaults, ...config });
            return this;
        },

        /**
         * 获取状态配置
         */
        get(id) {
            return this._statuses.get(id);
        },

        /**
         * 检查状态是否存在
         */
        has(id) {
            return this._statuses.has(id);
        },

        /**
         * 获取所有状态ID
         */
        getAllIds() {
            return Array.from(this._statuses.keys());
        },

        /**
         * 按分类获取状态
         */
        getByCategory(category) {
            return Array.from(this._statuses.values())
                .filter(s => s.category === category);
        },

        /**
         * 获取所有控制状态
         */
        getControlStatuses() {
            return Array.from(this._statuses.values())
                .filter(s => s.isControl);
        },

        /**
         * 获取所有禁止切换状态
         */
        getSwitchBlockStatuses() {
            return Array.from(this._statuses.values())
                .filter(s => s.blockSwitch);
        },

        /**
         * 随机选择状态
         * @param {number} count - 选择数量
         * @param {Object} filter - 过滤条件
         * @returns {Array} 选中的状态ID
         */
        random(count = 1, filter = {}) {
            let pool = Array.from(this._statuses.values());

            // 按分类过滤
            if (filter.category) {
                pool = pool.filter(s => s.category === filter.category);
            }

            // 按控制过滤
            if (filter.isControl !== undefined) {
                pool = pool.filter(s => s.isControl === filter.isControl);
            }

            // 排除指定状态
            if (filter.exclude && Array.isArray(filter.exclude)) {
                pool = pool.filter(s => !filter.exclude.includes(s.id));
            }

            // 只包含指定状态
            if (filter.include && Array.isArray(filter.include)) {
                pool = pool.filter(s => filter.include.includes(s.id));
            }

            // 随机选择
            const result = [];
            const shuffled = [...pool].sort(() => Math.random() - 0.5);
            for (let i = 0; i < Math.min(count, shuffled.length); i++) {
                result.push(shuffled[i].id);
            }

            return result;
        },

        /**
         * 随机选择并施加状态
         */
        applyRandom(game, target, count = 1, filter = {}, turns = 2) {
            const ids = this.random(count, filter);
            const results = [];

            for (const id of ids) {
                const config = this.get(id);
                if (config && window.StatusEffect) {
                    const success = window.StatusEffect.apply(
                        game, target, id, config.name, 
                        turns || config.defaultTurns, config.desc
                    );
                    results.push({ id, success });
                }
            }

            return results;
        },

        /**
         * 检查状态是否为控制状态
         */
        isControl(id) {
            const config = this.get(id);
            return config?.isControl || false;
        },

        /**
         * 检查状态是否禁止切换
         */
        isBlockSwitch(id) {
            const config = this.get(id);
            return config?.blockSwitch || false;
        },

        /**
         * 检查是否为异常状态（已注册的都是异常）
         */
        isAbnormal(id) {
            return this.has(id);
        },

        /**
         * 执行状态回合结算
         */
        tick(game, target, statusId) {
            const config = this.get(statusId);
            if (config?.onTick) {
                return config.onTick(game, target);
            }
            return null;
        }
    };

    // ==================== 注册所有状态 ====================

    // DOT 持续伤害
    StatusRegistry
        .register('poison', {
            name: '中毒',
            category: 'dot',
            desc: '每回合损失最大体力的1/8',
            onTick: (g, t) => {
                const dmg = Math.floor(t.maxHp / 8);
                t.hp = Math.max(0, t.hp - dmg);
                g.log(`${t.name} 因中毒损失了 ${dmg} 点体力！`);
                return { damage: dmg };
            }
        })
        .register('burn', {
            name: '灼伤',
            category: 'dot',
            desc: '每回合损失最大体力的1/8',
            onTick: (g, t) => {
                const dmg = Math.floor(t.maxHp / 8);
                t.hp = Math.max(0, t.hp - dmg);
                g.log(`${t.name} 因灼伤损失了 ${dmg} 点体力！`);
                return { damage: dmg };
            }
        })
        .register('frostbite', {
            name: '冻伤',
            category: 'dot',
            desc: '每回合损失最大体力的1/8',
            onTick: (g, t) => {
                const dmg = Math.floor(t.maxHp / 8);
                t.hp = Math.max(0, t.hp - dmg);
                g.log(`${t.name} 因冻伤损失了 ${dmg} 点体力！`);
                return { damage: dmg };
            }
        })
        .register('bleed', {
            name: '出血',
            category: 'dot',
            desc: '每回合损失最大体力的1/8',
            onTick: (g, t) => {
                const dmg = Math.floor(t.maxHp / 8);
                t.hp = Math.max(0, t.hp - dmg);
                g.log(`${t.name} 因出血损失了 ${dmg} 点体力！`);
                return { damage: dmg };
            }
        });

    // CONTROL 控制
    StatusRegistry
        .register('sleep', {
            name: '睡眠',
            category: 'control',
            isControl: true,
            desc: '无法行动'
        })
        .register('freeze', {
            name: '冰封',
            category: 'control',
            isControl: true,
            desc: '无法行动，受伤自动解除'
        })
        .register('paralyze', {
            name: '麻痹',
            category: 'control',
            isControl: true,
            desc: '50%无法行动'
        })
        .register('fear', {
            name: '害怕',
            category: 'control',
            isControl: true,
            desc: '无法行动'
        })
        .register('exhaust', {
            name: '疲惫',
            category: 'control',
            isControl: true,
            desc: '无法行动'
        })
        .register('petrify', {
            name: '石化',
            category: 'control',
            isControl: true,
            desc: '无法行动'
        })
        .register('immolate', {
            name: '焚烬',
            category: 'control',
            isControl: true,
            desc: '无法行动，每回合损失体力',
            onTick: (g, t) => {
                const dmg = Math.floor(t.maxHp / 6);
                t.hp = Math.max(0, t.hp - dmg);
                g.log(`${t.name} 因焚烬损失了 ${dmg} 点体力！`);
                return { damage: dmg };
            }
        })
        .register('infect', {
            name: '感染',
            category: 'control',
            isControl: true,
            desc: '无法行动，损失体力会传染'
        });

    // DEBUFF 减益
    StatusRegistry
        .register('weaken', {
            name: '衰弱',
            category: 'debuff',
            stackable: true,
            maxStacks: 5,
            desc: '造成伤害降低(每层20%)'
        })
        .register('blind', {
            name: '失明',
            category: 'debuff',
            desc: '攻击可能无效'
        })
        .register('confuse', {
            name: '混乱',
            category: 'debuff',
            desc: '可能攻击自己'
        })
        .register('curse', {
            name: '诅咒',
            category: 'debuff',
            isControl: true,
            desc: '无法行动'
        })
        .register('curse_fire', {
            name: '火之诅咒',
            category: 'debuff',
            desc: '火属性弱点'
        })
        .register('curse_fatal', {
            name: '致命诅咒',
            category: 'debuff',
            desc: '受到致命伤害增加'
        })
        .register('curse_weak', {
            name: '虚弱诅咒',
            category: 'debuff',
            desc: '能力下降'
        });

    // RESTRICT 限制
    StatusRegistry
        .register('bind', {
            name: '束缚',
            category: 'restrict',
            blockSwitch: true,
            desc: '无法切换'
        })
        .register('paralysis', {
            name: '瘫痪',
            category: 'restrict',
            blockSwitch: true,
            desc: '无法切换'
        })
        .register('stagnant', {
            name: '凝滞',
            category: 'restrict',
            blockSwitch: true,
            desc: '无法切换，免疫控制',
            // 凝滞特殊：免疫控制
            onApply: (g, t) => {
                g.log(`${t.name} 进入凝滞状态，免疫控制但无法切换！`);
            }
        })
        .register('silence', {
            name: '沉默',
            category: 'restrict',
            desc: '无法使用第五技能，每回合受伤',
            onTick: (g, t) => {
                const dmg = Math.floor(t.maxHp / 10);
                t.hp = Math.max(0, t.hp - dmg);
                g.log(`${t.name} 因沉默损失了 ${dmg} 点体力！`);
                return { damage: dmg };
            }
        })
        .register('block_attr', {
            name: '封属',
            category: 'restrict',
            desc: '无法使用属性技能'
        })
        .register('heal_block', {
            name: '禁疗',
            category: 'restrict',
            desc: '无法恢复体力'
        })
        .register('daze', {
            name: '眩晕',
            category: 'restrict',
            isControl: true,
            desc: '无法行动'
        });

    // SPECIAL 特殊
    StatusRegistry
        .register('parasite', {
            name: '寄生',
            category: 'special',
            desc: '每回合损失体力并治疗对方',
            onTick: (g, t) => {
                const dmg = Math.floor(t.maxHp / 8);
                t.hp = Math.max(0, t.hp - dmg);
                const opponent = t === g.player ? g.enemy : g.player;
                if (opponent) {
                    const heal = dmg;
                    opponent.hp = Math.min(opponent.maxHp, opponent.hp + heal);
                    g.log(`${t.name} 因寄生损失 ${dmg} 点体力，${opponent.name} 恢复 ${heal} 点体力！`);
                }
                return { damage: dmg };
            }
        })
        .register('flammable', {
            name: '易燃',
            category: 'special',
            desc: '受到火属性伤害增加'
        })
        .register('submit', {
            name: '屈服',
            category: 'special',
            isControl: true,
            desc: '无法行动'
        });

    window.StatusRegistry = StatusRegistry;
})();
