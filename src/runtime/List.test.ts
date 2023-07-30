import { test, expect } from 'vitest';
import { FALSE_SYMBOL, TRUE_SYMBOL } from '@parser/Symbols';
import Evaluator from './Evaluator';
import { getDefaultBasis } from '../basis/Basis';

const basis = getDefaultBasis();

test.each([
    ['[] = []', TRUE_SYMBOL],
    ['[1] = [1]', TRUE_SYMBOL],
    ['[1] = [1 2]', FALSE_SYMBOL],
    ['[1 2] = [1]', FALSE_SYMBOL],
    ['[1 2] ≠ [1]', TRUE_SYMBOL],
])('Expect %s to be %s', (code, value) => {
    expect(Evaluator.evaluateCode(basis, code)?.toString()).toBe(value);
});
