import pMap from "p-map";

import config from "../config.json";
import { getLinkHref } from "../utils/getLinkHref.js";
import { getDOM } from "../utils/getDOM.js";
import { downloadTorrent } from "../utils/downloadTorrent.js";

export class FanSerials {
    public enabled = true;
    private activeUrl = "";
    private serialsUrls = {} as Record<string, string>;

    public async run() {
        if (!this.activeUrl.length) {
            await this.fillActiveUrl();
        }

        await this.fillSerialsUrls();
        await this.fillLastEpisodesUrls();
        await this.fillTorrentLinks();
        await this.downloadTorrents();
    }

    private get serials() {
        return Object.keys(config.fanserials);
    }

    private getSerialVoice(serial: string) {
        return (config.fanserials as Record<string, string>)[serial];
    }

    private getSerialByUrl(url: string) {
        return Object.entries(this.serialsUrls).reduce((acc, [serial, serialUrl]) => {
            return url === serialUrl ? serial : acc;
        }, "");
    }

    private fillActiveUrl = async () => {
        const mirrorDocDOM = await getDOM("http://fanserials-zerkalo.org/");
        const url = getLinkHref(mirrorDocDOM, ".c-header__link");

        this.activeUrl = url.replace(/^.*\/\//, "http://");
    }

    private fillSerialsUrls = async () => {
        const mainDocDOM = await getDOM(this.activeUrl);
        const linksToAllSerials = mainDocDOM.querySelectorAll(".literal__item a");
        return Array.from(linksToAllSerials)
            .reduce((acc, link) => {
                const serialTitle = link.textContent.trim();
                if (this.serials.includes(serialTitle)) {
                    const url = link.attributes.getNamedItem("href").value;

                    this.serialsUrls[serialTitle] = url;

                    acc.push(url);
                }

                return acc;
            }, [] as string[]);
    }

    private changeUrl(oldUrl: string, newUrl: string) {
        Object.entries(this.serialsUrls).forEach(([serial, url]) => {
            if (url === oldUrl) {
                this.serialsUrls[serial] = newUrl;
            }
        });
    }

    private fillLastEpisodesUrls = async () => {
        return pMap(Object.values(this.serialsUrls), this.fillLastEpisodeUrl, { concurrency: 1 });
    }

    private fillLastEpisodeUrl = async (serialUrl: string) => {
        const serialDocDOM = await getDOM(this.activeUrl + serialUrl);
        const url = getLinkHref(serialDocDOM, ".item-serial .field-img a");

        this.changeUrl(serialUrl, url);

        return getLinkHref(serialDocDOM, ".item-serial .field-img a");
    }

    private fillTorrentLinks = async () => {
        return pMap(Object.values(this.serialsUrls), this.fillTorrentLink, { concurrency: 1 });
    }

    private fillTorrentLink = async (episodeUrl: string) => {
        const episodeDocDOM = await getDOM(this.activeUrl + episodeUrl);

        const serial = this.getSerialByUrl(episodeUrl);
        const serialVoice = this.getSerialVoice(serial);

        const torrentLinks = episodeDocDOM.querySelectorAll(".torrent tr");
        const voiceRow = Array.from(torrentLinks)
            .find(row => {
                const voice = row.querySelector(".studio-voice");
                if (!voice) {
                    return false;
                }

                return voice.textContent.trim() === serialVoice;
            });
        const downloadLinks = Array.from(voiceRow.querySelectorAll(".download"));
        if (!downloadLinks.length) {
            throw Error("No download links for " + episodeUrl);
        }
        const downloadLink = downloadLinks.length > 1 ?
            downloadLinks[downloadLinks.length - 2] :
            downloadLinks[0];
        const url = downloadLink.attributes.getNamedItem("href").value;

        this.changeUrl(episodeUrl, url);

        return url;
    }

    private downloadTorrents = async () => {
        await Promise.all(Object.entries(this.serialsUrls).map(async ([serial, url]: string[]) => {
            await downloadTorrent(serial, url);
        }));
    }
}