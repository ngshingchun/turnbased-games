(() => {
    window.SPIRIT_DEFS = window.SPIRIT_DEFS || [];
    window.SPIRIT_PHASE_REGISTRY = window.SPIRIT_PHASE_REGISTRY || [];

    window.registerSpirit = function registerSpirit(definition, registerPhases) {
        if (!definition || !definition.key) return;
        window.SPIRIT_DEFS.push(definition);
        if (typeof registerPhases === 'function') {
            window.SPIRIT_PHASE_REGISTRY.push({ key: definition.key, register: registerPhases });
        }
    };
})();
