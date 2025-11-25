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
            damageBoostNext: 0, // Turns
            damageBoostVal: 100, // Percent (100 = +100% = 2x)
            immuneAbnormal: 0, // Turns
            immuneAbnormalCount: 0, // Count
            immuneStatDrop: 0, // Turns

            // Turn-based Status Effects (Debuffs/CC)
            turnEffects: [], // Array of { name: string, turns: number, type: 'buff'|'debuff'|'control' }

            // Generic Custom Storage for Spirit-Specific Data
            custom: {}
        };
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
        // Hook: BEFORE_FIXED_DAMAGE
        const ctx = { target, amount, source, blocked: false, blockReason: '', reflect: false };
        this.timeline.emit(TurnPhases.BEFORE_FIXED_DAMAGE, ctx);

        if (ctx.blocked) {
            if (ctx.blockReason) this.log(ctx.blockReason);
            if (ctx.reflect) {
                const attacker = (target === this.player) ? this.enemy : this.player;
                this.damageSystem.apply({ type: 'fixed', source: target, target: attacker, amount: ctx.amount, label: `${source}反弹` });
            }
            return 0;
        }

        return this.damageSystem.apply({ type: 'fixed', source: null, target, amount: ctx.amount, label: source });
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

        // Count Effects (Red Dots)
        if (char.buffs.blockAttack > 0) this.createBuffIcon(buffRow, '', char.buffs.blockAttack, 'count-effect', `封锁攻击: ${char.buffs.blockAttack}次`);
        if (char.buffs.blockAttribute > 0) this.createBuffIcon(buffRow, '', char.buffs.blockAttribute, 'count-effect', `封锁属性: ${char.buffs.blockAttribute}次`);
        if (char.buffs.immuneAbnormalCount > 0) this.createBuffIcon(buffRow, '', char.buffs.immuneAbnormalCount, 'count-effect', `免疫异常: ${char.buffs.immuneAbnormalCount}次`);
        if (char.buffs.waterCurseStack > 0) this.createBuffIcon(buffRow, '', char.buffs.waterCurseStack, 'count-effect', `水厄层数: ${char.buffs.waterCurseStack}`);

        // Shield (Shield UI)
        if (char.buffs.shield > 0) this.createBuffIcon(buffRow, '', char.buffs.shield, 'count-effect', `抵挡攻击: ${char.buffs.shield}次`);
        if (char.buffs.shieldHp > 0) this.createBuffIcon(buffRow, '', char.buffs.shieldHp, 'count-effect', `护盾: ${char.buffs.shieldHp}`);

        // Hook: GET_ICONS (Spirit-specific UI)
        const customIcons = [];
        this.timeline.emit(TurnPhases.GET_ICONS, { char, icons: customIcons });
        customIcons.forEach(icon => {
            this.createBuffIcon(buffRow, icon.label || '', icon.val || 0, icon.type || 'count-effect', icon.desc || '');
        });

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
        
        // Base Skill Priority (Should be in skill definition, but hardcoded for now if not present)
        if (skill.priority !== undefined) {
            p += skill.priority;
        } else {
            // Legacy hardcoded priorities (Move to skill definitions later)
            if (skill.name === "天威力破" || skill.name === "秩序之助" || skill.name === "上善若水" || skill.name === "诸雄之主") p += 3;
        }

        // Buff Priority
        if (char.buffs.priorityNext > 0) p += 2;

        if (hasForcedPriority) {
            p = Math.max(p, 100);
        }

        if (char.buffs.turnEffects.some(e => e.id === 'bind')) {
            return 0;
        }
        if (char.buffs.turnEffects.some(e => e.id === 'priority_down')) {
            p -= 2;
        }

        // Hook for Spirit-Specific Priority
        const ctx = { actor: char, skill, priority: p };
        this.timeline.emit(TurnPhases.CALCULATE_PRIORITY, ctx);
        
        return ctx.priority;
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

        // Context for action execution
        const ctx = {
            attacker,
            defender,
            skill,
            cancel: false,
            cancelReason: ''
        };

        // Phase: BEFORE_MOVE (Check blocks, traps, etc.)
        this.timeline.emit(TurnPhases.BEFORE_MOVE, ctx);

        if (ctx.cancel) {
            if (skill.pp > 0) skill.pp--;
            if (isPlayer) this.updateSkillButtons();
            if (ctx.cancelReason) {
                this.log(`技能无效！${ctx.cancelReason}`);
                this.showFloatingText("技能失效", isPlayer);
            }
            await this.wait(800);
            return;
        }

        // 1. Check Control
        const controlEffect = attacker.buffs.turnEffects.find(e => this.CONTROL_STATUSES.includes(e.id));
        if (controlEffect) {
            this.log(`${attacker.name} 处于 ${controlEffect.name} 状态，无法行动！`);
            await this.wait(500);
            return;
        }

        // 2. Check Silence / Blocks (Generic)
        let blockedReason = null;
        if (skill.type === 'buff') {
            if (attacker.buffs.turnEffects.some(e => e.id === 'block_attr')) {
                blockedReason = `${attacker.name} 的属性技能被封锁！`;
            }
        }
        if (skill.type === 'attack' || skill.type === 'ultimate') {
            if (!blockedReason && skill.type === 'ultimate' && attacker.buffs.turnEffects.some(e => e.id === 'silence')) {
                blockedReason = `${attacker.name} 被沉默，无法使用第五技能！`;
            }
            if (!blockedReason && attacker.buffs.turnEffects.some(e => e.id === 'block_attack')) {
                blockedReason = `${attacker.name} 的攻击技能被封锁！`;
            }
        }

        // 3. Execute
        this.log(`${attacker.name} 使用了 【${skill.name}】!`);

        if (blockedReason) {
            if (skill.pp > 0) skill.pp--;
            if (isPlayer) this.updateSkillButtons();
            this.log(`但是技能无效！${blockedReason}`);
            this.showFloatingText("技能失效", isPlayer);
            await this.wait(800);
            return;
        }

        // Daze / Blind / Confuse / Flammable Checks (Generic Turn Effects)
        // ...existing code...
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

        // Check one-time attack immunity (Generic)
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
                    // Agnes Shield check moved to Agnes spirit file via hook?
                    // Or keep generic 'immune_next_attack' handling here.
                    // Agnes Shield is just a specific instance of 'immune_next_attack'.
                    await this.wait(800);
                    return;
                }
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
        if (char.buffs.immuneAbnormal > 0) char.buffs.immuneAbnormal--;
        if (char.buffs.immuneStatDrop > 0) char.buffs.immuneStatDrop--;
        if (char.buffs.damageBoostNext > 0) char.buffs.damageBoostNext--;

        // Process Turn Effects
        for (let i = char.buffs.turnEffects.length - 1; i >= 0; i--) {
            const effect = char.buffs.turnEffects[i];

            // Delegate to TurnEffect registry
            if (window.TurnEffect && typeof window.TurnEffect.run === 'function') {
                window.TurnEffect.run(effect.id, this, { target: char, opponent, effect });
            }

            // Legacy/Standard Effects (Keep core ones here or move to registry?)
            // For now, keeping core status effects here to ensure stability, but ideally move all.
            // ...existing code...
            if (effect.id === 'poison') {
                const dmg = Math.floor(char.maxHp / 8); // Nerfed to 1/8
                this.damageSystem.apply({ type: 'percent', target: char, amount: dmg, label: `${char.name} 受到毒伤害` });
            }
            // ...existing code...
            if (effect.id === 'frostbite') {
                const dmg = Math.floor(char.maxHp / 8);
                this.damageSystem.apply({ type: 'percent', target: char, amount: dmg, label: `${char.name} 受到冻伤伤害` });
            }
            // ...existing code...
            if (effect.id === 'burn') {
                const dmg = Math.floor(char.maxHp / 8);
                this.damageSystem.apply({ type: 'percent', target: char, amount: dmg, label: `${char.name} 受到烧伤伤害` });
            }
            // ...existing code...
            if (effect.id === 'silence') {
                const dmg = Math.floor(char.maxHp / 8);
                this.damageSystem.apply({ type: 'percent', target: char, amount: dmg, label: `${char.name} 受到沉默伤害` });
            }
            // ...existing code...
            if (effect.id === 'immolate') {
                const dmg = Math.floor(char.maxHp / 8);
                this.damageSystem.apply({ type: 'percent', target: char, amount: dmg, label: `${char.name} 被焚烬灼烧`, options: { tag: 'immolate' } });
            }
            // ...existing code...
            if (effect.id === 'curse_fire') {
                const dmg = Math.floor(char.maxHp / 8);
                this.damageSystem.apply({ type: 'percent', target: char, amount: dmg, label: `${char.name} 受到烈焰诅咒伤害` });
            }
            // ...existing code...
            if (effect.id === 'bleed') {
                const dmg = 80;
                this.damageSystem.apply({ type: 'fixed', target: char, amount: dmg, label: `${char.name} 因流血损失` });
            }
            // ...existing code...
            if (effect.id === 'parasite') {
                const dmg = Math.floor(char.maxHp / 8);
                const applied = this.damageSystem.apply({ type: 'percent', target: char, amount: dmg, label: `${char.name} 被寄生吸取` });
                if (applied > 0) {
                    const healed = this.heal(opponent, applied, "寄生");
                    if (healed > 0) this.showFloatingText(`寄生 +${healed}`, opponent === this.player);
                }
            }
            // ...existing code...
            if (effect.id === 'water_curse') {
                // Stacking Fixed Damage (20% * Stacks)
                const stacks = char.buffs.custom.waterCurseStack || 1;
                const pct = 0.2 * stacks;
                const dmg = Math.floor(char.maxHp * pct);
                this.damageSystem.apply({ type: 'percent', target: char, amount: dmg, label: `${char.name} 受到水厄伤害(层数:${stacks})` });
            }
            // ...existing code...
            if (effect.id === 'confuse') {
                if (Math.random() < 0.05) {
                    const dmg = 50;
                    this.damageSystem.apply({ type: 'fixed', target: char, amount: dmg, label: `${char.name} 混乱自伤` });
                }
            }
            // ...existing code...
            if (effect.id === 'regen') {
                // Skill Effect: Regen (Check Control)
                if (!isControlled) {
                    const heal = Math.floor(char.maxHp / 8);
                    this.heal(char, heal, "再生");
                }
            }
            // ...existing code...
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
            // ...existing code...
            if (effect.id === 'absorb_hp_skill') {
                const params = effect.params || [4, 3];
                const ratio = params[1] || 3;
                if (!isControlled) {
                    const absorb = Math.max(1, Math.floor(opponent.maxHp / ratio));
                    // Check Star Sovereign immunity via generic flag or hook?
                    // For now, assume immunity is handled by damage system or specific hook.
                    // But this is direct HP manipulation.
                    // Let's use a hook or check a generic flag 'immunePercentDamage'.
                    if (!opponent.buffs.custom.immunePercentDamage) {
                        opponent.hp = Math.max(0, opponent.hp - absorb);
                        this.log(`${char.name} 吸取了 ${absorb} 点体力！`);
                        this.showDamageNumber(absorb, char === this.player ? false : true, 'pink');
                        this.heal(char, absorb, "吸血");
                    } else {
                        this.log(`${opponent.name} 免疫百分比吸取！`);
                    }
                }
            }

            effect.turns--;
            if (effect.turns <= 0) {
                this.log(`${char.name} 的 ${effect.name} 效果结束了。`);
                this.showFloatingText(`${effect.name} 结束`, char === this.player, '#aaa');

                // Clear Stacks if needed
                if (effect.id === 'water_curse') char.buffs.custom.waterCurseStack = 0;

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

        // Hook: BEFORE_ADD_TURN_EFFECT
        const ctx = { target, id, name, turns, desc, options, blocked: false, blockReason: '' };
        this.timeline.emit(TurnPhases.BEFORE_ADD_TURN_EFFECT, ctx);
        
        if (ctx.blocked) {
            if (ctx.blockReason) this.log(ctx.blockReason);
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
        
        // Context for damage calculation
        const ctx = {
            attacker,
            defender: target,
            skill,
            power,
            sureHit,
            ignoreResist,
            ignoreShield,
            isAttack,
            ignoreImmune,
            multiplier: 1,
            finalDamage: 0,
            cancel: false,
            cancelReason: ''
        };

        // Phase: CALCULATE_DAMAGE (Modifiers)
        this.timeline.emit(TurnPhases.CALCULATE_DAMAGE, ctx);

        if (ctx.cancel) {
            if (ctx.cancelReason) this.log(ctx.cancelReason);
            return 0;
        }

        // 1. Check Shield/Block (Generic)
        if (target.buffs.shield > 0 && !ctx.ignoreShield) {
            this.log(`${target.name} 抵挡了攻击！`);
            target.buffs.shield--;
            this.updateUI();
            return 0;
        }

        // 2. Attacker Multipliers
        const damageType = this.detectDamageType(skill);
        
        // Stats (Attack/SpecialAttack)
        const offensiveStage = this.getOffensiveStage(attacker, damageType);
        if (offensiveStage > 0) ctx.multiplier *= (1 + offensiveStage * 0.5);
        if (offensiveStage < 0) ctx.multiplier *= (1 / (1 + Math.abs(offensiveStage) * 0.5));

        // Burn Effect (Attack Power -50%)
        if (attacker.buffs.turnEffects.some(e => e.id === 'burn')) {
            ctx.multiplier *= 0.5;
            this.log("烧伤状态下攻击威力减半！");
        }

        // Crit
        if (attacker.buffs.critNext > 0) {
            ctx.multiplier *= 2;
            attacker.buffs.lastHitCrit = true;
            this.log("致命一击！");
        } else {
            let critRate = 0.05;
            if (skill && skill.crit) {
                if (typeof skill.crit === 'string' && skill.crit.includes('/')) {
                    const parts = skill.crit.split('/');
                    critRate = parseInt(parts[0]) / parseInt(parts[1]);
                } else {
                    critRate = skill.crit;
                }
            }
            if (Math.random() < critRate) {
                ctx.multiplier *= 2;
                attacker.buffs.lastHitCrit = true;
                this.log("致命一击！");
            } else {
                attacker.buffs.lastHitCrit = false;
            }
        }

        // 3. Defensive Multipliers
        const defensiveStage = this.getDefensiveStage(target, damageType);
        if (defensiveStage > 0) {
            ctx.multiplier *= (1 / (1 + Math.abs(defensiveStage) * 0.5));
        } else if (defensiveStage < 0) {
            ctx.multiplier *= (1 + Math.abs(defensiveStage) * 0.5);
        }

        // Final Calculation
        ctx.finalDamage = Math.floor(ctx.power * ctx.multiplier * (ctx.sureHit ? 1 : (Math.random() * 0.2 + 0.9)));

        // Phase: ON_HIT (Shields, Absorb, Reflect, etc.)
        this.timeline.emit(TurnPhases.ON_HIT, ctx);

        if (ctx.finalDamage <= 0) return 0;

        // Apply Damage
        const appliedDamage = this.damageSystem.apply({ 
            type: 'attack', 
            source: attacker, 
            target, 
            amount: ctx.finalDamage, 
            label: `${attacker.name} 的攻击`,
            options: { ignoreResist: ctx.ignoreResist }
        });

        // Record damage taken
        target.buffs.tookDamage = true;
        target.buffs.lastDamageTaken = appliedDamage;

        // Phase: AFTER_HIT (Triggers after damage)
        await this.timeline.emitAsync(TurnPhases.AFTER_HIT, { ...ctx, damageDealt: appliedDamage });

        return appliedDamage;
    }





    async checkWinCondition() {
        // Phase: DEATH_CHECK (Handle revives, death passives, etc.)
        this.timeline.emit(TurnPhases.DEATH_CHECK, { player: this.player, enemy: this.enemy });

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
        
        // Context for modification
        const ctx = { target, changes, blocked: false, blockReason: '' };
        
        // Hook: BEFORE_STAT_CHANGE
        this.timeline.emit(TurnPhases.BEFORE_STAT_CHANGE, ctx);

        if (ctx.blocked) {
            if (ctx.blockReason) this.log(ctx.blockReason);
            return;
        }

        // Check immunity (Generic)
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

        // Check Immune Stat Up (Generic Turn Effect)
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
            // Hook: AFTER_CLEAR_STATS
            this.timeline.emit(TurnPhases.AFTER_CLEAR_STATS, { target, success: true });
        }
        return cleared;
    }

    clearTurnEffects(target) {
        // Hook: BEFORE_CLEAR_TURN_EFFECTS
        const ctx = { target, blocked: false, blockReason: '' };
        this.timeline.emit(TurnPhases.BEFORE_CLEAR_TURN_EFFECTS, ctx);
        
        if (ctx.blocked) {
            if (ctx.blockReason) this.log(ctx.blockReason);
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
            await this.timeline.emitAsync(TurnPhases.AFTER_HIT, { attacker, defender, skill, context });

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
