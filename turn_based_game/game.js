class Game {
    constructor() {
        // --- Character Data Definitions ---
        this.charData = this.buildCharDataFromRegistry();

        // --- Team Setup ---
        // Randomize Teams (2v2)
        const charKeys = Object.keys(this.charData);
        // Fisher-Yates Shuffle
        for (let i = charKeys.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [charKeys[i], charKeys[j]] = [charKeys[j], charKeys[i]];
        }

        const half = Math.floor(charKeys.length / 2);
        this.playerTeam = charKeys.slice(0, half).map(key => JSON.parse(JSON.stringify(this.charData[key])));
        this.enemyTeam = charKeys.slice(half, half * 2).map(key => JSON.parse(JSON.stringify(this.charData[key])));

        this.activePlayerIndex = 0;
        this.activeEnemyIndex = 0;
        this.isPlayerTurn = true;
        this.isBusy = false;
        this.turnCount = 0;
        this.items = { pp_potion: 5, hp_potion: 3 };
        this.playerHasStar = this.playerTeam.some(c => this.isStarSovereign(c));
        this.enemyHasStar = this.enemyTeam.some(c => this.isStarSovereign(c));
        this.starRageWindow = { active: false, attacker: null };

        this.ui = {
            playerHpBar: document.getElementById('player-hp-bar'),
            playerHpText: document.getElementById('player-hp-text'),
            enemyHpBar: document.getElementById('enemy-hp-bar'),
            enemyHpText: document.getElementById('enemy-hp-text'),
            log: document.getElementById('battle-log'),
            playerSprite: document.getElementById('player-sprite'),
            enemySprite: document.getElementById('enemy-sprite'),
            damageOverlay: document.getElementById('damage-overlay'),
            tooltip: document.getElementById('tooltip'),

            // playerBuffs/enemyBuffs removed in favor of status rows
            bagModal: document.getElementById('bag-modal'),
            switchModal: document.getElementById('switch-modal'),
            teamList: document.getElementById('team-list'),
            playerName: document.querySelector('.player-status .name-tag'),
            enemyName: document.querySelector('.enemy-status .name-tag'),
            playerAvatar: document.querySelector('.player-status .avatar'),
            enemyAvatar: document.getElementById('enemy-avatar'),
            soulMark: document.getElementById('soul-mark'),
            playerPokemonCount: document.getElementById('player-pokemon-count'),
            enemyPokemonCount: document.getElementById('enemy-pokemon-count'),
            skillsGrid: document.querySelector('.skills-grid-container'),
            skillsLeft: document.querySelector('.skills-left-container')
        };
        this.ui.itemCountPP = document.getElementById('item-count-pp');
        this.ui.itemCountHP = document.getElementById('item-count-hp');
        this.updateItemCounts();

        this.EFFECT_DEFS = {
            'poison': { name: '中毒', desc: '每回合扣除1/8最大体力' },
            'burn': { name: '烧伤', desc: '攻击威力减少50%，每回合扣除1/8最大体力' },
            'immolate': { name: '焚烬', desc: '无法行动，结束后转化为烧伤并命中-1' },
            'sleep': { name: '睡眠', desc: '无法行动' },
            'paralyze': { name: '麻痹', desc: '无法行动' },
            'freeze': { name: '冰冻', desc: '无法行动' },
            'fear': { name: '害怕', desc: '无法行动' },
            'silence': { name: '沉默', desc: '每回合扣除1/8最大体力，无法使用第五技能' },
            'immune_cc': { name: '免控', desc: '免疫异常状态' },
            'immune_stat_drop': { name: '免弱', desc: '免疫能力下降' },
            'immune_stat_up': { name: '封强', desc: '无法进行能力提升' },
            'water_curse': { name: '水厄', desc: '每回合受到固伤，层数越高伤害越高' },
            'reflect_status': { name: '反弹', desc: '反弹受到的异常状态' },
            'bind': { name: '束缚', desc: '无法切换精灵，回合结束受到伤害' },
            'regen': { name: '再生', desc: '每回合恢复体力' },
            'block_attr': { name: '封属', desc: '无法使用属性技能' },
            'heal_block': { name: '禁疗', desc: '无法恢复体力' },
            'fire_core': { name: '火核', desc: '每回合恢复体力并造成固伤' },
            'block_attack': { name: '封攻', desc: '无法使用攻击技能' },
            // New from gamemechan.txt
            'frostbite': { name: '冻伤', desc: '每回合扣除1/8最大体力' },
            'bleed': { name: '流血', desc: '每回合扣除80点体力' },
            'exhaust': { name: '疲惫', desc: '无法行动' },
            'petrify': { name: '石化', desc: '无法行动' },
            'confuse': { name: '混乱', desc: '5%概率扣除50体力，攻击命中率减少80%' },
            'weaken': { name: '衰弱', desc: '受到的攻击伤害随层级提升' },
            'parasite': { name: '寄生', desc: '每回合吸取1/8最大体力' },
            'infect': { name: '感染', desc: '无法行动，结束后转化为中毒、攻特攻-1' },
            'daze': { name: '失神', desc: '属性技能50%无效' },
            'paralysis': { name: '瘫痪', desc: '无法主动切换' },
            'blind': { name: '失明', desc: '攻击技能50%miss，必中技能50%失效' },
            'flammable': { name: '易燃', desc: '攻击命中率降低30%，受火攻转烧伤' },
            'curse': { name: '诅咒', desc: '无法行动，结束后转化为诅咒效果' },
            'curse_fire': { name: '烈焰诅咒', desc: '每回合受到1/8最大体力伤害' },
            'curse_fatal': { name: '致命诅咒', desc: '受到的攻击伤害提升50%' },
            'curse_weak': { name: '虚弱诅咒', desc: '造成的攻击伤害降低50%' },
            'submit': { name: '臣服', desc: '无法造成任何伤害' },
            'stagnant': { name: '凝滞', desc: '无法切换，免疫控制' }
        };

        this.ABNORMAL_STATUSES = [
            'poison', 'frostbite', 'burn', 'immolate', 'bleed', 'paralyze', 'exhaust', 'fear', 'sleep', 'petrify',
            'confuse', 'weaken', 'parasite', 'infect', 'bind', 'daze', 'freeze', 'paralysis', 'blind',
            'flammable', 'curse', 'curse_fire', 'curse_fatal', 'curse_weak', 'silence', 'submit', 'stagnant',
            'block_attr', 'heal_block'
        ];

        this.CONTROL_STATUSES = ['sleep', 'paralyze', 'freeze', 'fear', 'exhaust', 'petrify', 'curse', 'immolate', 'infect'];
        this.SWITCH_BLOCK_STATUSES = ['bind', 'paralysis', 'stagnant'];

        // --- Phase Engine / Soul Mark hooks ---
        this.timeline = new PhaseEngine(this);
        this.registerSpiritPhases();
        // --- Damage routing ---
        this.damageSystem = new DamageSystem(this);

        this.initBattle();
    }

    buildCharDataFromRegistry() {
        const defs = window.SPIRIT_DEFS || [];
        const map = {};
        defs.forEach(def => {
            const clone = JSON.parse(JSON.stringify(def));
            clone.hp = clone.maxHp;
            clone.buffs = this.createBuffs();
            map[def.key] = clone;
        });
        return map;
    }

    registerSpiritPhases() {
        const registry = window.SPIRIT_PHASE_REGISTRY || [];
        registry.forEach(entry => {
            if (entry && typeof entry.register === 'function') {
                entry.register(this.timeline, this);
            }
        });
    }

    createBuffs() {
        return {
            statUps: { attack: 0, defense: 0, speed: 0, specialAttack: 0, specialDefense: 0, accuracy: 0 },
            // Special flags and counters
            shield: 0, // Block next damage
            reflectDamage: 0, // Turns
            reflectDamageMultiplier: 100, // Percent multiplier for reflected damage
            critNext: 0, // Turns
            priorityNext: 0, // Turns
            priorityForceNext: 0, // Turns (guaranteed first)
            priorityNext: 0, // Turns
            priorityForceNext: 0, // Turns (guaranteed first)
            damageBoostNext: 0, // Turns
            damageBoostVal: 100, // Percent (100 = +100% = 2x)
            starGraceApplied: false, // Flag to avoid重复施加星皇之佑
            hasStarGift: false, // 队伍是否享受星皇之赐
            immuneAbnormal: 0, // Turns
            immuneAbnormalCount: 0, // Count (Solensen)
            immuneStatDrop: 0, // Turns

            // Turn-based Status Effects (Debuffs/CC)
            turnEffects: [], // Array of { name: string, turns: number, type: 'buff'|'debuff'|'control' }

            // Surging Canglan Specific
            shieldHp: 0, // Value based shield
            damageStack: 0, // Damage boost stack (0-4)
            tookDamage: false, // Flag for turn damage
            bindNext: 0, // Next attacks apply bind
            vulnerability: 0, // Damage taken increased

            // Solensen Specific
            blockAttribute: 0, // Count: Block next attribute skill
            blockAttack: 0, // Count: Block next attack skill
            solensenStatBlockAura: 0, // Turns: Opponent cannot stat up (Bound to Solensen)
            solensenAttrBlockAura: 0, // Count: Opponent next attribute skill fails (Bound to Solensen)
            solensenGuardReduction: false, // Current turn: 50% damage reduction
            solensenGuardImmune: false, // Current turn: 50% chance to immune attack damage

            // Star Sovereign Specific
            starRageChanceBonus: 0, // Extra percentage to trigger star rage
            starRageChanceTurns: 0,
            starRageChanceFactor: 1, // Multiplier for star rage chance
            starRageDamageBuffTurns: 0, // Turns attack damage doubled (star rage buff)
            starRageDmgReduceCount: 0, // Next attacks taken -50% (count)
            starRagePriorityTurns: 0, // +2 priority to all skills
            starRageUnremovableTurns: 0, // Turn effects cannot be dispelled
            starRageNoHalveCount: 0, // Next star rage not halved (from crit trigger)

            // Agnes State
            agnesState: null, // 'dominance' (HP > Enemy) or 'fortitude' (HP <= Enemy)
            agnesShield: false,
            agnesTriggered: false, // Did Effect 2 trigger?
            agnesFatalCount: 1, // Effect 1 count

            // Rebirth Wings Specific
            godlyGloryEnergy: 0, // 0-6 layers
            rebirthWingsResetPriority: 0, // +3 priority next turn after reset
            rebirthWingsRevived: false, // Flag to ensure revive only happens once per battle per unit? Or just once per death.

            // Incalos Specific
            incalosBlessingTriggered: false, // Has death passive triggered?
            incalosBlessingActive: false, // Is death passive active this turn (for end turn effect)?

            // Saint King Sagross Specific
            sagrossHealTriggered: false, // Did heal happen this turn?
            sagrossAbsorbCount: 0, // For Order Conservation skill
            sagrossDmgTaken: 0, // For Order Conservation 70% immune fail damage

            // King Ray Specific
            rayProtectTurnEffects: false, // Cannot clear turn effects
            rayAttackBoostTrigger: false, // End turn attack +2

            // Saint Mecha Gaia Specific
            mechaGaiaHealActive: false, // Start healing 1/3 HP at end of turn
            mechaGaiaDeathTriggered: false, // Death passive triggered?
            mechaGaiaDeathDamage: 0, // Damage taken that caused death

            // Aishala Specific
            aishalaDmgRamp: 0 // For Spirit Sword Seals Soul
        };
    }

    isStarSovereign(char) { return !!(char && (char.meta?.isStar || char.isStar)); }

    applyStarGrace(char) {
        if (!char || char.hp <= 0) return;
        // 3 turns immune abnormal + stat drop for starter
        char.buffs.immuneAbnormal = Math.max(char.buffs.immuneAbnormal, 3);
        char.buffs.immuneStatDrop = Math.max(char.buffs.immuneStatDrop, 3);
        this.log(`${char.name} 受到星皇之佑！3回合免疫异常与弱化！`);
    }

    get player() { return this.playerTeam[this.activePlayerIndex]; }
    get enemy() { return this.enemyTeam[this.activeEnemyIndex]; }

    initBattle() {
        // Soul Mark Init (Surging Canglan)
        // 开启回合/登场节点：通过时间轴派发，避免在game.js内直写魂印逻辑
        this.timeline.emit(TurnPhases.OPEN_TURN, { actor: this.player, opponent: this.enemy, isPlayer: true });
        this.timeline.emit(TurnPhases.OPEN_TURN, { actor: this.enemy, opponent: this.player, isPlayer: false });
        this.handleEntryEffects(this.player, this.enemy);
        this.handleEntryEffects(this.enemy, this.player);

        this.updateUI();
        this.updateSkillButtons();
        this.isPlayerTurn = true;
        this.isBusy = false;
        this.ui.log.innerHTML = ''; // Clear hardcoded log
        this.log("战斗开始！");
        this.turnCount = 1;
        this.log(`--- 第 ${this.turnCount} 回合 ---`);
    }

    handleEntryEffects(char, opponent) {
        if (!char || !opponent) return;
        this.timeline.emit(TurnPhases.ENTRY, { actor: char, opponent, isPlayer: char === this.player });
    }

    applyStarGiftRegen(char, isPlayerSide) {
        const hasStar = isPlayerSide ? this.playerHasStar : this.enemyHasStar;
        if (!hasStar) return;
        if (char.hp <= 0) return;
        const heal = Math.floor(char.maxHp / 8);
        this.heal(char, heal, "星皇之赐");
    }

    enforceSolensenSync(solensen, opponent, source = 'turn') {
        if (!solensen || solensen.name !== "混沌魔君索伦森" || !opponent) return;
        let synced = false;
        for (let stat in opponent.buffs.statUps) {
            if (opponent.buffs.statUps[stat] > solensen.buffs.statUps[stat]) {
                opponent.buffs.statUps[stat] = solensen.buffs.statUps[stat];
                synced = true;
            }
        }
        if (synced) {
            this.log(`【魂印】源：同步对手能力等级（${source === 'turn_end' ? '回合结束' : '回合开始'}）！`);
            this.showFloatingText("魂印: 同步", solensen === this.player);
            this.updateUI();
        }
    }

    handleAishalaDeath(aishala, opponent) {
        // Clear turn effects and stat ups
        const clearedTurn = this.clearTurnEffects(opponent);
        let clearedStats = false;
        for (let k in opponent.buffs.statUps) {
            if (opponent.buffs.statUps[k] > 0) {
                opponent.buffs.statUps[k] = 0;
                clearedStats = true;
            }
        }
        if (clearedStats) this.log("魂印触发！消除了对手的能力提升！");

        if (clearedTurn || clearedStats) {
            this.addStatus(opponent, 'sleep');
            this.log("魂印触发！消除成功，令对手睡眠！");
        }
    }

    log(message) {
        const entry = document.createElement('div');
        entry.className = 'log-entry';
        entry.innerText = message;
        this.ui.log.appendChild(entry);
        // Fix scrolling - Force scroll to bottom
        setTimeout(() => {
            entry.scrollIntoView({ behavior: "smooth", block: "end" });
        }, 10);
    }

    updateUI() {
        // Player
        const p = this.player;
        this.ui.playerName.innerText = p.name;
        this.ui.playerAvatar.src = p.asset || "assets/character.png";
        this.ui.playerSprite.src = p.asset || "assets/character.png";
        const pHpPct = Math.max(0, (p.hp / p.maxHp) * 100);
        this.ui.playerHpBar.style.width = `${pHpPct}%`;
        this.ui.playerHpText.innerText = `${Math.ceil(p.hp)}/${p.maxHp}`;
        this.ui.soulMark.style.display = p.soulMark ? 'flex' : 'none';
        if (p.soulMark) this.ui.soulMark.innerText = p.soulMark;

        // Enemy
        const e = this.enemy;
        this.ui.enemyName.innerText = e.name;
        this.ui.enemySprite.style.backgroundImage = `url('${e.asset}')`;
        if (this.ui.enemyAvatar) {
            this.ui.enemyAvatar.src = e.asset || "assets/character.png";
            this.ui.enemyAvatar.style.display = 'block';
        }
        const eHpPct = Math.max(0, (e.hp / e.maxHp) * 100);
        this.ui.enemyHpBar.style.width = `${eHpPct}%`;
        this.ui.enemyHpText.innerText = `${Math.ceil(e.hp)}/${e.maxHp}`;

        // Enemy Soul Mark
        const enemySoulMark = document.getElementById('enemy-soul-mark');
        if (enemySoulMark) {
            enemySoulMark.style.display = e.soulMark ? 'flex' : 'none';
            if (e.soulMark) enemySoulMark.innerText = e.soulMark;

            // Tooltip for Enemy Soul Mark
            enemySoulMark.onmouseenter = (event) => {
                this.showTooltip(event, e.soulMarkDesc || "无魂印");
            };
            enemySoulMark.onmouseleave = () => this.hideTooltip();
        }

        // Buffs
        // Buffs & Turn Effects (Handled by renderTurnEffects)
        this.renderTurnEffects(p);
        this.renderTurnEffects(e);

        // Pokemon Count
        this.renderPokemonCount(this.playerTeam, this.ui.playerPokemonCount, false);
        this.renderPokemonCount(this.enemyTeam, this.ui.enemyPokemonCount, true);
    }

    renderPokemonCount(team, container, isEnemy) {
        container.innerHTML = '';
        team.forEach(char => {
            const ball = document.createElement('div');
            ball.className = `pokeball ${isEnemy ? 'enemy' : ''} ${char.hp > 0 ? 'active' : ''}`;
            container.appendChild(ball);
        });
    }

    hasSwitchRestriction(char) {
        if (!char || !char.buffs || !char.buffs.turnEffects) return false;
        return char.buffs.turnEffects.some(e => this.SWITCH_BLOCK_STATUSES.includes(e.id));
    }

    takeFixedDamage(target, amount, source = "固定伤害") {
        // Rebirth Wings Layer 4: Immune and Reflect Fixed Damage
        if (target.name === "重生之翼" && target.buffs.godlyGloryEnergy >= 4) {
            this.log(`${target.name} 神耀能量(4层)免疫并反弹固定伤害！`);
            const attacker = (target === this.player) ? this.enemy : this.player;
            this.damageSystem.apply({ type: 'fixed', source: target, target: attacker, amount, label: `${source}反弹` });
            return 0;
        }
        return this.damageSystem.apply({ type: 'fixed', source: null, target, amount, label: source });
    }

    takePercentDamage(target, ratio, source = "百分比伤害") {
        const dmg = Math.max(0, Math.floor(target.maxHp * ratio));
        return this.damageSystem.apply({ type: 'percent', source: null, target, amount: dmg, label: source });
    }

    getEffectDescription(id, effect = null) {
        if (effect && effect.desc) return effect.desc;
        return this.EFFECT_DEFS[id] ? this.EFFECT_DEFS[id].desc : '未知效果';
    }

    renderTurnEffects(char) {
        // Container is now the parent .status-container. We need to find children.
        // Actually, I passed the container ID in updateUI.
        // Let's change updateUI to pass the char and I'll find the rows by ID prefix.
        // Or I can just find them here if I know if it's player or enemy.

        const isPlayer = char === this.player;
        const prefix = isPlayer ? 'player' : 'enemy';

        const controlRow = document.getElementById(`${prefix}-control-row`);
        const buffRow = document.getElementById(`${prefix}-buff-row`);
        const statRow = document.getElementById(`${prefix}-stat-row`);

        if (!controlRow || !buffRow || !statRow) return;

        controlRow.innerHTML = '';
        buffRow.innerHTML = '';
        statRow.innerHTML = '';

        // 1. Control Effects (Top Row)
        // Use ABNORMAL_STATUSES list
        char.buffs.turnEffects.forEach(effect => {
            if (this.ABNORMAL_STATUSES.includes(effect.id)) {
                this.createBuffIcon(controlRow, effect.name, effect.turns, 'control', this.getEffectDescription(effect.id, effect));
            }
        });

        // 2. Buffs (Turn & Count) (Middle Row)
        // Filter out abnormal
        char.buffs.turnEffects.forEach(effect => {
            if (!this.ABNORMAL_STATUSES.includes(effect.id)) {
                let className = 'turn-effect';
                if (effect.cannotDispel) className += ' undispellable';
                this.createBuffIcon(buffRow, '', effect.turns, className, `${effect.name}: ${this.getEffectDescription(effect.id, effect)}`);
            }
        });

        // Positive Turn Effects (stored in properties)
        if (char.buffs.reflectDamage > 0) this.createBuffIcon(buffRow, '', char.buffs.reflectDamage, 'count-effect', `反弹伤害: ${char.buffs.reflectDamage}次`);
        if (char.buffs.critNext > 0) this.createBuffIcon(buffRow, '', char.buffs.critNext, 'turn-effect', `致命一击: ${char.buffs.critNext}回合`);
        if (char.buffs.priorityNext > 0) this.createBuffIcon(buffRow, '', char.buffs.priorityNext, 'turn-effect', `先制: ${char.buffs.priorityNext}回合`);
        if (char.buffs.priorityForceNext > 0) this.createBuffIcon(buffRow, '', char.buffs.priorityForceNext, 'turn-effect', `必定先制: ${char.buffs.priorityForceNext}回合`);
        if (char.buffs.immuneAbnormal > 0) this.createBuffIcon(buffRow, '', char.buffs.immuneAbnormal, 'turn-effect', `免疫异常: ${char.buffs.immuneAbnormal}回合`);
        if (char.buffs.immuneStatDrop > 0) this.createBuffIcon(buffRow, '', char.buffs.immuneStatDrop, 'turn-effect', `免疫弱化: ${char.buffs.immuneStatDrop}回合`);
        if (char.buffs.damageBoostNext > 0) this.createBuffIcon(buffRow, '', char.buffs.damageBoostNext, 'count-effect', `伤害提升: ${char.buffs.damageBoostNext}次`);
        if (char.buffs.starRageDamageBuffTurns > 0) this.createBuffIcon(buffRow, '', char.buffs.starRageDamageBuffTurns, 'turn-effect', `星怒: 伤害翻倍`);
        if (char.buffs.starRageDmgReduceCount > 0) this.createBuffIcon(buffRow, '', char.buffs.starRageDmgReduceCount, 'count-effect', `星怒: 受击减伤`);
        if (char.buffs.starRagePriorityTurns > 0) this.createBuffIcon(buffRow, '', char.buffs.starRagePriorityTurns, 'turn-effect', `星怒: 先制+2`);

        // Count Effects (Red Dots)
        if (char.buffs.agnesFatalCount > 0 && char.name === "不灭·艾恩斯") this.createBuffIcon(buffRow, '', char.buffs.agnesFatalCount, 'count-effect', `魂印: 致命残留`);
        if (char.buffs.blockAttack > 0) this.createBuffIcon(buffRow, '', char.buffs.blockAttack, 'count-effect', `封锁攻击: ${char.buffs.blockAttack}次`);
        if (char.buffs.blockAttribute > 0) this.createBuffIcon(buffRow, '', char.buffs.blockAttribute, 'count-effect', `封锁属性: ${char.buffs.blockAttribute}次`);
        if (char.buffs.solensenAttrBlockAura > 0) this.createBuffIcon(buffRow, '', char.buffs.solensenAttrBlockAura, 'count-effect', `魂印: 封锁对手属性`);
        if (char.buffs.immuneAbnormalCount > 0) this.createBuffIcon(buffRow, '', char.buffs.immuneAbnormalCount, 'count-effect', `免疫异常: ${char.buffs.immuneAbnormalCount}次`);
        if (char.buffs.waterCurseStack > 0) this.createBuffIcon(buffRow, '', char.buffs.waterCurseStack, 'count-effect', `水厄层数: ${char.buffs.waterCurseStack}`);
        if (char.buffs.agnesShield) this.createBuffIcon(buffRow, '', 1, 'count-effect', '火种永存: 免疫下一次攻击');

        // Turn Effects (Blue) - Solensen Stat Block Aura
        if (char.buffs.solensenStatBlockAura > 0) this.createBuffIcon(buffRow, '', char.buffs.solensenStatBlockAura, 'turn-effect', `魂印: 封锁对手强化`);

        // Shield (Shield UI)
        if (char.buffs.shield > 0) this.createBuffIcon(buffRow, '', char.buffs.shield, 'count-effect', `抵挡攻击: ${char.buffs.shield}次`);
        if (char.buffs.shieldHp > 0) this.createBuffIcon(buffRow, '', char.buffs.shieldHp, 'count-effect', `护盾: ${char.buffs.shieldHp}`);

        // Rebirth Wings Energy
        if (char.name === "重生之翼") {
            this.createBuffIcon(buffRow, '', char.buffs.godlyGloryEnergy, 'count-effect', `神耀能量: ${char.buffs.godlyGloryEnergy}层`);
        }

        // 3. Stats (Bottom Row)
        for (const [stat, val] of Object.entries(char.buffs.statUps)) {
            if (val !== 0) {
                const label = this.getStatLabel(stat);
                this.createBuffIcon(statRow, `${label}${val > 0 ? '+' : ''}${val}`, val, `stat:${stat}`, `${label} ${val > 0 ? '提升' : '下降'} ${Math.abs(val)} 等级`);
            }
        }
    }



    getStatLabel(stat) {
        const map = { attack: '攻', defense: '防', specialAttack: '特攻', specialDefense: '特防', speed: '速', accuracy: '准' };
        return map[stat] || stat;
    }

    createBuffIcon(container, label, val, type = null, desc = null) {
        const icon = document.createElement('div');

        let baseClass = type;
        let statKey = null;
        if (type && type.startsWith('stat:')) {
            statKey = type.split(':')[1];
            baseClass = 'stat';
        }

        const classNames = ['buff-icon'];
        if (statKey) {
            classNames.push('stat');
            classNames.push(val >= 0 ? 'stat-up' : 'stat-down');
        } else if (baseClass) {
            classNames.push(...baseClass.split(' '));
        } else {
            classNames.push(val > 0 ? 'up' : 'down');
        }
        icon.className = classNames.join(' ');

        if (statKey) {
            let symbol;
            switch (statKey) {
                case 'attack': symbol = '⚔️'; break;
                case 'defense': symbol = '🛡️'; break;
                case 'speed': symbol = '💨'; break;
                case 'specialAttack': symbol = '🔮'; break;
                case 'specialDefense': symbol = '🔰'; break;
                case 'accuracy': symbol = '🎯'; break;
                default: symbol = '★';
            }
            icon.innerText = `${symbol}${val > 0 ? '+' : ''}${val}`;
        } else {
            // For dot effects, show the remaining count centered inside the icon
            if (type && (type.includes('turn') || type.includes('count-effect'))) {
                icon.innerHTML = `<span>${val}</span>`;
            } else {
                icon.innerText = `${label}${val}`;
            }
        }

        if (desc) {
            icon.onmouseenter = (e) => {
                // Use the centralized showTooltip method to ensure consistent positioning
                let tooltipContent = desc;
                this.showTooltip(e, tooltipContent);
            };
            icon.onmouseleave = () => this.hideTooltip();
        }

        container.appendChild(icon);
    }

    updateSkillButtons() {
        const grid = this.ui.skillsGrid;
        const left = this.ui.skillsLeft;
        if (!grid || !left) return;

        grid.innerHTML = '';
        left.innerHTML = '';

        // Sort skills: 160 Power (Ultimate) first
        const sortedSkills = [...this.player.skills].sort((a, b) => {
            if (a.power === 160) return -1;
            if (b.power === 160) return 1;
            return 0;
        });

        sortedSkills.forEach((skill, index) => {
            const btn = document.createElement('button');
            const isUlt = skill.type === 'ultimate' || skill.power === 160;
            btn.className = `skill-btn ${isUlt ? 'ult' : ''}`;

            // Status indicators (do not disable; still allow click to consume PP and fail)
            const attrSealed = this.player.buffs.turnEffects.some(e => e.id === 'block_attr');
            const attackSealed = this.player.buffs.turnEffects.some(e => e.id === 'block_attack');
            const silenced = this.player.buffs.turnEffects.some(e => e.id === 'silence');
            const noPp = skill.pp <= 0;
            const blocked = (skill.type === 'buff' && attrSealed) ||
                ((skill.type === 'attack' || skill.type === 'ultimate') && attackSealed) ||
                (isUlt && silenced);
            if (noPp) {
                btn.classList.add('skill-blocked');
                btn.disabled = true;
            }

            // Icon based on type/name
            let icon = '★';
            if (skill.type === 'attack') icon = '⚔️';
            if (skill.type === 'buff') icon = '✨';
            if (isUlt) icon = '👑';
            // Specific overrides
            if (skill.name.includes('盾') || skill.name.includes('守')) icon = '🛡️';
            if (skill.name.includes('雷')) icon = '⚡';

            btn.innerHTML = `
                <div class="skill-icon">${icon}</div>
                <div class="skill-info">
                    <span class="skill-name">${skill.name}</span>
                    <span class="skill-power">威力: ${skill.power}</span>
                    <span class="skill-pp">PP: ${skill.pp}/${skill.maxPp}</span>
                </div>
            `;

            // Find original index for useSkill
            const originalIndex = this.player.skills.indexOf(skill);
            btn.onclick = () => this.useSkill(originalIndex);

            // Tooltip
            btn.onmouseenter = (e) => this.showTooltip(e, skill.desc);
            btn.onmouseleave = () => this.hideTooltip();

            if (index === 0 && isUlt) {
                left.appendChild(btn);
            } else {
                grid.appendChild(btn);
            }
        });
    }

    showTooltip(event, type) {
        const tooltip = this.ui.tooltip;
        tooltip.classList.remove('hidden');

        let content = "";
        if (type === 'soul-mark') {
            content = this.player.soulMarkDesc || "无魂印";
        } else if (typeof type === 'number') {
            const skill = this.player.skills[type];
            content = `【${skill.name}】\n${skill.desc}`;
        } else if (typeof type === 'string') { // For skill description directly
            content = type;
        }

        tooltip.innerText = content;
        const rect = event.target.getBoundingClientRect();
        const containerRect = document.querySelector('.game-container').getBoundingClientRect();

        // Position logic with overflow check
        let left = rect.left - containerRect.left;
        let top = rect.top - containerRect.top - tooltip.offsetHeight - 10;

        // Check right overflow (relative to container width)
        if (left + tooltip.offsetWidth > containerRect.width) {
            left = containerRect.width - tooltip.offsetWidth - 10;
        }
        // Check left overflow
        if (left < 0) left = 10;

        // Check top overflow (if tooltip goes above container)
        if (top < 0) {
            top = rect.bottom - containerRect.top + 10; // Show below
        }

        tooltip.style.left = `${left}px`;
        tooltip.style.top = `${top}px`;
    }

    hideTooltip() {
        this.ui.tooltip.classList.add('hidden');
    }

    toggleBag() {
        this.ui.bagModal.classList.toggle('hidden');
        if (!this.ui.bagModal.classList.contains('hidden')) {
            this.updateItemCounts();
        }
    }
    toggleSwitch() {
        this.ui.switchModal.classList.toggle('hidden');
        if (!this.ui.switchModal.classList.contains('hidden')) {
            this.renderTeamList();
        }
    }

    renderTeamList() {
        this.ui.teamList.innerHTML = '';
        this.playerTeam.forEach((char, index) => {
            const btn = document.createElement('button');
            btn.className = `item-btn ${index === this.activePlayerIndex ? 'active' : ''}`;
            btn.innerHTML = `
                <span class="item-name">${char.name}</span>
                <span class="item-count">HP: ${Math.ceil(char.hp)}/${char.maxHp}</span>
            `;
            btn.onclick = () => this.switchCharacter(index);
            this.ui.teamList.appendChild(btn);
        });
    }

    updateItemCounts() {
        if (this.ui.itemCountPP) this.ui.itemCountPP.innerText = `x${this.items.pp_potion ?? 0}`;
        if (this.ui.itemCountHP) this.ui.itemCountHP.innerText = `x${this.items.hp_potion ?? 0}`;
    }

    async useItem(itemId) {
        if (this.isBusy) return;
        const count = this.items[itemId] || 0;
        if (count <= 0) {
            this.log("没有该药剂了！");
            return;
        }
        this.isBusy = true;
        const playerAction = { type: 'item', itemId };
        const enemyAction = this.getEnemyAction();
        await this.resolveTurn(playerAction, enemyAction);
    }

    applyItemEffect(actor, itemId) {
        if (!this.items[itemId] || this.items[itemId] <= 0) return;
        this.items[itemId]--;

        if (itemId === 'pp_potion') {
            let restored = 0;
            actor.skills.forEach(s => {
                if (s.pp !== undefined && s.pp < s.maxPp) {
                    const before = s.pp;
                    s.pp = Math.min(s.maxPp, s.pp + 10);
                    restored += s.pp - before;
                }
            });
            this.log(`${actor.name} 使用了PP回复药剂，技能PP得到恢复！`);
            if (actor === this.player) this.updateSkillButtons();
        } else if (itemId === 'hp_potion') {
            const healed = this.heal(actor, 350, "药剂");
            if (healed === 0) this.log(`${actor.name} 的体力已满，药剂没有发挥作用。`);
        }

        this.updateItemCounts();
    }

    async switchCharacter(index) {
        if (index === this.activePlayerIndex) return;

        // Forced Switch (Death)
        if (this.player.hp <= 0) {
            this.log(`回来吧，${this.player.name}！去吧，${this.playerTeam[index].name}！`);
            this.activePlayerIndex = index;

            this.timeline.emit(TurnPhases.OPEN_TURN, { actor: this.player, opponent: this.enemy, isPlayer: true });
            this.handleEntryEffects(this.player, this.enemy);

            this.toggleSwitch();
            this.updateUI();
            this.updateSkillButtons();

            // Resume Turn Loop if needed? 
            // Usually death switch happens between turns.
            // If player died, we just wait for next turn input.
            this.isPlayerTurn = true;
            this.isBusy = false;
            return;
        }

        // Active Switch (Turn Action)
        if (this.isBusy) return;
        if (this.hasSwitchRestriction(this.player)) {
            this.log(`${this.player.name} 目前无法切换！`);
            return;
        }
        this.isBusy = true;

        const playerAction = { type: 'switch', index: index };

        // Enemy AI
        const enemyAction = this.getEnemyAction();

        await this.resolveTurn(playerAction, enemyAction);

        this.toggleSwitch();
    }

    getEnemyAction() {
        // Simple AI: picks any available skill with PP
        let enemySkills = this.enemy.skills.filter(s => s.pp > 0 || s.pp === undefined);
        if (enemySkills.length === 0) enemySkills = [{ name: "挣扎", type: "attack", power: 0, pp: 1, maxPp: 1, desc: "无法使用技能" }];
        const skill = enemySkills[Math.floor(Math.random() * enemySkills.length)];
        const skillIndex = this.enemy.skills.indexOf(skill);

        return { type: 'skill', index: skillIndex, skill: skill };
    }

    async useSkill(skillIndex) {
        if (this.isBusy) return;
        this.isBusy = true;

        const playerAction = { type: 'skill', index: skillIndex };
        const enemyAction = this.getEnemyAction();

        await this.resolveTurn(playerAction, enemyAction);
    }

    async resolveTurn(playerAction, enemyAction) {
        // Reset Turn Flags
        this.player.buffs.tookDamage = false;
        this.enemy.buffs.tookDamage = false;
        this.starRageWindow.active = false;
        this.starRageWindow.attacker = null;

        // 1. Start of Turn Triggers
        this.triggerStartOfTurn(this.player, this.enemy);
        this.triggerStartOfTurn(this.enemy, this.player);

        // 2. Determine Order
        // Switch has highest priority
        let playerFirst = true;

        if (playerAction.type === 'item' && enemyAction.type !== 'item') {
            playerFirst = true;
        } else if (enemyAction.type === 'item' && playerAction.type !== 'item') {
            playerFirst = false;
        } else if (playerAction.type === 'switch' && enemyAction.type !== 'switch') {
            playerFirst = true; // Switch happens before attack
        } else if (enemyAction.type === 'switch' && playerAction.type !== 'switch') {
            playerFirst = false;
        } else {
            // Both Skill or Both Switch
            const pSkill = playerAction.type === 'skill' ? this.player.skills[playerAction.index] : null;
            const eSkill = enemyAction.type === 'skill' ? enemyAction.skill : null;

            const pPrio = pSkill ? this.getPriority(this.player, pSkill) : 6; // Switch prio 6
            const ePrio = eSkill ? this.getPriority(this.enemy, eSkill) : 6;

            const pSpeed = this.getStat(this.player, 'speed');
            const eSpeed = this.getStat(this.enemy, 'speed');

            if (ePrio > pPrio) {
                playerFirst = false;
            } else if (ePrio === pPrio) {
                if (eSpeed > pSpeed) playerFirst = false;
                else if (eSpeed === pSpeed && Math.random() < 0.5) playerFirst = false;
            }
        }

        // 3. Execution
        const first = playerFirst ? { actor: this.player, action: playerAction, isPlayer: true } : { actor: this.enemy, action: enemyAction, isPlayer: false };
        const second = playerFirst ? { actor: this.enemy, action: enemyAction, isPlayer: false } : { actor: this.player, action: playerAction, isPlayer: true };

        // Execute First
        await this.executeTurnAction(first.actor, second.actor, first.action);

        // Check Death (If second actor died, skip their turn)
        if (second.actor.hp > 0) {
            // Note: If first action was switch, second actor targets the NEW pokemon.
            // We need to refresh 'second.actor' reference if it was the one who switched? 
            // No, 'second.actor' is the one waiting to move.
            // If 'first.actor' switched, 'second.actor' targets 'first.actor' (who is now new).
            // My executeTurnAction uses 'this.player' / 'this.enemy' dynamically, so it should be fine.

            // However, if 'second.actor' switched, they are now new.
            // But 'second.actor' variable points to the OLD object if I assigned it early?
            // Yes. 'this.player' changes reference.
            // So I should re-fetch actor.

            const currentSecondActor = second.isPlayer ? this.player : this.enemy;
            const currentFirstActor = first.isPlayer ? this.player : this.enemy; // Target

            if (currentSecondActor.hp > 0) {
                await this.executeTurnAction(currentSecondActor, currentFirstActor, second.action);
            }
        }

        // 4. End Phase
        this.enforceSolensenSync(this.player, this.enemy, 'turn_end');
        this.enforceSolensenSync(this.enemy, this.player, 'turn_end');

        this.handleEndTurn(this.player, this.enemy);
        this.handleEndTurn(this.enemy, this.player);

        const battleEnded = this.checkWinCondition();
        if (!battleEnded) {
            this.turnCount++;
            this.log(`--- 第 ${this.turnCount} 回合 ---`);
        }
        this.updateSkillButtons();

        this.isBusy = false;
        this.isPlayerTurn = true;
    }

    async executeTurnAction(actor, target, action) {
        if (action.type === 'switch') {
            // Perform Switch
            if (actor === this.player) {
                if (this.hasSwitchRestriction(actor) && actor.hp > 0) {
                    this.log(`${actor.name} 目前无法切换！`);
                    await this.wait(500);
                    return;
                }
                // Logic from switchCharacter
                const index = action.index;
                // Clear Agnes Shield on switch out
                if (this.player.buffs.agnesShield) this.player.buffs.agnesShield = false;

                this.log(`回来吧，${this.player.name}！去吧，${this.playerTeam[index].name}！`);
                this.activePlayerIndex = index;

                // Time axis: 开启回合/登场
                this.timeline.emit(TurnPhases.OPEN_TURN, { actor: this.player, opponent: this.enemy, isPlayer: true });
                this.handleEntryEffects(this.player, this.enemy);
                this.updateUI();
                this.updateSkillButtons();
            } else {
                // Enemy Switch (Not implemented fully yet, but structure is here)
                if (this.hasSwitchRestriction(actor) && actor.hp > 0) {
                    this.log(`${actor.name} 无法切换！`);
                    await this.wait(500);
                    return;
                }
                this.log("对手更换了精灵！");
                // Placeholder: if AI switches,仍然派发登场节点
                this.timeline.emit(TurnPhases.OPEN_TURN, { actor: this.enemy, opponent: this.player, isPlayer: false });
                this.handleEntryEffects(this.enemy, this.player);
            }
            await this.wait(1000);
        } else if (action.type === 'item') {
            const controlEffect = actor.buffs.turnEffects.find(e => this.CONTROL_STATUSES.includes(e.id));
            if (controlEffect) {
                this.log(`${actor.name} 处于 ${controlEffect.name} 状态，无法使用药剂！`);
                this.showFloatingText("无法行动", actor === this.player);
            } else {
                this.applyItemEffect(actor, action.itemId);
                if (actor === this.player && !this.ui.bagModal.classList.contains('hidden')) this.toggleBag();
            }
            actor.buffs.hasMoved = true;
            await this.wait(600);
        } else {
            // Skill
            // Re-fetch skill object in case it changed? No, index is safe.
            // But for enemy, we passed object.
            let skill;
            if (actor === this.player) {
                skill = this.player.skills[action.index];
            } else {
                skill = action.skill;
            }

            // Target might have changed if opponent switched
            const currentTarget = (actor === this.player) ? this.enemy : this.player;
            await this.executeAction(actor, currentTarget, skill);
        }
    }

    // Helper to calculate total priority
    getPriority(char, skill) {
        let p = 0;
        const hasForcedPriority = char.buffs.priorityForceNext > 0;
        // Skill Priority
        if (skill.name === "天威力破" || skill.name === "秩序之助" || skill.name === "上善若水" || skill.name === "诸雄之主") p += 3;

        // Buff Priority
        if (char.buffs.priorityNext > 0) p += 2;

        if (hasForcedPriority) {
            p = Math.max(p, 100);
        }

        // Soul Mark Priority
        // Surging Canglan (Shield)
        if (char.name === "怒涛·沧岚" && char.buffs.shieldHp > 0) p += 1;

        // Star Sovereign Star Rage priority buff
        if (this.isStarSovereign(char) && char.buffs.starRagePriorityTurns > 0) p += 2;

        // Agnes (Fortitude)
        // if (char.name === "不灭·艾恩斯" && char.buffs.agnesState === 'fortitude') {
        //    p += 2;
        // }

        // Rebirth Wings Priority
        if (char.name === "重生之翼") {
            if (char.buffs.godlyGloryEnergy >= 5) p += 1;
            if (char.buffs.rebirthWingsResetPriority > 0) p += 3;
        }

        // Incalos Priority
        if (char.name === "光之惩戒·英卡洛斯") {
            p += 1;
        }

        if (char.buffs.turnEffects.some(e => e.id === 'bind')) {
            return 0;
        }
        if (char.buffs.turnEffects.some(e => e.id === 'priority_down')) {
            p -= 2;
        }

        return p;
    }

    // Helper to get current stat value
    getStat(char, stat) {
        let base = 100;
        const stage = char.buffs.statUps[stat] || 0;
        let mult = 1;
        if (stage > 0) mult = (stage + 2) / 2;
        if (stage < 0) mult = 2 / (Math.abs(stage) + 2);
        return base * mult;
    }

    detectDamageType(skill) {
        if (!skill || !skill.desc) return null;
        if (skill.desc.includes('特攻')) return 'special';
        if (skill.desc.includes('物攻')) return 'physical';
        return null;
    }

    detectElement(skill) {
        if (!skill) return null;
        const text = `${skill.name || ''}${skill.desc || ''}`;
        if (text.includes('火系') || text.includes('火焰') || text.includes('焚')) return 'fire';
        if (text.includes('水系') || text.includes('海') || text.includes('水')) return 'water';
        if (text.includes('混沌')) return 'chaos';
        if (text.includes('战斗')) return 'fight';
        return null;
    }

    getOffensiveStage(char, damageType) {
        const attackStage = (char && char.buffs && char.buffs.statUps && char.buffs.statUps.attack) || 0;
        const specialStage = (char && char.buffs && char.buffs.statUps && char.buffs.statUps.specialAttack) || 0;
        if (damageType === 'physical') return attackStage;
        if (damageType === 'special') return specialStage;
        return Math.abs(attackStage) >= Math.abs(specialStage) ? attackStage : specialStage;
    }

    getDefensiveStage(char, damageType) {
        const defenseStage = (char && char.buffs && char.buffs.statUps && char.buffs.statUps.defense) || 0;
        const spDefenseStage = (char && char.buffs && char.buffs.statUps && char.buffs.statUps.specialDefense) || 0;
        if (damageType === 'physical') return defenseStage;
        if (damageType === 'special') return spDefenseStage;
        return Math.abs(defenseStage) >= Math.abs(spDefenseStage) ? defenseStage : spDefenseStage;
    }

    triggerStartOfTurn(char, opponent) {
        char.buffs.hasMoved = false; // Reset move flag
        char.buffs.lastDamageTaken = 0; // Reset last damage (or keep it? "Opponent last caused damage". Usually refers to the damage taken in the previous turn or this turn before acting. Let's reset at start of turn, so it tracks damage taken *during* this turn? Or previous turn? "Last caused damage" usually implies the very last hit. If I move first, it's 0. If I move second, it's what I took. But if I want "last turn's damage", I shouldn't reset here.
        // However, "Fixed dmg = opp last dmg" usually implies "Damage taken this turn" if moving second, or "Damage taken last turn" if moving first?
        // Let's assume it means "Damage taken in the last action targeting me".
        // So I won't reset it here, but I will track it in takeDamage.
        // Dispatch魂印/被动：由时间轴统一处理
        this.timeline.emit(TurnPhases.TURN_START, { actor: char, opponent, isPlayer: char === this.player });
    }

    async executeAction(attacker, defender, skill) {
        const isPlayer = attacker === this.player;

        // 1. Check Control
        const controlEffect = attacker.buffs.turnEffects.find(e => this.CONTROL_STATUSES.includes(e.id));
        if (controlEffect) {
            this.log(`${attacker.name} 处于 ${controlEffect.name} 状态，无法行动！`);
            await this.wait(500);
            return;
        }

        // 2. Check Silence / Blocks (skills still consume PP when blocked)
        let blockedReason = null;
        if (skill.type === 'buff') {
            if (attacker.buffs.turnEffects.some(e => e.id === 'block_attr')) {
                blockedReason = `${attacker.name} 的属性技能被封锁！`;
            }
            if (!blockedReason && attacker.buffs.blockAttribute > 0) {
                blockedReason = `${attacker.name} 的属性技能被封锁！`;
                attacker.buffs.blockAttribute--;
            }

            // Check Solensen Aura (Bound to Solensen)
            const auraOwner = (attacker === this.player) ? this.enemy : this.player;
            if (!blockedReason && auraOwner.name === "混沌魔君索伦森" && auraOwner.buffs.solensenAttrBlockAura > 0) {
                blockedReason = `【魂印】源：${attacker.name} 的属性技能被封锁！`;
                auraOwner.buffs.solensenAttrBlockAura--;
                this.updateUI();
            }
        }
        if (skill.type === 'attack' || skill.type === 'ultimate') {
            if (!blockedReason && skill.type === 'ultimate' && attacker.buffs.turnEffects.some(e => e.id === 'silence')) {
                blockedReason = `${attacker.name} 被沉默，无法使用第五技能！`;
            }
            if (!blockedReason && attacker.buffs.blockAttack > 0) {
                blockedReason = `${attacker.name} 的攻击技能被封锁！`;
                attacker.buffs.blockAttack--;
            }
        }

        // 3. Execute
        this.log(`${attacker.name} 使用了 【${skill.name}】!`);

        if (blockedReason) {
            if (skill.pp > 0) skill.pp--;
            if (isPlayer) this.updateSkillButtons();
            this.log(`但是技能无效！${blockedReason}`);
            this.showFloatingText("技能失效", isPlayer);
            await this.tryStarRage(attacker, defender, skill, 'invalid');
            await this.wait(800);
            return;
        }

        if (skill.type === 'buff' && attacker.buffs.turnEffects.some(e => e.id === 'daze')) {
            if (Math.random() < 0.5) {
                this.log(`${attacker.name} 处于失神，属性技能失效！`);
                if (skill.pp > 0) skill.pp--;
                if (isPlayer) this.updateSkillButtons();
                await this.tryStarRage(attacker, defender, skill, 'invalid');
                await this.wait(800);
                return;
            }
        }

        if ((skill.type === 'attack' || skill.type === 'ultimate') && attacker.buffs.turnEffects.some(e => e.id === 'blind')) {
            if (Math.random() < 0.5) {
                this.log(`${attacker.name} 处于失明，攻击未命中！`);
                if (skill.pp > 0) skill.pp--;
                if (isPlayer) this.updateSkillButtons();
                await this.tryStarRage(attacker, defender, skill, 'invalid');
                await this.wait(800);
                return;
            } else {
                this.log(`失明状态下，${attacker.name} 勉强命中！`);
            }
        }

        if ((skill.type === 'attack' || skill.type === 'ultimate') && attacker.buffs.turnEffects.some(e => e.id === 'confuse')) {
            if (Math.random() < 0.8) {
                this.log(`${attacker.name} 陷入混乱，攻击失误！`);
                if (skill.pp > 0) skill.pp--;
                if (isPlayer) this.updateSkillButtons();
                await this.wait(800);
                return;
            }
        }

        if ((skill.type === 'attack' || skill.type === 'ultimate') && attacker.buffs.turnEffects.some(e => e.id === 'flammable')) {
            if (Math.random() < 0.3) {
                this.log(`${attacker.name} 处于易燃，攻击落空！`);
                if (skill.pp > 0) skill.pp--;
                if (isPlayer) this.updateSkillButtons();
                await this.wait(800);
                return;
            }
        }

        // Check one-time attack immunity
        if (skill.type === 'attack' || skill.type === 'ultimate') {
            const ignoresImmune = skill.effects?.some(e => e.id === 3100);
            const immuneIdx = defender.buffs.turnEffects.findIndex(e => e.id === 'immune_next_attack');
            if (immuneIdx !== -1) {
                if (ignoresImmune) {
                    this.log(`${attacker.name} 无视免疫效果，攻击继续！`);
                    defender.buffs.turnEffects.splice(immuneIdx, 1);
                } else {
                    this.log(`但是 ${defender.name} 的防护使攻击失效了！`);
                    defender.buffs.turnEffects.splice(immuneIdx, 1);
                    defender.buffs.agnesShield = false;
                    await this.wait(800);
                    return;
                }
            }
            if (defender.buffs.agnesShield) {
                if (ignoresImmune) {
                    this.log(`${attacker.name} 无视火种保护，攻击继续！`);
                    defender.buffs.agnesShield = false;
                } else {
                    this.log(`但是 ${defender.name} 的火种永存使攻击失效了！`);
                    defender.buffs.agnesShield = false;
                    await this.wait(800);
                    return;
                }
            }
        }

        // Surging Canglan Stack Logic
        if (attacker.name === "怒涛·沧岚" && (skill.type === 'attack' || skill.type === 'ultimate')) {
            if (attacker.buffs.damageStack < 4) {
                attacker.buffs.damageStack++;
                this.log("魂印触发！伤害叠加！");
                this.showFloatingText("魂印: 叠加", attacker === this.player);
            }
        }

        // Incalos Reactive Trap (Skill Use)
        if (defender.buffs.turnEffects.some(e => e.id === 'incalos_skill_trap')) {
            // "3 turns, every turn use skill -> Blind 100%, else Dmg 1/3"
            // Check immunity to blind?
            // If blind applied, good. Else dmg.
            // Simplified: Try apply blind. If failed (immune), deal damage.
            // But wait, "If not triggered" usually means probability. Here it says 100%.
            // So "Not triggered" implies Immunity.
            const immune = (attacker.buffs.immuneAbnormal > 0 || attacker.buffs.immuneAbnormalCount > 0);
            if (!immune) {
                this.addTurnEffect(attacker, '失明', 2, 'blind');
                this.log("受到光之惩戒影响，视线模糊！");
            } else {
                const dmg = Math.floor(attacker.maxHp / 3);
                attacker.hp = Math.max(0, attacker.hp - dmg);
                this.log(`光之惩戒：对手免疫失明，受到 ${dmg} 点伤害！`);
                this.showDamageNumber(dmg, attacker === this.player, 'pink');
            }
        }

        // Animation
        const sprite = isPlayer ? this.ui.playerSprite : this.ui.enemySprite;
        if (!isPlayer) {
            sprite.classList.add('attack-lunge');
            await this.wait(300);
            sprite.classList.remove('attack-lunge');
        }

        if (skill.pp > 0) skill.pp--;

        // Check PP Curse (Attribute Skill)
        if (skill.type === 'buff' && attacker.buffs.turnEffects.some(e => e.id === 'pp_curse_attr')) {
            this.log(`${attacker.name} 受到挚金命轮诅咒，所有技能PP减少2点！`);
            attacker.skills.forEach(s => {
                if (s.pp > 0) s.pp = Math.max(0, s.pp - 2);
            });
            if (isPlayer) this.updateSkillButtons();
        }

        // Sagross Soul Mark: PP Restore (Self Attribute)
        if (attacker.name === "圣王·萨格罗斯" && skill.type === 'buff') {
            attacker.skills.forEach(s => {
                if (s.pp < s.maxPp) s.pp++;
            });
            this.log("魂印触发！恢复所有技能1点PP！");
            if (isPlayer) this.updateSkillButtons();
        }

        // Sagross Soul Mark: PP Zero (Opponent Attribute)
        if (defender.name === "圣王·萨格罗斯" && skill.type === 'buff') {
            // Randomly zero one skill
            const validSkills = attacker.skills.filter(s => s.pp > 0);
            if (validSkills.length > 0) {
                const targetSkill = validSkills[Math.floor(Math.random() * validSkills.length)];
                targetSkill.pp = 0;
                this.log(`魂印触发！${attacker.name} 的 ${targetSkill.name} PP归零！`);
                if (!isPlayer) this.updateSkillButtons(); // If enemy is player (attacker is player)
            }
        }

        // Sagross Order Conservation Trap (Opponent Attribute)
        if (defender.buffs.turnEffects.some(e => e.id === 'sagross_order_trap') && skill.type === 'buff') {
            this.addTurnEffect(attacker, '失效', 2, 'sagross_punish', '攻击技能无法造成伤害且失效');
            this.log("秩序守恒触发！对手下2回合攻击失效！");
        }

        // King Ray Block Attribute (Ray uses Attack 2 first)
        if (attacker.buffs.turnEffects.some(e => e.id === 'ray_block_attr') && skill.type === 'buff') {
            this.log("雷裂残阳：对手属性技能无效！");
            return; // Stop execution
        }

        // Mecha Gaia Block Attribute
        if (attacker.buffs.turnEffects.some(e => e.id === 'mecha_gaia_block_attr') && skill.type === 'buff') {
            this.log("圣甲气魄：对手属性技能无效！");
            return;
        }

        attacker.buffs.hasMoved = true;
        await this.resolveSkill(attacker, defender, skill);
        await this.wait(800);
    }

    // Deprecated, logic moved to useSkill


    handleEndTurn(char, opponent) {
        // Skip processing for defeated units (死亡后留到判定阶段处理)
        if (char.hp <= 0) return;

        // Check Control Status
        const isControlled = char.buffs.turnEffects.some(e => this.CONTROL_STATUSES.includes(e.id));

        // 时间轴派发：魂印/被动的结算集中管理
        this.timeline.emit(TurnPhases.TURN_END, { actor: char, opponent, isPlayer: char === this.player });

        // Decrement Buffs
        if (char.buffs.priorityNext > 0) char.buffs.priorityNext--;
        if (char.buffs.priorityForceNext > 0) char.buffs.priorityForceNext--;
        if (char.buffs.critNext > 0) char.buffs.critNext--;
        // reflectDamage is Count-based, removed from here
        if (char.buffs.immuneAbnormal > 0) char.buffs.immuneAbnormal--;
        if (char.buffs.immuneStatDrop > 0) char.buffs.immuneStatDrop--;
        if (char.buffs.solensenStatBlockAura > 0) char.buffs.solensenStatBlockAura--;
        if (char.buffs.starRageDamageBuffTurns > 0) char.buffs.starRageDamageBuffTurns--;
        if (char.buffs.starRagePriorityTurns > 0) char.buffs.starRagePriorityTurns--;
        if (char.buffs.starRageChanceTurns > 0) {
            char.buffs.starRageChanceTurns--;
            if (char.buffs.starRageChanceTurns === 0) {
                char.buffs.starRageChanceFactor = 1;
                char.buffs.starRageChanceBonus = 0;
            }
        }
        if (char.buffs.starRageUnremovableTurns > 0) char.buffs.starRageUnremovableTurns--;

        // Rebirth Wings End Turn
        if (char.name === "重生之翼") {
            // Layer 3: Recover 1/3 HP if acted first (checked via priority/speed or just if not skipped?)
            // "自身出手起则每回合结束后..." implies if it was able to act (not controlled?) or just generally?
            // "自身出手起" usually means "From the moment it acts/is active".
            // Let's assume it means "If active on field".
            if (char.buffs.godlyGloryEnergy >= 3) {
                const heal = Math.floor(char.maxHp / 3);
                this.heal(char, heal, "神耀能量");
            }
            if (char.buffs.rebirthWingsResetPriority > 0) char.buffs.rebirthWingsResetPriority--;
        }

        // Incalos Blessing End Turn
        if (char.name === "光之惩戒·英卡洛斯" && char.buffs.incalosBlessingActive) {
            // Clear abnormal
            const abnormal = char.buffs.turnEffects.filter(e => this.ABNORMAL_STATUSES.includes(e.id));
            if (abnormal.length > 0) {
                char.buffs.turnEffects = char.buffs.turnEffects.filter(e => !this.ABNORMAL_STATUSES.includes(e.id));
                this.log("圣光祝福：解除了自身异常状态！");
            }
            // Damage Boost
            char.buffs.damageBoostNext = 3;
            char.buffs.damageBoostVal = 150;
            this.log("圣光祝福：下3次攻击伤害提升150%！");
            char.buffs.incalosBlessingActive = false;
        }

        // Sagross Soul Mark: Heal Trigger Processing
        if (char.name === "圣王·萨格罗斯" && char.buffs.sagrossHealTriggered) {
            char.buffs.sagrossHealTriggered = false;
            // Clear abnormal and stat drops (Next turn start? Or now for next turn?)
            // "Next turn clear... and for next 2 turns immune..."
            // If we do it now, it clears current status.
            // "Next turn clear" implies at the start of next turn.
            // But usually these effects are applied immediately for the upcoming turn.
            // Let's apply buffs now.

            // Clear
            let cleared = false;
            // Clear abnormal
            if (char.buffs.turnEffects.some(e => this.ABNORMAL_STATUSES.includes(e.id))) {
                char.buffs.turnEffects = char.buffs.turnEffects.filter(e => !this.ABNORMAL_STATUSES.includes(e.id));
                cleared = true;
            }
            // Clear stat drops
            for (let key in char.buffs.statUps) {
                if (char.buffs.statUps[key] < 0) {
                    char.buffs.statUps[key] = 0;
                    cleared = true;
                }
            }
            if (cleared) this.log("魂印触发！解除了异常状态和能力下降！");

            // Immune (2 turns)
            char.buffs.immuneAbnormal = 2;
            char.buffs.immuneStatDrop = 2;

            // 50% Chance Double Damage (2 turns)
            // We can use a custom buff or just a flag.
            // Let's use `damageBoostNext` but it's usually guaranteed.
            // We need a "chance to boost" buff.
            // Let's add `sagrossChanceBoost` to buffs? Or just use `damageBoostNext` with a special value/flag?
            // I'll add a specific turn effect for this? Or just a property.
            // Let's use a turn effect 'sagross_power_chance'.
            this.addTurnEffect(char, '圣威', 2, 'sagross_power_chance', '攻击50%概率翻倍');
            this.log("魂印触发！下2回合免疫异常/弱化，攻击50%概率翻倍！");
        }

        // Sagross Order Conservation Damage (70% fail -> 120% dmg)
        if (char.buffs.sagrossDmgTaken > 0) {
            // If we are here, it means we took damage.
            // The effect says: "70% chance immune. If NOT triggered (meaning took damage), end of turn deal 120% of damage taken."
            // We need to check if the 'sagross_dodge' effect is active.
            if (char.buffs.turnEffects.some(e => e.id === 'sagross_dodge')) {
                const dmg = Math.floor(char.buffs.sagrossDmgTaken * 1.2);
                const opponent = (char === this.player) ? this.enemy : this.player;
                opponent.hp = Math.max(0, opponent.hp - dmg);
                this.log(`秩序守恒：反击 ${dmg} 点固定伤害！`);
                this.showDamageNumber(dmg, opponent === this.player, 'pink');
            }
            char.buffs.sagrossDmgTaken = 0; // Reset
        }

        // King Ray Soul Mark: End of Turn
        if (char.name === "王·雷伊") {
            const opponent = (char === this.player) ? this.enemy : this.player;
            // Absorb Stats
            if (this.stealStats(char, opponent)) {
                this.log("魂印触发！吸取了对手的能力提升！");
            }
            // Attack +2 if triggered
            if (char.buffs.rayAttackBoostTrigger) {
                this.modifyStats(char, { attack: 2 });
                this.log("魂印触发！攻击+2！");
                char.buffs.rayAttackBoostTrigger = false;
            }
            // Reset Protect
            char.buffs.rayProtectTurnEffects = false;
        }

        // Saint Mecha Gaia Soul Mark: Heal 1/3 HP
        if (char.name === "圣甲·盖亚" && char.buffs.mechaGaiaHealActive) {
            this.heal(char, Math.floor(char.maxHp / 3), "魂印");
            this.showFloatingText("魂印: 恢复", char === this.player);
        }

        // Aishala Illusionary Realm (End Turn Check)
        // "If not triggered (not attacked), Opp Stats -1"
        // We need to know if Aishala was attacked this turn.
        // `char.buffs.tookDamage` tracks if damage was taken.
        // But "Attacked" might mean targeted by attack skill.
        // Let's use `tookDamage` as a proxy for now, or add a `wasAttacked` flag.
        // Assuming `tookDamage` is sufficient for "Attacked" context in this game's simplicity.
        if (char.buffs.turnEffects.some(e => e.id === 'aishala_sleep_trap')) {
            if (!char.buffs.tookDamage) {
                const opponent = (char === this.player) ? this.enemy : this.player;
                this.modifyStats(opponent, { attack: -1, defense: -1, speed: -1, specialAttack: -1, specialDefense: -1, accuracy: -1 });
                this.log("虚妄幻境：未受到攻击，对手全属性-1！");
            }
        }

        // Process Turn Effects
        for (let i = char.buffs.turnEffects.length - 1; i >= 0; i--) {
            const effect = char.buffs.turnEffects[i];

            // Effect Logic
            if (effect.id === 'poison') {
                const dmg = Math.floor(char.maxHp / 8); // Nerfed to 1/8
                this.damageSystem.apply({ type: 'percent', target: char, amount: dmg, label: `${char.name} 受到毒伤害` });
            }
            if (effect.id === 'frostbite') {
                const dmg = Math.floor(char.maxHp / 8);
                this.damageSystem.apply({ type: 'percent', target: char, amount: dmg, label: `${char.name} 受到冻伤伤害` });
            }
            if (effect.id === 'burn') {
                const dmg = Math.floor(char.maxHp / 8);
                this.damageSystem.apply({ type: 'percent', target: char, amount: dmg, label: `${char.name} 受到烧伤伤害` });
            }
            if (effect.id === 'absorb_loop') {
                const absorbAmt = (char.hp < char.maxHp / 2) ? Math.floor(opponent.maxHp * 2 / 3) : Math.floor(opponent.maxHp / 3);
                opponent.hp = Math.max(0, opponent.hp - absorbAmt);
                this.heal(char, absorbAmt, "无始源光");
                this.log(`无始源光：吸取对手 ${absorbAmt} 体力！`);
                this.showDamageNumber(absorbAmt, char === this.player, 'pink');
            }
            if (effect.id === 'stat_up_loop') {
                this.modifyStats(char, { attack: 1, speed: 1 });
                this.log("无始源光：攻击+1、速度+1！");
            }
            if (effect.id === 'silence') {
                const dmg = Math.floor(char.maxHp / 8);
                this.damageSystem.apply({ type: 'percent', target: char, amount: dmg, label: `${char.name} 受到沉默伤害` });
            }
            if (effect.id === 'immolate') {
                const dmg = Math.floor(char.maxHp / 8);
                this.damageSystem.apply({ type: 'percent', target: char, amount: dmg, label: `${char.name} 被焚烬灼烧`, options: { tag: 'immolate' } });
            }
            if (effect.id === 'curse_fire') {
                const dmg = Math.floor(char.maxHp / 8);
                this.damageSystem.apply({ type: 'percent', target: char, amount: dmg, label: `${char.name} 受到烈焰诅咒伤害` });
            }
            if (effect.id === 'bleed') {
                const dmg = 80;
                this.damageSystem.apply({ type: 'fixed', target: char, amount: dmg, label: `${char.name} 因流血损失` });
            }
            if (effect.id === 'parasite') {
                const dmg = Math.floor(char.maxHp / 8);
                const applied = this.damageSystem.apply({ type: 'percent', target: char, amount: dmg, label: `${char.name} 被寄生吸取` });
                if (applied > 0) {
                    const healed = this.heal(opponent, applied, "寄生");
                    if (healed > 0) this.showFloatingText(`寄生 +${healed}`, opponent === this.player);
                }
            }
            if (effect.id === 'water_curse') {
                // Stacking Fixed Damage (20% * Stacks)
                const stacks = char.buffs.waterCurseStack || 1;
                const pct = 0.2 * stacks;
                const dmg = Math.floor(char.maxHp * pct);
                this.damageSystem.apply({ type: 'percent', target: char, amount: dmg, label: `${char.name} 受到水厄伤害(层数:${stacks})` });
            }
            if (effect.id === 'confuse') {
                if (Math.random() < 0.05) {
                    const dmg = 50;
                    this.damageSystem.apply({ type: 'fixed', target: char, amount: dmg, label: `${char.name} 混乱自伤` });
                }
            }
            if (effect.id === 'regen') {
                // Skill Effect: Regen (Check Control)
                if (!isControlled) {
                    const heal = Math.floor(char.maxHp / 8);
                    this.heal(char, heal, "再生");
                }
            }
            if (effect.id === 'fire_core') {
                // Params: [turns, healRatio, lowHpRatio] default [4, 3, 2]
                const params = effect.params || [4, 3, 2];
                const healRatio = params[1];
                const lowHpRatio = params[2];

                let mult = 1;
                if (char.hp < char.maxHp / lowHpRatio) mult = 2;

                const amount = Math.floor(char.maxHp / healRatio) * mult;

                // Heal
                if (!isControlled) {
                    this.heal(char, amount, "火焰精核");
                    // Fixed Damage
                    opponent.hp = Math.max(0, opponent.hp - amount);
                    this.log(`${char.name} 造成了 ${amount} 点固伤！`);
                    this.showDamageNumber(amount, char === this.player ? false : true, 'pink');
                }
            }
            if (effect.id === 'absorb_hp_skill') {
                const params = effect.params || [4, 3];
                const ratio = params[1] || 3;
                if (!isControlled) {
                    const absorb = Math.max(1, Math.floor(opponent.maxHp / ratio));
                    if (!(this.isStarSovereign(opponent))) {
                        opponent.hp = Math.max(0, opponent.hp - absorb);
                        this.log(`${char.name} 吸取了 ${absorb} 点体力！`);
                        this.showDamageNumber(absorb, char === this.player ? false : true, 'pink');
                        this.heal(char, absorb, "吸血");
                    } else {
                        this.log(`${opponent.name} 魂印免疫百分比吸取！`);
                    }
                }
            }

            effect.turns--;
            if (effect.turns <= 0) {
                this.log(`${char.name} 的 ${effect.name} 效果结束了。`);
                this.showFloatingText(`${effect.name} 结束`, char === this.player, '#aaa');

                // Clear Stacks if needed
                if (effect.id === 'water_curse') char.buffs.waterCurseStack = 0;

                char.buffs.turnEffects.splice(i, 1);

                // Bind End Effect
                if (effect.id === 'bind') {
                    const dmg = Math.floor(char.maxHp / 8);
                    char.hp = Math.max(0, char.hp - dmg);
                    this.log(`束缚结束！${char.name} 受到 ${dmg} 点伤害！`);
                    this.showDamageNumber(dmg, char === this.player, 'pink');
                }

                if (effect.id === 'immolate') {
                    this.addTurnEffect(char, '烧伤', 2, 'burn');
                    this.modifyStats(char, { accuracy: -1 });
                    this.log(`${char.name} 的焚烬转化为烧伤，命中降低！`);
                }
                if (effect.id === 'freeze') {
                    this.addTurnEffect(char, '冻伤', 2, 'frostbite');
                    this.modifyStats(char, { speed: -1 });
                    this.log(`${char.name} 的冰冻解除，转化为冻伤且速度下降！`);
                }

                if (effect.id === 'curse') {
                    const curseTypes = [
                        { name: '烈焰诅咒', id: 'curse_fire', desc: '每回合受到1/8最大体力伤害' },
                        { name: '致命诅咒', id: 'curse_fatal', desc: '受到的攻击伤害提升50%' },
                        { name: '虚弱诅咒', id: 'curse_weak', desc: '造成的攻击伤害降低50%' }
                    ];
                    const chosen = curseTypes[Math.floor(Math.random() * curseTypes.length)];
                    this.addTurnEffect(char, chosen.name, 2, chosen.id, chosen.desc);
                }

                if (effect.id === 'infect') {
                    this.addTurnEffect(char, '中毒', 2, 'poison');
                    this.modifyStats(char, { attack: -1, specialAttack: -1 });
                }
            }
        }

        // Eternal Fire Passive (Agnes) - Skill Effect (Check Control)
        const eternalFire = char.buffs.turnEffects.find(e => e.id === 'eternal_fire');
        if (eternalFire && !isControlled) {
            // Params: [turns, chance, status, cutRatio] default [4, 70, '焚烬', 3]
            // Note: Original logic was 100% chance if not burned. New logic is chance based.
            // But wait, the description says "70% chance to burn, ELSE cut HP".
            // The original code was: If not burned -> Burn. Else -> Cut HP.
            // I should follow the new params.

            const params = eternalFire.params || [4, 70, '焚烬', 3]; // Default to new spec if params missing? Or old behavior?
            // If params missing (old skill usage), use old behavior?
            // But I updated the skill to use params.

            const chance = params[1];
            const statusName = params[2];
            const cutRatio = params[3];

            // Map status name to ID
            const statusMap = { '焚烬': 'immolate', '烧伤': 'burn', '冰封': 'freeze', '害怕': 'fear', '麻痹': 'paralyze', '睡眠': 'sleep', '中毒': 'poison' };
            const statusId = statusMap[statusName] || 'burn';

            // Check if enemy already has status?
            // Description: "70% chance to apply status, if NOT triggered (or failed?), cut HP".
            // Usually "If not triggered" means the random check failed.
            // But if enemy already has status, does it count as "triggered"?
            // Usually if enemy has status, you can't apply it again, so it might fail.
            // But "70% chance" implies the roll.

            const roll = Math.random() * 100;
            let applied = false;

            if (roll < chance) {
                // Try to apply
                // Check immunity/existing is handled in addTurnEffect, but we need to know if it "triggered".
                // If enemy has status, addTurnEffect refreshes it. That counts as applied.
                // If enemy is immune, it fails.
                // But for "If not triggered", it usually refers to the probability roll.
                // Let's assume if roll passes, we try to apply.
                this.addTurnEffect(opponent, statusName, 2, statusId);
                this.log(`火种永存！触发${statusName}！`);
                applied = true;
            }

            if (!applied) {
                const cut = Math.floor(opponent.maxHp / cutRatio);
                opponent.hp = Math.max(0, opponent.hp - cut);
                this.log(`火种永存！未触发${statusName}，减少了 ${cut} 体力！`);
                this.showDamageNumber(cut, opponent === this.player, 'pink');
            }
        }

        this.updateUI();
    }

    addTurnEffect(target, name, turns, id, desc = null, options = {}) {
        if (this.ABNORMAL_STATUSES.includes(id)) {
            turns = 2;
        }
        const inStarRageWindow = this.starRageWindow && this.starRageWindow.active;
        // Check Status Reflect
        const reflectStatus = target.buffs.turnEffects.find(e => e.id === 'reflect_status');
        if (!inStarRageWindow && reflectStatus && this.ABNORMAL_STATUSES.includes(id)) {
            this.log(`${target.name} 反弹了异常状态！`);
            const source = (target === this.player) ? this.enemy : this.player;
            if (!source.buffs.turnEffects.find(e => e.id === 'reflect_status')) {
                this.addTurnEffect(source, name, turns, id, desc);
            }
            return;
        }

        // Check immunity
        if (!inStarRageWindow && (target.buffs.immuneAbnormal > 0 || target.buffs.immuneAbnormalCount > 0) && this.ABNORMAL_STATUSES.includes(id)) {
            this.log(`${target.name} 免疫了异常状态！`);
            this.showFloatingText("免疫异常", target === this.player);
            if (target.buffs.immuneAbnormalCount > 0) {
                target.buffs.immuneAbnormalCount--;
                this.updateUI();
            }
            return;
        }

        if (!inStarRageWindow && target.buffs.turnEffects.some(e => e.id === 'stagnant') && this.CONTROL_STATUSES.includes(id)) {
            this.log(`${target.name} 处于凝滞，免疫控制！`);
            return;
        }

        // Rebirth Wings Layer 2 Immunity
        if (target.name === "重生之翼" && target.buffs.godlyGloryEnergy >= 2 && this.ABNORMAL_STATUSES.includes(id)) {
            this.log(`${target.name} 神耀能量(2层)免疫异常状态！`);
            return;
        }

        // Check existing
        const existing = target.buffs.turnEffects.find(e => e.id === id);
        if (existing) {
            existing.turns = turns; // Refresh
            if (desc) existing.desc = desc; // Update desc
            Object.assign(existing, options);
            if (id === 'weaken') {
                const maxStacks = options.maxStacks || 5;
                const nextStacks = Math.min((existing.stacks || 1) + 1, maxStacks);
                existing.stacks = nextStacks;
                this.log(`${target.name} 的 ${name} 层数提升至 ${nextStacks}！`);
            } else {
                this.log(`${target.name} 的 ${name} 状态刷新了！`);
            }
        } else {
            const effectData = { name, turns, id, desc, ...options };
            if (id === 'weaken' && typeof effectData.stacks !== 'number') effectData.stacks = 1;
            target.buffs.turnEffects.push(effectData);
            this.log(`${target.name} 陷入了 ${name} 状态！`);
            if (window.TurnEffect && typeof window.TurnEffect.run === 'function') {
                window.TurnEffect.run(id, this, { target, effect: effectData, source: options.source || null });
            }
        }
        this.updateUI();
    }

    async dealDamage(target, power, sureHit = false, ignoreResist = false, ignoreShield = false, isAttack = true, skill = null, ignoreImmune = false) {
        const attacker = (target === this.player) ? this.enemy : this.player;
        const inStarRage = this.starRageWindow && this.starRageWindow.active && this.starRageWindow.attacker === attacker;

        if (attacker.buffs.turnEffects.some(e => e.id === 'submit')) {
            this.log(`${attacker.name} 处于臣服状态，无法造成任何伤害！`);
            this.showFloatingText('臣服', attacker === this.player, '#f88');
            return 0;
        }
        // Star Rage damage buff
        if (this.isStarSovereign(attacker) && attacker.buffs.starRageDamageBuffTurns > 0) {
            power *= 2;
        }

        // Sagross Punish (Attack Fail)
        if (attacker.buffs.turnEffects.some(e => e.id === 'sagross_punish')) {
            this.log(`${attacker.name} 攻击失效！`);
            return 0;
        }

        // Sagross Dodge (70% Immune)
        if (target.buffs.turnEffects.some(e => e.id === 'sagross_dodge') && isAttack) {
            if (Math.random() < 0.7) {
                this.log(`${target.name} 秩序守恒：免疫了攻击！`);
                return 0;
            }
        }

        // King Ray/Generic Immune Next Attack
        const immuneNextIdx = target.buffs.turnEffects.findIndex(e => e.id === 'immune_next_attack');
        if (immuneNextIdx !== -1 && isAttack) {
            if (ignoreImmune) {
                this.log(`${attacker.name} 无视免疫效果，攻击继续！`);
                target.buffs.turnEffects.splice(immuneNextIdx, 1);
            } else {
                this.log(`${target.name} 免疫了本次攻击！`);
                target.buffs.turnEffects.splice(immuneNextIdx, 1);
                return 0;
            }
        }

        // Mecha Gaia Stat Up Trap (Opponent Attack)
        if (target.buffs.turnEffects.some(e => e.id === 'mecha_gaia_stat_trap') && isAttack) {
            this.modifyStats(target, { attack: 1, defense: 1, speed: 1, specialAttack: 1, specialDefense: 1, accuracy: 1 });
            this.log("霸威冠宇：全属性+1！");
        }

        // Aishala Soul Mark: Damage Modifier
        // First/Second check
        // We need to know who moved first.
        // In `dealDamage`, we don't explicitly know turn order unless we check `hasMoved`.
        // If attacker has moved and defender has NOT moved, Attacker is First.
        // If attacker has moved and defender HAS moved, Attacker is Second.
        // Wait, `dealDamage` happens during skill execution.
        // If Attacker is executing, `attacker.buffs.hasMoved` is true (set in useSkill).
        // If Defender `hasMoved` is true, then Defender went first.
        // If Defender `hasMoved` is false, then Attacker went first.

        let isFirst = !target.buffs.hasMoved;
        // Note: This logic assumes 1v1 turn structure where `hasMoved` is reset at start of turn.

        if (attacker.name === "艾夏拉" && isAttack) {
            if (isFirst) {
                finalDamage = Math.floor(finalDamage * 1.5);
                this.log("魂印触发！先出手伤害提升50%！");
            }
        }
        if (target.name === "艾夏拉" && isAttack) {
            // If target is Aishala, and she is defending.
            // If `target.buffs.hasMoved` is true, she moved first.
            // If `target.buffs.hasMoved` is false, she moves second (opponent moved first).
            if (!target.buffs.hasMoved) {
                // Opponent moved first (Aishala moves second)
                finalDamage = Math.floor(finalDamage * 0.5);
                this.log("魂印触发！后出手受到伤害减少50%！");
            }
        }

        // Aishala Dodge (80%)
        if (target.buffs.turnEffects.some(e => e.id === 'aishala_dodge') && isAttack && !sureHit) {
            if (Math.random() < 0.8) {
                this.log(`${target.name} 虚妄幻境：闪避了攻击！`);
                // Dodge triggered. "If NOT triggered, reduce PP".
                // So here we DO NOT reduce PP.
                return 0;
            } else {
                // Dodge failed (Hit).
                // "If not triggered, reduce 2 random skills PP to 0".
                // We should do this here or after damage?
                // Logic says "If not triggered".
                const skills = attacker.skills.filter(s => s.pp > 0);
                if (skills.length > 0) {
                    // Pick 2 random
                    for (let i = 0; i < 2; i++) {
                        if (skills.length === 0) break;
                        const idx = Math.floor(Math.random() * skills.length);
                        skills[idx].pp = 0;
                        skills.splice(idx, 1);
                    }
                    this.log("虚妄幻境：闪避失败，对手2项技能PP归零！");
                }
            }
        }

        // Aishala Sleep Trap (If attacked -> Sleep)
        if (target.buffs.turnEffects.some(e => e.id === 'aishala_sleep_trap') && isAttack) {
            this.addStatus(attacker, 'sleep');
            this.log("虚妄幻境：受到攻击，对手睡眠！");
        }

        // 1. Check Shield/Block
        if (target.buffs.shield > 0 && !ignoreShield && !inStarRage) {
            this.log(`${target.name} 抵挡了攻击！`);
            target.buffs.shield--;
            this.updateUI();
            return 0;
        }

        let multiplier = 1;

        // 2. Attacker Multipliers

        const damageType = this.detectDamageType(skill);
        const skillElement = this.detectElement(skill);

        // Stats (Attack/SpecialAttack)
        const offensiveStage = this.getOffensiveStage(attacker, damageType);
        if (offensiveStage > 0) multiplier *= (1 + offensiveStage * 0.5);
        if (offensiveStage < 0) multiplier *= (1 / (1 + Math.abs(offensiveStage) * 0.5));

        // Burn Effect (Attack Power -50%)
        if (attacker.buffs.turnEffects.some(e => e.id === 'burn')) {
            multiplier *= 0.5;
            this.log("烧伤状态下攻击威力减半！");
        }

        if (attacker.buffs.turnEffects.some(e => e.id === 'curse_weak')) {
            multiplier *= 0.5;
            this.log("虚弱诅咒：造成的攻击伤害降低！");
        }

        // STAB (Same Type Attack Bonus) - 50% Bonus
        // Note: Currently skill elements are not explicitly defined in data, assuming skill type matches for now if we had data.
        // For now, we skip explicit STAB check unless we add 'element' to skills.
        // Implementation: If we add element to skills later, add: if (skill.element === attacker.element) multiplier *= 1.5;

        // Incalos Soul Mark (Type Effectiveness >= 2x)
        // We simulate this by giving a flat 2x multiplier for Incalos's attacks
        if (attacker.name === "光之惩戒·英卡洛斯" && isAttack) {
            multiplier *= 2;
            this.log("魂印触发！克制倍数至少为2！");
        }

        // Surging Canglan Damage Stack (Apply existing stack)
        if (attacker.name === "怒涛·沧岚" && attacker.buffs.damageStack > 0) {
            const boost = 1 + (attacker.buffs.damageStack * 0.25);
            multiplier *= boost;
            this.log(`魂印触发！伤害提升 ${(boost - 1) * 100}%！`);
        }

        // Vulnerability (Target Debuff)
        const vulnEffect = target.buffs.turnEffects.find(e => e.id === 'vulnerability');
        if (vulnEffect) {
            let pct = 100;
            if (vulnEffect.params && vulnEffect.params[1]) pct = vulnEffect.params[1];
            multiplier *= (1 + pct / 100);
            this.log(`对手处于易伤状态，伤害提升${pct}%！`);
        } else if (target.buffs.vulnerability > 0) {
            multiplier *= 2;
            this.log("对手处于易伤状态，伤害翻倍！");
        }

        if (target.buffs.turnEffects.some(e => e.id === 'curse_fatal')) {
            multiplier *= 1.5;
            this.log("致命诅咒：受到的伤害提升50%！");
        }

        // Rebirth Wings Layer 6 Damage Boost
        if (attacker.name === "重生之翼" && attacker.buffs.godlyGloryEnergy >= 6 && isAttack) {
            multiplier *= 1.6;
            this.log("神耀能量(6层)：伤害提升60%！");
        }

        const weakenStatus = target.buffs.turnEffects.find(e => e.id === 'weaken');
        if (weakenStatus) {
            const stacks = typeof weakenStatus.stacks === 'number' ? weakenStatus.stacks : 1;
            const bonus = 1 + stacks * 0.25;
            multiplier *= bonus;
            this.log(`对手处于衰弱（${stacks}层），伤害提升${Math.round((bonus - 1) * 100)}%！`);
        }

        // Vulnerability Aura (Attacker Buff)
        if (attacker.buffs.turnEffects.some(e => e.id === 'vulnerability_aura')) {
            multiplier *= 2;
            this.log("易伤光环生效，伤害翻倍！");
        }

        // Agnes Damage Boost (Soul Mark)
        if (attacker.buffs.damageBoostNext > 0) {
            const boostVal = attacker.buffs.damageBoostVal || 100;
            multiplier *= (1 + boostVal / 100);
            attacker.buffs.damageBoostNext--;
            this.log(`伤害提升生效 (+${boostVal}%)！`);
        }

        // Sagross Power Chance
        if (attacker.buffs.turnEffects.some(e => e.id === 'sagross_power_chance') && isAttack) {
            if (Math.random() < 0.5) {
                multiplier *= 2;
                this.log("魂印触发！威力翻倍！");
            }
        }

        // Crit
        if (attacker.buffs.critNext > 0) {
            multiplier *= 2;
            attacker.buffs.lastHitCrit = true;
            this.log("致命一击！");
        } else {
            // Random Crit (Default 5%)
            // My engine doesn't have random crit logic here?
            // Ah, line 1838: Math.random() * 0.2 + 0.9. That's variance, not crit.
            // Crit is usually handled before.
            // Wait, where is random crit?
            // It seems my engine DOES NOT have random crit by default unless `critNext` is set?
            // Or maybe I missed it.
            // Let's check `game.js` again.
            // Line 234: "致命率每次+20%".
            // Line 1824: Checks `critNext`.
            // It seems random crit is NOT implemented in `dealDamage`?
            // If so, `Silver Mist Wings` "Crit: 10/16" implies I need to implement random crit.
            // I should add random crit check here.

            // 10/16 is high (62.5%).
            // I should check skill.crit rate if available.
            // The skill definition has `crit: 10/16`. But I didn't add it to the object in `charData`.
            // I should add `crit` property to skills in `charData` if I want to use it.
            // But for now, I'll just add a generic crit check if I can.
            // Or just rely on `critNext`.

            // If I want to support "10/16 crit", I need to pass `skill` to `dealDamage`.
            // `dealDamage` has `skill` argument.

            let critRate = 0.05; // Default 5%
            if (skill && skill.crit) {
                // Parse "10/16" or number
                if (typeof skill.crit === 'string' && skill.crit.includes('/')) {
                    const parts = skill.crit.split('/');
                    critRate = parseInt(parts[0]) / parseInt(parts[1]);
                } else {
                    critRate = skill.crit;
                }
            }

            if (Math.random() < critRate) {
                multiplier *= 2;
                attacker.buffs.lastHitCrit = true;
                this.log("致命一击！");
            } else {
                attacker.buffs.lastHitCrit = false;
            }
        }

        // 3. Calculate Final Damage
        // 4. Defensive Multipliers (apply before rolling final damage)
        const defensiveStage = this.getDefensiveStage(target, damageType);
        if (defensiveStage > 0) {
            multiplier *= (1 / (1 + Math.abs(defensiveStage) * 0.5));
        } else if (defensiveStage < 0) {
            multiplier *= (1 + Math.abs(defensiveStage) * 0.5);
        }

        let finalDamage = Math.floor(power * multiplier * (sureHit || inStarRage ? 1 : (Math.random() * 0.2 + 0.9)));

        // Agnes (Dominance) - 50% Damage Reduction (Removed in favor of standardized effects, but keeping if needed? No, Agnes doesn't have dmg reduction in new description)
        // Description: "受到致命攻击时残留1点... 回合开始若体力>对手... 回合结束若体力<对手..."
        // No damage reduction in description.

        // Gaia Soul Mark (Defender)
        if (target.name === "王·盖亚") {
            const hasStatus = target.buffs.turnEffects.some(e => ['burn', 'poison', 'sleep', 'paralyze', 'freeze', 'fear'].includes(e.id));
            if (hasStatus) {
                finalDamage = Math.floor(finalDamage * 0.5);
                this.log("魂印触发！伤害减少50%！");
                this.showFloatingText("魂印: 减伤", target === this.player);
            }
        }

        // Solensen Soul Mark (Defender)
        if (target.name === "混沌魔君索伦森" && target.buffs.solensenGuardReduction) {
            finalDamage = Math.floor(finalDamage * 0.5);
            this.log("魂印触发！伤害减少50%！");
            this.showFloatingText("魂印: 减伤", target === this.player);
            if (target.buffs.solensenGuardImmune && Math.random() < 0.5) {
                finalDamage = 0;
                this.log("魂印触发！免疫了本次攻击伤害！");
                this.showFloatingText("魂印: 免疫", target === this.player);
            }
        }

        // Star Sovereign Star Rage damage reduction
        if (this.isStarSovereign(target) && target.buffs.starRageDmgReduceCount > 0) {
            finalDamage = Math.floor(finalDamage * 0.5);
            target.buffs.starRageDmgReduceCount--;
            this.log("星皇之怒减伤生效，伤害减少50%！");
        }

        // Rebirth Wings Layer 1 Damage Reduction
        if (target.name === "重生之翼" && target.buffs.godlyGloryEnergy >= 1) {
            const layers = target.buffs.godlyGloryEnergy;
            const reduction = 0.08 * layers; // 8% per layer
            // Max 6 layers = 48%
            finalDamage = Math.floor(finalDamage * (1 - reduction));
            this.log(`神耀能量(${layers}层)减伤 ${Math.round(reduction * 100)}%！`);
        }

        // Star Sovereign Star Rage damage reduction
        if (this.isStarSovereign(target) && target.buffs.starRageDmgReduceCount > 0) {
            finalDamage = Math.floor(finalDamage * 0.5);
            target.buffs.starRageDmgReduceCount--;
            this.log("星皇之怒减伤生效，伤害减少50%！");
        }

        // Shield HP (Surging Canglan)
        if (target.buffs.shieldHp > 0 && !inStarRage) {
            if (target.buffs.shieldHp >= finalDamage) {
                target.buffs.shieldHp -= finalDamage;
                this.log(`护盾抵挡了 ${finalDamage} 点伤害！`);
                finalDamage = 0;
            } else {
                finalDamage -= target.buffs.shieldHp;
                this.log(`护盾抵挡了 ${target.buffs.shieldHp} 点伤害！`);
                target.buffs.shieldHp = 0;
            }
            this.updateUI();
        }

        // 5. Apply Damage & Check Fatal

        // Agnes Fatal (Soul Mark)
        if (target.name === "不灭·艾恩斯" && target.hp - finalDamage <= 0) {
            if (target.buffs.agnesFatalCount > 0) {
                target.hp = 1;
                target.buffs.agnesFatalCount--;
                target.buffs.agnesFatalTriggeredThisTurn = true; // Protection flag
                this.log("不灭·艾恩斯魂印触发！残留1点体力！");
                this.showFloatingText("魂印: 残留", target === this.player, 'red');

                this.clearStats(target);
                this.clearStats(attacker);
                this.clearTurnEffects(target);
                this.clearTurnEffects(attacker);
                this.addTurnEffect(attacker, '焚烬', 2, 'immolate');
                this.updateUI();
                return finalDamage; // Or adjusted damage?
            } else if (target.buffs.agnesFatalTriggeredThisTurn) {
                // Already triggered this turn, keep at 1 HP
                target.hp = 1;
                this.log("不灭·艾恩斯魂印保护！体力维持1點！");
                return 0;
            }
        }

        // Incalos Death Passive (Blessing)
        if (target.name === "光之惩戒·英卡洛斯" && target.hp - finalDamage <= 0 && !target.buffs.incalosBlessingTriggered) {
            target.hp = 1;
            target.buffs.incalosBlessingTriggered = true;
            target.buffs.incalosBlessingActive = true;
            this.log("光之惩戒·英卡洛斯魂印触发！圣光祝福护佑，残留1点体力！");
            this.showFloatingText("圣光祝福", target === this.player, 'gold');
            return finalDamage; // Damage is dealt but capped at 1 HP effectively by logic? 
            // Actually, if I set HP to 1 here, and return finalDamage, result is 0.
            // I should return 0 and set HP to 1.
            return 0;
        }

        // Route through damage system for统一判定
        finalDamage = this.damageSystem.apply({ type: 'attack', source: attacker, target, amount: finalDamage, label: "" });

        if (finalDamage > 0 && target.buffs.reflectDamage > 0 && !inStarRage) {
            target.buffs.reflectDamage--;
            const ratio = target.buffs.reflectDamageMultiplier || 100;
            const reflected = Math.max(1, Math.floor(finalDamage * ratio / 100));
            attacker.hp = Math.max(0, attacker.hp - reflected);
            this.log(`${target.name} 将伤害反弹，${attacker.name} 受到 ${reflected} 点伤害！`);
            this.showFloatingText('弹伤', target === this.player, '#ffcc00');
            this.showDamageNumber(reflected, attacker === this.player, 'pink');
            if (target.buffs.reflectDamage === 0) {
                target.buffs.reflectDamageMultiplier = 100;
            }
        }

        if (finalDamage > 0 && isAttack) {
            target.buffs.tookDamage = true;

            // Sleep: Wake on hit
            const sleepIdx = target.buffs.turnEffects.findIndex(e => e.id === 'sleep');
            if (sleepIdx !== -1) {
                target.buffs.turnEffects.splice(sleepIdx, 1);
                this.log(`${target.name} 受到攻击，从睡眠中醒来了！`);
                this.updateUI();
            }

            // Agnes Burn on Hit (Soul Mark) - Dominance Mode
            if (target.name === "不灭·艾恩斯") {
                if (target.buffs.agnesState === 'dominance') {
                    this.addTurnEffect(attacker, '焚烬', 2, 'immolate');
                    target.buffs.agnesTriggered = true;
                    this.log("魂印触发！对手被焚烬！");
                    this.showFloatingText("魂印: 焚烬", target === this.player);
                } else {
                    // Fortitude Mode (HP <= Opp) -> Eliminate Turns
                    // User requested: "Only attack skills trigger it".
                    // Since we are in dealDamage, this is an attack.
                    if (attacker.buffs.turnEffects.length > 0) {
                        this.clearTurnEffects(attacker);
                        this.log("魂印触发！消除了对手的回合效果！");
                        this.showFloatingText("魂印: 消除", target === this.player);
                        this.updateUI();
                    }
                }
            }
        }

        if (skillElement === 'fire') {
            const flammableIndex = target.buffs.turnEffects.findIndex(e => e.id === 'flammable');
            if (flammableIndex !== -1) {
                target.buffs.turnEffects.splice(flammableIndex, 1);
                this.log(`${target.name} 因火焰引燃，转化为烧伤！`);
                this.addTurnEffect(target, '烧伤', 2, 'burn');
            }
        }

        this.showDamageNumber(finalDamage, target === this.player);

        const sprite = target === this.player ? this.ui.playerSprite : this.ui.enemySprite;
        if (sprite) {
            sprite.classList.add('shake');
            await this.wait(500);
            sprite.classList.remove('shake');
        }

        // Incalos Reactive Trap (Receive Damage)
        if (target.buffs.turnEffects.some(e => e.id === 'incalos_hit_trap')) {
            // "3 turns... receive damage... make opponent exhaust. Else absorb 1/3"
            const immune = (attacker.buffs.immuneAbnormal > 0 || attacker.buffs.immuneAbnormalCount > 0);
            if (!immune) {
                this.addTurnEffect(attacker, '疲惫', 1, 'exhaust');
                this.log("光之惩戒：对手疲惫！");
            } else {
                const absorb = Math.floor(attacker.maxHp / 3);
                attacker.hp = Math.max(0, attacker.hp - absorb);
                this.heal(target, absorb, "光之惩戒");
                this.log(`光之惩戒：对手免疫疲惫，吸取 ${absorb} 体力！`);
                this.showDamageNumber(absorb, attacker === this.player, 'pink');
            }
        }

        // Mecha Gaia Death Passive (Intercept)
        if (target.name === "圣甲·盖亚" && target.hp <= 0 && !target.buffs.mechaGaiaDeathTriggered) {
            target.buffs.mechaGaiaDeathTriggered = true;
            target.buffs.mechaGaiaDeathDamage = finalDamage;
            this.log("魂印触发！受到致死伤害，准备反击！");
            // Logic handled in checkWinCondition or end of turn?
            // "At the end of the turn directly deduct opponent HP equal to damage taken".
            // "If both die, self heal 1 HP".
            // We need to keep Gaia "alive" or handle this in win condition.
            // Let's keep Gaia at 0 HP but not declare dead yet?
            // Or use a flag to process at end of turn.
            // But if Gaia is at 0 HP, game might end.
            // Let's use `checkWinCondition` to handle this.
        }

        this.updateUI();
        this.updateUI();
        this.updateUI();
        this.log(`造成 ${finalDamage} 伤害!`);
        target.buffs.lastDamageTaken = finalDamage; // Track last damage
        if (target.name === "圣王·萨格罗斯") target.buffs.sagrossDmgTaken += finalDamage; // Track for Sagross

        // Mecha Gaia Activate Heal (Once moved/attacked?)
        // "From the moment self takes action".
        // If this is Mecha Gaia attacking, set flag.
        // If this is Mecha Gaia defending, does it count?
        // "Self takes action" usually means using a skill.
        // So we should set this in `useSkill` or `resolveSkill`.

        return finalDamage;
    }

    async tryStarRage(attacker, defender, skill, reason = 'normal') {
        if (!this.isStarSovereign(attacker)) return;
        if (this.starRageWindow.active) return;
        if (!defender || defender.hp <= 0) return;
        if (skill.pp !== undefined && skill.pp <= 0) return;

        const hasStarEffect = !!skill.starRageType;
        const successTrigger = (reason === 'normal' && hasStarEffect);
        const failTrigger = (reason === 'invalid');
        if (!successTrigger && !failTrigger) return;

        // chance = 50% * factor + bonus
        let chance = 50 * (attacker.buffs.starRageChanceFactor || 1);
        chance += attacker.buffs.starRageChanceBonus || 0;
        if (chance > 100) chance = 100;

        if (Math.random() * 100 < chance) {
            this.log("星皇之怒触发！");
            await this.executeStarRage(attacker, defender, skill);
        }
    }

    async executeStarRage(attacker, defender, skill) {
        this.starRageWindow.active = true;
        this.starRageWindow.attacker = attacker;

        // Clone to avoid mutating original PP
        const rageSkill = { ...skill };
        const isAttackSkill = rageSkill.type === 'attack' || rageSkill.type === 'ultimate';
        const basePower = isAttackSkill ? rageSkill.power : 0;
        const shouldHalve = attacker.buffs.starRageNoHalveCount > 0 ? false : true;
        const ragePower = shouldHalve ? basePower * 0.5 : basePower;
        if (attacker.buffs.starRageNoHalveCount > 0) attacker.buffs.starRageNoHalveCount--;

        if (rageSkill.effects && window.SkillEffects) {
            const ctx = {
                phase: 'before',
                damageMultiplier: shouldHalve ? 0.5 : 1,
                ignoreResist: true,
                ignoreShield: true,
                ignoreImmune: false,
                sureHit: true,
                damageDealt: 0,
                starRage: true
            };
            for (const eff of rageSkill.effects) {
                if (window.SkillEffects[eff.id]) window.SkillEffects[eff.id](this, attacker, defender, eff.args, ctx);
            }
            if (isAttackSkill && ragePower > 0) {
                ctx.phase = 'damage_calc';
                for (const eff of rageSkill.effects) {
                    if (window.SkillEffects[eff.id]) window.SkillEffects[eff.id](this, attacker, defender, eff.args, ctx);
                }
                const dmg = await this.dealDamage(defender, ragePower * ctx.damageMultiplier, true, true, true, true, rageSkill, ctx.ignoreImmune);
                ctx.damageDealt = dmg;
            }
            ctx.phase = 'after';
            for (const eff of rageSkill.effects) {
                if (window.SkillEffects[eff.id]) window.SkillEffects[eff.id](this, attacker, defender, eff.args, ctx);
            }
        }

        this.starRageWindow.active = false;
        this.starRageWindow.attacker = null;
        // Mecha Gaia Activate Heal
        if (attacker.name === "圣甲·盖亚") {
            attacker.buffs.mechaGaiaHealActive = true;
        }

        await this.checkWinCondition();
    }

    async checkWinCondition() {
        // Mecha Gaia Death Logic
        const p = this.player;
        const e = this.enemy;

        // Check if Mecha Gaia is "dead" but has death trigger
        if (p.name === "圣甲·盖亚" && p.hp <= 0 && p.buffs.mechaGaiaDeathTriggered) {
            // Deduct HP from opponent
            e.hp = Math.max(0, e.hp - p.buffs.mechaGaiaDeathDamage);
            this.log(`魂印拦截：扣除对手 ${p.buffs.mechaGaiaDeathDamage} 点体力！`);
            this.showDamageNumber(p.buffs.mechaGaiaDeathDamage, false, 'red');

            // Check if opponent also died
            if (e.hp <= 0) {
                p.hp = 1;
                this.log("双方同时死亡，圣甲·盖亚恢复1点体力！");
                this.showFloatingText("+1", true, 'green');
                p.buffs.mechaGaiaDeathTriggered = false; // Reset
                this.updateUI();
                return; // Continue game
            }
            // If opponent not dead, Gaia dies.
        }
        if (e.name === "圣甲·盖亚" && e.hp <= 0 && e.buffs.mechaGaiaDeathTriggered) {
            p.hp = Math.max(0, p.hp - e.buffs.mechaGaiaDeathDamage);
            this.log(`魂印拦截：扣除对手 ${e.buffs.mechaGaiaDeathDamage} 点体力！`);
            this.showDamageNumber(e.buffs.mechaGaiaDeathDamage, true, 'red');

            if (p.hp <= 0) {
                e.hp = 1;
                this.log("双方同时死亡，圣甲·盖亚恢复1点体力！");
                this.showFloatingText("+1", false, 'green');
                e.buffs.mechaGaiaDeathTriggered = false;
                this.updateUI();
                return;
            }
        }

        if (this.player.hp <= 0) {
            // Rebirth Wings Revive Logic
            if (this.player.name === "重生之翼" && !this.player.buffs.rebirthWingsRevived) {
                const deadAllies = this.playerTeam.filter(c => c.hp <= 0 && c.name !== "重生之翼");
                if (deadAllies.length > 0) {
                    const lucky = deadAllies[Math.floor(Math.random() * deadAllies.length)];
                    lucky.hp = lucky.maxHp;
                    this.player.buffs.rebirthWingsRevived = true;
                    this.log(`重生之翼魂印触发！复活了 ${lucky.name}！`);
                }
            }

            // Check if team has others
            if (this.playerTeam.some(c => c.hp > 0)) {
                this.log(`${this.player.name} 倒下了！请更换精灵！`);
                this.toggleSwitch(); // Force switch
                return true; // Pause loop
            } else {
                this.log("你战败了...");
                return true;
            }
        }
        if (this.enemy.hp <= 0) {
            // Rebirth Wings Kill Reset Logic
            if (this.player.name === "重生之翼") {
                this.player.buffs.godlyGloryEnergy = 0;
                this.player.buffs.rebirthWingsResetPriority = 1; // Next turn +3
                this.log("重生之翼击败对手！神耀能量清零，下回合先制+3！");
                this.updateUI();
            }

            if (this.activeEnemyIndex < this.enemyTeam.length - 1) {
                this.activeEnemyIndex++;
                this.log(`对手派出了 ${this.enemy.name}!`);
                this.timeline.emit(TurnPhases.OPEN_TURN, { actor: this.enemy, opponent: this.player, isPlayer: false });
                this.handleEntryEffects(this.enemy, this.player);
                this.updateUI();
                return false; // Continue
            } else {
                this.log("对手被击败！你赢了！");
                return true;
            }
        }
        return false;
    }

    // --- Helper Methods ---
    modifyStats(target, changes) {
        const allowedStats = ['attack', 'defense', 'speed', 'specialAttack', 'specialDefense', 'accuracy'];
        // Check immunity
        if (target.buffs.immuneStatDrop > 0) {
            let blocked = false;
            for (let key in changes) {
                if (changes[key] < 0) {
                    changes[key] = 0;
                    blocked = true;
                }
            }
            if (blocked) this.log(`${target.name} 免疫了能力下降！`);
        }
        if (this.isStarSovereign(target)) {
            let blocked = false;
            for (let key in changes) {
                if (changes[key] < 0) {
                    changes[key] = 0;
                    blocked = true;
                }
            }
            if (blocked) this.log(`${target.name} 的魂印免疫能力下降！`);
        }
        // Incalos Immune Stat Drop
        if (target.name === "光之惩戒·英卡洛斯") {
            let blocked = false;
            for (let key in changes) {
                if (changes[key] < 0) {
                    changes[key] = 0;
                    blocked = true;
                }
            }
            if (blocked) this.log(`${target.name} 魂印免疫能力下降！`);
        }
        // Rebirth Wings Layer 2 Immune Stat Drop
        if (target.name === "重生之翼" && target.buffs.godlyGloryEnergy >= 2) {
            let blocked = false;
            for (let key in changes) {
                if (changes[key] < 0) {
                    changes[key] = 0;
                    blocked = true;
                }
            }
            if (blocked) this.log(`${target.name} 神耀能量(2层)免疫能力下降！`);
        }
        // Check Immune Stat Up (Solensen)
        if (target.buffs.turnEffects.some(e => e.id === 'immune_stat_up')) {
            let blocked = false;
            for (let key in changes) {
                if (changes[key] > 0) {
                    changes[key] = 0;
                    blocked = true;
                }
            }
            if (blocked) this.log(`${target.name} 无法强化！`);
        }

        // Check Solensen Aura (Bound to Solensen)
        const opponent = (target === this.player) ? this.enemy : this.player;
        if (opponent.name === "混沌魔君索伦森" && opponent.buffs.solensenStatBlockAura > 0) {
            let blocked = false;
            for (let key in changes) {
                if (changes[key] > 0) {
                    changes[key] = 0;
                    blocked = true;
                }
            }
            if (blocked) this.log(`【魂印】源：${target.name} 无法强化！`);
        }

        for (let [stat, val] of Object.entries(changes)) {
            if (!allowedStats.includes(stat)) continue;
            target.buffs.statUps[stat] = (target.buffs.statUps[stat] || 0) + val;
            // Cap at 6 / -6
            target.buffs.statUps[stat] = Math.max(-6, Math.min(6, target.buffs.statUps[stat]));
        }
        this.updateUI();
    }
    reverseStats(target, onlyPositive = false) {
        let reversed = false;
        for (let key in target.buffs.statUps) {
            if (onlyPositive) {
                if (target.buffs.statUps[key] > 0) {
                    target.buffs.statUps[key] *= -1;
                    reversed = true;
                }
            } else {
                if (target.buffs.statUps[key] < 0) {
                    target.buffs.statUps[key] *= -1;
                    reversed = true;
                }
            }
        }
        if (reversed) this.log(`反转了${target.name}的能力状态！`);
        this.updateUI();
        return reversed;
    }
    clearStats(target) {
        let cleared = false;
        for (let key in target.buffs.statUps) {
            if (target.buffs.statUps[key] > 0) {
                target.buffs.statUps[key] = 0;
                cleared = true;
            }
        }
        if (cleared) {
            this.log(`消除了${target.name}的能力提升！`);

            // Sagross Stat Guard (If self stat boost disappear -> Clear opponent turn effects)
            if (target.name === "圣王·萨格罗斯" && target.buffs.turnEffects.some(e => e.id === 'sagross_stat_guard')) {
                const opponent = (target === this.player) ? this.enemy : this.player;
                if (opponent.buffs.turnEffects.length > 0) {
                    this.clearTurnEffects(opponent);
                    this.log("众生恩赐触发！消除了对手的回合效果！");
                }
            }
        }
        return cleared;
    }

    clearTurnEffects(target) {
        if (target.buffs.rayProtectTurnEffects) {
            this.log("魂印触发！王·雷伊的回合类效果无法被消除！");
            return false;
        }
        if (target.buffs.turnEffects.length > 0) {
            target.buffs.turnEffects = [];
            this.log(`消除了${target.name}的回合类效果！`);
            return true;
        }
        return false;
    }

    stealStats(thief, victim) {
        let stolen = false;
        for (let key in victim.buffs.statUps) {
            if (victim.buffs.statUps[key] > 0) {
                thief.buffs.statUps[key] = (thief.buffs.statUps[key] || 0) + victim.buffs.statUps[key];
                victim.buffs.statUps[key] = 0;
                stolen = true;
            }
        }
        this.updateUI();
        return stolen;
    }
    hasStatUps(char) { return Object.values(char.buffs.statUps).some(v => v > 0); }
    heal(target, amount, source = "恢复") {
        // Check Heal Block
        const healBlock = target.buffs.turnEffects.find(e => e.id === 'heal_block');
        if (healBlock && source !== "魂印") {
            this.log(`${target.name} 被禁疗，无法恢复体力！`);
            this.showFloatingText("禁疗", target === this.player, '#f00');
            return 0;
        }

        const actual = Math.min(target.maxHp - target.hp, amount);
        target.hp += actual;
        this.log(`${target.name} ${source}了 ${actual} 点体力！`);
        this.showDamageNumber(actual, target === this.player, 'green'); // Show green number
        this.updateUI();
        return actual;
    }
    showDamageNumber(amount, isPlayer, type = 'normal') {
        const el = document.createElement('div');
        el.className = `damage-number ${type === 'heal' ? 'heal' : ''} ${type === 'pink' ? 'pink' : ''}`;
        el.innerText = amount;
        el.style.left = isPlayer ? '25%' : '75%';
        el.style.top = '40%';
        this.ui.damageOverlay.appendChild(el);
        setTimeout(() => el.remove(), 1000);
    }

    showFloatingText(text, isPlayer, color = '#fff') {
        if (!this.floatingTextQueue) this.floatingTextQueue = [];
        this.floatingTextQueue.push({ text, isPlayer, color });
        if (!this.isProcessingFloatingText) {
            this.processFloatingTextQueue();
        }
    }

    async processFloatingTextQueue() {
        this.isProcessingFloatingText = true;
        while (this.floatingTextQueue.length > 0) {
            const { text, isPlayer, color } = this.floatingTextQueue.shift();
            const el = document.createElement('div');
            el.className = 'floating-text';
            el.innerText = text;
            el.style.color = color;
            el.style.left = isPlayer ? '25%' : '75%';
            el.style.top = '30%';
            this.ui.damageOverlay.appendChild(el);

            // Wait for animation or fixed time
            await this.wait(800); // Show next one after 800ms

            // Remove element after animation completes (CSS usually 2s)
            setTimeout(() => el.remove(), 2000);
        }
        this.isProcessingFloatingText = false;
    }
    wait(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }

    async resolveSkill(attacker, defender, skill) {
        let damage = 0;

        // --- New Skill System (Effect IDs) ---
        if (skill.effects && window.SkillEffects) {
            const context = {
                phase: 'before',
                damageMultiplier: 1,
                ignoreResist: false,
                ignoreShield: false,
                ignoreImmune: false,
                sureHit: false, // Not fully implemented in dealDamage yet
                damageDealt: 0,
                starRage: false
            };

            // Timeline: 技能命中前节点
            this.timeline.emit(TurnPhases.BEFORE_HIT, { attacker, defender, skill, context });

            attacker.buffs.lastHitCrit = false; // Reset crit flag

            // 1. Pre-Damage Effects
            for (const effect of skill.effects) {
                if (window.SkillEffects[effect.id]) {
                    window.SkillEffects[effect.id](this, attacker, defender, effect.args, context);
                }
            }

            // 2. Deal Damage
            if (skill.power > 0 || skill.type === 'attack' || skill.type === 'ultimate') {
                context.phase = 'damage_calc';
                for (const effect of skill.effects) {
                    if (window.SkillEffects[effect.id]) {
                        window.SkillEffects[effect.id](this, attacker, defender, effect.args, context);
                    }
                }

                const finalPower = skill.power * context.damageMultiplier;
                const isSureHit = context.sureHit || skill.desc.includes('必中') || skill.type === 'ultimate';
                const isAttackSkill = skill.type === 'attack' || skill.type === 'ultimate';
                damage = await this.dealDamage(defender, finalPower, isSureHit, context.ignoreResist, context.ignoreShield, isAttackSkill, skill, context.ignoreImmune);
                context.damageDealt = damage;

                // Timeline: 技能命中时节点
                this.timeline.emit(TurnPhases.ON_HIT, { attacker, defender, skill, context });
            }

            // 3. Post-Damage Effects
            context.phase = 'after';
            for (const effect of skill.effects) {
                if (window.SkillEffects[effect.id]) {
                    window.SkillEffects[effect.id](this, attacker, defender, effect.args, context);
                }
            }
            // Timeline: 技能命中后节点
            this.timeline.emit(TurnPhases.AFTER_HIT, { attacker, defender, skill, context });
            await this.tryStarRage(attacker, defender, skill, 'normal');

            // Incalos Soul Mark Attack Effect (Post-Skill)
            if (attacker.name === "光之惩戒·英卡洛斯" && (skill.type === 'attack' || skill.type === 'ultimate')) {
                const dmg = context.damageDealt;
                if (dmg > 280) {
                    const extra = Math.floor(defender.maxHp / 3);
                    defender.hp = Math.max(0, defender.hp - extra);
                    this.log(`伤害>280，魂印附加 ${extra} 点百分比伤害！`);
                    this.showDamageNumber(extra, defender === this.player, 'pink');
                    this.addTurnEffect(defender, '封属', 1, 'block_attr', '下回合无法使用属性技能');
                    this.log("对手下回合无法使用属性技能！");
                } else {
                    const absorb = Math.floor(defender.maxHp / 3);
                    defender.hp = Math.max(0, defender.hp - absorb);
                    this.heal(attacker, absorb, "魂印");
                    this.log(`伤害<280，魂印吸取 ${absorb} 体力！`);
                    this.showDamageNumber(absorb, defender === this.player, 'pink');
                    attacker.buffs.critNext = 1;
                    this.log("下回合攻击必定致命一击！");
                }
            }

            return; // Skip legacy logic
        }

        // Fallback for generic attacks
        if (skill.type === 'attack' || skill.type === 'ultimate') {
            if (damage === 0) { // If not already dealt
                const isAttackSkill = skill.type === 'attack' || skill.type === 'ultimate';
                damage = await this.dealDamage(defender, skill.power, false, false, false, isAttackSkill, skill, false);
            }
            // Generic Side Effects
            if (skill.effect === 'burn') this.addTurnEffect(defender, '焚烬', 2, 'immolate');
        }

        // Generic Buff Effects (Legacy Support)
        if (skill.effect) {
            if (skill.effect === 'poison') this.addTurnEffect(defender, '中毒', 2, 'poison');
            if (skill.effect === 'sleep') this.addTurnEffect(defender, '睡眠', 2, 'sleep');
            if (skill.effect === 'paralyze') this.addTurnEffect(defender, '麻痹', 2, 'paralyze');
            if (skill.effect === 'stats_all') this.modifyStats(attacker, { attack: 1, defense: 1, speed: 1, specialAttack: 1, specialDefense: 1 });
            if (skill.effect === 'defense_2') {
                this.modifyStats(attacker, { defense: 2 });
                attacker.buffs.shield = 1;
                this.log(`${attacker.name} 防御大幅提升并准备抵挡攻击！`);
                this.updateUI();
            }
            if (skill.effect === 'speed_down') this.modifyStats(defender, { speed: -2 });
            if (skill.effect === 'block') { attacker.buffs.shield = 1; this.log(`${attacker.name} 准备抵挡下一次攻击！`); }
            if (skill.effect === 'heal') this.heal(attacker, Math.floor(attacker.maxHp / 2));
            if (skill.effect === 'cleanse') { attacker.buffs.turnEffects = []; this.log(`${attacker.name} 消除了自身回合效果！`); }
            if (skill.effect === 'dispel') { this.clearStats(defender); }
            if (skill.effect === 'immune_cc') this.addTurnEffect(attacker, '免疫异常', 5, 'immune_cc');
            if (skill.effect === 'regen') this.addTurnEffect(attacker, '再生', 5, 'regen');
            if (skill.effect === 'weakness') {
                this.modifyStats(defender, { attack: -1, specialAttack: -1 });
                this.log(`${attacker.name} 削弱了对手的攻击！`);
            }
        }
    }
}

