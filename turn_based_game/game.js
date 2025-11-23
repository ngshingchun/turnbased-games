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
                    { 
                        name: "战霸天下", type: "buff", power: 0, pp: 5, maxPp: 5, 
                        desc: "属性攻击\n4回合内免疫并反弹异常状态；\n5回合内免疫能力下降；\n将下次受到的伤害200%反馈给对手",
                        effects: [
                            { id: 191, args: [4] },
                            { id: 2001, args: [5] },
                            { id: 2002, args: [1, 200] }
                        ]
                    },
                    { 
                        name: "不败之境", type: "buff", power: 0, pp: 5, maxPp: 5, 
                        desc: "属性攻击\n全属性+1，自身体力高于1/2时强化效果翻倍；\n4回合内，每回合吸取对手最大体力的1/3；\n下2回合自身先制+2",
                        effects: [
                            { id: 2003, args: [1] },
                            { id: 2004, args: [4, 3] },
                            { id: 843, args: [2, 2] }
                        ]
                    },
                    { 
                        name: "天诛乱舞", type: "attack", power: 130, pp: 10, maxPp: 10, 
                        desc: "战斗物攻\n必中；\n反转自身能力下降；\n反转成功则对方害怕",
                        effects: [
                            { id: 2005, args: [] }
                        ]
                    },
                    { 
                        name: "天威力破", type: "attack", power: 85, pp: 20, maxPp: 20, 
                        desc: "战斗物攻\n先制+3；\n消除对手回合类效果，消除成功则免疫下次受到的异常状态；\n造成的伤害低于280則下2回合自身攻击必定致命一击",
                        effects: [
                            { id: 2006, args: [] },
                            { id: 2007, args: [280, 2] }
                        ]
                    },
                    { 
                        name: "王·圣勇战意", type: "ultimate", power: 160, pp: 5, maxPp: 5, 
                        desc: "第五技能\n必中；\n攻击时造成的伤害不会出现微弱；\n吸取对手能力提升状态，若吸取成功則吸取對手300點體力；\n若對手處於能力提升狀態，則自身該技能先制+2",
                        effects: [
                            { id: 760, args: [] },
                            { id: 2008, args: [300] },
                            { id: 2009, args: [2] }
                        ]
                    }
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
                    { 
                        name: "王·酷烈风息", type: "attack", power: 150, pp: 5, maxPp: 5, 
                        desc: "火系物攻\n必中；反转自身能力下降，成功则免疫下1次异常；\n伤害<300則對手焚烬，未觸發則自身下次傷害+100%",
                        effects: [
                            { id: 1221, args: [1] },
                            { id: 1256, args: [300, '焚烬', 1, 100] }
                        ]
                    },
                    { 
                        name: "火焰精核", type: "buff", power: 0, pp: 5, maxPp: 5, 
                        desc: "属性攻击\n必中；全属性+1(对手异常时翻倍)；\n4回合每回合恢复1/3体力并造成等量固伤(体力<1/2翻倍)；\n下2回合先制+2",
                        effects: [
                            { id: 1001, args: [1] },
                            { id: 1065, args: [4, 3, 2] },
                            { id: 843, args: [2, 2] }
                        ]
                    },
                    { 
                        name: "火种永存", type: "buff", power: 0, pp: 5, maxPp: 5, 
                        desc: "属性攻击\n必中；5回合免疫并反弹异常；\n4回合每回合70%几率对手焚烬，未触发則减少對手1/3最大體力；\n免疫下1次攻击",
                        effects: [
                            { id: 191, args: [5] },
                            { id: 1255, args: [4, 70, '焚烬', 3] },
                            { id: 570, args: [1] }
                        ]
                    },
                    { 
                        name: "秩序之助", type: "attack", power: 85, pp: 20, maxPp: 20, 
                        desc: "火系物攻\n先制+3；消除对手回合效果，成功則對手2回合無法使用屬性技能；\n2回合內對手無法恢復體力",
                        effects: [
                            { id: 781, args: [2] },
                            { id: 679, args: [2] }
                        ]
                    },
                    { 
                        name: "王·焚世烈焰", type: "ultimate", power: 160, pp: 5, maxPp: 5, 
                        desc: "第五技能\n必中；無視微弱；\n消除對手能力上升，成功則下1回合先制；\n對手異常時傷害提高75%，否則吸取1/3最大體力",
                        effects: [
                            { id: 760, args: [] },
                            { id: 777, args: [1] },
                            { id: 1048, args: [75] },
                            { id: 1257, args: [3] }
                        ]
                    }
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
                    { 
                        name: "王·洛水惊鸿", type: "ultimate", power: 160, pp: 5, maxPp: 5, 
                        desc: "第五技能\n必中；无视微弱和免疫；\n消除对手回合效果，成功则冰封，失败则免疫下1次异常；\n附加20%最大体力固伤",
                        effects: [
                            { id: 3001, args: [] },
                            { id: 3002, args: [] },
                            { id: 3003, args: [20] }
                        ]
                    },
                    { 
                        name: "王·碧海潮生", type: "attack", power: 150, pp: 5, maxPp: 5, 
                        desc: "水系特攻\n必中；100%对手全属性-1；\n反转自身弱化，成功則4回合免弱",
                        effects: [
                            { id: 3004, args: [] },
                            { id: 3005, args: [4] }
                        ]
                    },
                    { 
                        name: "浮生若梦", type: "buff", power: 0, pp: 5, maxPp: 5, 
                        desc: "属性攻击\n必中；全属性+1(有护盾翻倍)；\n4回合免疫并反弹异常；\n下2回合对手受击伤害+100%；下2回合自身先制+2",
                        effects: [
                            { id: 3006, args: [1] },
                            { id: 191, args: [4] },
                            { id: 3007, args: [2] },
                            { id: 843, args: [2, 2] }
                        ]
                    },
                    { 
                        name: "沧海永存", type: "buff", power: 0, pp: 5, maxPp: 5, 
                        desc: "属性攻击\n必中；80%冰封，未触發則下2回合攻擊100%束縛；\n恢復滿體力，體力<1/2則附加等量固傷",
                        effects: [
                            { id: 3008, args: [80, 2] },
                            { id: 3009, args: [] }
                        ]
                    },
                    { 
                        name: "上善若水", type: "attack", power: 85, pp: 20, maxPp: 20, 
                        desc: "水系特攻\n先制+3；反轉對手強化，成功則複製，失敗則消除；\n傷害<300則附加30%最大體力固傷",
                        effects: [
                            { id: 3010, args: [] },
                            { id: 3011, args: [300, 30] }
                        ]
                    }
                ]
            },
            solensen: {
                name: "混沌魔君索伦森",
                asset: "assets/solensen.png",
                maxHp: 1000,
                hp: 1000,
                soulMark: "源",
                soulMarkDesc: "【魂印】源\n1. 登场消除对手能力提升，成功则2回合对手无法强化且下1次属性无效（BOSS无效）；\n2. 回合开始若对手能力高于自身，则使对手变为与自身相同（BOSS无效）；\n3. 自身强化时每回合恢复1/3体力并固伤，不强化时50%几率免疫伤害，未触发則減傷50%",
                buffs: this.createBuffs(),
                skills: [
                    { 
                        name: "烈火净世击", type: "attack", power: 150, pp: 5, maxPp: 5, 
                        desc: "混沌特攻\n必中；对手无强化时伤害+100%；\n反转对手强化，成功則恢复所有体力及PP",
                        effects: [
                            { id: 4001, args: [100] },
                            { id: 4002, args: [] }
                        ]
                    },
                    { 
                        name: "混沌灭世决", type: "ultimate", power: 160, pp: 5, maxPp: 5, 
                        desc: "第五技能\n必中；消除对手强化，成功則對手下2次攻击无效；\n未击败对手則下2回合先制+2；\n对手每有1项能力等级与自身相同則附加120点固伤",
                        effects: [
                            { id: 4003, args: [2] },
                            { id: 4004, args: [2] },
                            { id: 4005, args: [120] }
                        ]
                    },
                    { 
                        name: "背弃圣灵", type: "buff", power: 0, pp: 5, maxPp: 5, 
                        desc: "属性攻击\n全属性+1；恢复满体力并造成等量固伤；\n下2回合对手受击伤害+150%；下2回合自身先制+2",
                        effects: [
                            { id: 4006, args: [] },
                            { id: 4007, args: [] },
                            { id: 4008, args: [2, 150] },
                            { id: 843, args: [2, 2] }
                        ]
                    },
                    { 
                        name: "混沌魔域", type: "buff", power: 0, pp: 5, maxPp: 5, 
                        desc: "属性攻击\n5回合免疫并反弹异常；\n100%害怕，未触发則吸取1/3最大体力；\n对手全属性-1，自身体力低于对手时翻倍",
                        effects: [
                            { id: 191, args: [5] },
                            { id: 4009, args: [100, 3] },
                            { id: 4010, args: [] }
                        ]
                    },
                    { 
                        name: "诸雄之主", type: "attack", power: 85, pp: 20, maxPp: 20, 
                        desc: "混沌特攻\n先制+3；消除对手回合效果，成功則免疫下2次异常；\n30%几率3倍伤害，自身强化时概率翻倍",
                        effects: [
                            { id: 4011, args: [2] },
                            { id: 4012, args: [30] }
                        ]
                    }
                ]
            }
        };

        // --- Team Setup ---
        // Randomize Teams (2v2)
        const charKeys = Object.keys(this.charData);
        // Fisher-Yates Shuffle
        for (let i = charKeys.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [charKeys[i], charKeys[j]] = [charKeys[j], charKeys[i]];
        }

        this.playerTeam = [
            JSON.parse(JSON.stringify(this.charData[charKeys[0]])),
            JSON.parse(JSON.stringify(this.charData[charKeys[1]]))
        ];
        this.enemyTeam = [
            JSON.parse(JSON.stringify(this.charData[charKeys[2]])),
            JSON.parse(JSON.stringify(this.charData[charKeys[3]]))
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
            enemyAvatar: document.getElementById('enemy-avatar'),
            soulMark: document.getElementById('soul-mark'),
            playerPokemonCount: document.getElementById('player-pokemon-count'),
            enemyPokemonCount: document.getElementById('enemy-pokemon-count'),
            skillsGrid: document.querySelector('.skills-grid-container'),
            skillsLeft: document.querySelector('.skills-left-container')
        };

        this.EFFECT_DEFS = {
            'poison': { name: '中毒', desc: '每回合扣除1/8最大体力' },
            'burn': { name: '烧伤', desc: '攻击威力减少50%，每回合扣除1/8最大体力' },
            'immolate': { name: '焚烬', desc: '无法行动，结束后转化为烧伤并命中-1' },
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

        this.initBattle();
    }

    createBuffs() {
        return {
            statUps: { attack: 0, defense: 0, speed: 0, specialAttack: 0, specialDefense: 0, accuracy: 0, evasion: 0 },
            // Special flags and counters
            shield: 0, // Block next damage
            reflectDamage: 0, // Turns
            reflectDamageMultiplier: 100, // Percent multiplier for reflected damage
            critNext: 0, // Turns
            priorityNext: 0, // Turns
            priorityForceNext: 0, // Turns (guaranteed first)
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
            blockAttack: 0, // Count: Block next attack skill
            solensenStatBlockAura: 0, // Turns: Opponent cannot stat up (Bound to Solensen)
            solensenAttrBlockAura: 0, // Count: Opponent next attribute skill fails (Bound to Solensen)
            
            // Agnes State
            agnesState: null, // 'dominance' (HP > Enemy) or 'fortitude' (HP <= Enemy)
            agnesShield: false,
            agnesTriggered: false, // Did Effect 2 trigger?
            agnesFatalCount: 1 // Effect 1 count
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
        this.handleSolensenEntry(this.player, this.enemy);
        this.handleSolensenEntry(this.enemy, this.player);

        this.updateUI();
        this.updateSkillButtons();
        this.isPlayerTurn = true;
        this.isBusy = false;
        this.ui.log.innerHTML = ''; // Clear hardcoded log
        this.log("战斗开始！");
        this.turnCount = 1;
        this.log(`--- 第 ${this.turnCount} 回合 ---`);
    }

    handleSolensenEntry(solensen, opponent) {
        if (!solensen || solensen.name !== "混沌魔君索伦森") return;
        solensen.buffs.solensenStatBlockAura = 0;
        solensen.buffs.solensenAttrBlockAura = 0;
        if (!opponent) return;

        if (this.hasStatUps(opponent)) {
            const cleared = this.clearStats(opponent);
            if (cleared) {
                solensen.buffs.solensenStatBlockAura = 2;
                solensen.buffs.solensenAttrBlockAura = 1;
                this.log("魂印触发！消除对手强化！对手2回合无法强化且下一次属性技能无效！");
            }
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

        // 3. Stats (Bottom Row)
        for (const [stat, val] of Object.entries(char.buffs.statUps)) {
            if (val !== 0) {
                const label = this.getStatLabel(stat);
                this.createBuffIcon(statRow, `${label}${val > 0 ? '+' : ''}${val}`, val, `stat:${stat}`, `${label} ${val > 0 ? '提升' : '下降'} ${Math.abs(val)} 等级`);
            }
        }
    }



    getStatLabel(stat) {
        const map = { attack: '攻', defense: '防', specialAttack: '特攻', specialDefense: '特防', speed: '速', accuracy: '准', evasion: '闪' };
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
                case 'evasion': symbol = '👻'; break;
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

            // Check if blocked
            const attrSealed = this.player.buffs.turnEffects.some(e => e.id === 'block_attr' || e.id === 'silence');
            const attackSealed = this.player.buffs.turnEffects.some(e => e.id === 'block_attack');
            let blocked = false;
            if (skill.type === 'buff' && attrSealed) blocked = true;
            if ((skill.type === 'attack' || skill.type === 'ultimate') && attackSealed) blocked = true;

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
        
        // Forced Switch (Death)
        if (this.player.hp <= 0) {
            this.log(`回来吧，${this.player.name}！去吧，${this.playerTeam[index].name}！`);
            this.activePlayerIndex = index;
            
            // Soul Mark Init (Surging Canglan)
            if (this.player.name === "怒涛·沧岚") {
                this.player.buffs.shieldHp = 400;
                this.log("魂印触发！获得400点护盾！");
            }
            this.handleSolensenEntry(this.player, this.enemy);

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
        // Simple AI: Always Attack for now
        // Filter blocked skills
        const enemyAttrSealed = this.enemy.buffs.turnEffects.some(e => e.id === 'block_attr' || e.id === 'silence');
        const enemyAttackSealed = this.enemy.buffs.turnEffects.some(e => e.id === 'block_attack');
        let enemySkills = this.enemy.skills.filter(s => {
            if (s.type === 'buff' && enemyAttrSealed) return false;
            if ((s.type === 'attack' || s.type === 'ultimate') && enemyAttackSealed) return false;
            return true;
        });
        if (enemySkills.length === 0) enemySkills = [{name: "挣扎", type: "attack", power: 0, pp: 1, maxPp: 1, desc: "无法使用技能"}];
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

        // 1. Start of Turn Triggers
        this.triggerStartOfTurn(this.player, this.enemy);
        this.triggerStartOfTurn(this.enemy, this.player);

        // 2. Determine Order
        // Switch has highest priority
        let playerFirst = true;
        
        if (playerAction.type === 'switch' && enemyAction.type !== 'switch') {
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
        if (!this.checkWinCondition()) {
            this.handleEndTurn(this.player, this.enemy);
            this.handleEndTurn(this.enemy, this.player);
            this.turnCount++;
            this.log(`--- 第 ${this.turnCount} 回合 ---`);
            this.updateSkillButtons();
        }
        
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
                
                // Soul Mark Init
                if (this.player.name === "怒涛·沧岚") {
                    this.player.buffs.shieldHp = 400;
                    this.log("魂印触发！获得400点护盾！");
                }
                this.handleSolensenEntry(this.player, this.enemy);
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
            }
            await this.wait(1000);
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
        
        // Agnes (Fortitude)
        // if (char.name === "不灭·艾恩斯" && char.buffs.agnesState === 'fortitude') {
        //    p += 2;
        // }

        if (char.buffs.turnEffects.some(e => e.id === 'bind')) {
            return 0;
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
        // Reset Agnes Fatal Turn Protection
        if (char.name === "不灭·艾恩斯") {
            char.buffs.agnesFatalTriggeredThisTurn = false;
        }

        // Agnes
        if (char.name === "不灭·艾恩斯") {
            char.buffs.agnesState = char.hp > opponent.hp ? 'dominance' : 'fortitude';
            char.buffs.agnesTriggered = false; // Reset trigger flag
            if (char.buffs.agnesState === 'dominance') {
                this.showFloatingText("魂印: 优势", char === this.player);
            }
        }
        // Solensen
        if (char.name === "混沌魔君索伦森") {
            let synced = false;
            for (let stat in char.buffs.statUps) {
                if (opponent.buffs.statUps[stat] > char.buffs.statUps[stat]) {
                    opponent.buffs.statUps[stat] = char.buffs.statUps[stat];
                    synced = true;
                }
            }
            if (synced) {
                this.log(`【魂印】源：${char.name} 强行同步了能力等级！`);
                this.showFloatingText("魂印: 同步", char === this.player);
                this.updateUI();
            }
        }
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

        // 2. Check Silence / Blocks
        let countBlocked = false;
        if (skill.type === 'buff') {
            if (attacker.buffs.turnEffects.some(e => e.id === 'silence')) {
                this.log(`${attacker.name} 被沉默，无法使用属性技能！`);
                await this.wait(500);
                return;
            }
            if (attacker.buffs.turnEffects.some(e => e.id === 'block_attr')) {
                this.log(`${attacker.name} 的属性技能被封锁！`);
                await this.wait(500);
                return;
            }
            if (attacker.buffs.blockAttribute > 0) {
                this.log(`${attacker.name} 的属性技能被封锁！`);
                attacker.buffs.blockAttribute--;
                countBlocked = true;
            }

            // Check Solensen Aura (Bound to Solensen)
            const auraOwner = (attacker === this.player) ? this.enemy : this.player;
            if (auraOwner.name === "混沌魔君索伦森" && auraOwner.buffs.solensenAttrBlockAura > 0) {
                this.log(`【魂印】源：${attacker.name} 的属性技能被封锁！`);
                auraOwner.buffs.solensenAttrBlockAura--;
                this.updateUI();
                countBlocked = true;
            }
        }
        if (skill.type === 'attack' || skill.type === 'ultimate') {
            if (attacker.buffs.blockAttack > 0) {
                this.log(`${attacker.name} 的攻击技能被封锁！`);
                attacker.buffs.blockAttack--;
                countBlocked = true;
            }
        }

        // 3. Execute
        this.log(`${attacker.name} 使用了 【${skill.name}】!`);
        
        if (countBlocked) {
            if (skill.pp > 0) skill.pp--;
            if (isPlayer) this.updateSkillButtons();
            this.log(`但是技能无效！`);
            await this.wait(800);
            return;
        }

        if (skill.type === 'buff' && attacker.buffs.turnEffects.some(e => e.id === 'daze')) {
            if (Math.random() < 0.5) {
                this.log(`${attacker.name} 处于失神，属性技能失效！`);
                if (skill.pp > 0) skill.pp--;
                if (isPlayer) this.updateSkillButtons();
                await this.wait(800);
                return;
            }
        }

        if ((skill.type === 'attack' || skill.type === 'ultimate') && attacker.buffs.turnEffects.some(e => e.id === 'blind')) {
            if (Math.random() < 0.5) {
                this.log(`${attacker.name} 处于失明，攻击未命中！`);
                if (skill.pp > 0) skill.pp--;
                if (isPlayer) this.updateSkillButtons();
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

        // Check Agnes Shield (Immune to next attack)
        if ((skill.type === 'attack' || skill.type === 'ultimate') && defender.buffs.agnesShield) {
            this.log(`但是 ${defender.name} 的火种永存使攻击失效了！`);
            defender.buffs.agnesShield = false;
            await this.wait(800);
            return;
        }

        // Surging Canglan Stack Logic
        if (attacker.name === "怒涛·沧岚" && (skill.type === 'attack' || skill.type === 'ultimate')) {
             if (attacker.buffs.damageStack < 4) {
                 attacker.buffs.damageStack++;
                 this.log("魂印触发！伤害叠加！");
                 this.showFloatingText("魂印: 叠加", attacker === this.player);
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
        
        await this.resolveSkill(attacker, defender, skill);
        await this.wait(800);
    }

    async enemyTurn() {
        // Deprecated, logic moved to useSkill
    }



    handleEndTurn(char, opponent) {
        // Check Control Status
        const isControlled = char.buffs.turnEffects.some(e => this.CONTROL_STATUSES.includes(e.id));

        // Agnes Soul Mark End Turn (Triggers even if controlled)
        if (char.name === "不灭·艾恩斯") {
            // Effect 3: Turn End HP < Opponent -> Heal
            if (char.hp < opponent.hp) {
                const lost = char.maxHp - char.hp;
                if (lost > 0) {
                    this.heal(char, Math.floor(lost / 2), "魂印");
                    this.showFloatingText("魂印: 恢复", char === this.player);
                }
            }
            // Effect 2: Dominance Mode (Dispel if not triggered burn)
            // Moved to dealDamage as per user request "Only attack skills trigger it"
            // if (char.buffs.agnesState === 'dominance' && !char.buffs.agnesTriggered) {
            //    if (opponent.buffs.turnEffects.length > 0) {
            //        opponent.buffs.turnEffects = [];
            //        this.log("魂印触发！消除了对手的回合效果！");
            //        this.showFloatingText("魂印: 消除", char === this.player);
            //        this.updateUI();
            //    }
            // }
        }
        // Gaia Soul Mark (Triggers even if controlled)
        if (char.name === "王·盖亚") {
            const lost = char.maxHp - char.hp;
            if (lost > 0) {
                this.heal(char, Math.floor(lost * 0.3), "魂印");
                this.showFloatingText("魂印: 恢复", char === this.player);
            }

            // Soul Mark: If has abnormal status, enemy stats -1 (2 random stats)
            const hasStatus = char.buffs.turnEffects.some(e => ['burn', 'immolate', 'poison', 'sleep', 'paralyze', 'freeze', 'fear'].includes(e.id));
            if (hasStatus) {
                this.log("魂印触发！自身异常，削弱对手！");
                this.showFloatingText("魂印: 削弱", char === this.player);
                const stats = ['attack', 'defense', 'speed', 'specialAttack', 'specialDefense', 'accuracy', 'evasion'];
                // Pick 2 random stats
                for (let k = 0; k < 2; k++) {
                    const randomStat = stats[Math.floor(Math.random() * stats.length)];
                    this.modifyStats(opponent, { [randomStat]: -1 });
                }
            }
        }

        // Surging Canglan Soul Mark (End of Turn) (Triggers even if controlled)
        if (char.name === "怒涛·沧岚") {
            if (!char.buffs.tookDamage) {
                this.heal(char, 250, "魂印");
                const dmg = 250;
                opponent.hp = Math.max(0, opponent.hp - dmg);
                this.log(`魂印触发！恢复体力并造成 ${dmg} 固伤！`);
                this.showFloatingText("魂印: 固伤恢复", char === this.player);
                this.showDamageNumber(dmg, char === this.player ? false : true, 'pink');
            } else {
                char.buffs.shield = 1; // Immune next attack
                this.log("魂印触发！本回合受击，获得1次抵挡！");
                this.showFloatingText("魂印: 抵挡", char === this.player);
            }
        }

        // Solensen Soul Mark (End of Turn) (Triggers even if controlled)
        if (char.name === "混沌魔君索伦森") {
            if (this.hasStatUps(char)) {
                const healAmt = Math.floor(char.maxHp / 3);
                const actualHealed = this.heal(char, healAmt, "魂印");
                opponent.hp = Math.max(0, opponent.hp - actualHealed);
                this.log(`魂印触发！恢复体力并造成 ${actualHealed} 固伤！`);
                this.showFloatingText("魂印: 吸血", char === this.player);
                this.showDamageNumber(actualHealed, char === this.player ? false : true, 'pink');
            }
        }

        // Decrement Buffs
        if (char.buffs.priorityNext > 0) char.buffs.priorityNext--;
        if (char.buffs.priorityForceNext > 0) char.buffs.priorityForceNext--;
        if (char.buffs.critNext > 0) char.buffs.critNext--;
        // reflectDamage is Count-based, removed from here
        if (char.buffs.immuneAbnormal > 0) char.buffs.immuneAbnormal--;
        if (char.buffs.immuneStatDrop > 0) char.buffs.immuneStatDrop--;
        if (char.buffs.solensenStatBlockAura > 0) char.buffs.solensenStatBlockAura--;

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
            if (effect.id === 'frostbite') {
                const dmg = Math.floor(char.maxHp / 8);
                char.hp = Math.max(0, char.hp - dmg);
                this.log(`${char.name} 受到冻伤伤害 ${dmg}!`);
                this.showDamageNumber(dmg, char === this.player);
            }
            if (effect.id === 'burn') {
                const dmg = Math.floor(char.maxHp / 8);
                char.hp = Math.max(0, char.hp - dmg);
                this.log(`${char.name} 受到烧伤伤害 ${dmg}!`);
                this.showDamageNumber(dmg, char === this.player);
            }
            if (effect.id === 'immolate') {
                const dmg = Math.floor(char.maxHp / 8);
                char.hp = Math.max(0, char.hp - dmg);
                this.log(`${char.name} 被焚烬灼烧，损失 ${dmg} 体力!`);
                this.showDamageNumber(dmg, char === this.player);
            }
            if (effect.id === 'curse_fire') {
                const dmg = Math.floor(char.maxHp / 8);
                char.hp = Math.max(0, char.hp - dmg);
                this.log(`${char.name} 受到烈焰诅咒伤害 ${dmg}!`);
                this.showDamageNumber(dmg, char === this.player);
            }
            if (effect.id === 'bleed') {
                const dmg = 80;
                char.hp = Math.max(0, char.hp - dmg);
                this.log(`${char.name} 因流血损失 ${dmg} 体力!`);
                this.showDamageNumber(dmg, char === this.player);
            }
            if (effect.id === 'parasite') {
                const dmg = Math.floor(char.maxHp / 8);
                char.hp = Math.max(0, char.hp - dmg);
                const healed = this.heal(opponent, dmg, "寄生");
                this.log(`${char.name} 被寄生吸取 ${dmg} 体力！`);
                this.showDamageNumber(dmg, char === this.player);
                if (healed > 0) this.showFloatingText(`寄生 +${healed}`, opponent === this.player);
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
            if (effect.id === 'confuse') {
                if (Math.random() < 0.05) {
                    const dmg = 50;
                    char.hp = Math.max(0, char.hp - dmg);
                    this.log(`${char.name} 陷入混乱，自损 ${dmg} 体力！`);
                    this.showDamageNumber(dmg, char === this.player);
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
                    opponent.hp = Math.max(0, opponent.hp - absorb);
                    this.log(`${char.name} 吸取了 ${absorb} 点体力！`);
                    this.showDamageNumber(absorb, char === this.player ? false : true, 'pink');
                    this.heal(char, absorb, "吸血");
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
        // Check Status Reflect
        const reflectStatus = target.buffs.turnEffects.find(e => e.id === 'reflect_status');
        if (reflectStatus && this.ABNORMAL_STATUSES.includes(id)) {
            this.log(`${target.name} 反弹了异常状态！`);
            // Apply to source instead (Need source? We assume 'this.player' or 'this.enemy' depending on target)
            const source = (target === this.player) ? this.enemy : this.player;
            // Avoid infinite loop if both reflect?
            if (!source.buffs.turnEffects.find(e => e.id === 'reflect_status')) {
                this.addTurnEffect(source, name, turns, id, desc);
            }
            return;
        }

        // Check immunity
        if ((target.buffs.immuneAbnormal > 0 || target.buffs.immuneAbnormalCount > 0) && this.ABNORMAL_STATUSES.includes(id)) {
            this.log(`${target.name} 免疫了异常状态！`);
            this.showFloatingText("免疫异常", target === this.player);
            if (target.buffs.immuneAbnormalCount > 0) {
                target.buffs.immuneAbnormalCount--;
                this.updateUI();
            }
            return;
        }

        if (target.buffs.turnEffects.some(e => e.id === 'stagnant') && this.CONTROL_STATUSES.includes(id)) {
            this.log(`${target.name} 处于凝滞，免疫控制！`);
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
        }
        this.updateUI();
    }

    async dealDamage(target, power, sureHit = false, ignoreResist = false, ignoreShield = false, isAttack = true, skill = null) {
        const attacker = (target === this.player) ? this.enemy : this.player;

        if (attacker.buffs.turnEffects.some(e => e.id === 'submit')) {
            this.log(`${attacker.name} 处于臣服状态，无法造成任何伤害！`);
            this.showFloatingText('臣服', attacker === this.player, '#f88');
            return 0;
        }

        // 1. Check Shield/Block
        if (target.buffs.shield > 0 && !ignoreShield) {
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
        // But we can infer for known skills if needed.
        // Implementation: If we add element to skills later, add: if (skill.element === attacker.element) multiplier *= 1.5;

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
            multiplier *= 2;
            attacker.buffs.damageBoostNext--;
            this.log("伤害翻倍生效！");
        }

        // Crit
        if (attacker.buffs.critNext > 0) {
            multiplier *= 2;
            this.log("致命一击！");
        }

        // 3. Calculate Final Damage
        // 4. Defensive Multipliers (apply before rolling final damage)
        const defensiveStage = this.getDefensiveStage(target, damageType);
        if (defensiveStage > 0) {
            multiplier *= (1 / (1 + Math.abs(defensiveStage) * 0.5));
        } else if (defensiveStage < 0) {
            multiplier *= (1 + Math.abs(defensiveStage) * 0.5);
        }

        let finalDamage = Math.floor(power * multiplier * (Math.random() * 0.2 + 0.9));

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
        if (target.name === "混沌魔君索伦森" && !this.hasStatUps(target)) {
            if (Math.random() < 0.5) {
                finalDamage = 0;
                this.log("魂印触发！免疫了本次伤害！");
                this.showFloatingText("魂印: 免疫", target === this.player);
            } else {
                finalDamage = Math.floor(finalDamage * 0.5);
                this.log("魂印触发！伤害减少50%！");
                this.showFloatingText("魂印: 减伤", target === this.player);
            }
        } else if (target.name === "混沌魔君索伦森" && this.hasStatUps(target)) {
             // Just log that passive didn't trigger because of stats? Or maybe show "Soul Mark: Inactive"?
             // No, the other part of soul mark (Heal) triggers at end of turn.
        }

        // Shield HP (Surging Canglan)
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
                target.buffs.turnEffects = [];
                attacker.buffs.turnEffects = [];
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

        target.hp = Math.max(0, target.hp - finalDamage);

        if (finalDamage > 0 && target.buffs.reflectDamage > 0) {
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
                        attacker.buffs.turnEffects = [];
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
                this.handleSolensenEntry(this.enemy, this.player);
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
                sureHit: false, // Not fully implemented in dealDamage yet
                damageDealt: 0
            };

            // 1. Pre-Damage Effects
            for (const effect of skill.effects) {
                if (window.SkillEffects[effect.id]) {
                    window.SkillEffects[effect.id](this, attacker, defender, effect.args, context);
                }
            }

            // 2. Deal Damage
            if (skill.power > 0 || skill.type === 'attack' || skill.type === 'ultimate') {
                context.phase = 'damage_calc';
                // Re-run effects to get damage modifiers (like 760, 1048)
                for (const effect of skill.effects) {
                    if (window.SkillEffects[effect.id]) {
                        window.SkillEffects[effect.id](this, attacker, defender, effect.args, context);
                    }
                }

                // Apply modifiers to dealDamage call
                // Note: dealDamage signature: (target, power, sureHit, ignoreResist, ignoreShield, isAttack, skill)
                // We need to pass context.damageMultiplier manually to power?
                // Or update dealDamage. For now, I'll apply multiplier to power.
                const finalPower = skill.power * context.damageMultiplier;
                
                // Check if skill is sureHit from description or type (Ultimate is usually sureHit)
                const isSureHit = skill.desc.includes('必中') || skill.type === 'ultimate';

                const isAttackSkill = skill.type === 'attack' || skill.type === 'ultimate';
                damage = await this.dealDamage(defender, finalPower, isSureHit, context.ignoreResist, context.ignoreShield, isAttackSkill, skill);
                context.damageDealt = damage;
            }

            // 3. Post-Damage Effects
            context.phase = 'after';
            for (const effect of skill.effects) {
                if (window.SkillEffects[effect.id]) {
                    window.SkillEffects[effect.id](this, attacker, defender, effect.args, context);
                }
            }
            return; // Skip legacy logic
        }
        
        // Fallback for generic attacks
        if (skill.type === 'attack' || skill.type === 'ultimate') {
            if (damage === 0) { // If not already dealt
                const isAttackSkill = skill.type === 'attack' || skill.type === 'ultimate';
                damage = await this.dealDamage(defender, skill.power, false, false, false, isAttackSkill, skill);
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
