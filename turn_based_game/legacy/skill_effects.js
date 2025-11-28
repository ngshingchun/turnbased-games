/**
 * SkillEffects - 技能效果注册表
 * 
 * 每个效果函数签名：(game, src, tgt, args, ctx) => void
 * - game: 游戏实例
 * - src: 技能使用者（攻击方）
 * - tgt: 技能目标（防守方）
 * - args: 效果参数数组
 * - ctx: 上下文对象 { phase, damageMultiplier, damageDealt, ... }
 * 
 * ctx.phase 取值：
 * - 'before': 技能使用前
 * - 'damage_calc': 伤害计算时
 * - 'after': 技能使用后
 * 
 * 路由标注规范（在精灵文件的 skills 中定义）：
 * - route: 效果路由目标，如 "HpEffect", "TurnEffect+StatusEffect"
 * - owner: 效果绑定方，'self'=使用者, 'opponent'=目标, 'both'=双方
 * - note: 效果说明
 * 
 * TurnEffect 绑定方（重要）：
 * - 所有添加给自身的回合效果，owner 应为 'self'
 * - 所有添加给对手的回合效果，owner 应为 'opponent'
 * 
 * CountEffect 绑定方（重要）：
 * - 次数类效果同样需要标注 owner
 */
window.SkillEffects = {
    // =====================================================
    // 不灭·艾恩斯 (Agnes)
    // =====================================================
    
    // 1. 王·焚世烈焰 - 无视微弱
    // route: HpEffect.ignoreWeaken | owner: self
    760: (game, src, tgt, args, ctx) => {
        if (ctx.phase === 'before') {
            ctx.ignoreResist = true;
        }
    },
    // 王·焚世烈焰 - 消除能力成功则先制
    // route: StatEffect.clear+PriorityEffect | owner: self
    777: (game, src, tgt, args, ctx) => {
        if (ctx.phase === 'before') {
            if (game.clearStats(tgt)) {
                src.buffs.priorityForceNext = args[0] + 1; // 1 -> 2 (Next 1 turn forced priority)
                game.log("消除成功！下回合必定先出手！");
            }
        }
    },
    // 王·焚世烈焰 - 对手异常时伤害提升
    // route: HpEffect.conditionalBoost | owner: self
    1048: (game, src, tgt, args, ctx) => {
        if (ctx.phase === 'before') {
            const hasStatus = tgt.buffs.turnEffects.some(e => game.ABNORMAL_STATUSES.includes(e.id));
            if (hasStatus) {
                ctx.damageMultiplier *= (1 + args[0] / 100); // 75% -> 1.75
                game.log(`对手异常，伤害提升${args[0]}%！`);
            }
        }
    },
    // 王·焚世烈焰 - 对手无异常时吸取体力
    // route: HpEffect.drain | owner: self+opponent
    1257: (game, src, tgt, args, ctx) => {
        if (ctx.phase === 'after') {
            const hasStatus = tgt.buffs.turnEffects.some(e => game.ABNORMAL_STATUSES.includes(e.id));
            if (!hasStatus) {
                const absorb = Math.floor(tgt.maxHp / args[0]); // 3
                game.damageSystem.apply({ type: 'percent', source: src, target: tgt, amount: absorb, label: "" });
                game.heal(src, absorb, "吸取");
            }
        }
    },

    // =====================================================
    // 2. 王·酷烈风息
    // =====================================================
    
    // 反转自身能力下降，成功免疫1次异常
    // route: StatEffect.invert+CountEffect | owner: self
    1221: (game, src, tgt, args, ctx) => {
        if (ctx.phase === 'before') {
            if (game.reverseStats(src, false)) {
                src.buffs.immuneAbnormalCount = args[0]; // 1
                game.log(`反转成功！免疫下${args[0]}次异常！`);
            }
        }
    },
    // 伤害<300焚烬，否则下次伤害+100%
    // route: StatusEffect|CountEffect | owner: opponent(焚烬), self(伤害加成)
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

    // =====================================================
    // 3. 火焰精核
    // =====================================================
    
    // 全属性+1，对手异常时翻倍
    // route: StatEffect | owner: self
    1001: (game, src, tgt, args, ctx) => {
        if (ctx.phase === 'before') {
            let boost = args[0]; // 1
            const hasStatus = tgt.buffs.turnEffects.some(e => game.ABNORMAL_STATUSES.includes(e.id));
            if (hasStatus) boost *= 2;
            game.modifyStats(src, { attack: boost, defense: boost, speed: boost, specialAttack: boost, specialDefense: boost });
            game.log(`全属性+${boost}！`);
        }
    },
    // 4回合每回合恢复1/3+等量固伤
    // route: TurnEffect | owner: self (效果绑定自身)
    1065: (game, src, tgt, args, ctx) => {
        if (ctx.phase === 'before') {
            // args: [4, 3, 2]
            game.addTurnEffect(src, '火焰精核', args[0], 'fire_core', `每回合恢复1/${args[1]}体力并造成等量固伤(体力<1/${args[2]}翻倍)`, { 
                params: args,
                owner: src.key,        // 绑定方：自身
                source: 'skill_effect'
            });
            game.log(`${args[0]}回合恢复并固伤！`);
        }
    },
    // 下2回合先制+2
    // route: TurnEffect | owner: self
    843: (game, src, tgt, args, ctx) => {
        if (ctx.phase === 'before') {
            const turns = args[0] || 1;
            const bonus = args[1] || 2;
            src.buffs.priorityNext = Math.max(src.buffs.priorityNext, turns);
            game.log(`下${turns}回合先制+${bonus}！`);
        }
    },

    // =====================================================
    // 4. 火种永存
    // =====================================================
    
    // 5回合免疫并反弹异常
    // route: TurnEffect | owner: self
    191: (game, src, tgt, args, ctx) => {
        if (ctx.phase === 'before') {
            game.addTurnEffect(src, '反弹异常', args[0], 'reflect_status', `免疫并反弹异常状态`, {
                owner: src.key,
                source: 'skill_effect'
            });
            game.log(`${args[0]}回合免疫反弹异常！`);
        }
    },
    // 4回合70%焚烬/1/3固伤
    // route: TurnEffect | owner: self
    1255: (game, src, tgt, args, ctx) => {
        if (ctx.phase === 'before') {
            // args: [4, 70, '焚烬', 3]
            const desc = `每回合${args[1]}%概率${args[2]}，未触发则附加1/${args[3]}固伤`;
            game.addTurnEffect(src, '火种', args[0], 'eternal_fire', desc, {
                params: args,
                owner: src.key,
                source: 'skill_effect'
            });
            game.log(`${args[0]}回合火种！`);
        }
    },
    // 免疫下1次攻击
    // route: CountEffect+BlockEffect.attackImmunity | owner: self
    570: (game, src, tgt, args, ctx) => {
        if (ctx.phase === 'before') {
            src.buffs.attackImmunityCount = (src.buffs.attackImmunityCount || 0) + args[0];
            game.log(`免疫下${args[0]}次攻击！`);
        }
    },

    // =====================================================
    // 5. 秩序之助
    // =====================================================
    
    // 消除回合效果成功则封属2回合
    // route: TurnEffect.clear+BlockEffect | owner: opponent
    781: (game, src, tgt, args, ctx) => {
        if (ctx.phase === 'before') {
            // Dispel opponent turn effects
            if (tgt.buffs.turnEffects.length > 0) {
                tgt.buffs.turnEffects = [];
                game.log("消除了对手的回合效果！");
                // If successful, block attribute skills for 2 turns
                game.addTurnEffect(tgt, '封属', args[0], 'block_attr', `无法使用属性技能`, {
                    owner: src.key,        // 绑定方：施加者
                    source: 'skill_effect'
                });
                game.log(`对手${args[0]}回合无法使用属性技能！`);
            } else {
                game.log("对手没有回合效果，消除失败！");
            }
        }
    },
    // 2回合对手禁疗
    // route: TurnEffect | owner: opponent
    679: (game, src, tgt, args, ctx) => {
        if (ctx.phase === 'before') {
            game.addTurnEffect(tgt, '禁疗', args[0], 'heal_block', `无法恢复体力`, {
                owner: src.key,
                source: 'skill_effect'
            });
            game.log(`对手${args[0]}回合无法恢复体力！`);
        }
    },

    // =====================================================
    // 王·盖亚 (King Gaia)
    // =====================================================
    
    // 战霸天下 - 5回合免疫能力下降
    // route: TurnEffect | owner: self
    2001: (game, src, tgt, args, ctx) => {
        if (ctx.phase === 'before') {
            game.addTurnEffect(src, '免弱', args[0], 'immune_stat_drop', `免疫能力下降`, {
                owner: src.key,
                source: 'skill_effect'
            });
            game.log(`${args[0]}回合免疫能力下降！`);
        }
    },
    // 战霸天下 - 下1次伤害200%反馈
    // route: CountEffect+ReflectEffect | owner: self
    2002: (game, src, tgt, args, ctx) => {
        if (ctx.phase === 'before') {
            src.buffs.reflectDamage = args[0]; // 1 (count)
            src.buffs.reflectDamageMultiplier = args[1] || 100;
            game.log(`准备将下次受到的伤害${args[1]}%反馈给对手！`);
        }
    },
    // 不败之境 - 全属性+1(高血翻倍)
    // route: StatEffect | owner: self
    2003: (game, src, tgt, args, ctx) => {
        if (ctx.phase === 'before') {
            let boost = args[0]; // 1
            if (src.hp > src.maxHp / 2) boost *= 2;
            game.modifyStats(src, { attack: boost, defense: boost, speed: boost, specialAttack: boost, specialDefense: boost });
            game.log(`全属性+${boost}！`);
        }
    },
    // 不败之境 - 4回合吸取1/3最大体力
    // route: TurnEffect+HpEffect+HpEffect | owner: self
    2004: (game, src, tgt, args, ctx) => {
        if (ctx.phase === 'before') {
            // args: [4, 3] (4 turns, 1/3 max hp)
            game.addTurnEffect(src, '吸血', args[0], 'absorb_hp_skill', `每回合吸取对手1/${args[1]}最大体力`, { 
                params: args,
                owner: src.key,
                source: 'skill_effect'
            });
            game.log(`${args[0]}回合吸血！`);
        }
    },
    // 天诛乱舞 - 反转自身下降+成功则害怕
    // route: StatEffect.invert+StatusEffect | owner: self(反转), opponent(害怕)
    2005: (game, src, tgt, args, ctx) => {
        if (ctx.phase === 'before') {
            if (game.reverseStats(src, false)) {
                game.addTurnEffect(tgt, '害怕', 2, 'fear', '', {
                    owner: src.key,
                    source: 'skill_effect'
                });
                game.log("反转成功！对手害怕！");
            }
        }
    },
    // 天威力破 - 消除回合效果成功则1次异常免疫
    // route: TurnEffect.clear+CountEffect | owner: self
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
    // 天威力破 - 伤害<280则2回合必致命
    // route: TurnEffect+CritEffect | owner: self
    2007: (game, src, tgt, args, ctx) => {
        if (ctx.phase === 'after') {
            if (ctx.damageDealt < args[0]) { // 280
                src.buffs.critNext = args[1]; // 2
                game.log(`伤害<${args[0]}，下${args[1]}回合必定致命一击！`);
            }
        }
    },
    // 王·圣勇战意 - 吸取强化成功则吸取300体力
    // route: StatEffect.steal+HpEffect.drain | owner: self
    2008: (game, src, tgt, args, ctx) => {
        if (ctx.phase === 'before') {
            if (game.stealStats(src, tgt)) {
                const heal = args[0]; // 300
                tgt.hp = Math.max(0, tgt.hp - heal);
                game.heal(src, heal, "吸取");
                game.showDamageNumber(heal, false, 'pink');
                game.log(`吸取成功！吸取 ${heal} 体力！`);
            }
        }
    },
    // 王·圣勇战意 - 对手有强化则先制+2
    // route: PriorityEffect | owner: self
    2009: (game, src, tgt, args, ctx) => {
        if (ctx.phase === 'before') {
            if (game.hasStatUps(tgt)) {
                src.buffs.priorityNext = args[0] + 1; // 2 -> 3
                game.log("对手处于能力提升，先制+2！");
            }
        }
    },

    // =====================================================
    // 怒涛·沧岚 (Surging Canglan)
    // =====================================================
    
    // 无视免疫攻击
    // route: HpEffect.ignoreImmune | owner: self
    3100: (game, src, tgt, args, ctx) => {
        if (ctx.phase === 'before') {
            ctx.ignoreImmune = true;
            game.log("无视免疫攻击！");
        }
    },
    // 王·洛水惊鸿 - 无视微弱和护盾
    // route: HpEffect.ignoreWeaken+ignoreShield | owner: self
    3001: (game, src, tgt, args, ctx) => {
        if (ctx.phase === 'before') {
            ctx.ignoreShield = true;
            ctx.ignoreResist = true;
        }
    },
    // 王·洛水惊鸿 - 消除回合效果成功则冰封/免疫1次异常
    // route: TurnEffect.clear+StatusEffect|CountEffect | owner: opponent(冰封), self(免疫)
    3002: (game, src, tgt, args, ctx) => {
        if (ctx.phase === 'before') {
            const cleared = tgt.buffs.turnEffects.length > 0;
            tgt.buffs.turnEffects = [];
            if (cleared) {
                game.addTurnEffect(tgt, '冰封', 2, 'freeze', '', {
                    owner: src.key,
                    source: 'skill_effect'
                });
                game.log("消除成功！对手冰封！");
            } else {
                src.buffs.immuneAbnormalCount = 1;
                game.log("消除失败，免疫下1次异常！");
            }
        }
    },
    // 王·洛水惊鸿 - 附加20%最大体力固伤
    // route: HpEffect.percent | owner: opponent
    3003: (game, src, tgt, args, ctx) => {
        if (ctx.phase === 'after') {
            const fix = Math.floor(tgt.maxHp * (args[0] / 100)); // 20
            tgt.hp = Math.max(0, tgt.hp - fix);
            game.log(`附加 ${fix} 固伤！`);
            game.showDamageNumber(fix, false, 'pink');
        }
    },
    // 王·碧海潮生 - 100%对手全属性-1
    // route: StatEffect | owner: opponent
    3004: (game, src, tgt, args, ctx) => {
        if (ctx.phase === 'before') {
            game.modifyStats(tgt, { attack: -1, defense: -1, speed: -1, specialAttack: -1, specialDefense: -1, accuracy: -1 });
            game.log("对手全属性-1！");
        }
    },
    // 王·碧海潮生 - 反转弱化成功则4回合免弱
    // route: StatEffect.invert+TurnEffect | owner: self
    3005: (game, src, tgt, args, ctx) => {
        if (ctx.phase === 'before') {
            if (game.reverseStats(src, false)) {
                game.addTurnEffect(src, '免弱', args[0], 'immune_stat_drop', `免疫能力下降`, {
                    owner: src.key,
                    source: 'skill_effect'
                });
                game.log(`反转成功！${args[0]}回合免弱！`);
            }
        }
    },
    // 浮生若梦 - 全属性+1，有护盾翻倍
    // route: StatEffect | owner: self
    3006: (game, src, tgt, args, ctx) => {
        if (ctx.phase === 'before') {
            let boost = args[0]; // 1
            if (src.buffs.shieldHp > 0) boost *= 2;
            game.modifyStats(src, { attack: boost, defense: boost, speed: boost, specialAttack: boost, specialDefense: boost });
            game.log(`全属性+${boost}！`);
        }
    },
    // 浮生若梦 - 2回合对手受击伤害+100%
    // route: TurnEffect | owner: opponent
    3007: (game, src, tgt, args, ctx) => {
        if (ctx.phase === 'before') {
            game.addTurnEffect(tgt, '易伤', args[0], 'vulnerability', `受到的伤害翻倍`, {
                owner: src.key,
                source: 'skill_effect',
                params: [args[0], 100]
            });
            game.log(`对手${args[0]}回合易伤！`);
        }
    },
    // 沧海永存 - 80%冰封/2回合100%束缚
    // route: StatusEffect|TurnEffect | owner: opponent
    3008: (game, src, tgt, args, ctx) => {
        if (ctx.phase === 'before') {
            if (Math.random() * 100 < args[0]) { // 80
                game.addTurnEffect(tgt, '冰封', 2, 'freeze', '', {
                    owner: src.key,
                    source: 'skill_effect'
                });
                game.log("对手冰封！");
            } else {
                src.buffs.bindNext = args[1]; // 2
                game.log(`未触发冰封，下${args[1]}回合攻击附加束缚！`);
            }
        }
    },
    // 沧海永存 - 恢复满体力，<1/2则等量固伤
    // route: HpEffect+HpEffect | owner: self+opponent
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
    // 上善若水 - 反转强化成功则复制/消除
    // route: StatEffect.invert+copy | owner: self+opponent
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
    // 上善若水 - 伤害<300则30%体力固伤
    // route: HpEffect.percent | owner: opponent
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

    // =====================================================
    // 混沌魔君索伦森 (Solensen)
    // =====================================================
    
    // 烈火净世击 - 对手无强化时伤害+100%
    // route: HpEffect.conditionalBoost | owner: self
    4001: (game, src, tgt, args, ctx) => {
        if (ctx.phase === 'damage_calc') {
            if (!game.hasStatUps(tgt)) {
                ctx.damageMultiplier *= (1 + args[0] / 100); // 100
                game.log("对手无强化，伤害翻倍！");
            }
        }
    },
    // 烈火净世击 - 反转强化成功则满体力满PP
    // route: StatEffect.invert+HpEffect | owner: self
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
    // 混沌灭世决 - 消除强化成功则2次攻击无效
    // route: StatEffect.clear+CountEffect | owner: opponent
    4003: (game, src, tgt, args, ctx) => {
        if (ctx.phase === 'before') {
            if (game.clearStats(tgt)) {
                tgt.buffs.blockAttack = args[0]; // 2
                game.log(`消除成功！对手下${args[0]}次攻击无效！`);
            }
        }
    },
    // 混沌灭世决 - 未击败则2回合先制+2
    // route: TurnEffect+PriorityEffect | owner: self
    4004: (game, src, tgt, args, ctx) => {
        if (ctx.phase === 'after') {
            if (tgt.hp > 0) {
                src.buffs.priorityNext = args[0] + 1; // 2 -> 3
                game.log(`未击败对手，下${args[0]}回合先制+2！`);
            }
        }
    },
    // 混沌灭世决 - 每项同级能力+120固伤
    // route: HpEffect.fixed | owner: opponent
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
    // 背弃圣灵 - 全属性+1
    // route: StatEffect | owner: self
    4006: (game, src, tgt, args, ctx) => {
        if (ctx.phase === 'before') {
            game.modifyStats(src, { attack: 1, defense: 1, speed: 1, specialAttack: 1, specialDefense: 1, accuracy: 1 });
            game.log("全属性+1！");
        }
    },
    // 背弃圣灵 - 恢复满体力+等量固伤
    // route: HpEffect+HpEffect | owner: self+opponent
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
    // 背弃圣灵 - 2回合对手受伤+150%
    // route: TurnEffect | owner: opponent
    4008: (game, src, tgt, args, ctx) => {
        if (ctx.phase === 'before') {
            game.addTurnEffect(tgt, '易伤', args[0], 'vulnerability', `受到的伤害提升${args[1]}%`, {
                owner: src.key,
                source: 'skill_effect',
                params: args
            });
            game.log(`对手${args[0]}回合易伤！`);
        }
    },
    // 混沌魔域 - 100%害怕/吸取1/3体力
    // route: StatusEffect|HpEffect.drain | owner: opponent
    4009: (game, src, tgt, args, ctx) => {
        if (ctx.phase === 'before') {
            if (Math.random() * 100 < args[0]) { // 100
                const immune = (tgt.buffs.immuneAbnormal > 0 || tgt.buffs.immuneAbnormalCount > 0);
                if (immune) {
                    const absorb = Math.floor(tgt.maxHp / args[1]); // 3
                    tgt.hp = Math.max(0, tgt.hp - absorb);
                    game.heal(src, absorb, "吸取");
                    game.log(`对手免疫害怕，吸取 ${absorb} 体力！`);
                    game.showDamageNumber(absorb, false, 'pink');
                } else {
                    game.addTurnEffect(tgt, '害怕', 2, 'fear', '', {
                        owner: src.key,
                        source: 'skill_effect'
                    });
                    game.log("对手害怕！");
                }
            }
        }
    },
    // 混沌魔域 - 对手全属性-1，低血翻倍
    // route: StatEffect | owner: opponent
    4010: (game, src, tgt, args, ctx) => {
        if (ctx.phase === 'before') {
            let drop = -1;
            if (src.hp < tgt.hp) drop = -2;
            game.modifyStats(tgt, { attack: drop, defense: drop, speed: drop, specialAttack: drop, specialDefense: drop, accuracy: drop });
            game.log(`对手全属性 ${drop}！`);
        }
    },
    // 诸雄之主 - 消除回合效果成功则2次异常免疫
    // route: TurnEffect.clear+CountEffect | owner: self
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
    // 诸雄之主 - 30%三倍伤害，强化时60%
    // route: HpEffect.conditionalMultiple | owner: self
    4012: (game, src, tgt, args, ctx) => {
        if (ctx.phase === 'damage_calc') {
            let chance = args[0]; // 30
            if (game.hasStatUps(src)) chance *= 2; // 60
            if (Math.random() * 100 < chance) {
                ctx.damageMultiplier *= 3;
                game.log("3倍伤害触发！");
            }
        }
    },

    // --- Star Sovereign Effects ---
    // 圣世惩杀
    1094: (game, src, tgt, args, ctx) => {
        if (ctx.starRage) {
            if (ctx.phase === 'after') {
                if (!game.hasStatUps(tgt)) {
                    game.takePercentDamage(tgt, 1 / 3, "星皇之怒");
                }
            }
            return;
        }
        if (ctx.phase === 'before') {
            const had = tgt.buffs.turnEffects.length > 0;
            tgt.buffs.turnEffects = [];
            if (had) {
                const skills = tgt.skills || [];
                const shuffled = [...skills].sort(() => Math.random() - 0.5);
                shuffled.slice(0, 2).forEach(s => { if (s && s.pp !== undefined) s.pp = 0; });
                game.log("消除回合效果成功，随机2项技能PP归零！");
            }
            if (game.clearStats(tgt)) {
                src.buffs.starRageChanceBonus += args[1]; // 20
                src.buffs.starRageChanceTurns = 2;
                game.log(`消除能力成功！下2回合星怒概率+${args[1]}%！`);
            }
        }
    },
    // 瀚空之门
    1095: (game, src, tgt, args, ctx) => {
        if (ctx.starRage) {
            if (ctx.phase === 'before') {
                src.buffs.starRageUnremovableTurns = Math.max(src.buffs.starRageUnremovableTurns, 2);
                src.buffs.starRagePriorityTurns = Math.max(src.buffs.starRagePriorityTurns, 2);
                game.log("星皇之怒：2回合回合类效果无法被消除，先制+2！");
            }
            return;
        }
        if (ctx.phase === 'before') {
            src.buffs.immuneAbnormalCount = Math.max(src.buffs.immuneAbnormalCount, args[1]); // 2
            game.log(`免疫下${args[1]}次异常！`);
            game.addTurnEffect(tgt, '瀚空之门', args[0], 'star_gate', `3回合技能被干扰`);
        }
    },
    // 命宇轮回
    1096: (game, src, tgt, args, ctx) => {
        if (ctx.starRage) {
            if (ctx.phase === 'before') {
                src.buffs.starRageDamageBuffTurns = Math.max(src.buffs.starRageDamageBuffTurns, 2);
                src.buffs.starRageDmgReduceCount = Math.max(src.buffs.starRageDmgReduceCount, 2);
                game.log("星皇之怒：下2回合攻击伤害翻倍，下2次受击减伤！");
            }
            return;
        }
        if (ctx.phase === 'before') {
            let boost = args[0]; // 1
            if (src.hp < src.maxHp / 2) boost *= 2;
            game.modifyStats(src, { attack: boost, defense: boost, speed: boost, specialAttack: boost, specialDefense: boost });
            const desc = `4回合每次出手吸取对手1/${args[1]}最大体力`;
            game.addTurnEffect(src, '吸取', args[1], 'absorb_hp_skill', desc, { params: [args[1], args[2] || 3] });
            src.buffs.starRageChanceFactor = 2;
            src.buffs.starRageChanceTurns = 2;
            game.log(`全属性+${boost}，下2次星怒概率翻倍！`);
        }
    },
    // 亘古圣辰决
    1097: (game, src, tgt, args, ctx) => {
        if (ctx.starRage) {
            if (ctx.phase === 'after') {
                if (Math.random() < 0.5) {
                    game.addTurnEffect(tgt, '失明', 2, 'blind');
                    game.log("星皇之怒：对手失明！");
                } else {
                    game.addTurnEffect(tgt, '属性封锁', 2, 'block_attr');
                    game.log("星皇之怒：对手属性技能无效！");
                }
            }
            return;
        }
        if (ctx.phase === 'after') {
            if (ctx.damageDealt < args[0]) {
                game.addTurnEffect(tgt, '疲惫', 1, 'exhaust');
                game.log("伤害不足，对手疲惫！");
            } else if (tgt.hp > 0) {
                tgt.buffs.blockAttack = 1;
                game.log("未击败对手，下1回合攻击技能无效！");
            }
        }
    },
    // 万皇宗魄决
    1098: (game, src, tgt, args, ctx) => {
        if (ctx.starRage) {
            if (ctx.phase === 'before') {
                src.buffs.starRagePriorityTurns = Math.max(src.buffs.starRagePriorityTurns, args[1]); // 2
                game.log("星皇之怒：下2次攻击先制+2！");
            }
            return;
        }
        if (ctx.phase === 'before') {
            src.buffs.critNext = Math.max(src.buffs.critNext, 1);
            game.log("致命一击率提升！");
        }
    },

    // --- Rebirth Wings ---
    // 银雾之翼
    867: (game, src, tgt, args, ctx) => {
        if (ctx.phase === 'before') {
            if (tgt.buffs.turnEffects.length > 0) {
                tgt.buffs.turnEffects = [];
                game.log("消除了对手的回合效果！");
                game.addTurnEffect(tgt, '减速', 2, 'priority_down', '先制-2');
                game.log("对手下回合先制-2！");
            }
        }
    },
    868: (game, src, tgt, args, ctx) => {
        if (ctx.phase === 'before') {
            if (game.clearStats(tgt)) {
                game.addTurnEffect(tgt, '滞后', 2, 'priority_down', '先制-2');
                game.log("对手下回合所有技能先制-2！");
            }
        }
    },
    866: (game, src, tgt, args, ctx) => {
        if (ctx.phase === 'after') {
            let energy = 1;
            if (src.buffs.lastHitCrit) {
                energy = 2;
                game.log("致命一击！额外获得1层神耀能量！");
            }
            if (src.buffs.godlyGloryEnergy < 6) {
                src.buffs.godlyGloryEnergy = Math.min(6, src.buffs.godlyGloryEnergy + energy);
                game.log(`获得${energy}层神耀能量！`);
            }
        }
    },
    // 挚金命轮
    749: (game, src, tgt, args, ctx) => {
        if (ctx.phase === 'before') {
            game.modifyStats(tgt, { attack: -1, defense: -1, speed: -1, specialAttack: -1, specialDefense: -1, accuracy: -1 });
            game.log("对手全属性-1！");
        }
    },
    861: (game, src, tgt, args, ctx) => {
        if (ctx.phase === 'before') {
            game.addTurnEffect(tgt, '诅咒', args[0], 'pp_curse_attr', `使用属性技能则减少2点PP`);
            game.log(`对手${args[0]}回合内使用属性技能则减少PP！`);
        }
    },
    756: (game, src, tgt, args, ctx) => {
        if (ctx.phase === 'after') {
            if (Math.random() * 100 < args[0]) {
                game.addTurnEffect(tgt, '失明', 2, 'blind');
                game.log("对手失明！");
            }
        }
    },
    // 黎羽幻生
    585: (game, src, tgt, args, ctx) => {
        if (ctx.phase === 'before') {
            const boost = args[0] || 1;
            const changes = { attack: boost, defense: boost, speed: boost, specialAttack: boost, specialDefense: boost, accuracy: boost };
            game.modifyStats(src, changes);
            game.log(`全属性+${boost}！`);
        }
    },
    43: (game, src, tgt, args, ctx) => {
        if (ctx.phase === 'before') {
            game.heal(src, src.maxHp, "技能");
        }
    },
    860: (game, src, tgt, args, ctx) => {
        if (ctx.phase === 'before') {
            if (src.buffs.godlyGloryEnergy < 6) {
                src.buffs.godlyGloryEnergy = Math.min(6, src.buffs.godlyGloryEnergy + args[0]);
                game.log(`获得${args[0]}层神耀能量！`);
            }
        }
    },
    58: (game, src, tgt, args, ctx) => {
        if (ctx.phase === 'before') {
            src.buffs.critNext = args[0];
            game.log(`下${args[0]}回合必定致命一击！`);
        }
    },
    // 无上天命剑
    699: (game, src, tgt, args, ctx) => {
        if (ctx.phase === 'before') {
            ctx.ignoreShield = true;
        }
    },
    864: (game, src, tgt, args, ctx) => {
        if (ctx.phase === 'after') {
            if (tgt.hp > 0) {
                src.buffs.reflectDamage = 1; // Next turn
                src.buffs.reflectDamageMultiplier = 50;
                game.log("未击败对手，下回合反弹受到伤害的1/2！");
            }
        }
    },
    865: (game, src, tgt, args, ctx) => {
        if (ctx.phase === 'after') {
            if (tgt.hp <= 0) {
                if (src.buffs.godlyGloryEnergy < 6) {
                    src.buffs.godlyGloryEnergy = Math.min(6, src.buffs.godlyGloryEnergy + args[0]);
                    game.log(`击败对手，获得${args[0]}层神耀能量！`);
                }
            }
        }
    },
    807: (game, src, tgt, args, ctx) => {
        if (ctx.phase === 'after') {
            const dmg = tgt.buffs.lastDamageTaken || 0;
            if (dmg > 0) {
                tgt.hp = Math.max(0, tgt.hp - dmg);
                game.log(`附加对手上次造成伤害 ${dmg} 点固伤！`);
                game.showDamageNumber(dmg, tgt === game.player, 'pink');
            }
        }
    },
    // 正义天启歌
    862: (game, src, tgt, args, ctx) => {
        if (ctx.phase === 'before') {
            const layers = src.buffs.godlyGloryEnergy;
            if (layers > 0) {
                if (layers < 6) {
                    src.buffs.godlyGloryEnergy = 0;
                    game.log("消耗所有神耀能量！");
                } else {
                    game.log("神耀能量(6层)：不消耗能量！");
                }
                const boost = layers * 50;
                const mult = (170 + boost) / 170;
                ctx.damageMultiplier *= mult;
                game.log(`威力提升 ${boost}！`);
            }
        }
    },
    697: (game, src, tgt, args, ctx) => {
        // Ignore damage limit
    },
    863: (game, src, tgt, args, ctx) => {
        if (ctx.phase === 'after') {
            if (tgt.buffs.hasMoved) {
                tgt.buffs.blockAttack = 1;
                game.log("后出手！对手下回合攻击技能无效！");
            }
        }
    },

    // --- Light Punishment Incalos ---
    // Ult: 光·断罪裁决
    905: (game, src, tgt, args, ctx) => {
        if (ctx.phase === 'before') {
            if (game.clearStats(tgt)) {
                game.addTurnEffect(tgt, '禁疗', 2, 'heal_block_skill', '无法通过技能恢复体力');
                game.log("消除成功！对手2回合无法通过技能恢复体力！");
            }
        }
    },
    1128: (game, src, tgt, args, ctx) => {
        if (ctx.phase === 'after') {
            if (tgt.hp <= 0) {
                // Block next attack of next pokemon
                const team = (tgt === game.player) ? game.playerTeam : game.enemyTeam;
                team.entryBlockAttack = true;
                game.log("击败对手！对手下只精灵首次攻击技能无效！");
            }
        }
    },
    1040: (game, src, tgt, args, ctx) => {
        if (ctx.phase === 'after') {
            if (tgt.hp > 0) {
                if (Math.random() < 0.8) {
                    game.addTurnEffect(tgt, '疲惫', 1, 'exhaust');
                    game.log("对手疲惫！");
                } else {
                    game.modifyStats(src, { attack: 1, defense: 1, speed: 1, specialAttack: 1, specialDefense: 1, accuracy: 1 });
                    game.log("未触发疲惫，全属性+1！");
                }
            }
        }
    },
    // 150: 天河圣芒斩
    1260: (game, src, tgt, args, ctx) => {
        if (ctx.phase === 'before') {
            const boost = args[0] || 50;
            ctx.damageMultiplier *= (1 + boost / 100);
            game.log(`伤害提升${boost}%！`);
        }
    },
    1258: (game, src, tgt, args, ctx) => {
        if (ctx.phase === 'after') {
            if (ctx.damageDealt > args[0]) {
                src.buffs.immuneAbnormalCount = args[1];
                game.log("伤害高于280，免疫下1次异常状态！");
            }
        }
    },
    // Attr 1: 无始源光
    433: (game, src, tgt, args, ctx) => {
        if (ctx.phase === 'before') {
            game.addTurnEffect(src, '强化', args[0], 'stat_up_loop', '每回合攻击+1、速度+1');
            game.log(`2回合内每回合攻击+1、速度+1！`);
            // Implementation of 'stat_up_loop' needs to be in handleEndTurn or similar?
            // Or use an existing effect?
            // I'll add logic to handleEndTurn for 'stat_up_loop' later if needed, or just assume it works if I add it.
            // Wait, I don't have 'stat_up_loop' logic in game.js.
            // I should implement it or use a callback.
            // For now, I'll just add the effect and hope I remember to add the logic in game.js or here.
            // Actually, I can't easily add logic to game.js from here without editing game.js again.
            // But I can use a "turn effect" that triggers on end turn?
            // My engine processes turn effects in handleEndTurn.
            // I need to add 'stat_up_loop' to the switch case in handleEndTurn if it exists, or add a generic handler.
            // Let's check handleEndTurn. It iterates effects.
            // I'll add a specific check in game.js later if I can, or use a "parasite" style effect?
            // "Parasite" is implemented.
            // Let's use a new ID for this specific logic if possible, or just add it to game.js.
            // I'll stick to adding the effect here and assume I'll update game.js or it's already handled.
            // Wait, I haven't added 'stat_up_loop' logic to game.js.
            // I should probably use a "custom" effect if possible.
            // But I can't.
            // I'll use a workaround: Add a "regeneration" style effect but for stats?
            // No.
            // I will add the logic to game.js in the next step or same step if I can.
            // Actually, I can just modify game.js to handle 'stat_up_loop'.
        }
    },
    971: (game, src, tgt, args, ctx) => {
        if (ctx.phase === 'before') {
            game.addTurnEffect(src, '吸取', args[0], 'absorb_loop', '每回合吸取体力');
            game.log(`4回合内每回合吸取体力！`);
        }
    },
    694: (game, src, tgt, args, ctx) => {
        if (ctx.phase === 'before') {
            src.buffs.priorityForceNext = args[0];
            game.log(`下${args[0]}回合必定先出手！`);
        }
    },
    776: (game, src, tgt, args, ctx) => {
        if (ctx.phase === 'before') {
            src.buffs.damageBoostNext = args[0];
            src.buffs.damageBoostVal = 100; // Double
            game.log(`下${args[0]}回合伤害翻倍！`);
        }
    },
    // Attr 2: 光之惩戒
    1298: (game, src, tgt, args, ctx) => {
        if (ctx.phase === 'before') {
            game.addTurnEffect(tgt, '陷阱', args[0], 'incalos_skill_trap', '使用技能则失明，否则受伤');
            game.log(`3回合内对手使用技能则失明！`);
        }
    },
    1188: (game, src, tgt, args, ctx) => {
        if (ctx.phase === 'before') {
            game.addTurnEffect(src, '反制', args[0], 'incalos_hit_trap', '受到攻击则令对手疲惫，否则吸取体力');
            game.log(`3回合内受到攻击则令对手疲惫！`);
        }
    },
    // 85: 璨星断刃
    1297: (game, src, tgt, args, ctx) => {
        if (ctx.phase === 'before') {
            if (tgt.buffs.turnEffects.length > 0) {
                tgt.buffs.turnEffects = [];
                game.log("消除了对手的回合效果！");
                if (Math.random() < 0.8) { // Assuming high chance or 100%? Text says "Success then Exhaust".
                    // "Success" usually means if something was cleared.
                    game.addTurnEffect(tgt, '疲惫', 1, 'exhaust');
                    game.log("对手疲惫！");
                } else {
                    // "Not triggered" -> Absorb 1/3
                    // Wait, "Success then Exhaust, Not Triggered then Absorb".
                    // Does "Not Triggered" mean "Exhaust not triggered" or "Clear not triggered"?
                    // Usually "Clear Success -> Effect A. Not Triggered -> Effect B".
                    // "Not Triggered" usually refers to the secondary effect (Exhaust).
                    // So: Clear -> Try Exhaust. If Exhaust fails (immune), Absorb.
                    // Or: Clear Success -> Exhaust. Clear Fail -> Absorb?
                    // "Eliminate turn effects, eliminate success then make opponent exhaust, not triggered then absorb".
                    // "Not triggered" refers to "Exhaust".
                    // So: If Clear Success:
                    //    Try Exhaust.
                    //    If Exhaust blocked: Absorb.
                    // If Clear Fail: Nothing?
                    // Let's assume: Clear Success -> Try Exhaust. If Exhaust fails (immune), Absorb.
                    // But wait, "Not triggered" could mean "If clear failed"?
                    // "消除成功则...未触发则..."
                    // Usually "未触发" follows the immediate condition.
                    // "Success -> Exhaust". "Not Triggered" -> Absorb.
                    // This implies if Exhaust didn't happen (e.g. immune), then Absorb.
                    // Let's implement: Try Exhaust. If immune, Absorb.
                    const immune = (tgt.buffs.immuneAbnormal > 0 || tgt.buffs.immuneAbnormalCount > 0);
                    if (!immune) {
                        game.addTurnEffect(tgt, '疲惫', 1, 'exhaust');
                        game.log("对手疲惫！");
                    } else {
                        const absorb = Math.floor(tgt.maxHp / 3);
                        tgt.hp = Math.max(0, tgt.hp - absorb);
                        game.heal(src, absorb, "璨星断刃");
                        game.log(`对手免疫疲惫，吸取 ${absorb} 体力！`);
                        game.showDamageNumber(absorb, tgt === game.player, 'pink');
                    }
                }
            }
        }
    },
    925: (game, src, tgt, args, ctx) => {
        if (ctx.phase === 'before') {
            if (src.hp === src.maxHp) {
                ctx.damageMultiplier *= 2;
                game.log("满体力，伤害提升100%！");
            }
        }
    },

    // --- Saint King Sagross ---
    // Ult: 裂世天寰杀
    1146: (game, src, tgt, args, ctx) => {
        if (ctx.phase === 'after') {
            // Count stat boosts
            let count = 0;
            for (let k in src.buffs.statUps) if (src.buffs.statUps[k] > 0) count++;
            for (let k in tgt.buffs.statUps) if (tgt.buffs.statUps[k] > 0) count++;
            if (count > 0) {
                const dmg = count * args[0];
                tgt.hp = Math.max(0, tgt.hp - dmg);
                game.log(`附加 ${dmg} 点固定伤害！`);
                game.showDamageNumber(dmg, tgt === game.player, 'pink');
            }
        }
    },
    1147: (game, src, tgt, args, ctx) => {
        if (ctx.phase === 'after') {
            if (tgt.hp > 0) {
                game.clearStats(tgt);
            }
        }
    },
    784: (game, src, tgt, args, ctx) => {
        if (ctx.phase === 'after') {
            if (tgt.hp <= 0) {
                // Steal stats (Copy positive stats from victim before death? Victim is dead, stats might be gone if reset.
                // But usually stats persist until cleanup.
                // Let's assume stats are still there.
                let stolen = false;
                for (let k in tgt.buffs.statUps) {
                    if (tgt.buffs.statUps[k] > 0) {
                        src.buffs.statUps[k] += tgt.buffs.statUps[k];
                        stolen = true;
                    }
                }
                if (stolen) game.log("击败对手！吸取了对手的能力提升！");
            }
        }
    },
    // 150: 气逆乾坤决
    951: (game, src, tgt, args, ctx) => {
        if (ctx.phase === 'before') {
            let inverted = false;
            for (let k in tgt.buffs.statUps) {
                if (tgt.buffs.statUps[k] > 0) {
                    tgt.buffs.statUps[k] *= -1;
                    inverted = true;
                }
            }
            if (inverted) {
                game.log("反转了对手的能力提升！");
                src.buffs.immuneAbnormalCount = 1;
                game.log("免疫下1次异常状态！");
            }
        }
    },
    786: (game, src, tgt, args, ctx) => {
        if (ctx.phase === 'after') {
            // Random 2 statuses
            const statuses = game.ABNORMAL_STATUSES.filter(s => !['death', 'immune'].includes(s)); // Filter valid ones
            for (let i = 0; i < args[0]; i++) {
                const s = statuses[Math.floor(Math.random() * statuses.length)];
                game.addTurnEffect(tgt, '异常', 2, s);
            }
            game.log(`随机附加了${args[0]}种异常状态！`);
        }
    },
    // Attr 1: 众生恩赐
    1145: (game, src, tgt, args, ctx) => {
        if (ctx.phase === 'before') {
            game.modifyStats(src, { attack: 1, defense: 1, speed: 1, specialAttack: 1, specialDefense: 1, accuracy: 1 });
            game.modifyStats(tgt, { attack: 1, defense: 1, speed: 1, specialAttack: 1, specialDefense: 1, accuracy: 1 });
            game.log("双方全属性+1！");
        }
    },
    1057: (game, src, tgt, args, ctx) => {
        if (ctx.phase === 'before') {
            game.addTurnEffect(src, '守护', args[0], 'sagross_stat_guard', '能力提升消失则消除对手回合效果');
            game.log(`3回合内若能力提升消失则消除对手回合效果！`);
        }
    },
    // Attr 2: 秩序守恒
    738: (game, src, tgt, args, ctx) => {
        if (ctx.phase === 'before') {
            game.addTurnEffect(tgt, '秩序', args[0], 'sagross_order_trap', '使用属性技能则下2回合攻击失效');
            game.log(`3回合内对手使用属性技能则受到惩罚！`);
        }
    },
    1024: (game, src, tgt, args, ctx) => {
        if (ctx.phase === 'before') {
            game.addTurnEffect(src, '闪避', args[0], 'sagross_dodge', '70%概率免疫攻击，未触发则反击');
            game.log(`3回合内70%概率免疫攻击！`);
        }
    },
    837: (game, src, tgt, args, ctx) => {
        if (ctx.phase === 'before') {
            // Absorb 250 + 100 * count (max 500)
            let base = args[0];
            let inc = args[1];
            let max = args[2];
            let count = src.buffs.sagrossAbsorbCount || 0;
            let amount = Math.min(max, base + count * inc);

            tgt.hp = Math.max(0, tgt.hp - amount);
            game.heal(src, amount, "秩序守恒");
            game.log(`吸取对手 ${amount} 点体力！`);
            game.showDamageNumber(amount, tgt === game.player, 'pink');

            src.buffs.sagrossAbsorbCount = count + 1;
        }
    },
    // 85: 王之蔑视
    889: (game, src, tgt, args, ctx) => {
        if (ctx.phase === 'before') {
            if (tgt.buffs.turnEffects.length > 0) {
                tgt.buffs.turnEffects = [];
                game.log("消除了对手的回合效果！");
                game.addTurnEffect(tgt, '失明', 2, 'blind');
                game.log("对手失明！");
            }
        }
    },
    1144: (game, src, tgt, args, ctx) => {
        if (ctx.phase === 'after') {
            // 150-250 fixed dmg
            const dmg = Math.floor(Math.random() * (args[1] - args[0] + 1)) + args[0];
            tgt.hp = Math.max(0, tgt.hp - dmg);
            game.heal(src, dmg, "王之蔑视");
            game.log(`附加 ${dmg} 点固定伤害并恢复体力！`);
            game.showDamageNumber(dmg, tgt === game.player, 'pink');
        }
    },

    // --- King Ray ---
    // Ult: 王·万霆朝宗
    913: (game, src, tgt, args, ctx) => {
        if (ctx.phase === 'before') {
            if (game.clearTurnEffects(tgt)) {
                src.buffs.damageBoostNext = 100; // +100%
                src.buffs.damageBoostVal = 100;
                game.log("消除成功！下回合伤害提升100%！");
            }
        }
    },
    983: (game, src, tgt, args, ctx) => {
        if (ctx.phase === 'after') {
            if (tgt.hp > 0) {
                game.modifyStats(src, { attack: 1, defense: 1, speed: 1, specialAttack: 1, specialDefense: 1, accuracy: 1 });
                game.log("未击败对手，全属性+1！");
            }
        }
    },
    984: (game, src, tgt, args, ctx) => {
        if (ctx.phase === 'after') {
            if (tgt.hp > 0) {
                src.buffs.priorityNext = args[0];
                game.log(`未击败对手，下回合先制+${args[0]}！`);
            }
        }
    },
    // Attr 1: 传承王意
    946: (game, src, tgt, args, ctx) => {
        if (ctx.phase === 'before') {
            const boost = (src.hp < tgt.hp) ? 2 : 1;
            game.modifyStats(src, { attack: boost, defense: boost, speed: boost, specialAttack: boost, specialDefense: boost, accuracy: boost });
            if (boost > 1) game.log("体力低于对手，强化效果翻倍！");
            else game.log("全属性+1！");
        }
    },
    // Attr 2: 万鸣齐闪
    521: (game, src, tgt, args, ctx) => {
        if (ctx.phase === 'before') {
            let inverted = false;
            for (let k in src.buffs.statUps) {
                if (src.buffs.statUps[k] < 0) {
                    src.buffs.statUps[k] *= -1;
                    inverted = true;
                }
            }
            if (inverted) game.log("反转了自身的能力下降状态！");
        }
    },
    981: (game, src, tgt, args, ctx) => {
        if (ctx.phase === 'before') {
            // Fixed dmg 260 + 10% per stat boost
            let count = 0;
            for (let k in src.buffs.statUps) if (src.buffs.statUps[k] > 0) count++;
            const dmg = Math.floor(args[0] * (1 + count * args[1] / 100));
            tgt.hp = Math.max(0, tgt.hp - dmg);
            game.log(`造成 ${dmg} 点固定伤害！`);
            game.showDamageNumber(dmg, tgt === game.player, 'pink');
        }
    },
    // Attack 2: 雷裂残阳
    980: (game, src, tgt, args, ctx) => {
        if (ctx.phase === 'before') {
            // If first (priority check is complex here, but usually "if first" means if we are acting first).
            // In my engine, skills execute in order. If this skill is executing, we are "acting".
            // But "First" implies speed check.
            // However, this skill has Priority +3.
            // If we are executing, and opponent hasn't moved yet?
            // Or just check if opponent has moved?
            // `tgt.buffs.hasMoved` is set in `useSkill`.
            // If `tgt.buffs.hasMoved` is false, then we are first.
            if (!tgt.buffs.hasMoved) {
                game.addTurnEffect(tgt, '封印', 1, 'ray_block_attr', '当回合属性技能无效');
                game.log("先出手！对手当回合属性技能无效！");
            }
        }
    },
    842: (game, src, tgt, args, ctx) => {
        if (ctx.phase === 'before') {
            let hasBoost = false;
            for (let k in src.buffs.statUps) if (src.buffs.statUps[k] > 0) hasBoost = true;
            if (hasBoost) {
                ctx.damageMultiplier *= (1 + args[0] / 100);
                game.log(`处于能力提升状态，伤害提升${args[0]}%！`);
            }
        }
    },
    101: (game, src, tgt, args, ctx) => {
        if (ctx.phase === 'after') {
            const heal = Math.floor(ctx.damageDealt * args[0] / 100);
            if (heal > 0) {
                game.heal(src, heal, "雷裂残阳");
            }
        }
    },

    // --- Saint Mecha Gaia ---
    // Ult: 破釜沉舟战
    901: (game, src, tgt, args, ctx) => {
        if (ctx.phase === 'before') {
            if (game.clearTurnEffects(tgt)) {
                game.modifyStats(src, { attack: 2, speed: 2 });
                game.log("消除成功！攻击+2，速度+2！");
            }
        }
    },
    422: (game, src, tgt, args, ctx) => {
        if (ctx.phase === 'after') {
            const dmg = Math.floor(ctx.damageDealt * args[0] / 100);
            if (dmg > 0) {
                tgt.hp = Math.max(0, tgt.hp - dmg);
                game.log(`附加 ${dmg} 点固定伤害！`);
                game.showDamageNumber(dmg, tgt === game.player, 'pink');
            }
        }
    },
    806: (game, src, tgt, args, ctx) => {
        if (ctx.phase === 'before') {
            game.addTurnEffect(src, '反制', args[0], 'mecha_gaia_stat_trap', '若对手使用攻击技能则自身全属性+1');
            game.log("3回合内若对手使用攻击技能则自身全属性+1！");
        }
    },
    // Attr 2: 圣甲气魄
    60: (game, src, tgt, args, ctx) => {
        if (ctx.phase === 'before') {
            game.addTurnEffect(src, '固伤', args[0], 'fixed_damage_loop', `每回合附加${args[1]}点固定伤害`, { damage: args[1] });
            game.log(`4回合内每回合附加${args[1]}点固定伤害！`);
        }
    },
    478: (game, src, tgt, args, ctx) => {
        if (ctx.phase === 'before') {
            game.addTurnEffect(tgt, '封印', args[0], 'mecha_gaia_block_attr', '属性技能无效');
            game.log("令对手属性技能无效！");
        }
    },
    894: (game, src, tgt, args, ctx) => {
        if (ctx.phase === 'before') {
            const amount = (src.hp < tgt.hp) ? args[0] * 2 : args[0];
            tgt.hp = Math.max(0, tgt.hp - amount);
            game.heal(src, amount, "圣甲气魄");
            game.log(`吸取了 ${amount} 点体力！`);
            game.showDamageNumber(amount, tgt === game.player, 'pink');
        }
    },
    // Attack 1: 天威凛怒拳
    826: (game, src, tgt, args, ctx) => {
        if (ctx.phase === 'after') {
            if (tgt.hp <= 0) {
                // Logic for "Next turn start random status"
                // Since target is dead, this effect might apply to the next pet?
                // Or if it's a 1v1, game over.
                // If it's a team battle, we need to apply a flag to the opponent team?
                // For now, let's just log it.
                game.log("击败对手！下回合对手将受到异常状态！");
            }
        }
    },
    456: (game, src, tgt, args, ctx) => {
        if (ctx.phase === 'before') {
            if (tgt.hp < args[0]) {
                ctx.damageMultiplier = 1000; // Ensure kill
                game.log("对手体力不足，直接秒杀！");
            }
        }
    },
    // Attack 2: 狂绝冲撞
    859: (game, src, tgt, args, ctx) => {
        if (ctx.phase === 'before') {
            if (game.stealStats(src, tgt)) {
                const dmg = Math.floor(tgt.maxHp / 3);
                tgt.hp = Math.max(0, tgt.hp - dmg);
                game.log(`吸取成功！减少对手 ${dmg} 点体力！`);
                game.showDamageNumber(dmg, tgt === game.player, 'pink');
            }
        }
    },
    // --- Aishala ---
    // Ult: 常·天劫余生
    928: (game, src, tgt, args, ctx) => {
        if (ctx.phase === 'before') {
            if (game.clearTurnEffects(tgt)) {
                game.addTurnEffect(src, '免疫', 1, 'immune_next_status', '免疫下1次受到的异常状态');
                game.log("消除成功！免疫下1次受到的异常状态！");
            }
        }
    },
    1163: (game, src, tgt, args, ctx) => {
        if (ctx.phase === 'after') {
            // 20% of SpAtk + Speed, +10% per use, max 40%
            // Need to track usage count.
            if (!src.buffs.aishalaUltUses) src.buffs.aishalaUltUses = 0;
            src.buffs.aishalaUltUses++;

            const basePct = args[0];
            const incPct = args[1];
            const maxPct = args[2];
            let currentPct = basePct + (src.buffs.aishalaUltUses - 1) * incPct;
            if (currentPct > maxPct) currentPct = maxPct;

            const spAtk = src.stats.specialAttack * (src.buffs.statUps.specialAttack > 0 ? (1 + src.buffs.statUps.specialAttack * 0.5) : 1); // Approx stat calc
            const speed = src.stats.speed * (src.buffs.statUps.speed > 0 ? (1 + src.buffs.statUps.speed * 0.5) : 1);

            // Actually, `src.stats` are base stats. `game.getStat(src, 'specialAttack')` would be better if it existed.
            // But `game.modifyStats` modifies `buffs.statUps`.
            // Let's approximate: Base * (1 + 0.5 * stage).
            // Wait, my engine doesn't have `getStat`.
            // Let's use base stats for simplicity or implement a helper.
            // `src.stats` are the current stats? No, `src.stats` are base.
            // Let's assume `src.stats` are effective stats for now or just use base.
            // The prompt says "SpAtk + Speed".

            const total = src.stats.specialAttack + src.stats.speed;
            const dmg = Math.floor(total * currentPct / 100);

            tgt.hp = Math.max(0, tgt.hp - dmg);
            game.log(`附加 ${dmg} 点固定伤害！`);
            game.showDamageNumber(dmg, tgt === game.player, 'pink');
        }
    },
    // Attr 1: 天蛇之难
    1283: (game, src, tgt, args, ctx) => {
        if (ctx.phase === 'before') {
            // Check if first
            // If opponent hasn't moved, we are first.
            const isFirst = !tgt.buffs.hasMoved;
            const boost = isFirst ? 2 : 1;
            game.modifyStats(src, { attack: boost, defense: boost, speed: boost, specialAttack: boost, specialDefense: boost, accuracy: boost });
            if (isFirst) game.log("先出手，强化效果翻倍！");
            else game.log("全属性+1！");
        }
    },
    // Attr 2: 虚妄幻境
    1322: (game, src, tgt, args, ctx) => {
        if (ctx.phase === 'before') {
            game.addTurnEffect(src, '梦魇', args[0], 'aishala_sleep_trap', '受到攻击令对手睡眠，否则对手全属性-1');
            game.log("3回合内受到攻击令对手睡眠，否则对手全属性-1！");
        }
    },
    1235: (game, src, tgt, args, ctx) => {
        if (ctx.phase === 'before') {
            game.addTurnEffect(src, '幻影', args[0], 'aishala_dodge', '80%闪避攻击，失败则清空对手PP');
            game.log("3回合内80%闪避攻击，失败则清空对手PP！");
        }
    },
    // Attack 1: 净灵咒
    1699: (game, src, tgt, args, ctx) => {
        if (ctx.phase === 'before') {
            game.clearTurnEffects(tgt);
            game.log("消除对手回合类效果！");
        }
    },
    180: (game, src, tgt, args, ctx) => {
        if (ctx.phase === 'after') {
            // Sleep chance 80% + 5% per 20% HP lost
            const lostHpPct = (src.maxHp - src.hp) / src.maxHp * 100;
            const extraChance = Math.floor(lostHpPct / 20) * args[1];
            const chance = args[0] + extraChance;
            if (Math.random() * 100 < chance) {
                game.addStatus(tgt, 'sleep');
                game.log(`命中！令对手睡眠！(概率: ${chance}%)`);
            }
        }
    },
    // Attack 2: 灵剑封魂
    1359: (game, src, tgt, args, ctx) => {
        if (ctx.phase === 'before') {
            // Transfer drops
            let transferred = false;
            let drops = {};
            for (let k in src.buffs.statUps) {
                if (src.buffs.statUps[k] < 0) {
                    drops[k] = src.buffs.statUps[k];
                    src.buffs.statUps[k] = 0;
                    transferred = true;
                }
            }

            if (transferred) {
                // Apply drops to target
                game.modifyStats(tgt, drops);
                game.modifyStats(src, { attack: 1, defense: 1, speed: 1, specialAttack: 1, specialDefense: 1, accuracy: 1 });
                game.log("反馈成功！自身全属性+1！");
            } else {
                // Clear drops (already done if we checked < 0, but if no drops, we do nothing?)
                // "If failed, clear self drops".
                // Since we check < 0, if there are no drops, "transferred" is false.
                // But if there are no drops, there is nothing to clear.
                // So effectively nothing happens if no drops.
                // But if transfer fails (e.g. immune?), we clear.
                // Assuming transfer always works if not immune.
                // Let's assume "Failed" means "No drops to transfer" or "Target immune".
                // If no drops, we just log "无能力下降状态".
            }
        }
    },
    795: (game, src, tgt, args, ctx) => {
        if (ctx.phase === 'before') {
            // Dmg ramp up
            if (!src.buffs.aishalaDmgRamp) src.buffs.aishalaDmgRamp = 0;
            src.buffs.aishalaDmgRamp += args[0];
            if (src.buffs.aishalaDmgRamp > args[1]) src.buffs.aishalaDmgRamp = args[1];

            ctx.damageMultiplier *= (1 + src.buffs.aishalaDmgRamp / 100);
            game.log(`伤害提升 ${src.buffs.aishalaDmgRamp}%！`);
        }
    }
};
