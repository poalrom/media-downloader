import { Command } from "commander";
import * as parse from "./parse";

interface ICommand {
    command: string;
    description: string;
    action: (...args: any[]) => void;
}

export function init(cli: Command) {
    register(cli, parse);
}

function register(cli: Command, command: ICommand) {
    cli.command(command.command)
        .description(command.description)
        .action(command.action);
}
