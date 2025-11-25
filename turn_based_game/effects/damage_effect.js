/**
 * DamageEffect - 伤害效果模块
 * 处理所有伤害类型：攻击伤害、固定伤害、百分比伤害、真实伤害
 * 路由到 DamageSystem 进行最终结算
 */
(() => {
    const DamageEffect = {
        /**
         * 造成固定伤害
         */
        fixed(game, target, amount, label = "固定伤害", options = {}) {
            return game.damageSystem.apply({
                type: 'fixed',
                source: options.source || null,
                target,
                amount,
                label,
                options
            });
        },

        /**
         * 造成百分比伤害（基于最大生命）
         */
        percent(game, target, ratio, label = "百分比伤害", options = {}) {
            const amount = Math.floor(target.maxHp * ratio);
            return game.damageSystem.apply({
                type: 'percent',
                source: options.source || null,
                target,
                amount,
                label,
                options
            });
        },

        /**
         * 造成百分比伤害（基于当前生命）
         */
        percentCurrent(game, target, ratio, label = "百分比伤害", options = {}) {
            const amount = Math.floor(target.hp * ratio);
            return game.damageSystem.apply({
                type: 'percent',
                source: options.source || null,
                target,
                amount,
                label,
                options
            });
        },

        /**
         * 造成真实伤害（无视抗性）
         */
        trueDamage(game, target, amount, label = "真实伤害", options = {}) {
            return game.damageSystem.apply({
                type: 'true',
                source: options.source || null,
                target,
                amount,
                label,
                options
            });
        },

        /**
         * 吸取伤害（造成伤害并恢复）
         */
        drain(game, source, target, amount, label = "吸取", options = {}) {
            const dealt = this.fixed(game, target, amount, label, { ...options, source });
            if (dealt > 0) {
                window.HealEffect?.heal(game, source, dealt, "吸取");
            }
            return dealt;
        },

        /**
         * 吸取百分比生命
         */
        drainPercent(game, source, target, ratio, label = "吸取", options = {}) {
            const amount = Math.floor(target.maxHp * ratio);
            return this.drain(game, source, target, amount, label, options);
        },

        /**
         * 反弹伤害
         */
        reflect(game, source, target, amount, multiplier = 100, label = "反弹伤害") {
            const reflectAmount = Math.floor(amount * multiplier / 100);
            return this.trueDamage(game, target, reflectAmount, label, { source });
        },

        /**
         * 检查臣服状态（无法造成伤害）
         */
        checkSubmit(game, attacker) {
            if (attacker.buffs.turnEffects.some(e => e.id === 'submit')) {
                game.log(`${attacker.name} 处于臣服状态，无法造成任何伤害！`);
                game.showFloatingText('臣服', attacker === game.player, '#f88');
                return true;
            }
            return false;
        },

        /**
         * 状态伤害（毒、烧伤等回合结束伤害）
         */
        statusDamage(game, target, statusId, options = {}) {
            const damageMap = {
                'poison': () => Math.floor(target.maxHp / 8),
                'frostbite': () => Math.floor(target.maxHp / 8),
                'burn': () => Math.floor(target.maxHp / 8),
                'immolate': () => Math.floor(target.maxHp / 8),
                'silence': () => Math.floor(target.maxHp / 8),
                'curse_fire': () => Math.floor(target.maxHp / 8),
                'bleed': () => 80,
                'parasite': () => Math.floor(target.maxHp / 8),
                'confuse': () => Math.random() < 0.05 ? 50 : 0
            };

            const calcDamage = damageMap[statusId];
            if (!calcDamage) return 0;

            const amount = calcDamage();
            if (amount <= 0) return 0;

            const labelMap = {
                'poison': '毒伤害',
                'frostbite': '冻伤伤害',
                'burn': '烧伤伤害',
                'immolate': '焚烬伤害',
                'silence': '沉默伤害',
                'curse_fire': '烈焰诅咒伤害',
                'bleed': '流血伤害',
                'parasite': '寄生伤害',
                'confuse': '混乱自伤'
            };

            return game.damageSystem.apply({
                type: statusId === 'bleed' || statusId === 'confuse' ? 'fixed' : 'percent',
                target,
                amount,
                label: `${target.name} 受到${labelMap[statusId] || statusId}`,
                options: { tag: statusId }
            });
        }
    };

    window.DamageEffect = DamageEffect;
})();
