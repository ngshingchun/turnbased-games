/**
 * CountEffect - 计数效果注册表
 * 处理所有基于次数的效果：每次使用递减，归零移除
 * SkillEffect 和其他效果模块会路由到这里
 */
(() => {
    const registry = {};

    /**
     * 注册计数效果处理器
     */
    function register(key, handler) {
        if (!key || typeof handler !== 'function') return;
        registry[key] = handler;
    }

    /**
     * 执行计数效果
     */
    function run(key, game, payload) {
        if (registry[key]) {
            registry[key](game, payload);
        }
    }

    /**
     * 消耗计数并检查是否触发
     * @returns {boolean} 是否触发效果
     */
    function consume(game, char, buffKey, amount = 1) {
        if (char.buffs[buffKey] > 0) {
            char.buffs[buffKey] = Math.max(0, char.buffs[buffKey] - amount);
            game.updateUI();
            
            // 触发消耗事件
            if (registry[`${buffKey}_consume`]) {
                registry[`${buffKey}_consume`](game, { char, remaining: char.buffs[buffKey] });
            }
            
            return true;
        }
        return false;
    }

    /**
     * 检查计数是否存在
     */
    function has(char, buffKey) {
        return char.buffs[buffKey] > 0;
    }

    /**
     * 获取计数值
     */
    function get(char, buffKey) {
        return char.buffs[buffKey] || 0;
    }

    /**
     * 设置计数值
     */
    function set(game, char, buffKey, value) {
        char.buffs[buffKey] = value;
        game.updateUI();
    }

    /**
     * 增加计数值
     */
    function add(game, char, buffKey, amount = 1, max = Infinity) {
        char.buffs[buffKey] = Math.min(max, (char.buffs[buffKey] || 0) + amount);
        game.updateUI();
        
        if (registry[`${buffKey}_add`]) {
            registry[`${buffKey}_add`](game, { char, amount, current: char.buffs[buffKey] });
        }
    }

    // ========== 内置计数效果处理器 ==========

    // 护盾消耗
    register('shield_consume', (game, { char, remaining }) => {
        game.log(`${char.name} 的护盾抵挡了攻击！(剩余${remaining}次)`);
    });

    // 伤害反弹消耗
    register('reflectDamage_consume', (game, { char, remaining }) => {
        if (remaining === 0) {
            char.buffs.reflectDamageMultiplier = 100;
        }
    });

    // 伤害提升消耗
    register('damageBoostNext_consume', (game, { char, remaining }) => {
        const boostVal = char.buffs.damageBoostVal || 100;
        game.log(`伤害提升生效 (+${boostVal}%)！`);
        if (remaining === 0) {
            char.buffs.damageBoostVal = 100;
        }
    });

    // 封锁攻击消耗
    register('blockAttack_consume', (game, { char, remaining }) => {
        game.log(`${char.name} 的攻击技能被封锁！(剩余${remaining}次)`);
    });

    // 封锁属性消耗
    register('blockAttribute_consume', (game, { char, remaining }) => {
        game.log(`${char.name} 的属性技能被封锁！(剩余${remaining}次)`);
    });

    // 免疫异常次数消耗
    register('immuneAbnormalCount_consume', (game, { char, remaining }) => {
        game.log(`${char.name} 免疫了异常状态！(剩余${remaining}次)`);
    });

    // 星皇减伤消耗
    register('starRageDmgReduceCount_consume', (game, { char, remaining }) => {
        game.log(`星皇之怒减伤生效！(剩余${remaining}次)`);
    });

    // 怒涛沧岚伤害叠加
    register('damageStack_add', (game, { char, amount, current }) => {
        game.log(`魂印触发！伤害叠加至${current}层！`);
        game.showFloatingText("魂印: 叠加", char === game.player);
    });

    // 重生之翼能量叠加
    register('godlyGloryEnergy_add', (game, { char, amount, current }) => {
        game.log(`获得${amount}层神耀能量！(当前${current}层)`);
    });

    // Agnes 致命残留
    register('agnesFatalCount_consume', (game, { char, remaining }) => {
        game.log(`魂印触发！致命残留！(剩余${remaining}次)`);
    });

    // 星皇不减半
    register('starRageNoHalveCount_consume', (game, { char, remaining }) => {
        game.log(`致命一击触发！星怒不减半！`);
    });

    // 索伦森属性封锁光环
    register('solensenAttrBlockAura_consume', (game, { char, remaining }) => {
        game.log(`【魂印】源：对手属性技能被封锁！`);
    });

    // Sagross 吸取递增
    register('sagrossAbsorbCount_add', (game, { char, amount, current }) => {
        // 无特殊日志
    });

    // ========== 新增计数效果处理器 ==========

    // 伤害免疫（怒涛沧岚）
    register('damageImmunity_consume', (game, { char, remaining }) => {
        game.log(`${char.name} 的水之庇护抵挡了伤害！(剩余${remaining}次)`);
        game.showFloatingText("免疫伤害", char === game.player);
    });

    // 攻击免疫
    register('attackImmunityCount_consume', (game, { char, remaining }) => {
        game.log(`${char.name} 免疫了攻击！(剩余${remaining}次)`);
        game.showFloatingText("免疫攻击", char === game.player);
    });

    // 异常免疫次数（英卡洛斯等）
    register('immuneAbnormalCount_consume', (game, { char, remaining }) => {
        game.log(`${char.name} 免疫了异常状态！(剩余${remaining}次)`);
    });

    // 必致命次数
    register('critNext_consume', (game, { char, remaining }) => {
        game.log(`致命一击触发！(剩余${remaining}次)`);
    });

    // 英卡洛斯圣光祝福伤害加成
    register('incalosBlessingBoostCount_consume', (game, { char, remaining }) => {
        game.log(`【圣光祝福】伤害+150%！(剩余${remaining}次)`);
    });

    // 星皇先制次数
    register('starRagePriorityCount_consume', (game, { char, remaining }) => {
        game.log(`【星皇之怒】先制+2生效！(剩余${remaining}次)`);
    });

    // 星皇怒威力不减半
    register('starRageNoHalveCount_consume', (game, { char, remaining }) => {
        game.log(`【星皇之怒】威力不减半！(剩余${remaining}次)`);
    });

    // 索伦森属性封锁光环
    register('solensenAttrBlockAura_consume', (game, { char, remaining }) => {
        game.log(`【魂印·源】对手属性技能被封锁！(剩余${remaining}次)`);
    });

    // 伤害提升次数
    register('damageBoostNext_consume', (game, { char, remaining }) => {
        const boostVal = char.buffs.damageBoostVal || 100;
        game.log(`伤害提升+${boostVal}%生效！(剩余${remaining}次)`);
        if (remaining === 0) {
            char.buffs.damageBoostVal = 0;
        }
    });

    // 强制先制次数
    register('priorityForceNext_consume', (game, { char, remaining }) => {
        game.log(`强制先出手生效！(剩余${remaining}回合)`);
    });

    // 束缚附加次数
    register('bindNext_consume', (game, { char, remaining }) => {
        game.log(`攻击附加束缚！(剩余${remaining}次)`);
    });

    // 重生之翼击败先制
    register('rebirthWingsResetPriority_consume', (game, { char, remaining }) => {
        game.log(`【神耀清算】先制+3生效！(剩余${remaining}回合)`);
    });

    // 圣甲盖亚拦截伤害
    register('mechaGaiaInterceptDamage_add', (game, { char, amount, current }) => {
        game.log(`【魂印·狂】记录拦截伤害：${current}`);
    });

    // 艾夏拉伤害递增
    register('aishalaDmgRamp_add', (game, { char, amount, current }) => {
        game.log(`【灵剑封魂】伤害递增至+${current}%`);
    });

    window.CountEffect = { 
        register, 
        run, 
        consume, 
        has, 
        get, 
        set, 
        add 
    };
})();
