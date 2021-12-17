const HDWalletProvider = require('@truffle/hdwallet-provider');
const hackathon_deployer = "0x1A62EB8A49831e18233DB0e81781236a1678364F";
const hackathon_priv = "1444d497cfd1e4a798fb53747b28514459cc7bef33911a3d0fa3163f1a67c279"
module.exports = {
  networks: {
    binance_test: {
      provider: () => new HDWalletProvider(hackathon_priv, `https://data-seed-prebsc-1-s1.binance.org:8545`),
      network_id: 97,
      from: hackathon_deployer,

    },
    matic_test: {
      provider: () => new HDWalletProvider(hackathon_priv, `https://matic-mumbai.chainstacklabs.com`),
      network_id: 80001,
      from: hackathon_deployer,

    },
    rinkeby: {
      provider: () => new HDWalletProvider(hackathon_priv, `https://rinkeby.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161`),
      network_id: 4,
      from: hackathon_deployer,

    },
    development: {
      host: "localhost",
      port: 7545, // default for Ganache
      network_id: "4447"
    }

  }
}
