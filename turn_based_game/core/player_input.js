/**
 * PlayerInput - 玩家输入容器
 * 
 * 注册玩家行动，在对应阶段读取执行
 */
(() => {
    const INPUT_TYPE = {
        SKILL: 'skill',
        SWITCH: 'switch',
        ITEM: 'item',
        FLEE: 'flee'
    };

    class PlayerInput {
        constructor() {
            this.reset();
        }

        reset() {
            this.inputA = null;
            this.inputB = null;
            this.locked = false;
        }

        /**
         * 注册行动
         * @param {string} player - 'A' or 'B'
         * @param {Object} action - { type, data, priority }
         */
        register(player, action) {
            if (this.locked) return false;
            
            const input = {
                type: action.type,
                data: action.data,
                priority: action.priority || 0,
                timestamp: Date.now()
            };
            
            if (player === 'A') this.inputA = input;
            else if (player === 'B') this.inputB = input;
            
            return true;
        }

        /**
         * 注册技能使用
         */
        registerSkill(player, skill, options = {}) {
            return this.register(player, {
                type: INPUT_TYPE.SKILL,
                data: { skill, target: options.target || 'enemy' },
                priority: skill.priority || 0
            });
        }

        /**
         * 注册精灵交换
         */
        registerSwitch(player, spirit, options = {}) {
            return this.register(player, {
                type: INPUT_TYPE.SWITCH,
                data: { spirit },
                priority: options.priority || 6
            });
        }

        /**
         * 注册道具使用
         */
        registerItem(player, item, options = {}) {
            return this.register(player, {
                type: INPUT_TYPE.ITEM,
                data: { item, target: options.target || 'self' },
                priority: options.priority || 7
            });
        }

        /**
         * 获取玩家输入
         */
        get(player) {
            return player === 'A' ? this.inputA : this.inputB;
        }

        /**
         * 检查是否有输入
         */
        hasInput(player) {
            return player === 'A' ? this.inputA !== null : this.inputB !== null;
        }

        /**
         * 检查双方是否都已输入
         */
        allReady() {
            return this.inputA !== null && this.inputB !== null;
        }

        /**
         * 清除输入
         */
        clear(player = null) {
            if (player === 'A') this.inputA = null;
            else if (player === 'B') this.inputB = null;
            else { this.inputA = null; this.inputB = null; }
            this.locked = false;
        }

        /**
         * 锁定输入
         */
        lock() { this.locked = true; }
        unlock() { this.locked = false; }

        /**
         * 解析先后手顺序
         * @param {Object} stateA - A方状态
         * @param {Object} stateB - B方状态
         * @returns {{ first: string, second: string, actions: Array }}
         */
        resolve(stateA, stateB) {
            const actions = [];
            
            if (this.inputA) {
                actions.push({
                    player: 'A',
                    ...this.inputA,
                    effectivePriority: this._calcPriority(this.inputA, stateA)
                });
            }
            
            if (this.inputB) {
                actions.push({
                    player: 'B',
                    ...this.inputB,
                    effectivePriority: this._calcPriority(this.inputB, stateB)
                });
            }
            
            // 排序
            actions.sort((a, b) => {
                // 优先级不同
                if (a.effectivePriority !== b.effectivePriority) {
                    return b.effectivePriority - a.effectivePriority;
                }
                // 优先级相同，比较速度
                const speedA = stateA?.stats?.calc('speed') || 0;
                const speedB = stateB?.stats?.calc('speed') || 0;
                if (speedA !== speedB) {
                    return speedB - speedA;  // 速度高的先
                }
                // 速度也相同，随机
                return Math.random() - 0.5;
            });
            
            const first = actions[0]?.player || 'A';
            const second = first === 'A' ? 'B' : 'A';
            
            return { first, second, actions };
        }

        _calcPriority(input, state) {
            let priority = input.priority || 0;
            
            // 交换和道具固定高优先级
            if (input.type === INPUT_TYPE.SWITCH) return 100 + priority;
            if (input.type === INPUT_TYPE.ITEM) return 99 + priority;
            
            // 技能优先级修正
            if (input.type === INPUT_TYPE.SKILL && state) {
                // 先制BUFF
                if (state.turnEffects?.has('priority_boost')) {
                    const boost = state.turnEffects.get('priority_boost');
                    priority += boost.params?.amount || 1;
                }
                // 反潜
                if (state.turnEffects?.has('priority_block')) {
                    priority = Math.min(priority, -7);
                }
                // 强制先出
                if (state.countEffects?.has('force_first')) {
                    return 200;
                }
            }
            
            return priority;
        }

        /**
         * 获取先手方
         */
        getFirstMover(stateA, stateB) {
            return this.resolve(stateA, stateB).first;
        }
    }

    window.INPUT_TYPE = INPUT_TYPE;
    window.PlayerInput = PlayerInput;
    window.createPlayerInput = () => new PlayerInput();
})();
