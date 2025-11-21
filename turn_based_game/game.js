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
            }
        };

        // --- Team Setup ---
        this.playerTeam = [
            JSON.parse(JSON.stringify(this.charData.kingGaia)),
            JSON.parse(JSON.stringify(this.charData.agnes))
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
                    { name: "自我再生", type: "buff", effect: "regen", desc: "5回合内每回合恢复1/8体力" }
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
                    { name: "威吓", type: "buff", effect: "weakness", desc: "削弱对手攻击" }
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
            playerBuffs: document.getElementById('player-buffs'),
            enemyBuffs: document.getElementById('enemy-buffs'),
            bagModal: document.getElementById('bag-modal'),
            switchModal: document.getElementById('switch-modal'),
            teamList: document.getElementById('team-list'),
            playerName: document.querySelector('.player-status .name-tag'),
            enemyName: document.querySelector('.enemy-status .name-tag'),
            playerAvatar: document.querySelector('.player-status .avatar'),
            playerAvatar: document.querySelector('.player-status .avatar'),
            soulMark: document.getElementById('soul-mark'),
            playerPokemonCount: document.getElementById('player-pokemon-count'),
            enemyPokemonCount: document.getElementById('enemy-pokemon-count')
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
            'immune_stat': { name: '免弱', desc: '免疫能力下降' },
            'shield': { name: '抵挡', desc: '抵挡下一次攻击伤害' },
            'reflect': { name: '反弹', desc: '反弹受到的伤害(200%)' },
            'absorb': { name: '吸血', desc: '每回合吸取对手体力' },
            'crit': { name: '致命', desc: '攻击必定致命一击' },
            'priority': { name: '先制', desc: '技能先制度增加' },
            'damage_boost': { name: '增伤', desc: '造成的伤害翻倍' },
            'heal_block': { name: '禁疗', desc: '无法恢复体力' },
            'reflect_status': { name: '反弹异常', desc: '反弹受到的异常状态' },
            'eternal_fire': { name: '火种', desc: '回合结束时焚烬对手或吸取体力' },
            'regen': { name: '再生', desc: '每回合恢复1/8最大体力' },
            'weakness': { name: '威吓', desc: '削弱对手攻击' },
            'safeguard': { name: '神秘守护', desc: '免疫异常状态' }
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
            immuneStatDrop: 0, // Turns

            // Turn-based Status Effects (Debuffs/CC)
            turnEffects: [] // Array of { name: string, turns: number, type: 'buff'|'debuff'|'control' }
        };
    }

    get player() { return this.playerTeam[this.activePlayerIndex]; }
    get enemy() { return this.enemyTeam[this.activeEnemyIndex]; }

    initBattle() {
        this.updateUI();
        this.updateSkillButtons();
        this.log("战斗开始！");
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
        this.renderBuffs(p, this.ui.playerBuffs);
        this.renderBuffs(e, this.ui.enemyBuffs);

        // Turn Effects
        this.renderTurnEffects(p, document.getElementById('player-turn-effects'));
        this.renderTurnEffects(e, document.getElementById('enemy-turn-effects'));

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

    renderTurnEffects(char, container) {
        if (!container) return;
        container.innerHTML = '';

        // 1. Status Effects (Debuffs/CC) - Turn Based
        char.buffs.turnEffects.forEach(effect => {
            this.createBuffIcon(container, effect.name, effect.turns, `turn-effect turn ${effect.id}`, this.getEffectDescription(effect.id));
        });

        // 2. Positive Turn-based Effects - Turn Based
        if (char.buffs.reflectDamage > 0) this.createBuffIcon(container, '反弹', char.buffs.reflectDamage, 'status count', this.getEffectDescription('reflect'));
        if (char.buffs.absorbHp > 0) this.createBuffIcon(container, '吸血', char.buffs.absorbHp, 'status turn', this.getEffectDescription('absorb'));
        if (char.buffs.critNext > 0) this.createBuffIcon(container, '致命', char.buffs.critNext, 'status turn', this.getEffectDescription('crit'));
        if (char.buffs.priorityNext > 0) this.createBuffIcon(container, '先制', char.buffs.priorityNext, 'status turn', this.getEffectDescription('priority'));
        if (char.buffs.immuneAbnormal > 0) this.createBuffIcon(container, '免控', char.buffs.immuneAbnormal, 'status turn', this.getEffectDescription('immune_cc'));
        if (char.buffs.immuneStatDrop > 0) this.createBuffIcon(container, '免弱', char.buffs.immuneStatDrop, 'status turn', this.getEffectDescription('immune_stat'));
        if (char.buffs.damageBoostNext > 0) this.createBuffIcon(container, '增伤', char.buffs.damageBoostNext, 'status count', this.getEffectDescription('damage_boost')); // Count based (next hit)

        // Count Based
        if (char.buffs.shield > 0) this.createBuffIcon(container, '抵挡', 1, 'status count', this.getEffectDescription('shield'));
    }

    renderBuffs(char, container) {
        container.innerHTML = '';
        // Stats
        for (const [stat, val] of Object.entries(char.buffs.statUps)) {
            if (val !== 0) {
                this.createBuffIcon(container, stat, val);
            }
        }
    }

    createBuffIcon(container, label, val, type = null, desc = null) {
        const icon = document.createElement('div');
        icon.className = `buff-icon ${type ? type : (val > 0 ? 'up' : 'down')}`;
        let symbol = label;
        if (!type) {
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
        const p = this.player;
        for (let i = 0; i < 5; i++) {
            const skill = p.skills[i];
            if (!skill) continue;

            const nameEl = document.getElementById(`skill-name-${i}`);
            const powerEl = document.getElementById(`skill-power-${i}`);
            const ppEl = document.getElementById(`pp-${i}`);
            const iconEl = document.getElementById(`skill-icon-${i}`);

            if (nameEl) nameEl.innerText = skill.name;
            if (powerEl) powerEl.innerText = `威力: ${skill.power || 0}`;
            if (ppEl) ppEl.innerText = `PP: ${skill.pp}/${skill.maxPp}`;

            // Update icons based on skill type
            if (iconEl) {
                if (skill.type === 'attack') iconEl.innerText = '⚔️';
                else if (skill.type === 'buff') iconEl.innerText = '✨';
                else if (skill.type === 'ultimate') iconEl.innerText = '👑';
            }
        }
        // Update sprite
        this.ui.playerSprite.src = p.asset;
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
        }

        tooltip.innerText = content;
        const rect = event.target.getBoundingClientRect();
        tooltip.style.left = `${rect.left}px`;
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

        if (skill.pp <= 0) {
            this.log(`${skill.name} PP不足!`);
            return;
        }

        this.isBusy = true;
        skill.pp--;
        this.updateSkillButtons();

        // Priority Check
        let priority = 0;
        if (skill.name === "天威力破" || skill.name === "秩序之助") priority += 3;
        if (this.player.buffs.priorityNext > 0) priority += 2;

        // Agnes Soul Mark Start Turn Check
        if (this.player.name === "不灭·艾恩斯") {
            if (this.player.hp > this.enemy.hp) {
                this.log("魂印触发！对手被焚烬！");
                this.addTurnEffect(this.enemy, '焚烬', 2, 'burn');
            } else {
                this.log("魂印触发！消除对手回合效果！");
                this.enemy.buffs.turnEffects = [];
            }
        }

        this.log(`${this.player.name}使用了 【${skill.name}】!`);

        this.ui.playerSprite.classList.add('attack-lunge');
        await this.wait(500);
        this.ui.playerSprite.classList.remove('attack-lunge');

        // --- Skill Logic Implementation ---
        let damage = 0;

        // King Gaia Skills
        if (this.player.name === "王·盖亚") {
            if (skill.name === "战霸天下") {
                this.player.buffs.immuneAbnormal = 4;
                this.player.buffs.immuneStatDrop = 5;
                this.player.buffs.immuneAbnormal = 4;
                this.player.buffs.immuneStatDrop = 5;
                this.player.buffs.reflectDamage = 1; // Count: 1 (Next damage)
                this.addTurnEffect(this.player, '反弹异常', 4, 'reflect_status');
                this.log("免疫异常与能力下降，4回合内反弹伤害和异常！");
            }
            else if (skill.name === "不败之境") {
                const mult = (this.player.hp > this.player.maxHp / 2) ? 2 : 1;
                this.modifyStats(this.player, { attack: mult, defense: mult, speed: mult, specialAttack: mult, specialDefense: mult });
                this.player.buffs.absorbHp = 4;
                this.player.buffs.priorityNext = 2;
                this.log(`全属性 +${mult}！开始吸取体力！`);
            }
            else if (skill.name === "天诛乱舞") {
                const reversed = this.reverseStats(this.player);
                damage = await this.dealDamage(this.enemy, skill.power, true);
                if (reversed) {
                    this.addTurnEffect(this.enemy, '害怕', 2, 'fear');
                    this.log("反转成功！对手害怕2回合！");
                }
            }
            else if (skill.name === "天威力破") {
                const removed = this.enemy.buffs.turnEffects.length > 0;
                this.enemy.buffs.turnEffects = [];
                if (removed) {
                    this.log("消除成功！免疫下1次异常！");
                    this.player.buffs.immuneAbnormal = Math.max(this.player.buffs.immuneAbnormal, 1); // At least 1 turn
                }
                damage = await this.dealDamage(this.enemy, skill.power);
                if (damage < 280) {
                    this.player.buffs.critNext = 2;
                    this.log("伤害<280，下2回合致命！");
                }
            }
            else if (skill.name === "王·圣勇战意") {
                if (this.hasStatUps(this.enemy)) {
                    this.log("偷取强化！");
                    this.heal(this.player, 300);
                    this.stealStats(this.player, this.enemy);
                    this.player.buffs.priorityNext = 2; // "If enemy has stats, priority +2" (interpreted as next turn or this skill? Skill desc says "this skill priority +2", but logic is usually pre-check. Here we grant future priority or just handle it. The prompt said 'Steal -> Heal 300'. 'If enemy has stats -> Self priority +2'. Let's assume it means next turns for simplicity or we missed the pre-check priority. Actually, priority check is done before useSkill. So this effect might be for NEXT use? Or it was dynamic. Let's just give priorityNext for now.)
                }
                damage = await this.dealDamage(this.enemy, skill.power, true, true);
            }
        }
        // Agnes Skills
        else if (this.player.name === "不灭·艾恩斯") {
            if (skill.name === "王·酷烈风息") {
                const reversed = this.reverseStats(this.player);
                if (reversed) {
                    this.player.buffs.immuneAbnormal = Math.max(this.player.buffs.immuneAbnormal, 1);
                    this.log("反转成功！免疫下1次异常！");
                }
                damage = await this.dealDamage(this.enemy, skill.power, true);
                if (damage < 300) {
                    this.addTurnEffect(this.enemy, '焚烬', 2, 'burn');
                    this.log("伤害<300，对手焚烬！");
                } else {
                    this.player.buffs.damageBoostNext = 1; // +100%
                    this.log("伤害>=300，下回合伤害翻倍！");
                }
            }
            else if (skill.name === "火焰精核") {
                const hasStatus = this.enemy.buffs.turnEffects.some(e => ['burn', 'silence', 'poison', 'sleep', 'paralyze', 'fear'].includes(e.id));
                let mult = hasStatus ? 2 : 1;
                this.modifyStats(this.player, { attack: mult, defense: mult, speed: mult, specialAttack: mult, specialDefense: mult });

                // Heal/Fixed Dmg
                let absorbTurns = 4;
                if (this.player.hp < this.player.maxHp / 2) {
                    this.log("体力<1/2，效果翻倍！");
                    // Double the effect could mean double turns or double amount. Usually double amount.
                    // We'll handle double amount in handleEndTurn by checking a flag or just adding a stronger buff.
                    // For simplicity, let's just say it adds a special 'absorb_strong' or we handle it in logic.
                    // Let's use a flag on the buff? The buff system is simple. 
                    // Let's just add 2 stacks of absorb? No.
                    // Let's add a specific 'absorb_boost' flag.
                    this.player.buffs.absorbBoost = true;
                }
                this.player.buffs.absorbHp = absorbTurns;
                this.player.buffs.priorityNext = 2;
                this.log(`全属性 +${mult}！`);
            }
            else if (skill.name === "火种永存") {
                this.player.buffs.immuneAbnormal = 5;
                this.player.buffs.shield = 1;
                this.addTurnEffect(this.player, '火种', 4, 'eternal_fire'); // Passive effect on self
                this.log("免疫异常，免疫下一次攻击，火种永存！");
            }
            else if (skill.name === "秩序之助") {
                const hasEffects = this.enemy.buffs.turnEffects.length > 0;
                if (hasEffects) {
                    this.log("消除对手回合效果成功！");
                    this.enemy.buffs.turnEffects = [];
                    this.addTurnEffect(this.enemy, '沉默', 2, 'silence');
                    this.log("对手沉默2回合！");
                } else {
                    this.log("对手没有回合效果，消除失败！");
                }
                damage = await this.dealDamage(this.enemy, skill.power);
            }
            else if (skill.name === "王·焚世烈焰") {
                const cleared = this.clearStats(this.enemy);
                if (cleared) this.player.buffs.priorityNext = 1;

                let mult = 1;
                const hasStatus = this.enemy.buffs.turnEffects.some(e => ['burn', 'silence', 'poison', 'sleep', 'paralyze', 'fear'].includes(e.id));
                if (hasStatus) {
                    mult = 1.75;
                    this.log("对手异常，伤害提升75%！");
                } else {
                    const steal = Math.floor(this.enemy.maxHp / 8); // Nerfed to 1/8
                    this.enemy.hp = Math.max(0, this.enemy.hp - steal);
                    this.heal(this.player, steal, "吸取");
                    this.showDamageNumber(steal, false, 'pink');
                }
                damage = await this.dealDamage(this.enemy, skill.power * mult, true, true);
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
        if (silenceEffect) {
            availableSkills = this.enemy.skills.filter(s => s.type !== 'buff');
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
        }

        await this.wait(1000);
        if (this.checkWinCondition()) return;

        this.handleEndTurn(this.enemy, this.player);

        this.isPlayerTurn = true;
        this.isBusy = false;
        this.turnCount++;
        this.log(`--- 第 ${this.turnCount} 回合 ---`);
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
                this.log(`${char.name} 受到毒伤 ${dmg}!`);
                this.showDamageNumber(dmg, char === this.player, 'pink');
            }
            if (effect.id === 'burn') {
                const dmg = Math.floor(char.maxHp / 8); // Nerfed to 1/8
                char.hp = Math.max(0, char.hp - dmg);
                this.log(`${char.name} 受到焚烬伤害 ${dmg}!`);
                this.showDamageNumber(dmg, char === this.player, 'pink');
            }

            effect.turns--;
            if (effect.turns <= 0) {
                char.buffs.turnEffects.splice(i, 1);
                this.log(`${char.name} 的 ${effect.name} 效果结束了。`);
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
        if (target.buffs.immuneAbnormal > 0 && ['poison', 'sleep', 'paralyze', 'burn', 'freeze', 'fear'].includes(id)) {
            this.log(`${target.name} 免疫了异常状态！`);
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

    async dealDamage(target, power, sureHit = false, ignoreResist = false) {
        // Check Shield/Block
        if (target.buffs.shield > 0) {
            this.log(`${target.name} 抵挡了攻击！`);
            target.buffs.shield--;
            this.updateUI();
            return 0;
        }

        let multiplier = 1;
        const attacker = (target === this.player) ? this.enemy : this.player;

        // Agnes Damage Boost
        // Agnes Soul Mark: Burn on hit if HP > Enemy
        if (attacker.name === "不灭·艾恩斯" && attacker.hp > target.hp && (attacker.buffs.agnesBurnOnHit || attacker === this.player)) { // Check flag or condition
            // Actually, we set flag in useSkill, but for enemy turn?
            // Let's just check condition here
            if (!target.buffs.turnEffects.find(e => e.id === 'burn')) {
                this.addTurnEffect(target, '焚烬', 2, 'burn');
                this.log("魂印触发！对手被焚烬！");
            }
        }

        // Apply Damage
        const actualDmg = Math.floor(power * multiplier * (Math.random() * 0.2 + 0.9)); // +/- 10% variance

        // Agnes Fatal Trigger (Soul Mark)
        if (target.name === "不灭·艾恩斯" && target.hp - actualDmg <= 0 && !target.buffs.fatalTriggered) {
            target.hp = 1;
            target.buffs.fatalTriggered = true; // Once per battle
            this.log("魂印触发！受到致命伤害，保留1点体力！");

            // Clear all buffs/debuffs
            this.clearStats(target);
            this.clearStats(attacker);
            target.buffs.turnEffects = [];
            attacker.buffs.turnEffects = [];
            this.log("双方状态被重置！");

            // Burn Enemy
            this.addTurnEffect(attacker, '焚烬', 2, 'burn');
            this.updateUI();
            return actualDmg; // Return damage but HP is clamped
        }

        target.hp = Math.max(0, target.hp - actualDmg);
        multiplier *= 2;
        attacker.buffs.damageBoostNext--;
        // Gaia Soul Mark: Reduce damage taken by 50% if has abnormal status
        if (target.name === "王·盖亚") {
            const hasStatus = target.buffs.turnEffects.some(e => ['burn', 'poison', 'sleep', 'paralyze', 'freeze', 'fear'].includes(e.id));
            if (hasStatus) {
                multiplier *= 0.5;
                this.log("魂印触发！伤害减少50%！");
            }
        }
    }

    // Gaia Soul Mark Chance
    if(attacker.name === "王·盖亚") {
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

let damage = Math.floor(power * (1 + Math.random() * 0.2) * multiplier * 2);

// Fatal Damage Check (Agnes)
if (target.name === "不灭·艾恩斯" && damage >= target.hp && !target.flags.fatalTriggered) {
    damage = target.hp - 1;
    target.flags.fatalTriggered = true;
    this.log("不灭·艾恩斯魂印触发！残留1点体力！");
    this.clearStats(this.player);
    this.clearStats(this.enemy);
    this.addTurnEffect(attacker, '焚烬', 2, 'burn');
    this.log("消除双方强化，对手焚烬！");
}

target.hp = Math.max(0, target.hp - damage);
this.showDamageNumber(damage, target === this.player);

const sprite = target === this.player ? this.ui.playerSprite : this.ui.enemySprite;
sprite.classList.add('shake');
await this.wait(500);
sprite.classList.remove('shake');

this.updateUI();
this.log(`造成 ${damage} 伤害!`);
return damage;
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

    for (let [stat, val] of Object.entries(changes)) {
        target.buffs.statUps[stat] = (target.buffs.statUps[stat] || 0) + val;
        // Cap at 6 / -6
        target.buffs.statUps[stat] = Math.max(-6, Math.min(6, target.buffs.statUps[stat]));
    }
    this.updateUI();
}
reverseStats(target) {
    let reversed = false;
    for (let key in target.buffs.statUps) {
        if (target.buffs.statUps[key] < 0) {
            target.buffs.statUps[key] *= -1;
            reversed = true;
        }
    }
    if (reversed) this.log("反转了能力下降！");
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
    this.updateUI();
    if (actual > 0) this.log(`${source} ${actual} 体力!`);
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
wait(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }
}

const game = new Game();
