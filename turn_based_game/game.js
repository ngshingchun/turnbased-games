class Game {
    constructor() {
        // --- Character Data Definitions ---
        this.charData = {
            kingGaia: {
                name: "王·盖亚",
                asset: "assets/king_gaia.png",
                maxHp: 850,
                hp: 850,
                soulMark: "盖",
                soulMarkDesc: "【魂印】盖\n自身处于异常状态时，对手每回合2项属性-1且造成的伤害减少50%；\n每回合恢复自身已损失体力的30%，攻击有自身已损失体力百分比的几率威力翻倍（BOSS无效）",
                buffs: this.createBuffs(),
                skills: [
                    { name: "战霸天下", type: "buff", power: 0, pp: 5, maxPp: 5, desc: "属性攻击\n4回合内免疫并反弹异常状态；\n5回合内免疫能力下降；\n将下次受到的伤害200%反馈给对手" },
                    { name: "不败之境", type: "buff", power: 0, pp: 5, maxPp: 5, desc: "属性攻击\n全属性+1，自身体力高于1/2时强化效果翻倍；\n4回合内，每回合吸取对手最大体力的1/3；\n下2回合自身先制+2" },
                    { name: "天诛乱舞", type: "attack", power: 130, pp: 10, maxPp: 10, desc: "战斗物攻\n必中；\n反转自身能力下降；\n反转成功则对方害怕" },
                    { name: "天威力破", type: "attack", power: 85, pp: 20, maxPp: 20, desc: "战斗物攻\n先制+3；\n消除对手回合类效果，消除成功则免疫下次受到的异常状态；\n造成的伤害低于280则下2回合自身攻击必定致命一击" },
                    { name: "王·圣勇战意", type: "ultimate", power: 160, pp: 5, maxPp: 5, desc: "第五技能\n必中；\n攻击时造成的伤害不会出现微弱；\n吸取对手能力提升状态，若吸取成功则吸取对手300点体力；\n若对手处于能力提升状态，则自身该技能先制+2" }
                ]
            },
            agnes: {
                name: "不灭·艾恩斯",
                asset: "assets/agnes.png",
                maxHp: 900,
                hp: 900,
                soulMark: "火",
                soulMarkDesc: "【魂印】火\n1. 受到致命攻击时残留1点体力，消除双方能力提升及回合效果，使对手焚烬2回合（每场1次）；\n2. 回合开始若体力>对手，当回合受击使对手焚烬，否则消除对手回合效果；\n3. 回合结束若体力<对手，恢复已损失体力的1/2。",
                buffs: this.createBuffs(),
                skills: [
                    { name: "王·酷烈风息", type: "attack", power: 150, pp: 5, maxPp: 5, desc: "火系物攻\n必中；反转自身能力下降，成功则免疫下1次异常；\n伤害<300则对手焚烬，未触发则自身下次伤害+100%" },
                    { name: "火焰精核", type: "buff", power: 0, pp: 5, maxPp: 5, desc: "属性攻击\n必中；全属性+1(对手异常时翻倍)；\n4回合每回合恢复1/3体力并造成等量固伤(体力<1/2翻倍)；\n下2回合先制+2" },
                    { name: "火种永存", type: "buff", power: 0, pp: 5, maxPp: 5, desc: "属性攻击\n必中；5回合免疫并反弹异常；\n4回合每回合70%几率对手焚烬，未触发则减少对手1/3最大体力；\n免疫下1次攻击" },
                    { name: "秩序之助", type: "attack", power: 85, pp: 20, maxPp: 20, desc: "火系物攻\n先制+3；消除对手回合效果，成功则对手2回合无法使用属性技能；\n2回合内对手无法恢复体力" },
                    { name: "王·焚世烈焰", type: "ultimate", power: 160, pp: 5, maxPp: 5, desc: "第五技能\n必中；无视微弱；\n消除对手能力上升，成功则下1回合先制；\n对手异常时伤害提高75%，否则吸取1/3最大体力" }
                ],
                flags: { fatalTriggered: false }
            },
            surgingCanglan: {
                name: "怒涛·沧岚",
                asset: "assets/surging_canglan.png",
                maxHp: 950,
                hp: 950,
                soulMark: "滴",
                soulMarkDesc: "【魂印】滴\n1. 登场附加400护盾，有护盾时先制+1；\n2. 未受伤害则回合结束恢复250体力并固伤250，受伤害则免疫下1次攻击；\n3. 使用攻击技能伤害提升25%（最高100%）",
                buffs: this.createBuffs(),
                skills: [
                    { name: "王·洛水惊鸿", type: "ultimate", power: 160, pp: 5, maxPp: 5, desc: "第五技能\n必中；无视微弱和免疫；\n消除对手回合效果，成功则冰封，失败则免疫下1次异常；\n附加20%最大体力固伤" },
                    { name: "王·碧海潮生", type: "attack", power: 150, pp: 5, maxPp: 5, desc: "水系特攻\n必中；100%对手全属性-1；\n反转自身弱化，成功则4回合免弱" },
                    { name: "浮生若梦", type: "buff", power: 0, pp: 5, maxPp: 5, desc: "属性攻击\n必中；全属性+1(有护盾翻倍)；\n4回合免疫并反弹异常；\n下2回合对手受击伤害+100%；下2回合自身先制+2" },
                    { name: "沧海永存", type: "buff", power: 0, pp: 5, maxPp: 5, desc: "属性攻击\n必中；80%冰封，未触发则下2回合攻击100%束缚；\n恢复满体力，体力<1/2则附加等量固伤" },
                    { name: "上善若水", type: "attack", power: 85, pp: 20, maxPp: 20, desc: "水系特攻\n先制+3；反转对手强化，成功则复制，失败则消除；\n伤害<300则附加30%最大体力固伤" }
                ]
            },
            solensen: {
                name: "混沌魔君索伦森",
                asset: "assets/solensen.png",
                maxHp: 1000,
                hp: 1000,
                soulMark: "源",
                soulMarkDesc: "【魂印】源\n1. 登场消除对手能力提升，成功则2回合对手无法强化且下1次属性无效（BOSS无效）；\n2. 回合开始若对手能力高于自身，则使对手变为与自身相同（BOSS无效）；\n3. 自身强化时每回合恢复1/3体力并固伤，不强化时50%几率免疫伤害，未触发则减伤50%",
                buffs: this.createBuffs(),
                skills: [
                    { name: "烈火净世击", type: "attack", power: 150, pp: 5, maxPp: 5, desc: "混沌特攻\n必中；对手无强化时伤害+100%；\n反转对手强化，成功则恢复所有体力及PP" },
                    { name: "混沌灭世决", type: "ultimate", power: 160, pp: 5, maxPp: 5, desc: "第五技能\n必中；消除对手强化，成功则对手下2次攻击无效；\n未击败对手则下2回合先制+2；\n对手每有1项能力等级与自身相同则附加120点固伤" },
                    { name: "背弃圣灵", type: "buff", power: 0, pp: 5, maxPp: 5, desc: "属性攻击\n全属性+1；恢复满体力并造成等量固伤；\n下2回合对手受击伤害+150%；下2回合自身先制+2" },
                    { name: "混沌魔域", type: "buff", power: 0, pp: 5, maxPp: 5, desc: "属性攻击\n5回合免疫并反弹异常；\n100%害怕，未触发则吸取1/3最大体力；\n对手全属性-1，自身体力低于对手时翻倍" },
                    { name: "诸雄之主", type: "attack", power: 85, pp: 20, maxPp: 20, desc: "混沌特攻\n先制+3；消除对手回合效果，成功则免疫下2次异常；\n30%几率3倍伤害，自身强化时概率翻倍" }
                ]
            }
        };

        // --- Team Setup ---
        this.playerTeam = [
            JSON.parse(JSON.stringify(this.charData.kingGaia)),
            JSON.parse(JSON.stringify(this.charData.agnes)),
            JSON.parse(JSON.stringify(this.charData.surgingCanglan)),
            JSON.parse(JSON.stringify(this.charData.solensen))
        ];
        this.enemyTeam = [
            {
                name: "异常大师",
                maxHp: 2000, hp: 2000,
                asset: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/94.png",
                buffs: this.createBuffs(),
                skills: [
                    { name: "毒雾", type: "buff", effect: "poison", desc: "3回合内每回合扣除1/8体力" },
                    { name: "催眠", type: "buff", effect: "sleep", desc: "2回合内无法行动" },
                    { name: "暗影球", type: "attack", power: 80, desc: "普通攻击" },
                    { name: "自我再生", type: "buff", effect: "regen", desc: "5回合内每回合恢复1/8体力" },
                    { name: "鬼火", type: "buff", effect: "burn", desc: "烧伤对手，攻击减半" },
                    { name: "奇异之光", type: "buff", effect: "fear", desc: "使对手害怕" }
                ]
            },
            {
                name: "强化之王",
                maxHp: 2500, hp: 2500,
                asset: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/130.png",
                buffs: this.createBuffs(),
                skills: [
                    { name: "龙之舞", type: "buff", effect: "stats_all", desc: "全属性+1" },
                    { name: "破坏光线", type: "attack", power: 150, desc: "强大攻击" },
                    { name: "铁壁", type: "buff", effect: "defense_2", desc: "防御+2，抵挡1次伤害" },
                    { name: "逆鳞", type: "attack", power: 120, desc: "连续攻击" },
                    { name: "威吓", type: "buff", effect: "attack_down", desc: "对手攻击-1" }
                ]
            },
            {
                name: "控场大师",
                maxHp: 2200, hp: 2200,
                asset: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/135.png",
                buffs: this.createBuffs(),
                skills: [
                    { name: "电磁波", type: "buff", effect: "paralyze", desc: "2回合无法行动" },
                    { name: "冰冻之风", type: "buff", effect: "speed_down", desc: "速度-2" },
                    { name: "十万伏特", type: "attack", power: 90, desc: "普通攻击" }
                ]
            },
            {
                name: "铁壁卫士",
                maxHp: 3000, hp: 3000,
                asset: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/208.png",
                buffs: this.createBuffs(),
                skills: [
                    { name: "守住", type: "buff", effect: "block", desc: "免疫下一次攻击" },
                    { name: "自我再生", type: "buff", effect: "heal", desc: "恢复1/2体力" },
                    { name: "泰山压顶", type: "attack", power: 85, desc: "普通攻击" }
                ]
            },
            {
                name: "净化使者",
                maxHp: 2400, hp: 2400,
                asset: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/245.png",
                buffs: this.createBuffs(),
                skills: [
                    { name: "净化", type: "buff", effect: "cleanse", desc: "消除自身回合类效果" },
                    { name: "驱散", type: "buff", effect: "dispel", desc: "消除对手强化" },
                    { name: "魔法闪耀", type: "attack", power: 80, desc: "普通攻击" }
                ]
            },
            {
                name: "全能战神",
                maxHp: 2800, hp: 2800,
                asset: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/250.png",
                buffs: this.createBuffs(),
                skills: [
                    { name: "神圣之火", type: "attack", power: 100, effect: "burn", desc: "攻击并附加焚烬" },
                    { name: "冥想", type: "buff", effect: "stats_atk_def", desc: "攻防+1" },
                    { name: "神秘守护", type: "buff", effect: "immune_cc", desc: "5回合免疫异常" }
                ]
            }
        ];

        this.activePlayerIndex = 0;
        this.activeEnemyIndex = 0;
        this.isPlayerTurn = true;
        this.isBusy = false;
        this.turnCount = 0;
        this.items = { pp_potion: 5 };

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
            soulMark: document.getElementById('soul-mark'),
            playerPokemonCount: document.getElementById('player-pokemon-count'),
            enemyPokemonCount: document.getElementById('enemy-pokemon-count'),
            skillsGrid: document.querySelector('.skills-grid-container'),
            skillsLeft: document.querySelector('.skills-left-container')
        };

        this.EFFECT_DEFS = {
            'poison': { name: '中毒', desc: '每回合扣除1/8最大体力' },
            'burn': { name: '焚烬', desc: '无法行动，每回合扣除1/8最大体力' },
            'sleep': { name: '睡眠', desc: '无法行动' },
            'paralyze': { name: '麻痹', desc: '无法行动' },
            'freeze': { name: '冰冻', desc: '无法行动' },
            'fear': { name: '害怕', desc: '无法行动' },
            'silence': { name: '沉默', desc: '无法使用属性技能' },
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
            'block_attack': { name: '封攻', desc: '无法使用攻击技能' }
        };

        this.initBattle();
    }

    createBuffs() {
        return {
            statUps: { attack: 0, defense: 0, speed: 0, specialAttack: 0, specialDefense: 0, accuracy: 0, evasion: 0 },
            // Special flags and counters
            shield: 0, // Block next damage
            reflectDamage: 0, // Turns
            absorbHp: 0, // Turns
            critNext: 0, // Turns
            priorityNext: 0, // Turns
            damageBoostNext: 0, // Turns
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
            blockAttack: 0 // Count: Block next attack skill
        };
    }

    get player() { return this.playerTeam[this.activePlayerIndex]; }
    get enemy() { return this.enemyTeam[this.activeEnemyIndex]; }

    initBattle() {
        // Soul Mark Init (Surging Canglan)
        if (this.player.name === "怒涛·沧岚") {
            this.player.buffs.shieldHp = 400;
            this.log("魂印触发！获得400点护盾！");
        }
        // Soul Mark Init (Solensen)
        if (this.player.name === "混沌魔君索伦森") {
            if (this.hasStatUps(this.enemy)) {
                this.clearStats(this.enemy);
                this.addTurnEffect(this.enemy, '无法强化', 2, 'immune_stat_up');
                this.enemy.buffs.blockAttribute = 1;
                this.log("魂印触发！消除对手强化！对手2回合无法强化且下一次属性技能无效！");
            }
        }

        this.updateUI();
        this.updateSkillButtons();
        this.isPlayerTurn = true;
        this.isBusy = false;
        this.ui.log.innerHTML = ''; // Clear hardcoded log
        this.log("战斗开始！");
        this.turnCount = 1;
        this.log(`--- 第 ${this.turnCount} 回合 ---`);
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
        const pHpPct = Math.max(0, (p.hp / p.maxHp) * 100);
        this.ui.playerHpBar.style.width = `${pHpPct}%`;
        this.ui.playerHpText.innerText = `${Math.ceil(p.hp)}/${p.maxHp}`;
        this.ui.soulMark.style.display = p.soulMark ? 'flex' : 'none';
        if (p.soulMark) this.ui.soulMark.innerText = p.soulMark;

        // Enemy
        const e = this.enemy;
        this.ui.enemyName.innerText = e.name;
        this.ui.enemySprite.style.backgroundImage = `url('${e.asset}')`;
        const eHpPct = Math.max(0, (e.hp / e.maxHp) * 100);
        this.ui.enemyHpBar.style.width = `${eHpPct}%`;
        this.ui.enemyHpText.innerText = `${Math.ceil(e.hp)}/${e.maxHp}`;

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

    getEffectDescription(id) {
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
        // poison, sleep, paralyze, burn, freeze, fear, bind
        const controlIds = ['poison', 'sleep', 'paralyze', 'burn', 'freeze', 'fear', 'bind'];
        char.buffs.turnEffects.forEach(effect => {
            if (controlIds.includes(effect.id)) {
                this.createBuffIcon(controlRow, effect.name, effect.turns, 'control', this.getEffectDescription(effect.id));
            }
        });

        // 2. Buffs (Turn & Count) (Middle Row)
        // Turn Effects (Blue Dots)
        const turnIds = ['immune_stat_drop', 'immune_cc', 'priority', 'crit', 'absorb', 'reflect', 'damage_boost', 'immune_stat_up', 'water_curse', 'reflect_status'];
        // Filter out controls
        char.buffs.turnEffects.forEach(effect => {
            if (!controlIds.includes(effect.id)) {
                // Check if it's a known turn effect or generic
                let className = 'turn-effect';
                if (effect.cannotDispel) className += ' undispellable';
                this.createBuffIcon(buffRow, '', effect.turns, className, `${effect.name}: ${this.getEffectDescription(effect.id)}`);
            }
        });

        // Positive Turn Effects (stored in properties)
        if (char.buffs.reflectDamage > 0) this.createBuffIcon(buffRow, '', char.buffs.reflectDamage, 'count-effect', `反弹伤害: ${char.buffs.reflectDamage}次`);
        if (char.buffs.absorbHp > 0) this.createBuffIcon(buffRow, '', char.buffs.absorbHp, 'turn-effect', `吸血: ${char.buffs.absorbHp}回合`);
        if (char.buffs.critNext > 0) this.createBuffIcon(buffRow, '', char.buffs.critNext, 'turn-effect', `致命一击: ${char.buffs.critNext}回合`);
        if (char.buffs.priorityNext > 0) this.createBuffIcon(buffRow, '', char.buffs.priorityNext, 'turn-effect', `先制: ${char.buffs.priorityNext}回合`);
        if (char.buffs.immuneAbnormal > 0) this.createBuffIcon(buffRow, '', char.buffs.immuneAbnormal, 'turn-effect', `免疫异常: ${char.buffs.immuneAbnormal}回合`);
        if (char.buffs.immuneStatDrop > 0) this.createBuffIcon(buffRow, '', char.buffs.immuneStatDrop, 'turn-effect', `免疫弱化: ${char.buffs.immuneStatDrop}回合`);
        if (char.buffs.damageBoostNext > 0) this.createBuffIcon(buffRow, '', char.buffs.damageBoostNext, 'turn-effect', `伤害提升: ${char.buffs.damageBoostNext}回合`); // Changed to Turn Effect as per user request ("Solensen Abandon Spirit is turn effect")

        // Count Effects (Red Dots)
        if (char.buffs.blockAttack > 0) this.createBuffIcon(buffRow, '', char.buffs.blockAttack, 'count-effect', `封锁攻击: ${char.buffs.blockAttack}次`);
        if (char.buffs.blockAttribute > 0) this.createBuffIcon(buffRow, '', char.buffs.blockAttribute, 'count-effect', `封锁属性: ${char.buffs.blockAttribute}次`);
        if (char.buffs.immuneAbnormalCount > 0) this.createBuffIcon(buffRow, '', char.buffs.immuneAbnormalCount, 'count-effect', `免疫异常: ${char.buffs.immuneAbnormalCount}次`);
        if (char.buffs.waterCurseStack > 0) this.createBuffIcon(buffRow, '', char.buffs.waterCurseStack, 'count-effect', `水厄层数: ${char.buffs.waterCurseStack}`);

        // Shield (Shield UI)
        if (char.buffs.shield > 0) this.createBuffIcon(buffRow, '', char.buffs.shield, 'shield', `抵挡攻击: ${char.buffs.shield}次`);

        // 3. Stats (Bottom Row)
        for (const [stat, val] of Object.entries(char.buffs.statUps)) {
            if (val !== 0) {
                const label = this.getStatLabel(stat);
                this.createBuffIcon(statRow, `${label}${val > 0 ? '+' : ''}${val}`, val, 'stat', `${label} ${val > 0 ? '提升' : '下降'} ${Math.abs(val)} 等级`);
            }
        }
    }



    getStatLabel(stat) {
        const map = { attack: '攻', defense: '防', specialAttack: '特攻', specialDefense: '特防', speed: '速', accuracy: '准', evasion: '闪' };
        return map[stat] || stat;
    }

    createBuffIcon(container, label, val, type = null, desc = null) {
        const icon = document.createElement('div');
        icon.className = `buff-icon ${type ? type : (val > 0 ? 'up' : 'down')}`;
        if (type === 'stat') {
            let symbol;
            switch (label) {
                case 'attack': symbol = '⚔️'; break;
                case 'defense': symbol = '🛡️'; break;
                case 'speed': symbol = '💨'; break;
                case 'specialAttack': symbol = '🔮'; break;
                case 'specialDefense': symbol = '🔰'; break;
                case 'accuracy': symbol = '🎯'; break;
                case 'evasion': symbol = '👻'; break;
                default: symbol = '★';
            }
            icon.innerText = `${symbol}${val > 0 ? '+' : ''}${val}`;
        } else {
            // For turn effects, if it's the new round style, we might just want the number
            if (type && type.includes('turn')) {
                icon.innerHTML = `<span>${val}</span>`;
            } else {
                icon.innerText = `${label}${val}`;
            }
        }

        if (desc) {
            icon.onmouseenter = (e) => {
                const tooltip = this.ui.tooltip;
                tooltip.classList.remove('hidden');
                tooltip.innerText = `【${label}】\n${desc}`;
                const rect = e.target.getBoundingClientRect();
                tooltip.style.left = `${rect.left}px`;
                tooltip.style.top = `${rect.top - tooltip.offsetHeight - 10}px`;
            };
            icon.onmouseleave = () => this.ui.tooltip.classList.add('hidden');
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

            // Check if blocked
            let blocked = false;
            if (skill.type === 'buff' && this.player.buffs.blockAttribute > 0) blocked = true;
            if ((skill.type === 'attack' || skill.type === 'ultimate') && this.player.buffs.blockAttack > 0) blocked = true;

            if (blocked) {
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

        // Position logic with overflow check
        let left = rect.left;
        if (left + tooltip.offsetWidth > window.innerWidth) {
            left = window.innerWidth - tooltip.offsetWidth - 10;
        }

        tooltip.style.left = `${left}px`;
        tooltip.style.top = `${rect.top - tooltip.offsetHeight - 10}px`;
    }

    hideTooltip() {
        this.ui.tooltip.classList.add('hidden');
    }

    toggleBag() { this.ui.bagModal.classList.toggle('hidden'); }
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

    async switchCharacter(index) {
        if (index === this.activePlayerIndex) return;
        if (this.playerTeam[index].hp <= 0) {
            this.log(`${this.playerTeam[index].name} 已经无法战斗了！`);
            return;
        }

        this.log(`回来吧，${this.player.name}！去吧，${this.playerTeam[index].name}！`);
        this.activePlayerIndex = index;

        // Soul Mark Init (Surging Canglan)
        if (this.player.name === "怒涛·沧岚") {
            this.player.buffs.shieldHp = 400;
            this.log("魂印触发！获得400点护盾！");
        }
        // Soul Mark Init (Solensen)
        if (this.player.name === "混沌魔君索伦森") {
            if (this.hasStatUps(this.enemy)) {
                this.clearStats(this.enemy);
                this.addTurnEffect(this.enemy, '无法强化', 2, 'immune_stat_up');
                this.enemy.buffs.blockAttribute = 1;
                this.log("魂印触发！消除对手强化！对手2回合无法强化且下一次属性技能无效！");
            }
        }

        this.toggleSwitch();
        this.updateUI();
        this.updateSkillButtons();

        // Switching takes a turn
        this.isPlayerTurn = false;
        await this.wait(1000);
        this.enemyTurn();
    }

    useItem(itemType) {
        if (itemType === 'pp_potion') {
            if (this.items.pp_potion > 0) {
                this.items.pp_potion--;
                this.playerTeam.forEach(char => {
                    char.skills.forEach(s => s.pp = Math.min(s.maxPp, s.pp + 10));
                });
                this.log("使用了PP回复药剂！全队技能PP恢复了！");
                this.updateUI();
                this.updateSkillButtons();
                this.toggleBag();
            } else {
                this.log("PP药剂不足！");
            }
        }
    }

    async useSkill(skillIndex) {
        if (!this.isPlayerTurn || this.isBusy) return;
        let damage = 0;

        // Reset Turn Flags
        this.player.buffs.tookDamage = false;

        // Start of Turn Effects (Agnes)
        if (this.player.name === "不灭·艾恩斯") {
            if (this.player.hp > this.enemy.hp) {
                // Passive: Burn on hit (Handled in dealDamage or here?)
                // "若自身体力高于对手，则攻击附加焚烬"
                // We'll set a flag or handle in dealDamage
                this.player.buffs.agnesBurnOnHit = true;
            } else {
                // "若自身体力低于对手，则消除对手回合类效果"
                // This should probably happen when using a skill? Or at start of turn?
                // "Start of turn" usually implies before action.
                if (this.enemy.buffs.turnEffects.length > 0) {
                    // Chance? Or 100%? Let's say 100% for Soul Mark
                    // But removing ALL might be OP. Let's remove 1 random positive effect?
                    // Or just clear them? Text says "消除对手回合类效果".
                    // Let's clear 1 random turn effect to be balanced, or all if it's a strong effect.
                    // Let's clear ALL for now as per description.
                    this.enemy.buffs.turnEffects = [];
                    this.log("魂印触发！消除了对手的回合效果！");
                    this.updateUI();
                }
            }
        }

        // Start of Turn Effects (Solensen)
        if (this.player.name === "混沌魔君索伦森") {
            // Stat Sync
            let synced = false;
            for (let stat in this.player.buffs.statUps) {
                if (this.enemy.buffs.statUps[stat] > this.player.buffs.statUps[stat]) {
                    this.enemy.buffs.statUps[stat] = this.player.buffs.statUps[stat];
                    synced = true;
                }
            }
            if (synced) {
                this.log("魂印触发！对手的能力等级被强行同步！");
                this.updateUI();
            }
        }

        // 1. Check Control Effects (MOVED TO TOP)
        const controlEffect = this.player.buffs.turnEffects.find(e => ['sleep', 'paralyze', 'freeze', 'fear', 'burn'].includes(e.id));
        if (controlEffect) {
            this.log(`${this.player.name} 处于 ${controlEffect.name} 状态，无法行动！`);
            const btn = document.querySelector(`.skill-btn:nth-child(${skillIndex + 1})`);
            if (btn) {
                btn.classList.add('skill-blocked');
                setTimeout(() => btn.classList.remove('skill-blocked'), 500);
            }

            this.isBusy = true;
            await this.wait(1000);
            this.handleEndTurn(this.player, this.enemy);
            this.isPlayerTurn = false;
            this.enemyTurn();
            return;
        }

        const skill = this.player.skills[skillIndex];

        // 2. Check Silence
        const silenceEffect = this.player.buffs.turnEffects.find(e => e.id === 'silence');
        if (silenceEffect && skill.type === 'buff') {
            this.log(`${this.player.name} 处于沉默状态，无法使用属性技能！`);
            const btn = document.querySelector(`.skill-btn:nth-child(${skillIndex + 1})`);
            if (btn) {
                btn.classList.add('skill-blocked');
                setTimeout(() => btn.classList.remove('skill-blocked'), 500);
            }
            return;
        }

        // 3. Check Solensen Blocks
        if (this.player.buffs.blockAttribute > 0 && skill.type === 'buff') {
            this.log(`${this.player.name} 的属性技能被封锁！`);
            this.player.buffs.blockAttribute--;
            this.isBusy = false; // Reset busy since we return early (but wait, usually we consume turn? "Invalid" usually means fails but turn passes. Or cannot use? "Invalid" -> Fails. "Cannot use" -> Button blocked. Text says "Invalid". So it consumes turn but does nothing.)
            // If "Invalid", it usually means it executes but fails.
            // Let's make it consume turn.
            this.isBusy = true;
            await this.wait(1000);
            this.handleEndTurn(this.player, this.enemy);
            this.isPlayerTurn = false;
            this.enemyTurn();
            return;
        }
        if (this.player.buffs.blockAttack > 0 && (skill.type === 'attack' || skill.type === 'ultimate')) {
            this.log(`${this.player.name} 的攻击技能被封锁！`);
            this.player.buffs.blockAttack--;
            this.isBusy = true;
            await this.wait(1000);
            this.handleEndTurn(this.player, this.enemy);
            this.isPlayerTurn = false;
            this.enemyTurn();
            return;
        }

        if (skill.pp <= 0) {
            this.log(`${skill.name} PP不足!`);
            return;
        }

        this.isBusy = true;
        skill.pp--;
        this.updateSkillButtons();

        // Priority Check
        let priority = 0;
        if (skill.name === "天威力破" || skill.name === "秩序之助" || skill.name === "上善若水") priority += 3;
        if (this.player.buffs.priorityNext > 0) priority += 2;

        // Surging Canglan Priority (Soul Mark)
        if (this.player.name === "怒涛·沧岚" && this.player.buffs.shieldHp > 0) {
            priority += 1;
        }

        // Bind Check (Disable Priority)
        const bindEffect = this.player.buffs.turnEffects.find(e => e.id === 'bind');
        if (bindEffect) {
            if (priority > 0) priority = 0;
            // Also disable skill inherent priority? "All priority effects invalid". 
            // Let's assume it forces priority to be at most 0.
        }

        // Character-specific skill logic is handled below

        // Character-specific skill logic is handled below
        if (this.player.name === "王·盖亚") {
            if (skill.name === "战霸天下") {
                this.player.buffs.immuneAbnormal = 4;
                this.addTurnEffect(this.player, '反弹异常', 4, 'reflect_status');
                this.player.buffs.immuneStatDrop = 5;
                this.addTurnEffect(this.player, '免弱', 5, 'immune_stat_drop');
                this.player.buffs.reflectDamage = 1; // Reflect next damage 200% (Count based? "Next damage")
                // "Reflect next received damage 200% to opponent"
                // This implies a count of 1.
                this.log("4回合反弹异常！5回合免弱！准备反弹下一次伤害！");
            }
            else if (skill.name === "不败之境") {
                let boost = 1;
                if (this.player.hp > this.player.maxHp / 2) boost = 2;
                this.modifyStats(this.player, { attack: boost, defense: boost, speed: boost, specialAttack: boost, specialDefense: boost });

                this.player.buffs.absorbHp = 4;
                this.addTurnEffect(this.player, '吸血', 4, 'absorb');

                this.player.buffs.priorityNext = 2;
                this.log(`全属性+${boost}！4回合吸血！下2回合先制+2！`);
            }
            else if (skill.name === "天诛乱舞") {
                // Reverse Self Negative
                const reversed = this.reverseStats(this.player, false);
                if (reversed) {
                    this.addTurnEffect(this.enemy, '害怕', 2, 'fear');
                    this.log("反转成功！对手害怕！");
                }
                damage = await this.dealDamage(this.enemy, skill.power, true);
            }
            else if (skill.name === "天威力破") {
                // Dispel Enemy Turn Effects
                if (this.enemy.buffs.turnEffects.length > 0) {
                    this.enemy.buffs.turnEffects = [];
                    this.log("消除了对手的回合效果！");
                    this.player.buffs.immuneAbnormalCount = 1; // "Next time immune abnormal" -> Count 1
                    this.log("免疫下一次异常！");
                }

                damage = await this.dealDamage(this.enemy, skill.power);
                if (damage < 280) {
                    this.player.buffs.critNext = 2;
                    this.log("伤害低于280，下2回合必定致命一击！");
                }
            }
            else if (skill.name === "王·圣勇战意") {
                // Steal Stats
                const stolen = this.stealStats(this.player, this.enemy);
                if (stolen) {
                    const heal = 300;
                    this.enemy.hp = Math.max(0, this.enemy.hp - heal);
                    this.heal(this.player, heal, "吸取");
                    this.showDamageNumber(heal, false, 'pink');
                }

                damage = await this.dealDamage(this.enemy, skill.power, true, true); // Ignore resist (no weak)
            }
        }
        else if (this.player.name === "不灭·艾恩斯") {
            if (skill.name === "王·酷烈风息") {
                const reversed = this.reverseStats(this.player, false);
                if (reversed) {
                    this.player.buffs.immuneAbnormalCount = 1;
                    this.log("反转成功！免疫下一次异常！");
                }

                damage = await this.dealDamage(this.enemy, skill.power, true);
                if (damage < 300) {
                    this.addTurnEffect(this.enemy, '焚烬', 2, 'burn');
                    this.log("伤害<300，对手焚烬！");
                } else {
                    this.player.buffs.damageBoostNext = 1; // Next damage +100%
                    this.log("伤害>=300，下次伤害翻倍！");
                }
            }
            else if (skill.name === "火焰精核") {
                let boost = 1;
                if (this.enemy.buffs.turnEffects.some(e => ['burn', 'poison', 'sleep', 'paralyze', 'freeze', 'fear'].includes(e.id))) boost = 2;
                this.modifyStats(this.player, { attack: boost, defense: boost, speed: boost, specialAttack: boost, specialDefense: boost });

                // 4 turns heal + fixed dmg
                // We need a custom turn effect for this? Or just handle in EndTurn?
                // "4回合每回合恢复1/3体力并造成等量固伤"
                // Let's add a special effect ID 'eternal_fire' (wait, that's skill 3).
                // Let's call this 'fire_core'.
                this.addTurnEffect(this.player, '火焰精核', 4, 'fire_core');

                this.player.buffs.priorityNext = 2;
                this.log(`全属性+${boost}！4回合恢复并固伤！下2回合先制+2！`);
            }
            else if (skill.name === "火种永存") {
                this.player.buffs.immuneAbnormal = 5;
                this.addTurnEffect(this.player, '反弹异常', 5, 'reflect_status');

                this.addTurnEffect(this.player, '火种', 4, 'eternal_fire');

                this.player.buffs.shield = 1;
                this.log("5回合免疫反弹！4回合火种！抵挡下一次攻击！");
            }
            else if (skill.name === "秩序之助") {
                if (this.enemy.buffs.turnEffects.length > 0) {
                    this.enemy.buffs.turnEffects = [];
                    this.log("消除了对手的回合效果！");
                    this.enemy.buffs.blockAttribute = 2; // "2 turns cannot use attribute skills" -> Block 2 times? Or 2 turns?
                    // "2 turns". My blockAttribute is count.
                    // Let's assume count of 2 is fine or I need a turn-based block.
                    // Let's use count 2 for now.
                    this.addTurnEffect(this.enemy, '封属', 2, 'block_attr'); // Visual
                    this.log("对手2回合无法使用属性技能！");
                }

                this.addTurnEffect(this.enemy, '禁疗', 2, 'heal_block');
                damage = await this.dealDamage(this.enemy, skill.power);
            }
            else if (skill.name === "王·焚世烈焰") {
                const cleared = this.clearStats(this.enemy);
                if (cleared) {
                    this.player.buffs.priorityNext = 1; // Next turn priority?
                    this.log("消除成功！下回合先制！");
                }

                let mult = 1;
                const hasStatus = this.enemy.buffs.turnEffects.some(e => ['burn', 'poison', 'sleep', 'paralyze', 'freeze', 'fear'].includes(e.id));
                if (hasStatus) {
                    mult = 1.75;
                    this.log("对手异常，伤害提升75%！");
                    damage = await this.dealDamage(this.enemy, skill.power * mult, true, true); // Ignore weak
                } else {
                    damage = await this.dealDamage(this.enemy, skill.power, true, true);
                    const absorb = Math.floor(this.enemy.maxHp / 3);
                    this.enemy.hp = Math.max(0, this.enemy.hp - absorb);
                    this.heal(this.player, absorb, "吸取");
                    this.showDamageNumber(absorb, false, 'pink');
                    this.log(`对手无异常，吸取 ${absorb} 体力！`);
                }
            }
        }
        else if (this.player.name === "怒涛·沧岚") {
            if (skill.name === "王·洛水惊鸿") {
                // Dispel Turn Effects
                const cleared = this.enemy.buffs.turnEffects.length > 0;
                this.enemy.buffs.turnEffects = [];

                if (cleared) {
                    this.addTurnEffect(this.enemy, '冰封', 2, 'freeze');
                    this.log("消除成功！对手冰封！");
                } else {
                    this.player.buffs.immuneAbnormalCount = 1;
                    this.log("消除失败，免疫下一次异常！");
                }

                const fix = Math.floor(this.enemy.maxHp * 0.2);
                this.enemy.hp = Math.max(0, this.enemy.hp - fix);
                this.log(`附加 ${fix} 固伤！`);
                this.showDamageNumber(fix, false, 'pink');

                damage = await this.dealDamage(this.enemy, skill.power, true, true, true); // Ignore weak/immune? "Ignore weak and immune"
            }
            else if (skill.name === "王·碧海潮生") {
                this.modifyStats(this.enemy, { attack: -1, defense: -1, speed: -1, specialAttack: -1, specialDefense: -1, accuracy: -1, evasion: -1 });
                const reversed = this.reverseStats(this.player, false);
                if (reversed) {
                    this.addTurnEffect(this.player, '免弱', 4, 'immune_stat_drop');
                    this.log("反转成功！4回合免弱！");
                }
                damage = await this.dealDamage(this.enemy, skill.power, true);
            }
            else if (skill.name === "浮生若梦") {
                let boost = 1;
                if (this.player.buffs.shieldHp > 0) boost = 2;
                this.modifyStats(this.player, { attack: boost, defense: boost, speed: boost, specialAttack: boost, specialDefense: boost });

                this.player.buffs.immuneAbnormal = 4;
                this.addTurnEffect(this.player, '反弹异常', 4, 'reflect_status');

                this.player.buffs.vulnerability = 0; // Enemy takes more damage? No "Next 2 turns opponent received damage +100%"
                // Apply to Enemy
                this.enemy.buffs.vulnerability = 2;

                this.player.buffs.priorityNext = 2;
                this.log(`全属性+${boost}！免疫反弹异常！对手易伤！自身先制！`);
            }
            else if (skill.name === "沧海永存") {
                if (Math.random() < 0.8) {
                    this.addTurnEffect(this.enemy, '冰封', 2, 'freeze');
                    this.log("对手冰封！");
                } else {
                    this.player.buffs.bindNext = 2; // Next attacks apply bind
                    this.log("未触发冰封，下2回合攻击附加束缚！");
                }

                const currentHp = this.player.hp;
                const maxHp = this.player.maxHp;
                const healAmount = maxHp - currentHp;
                this.heal(this.player, maxHp, "恢复");

                if (currentHp < maxHp / 2) {
                    const fixDmg = healAmount;
                    this.enemy.hp = Math.max(0, this.enemy.hp - fixDmg);
                    this.log(`体力<1/2，附加 ${fixDmg} 固伤！`);
                    this.showDamageNumber(fixDmg, false, 'pink');
                }
            }
            else if (skill.name === "上善若水") {
                // Reverse Enemy Up
                let hasUp = false;
                for (let k in this.enemy.buffs.statUps) {
                    if (this.enemy.buffs.statUps[k] > 0) {
                        hasUp = true;
                        this.enemy.buffs.statUps[k] *= -1;
                    }
                }
                this.updateUI();

                if (hasUp) {
                    this.log("反转了对手的强化！");
                    // Copy
                    for (let k in this.enemy.buffs.statUps) {
                        if (this.enemy.buffs.statUps[k] < 0) {
                            this.player.buffs.statUps[k] = (this.player.buffs.statUps[k] || 0) + Math.abs(this.enemy.buffs.statUps[k]);
                        }
                    }
                    this.log("复制了对手的强化！");
                } else {
                    this.clearStats(this.enemy);
                }

                damage = await this.dealDamage(this.enemy, skill.power);
                if (damage < 300) {
                    const fix = Math.floor(this.player.maxHp * 0.3);
                    this.enemy.hp = Math.max(0, this.enemy.hp - fix);
                    this.log(`伤害<300，附加 ${fix} 固伤！`);
                    this.showDamageNumber(fix, false, 'pink');
                }
            }
        }

        // Solensen Skills
        else if (this.player.name === "混沌魔君索伦森") {
            if (skill.name === "烈火净世击") {
                let dmgBoost = 1;
                if (!this.hasStatUps(this.enemy)) {
                    dmgBoost = 2;
                    this.log("对手无强化，伤害翻倍！");
                }
                damage = await this.dealDamage(this.enemy, skill.power * dmgBoost, true);

                // Reverse (Positive Only)
                const reversed = this.reverseStats(this.enemy, true);
                if (reversed) {
                    this.heal(this.player, this.player.maxHp, "技能");
                    this.player.skills.forEach(s => s.pp = s.maxPp);
                    this.log("反转成功！恢复所有体力和PP！");
                    this.updateSkillButtons();
                }
            }
            else if (skill.name === "混沌灭世决") {
                const cleared = this.clearStats(this.enemy);
                if (cleared) {
                    this.enemy.buffs.blockAttack = 2;
                    this.log("消除成功！对手下2次攻击无效！");
                }

                // Fixed Damage (120 * matching stats)
                let matchCount = 0;
                for (let k in this.player.buffs.statUps) {
                    if (this.player.buffs.statUps[k] === this.enemy.buffs.statUps[k]) matchCount++;
                }
                if (matchCount > 0) {
                    const fix = 120 * matchCount;
                    this.enemy.hp = Math.max(0, this.enemy.hp - fix);
                    this.log(`属性相同 ${matchCount} 项，附加 ${fix} 固伤！`);
                    this.showDamageNumber(fix, false, 'pink');
                }

                damage = await this.dealDamage(this.enemy, skill.power, true);

                if (this.enemy.hp > 0) {
                    this.player.buffs.priorityNext = 2;
                    this.log("未击败对手，下2回合先制+2！");
                }
            }
            else if (skill.name === "背弃圣灵") {
                this.modifyStats(this.player, { attack: 1, defense: 1, speed: 1, specialAttack: 1, specialDefense: 1, accuracy: 1, evasion: 1 });
                const healAmt = this.player.maxHp - this.player.hp;
                this.heal(this.player, this.player.maxHp, "技能");
                if (healAmt > 0) {
                    this.enemy.hp = Math.max(0, this.enemy.hp - healAmt);
                    this.log(`附加 ${healAmt} 固伤！`);
                    this.showDamageNumber(healAmt, false, 'pink');
                }
                this.enemy.buffs.vulnerability = 2; // +150%? Logic says *2.5? Or just use existing vulnerability flag?
                // Existing vulnerability is *2. Let's update dealDamage to handle different vulnerabilities or just use *2.5 if vulnerability is 2?
                // Let's assume vulnerability = 1 is *2. vulnerability = 2 is *2.5?
                // I'll just set vulnerability = 1 and update dealDamage to check Solensen specific multiplier if needed.
                // Or I can add a new flag `vulnerabilityStrong`.
                // Let's just use `vulnerability` and update dealDamage to check if source is Solensen? No, vulnerability is on target.
                // I'll update dealDamage to check `vulnerability` value.
                this.player.buffs.damageBoostNext = 2; // Self Damage Boost
                this.player.buffs.priorityNext = 2;
                this.log("全属性+1！恢复满体力！自身增伤！自身先制！");
            }
            else if (skill.name === "混沌魔域") {
                this.player.buffs.immuneAbnormal = 5;
                this.addTurnEffect(this.player, '反弹异常', 5, 'reflect_status');

                if (Math.random() < 1.0) { // 100% Fear? Text says "100% chance to fear".
                    // But "If not triggered then absorb".
                    // So it always fears unless immune?
                    // If immune, then absorb.
                    if (this.enemy.buffs.immuneAbnormal > 0 || this.enemy.buffs.turnEffects.some(e => e.id === 'immune_cc')) {
                        const absorb = Math.floor(this.enemy.maxHp / 3);
                        this.enemy.hp = Math.max(0, this.enemy.hp - absorb);
                        this.heal(this.player, absorb, "吸取");
                        this.log(`对手免疫害怕，吸取 ${absorb} 体力！`);
                        this.showDamageNumber(absorb, false, 'pink');
                    } else {
                        this.addTurnEffect(this.enemy, '害怕', 2, 'fear');
                        this.log("对手害怕！");
                    }
                }

                let drop = -1;
                if (this.player.hp < this.enemy.hp) drop = -2;
                this.modifyStats(this.enemy, { attack: drop, defense: drop, speed: drop, specialAttack: drop, specialDefense: drop, accuracy: drop, evasion: drop });
                this.log(`对手全属性 ${drop}！`);
            }
            else if (skill.name === "诸雄之主") {
                const cleared = this.enemy.buffs.turnEffects.length > 0;
                this.enemy.buffs.turnEffects = [];
                if (cleared) {
                    this.player.buffs.immuneAbnormalCount = 2;
                    this.log("消除成功！免疫下2次异常！");
                }

                let chance = 0.3;
                if (this.hasStatUps(this.player)) chance = 0.6;

                if (Math.random() < chance) {
                    this.log("3倍伤害触发！");
                    damage = await this.dealDamage(this.enemy, skill.power * 3);
                } else {
                    damage = await this.dealDamage(this.enemy, skill.power);
                }
            }
        }

        // Check Enemy Reflect (Player attacking Enemy)
        if (skill.type === 'attack' || skill.type === 'ultimate') {
            if (this.enemy.buffs.reflectDamage > 0) {
                this.log(`${this.enemy.name} 的反弹护盾生效！`);
                // Enemy takes damage (already dealt above? No, dealDamage is called inside if/else blocks)
                // Wait, dealDamage IS called above.
                // We need to handle reflect AFTER damage is dealt?
                // Or prevent damage?
                // "将下次受到的伤害200%反馈给对手" -> "Reflects 200% of damage taken".
                // So damage IS taken.
                // But I need to know HOW MUCH damage was taken.
                // `damage` variable holds it.

                if (damage > 0) {
                    const reflectDmg = damage * 2;
                    this.log(`伤害被反弹！受到 ${reflectDmg} 点伤害！`);
                    await this.dealDamage(this.player, reflectDmg, true, true);
                    this.enemy.buffs.reflectDamage--;
                    this.updateUI();
                }
            }
        }

        await this.wait(500);

        if (this.checkWinCondition()) return;

        // End Turn Logic (Player)
        this.handleEndTurn(this.player, this.enemy);

        this.isPlayerTurn = false;
        this.enemyTurn();
    }

    async enemyTurn() {
        try {
            // Reset Turn Flags
            this.enemy.buffs.tookDamage = false;

            // Start of Turn Effects (Solensen as Enemy)
            if (this.enemy.name === "混沌魔君索伦森") {
                // Stat Sync
                let synced = false;
                for (let stat in this.enemy.buffs.statUps) {
                    if (this.player.buffs.statUps[stat] > this.enemy.buffs.statUps[stat]) {
                        this.player.buffs.statUps[stat] = this.enemy.buffs.statUps[stat];
                        synced = true;
                    }
                }
                if (synced) {
                    this.log("魂印触发！对手的能力等级被强行同步！");
                    this.updateUI();
                }
            }

            // Check Control Effects (Sleep, Paralyze, Freeze, Fear, Burn)
            const controlEffect = this.enemy.buffs.turnEffects.find(e => ['sleep', 'paralyze', 'freeze', 'fear', 'burn'].includes(e.id));
            if (controlEffect) {
                this.log(`${this.enemy.name} 处于 ${controlEffect.name} 状态，无法行动！`);
                await this.wait(1000);
                this.handleEndTurn(this.enemy, this.player);
                this.isPlayerTurn = true;
                this.isBusy = false;
                return;
            }

            // Check Silence for Enemy
            const silenceEffect = this.enemy.buffs.turnEffects.find(e => e.id === 'silence');

            this.log("对手的回合...");
            await this.wait(1000);

            // Enemy AI
            let availableSkills = this.enemy.skills;

            // Filter Blocked Skills (Solensen)
            if (this.enemy.buffs.blockAttribute > 0) {
                availableSkills = availableSkills.filter(s => s.type !== 'buff');
            }
            if (this.enemy.buffs.blockAttack > 0) {
                availableSkills = availableSkills.filter(s => s.type !== 'attack' && s.type !== 'ultimate');
            }

            if (availableSkills.length === 0) {
                this.log(`${this.enemy.name} 的技能被封锁，无法行动！`);
                if (this.enemy.buffs.blockAttribute > 0) this.enemy.buffs.blockAttribute--;
                if (this.enemy.buffs.blockAttack > 0) this.enemy.buffs.blockAttack--;
                await this.wait(1000);
                this.handleEndTurn(this.enemy, this.player);
                this.isPlayerTurn = true;
                this.isBusy = false;
                return;
            }

            if (silenceEffect) {
                availableSkills = availableSkills.filter(s => s.type !== 'buff');
                if (availableSkills.length === 0) {
                    this.log(`${this.enemy.name} 被沉默，无法使用技能！`);
                    await this.wait(1000);
                    this.handleEndTurn(this.enemy, this.player);
                    this.isPlayerTurn = true;
                    this.isBusy = false;
                    return;
                }
            }

            const skill = availableSkills[Math.floor(Math.random() * availableSkills.length)];
            this.log(`${this.enemy.name} 使用了 【${skill.name}】!`);

            this.ui.enemySprite.classList.add('attack-lunge');
            await this.wait(500);
            this.ui.enemySprite.classList.remove('attack-lunge');

            if (skill.type === 'attack') {
                // Reflect Logic
                if (this.player.buffs.reflectDamage > 0) {
                    this.log(`${this.player.name} 的反弹护盾生效！`);
                    // Player takes damage
                    const actualDmg = await this.dealDamage(this.player, skill.power);

                    // Reflect 200%
                    const reflectDmg = actualDmg * 2;
                    if (reflectDmg > 0) {
                        this.log(`反弹了 ${reflectDmg} 点伤害！`);
                        await this.dealDamage(this.enemy, reflectDmg, true, true);
                        this.player.buffs.reflectDamage--;
                        this.updateUI();
                    }
                } else {
                    await this.dealDamage(this.player, skill.power);
                    // Side effects of enemy attacks
                    if (skill.effect === 'burn') this.addTurnEffect(this.player, '焚烬', 2, 'burn');
                }
            } else {
                this.log("对手施展了特殊效果！");
                // Handle Enemy Support Skills
                if (skill.effect === 'poison') this.addTurnEffect(this.player, '中毒', 3, 'poison');
                if (skill.effect === 'sleep') this.addTurnEffect(this.player, '睡眠', 2, 'sleep');
                if (skill.effect === 'paralyze') this.addTurnEffect(this.player, '麻痹', 2, 'paralyze');
                if (skill.effect === 'stats_all') this.modifyStats(this.enemy, { attack: 1, defense: 1, speed: 1, specialAttack: 1, specialDefense: 1 });
                if (skill.effect === 'defense_2') {
                    this.modifyStats(this.enemy, { defense: 2 });
                    this.enemy.buffs.shield = 1;
                    this.log("对手防御大幅提升并准备抵挡攻击！");
                    this.updateUI();
                }
                if (skill.effect === 'speed_down') this.modifyStats(this.player, { speed: -2 });
                if (skill.effect === 'block') { this.enemy.buffs.shield = 1; this.log("对手准备抵挡下一次攻击！"); }
                if (skill.effect === 'heal') this.heal(this.enemy, Math.floor(this.enemy.maxHp / 2));
                if (skill.effect === 'cleanse') { this.enemy.buffs.turnEffects = []; this.log("对手消除了自身回合效果！"); }
                if (skill.effect === 'dispel') { this.clearStats(this.player); }
                if (skill.effect === 'cleanse') { this.enemy.buffs.turnEffects = []; this.log("对手消除了自身回合效果！"); }
                if (skill.effect === 'dispel') { this.clearStats(this.player); }
                if (skill.effect === 'immune_cc') this.addTurnEffect(this.enemy, '免疫异常', 5, 'immune_cc');
                if (skill.effect === 'regen') this.addTurnEffect(this.enemy, '再生', 5, 'regen');
                if (skill.effect === 'weakness') {
                    this.modifyStats(this.player, { attack: -1, specialAttack: -1 });
                    this.log("对手削弱了你的攻击！");
                }
                if (skill.effect === 'burn') { this.addTurnEffect(this.player, '焚烬', 2, 'burn'); this.log("对手施放了鬼火！"); }
            }

            await this.wait(1000);
            if (this.checkWinCondition()) {
                this.isPlayerTurn = true;
                this.isBusy = false;
                return;
            }

            this.handleEndTurn(this.enemy, this.player);

            this.isPlayerTurn = true;
            this.isBusy = false;
            this.turnCount++;
            this.log(`--- 第 ${this.turnCount} 回合 ---`);
        } catch (e) {
            console.error(e);
            this.log(`发生错误: ${e.message}`);
            this.isPlayerTurn = true;
            this.isBusy = false;
        }
    }



    handleEndTurn(char, opponent) {
        // Check Control Status
        const isControlled = char.buffs.turnEffects.some(e => ['sleep', 'paralyze', 'freeze', 'fear', 'burn'].includes(e.id));

        // Agnes Soul Mark End Turn
        if (char.name === "不灭·艾恩斯" && !isControlled) {
            if (char.hp < opponent.hp) {
                const lost = char.maxHp - char.hp;
                this.heal(char, Math.floor(lost / 2), "魂印");
            }
        }
        // Gaia Soul Mark
        if (char.name === "王·盖亚") {
            if (!isControlled) {
                const lost = char.maxHp - char.hp;
                if (lost > 0) this.heal(char, Math.floor(lost * 0.3), "魂印");
            }

            // Soul Mark: If has abnormal status, enemy stats -1 (2 random stats)
            const hasStatus = char.buffs.turnEffects.some(e => ['burn', 'poison', 'sleep', 'paralyze', 'freeze', 'fear'].includes(e.id));
            if (hasStatus) {
                this.log("魂印触发！自身异常，削弱对手！");
                const stats = ['attack', 'defense', 'speed', 'specialAttack', 'specialDefense', 'accuracy', 'evasion'];
                // Pick 2 random stats
                for (let k = 0; k < 2; k++) {
                    const randomStat = stats[Math.floor(Math.random() * stats.length)];
                    this.modifyStats(opponent, { [randomStat]: -1 });
                }
            }
        }

        // Surging Canglan Soul Mark (End of Turn)
        if (char.name === "怒涛·沧岚") {
            // Check if took ATTACK damage (need to track this separately? tookDamage is set in dealDamage)
            // dealDamage sets tookDamage = true.
            // We need to know if it was from an ATTACK skill.
            // But dealDamage doesn't know the source skill type easily.
            // However, the requirement says "If no damage was taken".
            // User comment: "it means 攻擊技能造成的傷害,不包括百分比傷害" (Damage from Attack Skills, excluding percentage damage).
            // `dealDamage` is usually called for attacks. Fixed damage/Percentage often uses direct HP modification or `dealDamage` with flags?
            // In my implementation, `dealDamage` is used for attacks.
            // Fixed damage often modifies HP directly (e.g., Solensen end turn).
            // So `tookDamage` flag in `dealDamage` should be sufficient IF I ensure non-attack damage doesn't call `dealDamage` or sets a flag.
            // But wait, `dealDamage` sets `tookDamage = true`.
            // I need to ensure `tookDamage` is ONLY set for Attack Damage.
            // I will verify `dealDamage` logic.

            if (!char.buffs.tookDamage) {
                this.heal(char, 250, "魂印");
                const dmg = 250;
                opponent.hp = Math.max(0, opponent.hp - dmg);
                this.log(`魂印触发！恢复体力并造成 ${dmg} 固伤！`);
                this.showDamageNumber(dmg, char === this.player ? false : true, 'pink');
            } else {
                char.buffs.shield = 1; // Immune next attack
                this.log("魂印触发！本回合受击，获得1次抵挡！");
            }
        }

        // Solensen Soul Mark (End of Turn)
        if (char.name === "混沌魔君索伦森") {
            if (this.hasStatUps(char)) {
                const healAmt = Math.floor(char.maxHp / 3);
                const actualHealed = this.heal(char, healAmt, "魂印");
                opponent.hp = Math.max(0, opponent.hp - actualHealed);
                this.log(`魂印触发！恢复体力并造成 ${actualHealed} 固伤！`);
                this.showDamageNumber(actualHealed, char === this.player ? false : true, 'pink');
            }
        }

        // Decrement Buffs
        if (char.buffs.priorityNext > 0) char.buffs.priorityNext--;
        if (char.buffs.critNext > 0) char.buffs.critNext--;
        // reflectDamage is Count-based, removed from here
        if (char.buffs.immuneAbnormal > 0) char.buffs.immuneAbnormal--;
        if (char.buffs.immuneStatDrop > 0) char.buffs.immuneStatDrop--;

        if (char.buffs.absorbHp > 0) {
            if (!isControlled) {
                const absorb = Math.floor(opponent.maxHp / 8); // Nerfed to 1/8
                opponent.hp = Math.max(0, opponent.hp - absorb);
                this.heal(char, absorb, "吸取");
                this.showDamageNumber(absorb, char === this.player ? false : true, 'pink');
            }
            char.buffs.absorbHp--;
        }

        // Process Turn Effects
        for (let i = char.buffs.turnEffects.length - 1; i >= 0; i--) {
            const effect = char.buffs.turnEffects[i];

            // Effect Logic
            if (effect.id === 'poison') {
                const dmg = Math.floor(char.maxHp / 8); // Nerfed to 1/8
                char.hp = Math.max(0, char.hp - dmg);
                this.log(`${char.name} 受到毒伤害 ${dmg}!`);
                this.showDamageNumber(dmg, char === this.player);
            }
            if (effect.id === 'burn') {
                const dmg = Math.floor(char.maxHp / 8);
                char.hp = Math.max(0, char.hp - dmg);
                this.log(`${char.name} 受到烧伤伤害 ${dmg}!`);
                this.showDamageNumber(dmg, char === this.player);
            }
            if (effect.id === 'water_curse') {
                // Stacking Fixed Damage (20% * Stacks)
                const stacks = char.buffs.waterCurseStack || 1;
                const pct = 0.2 * stacks;
                const dmg = Math.floor(char.maxHp * pct);
                char.hp = Math.max(0, char.hp - dmg);
                this.log(`${char.name} 受到水厄伤害 ${dmg} (层数: ${stacks})!`);
                this.showDamageNumber(dmg, char === this.player, 'pink');
            }
            if (effect.id === 'regen') {
                const heal = Math.floor(char.maxHp / 8);
                this.heal(char, heal, "再生");
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
            }
        }

        // Eternal Fire Passive (Agnes)
        const eternalFire = char.buffs.turnEffects.find(e => e.id === 'eternal_fire');
        if (eternalFire && !isControlled) {
            // 100% chance to burn or cut HP
            // Check if enemy has burn
            const hasBurn = opponent.buffs.turnEffects.find(e => e.id === 'burn');
            if (!hasBurn) {
                this.addTurnEffect(opponent, '焚烬', 2, 'burn');
                this.log("火种永存！对手被焚烬！");
            } else {
                const cut = Math.floor(opponent.maxHp / 8); // Nerfed to 1/8
                opponent.hp = Math.max(0, opponent.hp - cut);
                this.log(`火种永存！对手减少了 ${cut} 体力！`);
                this.showDamageNumber(cut, opponent === this.player, 'pink');
            }
        }

        this.updateUI();
    }

    addTurnEffect(target, name, turns, id) {
        // Check Status Reflect
        const reflectStatus = target.buffs.turnEffects.find(e => e.id === 'reflect_status');
        if (reflectStatus && ['poison', 'sleep', 'paralyze', 'burn', 'freeze', 'fear'].includes(id)) {
            this.log(`${target.name} 反弹了异常状态！`);
            // Apply to source instead (Need source? We assume 'this.player' or 'this.enemy' depending on target)
            const source = (target === this.player) ? this.enemy : this.player;
            // Avoid infinite loop if both reflect?
            if (!source.buffs.turnEffects.find(e => e.id === 'reflect_status')) {
                this.addTurnEffect(source, name, turns, id);
            }
            return;
        }

        // Check immunity
        if ((target.buffs.immuneAbnormal > 0 || target.buffs.immuneAbnormalCount > 0) && ['poison', 'sleep', 'paralyze', 'burn', 'freeze', 'fear'].includes(id)) {
            this.log(`${target.name} 免疫了异常状态！`);
            this.showFloatingText("免疫异常", target === this.player);
            if (target.buffs.immuneAbnormalCount > 0) {
                target.buffs.immuneAbnormalCount--;
                this.updateUI();
            }
            return;
        }
        // Check existing
        const existing = target.buffs.turnEffects.find(e => e.id === id);
        if (existing) {
            existing.turns = turns; // Refresh
        } else {
            target.buffs.turnEffects.push({ name, turns, id });
        }
        this.updateUI();
    }

    async dealDamage(target, power, sureHit = false, ignoreResist = false, ignoreShield = false, isAttack = true) {
        // ... (existing code) ...

        // ... (at the end) ...
        if (finalDamage > 0 && isAttack) {
            target.buffs.tookDamage = true;
        }
        // Check Shield/Block (Count based)
        if (target.buffs.shield > 0 && !ignoreShield) {
            this.log(`${target.name} 抵挡了攻击！`);
            target.buffs.shield--;
            this.updateUI();
            return 0;
        }

        let multiplier = 1;
        const attacker = (target === this.player) ? this.enemy : this.player;

        // Surging Canglan Damage Stack (Soul Mark)
        if (attacker.name === "怒涛·沧岚" && attacker.buffs.damageStack > 0) {
            const boost = 1 + (attacker.buffs.damageStack * 0.25);
            multiplier *= boost;
            this.log(`魂印触发！伤害提升 ${(boost - 1) * 100}%！`);
        }

        // Vulnerability (Surging Canglan Debuff)
        if (target.buffs.vulnerability > 0) {
            multiplier *= 2; // +100% damage taken
            this.log("对手处于易伤状态，伤害翻倍！");
        }

        // Agnes Damage Boost
        // Agnes Soul Mark: Burn on hit if HP > Enemy
        if (attacker.name === "不灭·艾恩斯" && attacker.hp > target.hp && (attacker.buffs.agnesBurnOnHit || attacker === this.player)) {
            if (!target.buffs.turnEffects.find(e => e.id === 'burn')) {
                this.addTurnEffect(target, '焚烬', 2, 'burn');
                this.log("魂印触发！对手被焚烬！");
            }
        }



        // Gaia Soul Mark Chance (Attack Boost based on lost HP)
        if (attacker.name === "王·盖亚") {
            const lostHpPct = (attacker.maxHp - attacker.hp) / attacker.maxHp;
            if (Math.random() < lostHpPct) {
                multiplier *= 2;
                this.log("魂印触发！威力翻倍！");
            }
        }

        // Crit
        if (attacker.buffs.critNext > 0) {
            multiplier *= 2;
            this.log("致命一击！");
        }

        let damage = Math.floor(power * (1 + Math.random() * 0.2) * multiplier);

        // Gaia Soul Mark: Reduce damage taken by 50% if has abnormal status
        if (target.name === "王·盖亚") {
            const hasStatus = target.buffs.turnEffects.some(e => ['burn', 'poison', 'sleep', 'paralyze', 'freeze', 'fear'].includes(e.id));
            if (hasStatus) {
                damage = Math.floor(damage * 0.5);
                this.log("魂印触发！伤害减少50%！");
            }
        }

        // Agnes Fatal Trigger (Soul Mark) - Re-check for final damage calculation if needed (logic duplicated above for actualDmg, but 'damage' variable is used for display? Wait, 'actualDmg' was calculated early but 'damage' is recalculated?
        // The original code had 'actualDmg' then 'damage' calculated again?
        // Original code: 
        // const actualDmg = Math.floor(power * multiplier * ...);
        // ... Agnes check using actualDmg ...
        // target.hp = ... - actualDmg;
        // ... Gaia check ...
        // let damage = Math.floor(power * ...); <-- This seems to be a bug in original code or 'damage' is just for display/return?
        // Actually, the original code applied 'actualDmg' to HP, then calculated 'damage' again?
        // No, wait. The original code:
        // 935: const actualDmg = ...
        // 956: target.hp = ... - actualDmg;
        // 972: let damage = ...
        // 1001: target.hp = ... - damage;
        // It applied damage TWICE?
        // Line 956 applies `actualDmg`. Line 1001 applies `damage`.
        // This looks like a bug in the existing code. `actualDmg` was used for Agnes check, then applied. Then `damage` was calculated (with Crit?) and applied.
        // If I look closely at original code:
        // 935: actualDmg calculated.
        // 938: Agnes check.
        // 956: target.hp -= actualDmg.
        // 972: damage calculated (with Crit multiplier? wait, multiplier was used in actualDmg too).
        // 1001: target.hp -= damage.
        // So it deals damage twice? Or `actualDmg` is a preview?
        // If `actualDmg` is applied, then `damage` is applied... that's double damage.
        // I should fix this. I will assume `actualDmg` was the intended one, or `damage` was the intended one.
        // `actualDmg` uses `multiplier`. `damage` uses `multiplier` (which might have been updated by Gaia/Crit).
        // I will unify this.

        // Let's use `finalDamage`.
        // Recalculate logic:
        // 1. Base Power
        // 2. Multipliers (Soul Marks, Buffs)
        // 3. Crit
        // 4. Variance
        // 5. Shield/Block
        // 6. Apply to HP (Check Fatal)

        // I will rewrite dealDamage to be clean.

        // Re-evaluating multipliers
        // Gaia Soul Mark (Attacker): Chance to double.
        if (attacker.name === "王·盖亚") {
            const lostHpPct = (attacker.maxHp - attacker.hp) / attacker.maxHp;
            if (Math.random() < lostHpPct) {
                multiplier *= 2;
                this.log("魂印触发！威力翻倍！");
            }
        }

        // Crit
        if (attacker.buffs.critNext > 0) {
            multiplier *= 2;
            this.log("致命一击！");
        }

        let finalDamage = Math.floor(power * multiplier * (Math.random() * 0.2 + 0.9));

        // Gaia Soul Mark (Defender): Reduce 50%
        if (target.name === "王·盖亚") {
            const hasStatus = target.buffs.turnEffects.some(e => ['burn', 'poison', 'sleep', 'paralyze', 'freeze', 'fear'].includes(e.id));
            if (hasStatus) {
                finalDamage = Math.floor(finalDamage * 0.5);
                this.log("魂印触发！伤害减少50%！");
            }
        }

        // Solensen Soul Mark (Defensive)
        if (target.name === "混沌魔君索伦森" && !this.hasStatUps(target)) {
            if (Math.random() < 0.5) {
                finalDamage = 0;
                this.log("魂印触发！免疫了本次伤害！");
            } else {
                finalDamage = Math.floor(finalDamage * 0.5);
                this.log("魂印触发！伤害减少50%！");
            }
        }

        // Shield HP
        if (target.buffs.shieldHp > 0) {
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

        // Agnes Fatal
        if (target.name === "不灭·艾恩斯" && target.hp - finalDamage <= 0 && !target.buffs.fatalTriggered) {
            target.hp = 1;
            target.buffs.fatalTriggered = true;
            this.log("不灭·艾恩斯魂印触发！残留1点体力！");
            this.clearStats(target);
            this.clearStats(attacker);
            target.buffs.turnEffects = [];
            attacker.buffs.turnEffects = [];
            this.addTurnEffect(attacker, '焚烬', 2, 'burn');
            this.updateUI();
            return finalDamage;
        }

        target.hp = Math.max(0, target.hp - finalDamage);

        if (finalDamage > 0 && isAttack) {
            target.buffs.tookDamage = true;
        }

        this.showDamageNumber(finalDamage, target === this.player);

        const sprite = target === this.player ? this.ui.playerSprite : this.ui.enemySprite;
        sprite.classList.add('shake');
        await this.wait(500);
        sprite.classList.remove('shake');

        this.updateUI();
        this.log(`造成 ${finalDamage} 伤害!`);
        return finalDamage;
    }

    checkWinCondition() {
        if (this.player.hp <= 0) {
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
            if (this.activeEnemyIndex < this.enemyTeam.length - 1) {
                this.activeEnemyIndex++;
                this.log(`对手派出了 ${this.enemy.name}!`);
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

        for (let [stat, val] of Object.entries(changes)) {
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
        if (cleared) this.log(`消除了${target.name}的能力提升！`);
        this.updateUI();
        return cleared;
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
        const el = document.createElement('div');
        el.className = 'floating-text';
        el.innerText = text;
        el.style.color = color;
        el.style.left = isPlayer ? '25%' : '75%';
        el.style.top = '30%';
        this.ui.damageOverlay.appendChild(el);
        setTimeout(() => el.remove(), 1500);
    }
    wait(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }
}

window.onload = () => {
    window.game = new Game();
};
