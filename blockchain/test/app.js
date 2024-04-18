const {Web3} = require('web3')
const configuration = require('../build/contracts/BalanceContract.json');
const web3 = new Web3(new Web3.providers.HttpProvider("http://127.0.0.1:7545"));
const contract = new web3.eth.Contract(configuration.abi);

// const {ContractFactory, Wallet, providers} = require('ethers')
// const provider = new providers.JsonRpcProvider('http://127.0.0.1:7545');
// const wallet = new Wallet(privateKey, provider)


const bodyParser = require('body-parser');
const cors = require('cors');
const winston = require('winston');
// bytecode = fs.readFileSync('NotarizedDocument_sol_NotarizedDocument.bin').toString();

const BalanceContract = require('../build/contracts/BalanceContract.json');

// Create a logger instance
const logger = winston.createLogger({
    level: 'info', // Set the desired log level
    format: winston.format.json(), // Set the log format to JSON
    transports: [new winston.transports.File({filename: 'logs.log'}) // Specify the log file name and location
    ]
});

const Main = async () => {
//get list of Ethereum accounts
    try {
        accountArray = await web3.eth.getAccounts();
        console.log(accountArray);


        const deployedContract = await contract.deploy({
            data: BalanceContract.bytecode, arguments: [30]
        }).send({
            from: accountArray[5], gas: 1000000, gasPrice: web3.utils.toWei('20', 'gwei')
        });

        console.log(deployedContract.options.address);

        myContractInstance = new web3.eth.Contract(BalanceContract.abi, deployedContract.options.address);

        inContract_baseDemand = await myContractInstance.methods.baseDemand().call();
        console.log('baseDemand: ' + inContract_baseDemand);

        await myContractInstance.methods.recordDemandValue(27).send({
            from: accountArray[5],
            gas: 1000000,
            gasPrice: web3.utils.toWei('20', 'gwei')
        });

        inContract_demandValue = await myContractInstance.methods.demandValue().call();

        console.log('demandValue: ' + inContract_demandValue);

        inContract_satisfied = await myContractInstance.methods.satisfied().call();

        console.log('satisfied: ' + inContract_satisfied);


    } catch (err) {
        console.log(err);
    }

}

Main();
