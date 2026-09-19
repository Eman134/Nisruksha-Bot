const test = require('node:test');
const assert = require('node:assert/strict');
const UtilityService = require('../../_classes/services/utilityService');

test('UtilityService formats numbers without shared state', () => {
    const utility = new UtilityService();

    assert.equal(utility.format(1234567), '1.234.567');
    assert.equal(utility.toNumber('2m'), 2000000);
    assert.equal(utility.isInt('10'), true);
});

test('UtilityService creates independent instances', () => {
    const first = new UtilityService();
    const second = new UtilityService();

    first.money = 'custom';
    assert.equal(second.money, 'moedas');
});
