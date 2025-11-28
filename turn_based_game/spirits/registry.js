/**
 * Spirit Registry - 精灵注册系统
 * 
 * 支持两种格式:
 * 1. 旧格式: registerSpirit(definition, registerPhases) - 兼容 game.js
 * 2. 新格式: SpiritRegistry[key] = { ... } - 新架构
 */
(() => {
    // =========================================================================
    // 旧格式支持
    // =========================================================================
    window.SPIRIT_DEFS = window.SPIRIT_DEFS || [];
    window.SPIRIT_PHASE_REGISTRY = window.SPIRIT_PHASE_REGISTRY || [];

    /**
     * 注册精灵 (旧格式)
     */
    window.registerSpirit = function registerSpirit(definition, registerPhases) {
        if (!definition || !definition.key) return;
        
        // 检查是否已存在
        const existingIdx = window.SPIRIT_DEFS.findIndex(d => d.key === definition.key);
        if (existingIdx >= 0) {
            window.SPIRIT_DEFS[existingIdx] = definition;
        } else {
            window.SPIRIT_DEFS.push(definition);
        }
        
        if (typeof registerPhases === 'function') {
            // 检查是否已注册
            const phaseIdx = window.SPIRIT_PHASE_REGISTRY.findIndex(r => r.key === definition.key);
            if (phaseIdx >= 0) {
                window.SPIRIT_PHASE_REGISTRY[phaseIdx].register = registerPhases;
            } else {
                window.SPIRIT_PHASE_REGISTRY.push({ key: definition.key, register: registerPhases });
            }
        }
        
        // 同步到新系统
        window.SpiritRegistry = window.SpiritRegistry || {};
        window.SpiritRegistry[definition.key] = {
            ...definition,
            skills: definition.skills || []
        };
    };

    // =========================================================================
    // 新格式支持
    // =========================================================================
    window.SpiritRegistry = window.SpiritRegistry || {};
    
    /**
     * 从新系统同步到旧系统
     */
    window.syncSpiritsToLegacy = function syncSpiritsToLegacy() {
        const registry = window.SpiritRegistry || {};
        
        for (const [key, spirit] of Object.entries(registry)) {
            // 检查是否已在 SPIRIT_DEFS 中
            const existingIdx = window.SPIRIT_DEFS.findIndex(d => d.key === key);
            
            // 转换技能格式
            const skills = (spirit.skills || []).map((skill, index) => ({
                name: skill.name,
                type: skill.type || 'attack',
                power: skill.power || 0,
                pp: skill.pp || skill.maxPp || 10,
                maxPp: skill.maxPp || skill.pp || 10,
                desc: skill.desc || '',
                priority: skill.priority || 0,
                accuracy: skill.accuracy || 100,
                element: skill.element || spirit.element || 'normal',
                category: skill.category || 'physical',
                effects: skill.effects || [],
                calls: skill.calls || []
            }));
            
            // 构建精灵定义
            const def = {
                key: key,
                name: spirit.name,
                element: spirit.element || 'normal',
                maxHp: spirit.maxHp || 1000,
                maxPp: spirit.maxPp || 100,
                attack: spirit.attack || 100,
                defense: spirit.defense || 100,
                spAttack: spirit.spAttack || 100,
                spDefense: spirit.spDefense || 100,
                speed: spirit.speed || 100,
                skills: skills,
                asset: spirit.asset || `assets/${key}.png`,
                soulMark: spirit.soulbuff?.name || spirit.soulMark || '魂',
                soulMarkDesc: spirit.soulbuff?.desc || spirit.soulMarkDesc || '',
                resist: spirit.resist || { fixed: 0, percent: 0, trueDmg: 0 },
                meta: {
                    isStar: key === 'starSovereign',
                    isBoss: spirit.isBoss || false
                }
            };
            
            if (existingIdx >= 0) {
                window.SPIRIT_DEFS[existingIdx] = def;
            } else {
                window.SPIRIT_DEFS.push(def);
            }
        }
        
        console.log(`[SpiritRegistry] Synced ${Object.keys(registry).length} spirits`);
    };
    
    /**
     * 获取精灵
     */
    window.getSpirit = function getSpirit(key) {
        return window.SpiritRegistry[key] || 
               window.SPIRIT_DEFS.find(d => d.key === key) || 
               null;
    };
    
    /**
     * 获取所有精灵键
     */
    window.getAllSpiritKeys = function getAllSpiritKeys() {
        const keys = new Set([
            ...Object.keys(window.SpiritRegistry || {}),
            ...(window.SPIRIT_DEFS || []).map(d => d.key)
        ]);
        return Array.from(keys);
    };
    
    console.log('[SpiritRegistry] Ready');
})();
