import type { Token } from "./Token";
import Type from "./Type";

export default class PrimitiveType extends Type {

    readonly type: Token;

    constructor(type: Token) {
        super();

        this.type = type;
    }

    getChildren() {
        return [ this.type ];
    }

    toWordplay(): string {
        return `${this.type.toWordplay()}`;
    }

}