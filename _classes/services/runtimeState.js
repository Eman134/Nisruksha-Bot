class RuntimeState {
    constructor() {
        this.debug = false;
        this.logs = { cmds: true, falhas: true };
        this.lastsave = '';
        this.commandsExecuted = 0;
        this.playersSeen = new Set();
    }

    incrementCommands() {
        this.commandsExecuted += 1;
    }

    rememberPlayer(userId) {
        this.playersSeen.add(String(userId));
    }
}

module.exports = RuntimeState;
