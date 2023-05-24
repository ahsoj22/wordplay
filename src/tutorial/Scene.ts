import type { TileID } from '../components/project/Layout';
import type Check from './Check';

type Scene = {
    /** The project to show */
    sources: string[];
    /** Optional list of tile IDs to hide upon display */
    hidden?: TileID[];
    /** Test that must be true before the next step becomes available */
    checks?: Check[];
};

export default Scene;