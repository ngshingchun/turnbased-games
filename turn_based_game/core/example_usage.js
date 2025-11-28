/**
 * Example Usage - 新架构使用示例
 * 
 * 展示 FUNC.SUBFUNC(node(s), handler) 格式的使用方式
 * 以及 BattleEngine 的 6v6 队伍战斗
 */
(() => {
    const NODE = window.TurnPhaseNode;

    // =========================================================================
    // 示例1: 使用独立系统创建效果
    // =========================================================================

    /**
     * 在伤害节点造成100威力攻击
     */
    const attackEffect = window.DAMAGE?.ATTACK(
        [NODE.FIRST_DEAL_DAMAGE, NODE.SECOND_DEAL_DAMAGE],
        { power: 100, special: false }
    );

    /**
     * 在技能效果节点给对手施加2回合灼烧
     */
    const burnEffect = window.TURN?.BURN(
        [NODE.FIRST_SKILL_EFFECT, NODE.SECOND_SKILL_EFFECT],
        { turns: 2, damage: 50, target: 'opponent' }
    );

    /**
     * 在攻击后节点恢复自身15%HP
     */
    const drainEffect = window.HP?.HEAL_PERCENT(
        [NODE.FIRST_AFTER_ATTACK, NODE.SECOND_AFTER_ATTACK],
        { percent: 15, source: 'drain', target: 'self' }
    );

    /**
     * 在回合开始给自身+2攻击
     */
    const buffEffect = window.STATS?.MODIFY(
        [NODE.TURN_START],
        { changes: { attack: 2 }, target: 'self' }
    );

    // =========================================================================
    // 示例2: 使用技能构建器
    // =========================================================================

    const fireBlast = window.skill?.('烈焰风暴')
        .pp(15)
        .power(150)
        .type('fire')
        .special()
        .damage({ nodes: [NODE.FIRST_DEAL_DAMAGE, NODE.SECOND_DEAL_DAMAGE] })
        .status('burn', 2, { 
            nodes: [NODE.FIRST_SKILL_EFFECT, NODE.SECOND_SKILL_EFFECT],
            chance: 50 
        })
        .build();

    const healingLight = window.skill?.('治愈之光')
        .pp(20)
        .type('light')
        .healPercent(30, { nodes: [NODE.FIRST_SKILL_EFFECT, NODE.SECOND_SKILL_EFFECT] })
        .stats({ defense: 1, spDefense: 1 }, { 
            nodes: [NODE.FIRST_SKILL_EFFECT, NODE.SECOND_SKILL_EFFECT] 
        })
        .build();

    // =========================================================================
    // 示例3: 使用精灵构建器
    // =========================================================================

    const testSpirit = window.spirit?.('测试精灵')
        .type('fire')
        .stats(1000, 120, 100, 150, 100, 110)
        .skill(fireBlast)
        .skill(healingLight)
        .passive('战斗意志', NODE.TURN_START, (ctx) => {
            if (ctx.self.hp.percent < 50) {
                ctx.self.stats.modify({ attack: 1 });
                return { buffed: true };
            }
        })
        .soulBuff({
            name: '烈火魂',
            desc: '攻击时有30%几率灼烧对手',
            effects: [{
                id: 'fire_soul_burn',
                nodes: [NODE.FIRST_AFTER_ATTACK, NODE.SECOND_AFTER_ATTACK],
                condition: (ctx) => ctx.target.turnFlags.damageDealt > 0,
                execute: (ctx) => {
                    if (Math.random() < 0.3) {
                        ctx.opponent.status.apply('burn', '灼烧', 2);
                        return { applied: true };
                    }
                    return { applied: false };
                }
            }]
        })
        .build();

    // =========================================================================
    // 示例4: 创建6v6队伍战斗
    // =========================================================================

    function createTeamBattle() {
        // 定义A队6只精灵
        const teamA = [
            { name: '火焰龙', maxHp: 1000, attack: 120, speed: 100 },
            { name: '水精灵', maxHp: 900, attack: 100, speed: 110 },
            { name: '雷电兽', maxHp: 800, attack: 140, speed: 130 },
            { name: '岩石魔', maxHp: 1200, defense: 150, speed: 60 },
            { name: '风之鸟', maxHp: 750, attack: 110, speed: 150 },
            { name: '暗影龙', maxHp: 950, spAttack: 130, speed: 105 }
        ];

        // 定义B队6只精灵
        const teamB = [
            { name: '冰霜巨人', maxHp: 1100, defense: 130, speed: 70 },
            { name: '光明使者', maxHp: 850, spAttack: 140, speed: 120 },
            { name: '毒蛇王', maxHp: 800, attack: 115, speed: 125 },
            { name: '钢铁战士', maxHp: 1300, defense: 160, speed: 50 },
            { name: '幻影忍者', maxHp: 700, attack: 135, speed: 145 },
            { name: '圣光天使', maxHp: 1000, spDefense: 140, speed: 100 }
        ];

        // 创建战斗引擎
        const engine = window.createBattleEngine?.({
            logEnabled: true,
            onLog: (msg) => console.log('[Battle]', msg),
            onNodeExecute: (node, ctx) => {
                console.log(`[Node] ${window.TurnPhaseNames?.[node] || node}`);
            }
        });

        // 初始化队伍
        engine?.initTeams(teamA, teamB);

        return engine;
    }

    // =========================================================================
    // 示例5: 执行战斗流程 (每个节点都可以输入指令)
    // =========================================================================

    async function runBattleWithHandlers() {
        const engine = createTeamBattle();
        if (!engine) return;

        // 执行登场流程 (Nodes 1-5)
        await engine.executeEntry({
            // Node 1: 换人阶段
            [NODE.SWITCH_IN_PHASE]: async (ctx) => {
                console.log('Node 1: 双方精灵登场');
            },
            
            // Node 2: 登场速度判定
            [NODE.ON_ENTRY_SPEED]: async (ctx) => {
                console.log('Node 2: 判定登场速度');
            },
            
            // Node 3: 登场后
            [NODE.AFTER_ENTRY]: async (ctx) => {
                console.log('Node 3: 登场后效果');
            },
            
            // Node 4: 精灵行动阶段
            [NODE.SPIRIT_ACTION_PHASE]: async (ctx) => {
                console.log('Node 4: 精灵准备行动');
            },
            
            // Node 5: 登场时
            [NODE.ON_ENTRY]: async (ctx) => {
                console.log('Node 5: 触发登场效果');
                // 示例: 登场时给自己加速
                window.STATS?.MODIFY([NODE.ON_ENTRY], { 
                    changes: { speed: 1 } 
                }).execute({ ...ctx, target: ctx.stateA });
            }
        });

        // 设置双方输入
        engine.input.setAction('A', { type: 'skill', skillIndex: 0 });
        engine.input.setAction('B', { type: 'skill', skillIndex: 0 });

        // 执行完整回合 (Nodes 6-30)
        await engine.executeTurn({
            // Node 6: 回合开始
            [NODE.TURN_START]: async (ctx) => {
                console.log('Node 6: 回合开始');
            },
            
            // Node 7: 战斗阶段开始
            [NODE.BATTLE_PHASE_START]: async (ctx) => {
                console.log('Node 7: 决定先后手');
            },
            
            // Node 13: 先手造成伤害
            [NODE.FIRST_DEAL_DAMAGE]: async (ctx) => {
                console.log('Node 13: 先手造成伤害');
                // 这里可以注入自定义伤害计算
            },
            
            // Node 29: 回合结束
            [NODE.TURN_END]: async (ctx) => {
                console.log('Node 29: 回合结束');
            }
        });

        return engine;
    }

    // =========================================================================
    // 示例6: 组合效果
    // =========================================================================

    // 组合多个效果
    const comboEffect = window.combine?.(
        window.DAMAGE?.ATTACK([NODE.FIRST_DEAL_DAMAGE], { power: 80 }),
        window.HP?.DRAIN([NODE.FIRST_AFTER_ATTACK], { ratio: 0.5 })
    );

    // 条件效果: HP低于50%时触发
    const emergencyHeal = window.when?.(
        (ctx) => ctx.self.hp.percent < 50,
        window.HP?.HEAL_PERCENT([NODE.TURN_END], { percent: 10 })
    );

    // 30%几率效果
    const luckyHit = window.chance?.(30,
        window.DAMAGE?.ATTACK([NODE.FIRST_DEAL_DAMAGE], { power: 200, crit: true })
    );

    // =========================================================================
    // 示例7: 魂印定义
    // =========================================================================

    window.SOULBUFF?.define('fire_dragon', '炎龙魂', '攻击后有几率灼烧对手', [
        window.SOULBUFF?.EFFECT(
            'burn_on_attack',
            [NODE.FIRST_AFTER_ATTACK, NODE.SECOND_AFTER_ATTACK],
            (ctx) => ctx.self.turnFlags.damageDealt > 0,
            (ctx) => {
                if (Math.random() < 0.3) {
                    ctx.opponent.status.apply('burn', '灼烧', 2);
                    ctx.engine?.log(`${ctx.opponent.name} 被灼烧了！`);
                    return { success: true };
                }
                return { success: false };
            },
            { priority: 10 }
        )
    ]);

    // =========================================================================
    // 导出示例
    // =========================================================================
    
    window.ExampleUsage = {
        attackEffect,
        burnEffect,
        drainEffect,
        buffEffect,
        fireBlast,
        healingLight,
        testSpirit,
        createTeamBattle,
        runBattleWithHandlers,
        comboEffect,
        emergencyHeal,
        luckyHit
    };

    console.log('[ExampleUsage] 示例加载完成');
})();
