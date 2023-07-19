import type { NativeTypeName } from '../native/NativeConstants';
import BooleanType from '@nodes/BooleanType';
import type UnaryEvaluate from '@nodes/UnaryEvaluate';
import { FALSE_SYMBOL, TRUE_SYMBOL } from '@parser/Symbols';
import { NOT_SYMBOL } from '@parser/Symbols';
import type Evaluator from './Evaluator';
import FunctionException from './FunctionException';
import Primitive from './Primitive';
import type Value from './Value';
import type Locale from '@locale/Locale';
import type Expression from '../nodes/Expression';
import concretize from '../locale/concretize';

export default class Bool extends Primitive {
    readonly bool: boolean;

    constructor(creator: Expression, bool: boolean) {
        super(creator);

        this.bool = bool;
    }

    toWordplay() {
        return this.bool ? TRUE_SYMBOL : FALSE_SYMBOL;
    }

    getType() {
        return BooleanType.make();
    }

    getNativeTypeName(): NativeTypeName {
        return 'boolean';
    }

    and(requestor: Expression, value: Bool) {
        return new Bool(requestor, this.bool && value.bool);
    }
    or(requestor: Expression, value: Bool) {
        return new Bool(requestor, this.bool || value.bool);
    }
    not(requestor: Expression) {
        return new Bool(requestor, !this.bool);
    }

    evaluatePrefix(
        requestor: Expression,
        evaluator: Evaluator,
        op: UnaryEvaluate
    ): Value {
        switch (op.getOperator()) {
            case '~':
            case NOT_SYMBOL:
                return this.not(requestor);
            default:
                return new FunctionException(evaluator, op, this, op.fun);
        }
    }

    isEqualTo(val: Value) {
        return val instanceof Bool && this.bool === val.bool;
    }

    getDescription(locale: Locale) {
        return concretize(locale, locale.term.boolean);
    }

    getSize() {
        return 1;
    }
}
