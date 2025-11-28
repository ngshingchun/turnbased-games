/**
 * SpiritState - 精灵状态容器
 * 
 * 与 TurnPhase 并行运行
 * 每个节点可以读写状态
 * 
 * 包含子系统:
 * - HP: 体力
 * - PP: 活力
 * - STATS: 属性阶段
 * - STATUS: 异常状态
 * - TURN_EFFECTS: 回合效果
 * - COUNT_EFFECTS: 计数效果
 * - SOUL_BUFF: 魂印
 * - SHIELD: 护盾
 * - RESIST: 抗性
 */
(() => {
    class SpiritState {
        constructor(spiritData = {}) {
            this.init(spiritData);
        }

        init(data) {
            // 基础信息
            this.id = data.id || '';
            this.key = data.key || '';
            this.name = data.name || '';
            this.owner = data.owner || null;  // 'A' or 'B'
            this.element = data.element || 'normal';

            // === HP 子系统 ===
            this.hp = {
                current: data.hp ?? data.maxHp ?? 1000,
                max: data.maxHp ?? 1000,
                
                get percent() { return this.max > 0 ? this.current / this.max : 0; },
                get isLow() { return this.percent <= 0.25; },
                get isCritical() { return this.percent <= 0.1; },
                
                damage(amount) {
                    const actual = Math.min(this.current, Math.max(0, amount));
                    this.current = Math.max(0, this.current - actual);
                    return actual;
                },
                
                heal(amount) {
                    const actual = Math.min(this.max - this.current, Math.max(0, amount));
                    this.current = Math.min(this.max, this.current + actual);
                    return actual;
                },
                
                set(value) {
                    this.current = Math.max(0, Math.min(this.max, value));
                }
            };

            // === PP 子系统 ===
            this.pp = {
                current: data.pp ?? data.maxPp ?? 100,
                max: data.maxPp ?? 100,
                locked: false,
                lockTurns: 0,
                
                get percent() { return this.max > 0 ? this.current / this.max : 0; },
                
                use(amount) {
                    if (this.locked) return 0;
                    const actual = Math.min(this.current, Math.max(0, amount));
                    this.current = Math.max(0, this.current - actual);
                    return actual;
                },
                
                restore(amount) {
                    const actual = Math.min(this.max - this.current, Math.max(0, amount));
                    this.current = Math.min(this.max, this.current + actual);
                    return actual;
                },
                
                drain(amount) {
                    const actual = Math.min(this.current, Math.max(0, amount));
                    this.current = Math.max(0, this.current - actual);
                    return actual;
                },
                
                lock(turns = 1) {
                    this.locked = true;
                    this.lockTurns = turns;
                },
                
                unlock() {
                    this.locked = false;
                    this.lockTurns = 0;
                },
                
                tickLock() {
                    if (this.lockTurns > 0) {
                        this.lockTurns--;
                        if (this.lockTurns <= 0) this.unlock();
                    }
                }
            };

            // === STATS 子系统 ===
            this.stats = {
                base: {
                    attack: data.attack ?? 100,
                    defense: data.defense ?? 100,
                    spAttack: data.spAttack ?? 100,
                    spDefense: data.spDefense ?? 100,
                    speed: data.speed ?? 100
                },
                stage: {
                    attack: 0,
                    defense: 0,
                    spAttack: 0,
                    spDefense: 0,
                    speed: 0
                },
                modifiers: [],  // 临时修饰器
                
                // 阶段倍率
                _stageMultiplier(stage) {
                    const mult = [2/8, 2/7, 2/6, 2/5, 2/4, 2/3, 1, 3/2, 4/2, 5/2, 6/2, 7/2, 8/2];
                    return mult[Math.max(0, Math.min(12, stage + 6))];
                },
                
                // 计算最终属性
                calc(stat) {
                    const base = this.base[stat] || 0;
                    const stage = this.stage[stat] || 0;
                    let value = base * this._stageMultiplier(stage);
                    
                    // 应用修饰器
                    for (const mod of this.modifiers) {
                        if (mod.stat === stat || mod.stat === 'all') {
                            if (mod.type === 'percent') value *= (1 + mod.value / 100);
                            else if (mod.type === 'flat') value += mod.value;
                        }
                    }
                    return Math.floor(value);
                },
                
                // 修改阶段
                modify(changes) {
                    const results = {};
                    for (const [stat, change] of Object.entries(changes)) {
                        if (this.stage[stat] !== undefined) {
                            const before = this.stage[stat];
                            this.stage[stat] = Math.max(-6, Math.min(6, before + change));
                            results[stat] = { before, after: this.stage[stat], change: this.stage[stat] - before };
                        }
                    }
                    return results;
                },
                
                clearUps() {
                    for (const stat in this.stage) {
                        if (this.stage[stat] > 0) this.stage[stat] = 0;
                    }
                    this.modifiers = this.modifiers.filter(m => m.value < 0);
                },
                
                clearDowns() {
                    for (const stat in this.stage) {
                        if (this.stage[stat] < 0) this.stage[stat] = 0;
                    }
                    this.modifiers = this.modifiers.filter(m => m.value > 0);
                },
                
                reset() {
                    for (const stat in this.stage) this.stage[stat] = 0;
                    this.modifiers = [];
                },
                
                reverse() {
                    for (const stat in this.stage) {
                        this.stage[stat] = -this.stage[stat];
                    }
                }
            };

            // === STATUS 子系统 (异常状态) ===
            this.status = {
                current: [],  // { id, name, turns, source }
                immune: [],   // { statusId, turns }
                
                apply(statusId, name, turns, source = null) {
                    if (this.isImmune(statusId)) return { applied: false, reason: 'immune' };
                    this.remove(statusId);  // 移除同类
                    this.current.push({ id: statusId, name, turns, source, appliedAt: Date.now() });
                    return { applied: true };
                },
                
                remove(statusId) {
                    this.current = this.current.filter(s => s.id !== statusId);
                },
                
                has(statusId) {
                    return this.current.some(s => s.id === statusId);
                },
                
                get(statusId) {
                    return this.current.find(s => s.id === statusId);
                },
                
                isImmune(statusId) {
                    return this.immune.some(i => i.statusId === statusId && i.turns > 0);
                },
                
                addImmunity(statusId, turns) {
                    this.immune.push({ statusId, turns });
                },
                
                tick() {
                    const expired = [];
                    this.current = this.current.filter(s => {
                        s.turns--;
                        if (s.turns <= 0) { expired.push(s); return false; }
                        return true;
                    });
                    this.immune = this.immune.filter(i => { i.turns--; return i.turns > 0; });
                    return expired;
                },
                
                clear() {
                    this.current = [];
                },
                
                isControlled() {
                    const controlStatus = ['sleep', 'freeze', 'paralyze', 'confuse', 'fear', 'stone'];
                    return this.current.some(s => controlStatus.includes(s.id));
                },
                
                getControlStatus() {
                    const controlStatus = ['sleep', 'freeze', 'paralyze', 'confuse', 'fear', 'stone'];
                    return this.current.find(s => controlStatus.includes(s.id));
                }
            };

            // === TURN_EFFECTS 子系统 (回合效果) ===
            this.turnEffects = {
                list: [],  // { id, name, turns, handler, onExpire, source, cannotDispel }
                
                add(effect) {
                    // 检查是否已存在同ID效果
                    const existing = this.list.findIndex(e => e.id === effect.id);
                    if (existing !== -1 && !effect.stack) {
                        // 刷新回合数
                        this.list[existing].turns = Math.max(this.list[existing].turns, effect.turns);
                        return;
                    }
                    this.list.push({
                        id: effect.id,
                        name: effect.name,
                        turns: effect.turns,
                        handler: effect.handler,
                        onExpire: effect.onExpire,
                        source: effect.source,
                        cannotDispel: effect.cannotDispel || false,
                        params: effect.params
                    });
                },
                
                remove(id) {
                    this.list = this.list.filter(e => e.id !== id);
                },
                
                has(id) {
                    return this.list.some(e => e.id === id);
                },
                
                get(id) {
                    return this.list.find(e => e.id === id);
                },
                
                tick() {
                    const expired = [];
                    this.list = this.list.filter(e => {
                        e.turns--;
                        if (e.turns <= 0) { expired.push(e); return false; }
                        return true;
                    });
                    return expired;
                },
                
                dispel(excludeUndispellable = true) {
                    if (excludeUndispellable) {
                        const removed = this.list.filter(e => !e.cannotDispel);
                        this.list = this.list.filter(e => e.cannotDispel);
                        return removed;
                    }
                    const removed = [...this.list];
                    this.list = [];
                    return removed;
                },
                
                clear() {
                    this.list = [];
                }
            };

            // === COUNT_EFFECTS 子系统 (计数效果) ===
            this.countEffects = {
                data: {},  // { key: { count, max, handler } }
                
                add(key, amount = 1, max = Infinity) {
                    if (!this.data[key]) this.data[key] = { count: 0, max };
                    this.data[key].count = Math.min(max, this.data[key].count + amount);
                    return this.data[key].count;
                },
                
                consume(key, amount = 1) {
                    if (!this.data[key]) return 0;
                    const consumed = Math.min(this.data[key].count, amount);
                    this.data[key].count -= consumed;
                    return consumed;
                },
                
                get(key) {
                    return this.data[key]?.count || 0;
                },
                
                set(key, value, max = Infinity) {
                    this.data[key] = { count: Math.min(max, value), max };
                },
                
                has(key) {
                    return this.data[key]?.count > 0;
                },
                
                clear(key) {
                    if (key) delete this.data[key];
                    else this.data = {};
                }
            };

            // === SOUL_BUFF 子系统 (魂印) ===
            this.soulBuff = {
                key: data.soulBuffKey || data.key || '',
                active: true,
                
                disable() { this.active = false; },
                enable() { this.active = true; },
                
                // 执行魂印效果（通过全局 SoulBuff 系统）
                run(phase, context) {
                    if (!this.active) return null;
                    return window.SoulBuff?.run(this.key, phase, context);
                }
            };

            // === SHIELD 子系统 (护盾) ===
            this.shield = {
                hp: 0,          // HP护盾
                count: 0,       // 次数护盾
                immune: 0,      // 免疫次数
                
                addHp(amount) {
                    this.hp += amount;
                },
                
                addCount(count) {
                    this.count += count;
                },
                
                addImmune(count) {
                    this.immune += count;
                },
                
                // 吸收伤害，返回剩余伤害
                absorb(damage) {
                    // 先检查免疫
                    if (this.immune > 0) {
                        this.immune--;
                        return 0;
                    }
                    // 次数护盾
                    if (this.count > 0) {
                        this.count--;
                        return 0;
                    }
                    // HP护盾
                    if (this.hp > 0) {
                        if (this.hp >= damage) {
                            this.hp -= damage;
                            return 0;
                        } else {
                            const remaining = damage - this.hp;
                            this.hp = 0;
                            return remaining;
                        }
                    }
                    return damage;
                },
                
                clear() {
                    this.hp = 0;
                    this.count = 0;
                    this.immune = 0;
                }
            };

            // === RESIST 子系统 (抗性) ===
            this.resist = {
                fixed: data.resist?.fixed ?? 35,
                percent: data.resist?.percent ?? 35,
                trueDmg: data.resist?.trueDmg ?? 0,
                immolate: data.resist?.immolate ?? 0,
                
                calc(type, baseDamage) {
                    const resist = this[type] || 0;
                    if (resist >= 100) return 0;
                    return Math.floor(baseDamage * (1 - resist / 100));
                }
            };

            // === 技能相关 ===
            this.skills = data.skills || [];
            this.currentSkill = null;

            // === 回合标记 (每回合重置) ===
            this.turnFlags = {
                usedSkill: false,
                usedAttackSkill: false,
                usedAttrSkill: false,
                tookDamage: false,
                damageTaken: 0,
                damageDealt: 0,
                healed: 0,
                killedEnemy: false,
                wasKilled: false
            };
        }

        /**
         * 每回合开始时重置标记
         */
        resetTurnFlags() {
            this.turnFlags = {
                usedSkill: false,
                usedAttackSkill: false,
                usedAttrSkill: false,
                tookDamage: false,
                damageTaken: 0,
                damageDealt: 0,
                healed: 0,
                killedEnemy: false,
                wasKilled: false
            };
        }

        /**
         * 检查是否存活
         */
        isAlive() {
            return this.hp.current > 0;
        }

        /**
         * 检查是否死亡
         */
        isDead() {
            return this.hp.current <= 0;
        }

        /**
         * 创建状态快照
         */
        snapshot() {
            return {
                hp: { current: this.hp.current, max: this.hp.max },
                pp: { current: this.pp.current, max: this.pp.max, locked: this.pp.locked },
                stats: { stage: { ...this.stats.stage }, modifiers: [...this.stats.modifiers] },
                status: { current: [...this.status.current], immune: [...this.status.immune] },
                turnEffects: { list: this.turnEffects.list.map(e => ({ ...e })) },
                countEffects: { data: { ...this.countEffects.data } },
                shield: { hp: this.shield.hp, count: this.shield.count, immune: this.shield.immune }
            };
        }

        /**
         * 从快照恢复
         */
        restore(snapshot) {
            this.hp.current = snapshot.hp.current;
            this.hp.max = snapshot.hp.max;
            this.pp.current = snapshot.pp.current;
            this.pp.max = snapshot.pp.max;
            this.pp.locked = snapshot.pp.locked;
            this.stats.stage = { ...snapshot.stats.stage };
            this.stats.modifiers = [...snapshot.stats.modifiers];
            this.status.current = [...snapshot.status.current];
            this.status.immune = [...snapshot.status.immune];
            this.turnEffects.list = snapshot.turnEffects.list.map(e => ({ ...e }));
            this.countEffects.data = { ...snapshot.countEffects.data };
            this.shield.hp = snapshot.shield.hp;
            this.shield.count = snapshot.shield.count;
            this.shield.immune = snapshot.shield.immune;
        }
    }

    // =========================================================================
    // Factory
    // =========================================================================
    window.SpiritState = SpiritState;
    window.createSpiritState = (data) => new SpiritState(data);
})();
