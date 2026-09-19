const test = require('node:test');
const assert = require('node:assert/strict');
const RuntimeState = require('../../_classes/services/runtimeState');

test('RuntimeState tracks command and player metrics per instance', () => {
    const state = new RuntimeState();

    state.incrementCommands();
    state.rememberPlayer('42');
    state.rememberPlayer(42);

    assert.equal(state.commandsExecuted, 1);
    assert.deepEqual([...state.playersSeen], ['42']);
});
