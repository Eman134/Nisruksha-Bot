class ServerService {
    constructor(serverRepository) {
        this.serverRepository = serverRepository;
    }

    setServerInfo(serverId, field, value) {
        return this.serverRepository.set(serverId, 'servers', field, value, 'server_id');
    }
}

module.exports = ServerService;
