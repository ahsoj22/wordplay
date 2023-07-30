import Evaluator from '@runtime/Evaluator';
import { test, expect } from 'vitest';
import { getDefaultBasis } from '../basis/Basis';

const basis = getDefaultBasis();

test.each([
    [
        `
Time()
`,
        [],
        '0ms',
    ],
    [
        `
        ↓ sup1
        sup1
    `,
        [`0`],
        '0',
    ],
])('Expect %s to be %s', (code, supplements, value) => {
    expect(Evaluator.evaluateCode(basis, code, supplements)?.toString()).toBe(
        value
    );
});
