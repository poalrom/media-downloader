import fetch from "node-fetch";
import { createWriteStream, existsSync } from "fs";
import md5 from "md5";
import { logger } from "../logger";
import { resolve } from "path";
import HttpProxyAgent from "http-proxy-agent";

export async function downloadTorrent(serial: string, url: string) {
    const fileName = generateFileName(serial, url);
    const filePath = resolve(__dirname, "../../downloaded", fileName);

    if (existsSync(filePath) || existsSync(filePath + ".loaded")) {
        logger.info(`downloadTorrent: file ${fileName} for url ${url} already exists`);

        return;
    }

    const username = process.env.LUMINATI_USER;
    const password = process.env.LUMINATI_PASSWORD;
    const port = 22225;
    const session_id = (1000000 * Math.random()) | 0;
    const super_proxy = "http://" + username + "-country-gb-session-" + session_id + ":" + password + "@zproxy.lum-superproxy.io:" + port;

    logger.info(`downloadTorrent: start downloading torrent from ${url}`);
    const torrentBuffer = await fetch(url, { agent: new HttpProxyAgent(super_proxy) });
    const writeStream = createWriteStream(filePath);

    return new Promise((res, rej) => {
        torrentBuffer.body.pipe(writeStream);
        torrentBuffer.body.on("error", (err) => {
            rej(err);
        });
        writeStream.on("finish", function() {
            res();
        });
    });
}

function generateFileName(serial: string, url: string) {
    return serial + "-" + md5(url) + ".torrent";
}