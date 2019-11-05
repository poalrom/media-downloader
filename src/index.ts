import commander from "commander";
import { init } from "./commands";

const cli = new commander.Command();
cli.version(require("../package.json").version);

init(cli);

cli.parse(process.argv);
