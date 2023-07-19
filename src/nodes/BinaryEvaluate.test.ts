import { test, expect } from 'vitest';
import { testConflict } from '@conflicts/TestUtilities';
import Evaluator from '@runtime/Evaluator';
import BinaryEvaluate from './BinaryEvaluate';
import { FALSE_SYMBOL } from '@parser/Symbols';
import { OR_SYMBOL } from '@parser/Symbols';
import IncompatibleInput from '@conflicts/IncompatibleInput';
import { getDefaultNative } from '../native/Native';

const native = await getDefaultNative();

test.each([
    ['1 · 5', '1 · ""', BinaryEvaluate, IncompatibleInput],
    ['(1ms % 5) = 1ms', '(1ms % 5) = 1', BinaryEvaluate, IncompatibleInput, 1],
    ['(5ms ÷ 5) = 1ms', '(1ms ÷ 5) = 1', BinaryEvaluate, IncompatibleInput, 1],
    ['1 + 1', '1 + !', BinaryEvaluate, IncompatibleInput],
    ['1m + 1m', '1m + 1s', BinaryEvaluate, IncompatibleInput],
    [
        `${FALSE_SYMBOL} ${OR_SYMBOL} ${FALSE_SYMBOL}`,
        `${FALSE_SYMBOL} ${OR_SYMBOL} 1`,
        BinaryEvaluate,
        IncompatibleInput,
    ],
])(
    'Expect %s no conflicts, %s to have conflicts',
    (good, bad, node, conflict, number?) => {
        testConflict(good, bad, node, conflict, number);
    }
);

test.each([
    ['1 + 2', '3'],
    ['1 - 2', '-1'],
    ['1 - -2', '3'],
    ['⊥ | ⊥', '⊥'],
    ['⊥ | ⊤', '⊤'],
    ['⊤ | ⊤', '⊤'],
    ['⊥ & ⊥', '⊥'],
    ['⊥ & ⊤', '⊥'],
    ['⊤ & ⊤', '⊤'],
    ['⊥ & ⊤ ? 1 2', '2'],
    ['⊤ & ~⊤', '⊥'],
    ['~(⊤ & ⊤)', '⊥'],
])('Expect %s to be %s', (code, value) => {
    expect(Evaluator.evaluateCode(native, code)?.toString()).toBe(value);
});