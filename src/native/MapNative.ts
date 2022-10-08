import Alias from "../nodes/Alias";
import Bind from "../nodes/Bind";
import Block from "../nodes/Block";
import BooleanType from "../nodes/BooleanType";
import FunctionDefinition from "../nodes/FunctionDefinition";
import FunctionType from "../nodes/FunctionType";
import MapType from "../nodes/MapType";
import NameType from "../nodes/NameType";
import StructureDefinition from "../nodes/StructureDefinition";
import TypeVariable from "../nodes/TypeVariable";
import List from "../runtime/List";
import Text from "../runtime/Text";
import MapValue from "../runtime/MapValue";
import SetValue from "../runtime/SetValue";
import TypeException from "../runtime/TypeException";
import { MAP_KEY_TYPE_VAR_NAME, MAP_VALUE_TYPE_VAR_NAME } from "./NativeConstants";
import NativeHOFMapFilter from "./NativeHOFMapFilter";
import NativeHOFMapTranslate from "./NativeHOFMapTranslate";
import { createNativeConversion, createNativeFunction } from "./NativeBindings";
import Bool from "../runtime/Bool";

export default function bootstrapMap() {

    const mapFilterHOFType = new FunctionType([ 
        new Bind(
            [],
            undefined,
            [ new Alias("key", "eng") ],
            new NameType(MAP_KEY_TYPE_VAR_NAME)
        ),
        new Bind(
            [],
            undefined,
            [ new Alias("value", "eng") ],
            new NameType(MAP_VALUE_TYPE_VAR_NAME)
        )
    ], new BooleanType());

    const mapTranslateHOFType = new FunctionType([ 
        new Bind(
            [],
            undefined,
            [ new Alias("key", "eng") ],
            new NameType(MAP_KEY_TYPE_VAR_NAME)
        ),
        new Bind(
            [],
            undefined,
            [ new Alias("value", "eng") ],
            new NameType(MAP_VALUE_TYPE_VAR_NAME)
        )
    ], new NameType(MAP_VALUE_TYPE_VAR_NAME));

    return new StructureDefinition(
        // TODO Localized documentation
        [],
        [],
        // No interfaces
        [],
        // One type variable
        [ new TypeVariable(MAP_KEY_TYPE_VAR_NAME), new TypeVariable(MAP_VALUE_TYPE_VAR_NAME)],
        // No inputs
        [],
        // Include all of the functions defined above.
        new Block([], [             
            createNativeFunction(
                [], 
                [ new Alias("=") ], 
                [], 
                [ new Bind([], undefined, [ new Alias("map", "eng") ], new MapType() ) ], 
                new BooleanType(),
                evaluation => {
                        const map = evaluation?.getContext();
                        const other = evaluation.resolve("map");
                        return !(map instanceof MapValue && other instanceof MapValue) ? 
                            new TypeException(evaluation.getEvaluator(), new MapType(), other) :
                            new Bool(map.isEqualTo(other));
                    }
            ),
            createNativeFunction(
                [], 
                [ new Alias("≠") ], 
                [], 
                [ new Bind([], undefined, [ new Alias("map", "eng") ], new MapType() ) ], 
                new BooleanType(),
                evaluation => {
                        const map = evaluation?.getContext();
                        const other = evaluation.resolve("map");
                        return !(map instanceof MapValue && other instanceof MapValue) ? 
                            new TypeException(evaluation.getEvaluator(), new MapType(), other) :
                            new Bool(!map.isEqualTo(other));
                    }
            ),
            createNativeFunction([], [ new Alias("set", "eng") ], [], 
                [ 
                    new Bind([], undefined, [ new Alias("key", "eng") ], new NameType("K") ),
                    new Bind([], undefined, [ new Alias("value", "eng") ], new NameType("V") )
                ],
                new MapType(),
                evaluation => {
                    const map = evaluation.getContext();
                    const key = evaluation.resolve("key");
                    const value = evaluation.resolve("value");
                    if(map instanceof MapValue && key !== undefined && value !== undefined) return map.set(key, value);
                    else return new TypeException(evaluation.getEvaluator(), new MapType(), map);
                }
            ),        
            createNativeFunction([], [ new Alias("unset", "eng") ], [], 
                [ 
                    new Bind([], undefined, [ new Alias("key", "eng") ], new NameType("K") )
                ],
                new MapType(),
                evaluation => {
                    const map = evaluation.getContext();
                    const key = evaluation.resolve("key");
                    if(map instanceof MapValue && key !== undefined) return map.unset(key);
                    else return new TypeException(evaluation.getEvaluator(), new MapType(), map);
                }
            ),
            createNativeFunction([], [ new Alias("remove", "eng") ], [], 
                [ 
                    new Bind([], undefined, [ new Alias("value", "eng") ], new NameType("V") )
                ],
                new MapType(),
                evaluation => {
                    const map = evaluation.getContext();
                    const value = evaluation.resolve("value");
                    if(map instanceof MapValue && value !== undefined) return map.remove(value);
                    else return new TypeException(evaluation.getEvaluator(), new MapType(), map);
                }
            ),
            new FunctionDefinition(
                [], 
                [ new Alias("filter", "eng") ], 
                [], 
                [
                    new Bind([], undefined, [ new Alias("checker", "eng")], mapFilterHOFType)
                ],
                new NativeHOFMapFilter(mapFilterHOFType),
                new MapType(undefined, undefined, new NameType(MAP_KEY_TYPE_VAR_NAME), undefined, new NameType(MAP_VALUE_TYPE_VAR_NAME))
            ),
            new FunctionDefinition(
                [], 
                [ new Alias("translate", "eng") ], 
                [], 
                [
                    new Bind([], undefined, [ new Alias("translator", "eng")], mapTranslateHOFType)
                ],
                new NativeHOFMapTranslate(mapTranslateHOFType),
                new MapType(undefined, undefined, new NameType(MAP_KEY_TYPE_VAR_NAME), undefined, new NameType(MAP_VALUE_TYPE_VAR_NAME))
            ),
            createNativeConversion([], "{:}", "''", (val: MapValue) => new Text(val.toString())),
            createNativeConversion([], "{:}", "{}", (val: MapValue) => new SetValue(val.getKeys())),
            createNativeConversion([], "{:}", "[]", (val: MapValue) => new List(val.getValues()))
        ], false, true)
    );

}