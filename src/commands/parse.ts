import * as strategies from "../strategies";

export const command = "parse";

export const description = "Parse media sources using all strategies";

export async function action() {
    for (const Strategy of Object.values(strategies)) {
        const strategy = new Strategy();

        await strategy.run();
    }
}