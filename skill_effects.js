window.SkillEffects = {
    // 1. 王·焚世烈焰
    760: (game, src, tgt, args, ctx) => {
        if (ctx.phase === 'before') {
            ctx.ignoreResist = true;
        }
    },
    777: (game, src, tgt, args, ctx) => {
        if (ctx.phase === 'before') {
            if (game.clearStats(tgt)) {
                src.buffs.priorityForceNext = args[0] + 1; // 1 -> 2 (Next 1 turn forced priority)
                game.log("消除成功！下回合必定先出手！");
            }
        }
    },
    1048: (game, src, tgt, args, ctx) => {
        if (ctx.phase === 'before') {
            const hasStatus = tgt.buffs.turnEffects.some(e => game.ABNORMAL_STATUSES.includes(e.id));
            if (hasStatus) {
                ctx.damageMultiplier *= (1 + args[0] / 100); // 75% -> 1.75
                game.log(`对手异常，伤害提升${args[0]}%！`);
            }
        }
    },
    1257: (game, src, tgt, args, ctx) => {
        if (ctx.phase === 'after') {
             const hasStatus = tgt.buffs.turnEffects.some(e => game.ABNORMAL_STATUSES.includes(e.id));
             if (!hasStatus) {
                 const absorb = Math.floor(tgt.maxHp / args[0]); // 3
                 tgt.hp = Math.max(0, tgt.hp - absorb);
                 game.heal(src, absorb, "吸取");
                 game.showDamageNumber(absorb, false, 'pink');
                 game.log(`对手无异常，吸取 ${absorb} 体力！`);
             }
        }
    },

    // 2. 王·酷烈风息
    1221: (game, src, tgt, args, ctx) => {
        if (ctx.phase === 'before') {
            if (game.reverseStats(src, false)) {
                src.buffs.immuneAbnormalCount = args[0]; // 1
                game.log(`反转成功！免疫下${args[0]}次异常！`);
            }
        }
    },
    1256: (game, src, tgt, args, ctx) => {
        if (ctx.phase === 'after') {
            if (ctx.damageDealt < args[0]) { // 300
                const statusMap = { '焚烬': 'immolate', '烧伤': 'burn', '冰封': 'freeze', '害怕': 'fear', '麻痹': 'paralyze', '睡眠': 'sleep', '中毒': 'poison' };
                const statusId = statusMap[args[1]] || 'burn';
                game.addTurnEffect(tgt, args[1], 2, statusId);
                game.log(`伤害<${args[0]}，对手${args[1]}！`);
            } else {
                src.buffs.damageBoostNext = args[2]; // 1 (count)
                game.log(`伤害>=${args[0]}，下次伤害+${args[3]}%！`);
            }
        }
    },

    // 3. 火焰精核
    1001: (game, src, tgt, args, ctx) => {
        if (ctx.phase === 'before') {
            let boost = args[0]; // 1
            const hasStatus = tgt.buffs.turnEffects.some(e => game.ABNORMAL_STATUSES.includes(e.id));
            if (hasStatus) boost *= 2;
            game.modifyStats(src, { attack: boost, defense: boost, speed: boost, specialAttack: boost, specialDefense: boost });
            game.log(`全属性+${boost}！`);
        }
    },
    1065: (game, src, tgt, args, ctx) => {
        if (ctx.phase === 'before') {
            // args: [4, 3, 2]
            // Logic moved to executeAction hook in game.js
            game.addTurnEffect(src, '火焰精核', args[0], 'fire_core', `每回合恢复1/${args[1]}体力并造成等量固伤(体力<1/${args[2]}翻倍)`, { params: args });
            game.log(`${args[0]}回合恢复并固伤！`);
        }
    },
    843: (game, src, tgt, args, ctx) => {
        if (ctx.phase === 'before') {
            src.buffs.priorityNext = args[0] + 1; // 2 -> 3 (Next 2 turns)
            game.log(`下${args[0]}回合先制+${args[1]}！`);
        }
    },

    // 4. 火种永存
    191: (game, src, tgt, args, ctx) => {
        if (ctx.phase === 'before') {
            game.addTurnEffect(src, '反弹异常', args[0], 'reflect_status', `免疫并反弹异常状态`);
            game.log(`${args[0]}回合免疫反弹异常！`);
        }
    },
    1255: (game, src, tgt, args, ctx) => {
        if (ctx.phase === 'before') {
            // args: [4, 70, '焚烬', 3]
            const desc = `每回合${args[1]}%概率${args[2]}，未触发则附加1/${args[3]}固伤`;
            game.addTurnEffect(src, '火种', args[0], 'eternal_fire', desc);
            const buff = src.buffs.turnEffects.find(e => e.id === 'eternal_fire');
            if (buff) {
                buff.params = args;
            }
            game.log(`${args[0]}回合火种！`);
        }
    },
    570: (game, src, tgt, args, ctx) => {
        if (ctx.phase === 'before') {
            src.buffs.agnesShield = true;
            // Add a visual indicator for the shield (Red UI count effect)
            // Since agnesShield is a boolean flag, we can map it to a count effect of 1 for UI purposes
            // Or just use the existing shield logic but make it specific?
            // The user wants Red UI for count effects.
            // Let's use the generic shield buff but with a specific name/desc if possible, or just rely on agnesShield flag and update renderTurnEffects to show it.
            // Actually, game.js renderTurnEffects checks char.buffs.shield.
            // We should set char.buffs.shield = 1?
            // But agnesShield is specific (immune to attack only).
            // Let's set a custom count effect for UI.
            // We can't easily add custom count effects without modifying game.js renderTurnEffects.
            // But we can use the 'shield' property if we change how it's consumed.
            // For now, let's assume agnesShield is internal logic, but we want UI.
            // We can add a dummy turn effect with type 'count'?
            // No, turnEffects are blue.
            // Let's modify game.js to render agnesShield as a red dot.
            game.log(`免疫下${args[0]}次攻击！`);
        }
    },

    // 5. 秩序之助
    781: (game, src, tgt, args, ctx) => {
        if (ctx.phase === 'before') {
            // Dispel opponent turn effects
            if (tgt.buffs.turnEffects.length > 0) {
                tgt.buffs.turnEffects = [];
                game.log("消除了对手的回合效果！");
                // If successful, block attribute skills for 2 turns
                game.addTurnEffect(tgt, '封属', args[0], 'block_attr', `无法使用属性技能`);
                game.log(`对手${args[0]}回合无法使用属性技能！`);
            } else {
                game.log("对手没有回合效果，消除失败！");
            }
        }
    },
    679: (game, src, tgt, args, ctx) => {
        if (ctx.phase === 'before') {
            game.addTurnEffect(tgt, '禁疗', args[0], 'heal_block', `无法恢复体力`);
            game.log(`对手${args[0]}回合无法恢复体力！`);
        }
    },

    // --- King Gaia ---
    // 战霸天下
    2001: (game, src, tgt, args, ctx) => {
        if (ctx.phase === 'before') {
            game.addTurnEffect(src, '免弱', args[0], 'immune_stat_drop', `免疫能力下降`);
            game.log(`${args[0]}回合免疫能力下降！`);
        }
    },
    2002: (game, src, tgt, args, ctx) => {
        if (ctx.phase === 'before') {
            src.buffs.reflectDamage = args[0]; // 1 (count)
            src.buffs.reflectDamageMultiplier = args[1] || 100;
            game.log(`准备将下次受到的伤害${args[1]}%反馈给对手！`);
        }
    },
    // 不败之境
    2003: (game, src, tgt, args, ctx) => {
        if (ctx.phase === 'before') {
            let boost = args[0]; // 1
            if (src.hp > src.maxHp / 2) boost *= 2;
            game.modifyStats(src, { attack: boost, defense: boost, speed: boost, specialAttack: boost, specialDefense: boost });
            game.log(`全属性+${boost}！`);
        }
    },
    2004: (game, src, tgt, args, ctx) => {
        if (ctx.phase === 'before') {
            // args: [4, 3] (4 turns, 1/3 max hp)
            game.addTurnEffect(src, '吸血', args[0], 'absorb_hp_skill', `每回合吸取对手1/${args[1]}最大体力`, { params: args });
            game.log(`${args[0]}回合吸血！`);
        }
    },
    // 天诛乱舞
    2005: (game, src, tgt, args, ctx) => {
        if (ctx.phase === 'before') {
            if (game.reverseStats(src, false)) {
                game.addTurnEffect(tgt, '害怕', 2, 'fear');
                game.log("反转成功！对手害怕！");
            }
        }
    },
    // 天威力破
    2006: (game, src, tgt, args, ctx) => {
        if (ctx.phase === 'before') {
            if (tgt.buffs.turnEffects.length > 0) {
                tgt.buffs.turnEffects = [];
                game.log("消除了对手的回合效果！");
                src.buffs.immuneAbnormalCount = 1;
                game.log("免疫下一次异常！");
            }
        }
    },
    2007: (game, src, tgt, args, ctx) => {
        if (ctx.phase === 'after') {
            if (ctx.damageDealt < args[0]) { // 280
                src.buffs.critNext = args[1]; // 2
                game.log(`伤害<${args[0]}，下${args[1]}回合必定致命一击！`);
            }
        }
    },
    // 王·圣勇战意
    2008: (game, src, tgt, args, ctx) => {
        if (ctx.phase === 'before') {
            if (game.stealStats(src, tgt)) {
                const heal = args[0]; // 300
                const actual = Math.min(tgt.hp, heal); // Can't absorb more than current HP? Or fixed amount? Usually fixed.
                tgt.hp = Math.max(0, tgt.hp - heal);
                game.heal(src, heal, "吸取");
                game.showDamageNumber(heal, false, 'pink');
                game.log(`吸取成功！吸取 ${heal} 体力！`);
            }
        }
    },
    2009: (game, src, tgt, args, ctx) => {
        if (ctx.phase === 'before') {
            if (game.hasStatUps(tgt)) {
                src.buffs.priorityNext = args[0] + 1; // 2 -> 3
                game.log("对手处于能力提升，先制+2！");
            }
        }
    },

    // --- Surging Canglan ---
    // 王·洛水惊鸿
    3001: (game, src, tgt, args, ctx) => {
        if (ctx.phase === 'before') {
            ctx.ignoreShield = true;
            ctx.ignoreResist = true; // "无视微弱和免疫" - usually implies both
        }
    },
    3002: (game, src, tgt, args, ctx) => {
        if (ctx.phase === 'before') {
            const cleared = tgt.buffs.turnEffects.length > 0;
            tgt.buffs.turnEffects = [];
            if (cleared) {
                game.addTurnEffect(tgt, '冰封', 2, 'freeze');
                game.log("消除成功！对手冰封！");
            } else {
                src.buffs.immuneAbnormalCount = 1;
                game.log("消除失败，免疫下1次异常！");
            }
        }
    },
    3003: (game, src, tgt, args, ctx) => {
        if (ctx.phase === 'after') {
            const fix = Math.floor(tgt.maxHp * (args[0] / 100)); // 20
            tgt.hp = Math.max(0, tgt.hp - fix);
            game.log(`附加 ${fix} 固伤！`);
            game.showDamageNumber(fix, false, 'pink');
        }
    },
    // 王·碧海潮生
    3004: (game, src, tgt, args, ctx) => {
        if (ctx.phase === 'before') {
            game.modifyStats(tgt, { attack: -1, defense: -1, speed: -1, specialAttack: -1, specialDefense: -1, accuracy: -1, evasion: -1 });
            game.log("对手全属性-1！");
        }
    },
    3005: (game, src, tgt, args, ctx) => {
        if (ctx.phase === 'before') {
            if (game.reverseStats(src, false)) {
                game.addTurnEffect(src, '免弱', args[0], 'immune_stat_drop', `免疫能力下降`);
                game.log(`反转成功！${args[0]}回合免弱！`);
            }
        }
    },
    // 浮生若梦
    3006: (game, src, tgt, args, ctx) => {
        if (ctx.phase === 'before') {
            let boost = args[0]; // 1
            if (src.buffs.shieldHp > 0) boost *= 2;
            game.modifyStats(src, { attack: boost, defense: boost, speed: boost, specialAttack: boost, specialDefense: boost });
            game.log(`全属性+${boost}！`);
        }
    },
    3007: (game, src, tgt, args, ctx) => {
        if (ctx.phase === 'before') {
            game.addTurnEffect(tgt, '易伤', args[0], 'vulnerability', `受到的伤害翻倍`); // Assuming 100% increase = double
            game.log(`对手${args[0]}回合易伤！`);
        }
    },
    // 沧海永存
    3008: (game, src, tgt, args, ctx) => {
        if (ctx.phase === 'before') {
            if (Math.random() * 100 < args[0]) { // 80
                game.addTurnEffect(tgt, '冰封', 2, 'freeze');
                game.log("对手冰封！");
            } else {
                src.buffs.bindNext = args[1]; // 2
                game.log(`未触发冰封，下${args[1]}回合攻击附加束缚！`);
            }
        }
    },
    3009: (game, src, tgt, args, ctx) => {
        if (ctx.phase === 'before') {
            const currentHp = src.hp;
            const maxHp = src.maxHp;
            const healAmount = maxHp - currentHp;
            game.heal(src, maxHp, "恢复");
            if (currentHp < maxHp / 2) {
                const fixDmg = healAmount;
                tgt.hp = Math.max(0, tgt.hp - fixDmg);
                game.log(`体力<1/2，附加 ${fixDmg} 固伤！`);
                game.showDamageNumber(fixDmg, false, 'pink');
            }
        }
    },
    // 上善若水
    3010: (game, src, tgt, args, ctx) => {
        if (ctx.phase === 'before') {
            let hasUp = false;
            for (let k in tgt.buffs.statUps) {
                if (tgt.buffs.statUps[k] > 0) {
                    hasUp = true;
                    tgt.buffs.statUps[k] *= -1;
                }
            }
            game.updateUI();
            if (hasUp) {
                game.log("反转了对手的强化！");
                for (let k in tgt.buffs.statUps) {
                    if (tgt.buffs.statUps[k] < 0) {
                        src.buffs.statUps[k] = (src.buffs.statUps[k] || 0) + Math.abs(tgt.buffs.statUps[k]);
                    }
                }
                game.log("复制了对手的强化！");
            } else {
                game.clearStats(tgt);
            }
        }
    },
    3011: (game, src, tgt, args, ctx) => {
        if (ctx.phase === 'after') {
            if (ctx.damageDealt < args[0]) { // 300
                const fix = Math.floor(src.maxHp * (args[1] / 100)); // 30
                tgt.hp = Math.max(0, tgt.hp - fix);
                game.log(`伤害<${args[0]}，附加 ${fix} 固伤！`);
                game.showDamageNumber(fix, false, 'pink');
            }
        }
    },

    // --- Solensen ---
    // 烈火净世击
    4001: (game, src, tgt, args, ctx) => {
        if (ctx.phase === 'damage_calc') {
            if (!game.hasStatUps(tgt)) {
                ctx.damageMultiplier *= (1 + args[0] / 100); // 100
                game.log("对手无强化，伤害翻倍！");
            }
        }
    },
    4002: (game, src, tgt, args, ctx) => {
        if (ctx.phase === 'after') {
            if (game.reverseStats(tgt, true)) {
                game.heal(src, src.maxHp, "技能");
                src.skills.forEach(s => s.pp = s.maxPp);
                game.log("反转成功！恢复所有体力和PP！");
                game.updateSkillButtons();
            }
        }
    },
    // 混沌灭世决
    4003: (game, src, tgt, args, ctx) => {
        if (ctx.phase === 'before') {
            if (game.clearStats(tgt)) {
                tgt.buffs.blockAttack = args[0]; // 2
                game.log(`消除成功！对手下${args[0]}次攻击无效！`);
            }
        }
    },
    4004: (game, src, tgt, args, ctx) => {
        if (ctx.phase === 'after') {
            if (tgt.hp > 0) {
                src.buffs.priorityNext = args[0] + 1; // 2 -> 3
                game.log(`未击败对手，下${args[0]}回合先制+2！`);
            }
        }
    },
    4005: (game, src, tgt, args, ctx) => {
        if (ctx.phase === 'before') {
            let matchCount = 0;
            for (let k in src.buffs.statUps) {
                if (src.buffs.statUps[k] === tgt.buffs.statUps[k]) matchCount++;
            }
            if (matchCount > 0) {
                const fix = args[0] * matchCount; // 120
                tgt.hp = Math.max(0, tgt.hp - fix);
                game.log(`属性相同 ${matchCount} 项，附加 ${fix} 固伤！`);
                game.showDamageNumber(fix, false, 'pink');
            }
        }
    },
    // 背弃圣灵
    4006: (game, src, tgt, args, ctx) => {
        if (ctx.phase === 'before') {
            game.modifyStats(src, { attack: 1, defense: 1, speed: 1, specialAttack: 1, specialDefense: 1, accuracy: 1, evasion: 1 });
            game.log("全属性+1！");
        }
    },
    4007: (game, src, tgt, args, ctx) => {
        if (ctx.phase === 'before') {
            const healAmt = src.maxHp - src.hp;
            game.heal(src, src.maxHp, "技能");
            if (healAmt > 0) {
                tgt.hp = Math.max(0, tgt.hp - healAmt);
                game.log(`附加 ${healAmt} 固伤！`);
                game.showDamageNumber(healAmt, false, 'pink');
            }
        }
    },
    4008: (game, src, tgt, args, ctx) => {
        if (ctx.phase === 'before') {
            game.addTurnEffect(tgt, '易伤', args[0], 'vulnerability', `受到的伤害提升${args[1]}%`);
            const buff = tgt.buffs.turnEffects.find(e => e.id === 'vulnerability');
            if (buff) buff.params = args;
            game.log(`对手${args[0]}回合易伤！`);
        }
    },
    // 混沌魔域
    4009: (game, src, tgt, args, ctx) => {
        if (ctx.phase === 'before') {
            if (Math.random() * 100 < args[0]) { // 100
                // Try to apply fear
                // Check immunity is handled in addTurnEffect, but we need to know if it succeeded to decide "else absorb".
                // addTurnEffect doesn't return success.
                // But we can check if target has fear after?
                // Or check immunity beforehand.
                const immune = (tgt.buffs.immuneAbnormal > 0 || tgt.buffs.immuneAbnormalCount > 0);
                if (immune) {
                    // Failed
                    const absorb = Math.floor(tgt.maxHp / args[1]); // 3
                    tgt.hp = Math.max(0, tgt.hp - absorb);
                    game.heal(src, absorb, "吸取");
                    game.log(`对手免疫害怕，吸取 ${absorb} 体力！`);
                    game.showDamageNumber(absorb, false, 'pink');
                } else {
                    game.addTurnEffect(tgt, '害怕', 2, 'fear');
                    game.log("对手害怕！");
                }
            }
        }
    },
    4010: (game, src, tgt, args, ctx) => {
        if (ctx.phase === 'before') {
            let drop = -1;
            if (src.hp < tgt.hp) drop = -2;
            game.modifyStats(tgt, { attack: drop, defense: drop, speed: drop, specialAttack: drop, specialDefense: drop, accuracy: drop, evasion: drop });
            game.log(`对手全属性 ${drop}！`);
        }
    },
    // 诸雄之主
    4011: (game, src, tgt, args, ctx) => {
        if (ctx.phase === 'before') {
            const cleared = tgt.buffs.turnEffects.length > 0;
            tgt.buffs.turnEffects = [];
            if (cleared) {
                src.buffs.immuneAbnormalCount = args[0]; // 2
                game.log(`消除成功！免疫下${args[0]}次异常！`);
            }
        }
    },
    4012: (game, src, tgt, args, ctx) => {
        if (ctx.phase === 'damage_calc') {
            let chance = args[0]; // 30
            if (game.hasStatUps(src)) chance *= 2; // 60
            if (Math.random() * 100 < chance) {
                ctx.damageMultiplier *= 3;
                game.log("3倍伤害触发！");
            }
        }
    }
};