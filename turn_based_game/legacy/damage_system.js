(() => {
    /**
     * Damage classification + resistance gate.
     * Types: 'attack' (红伤), 'fixed', 'percent', 'true'.
     * All damage funnels through this helper so抗性/免疫判定集中处理。
     */
    class DamageSystem {
        constructor(game) {
            this.game = game;
            this.resists = { default: { fixed: 35, percent: 35, trueDmg: 0 } };
        }

        getResist(char) {
            if (!char) return this.resists.default;
            return char.resist || this.resists.default;
        }

        apply({ type, source, target, amount, label = "伤害", options = {} }) {
            const resCfg = this.getResist(target);
            let final = Math.max(0, Math.floor(amount || 0));

            // Percent/fixed resist (clamped 0-100)
            if (type === 'fixed') {
                const reduce = Math.min(100, Math.max(0, resCfg.fixed || 0));
                if (reduce >= 100) {
                    this.game.log(`${target.name} 抗性免疫固定伤害！`);
                    return 0;
                }
                final = Math.floor(final * (1 - reduce / 100));
            }
            if (type === 'percent') {
                const reduce = Math.min(100, Math.max(0, resCfg.percent || 0));
                if (reduce >= 100) {
                    this.game.log(`${target.name} 抗性免疫百分比伤害！`);
                    return 0;
                }
                final = Math.floor(final * (1 - reduce / 100));
            }
            if (type === 'true') {
                const reduce = Math.min(100, Math.max(0, resCfg.trueDmg || 0));
                final = Math.floor(final * (1 - reduce / 100));
            }

            // Immolate resist hook
            if (options?.tag === 'immolate' && resCfg.immolateResist) {
                const reduce = Math.min(100, Math.max(0, resCfg.immolateResist));
                final = Math.floor(final * (1 - reduce / 100));
                this.game.log(`${target.name} 焚烬抗性生效，伤害降低${reduce}%！`);
            }

            if (final <= 0) return 0;
            target.hp = Math.max(0, target.hp - final);
            if (label) this.game.log(`${label} 造成 ${final} ${this.describe(type)}！`);
            this.game.showDamageNumber(final, target === this.game.player, type === 'true' ? 'white' : (type === 'fixed' || type === 'percent' ? 'pink' : undefined));
            return final;
        }

        describe(type) {
            switch (type) {
                case 'fixed': return '固伤';
                case 'percent': return '百分比伤害';
                case 'true': return '真实伤害';
                default: return '伤害';
            }
        }
    }

    window.DamageSystem = DamageSystem;
})();
