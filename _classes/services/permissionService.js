class PermissionService {
    constructor(playerRepository) {
        this.playerRepository = playerRepository;
    }

    set(userId, permission) {
        return this.playerRepository.set(userId, 'players', 'perm', permission);
    }
}

module.exports = PermissionService;
