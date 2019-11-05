export function getLinkHref(document: Document, selector: string) {
    const linkElement = document.querySelector(selector);
    return linkElement.attributes.getNamedItem("href").value;
}