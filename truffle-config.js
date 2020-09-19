module.exports = {
  networks: {
    development: {
      host: "127.0.0.1",
      port: 8546, // forked Geth node is listening port 8546. 8545 is location of forked node
      network_id: "*", // Match any network id
      // gas: 5000000
    }
  },
  compilers: {
    solc: {
      // version: "0.6.2",
      // settings: {
      //   optimizer: {
      //     enabled: true, // Default: false
      //     runs: 200      // Default: 200
      //   },
      // }
    }
  }
};
