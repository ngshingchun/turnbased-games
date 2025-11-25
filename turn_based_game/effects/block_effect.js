/**
 * BlockEffect - 封锁效果模块
 * 处理所有封锁相关：
 * 1. 封锁攻击技能（次数/回合）
 * 2. 封锁属性技能（次数/回合）
 * 3. 沉默（禁止第五技能）
 * 4. 免疫攻击（对手下次攻击无效）- 不是护盾，是令对手攻击失去伤害和效果
 * 5. 无视免疫（穿透免疫攻击效果）
 */
(() => {
    const BlockEffect = {
        /**
         * 封锁攻击技能（次数）
         */
        blockAttack(game, target, count, source = "封攻") {
            target.buffs.blockAttack = (target.buffs.blockAttack || 0) + count;
            game.log(`${target.name} 的下 ${count} 次攻击技能被封锁！(${source})`);
            game.updateUI();

            if (window.CountEffect?.run) {
                window.CountEffect.run('block_attack', game, { target, count });
            }
        },

        /**
         * 封锁属性技能（次数）
         */
        blockAttribute(game, target, count, source = "封属") {
            target.buffs.blockAttribute = (target.buffs.blockAttribute || 0) + count;
            game.log(`${target.name} 的下 ${count} 次属性技能被封锁！(${source})`);
            game.updateUI();

            if (window.CountEffect?.run) {
                window.CountEffect.run('block_attribute', game, { target, count });
            }
        },

        /**
         * 封锁属性技能（回合数）- 状态效果
         */
        blockAttributeTurns(game, target, turns, source = "封属") {
            game.addTurnEffect(target, '封属', turns, 'block_attr', '无法使用属性技能');
            game.log(`${target.name} ${turns} 回合无法使用属性技能！(${source})`);

            if (window.TurnEffect?.run) {
                window.TurnEffect.run('block_attr', game, { target, turns });
            }
        },

        /**
         * 添加沉默（禁止第五技能）
         */
        silence(game, target, turns, source = "沉默") {
            window.StatusEffect?.apply(game, target, 'silence', '沉默', turns, '无法使用第五技能，每回合受伤');
        },

        // ==================== 免疫攻击系统 ====================
        
        /**
         * 添加免疫攻击效果（令对手下N次攻击无效）
         * 这不是护盾，是让对手的攻击失去伤害和效果
         * 来源：不灭火种的免疫攻击、索倫森第五技能等
         * 
         * @param {Object} game - 游戏实例
         * @param {Object} target - 获得免疫的目标
         * @param {number} count - 免疫次数
         * @param {string} source - 来源描述
         */
        addAttackImmunity(game, target, count, source = "免疫攻击") {
            target.buffs.attackImmunityCount = (target.buffs.attackImmunityCount || 0) + count;
            game.log(`${target.name} 获得免疫攻击效果！对手下 ${count} 次攻击技能将无效！(${source})`);
            game.updateUI();

            if (window.CountEffect?.run) {
                window.CountEffect.run('attack_immunity', game, { target, count, source });
            }
        },

        /**
         * 检查攻击是否被对方的免疫攻击效果无效化
         * @param {Object} game - 游戏实例
         * @param {Object} attacker - 攻击方
         * @param {Object} defender - 防御方
         * @param {Object} skill - 使用的技能
         * @param {Object} options - 选项 { ignoreImmunity: boolean }
         * @returns {{ nullified: boolean, reason: string }}
         */
        checkAttackImmunity(game, attacker, defender, skill, options = {}) {
            // 无视免疫效果（如沧澜第五技能）
            if (options.ignoreImmunity || skill.ignoreImmunity) {
                if (defender.buffs.attackImmunityCount > 0) {
                    game.log(`${attacker.name} 的攻击无视了 ${defender.name} 的免疫效果！`);
                }
                return { nullified: false };
            }

            // 检查防御方是否有免疫攻击效果
            if (defender.buffs.attackImmunityCount > 0) {
                defender.buffs.attackImmunityCount--;
                game.log(`${defender.name} 的免疫攻击效果生效！${attacker.name} 的攻击被完全无效化！`);
                game.showFloatingText("攻击无效", defender === game.player);
                game.updateUI();
                return { nullified: true, reason: 'attack_immunity' };
            }

            return { nullified: false };
        },

        /**
         * 检查技能是否有无视免疫标记
         */
        hasIgnoreImmunity(skill) {
            return skill.ignoreImmunity === true || 
                   skill.flags?.ignoreImmunity === true ||
                   skill.effects?.some(e => e.id === 3001); // 沧澜无视免疫效果ID
        },

        // ==================== 原有检查方法 ====================

        /**
         * 检查攻击是否被封锁
         * @returns {{ blocked: boolean, consume: boolean }}
         */
        checkAttack(game, attacker, skill) {
            // 回合状态封锁
            if (attacker.buffs.turnEffects.some(e => e.id === 'block_attack')) {
                return { blocked: true, consume: false };
            }

            // 次数封锁
            if (attacker.buffs.blockAttack > 0) {
                attacker.buffs.blockAttack--;
                game.updateUI();
                return { blocked: true, consume: true };
            }

            return { blocked: false };
        },

        /**
         * 检查属性技能是否被封锁
         */
        checkAttribute(game, attacker, skill) {
            // 回合状态封锁
            if (attacker.buffs.turnEffects.some(e => e.id === 'block_attr')) {
                return { blocked: true, consume: false };
            }

            // 次数封锁
            if (attacker.buffs.blockAttribute > 0) {
                attacker.buffs.blockAttribute--;
                game.updateUI();
                return { blocked: true, consume: true };
            }

            return { blocked: false };
        },

        /**
         * 检查第五技能是否被沉默
         */
        checkSilence(game, attacker, skill) {
            if (attacker.buffs.turnEffects.some(e => e.id === 'silence')) {
                const isUlt = skill.type === 'ultimate' || skill.power === 160;
                if (isUlt) {
                    return { blocked: true };
                }
            }
            return { blocked: false };
        },

        /**
         * 综合检查技能封锁（攻击方视角）
         */
        checkSkill(game, attacker, skill) {
            if (skill.type === 'buff') {
                return this.checkAttribute(game, attacker, skill);
            }
            if (skill.type === 'attack' || skill.type === 'ultimate') {
                const attackBlock = this.checkAttack(game, attacker, skill);
                if (attackBlock.blocked) return attackBlock;
                return this.checkSilence(game, attacker, skill);
            }
            return { blocked: false };
        },

        /**
         * 综合检查攻击是否有效（防御方免疫视角）
         * 在 BEFORE_HIT 阶段调用
         */
        checkAttackEffective(game, attacker, defender, skill, options = {}) {
            // 检查防御方的免疫攻击效果
            const immunityCheck = this.checkAttackImmunity(game, attacker, defender, skill, options);
            if (immunityCheck.nullified) {
                return { effective: false, reason: immunityCheck.reason };
            }

            return { effective: true };
        }
    };

    window.BlockEffect = BlockEffect;
})();
