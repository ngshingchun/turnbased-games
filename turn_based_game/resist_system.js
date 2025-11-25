/**
 * ResistSystem - 抗性系统
 * 处理精灵的天生抗性：
 * 1. 伤害减免：固定伤害、百分比伤害减免比例
 * 2. 异常免疫：各异常状态的概率免疫
 * 
 * 抗性数据存储在各精灵文件的 resist 字段中
 */
(() => {
    const ResistSystem = {
        // 默认抗性配置
        DEFAULT_RESIST: {
            // 伤害减免 (0-1, 1=完全免疫)
            fixed: 0.35,      // 固定伤害减免 35%
            percent: 0.35,    // 百分比伤害减免 35%
            trueDmg: 0,       // 真实伤害减免 0%
            
            // 异常状态概率免疫 (0-1)
            statusImmune: {
                poison: 0,
                frostbite: 0,
                burn: 0,
                immolate: 0,
                bleed: 0,
                paralyze: 0,
                exhaust: 0,
                fear: 0,
                sleep: 0,
                petrify: 0,
                confuse: 0,
                weaken: 0,
                parasite: 0,
                infect: 0,
                bind: 0,
                daze: 0,
                freeze: 0,
                paralysis: 0,
                blind: 0,
                flammable: 0,
                curse: 0,
                silence: 0,
                submit: 0,
                stagnant: 0
            }
        },

        // 特殊精灵抗性预设
        PRESETS: {
            // 星皇完全免疫百分比伤害
            starSovereign: {
                fixed: 0.35,
                percent: 1,      // 完全免疫
                trueDmg: 0,
                statusImmune: {}
            },
            
            // 怒涛沧岚对焚烬高抗性
            surgingCanglan: {
                fixed: 0.35,
                percent: 0.35,
                trueDmg: 0,
                statusImmune: {
                    immolate: 0.7  // 70%概率免疫焚烬
                }
            }
        },

        /**
         * 获取精灵的抗性配置
         */
        getResist(char) {
            if (!char) return this.DEFAULT_RESIST;
            
            // 优先使用精灵自身配置
            if (char.resist) {
                return this.mergeResist(this.DEFAULT_RESIST, char.resist);
            }
            
            // 检查预设
            if (char.meta?.isStar || char.isStar) {
                return this.mergeResist(this.DEFAULT_RESIST, this.PRESETS.starSovereign);
            }
            
            return this.DEFAULT_RESIST;
        },

        /**
         * 标准化抗性值（支持0-100或0-1格式）
         * 返回 undefined 如果值为 0 或未定义（使用默认值）
         * 使用 -1 或 null 明确表示"无抗性"
         */
        normalizeValue(val) {
            if (val === undefined || val === null) return undefined;
            // 值为0时返回undefined以使用默认值
            // 精灵想要0抗性应使用-1或明确在PRESETS中设置
            if (val === 0) return undefined;
            // 如果值>1，视为百分比格式(0-100)，转换为0-1
            return val > 1 ? val / 100 : val;
        },

        /**
         * 合并抗性配置
         * 精灵文件中的 resist: { fixed: 0, percent: 0 } 将使用默认值
         * 使用 fixed: 100, percent: 100 表示完全免疫
         */
        mergeResist(base, override) {
            // 处理旧格式的 statusImmune（如 immolateResist: 70）
            const statusOverride = override.statusImmune || {};
            
            // 检查旧格式的单独状态抗性字段
            if (override.immolateResist !== undefined && override.immolateResist !== 0) {
                statusOverride.immolate = this.normalizeValue(override.immolateResist);
            }
            if (override.poisonResist !== undefined && override.poisonResist !== 0) {
                statusOverride.poison = this.normalizeValue(override.poisonResist);
            }
            if (override.burnResist !== undefined && override.burnResist !== 0) {
                statusOverride.burn = this.normalizeValue(override.burnResist);
            }
            if (override.freezeResist !== undefined && override.freezeResist !== 0) {
                statusOverride.freeze = this.normalizeValue(override.freezeResist);
            }
            
            const result = {
                fixed: this.normalizeValue(override.fixed) ?? base.fixed,
                percent: this.normalizeValue(override.percent) ?? base.percent,
                trueDmg: this.normalizeValue(override.trueDmg) ?? base.trueDmg,
                statusImmune: { ...base.statusImmune, ...statusOverride }
            };
            return result;
        },

        /**
         * 计算伤害减免后的伤害
         * @param {string} damageType - 'fixed', 'percent', 'true'
         * @param {number} amount - 原始伤害
         * @param {Object} char - 目标角色
         * @returns {{ finalDamage: number, reduced: number, immune: boolean }}
         */
        applyDamageResist(damageType, amount, char) {
            const resist = this.getResist(char);
            let reduction = 0;
            
            switch (damageType) {
                case 'fixed':
                    reduction = resist.fixed || 0;
                    break;
                case 'percent':
                    reduction = resist.percent || 0;
                    break;
                case 'true':
                    reduction = resist.trueDmg || 0;
                    break;
            }
            
            // 完全免疫
            if (reduction >= 1) {
                return { finalDamage: 0, reduced: amount, immune: true };
            }
            
            const reduced = Math.floor(amount * reduction);
            const finalDamage = Math.max(0, amount - reduced);
            
            return { finalDamage, reduced, immune: false };
        },

        /**
         * 检查异常状态是否被抗性免疫
         * @param {string} statusId - 状态ID
         * @param {Object} char - 目标角色
         * @returns {boolean} 是否免疫
         */
        checkStatusImmune(statusId, char) {
            const resist = this.getResist(char);
            const immuneChance = resist.statusImmune?.[statusId] || 0;
            
            if (immuneChance <= 0) return false;
            if (immuneChance >= 1) return true;
            
            return Math.random() < immuneChance;
        },

        /**
         * 设置精灵抗性
         */
        setResist(char, resistConfig) {
            char.resist = this.mergeResist(this.DEFAULT_RESIST, resistConfig);
        },

        /**
         * 设置单项伤害抗性
         */
        setDamageResist(char, type, value) {
            if (!char.resist) {
                char.resist = { ...this.DEFAULT_RESIST };
            }
            char.resist[type] = Math.max(0, Math.min(1, value));
        },

        /**
         * 设置单项状态抗性
         */
        setStatusResist(char, statusId, value) {
            if (!char.resist) {
                char.resist = { ...this.DEFAULT_RESIST };
            }
            if (!char.resist.statusImmune) {
                char.resist.statusImmune = {};
            }
            char.resist.statusImmune[statusId] = Math.max(0, Math.min(1, value));
        }
    };

    window.ResistSystem = ResistSystem;
})();
