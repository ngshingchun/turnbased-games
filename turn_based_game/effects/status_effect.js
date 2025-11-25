/**
 * StatusEffect - 状态效果模块
 * 处理所有异常状态的施加、免疫、反弹逻辑
 * 
 * 路由：
 * - 状态施加 → StatusRegistry (获取配置) → TurnEffect (回合结算)
 * - 状态免疫 → ResistSystem (抗性检测) + ImmuneEffect (免疫效果)
 * 
 * TurnPhase 路由：
 * - 施加检测: BEFORE_STATUS_APPLY
 * - 实际施加: AFTER_HIT (命中后追加)
 * - 状态结算: TURN_END
 */
(() => {
    const StatusEffect = {
        /**
         * 获取所有异常状态ID（从 StatusRegistry 获取）
         */
        get ABNORMAL() {
            if (window.StatusRegistry) {
                return window.StatusRegistry.getAllIds();
            }
            // 后备列表
            return [
                'poison', 'frostbite', 'burn', 'immolate', 'bleed', 'paralyze', 'exhaust', 'fear', 'sleep', 'petrify',
                'confuse', 'weaken', 'parasite', 'infect', 'bind', 'daze', 'freeze', 'paralysis', 'blind',
                'flammable', 'curse', 'curse_fire', 'curse_fatal', 'curse_weak', 'silence', 'submit', 'stagnant',
                'block_attr', 'heal_block'
            ];
        },

        /**
         * 获取控制状态（从 StatusRegistry 获取）
         */
        get CONTROL() {
            if (window.StatusRegistry) {
                return window.StatusRegistry.getControlStatuses().map(s => s.id);
            }
            return ['sleep', 'paralyze', 'freeze', 'fear', 'exhaust', 'petrify', 'curse', 'immolate', 'infect'];
        },

        /**
         * 获取禁止切换状态
         */
        get SWITCH_BLOCK() {
            if (window.StatusRegistry) {
                return window.StatusRegistry.getSwitchBlockStatuses().map(s => s.id);
            }
            return ['bind', 'paralysis', 'stagnant'];
        },

        /**
         * 检查是否为异常状态
         */
        isAbnormal(id) {
            if (window.StatusRegistry) {
                return window.StatusRegistry.isAbnormal(id);
            }
            return this.ABNORMAL.includes(id);
        },

        /**
         * 检查是否为控制状态
         */
        isControl(id) {
            if (window.StatusRegistry) {
                return window.StatusRegistry.isControl(id);
            }
            return this.CONTROL.includes(id);
        },

        /**
         * 检查是否禁止切换
         */
        isSwitchBlock(id) {
            if (window.StatusRegistry) {
                return window.StatusRegistry.isBlockSwitch(id);
            }
            return this.SWITCH_BLOCK.includes(id);
        },

        /**
         * 检查目标是否免疫异常状态
         * 路由: ResistSystem + ImmuneEffect + 特殊精灵效果
         */
        checkImmunity(game, target, statusId, options = {}) {
            const inStarRage = options.inStarRage || false;
            
            if (inStarRage) return { immune: false };

            // 1. 检查 ResistSystem 概率免疫
            if (window.ResistSystem?.checkStatusImmune(statusId, target)) {
                return { immune: true, reason: 'resistSystem' };
            }

            // 2. 免疫异常回合
            if (target.buffs.immuneAbnormal > 0 && this.isAbnormal(statusId)) {
                return { immune: true, reason: 'immuneAbnormal' };
            }

            // 3. 免疫异常次数
            if (target.buffs.immuneAbnormalCount > 0 && this.isAbnormal(statusId)) {
                return { immune: true, reason: 'immuneAbnormalCount', consume: true };
            }

            // 4. 凝滞免疫控制
            if (target.buffs.turnEffects.some(e => e.id === 'stagnant') && this.isControl(statusId)) {
                return { immune: true, reason: 'stagnant' };
            }

            // 5. 重生之翼 2层免疫异常
            if (target.name === "重生之翼" && target.buffs.godlyGloryEnergy >= 2 && this.isAbnormal(statusId)) {
                return { immune: true, reason: 'rebirthWingsEnergy' };
            }

            return { immune: false };
        },

        /**
         * 检查状态反弹
         */
        checkReflect(game, target, statusId) {
            const reflectStatus = target.buffs.turnEffects.find(e => e.id === 'reflect_status');
            if (reflectStatus && this.isAbnormal(statusId)) {
                return { reflect: true };
            }
            return { reflect: false };
        },

        /**
         * 施加状态效果 - 核心方法
         * 在 AFTER_HIT 阶段调用
         * @returns {boolean} 是否成功施加
         */
        apply(game, target, statusId, name, turns, desc = null, options = {}) {
            const inStarRage = game.starRageWindow?.active || false;

            // 从 StatusRegistry 获取配置
            const config = window.StatusRegistry?.get(statusId);
            if (config) {
                name = name || config.name;
                desc = desc || config.desc;
                turns = turns || config.defaultTurns;
            }

            // 异常状态固定2回合
            if (this.isAbnormal(statusId)) {
                turns = 2;
            }

            // 触发 BEFORE_STATUS_APPLY 阶段
            if (game.timeline) {
                const { cancelled } = game.timeline.emit(TurnPhases.BEFORE_STATUS_APPLY, {
                    target,
                    statusId,
                    name,
                    turns,
                    options
                });
                if (cancelled) {
                    return false;
                }
            }

            // 1. 检查反弹
            if (!inStarRage && config?.canReflect !== false) {
                const reflectResult = this.checkReflect(game, target, statusId);
                if (reflectResult.reflect) {
                    game.log(`${target.name} 反弹了异常状态！`);
                    const source = (target === game.player) ? game.enemy : game.player;
                    if (!source.buffs.turnEffects.find(e => e.id === 'reflect_status')) {
                        this.apply(game, source, statusId, name, turns, desc, options);
                    }
                    return false;
                }
            }

            // 2. 检查免疫
            if (config?.canImmune !== false) {
                const immuneResult = this.checkImmunity(game, target, statusId, { inStarRage });
                if (immuneResult.immune) {
                    game.log(`${target.name} 免疫了异常状态！`);
                    game.showFloatingText("免疫异常", target === game.player);
                    if (immuneResult.consume && target.buffs.immuneAbnormalCount > 0) {
                        target.buffs.immuneAbnormalCount--;
                    }
                    game.updateUI();
                    return false;
                }
            }

            // 3. 检查已存在状态
            const existing = target.buffs.turnEffects.find(e => e.id === statusId);
            if (existing) {
                existing.turns = turns;
                if (desc) existing.desc = desc;
                Object.assign(existing, options);

                // 可叠加状态
                if (config?.stackable || statusId === 'weaken') {
                    const maxStacks = config?.maxStacks || options.maxStacks || 5;
                    existing.stacks = Math.min((existing.stacks || 1) + 1, maxStacks);
                    game.log(`${target.name} 的 ${name} 层数提升至 ${existing.stacks}！`);
                } else {
                    game.log(`${target.name} 的 ${name} 状态刷新了！`);
                }
            } else {
                // 4. 添加新状态
                const effectData = { name, turns, id: statusId, desc, ...options };
                if ((config?.stackable || statusId === 'weaken') && typeof effectData.stacks !== 'number') {
                    effectData.stacks = 1;
                }
                target.buffs.turnEffects.push(effectData);
                game.log(`${target.name} 陷入了 ${name} 状态！`);

                // 5. 执行 onApply 回调
                if (config?.onApply) {
                    config.onApply(game, target);
                }

                // 6. 路由到 TurnEffect 执行初始化逻辑
                if (window.TurnEffect?.run) {
                    window.TurnEffect.run(statusId, game, { target, effect: effectData, source: options.source || null });
                }
            }

            game.updateUI();
            return true;
        },

        /**
         * 随机施加状态（从 StatusRegistry 随机选择）
         */
        applyRandom(game, target, count = 1, filter = {}, turns = 2) {
            if (window.StatusRegistry) {
                return window.StatusRegistry.applyRandom(game, target, count, filter, turns);
            }
            
            // 后备实现
            const pool = filter.include || this.ABNORMAL;
            const exclude = filter.exclude || [];
            const available = pool.filter(id => !exclude.includes(id));
            const results = [];
            
            for (let i = 0; i < count && available.length > 0; i++) {
                const idx = Math.floor(Math.random() * available.length);
                const id = available.splice(idx, 1)[0];
                const success = this.apply(game, target, id, id, turns);
                results.push({ id, success });
            }
            
            return results;
        },

        /**
         * 移除状态效果
         */
        remove(game, target, statusId) {
            const idx = target.buffs.turnEffects.findIndex(e => e.id === statusId);
            if (idx !== -1) {
                const effect = target.buffs.turnEffects[idx];
                target.buffs.turnEffects.splice(idx, 1);
                game.log(`${target.name} 的 ${effect.name} 效果被移除了。`);
                
                // 执行 onRemove 回调
                const config = window.StatusRegistry?.get(statusId);
                if (config?.onRemove) {
                    config.onRemove(game, target);
                }
                
                game.updateUI();
                return true;
            }
            return false;
        },

        /**
         * 检查目标是否有指定状态
         */
        has(target, statusId) {
            return target.buffs.turnEffects.some(e => e.id === statusId);
        },

        /**
         * 检查目标是否有任意异常状态
         */
        hasAnyAbnormal(target) {
            return target.buffs.turnEffects.some(e => this.isAbnormal(e.id));
        },

        /**
         * 检查目标是否被控制
         */
        isControlled(target) {
            return target.buffs.turnEffects.some(e => this.isControl(e.id));
        },

        /**
         * 执行状态回合结算
         * 在 TURN_END 阶段调用
         */
        tickAll(game, target) {
            const results = [];
            for (const effect of target.buffs.turnEffects) {
                if (window.StatusRegistry) {
                    const result = window.StatusRegistry.tick(game, target, effect.id);
                    if (result) {
                        results.push({ id: effect.id, ...result });
                    }
                }
            }
            return results;
        }
    };

    window.StatusEffect = StatusEffect;
})();

