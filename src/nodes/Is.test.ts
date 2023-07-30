import { test, expect } from 'vitest';
import Evaluator from '@runtime/Evaluator';
import { getDefaultBasis } from '../basis/Basis';

const basis = getDefaultBasis();

test.each([
    ['1•#', '⊤'],
    ['1s•#', '⊥'],
    ['1s•#s', '⊤'],
    ['1s•#m', '⊥'],
    ["'hi'•#", '⊥'],
    ["'hi'•''", '⊤'],
    ['a: 1\na•#', '⊤'],
])('Expect %s to be %s', (code, value) => {
    expect(Evaluator.evaluateCode(basis, code)?.toString()).toBe(value);
});
