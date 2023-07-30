import type { BasisTypeName } from '../basis/BasisConstants';
import { LIST_CLOSE_SYMBOL, LIST_OPEN_SYMBOL } from '@parser/Symbols';
import type Context from './Context';
import BasisType from './BasisType';
import Token from './Token';
import Symbol from './Symbol';
import Type from './Type';
import type TypeSet from './TypeSet';
import { node, type Grammar, type Replacement, optional } from './Node';
import type Locale from '@locale/Locale';
import Glyphs from '../lore/Glyphs';
import NodeRef from '../locale/NodeRef';
import type Node from './Node';

export default class ListType extends BasisType {
    readonly open: Token;
    readonly type: Type | undefined;
    readonly close: Token | undefined;
    // In some cases we know the length of a list and the index in an accessor and can use this to narrow types.
    readonly length?: number;

    constructor(
        open: Token,
        type: Type | undefined,
        close: Token | undefined,
        length?: number
    ) {
        super();

        this.open = open;
        this.type = type;
        this.close = close;
        this.length = length;

        this.computeChildren();
    }

    static make(type?: Type, length?: number) {
        return new ListType(
            new Token(LIST_OPEN_SYMBOL, Symbol.ListOpen),
            type,
            new Token(LIST_CLOSE_SYMBOL, Symbol.ListClose),
            length
        );
    }

    static getPossibleNodes(
        type: Type | undefined,
        node: Node,
        selected: boolean
    ) {
        return [
            ListType.make(),
            ...(node instanceof Type && selected ? [ListType.make(node)] : []),
        ];
    }

    getGrammar(): Grammar {
        return [
            { name: 'open', kind: node(Symbol.ListOpen) },
            { name: 'type', kind: optional(node(Type)) },
            { name: 'close', kind: node(Symbol.ListClose) },
        ];
    }

    clone(replace?: Replacement) {
        return new ListType(
            this.replaceChild('open', this.open, replace),
            this.replaceChild('type', this.type, replace),
            this.replaceChild('close', this.close, replace)
        ) as this;
    }

    computeConflicts() {}

    acceptsAll(types: TypeSet, context: Context): boolean {
        return types.list().every(
            (type) =>
                type instanceof ListType &&
                // If this list type has no type specified, any will do.
                (this.type === undefined ||
                    // If the given type has no type specified, any will do
                    type.type === undefined ||
                    this.type.accepts(type.type, context))
        );
    }

    generalize(context: Context) {
        return ListType.make(this.type?.generalize(context));
    }

    getBasisTypeName(): BasisTypeName {
        return 'list';
    }

    resolveTypeVariable(name: string, context: Context): Type | undefined {
        const listDef = context.basis.getSimpleDefinition('list');
        return listDef.types !== undefined &&
            listDef.types.hasVariableNamed(name)
            ? this.type
            : undefined;
    }

    getNodeLocale(translation: Locale) {
        return translation.node.ListType;
    }

    getGlyphs() {
        return Glyphs.List;
    }

    getDescriptionInputs(locale: Locale, context: Context) {
        return [
            this.type ? new NodeRef(this.type, locale, context) : undefined,
        ];
    }
}