// --- Game Mechanics Documentation (Based on Seer Wiki) ---
// 1. Stat Stages (能力等级): -6 to +6
//    - Attack/SpAttack: >0: +50% per stage (e.g. +2 = 200%); <0: Inverse (e.g. -2 = 50%)
//    - Defense/SpDefense: >0: +50% per stage (e.g. +2 = 200% Def = 50% Dmg); <0: Inverse (e.g. -2 = 50% Def = 200% Dmg)
//    - Speed: >0: +50% per stage; <0: Inverse
//    - Accuracy: >0: +50% Hit Rate; <0: -15% (-1~-3), -10% (-4~-6)
// 
// 2. Damage Types (伤害类型):
//    - Skill Damage (技能伤害): Affected by Atk/Def, Type Effectiveness, Buffs. (Physical/Special)
//    - Fixed Damage (固定伤害): Fixed value, unaffected by Def/Type. Affected by Shield/Reductions.
//    - Percentage Damage (百分比伤害): Based on Max HP. Unaffected by Def/Type.
//    - True Damage (真实伤害): Ignores all reductions/shields.
// 
// 3. Status Effects (异常状态):
//    - Burn (烧伤): 1/8 Max HP dmg/turn, Attack Power -50%.
//    - Poison/Frostbite (中毒/冻伤): 1/8 Max HP dmg/turn.
//    - Sleep (睡眠): Cannot move, cleared on hit.
//    - Paralyze/Fear (麻痹/害怕): Cannot move.
//    - Silence (沉默): 1/8 Max HP dmg/turn, Cannot use 5th Skill (In this engine: Cannot use Attribute Skills).
// 
// 4. Turn Order (出手顺序):
//    - Priority (先制) > Speed (速度) > Random.
//    - Start of Turn Effects: Trigger before Priority check.
// ---------------------------------------------------------

window.onload = () => {
    window.game = new Game();
};
