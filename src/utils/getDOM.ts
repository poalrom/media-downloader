import fetch from "node-fetch";
import { JSDOM } from "jsdom";
import { logger } from "../logger";

export async function getDOM(url: string) {
    logger.info(`getDOM: Load DOM from ${url}`);
    const mainDoc = await fetch(url).then(res => res.text());
    logger.info(`getDOM: Successfully load DOM from ${url}`);
    return (new JSDOM(mainDoc)).window.document;
}