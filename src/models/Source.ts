import type Node from "../nodes/Node";
import Token from "../nodes/Token";
import type Program from "../nodes/Program";
import Native from "../native/NativeBindings";
import type Conflict from "../conflicts/Conflict";
import { parseProgram, Tokens } from "../parser/Parser";
import { tokenize } from "../parser/Tokenizer";
import Evaluator from "../runtime/Evaluator";
import UnicodeString from "./UnicodeString";
import type Value from "../runtime/Value";
import StructureType from "../nodes/StructureType";
import type Structure from "../runtime/Structure";
import { createStructure } from "../runtime/Structure";
import Verse from "../native/Verse";
import Group from "../native/Group";
import Phrase from "../native/Phrase";
import List from "../runtime/List";
import Text from "../runtime/Text";
import Measurement from "../runtime/Measurement";
import type Project from "./Project";
import Context from "../nodes/Context";

/** A document representing executable Wordplay code and it's various metadata, such as conflicts, tokens, and evaulator. */
export default class Source {

    readonly name: string;
    readonly code: UnicodeString;

    // Derived fields
    readonly program: Program;
    conflicts: Conflict[];
    readonly evaluator: Evaluator;

    /** An index of conflicts for each node. */
    readonly _primaryNodeConflicts: Map<Node, Conflict[]> = new Map();
    readonly _secondaryNodeConflicts: Map<Node, Conflict[]> = new Map();

    /** The Project sets this once it's added. */
    _project: Project | undefined;
    
    readonly observers: Set<() => void> = new Set();

    constructor(name: string, code: string | UnicodeString, observers?: Set<() => void>) {

        this.name = name;
        this.code = typeof code === "string" ? new UnicodeString(code) : code;
        
        // Compute derived fields.
        this.program = parseProgram(new Tokens(tokenize(this.code.getText())));
        this.evaluator = new Evaluator(this);
        this.evaluator.observe(this);
        this.conflicts = [];

        if(observers !== undefined) this.observers = observers;

    }

    getProject() { return this._project; }
    setProject(project: Project) { 
        
        this._project = project; 

        // Now that we have a project, we can get conflicts (to enable cross-Source borrows).

        this.conflicts = this.program.getAllConflicts(this.getContext());

        // Build the conflict index by going through each conflict, asking for the conflicting nodes
        // and adding to the conflict to each node's list of conflicts.
        this.conflicts.forEach(conflict => {
            const complicitNodes = conflict.getConflictingNodes();
            complicitNodes.primary.forEach(node => {
                let nodeConflicts = this._primaryNodeConflicts.get(node) ?? [];
                this._primaryNodeConflicts.set(node, [ ... nodeConflicts, conflict ]);
            });
            complicitNodes.secondary?.forEach(node => {
                let nodeConflicts = this._primaryNodeConflicts.get(node) ?? [];
                this._secondaryNodeConflicts.set(node, [ ... nodeConflicts, conflict ]);
            });
        });
    
    }

    getContext() {
        return new Context(this, this.program, this.evaluator.getShares(), Native);
    }

    getName() { return this.name; }
    getCode() { return this.code; }

    getEvaluator() { return this.evaluator; }

    observe(observer: () => void) { 
        this.observers.add(observer);
    }

    ignore(observer: () => void) { 
        this.observers.delete(observer);
    }

    stepped() {
        this.observers.forEach(observer => observer());
    }

    ended() {
        this.observers.forEach(observer => observer());
    }

    getVerse() {         
        const value = this.evaluator.getLatestResult();
        return value === undefined ? undefined : this.valueToVerse(value);
    }

    phrase(text: string | Text, size: number=12, font: string="Noto Sans", ): Structure {
        return createStructure(this.evaluator, Phrase, {
            size: new Measurement(size),
            font: new Text(font),
            text: text instanceof Text ? text : new Text(text)
        })
    }

    group(...phrases: Structure[]) {
        return createStructure(this.evaluator, Group, {
            phrases: new List(phrases)
        })
    }

    verse(group: Structure) {
        return createStructure(this.evaluator, Verse, { group: group });
    }

    valueToVerse(value: Value | undefined): Structure {

        // If the content is a Verse, just show it as is.
        if(value === undefined)
            return this.verse(this.group(this.phrase("No value", 20)))

        const contentType = value.getType(this.evaluator.getContext());
        if(contentType instanceof StructureType && contentType.structure === Verse)
            return value as Structure;
        else if(contentType instanceof StructureType && contentType.structure === Group)
            return this.verse(value as Structure);
        else if(contentType instanceof StructureType && contentType.structure === Phrase)
            return this.verse(this.group( value as Structure ));
        else if(value instanceof Text || typeof value === "string")
            return this.verse(this.group(this.phrase(value, 20)));
        else
            return this.verse(this.group(this.phrase(value.toString(), 20)));

    }

    cleanup() {
        this.evaluator.stop();
    }
    
    withPreviousGraphemeReplaced(char: string, position: number) {
        const newCode = this.code.withPreviousGraphemeReplaced(char, position);
        return newCode === undefined ? undefined : new Source(this.name, newCode, this.observers);
    }

    withGraphemesAt(char: string, position: number) {
        const newCode = this.code.withGraphemesAt(char, position);
        return newCode == undefined ? undefined : new Source(this.name, newCode, this.observers);
    }

    withoutGraphemeAt(position: number) {
        const newCode = this.code.withoutGraphemeAt(position);
        return newCode == undefined ? undefined : new Source(this.name, newCode, this.observers);
    }

    withoutGraphemesBetween(start: number, endExclusive: number) {
        const newCode = this.code.withoutGraphemesBetween(start, endExclusive);
        return newCode == undefined ? undefined : new Source(this.name, newCode, this.observers);
    }

    withCode(code: string) {
        return new Source(this.name, new UnicodeString(code), this.observers);
    }

    clone() {
        return new Source(this.name, this.code, this.observers);
    }

    getNextToken(token: Token, direction: -1 | 1): Token | undefined {

        const tokens = this.program.nodes(n => n instanceof Token) as Token[];
        const index = tokens.indexOf(token);
        return (direction < 0 && index <= 0) ? undefined : 
            (direction > 0 && index >= tokens.length - 1) ? undefined :
            tokens[index + direction];

    }

    /** Given a node N, and the set of conflicts C in the program, determines the subset of C in which the given N is complicit. */
    getPrimaryConflictsInvolvingNode(node: Node) {
        return this._primaryNodeConflicts.get(node);
    }
    getSecondaryConflictsInvolvingNode(node: Node) {
        return this._secondaryNodeConflicts.get(node);
    }

}