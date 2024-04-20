const {Web3} = require('web3')
const configuration = require('../build/contracts/DifferentialContract.json');
const web3 = new Web3(new Web3.providers.HttpProvider("http://127.0.0.1:7545"));
const contract = new web3.eth.Contract(configuration.abi);

// const {ContractFactory, Wallet, providers} = require('ethers')
// const provider = new providers.JsonRpcProvider('http://127.0.0.1:7545');
// const wallet = new Wallet(privateKey, provider)


const bodyParser = require('body-parser');
const cors = require('cors');
const winston = require('winston');
// bytecode = fs.readFileSync('NotarizedDocument_sol_NotarizedDocument.bin').toString();

const DifferentialContract = require('../build/contracts/DifferentialContract.json');

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

        const owner = accountArray[0];
        const company = accountArray[1];


        const deployedContract = await contract.deploy({
            data: DifferentialContract.bytecode, arguments: [30]
        }).send({
            from: owner, gas: 2000000, gasPrice: web3.utils.toWei('20', 'gwei')
        });

        console.log(deployedContract.options.address);

        const contractAddress = deployedContract.options.address;
        // const contractAddress = "0xBA0D25ad388BA0fdf31E7288892C4931845bAD29";

        myContractInstance = new web3.eth.Contract(DifferentialContract.abi, contractAddress);

        inContract_baseDemand = await myContractInstance.methods.baseDemand().call();
        console.log('baseDemand: ' + inContract_baseDemand);

        await myContractInstance.methods.recordDemandValue(27).send({
            from: owner, gas: 2000000, gasPrice: web3.utils.toWei('20', 'gwei')
        });

        inContract_demandValue = await myContractInstance.methods.demandValue().call();

        console.log('demandValue: ' + inContract_demandValue);

        inContract_satisfied = await myContractInstance.methods.satisfied().call();

        console.log('satisfied: ' + inContract_satisfied);

        for (let i = 0; i < 10; i++) {
            let send = await web3.eth.sendTransaction({
                from: company,
                to: contractAddress,
                value: web3.utils.toWei(0.05, "ether"),
                gasPrice: web3.utils.toWei(20, 'gwei')
            });
            console.log('send: ' + send);
        }

        const inContract_balance = await myContractInstance.methods.balance().call();

        console.log('balance: ' + web3.utils.fromWei(inContract_balance, 'ether'));

        let result = await myContractInstance.methods.withdrawFromWalletBalance(owner).send({
            from: owner, gas: 5000000, gasPrice: web3.utils.toWei('20', 'gwei')
        });
        console.log('result: ' + result);

    } catch (err) {
        console.log(err);
    }

}

Main();
