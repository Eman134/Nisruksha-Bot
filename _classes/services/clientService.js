class ClientService {
    setClient(client) {
        this.client = client;
        return client;
    }

    get current() {
        return this.client;
    }
}

module.exports = new ClientService();
